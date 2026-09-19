const assert = require('assert/strict');
const fs = require('fs');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const definitions = [];
const uploads = [];
const requests = [];
const redirects = [];
let requestMode = 'success';
const storage = new Map();
const order = { _id: 'order-1', orderNo: 'M001', status: 'delivered', paymentStatus: 'paid' };
const aftersales = {
  MAX_EVIDENCE_FILES: 6,
  prepareEvidenceUploads: files => files.slice(0, 6).map((file, index) => ({ id: `file-${index}`, path: file.tempFilePath, size: file.size || 0, type: 'image', status: 'pending', mediaId: '' })),
  uploadEvidence: async item => { uploads.push(item.id); return { ok: true, data: { mediaId: `media-${item.id}` } }; },
  request: async payload => { requests.push(payload); return requestMode === 'transport' ? { ok: false, error: { code: 'REQUEST_TIMEOUT', message: '超时' } } : { ok: true, data: { refund: { _id: 'refund-1', orderId: 'order-1', status: 'requested' } } }; },
  get: async () => ({ ok: true, data: { refund: { _id: 'refund-1', refundNo: 'R001', orderId: 'order-1', status: 'awaiting_manual_refund', channelStatus: 'awaiting_manual_refund', manualRefundRequired: true, amountCent: 1600, reasonCode: 'damaged', description: '包装破损', mediaIds: ['media-file-0'], items: [{ orderItemId: 'item-1', productNameSnapshot: '鱼丸', quantity: 1 }], createdAt: '2026-09-12T08:00:00.000Z' } } }),
  list: async () => ({ ok: true, data: { rows: [] } })
};
const services = { orders: { get: async () => ({ ok: true, data: { order, items: [{ _id: 'item-1', skuId: 'sku-1', productNameSnapshot: '鱼丸', quantity: 2 }] } }) }, aftersales };
Module._load = function (request, parent, isMain) {
  if (request === '../../../services/index' || request === '../../../services') return services;
  return originalLoad.call(this, request, parent, isMain);
};
global.Page = definition => definitions.push(definition);
global.wx = {
  showToast: () => {}, navigateBack: () => {}, redirectTo: payload => redirects.push(payload),
  chooseMedia: payload => payload.success({ tempFiles: [{ tempFilePath: '/tmp/a.jpg', size: 100 }] }),
  getStorageSync: key => storage.has(key) ? JSON.parse(JSON.stringify(storage.get(key))) : null,
  setStorageSync: (key, value) => storage.set(key, JSON.parse(JSON.stringify(value))),
  removeStorageSync: key => storage.delete(key)
};
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
  assert.equal(apply.data.selectedItemCount, 1, 'selection count is presentation data derived from the selected items');
  apply.toggleItem({ currentTarget: { dataset: { id: 'item-1' } } });
  assert.equal(apply.data.selectedItemCount, 0, 'clearing selection must immediately disable an empty application');
  apply.changeQuantity({ currentTarget: { dataset: { id: 'item-1', delta: 5 } } });
  assert.equal(apply.data.selectedItemCount, 1, 'quantity selection must refresh the presentation count too');
  assert.equal(apply.data.items[0].requestQuantity, 2, 'requested quantity must not exceed the ordered quantity');
  apply.changeQuantity({ currentTarget: { dataset: { id: 'item-1' } }, detail: { source: 'input', valid: true, quantity: 1 } });
  assert.equal(apply.data.items[0].requestQuantity, 1, '售后数量必须支持订单上限内的数字直输');
  apply.changeQuantity({ currentTarget: { dataset: { id: 'item-1' } }, detail: { source: 'input', valid: false, message: '数量不能超过 2' } });
  assert.equal(apply.data.items[0].requestQuantity, 1, '非法直输不能改变售后数量');
  assert.equal(apply.data.submitError, '数量不能超过 2');
  apply.changeQuantity({ currentTarget: { dataset: { id: 'item-1' } }, detail: { source: 'input', valid: true, quantity: 2 } });
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

  const retryPage = makePage(definitions[0]);
  await retryPage.onLoad({ orderId: 'order-1' });
  retryPage.toggleItem({ currentTarget: { dataset: { id: 'item-1' } } });
  retryPage.changeQuantity({ currentTarget: { dataset: { id: 'item-1' } }, detail: { source: 'input', valid: true, quantity: 2 } });
  retryPage.selectReason({ currentTarget: { dataset: { code: 'damaged' } } });
  retryPage.inputDescription({ detail: { value: '原始说明' } });
  requestMode = 'transport';
  await retryPage.submit();
  assert.equal(retryPage.data.draftFrozen, true, 'unknown submission freezes the visible business intent');
  retryPage.changeQuantity({ currentTarget: { dataset: { id: 'item-1' } }, detail: { source: 'input', valid: true, quantity: 1 } });
  retryPage.inputDescription({ detail: { value: '不应替换原始说明' } });
  assert.equal(retryPage.data.items[0].requestQuantity, 2);
  assert.equal(retryPage.data.description, '原始说明');
  assert.equal(storage.size, 1, 'unknown attempt is persisted before the page can be destroyed');
  const resumedPage = makePage(definitions[0]);
  await resumedPage.onLoad({ orderId: 'order-1' });
  assert.equal(resumedPage.data.draftFrozen, true, 'a new page restores and freezes the unresolved attempt');
  assert.equal(resumedPage.data.description, '原始说明');
  await resumedPage.querySubmissionResult();
  assert.equal(resumedPage.data.submissionRecoveryPending, false, 'confirmed absence permits retrying the original attempt');
  requestMode = 'success';
  await resumedPage.submit();
  assert.deepEqual(requests[1].items, requests[2].items, 'same-key retry must preserve the original item intent');
  assert.equal(requests[2].description, '原始说明');
  assert.equal(storage.size, 0, 'a confirmed created attempt clears the persisted recovery context');

  const detail = makePage(definitions[1]);
  await detail.onLoad({ id: 'refund-1', orderId: 'order-1' });
  assert.equal(detail.data.status, 'ready');
  assert.equal(detail.data.detail.statusText, '等待退款处理');
  assert.equal(detail.data.detail.manualRefundRequired, true);
  assert.equal(detail.data.detail.timeline[2].state, 'current');

  const applyTemplate = fs.readFileSync(path.resolve(__dirname, '../miniapp/package-trade/pages/aftersale-apply/index.wxml'), 'utf8');
  const submitDisabled = applyTemplate.match(/<button disabled="\{\{([^}]+)\}\}" bindtap="submit"/);
  assert(submitDisabled, 'submit must expose its actual disabled state');
  const isDisabled = new Function('submitLocked', 'submissionRecoveryPending', 'selectedItemCount', 'reasonCode', 'descriptionReady', `return (${submitDisabled[1]});`);
  assert.equal(isDisabled(false, false, 0, 'damaged', true), true, 'empty item selection cannot look submittable');
  assert.equal(isDisabled(false, false, 1, '', true), true, 'a missing reason cannot look submittable');
  assert.equal(isDisabled(false, false, 1, 'other', false), true, 'the other reason needs a nonblank description');
  assert.equal(isDisabled(false, false, 1, 'damaged', false), false, 'description remains optional for a specific reason');
  assert.equal(isDisabled(false, false, 1, 'other', true), false);
  assert.equal(isDisabled(true, false, 1, 'damaged', true), true, 'an in-flight application cannot be submitted twice');
  assert.equal(isDisabled(false, true, 1, 'damaged', true), true, 'an unresolved submission must be reconciled before retry');
  apply.inputDescription({ detail: { value: '   ' } });
  assert.equal(apply.data.descriptionReady, false, 'spaces do not make the required description ready');
  apply.inputDescription({ detail: { value: '包装破损' } });
  assert.equal(apply.data.descriptionReady, true);
  const subtitleExpression = applyTemplate.match(/<responsive-topbar\b[^>]*subtitle="\{\{([^}]+)\}\}"/);
  assert(subtitleExpression, 'aftersale subtitle must be conditional rather than leaving an empty order label');
  const renderSubtitle = new Function('orderNo', `return (${subtitleExpression[1]});`);
  assert.equal(renderSubtitle(''), '', 'no order number means no subtitle');
  assert.equal(renderSubtitle(undefined), '', 'the loading or invalid-entry state must not show an orphan order label');
  assert.equal(renderSubtitle('M001'), '订单 M001', 'a known order number remains visible');
  assert(/wx:if="\{\{item\.status == 'failed'\}\}"[^>]*bindtap="retryEvidence"/.test(applyTemplate), 'failed evidence must expose retry independently');
  assert(/wx:if="\{\{item\.status != 'uploading'\}\}"[^>]*disabled="\{\{submitLocked \|\| draftFrozen\}\}"[^>]*bindtap="removeEvidence"/.test(applyTemplate), 'every non-uploading evidence item must stay locked during submit and same-key recovery');
  assert(/wx:if="\{\{evidence\.length < 6\}\}"[^>]*disabled="\{\{submitLocked \|\| draftFrozen\}\}"[^>]*bindtap="chooseEvidence"/.test(applyTemplate), 'adding evidence must stay locked during submit and same-key recovery');
  assert(applyTemplate.includes('<quantity-stepper compact disabled="{{submitLocked || draftFrozen}}"'), 'quantity editing must be visibly locked during submit and same-key recovery');
  assert(applyTemplate.includes('<textarea disabled="{{submitLocked || draftFrozen}}"'), 'description editing must be visibly locked during submit and same-key recovery');
  assert(applyTemplate.includes('aria-disabled="{{submitLocked || draftFrozen}}"'), 'semantic selection controls must expose their locked state');
  assert(applyTemplate.includes("draftFrozen ? '重新提交原申请'"), 'same-key retry must explicitly preserve the original business intent');

  const evidenceStyles = fs.readFileSync(path.resolve(__dirname, '../miniapp/package-trade/pages/aftersale-apply/index.wxss'), 'utf8');
  const evidenceCard = evidenceStyles.match(/\.evidence>view\s*\{([^}]+)\}/);
  assert(evidenceCard && /display:flex/.test(evidenceCard[1]) && /height:auto/.test(evidenceCard[1]) && /flex-direction:column/.test(evidenceCard[1]), 'evidence cards must grow with separate status and action rows');
  const evidenceControls = evidenceStyles.match(/\.evidence-status\s*,\s*\.evidence-action\s*\{([^}]+)\}/);
  assert(evidenceControls && /position:static/.test(evidenceControls[1]) && !/position:(absolute|fixed)/.test(evidenceControls[1]), 'retry, remove and status must remain in normal flow, never overlap');
  assert(/min-height:44px/.test(evidenceControls[1]) && /flex:none/.test(evidenceControls[1]), 'each evidence action must keep its own nonshrinking 44px target');

  const serviceSource = fs.readFileSync(path.resolve(__dirname, '../miniapp/services/aftersales.js'), 'utf8');
  assert(serviceSource.includes("apiRequest('refunds.media.upload'"));
  assert(serviceSource.includes("apiRequest('refunds.get'"));
  console.log('aftersale flow test: passed');
}
run().catch(error => { console.error(error); process.exit(1); });
