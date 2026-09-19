const assert = require('assert');
const fs = require('fs');
const path = require('path');

const template = fs.readFileSync(path.resolve(__dirname, '..', 'miniapp', 'package-member', 'pages', 'reviews', 'index.wxml'), 'utf8');

assert.match(template, /<view wx:if="\{\{!current && orders\.length\}\}" class="card">/);
assert.match(template, /<view wx:if="\{\{current\}\}"><view class="card"><text class="title">评价商品<\/text>/);
assert.doesNotMatch(template, /<view wx:if="\{\{!current && orders\.length\}\}"[^>]*>[\s\S]*?<\/view><view wx:else><view class="card"><text class="title">评价商品<\/text>/);

const readyMatrix = [
  { current: null, orders: [], orderList: false, editor: false },
  { current: null, orders: [{ id: 'order-1' }], orderList: true, editor: false },
  { current: { id: 'order-1', items: [] }, orders: [{ id: 'order-1' }], orderList: false, editor: true }
];
readyMatrix.forEach((row) => {
  assert.equal(!row.current && row.orders.length > 0, row.orderList);
  assert.equal(Boolean(row.current), row.editor);
});

[
  'bindtap="selectOrder"', 'bindtap="toggleItem"', 'bindtap="setRating"',
  'bindinput="inputContent"', 'bindtap="chooseMedia"', 'bindtap="retryMedia"',
  'bindtap="removeMedia"', 'bindtap="submit"', 'current.orderLabel', 'current.items'
].forEach((contract) => assert.ok(template.includes(contract), `missing review contract: ${contract}`));

console.log('reviews empty state tests: passed');
