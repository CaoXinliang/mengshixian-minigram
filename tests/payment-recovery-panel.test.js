const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const base = path.resolve(__dirname, '../miniapp/components/payment-recovery-panel');
const holder = {};
global.Component = definition => { holder.value = definition; };
try { require(path.join(base, 'index.js')); } finally { delete global.Component; }

const template = fs.readFileSync(path.join(base, 'index.wxml'), 'utf8');
const config = JSON.parse(fs.readFileSync(path.join(base, 'index.json'), 'utf8'));

assert.equal(config.component, true);
assert(holder.value.properties.kind && holder.value.properties.text && holder.value.properties.canRetry, '组件只能消费整理后的支付展示事实');
assert(template.includes('bindtap="handleQuery"') && template.includes('bindtap="handleRetry"') && template.includes('bindtap="handleViewOrder"'), '组件必须发出查询、重试和查看订单语义事件');
assert(!template.includes('wx.requestPayment') && !template.includes('orders.get'), '纯展示组件不得调用支付或订单服务');

const events = [];
const component = Object.assign({}, holder.value.methods, {
  data: { busy: false },
  triggerEvent(name) { events.push(name); }
});
component.handleQuery();
component.handleRetry();
component.handleViewOrder();
assert.deepEqual(events, ['query', 'retry', 'vieworder']);
component.data.busy = true;
component.handleQuery();
assert.deepEqual(events, ['query', 'retry', 'vieworder'], 'busy时不得重复发出动作');

console.log('payment recovery panel test: passed');
