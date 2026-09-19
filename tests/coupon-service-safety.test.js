const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

let mode = 'bad-metadata';
const request = async (_action, payload) => {
  if (mode === 'bad-metadata') return { ok: true, data: { rows: [], total: 0, page: payload.page + 1, pageSize: payload.pageSize } };
  if (mode === 'disabled') return { ok: false, error: { code: 'AUTH_ACCOUNT_DISABLED', message: '账号已停用' } };
  if (mode === 'duplicate') {
    if (payload.page === 1) return { ok: true, data: { rows: Array.from({ length: 100 }, (_, index) => ({ _id: `coupon-${index}` })), total: 101, page: 1, pageSize: 100 } };
    return { ok: true, data: { rows: [{ _id: 'coupon-0' }], total: 101, page: 2, pageSize: 100 } };
  }
  return { ok: true, data: { rows: Array.from({ length: 100 }, (_, index) => ({ _id: `coupon-${payload.page}-${index}` })), total: 5001, page: payload.page, pageSize: 100 } };
};

const originalLoad = Module._load;
Module._load = function load(requestName, parent, isMain) {
  if (requestName === './request' && parent && /services[\\/]coupons\.js$/.test(parent.filename)) return { request };
  return originalLoad.call(this, requestName, parent, isMain);
};

let coupons;
try {
  coupons = require(path.resolve(__dirname, '../miniapp/services/coupons.js'));
} finally {
  Module._load = originalLoad;
}

(async () => {
  const badMetadata = await coupons.listAll();
  assert.equal(badMetadata.ok, false, '页码不一致不能被当成完整列表');
  assert.equal(badMetadata.error.code, 'REMOTE_PAGE_INCONSISTENT');

  mode = 'disabled';
  const disabled = await coupons.listAll();
  assert.equal(disabled.ok, false);
  assert.equal(disabled.error.code, 'AUTH_ACCOUNT_DISABLED');

  mode = 'duplicate';
  const duplicate = await coupons.listAll();
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.error.code, 'REMOTE_PAGE_INCONSISTENT');

  mode = 'limit';
  const limited = await coupons.listAll();
  assert.equal(limited.ok, false);
  assert.equal(limited.error.code, 'REMOTE_PAGE_LIMIT_REACHED');
  console.log('coupon service safety test: passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
