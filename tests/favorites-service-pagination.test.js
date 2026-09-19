const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const calls = [];
const rows = Array.from({ length: 100 }, (_, index) => ({ _id: `favorite-${index}`, skuId: `sku-${index}` }));
let mode = 'pages';
const request = async (action, payload) => {
  calls.push([action, payload]);
  if (mode === 'disabled') return { ok: false, data: null, error: { code: 'AUTH_ACCOUNT_DISABLED', message: '账号已停用' } };
  if (mode === 'duplicate') {
    if (payload.page === 1) return { ok: true, data: { rows, total: 101, page: 1, pageSize: 100 } };
    return { ok: true, data: { rows: [rows[0]], total: 101, page: 2, pageSize: 100 } };
  }
  if (payload.page === 1) return { ok: true, data: { rows } };
  if (payload.page === 2) return { ok: true, data: { rows: [{ _id: 'favorite-target', skuId: 'sku-target' }] } };
  return { ok: true, data: { rows: [] } };
};

const originalLoad = Module._load;
Module._load = function load(requestName, parent, isMain) {
  if (requestName === './request' && parent && /services[\\/]favorites\.js$/.test(parent.filename)) return { request };
  return originalLoad.call(this, requestName, parent, isMain);
};

let favorites;
try {
  favorites = require(path.resolve(__dirname, '../miniapp/services/favorites.js'));
} finally {
  Module._load = originalLoad;
}

(async () => {
  const result = await favorites.listAll();
  assert.equal(result.ok, true);
  assert.equal(result.data.rows.length, 101);
  assert.equal(result.data.rows.at(-1).skuId, 'sku-target', 'a favorite beyond the first 100 records must remain discoverable');
  assert.deepEqual(calls, [
    ['favorites.list', { page: 1, pageSize: 100 }],
    ['favorites.list', { page: 2, pageSize: 100 }]
  ]);

  mode = 'disabled';
  const disabled = await favorites.listAll();
  assert.equal(disabled.ok, false);
  assert.equal(disabled.error.code, 'AUTH_ACCOUNT_DISABLED', '完整分页不得吞掉账号停用错误码');

  mode = 'duplicate';
  const duplicate = await favorites.listAll();
  assert.equal(duplicate.ok, false, '翻页重复收藏ID必须显式失败，不能冒充完整列表');
  assert.equal(duplicate.error.code, 'REMOTE_PAGE_INCONSISTENT');
  console.log('favorites service pagination test: passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
