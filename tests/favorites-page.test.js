const assert = require('assert/strict');
const Module = require('module');
const path = require('path');
const { createFavoritesLifecycle } = require('../miniapp/modules/favorites-lifecycle');

const favoriteRow = (id, patch = {}) => ({
  _id: id,
  skuId: `sku-${id}`,
  productId: `product-${id}`,
  productNameSnapshot: `商品${id}`,
  specSnapshot: '500克装',
  packageUnitSnapshot: '袋',
  mediaSnapshot: `media-${id}`,
  purchasable: true,
  unavailableReason: '',
  createdAt: '2040-01-01T00:00:00.000Z',
  updatedAt: '2040-01-01T00:00:00.000Z',
  ...patch
});
const okRows = rows => ({ ok: true, data: { rows } });
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};

async function lifecycleLoadAndRevision() {
  const first = deferred();
  const second = deferred();
  const calls = [];
  const states = [];
  const lifecycle = createFavoritesLifecycle({
    favorites: { listAll: () => (calls.push('list'), calls.length === 1 ? first.promise : second.promise) },
    resolveMedia: async ids => Object.fromEntries(ids.map(id => [id, `https://example.test/${id}.jpg`])),
    onChange: state => states.push(state)
  });

  const oldLoad = lifecycle.load({ userId: 'user-a' });
  const currentLoad = lifecycle.load({ userId: 'user-b' });
  second.resolve(okRows([favoriteRow('current')]));
  await currentLoad;
  first.resolve(okRows([favoriteRow('stale')]));
  await oldLoad;

  const latest = states.at(-1);
  assert.equal(latest.status, 'ready');
  assert.equal(latest.rows.length, 1);
  assert.equal(latest.rows[0].id, 'current', 'an older account response must not replace the current account');
  assert.equal(latest.rows[0].image, 'https://example.test/media-current.jpg');

  lifecycle.dispose();
  const countBeforeDisposedLoad = states.length;
  await lifecycle.load({ userId: 'user-c' });
  assert.equal(states.length, countBeforeDisposedLoad, 'disposed lifecycle must not publish state');
}

async function lifecycleRemoveRecovery() {
  const kept = favoriteRow('kept', { purchasable: false, unavailableReason: 'sku_off_sale' });
  let listCall = 0;
  const explicitStates = [];
  const explicit = createFavoritesLifecycle({
    favorites: {
      listAll: async () => (listCall += 1, okRows([kept])),
      remove: async () => ({ ok: false, error: { code: 'VALIDATION_ERROR', message: '取消收藏失败' } })
    },
    onChange: state => explicitStates.push(state)
  });
  await explicit.load({ userId: 'user-a' });
  await explicit.remove('kept');
  assert.equal(listCall, 2, 'an explicit remove failure must still reconcile the complete authoritative list');
  assert.equal(explicitStates.at(-1).rows.length, 1, 'a failed remove must keep the favorite');
  assert.equal(explicitStates.at(-1).rows[0].removeState, 'error');
  assert.equal(explicitStates.at(-1).rows[0].removeText, '取消收藏失败');
  assert.equal(explicitStates.at(-1).rows[0].canRemove, true, 'an off-sale favorite must remain removable after failure');

  let unknownListCall = 0;
  const confirmedStates = [];
  const confirmed = createFavoritesLifecycle({
    favorites: {
      listAll: async () => (unknownListCall += 1, okRows(unknownListCall === 1 ? [favoriteRow('gone')] : [])),
      remove: async () => { throw new Error('connection reset'); }
    },
    onChange: state => confirmedStates.push(state)
  });
  await confirmed.load({ userId: 'user-b' });
  await confirmed.remove('gone');
  assert.equal(confirmedStates.at(-1).status, 'empty', 'an item absent after reconciliation confirms an unknown remove result');

  let unresolvedListCall = 0;
  const unresolvedStates = [];
  const unresolved = createFavoritesLifecycle({
    favorites: {
      listAll: async () => {
        unresolvedListCall += 1;
        return unresolvedListCall === 1 ? okRows([favoriteRow('unknown')]) : { ok: false, error: { code: 'NETWORK', message: '网络异常' } };
      },
      remove: async () => { throw new Error('connection reset'); }
    },
    onChange: state => unresolvedStates.push(state)
  });
  await unresolved.load({ userId: 'user-c' });
  await unresolved.remove('unknown');
  const unresolvedState = unresolvedStates.at(-1);
  assert.equal(unresolvedState.rows.length, 1, 'a remove with an uncheckable result must keep the favorite');
  assert.equal(unresolvedState.rows[0].removeState, 'unknown');
  assert.equal(unresolvedState.rows[0].removeText, '取消结果待核对，请重新加载');
  assert.equal(unresolvedState.rows[0].canRemove, true);

  let duplicateListCall = 0;
  const duplicateStates = [];
  const duplicate = createFavoritesLifecycle({
    favorites: {
      listAll: async () => {
        duplicateListCall += 1;
        return duplicateListCall === 1
          ? okRows([favoriteRow('target')])
          : okRows([favoriteRow('other'), favoriteRow('other')]);
      },
      remove: async () => { throw new Error('connection reset'); }
    },
    onChange: state => duplicateStates.push(state)
  });
  await duplicate.load({ userId: 'user-d' });
  await duplicate.remove('target');
  const duplicateState = duplicateStates.at(-1);
  assert.equal(duplicateState.rows.length, 1, '重复分页不能被用于确认目标收藏已删除');
  assert.equal(duplicateState.rows[0].id, 'target');
  assert.equal(duplicateState.rows[0].removeState, 'unknown');
}

