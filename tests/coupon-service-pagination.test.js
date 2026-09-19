const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const calls = [];
const firstPage = Array.from({ length: 100 }, (_, index) => ({ _id: `coupon-${index}`, templateId: `template-${index}`, status: 'available' }));
const templateFirstPage = Array.from({ length: 100 }, (_, index) => ({ _id: `template-${index}`, name: `优惠券${index}` }));
const request = async (action, payload) => {
  calls.push([action, payload]);
  if (action === 'coupons.list') {
    if (payload.page === 1) return { ok: true, data: { rows: firstPage, total: 101, page: 1, pageSize: 100 } };
    return { ok: true, data: { rows: [{ _id: 'coupon-target', templateId: 'template-target', status: 'expired' }], total: 101, page: 2, pageSize: 100 } };
  }
  if (action === 'coupons.templates') {
    if (payload.page === 1) return { ok: true, data: { rows: templateFirstPage, total: 101, page: 1, pageSize: 100 } };
    return { ok: true, data: { rows: [{ _id: 'template-target', name: '目标优惠券' }], total: 101, page: 2, pageSize: 100 } };
  }
  if (action === 'coupons.claim.resolve') return { ok: true, data: { found: false } };
  return { ok: false, error: { code: 'UNEXPECTED_ACTION' } };
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
  const result = await coupons.listAll();
  assert.equal(result.ok, true);
  assert.equal(result.data.rows.length, 101);
  assert.equal(result.data.rows.at(-1)._id, 'coupon-target', '第一百条之后的本人券必须仍能读取');
  assert.deepEqual(calls, [
    ['coupons.list', { page: 1, pageSize: 100 }],
    ['coupons.list', { page: 2, pageSize: 100 }]
  ]);

  calls.length = 0;
  const templates = await coupons.templatesAll();
  assert.equal(templates.ok, true);
  assert.equal(templates.data.rows.length, 101);
  assert.equal(templates.data.rows.at(-1)._id, 'template-target', '第一百条之后的可领券模板必须仍能读取');
  assert.deepEqual(calls, [
    ['coupons.templates', { page: 1, pageSize: 100 }],
    ['coupons.templates', { page: 2, pageSize: 100 }]
  ]);

  calls.length = 0;
  const resolved = await coupons.resolveClaim({ idempotencyKey: 'stable-key' });
  assert.equal(resolved.ok, true);
  assert.deepEqual(calls, [['coupons.claim.resolve', { idempotencyKey: 'stable-key' }]]);
  console.log('coupon service pagination test: passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
