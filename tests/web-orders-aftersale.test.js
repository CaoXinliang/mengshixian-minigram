const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../web-preview/app.js'), 'utf8');
const apiSource = fs.readFileSync(path.join(__dirname, '../web-preview/services/api.js'), 'utf8');

for (const contract of [
  "request('orders.list', payload)",
  "request('orders.get', { id })",
  "request('refunds.list', payload)",
  "request('refunds.get', { id })",
  "request('refunds.media.upload', payload)",
  "request('refunds.request', payload)"
]) assert(apiSource.includes(contract), `web API adapter missing ${contract}`);

assert.match(source, /if \(!state\.user\.loggedIn\) \{ state\.remoteOrders = \[\]; state\.remoteOrdersStatus = 'idle'; return; \}/, 'logged-out order list must not call the API');
assert.match(source, /async function fetchRemoteOrderDetail\(orderId\) \{\s+if \(!state\.user\.loggedIn\) return false;/, 'logged-out order detail must not call the API');
assert.match(source, /fetchRemotePages\(params => window\.MengshixianApi\.orders\.list\(params\)/, 'order list must fetch all remote pages');
assert.match(source, /fetchRemotePages\(params => window\.MengshixianApi\.refunds\.list\(params\)/, 'aftersale list must fetch all remote pages');
assert.match(source, /response\.data\.order, items: response\.data\.items/, 'order detail must consume the server order and item snapshots');
assert.match(source, /pickupSiteSnapshot/, 'order detail must render pickup snapshots');
assert.match(source, /addressSnapshot/, 'order detail must render delivery address snapshots');
assert.match(source, /pricingSnapshot/, 'order detail must render price snapshots');
assert.match(source, /orderTimelineMarkup/, 'order detail must render a status timeline');
assert.match(source, /data-aftersale-item-index/, 'each order item must lead to a preselected aftersale item');

for (const field of ['orderItemId', 'skuId', 'quantity', 'reasonCode', 'description', 'mediaIds', 'idempotencyKey']) {
  assert(source.includes(field), `structured aftersale request must contain ${field}`);
}
assert.match(source, /quantity <= item\.orderedQuantity/, 'aftersale quantity cannot exceed the ordered quantity');
assert.match(source, /state\.aftersaleSubmitting\) return/, 'duplicate aftersale submissions must be locked');
assert.match(source, /MengshixianApi\.refunds\.uploadMedia/, 'selected evidence must be uploaded before the aftersale request');
assert.match(source, /clear-aftersale-files/, 'upload preparation must let the customer clear local files');
assert.match(source, /refunds\.get\(refundId\)/, 'customer aftersale detail must use refunds.get');
assert.match(source, /refund\.status === 'succeeded' && refund\.channelStatus !== 'succeeded'/, 'client must not show refunded before the verified channel result');
assert.match(source, /creditAdjustmentCent/, 'client must display credit-account adjustment split');
assert.match(source, /cashRefundRequiredCent/, 'client must display remaining channel refund split');
assert.match(source, /售后退款不代表退货商品已经入库/, 'client must not imply automatic inventory return');
assert.match(source, /item\.paidSubtotalCent === undefined \? item\.subtotalCent : item\.paidSubtotalCent/, 'order and aftersale must prefer allocated paid subtotal');

console.log('web orders and aftersale contract: passed');