async function pagePublicBehavior() {
  const originalLoad = Module._load;
  let definition = null;
  let currentUser = { _id: 'page-user', status: 'active', userType: 'c' };
  let authCalls = 0;
  let listCalls = 0;
  let removeCalls = 0;
  const navigations = [];
  const services = {
    auth: { getMe: async () => (authCalls += 1, currentUser ? { ok: true, data: { user: currentUser } } : { ok: false, error: { code: 'UNAUTHENTICATED' } }) },
    favorites: {
      listAll: async () => (listCalls += 1, okRows([favoriteRow('page', { mediaSnapshot: 'media-page' })])),
      remove: async ({ id }) => (removeCalls += 1, { ok: true, data: { id, removed: true } })
    },
    content: { resolveMediaFiles: async ids => Object.fromEntries(ids.map(id => [id, `https://example.test/${id}.jpg`])) }
  };
  Module._load = function load(requestName, parent, isMain) {
    if (requestName === '../../../services/index') return services;
    return originalLoad.call(this, requestName, parent, isMain);
  };
  global.Page = page => { definition = page; };
  global.wx = {
    navigateBack() {},
    redirectTo(input) { navigations.push(input.url); },
    showToast() {},
  };
  const pagePath = path.resolve(__dirname, '../miniapp/package-member/pages/favorites/index.js');
  delete require.cache[pagePath];
  try { require(pagePath); } finally { Module._load = originalLoad; delete global.Page; }
  assert(definition, 'favorites page must register itself');
  const page = Object.assign({}, definition, {
    data: JSON.parse(JSON.stringify(definition.data)),
    setData(patch) { Object.assign(this.data, patch); }
  });

  await page.onLoad();
  assert.equal(authCalls, 0, 'onLoad must not duplicate onShow authentication');
  await page.onShow();
  assert.equal(page.data.status, 'ready');
  assert.equal(page.data.rows[0].image, 'https://example.test/media-page.jpg');
  assert.equal(listCalls, 1);
  page.openProduct({ currentTarget: { dataset: { id: 'page' } } });
  assert.deepEqual(navigations, ['/pages/index/index?productId=product-page']);

  await page.remove({ currentTarget: { dataset: { id: 'page' } } });
  assert.equal(removeCalls, 1);
  assert.equal(page.data.status, 'empty');
  assert.equal(page.data.rows.length, 0);

  currentUser = null;
  await page.onShow();
  assert.equal(page.data.status, 'forbidden');
  assert.equal(page.data.rows.length, 0, 'revoked users must not retain old favorites');
  assert.equal(listCalls, 1, 'revoked users must not call the private favorites service');
  page.onUnload();
  delete global.wx;
}

lifecycleLoadAndRevision().then(lifecycleRemoveRecovery).then(pagePublicBehavior).then(() => {
  console.log('favorites page and lifecycle test: passed');
}).catch(error => {
  console.error(error);
  process.exit(1);
});
