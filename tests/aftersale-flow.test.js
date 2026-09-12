const assert = require('assert/strict');
const fs = require('fs');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const definitions = [];
const uploads = [];
const requests = [];
const redirects = [];
const order = { _id: 'order-1', orderNo: 'M001', status: 'delivered', paymentStatus: 'paid' };
const aftersales = {
  MAX_EVIDENCE_FILES: 6,
  prepareEvidenceUploads: files => files.slice(0, 6).map((file, index) => ({ id: `file-${index}`, path: file.tempFilePath, size: file.size || 0, type: 'image', status: 'pending', mediaId: '' })),
  uploadEvidence: async item => { uploads.push(item.id); return { ok: true, data: { mediaId: `media-${item.id}` } }; },
  request: async payload => { requests.push(payload); return { ok: true, data: { refund: { _id: 'refund-1', orderId: 'order-1', status: 'requested' } } }; },
  get: async () => ({ ok: true, data: { refund: { _id: 'refund-1', refundNo: 'R001', orderId: 'order-1', status: 'awaiting_manual_refund', channelStatus: 'awaiting_manual_refund', manualRefundRequired: true, amountCent: 1600, reasonCode: 'damaged', description: '包装破损', mediaIds: ['media-file-0'], items: [{ orderItemId: 'item-1', productNameSnapshot: '鱼丸', quantity: 1 }], createdAt: '2026-09-12T08:00:00.000Z' } } }),
  list: async () => ({ ok: true, data: { rows: [] } })
};
const services = { orders: { get: async () => ({ ok: true, data: { order, items: [{ _id: 'item-1', skuId: 'sku-1', productNameSnapshot: '鱼丸', quantity: 2 }] } }) }, aftersales };
Module._load = function (request, parent, isMain) {
  if (request === '../../../services/index' || request === '../../../services') return services;
  return originalLoad.call(this, request, parent, isMain);
};
global.Page = definition => definitions.push(definition);
global.wx = { showToast: () => {}, navigateBack: () => {}, redirectTo: payload => redirects.push(payload), chooseMedia: payload => payload.success({ tempFiles: [{ tempFilePath: '/tmp/a.jpg', size: 100 }] }) };
try {
  require(path.resolve(__dirname, '../miniapp/package-trade/pages/aftersale-apply/index.js'));
  require(path.resolve(__dirname, '../miniapp/package-trade/pages/aftersale-detail/index.js'));
} finally { Module._load = originalLoad; delete global.Page; }

function makePage(definition) { return Object.assign({}, definition, { data: JSON.parse(JSON.stringify(definition.data)), setData(patch) { Object.assign(this.data, patch); } }); }

async function run() {
  const apply = makePage(definitions[0]);
  await apply.onLoad({ orderId: 'order-1' });
  assert.equal(apply.data.status, 'ready');
  await apply.submit();
  assert.equal(apply.data.submitError, '请至少选择一个售后商品');
  apply.toggleItem({ currentTarget: { dataset: { id: 'item-1' } } });
  apply.changeQuantity({ currentTarget: { dataset: { id: 'item-1', delta: 5 } } });
  assert.equal(apply.data.items[0].requestQuantity, 2, 'requested quantity must not exceed the ordered quantity');
  apply.selectReason({ currentTarget: { dataset: { code: 'damaged' } } });
  apply.inputDescription({ detail: { value: '包装破损' } });
  apply.chooseEvidence();
  assert.equal(apply.data.evidence.length, 1);
  await apply.submit();
  assert.deepEqual(uploads, ['file-0']);
  assert.deepEqual(requests[0].items, [{ orderItemId: 'item-1', skuId: 'sku-1', quantity: 2 }]);
  assert.deepEqual(requests[0].mediaIds, ['media-file-0']);
  assert.equal(requests[0].reasonCode, 'damaged');
  assert(redirects[0].url.includes('id=refund-1'));
  assert.equal(apply.data.submitLocked, false);

  const detail = makePage(definitions[1]);
  await detail.onLoad({ id: 'refund-1', orderId: 'order-1' });
  assert.equal(detail.data.status, 'ready');
  assert.equal(detail.data.detail.statusText, '等待退款处理');
  assert.equal(detail.data.detail.manualRefundRequired, true);
  assert.equal(detail.data.detail.timeline[2].state, 'current');

  const serviceSource = fs.readFileSync(path.resolve(__dirname, '../miniapp/services/aftersales.js'), 'utf8');
  assert(serviceSource.includes("apiRequest('refunds.media.upload'"));
  assert(serviceSource.includes("apiRequest('refunds.get'"));
  console.log('aftersale flow test: passed');
}
run().catch(error => { console.error(error); process.exit(1); });
