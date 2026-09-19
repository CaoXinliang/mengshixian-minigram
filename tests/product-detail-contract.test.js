const assert = require('assert/strict');
const fs = require('fs');
const Module = require('module');
const path = require('path');

const root = path.resolve(__dirname, '../miniapp');
const wxml = fs.readFileSync(path.join(root, 'pages/index/index.wxml'), 'utf8');
const js = fs.readFileSync(path.join(root, 'pages/index/index.js'), 'utf8');
const wxss = fs.readFileSync(path.join(root, 'pages/index/index.wxss'), 'utf8');

assert(!wxml.includes('detailVideoSrc') && !wxml.includes('detailVideoError') && !wxml.includes('商品视频'), 'ordinary product detail must not render product-video state or copy while the separate recipe detail may use video');
assert(!js.includes("item.mediaType === 'video'") && !js.includes('handleDetailVideoError'), 'ordinary product detail must not parse product videos');
assert(wxml.includes("detailFavorited ? '取消收藏' : '收藏此商品'") && wxml.includes("detailFavorited ? 'is-active' : ''"), 'favorite control must expose add and remove state');
assert(wxml.includes('disabled="{{detailFavoriteBusy || detailFavoriteLoading}}"') && js.includes('this.data.detailFavoriteBusy ||'), 'favorite reads and writes must reject duplicate taps');
assert(wxml.includes('bindtap="retryDetailFavorite"') && js.includes('favoritesApi.listAll'), 'favorite state failures must expose retry and read every saved page');
assert(wxml.includes("detailStatus == 'ready' || detailFavorited || detailFavoriteId"), 'a known favorite must remain removable when product detail becomes unavailable');
assert(wxss.includes('constant(safe-area-inset-bottom)') && wxss.includes('.detail-actions{position:fixed'), 'the fixed purchase bar must remain reachable above the safe area');

let definition;
let upsertResult = { ok: true, data: { item: { _id: 'favorite-1', skuId: 'sku-1' } } };
let removeResult = { ok: true, data: { removed: true } };
let listResult = async () => ({ ok: true, data: { rows: [] } });
const calls = [];
const emptyApi = new Proxy({}, { get: () => async () => ({ ok: true, data: { rows: [] } }) });
const services = {
  config: { provider: 'cloudbase', priceFieldsNeverFallback: true }, auth: emptyApi, catalog: emptyApi, content: emptyApi,
  address: emptyApi, cart: emptyApi, delivery: emptyApi, checkout: emptyApi, orders: emptyApi, refunds: emptyApi, groups: emptyApi,
  reviews: emptyApi,
  favorites: {
    list: (...args) => listResult(...args),
    upsert: async payload => { calls.push(['upsert', payload]); return upsertResult; },
    remove: async payload => { calls.push(['remove', payload]); return removeResult; }
  }
};
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === '../../services' || request === '../../services/index') return services;
  return originalLoad.call(this, request, parent, isMain);
};
global.Page = value => { definition = value; };
global.wx = { showToast() {} };
try { require(path.join(root, 'pages/index/index.js')); } finally { Module._load = originalLoad; delete global.Page; }

function page() {
  return Object.assign({}, definition, {
    data: { ...definition.data, page: 'detail', loggedIn: true, detailStatus: 'ready', detailFavoriteBusy: false, detailFavoriteLoading: false, detailFavorited: false, detailFavoriteId: '', selectedSpec: '500克', selectedProduct: { id: 'product-1', selectedSkuId: 'sku-1', status: 'on_sale' } },
    requireLogin() { return false; },
    setData(patch, callback) { Object.assign(this.data, patch); if (callback) callback.call(this); }
  });
}

(async () => {
  let releaseList;
  listResult = () => new Promise(resolve => { releaseList = resolve; });
  const loading = page();
  const firstLoad = loading.loadDetailFavorite();
  const firstToken = loading._detailFavoriteSeq;
  assert.equal(await loading.loadDetailFavorite(), false, 'a duplicate state read must share the active loading state instead of invalidating it');
  assert.equal(loading._detailFavoriteSeq, firstToken, 'a duplicate state read must not advance the request generation');
  releaseList({ ok: true, data: { rows: [{ _id: 'favorite-existing', skuId: 'sku-1' }] } });
  await firstLoad;
  assert.equal(loading.data.detailFavoriteLoading, false);
  assert.equal(loading.data.detailFavorited, true);
  listResult = async () => ({ ok: true, data: { rows: [] } });

  const current = page();
  await current.favoriteProduct();
  assert.deepEqual(calls.at(-1), ['upsert', { productId: 'product-1', skuId: 'sku-1' }]);
  assert.equal(current.data.detailFavorited, true);
  assert.equal(current.data.detailFavoriteId, 'favorite-1');

  current.data.selectedProduct.status = 'off_shelf';
  await current.favoriteProduct();
  assert.deepEqual(calls.at(-1), ['remove', { id: 'favorite-1' }], 'an off-shelf product must still allow removing an existing favorite');
  assert.equal(current.data.detailFavorited, false);

  current.data.detailFavorited = true;
  current.data.detailFavoriteId = 'favorite-2';
  removeResult = { ok: false, error: { message: '取消失败' } };
  await current.favoriteProduct();
  assert.equal(current.data.detailFavorited, true, 'a failed remove must retain the confirmed favorite state for retry');

  current.data.detailFavoriteBusy = true;
  const before = calls.length;
  await current.favoriteProduct();
  assert.equal(calls.length, before, 'a second tap during a write must be ignored');
  console.log('product detail contract test: passed');
})().catch(error => { console.error(error); process.exit(1); });
