const assert = require('assert/strict');
const { deriveHomeCampaign } = require('../miniapp/modules/home-campaign-state');

const products = [
  { id: 'product-1', name: '后台商品一', category: '海鲜水产' },
  { id: 'product-2', name: '后台商品二', category: '牛肉类' }
];

const configured = deriveHomeCampaign({
  _id: 'section-1',
  moduleType: 'special',
  title: '后台冷链特价',
  subtitle: '价格与资格以结算页为准',
  startAt: '2026-09-18T00:00:00+08:00',
  endAt: '2026-09-25T23:59:59+08:00',
  activityStatus: 'active',
  categoryName: '海鲜水产',
  productIds: ['product-1', 'missing-product']
}, products, new Date('2026-09-20T12:00:00+08:00').getTime());

assert.equal(configured.title, '后台冷链特价');
assert.equal(configured.periodText, '活动有效期 09.18—09.25');
assert.equal(configured.status, 'active');
assert.equal(configured.statusText, '进行中');
assert.deepEqual(configured.rules, ['价格与资格以结算页为准']);
assert.equal(configured.categoryLabel, '海鲜水产');
assert.deepEqual(configured.productIds, ['product-1', 'missing-product']);
assert.deepEqual(configured.products.map((item) => item.id), ['product-1']);
assert.deepEqual(configured.missingProductIds, ['missing-product']);

const minimal = deriveHomeCampaign({
  _id: 'section-2',
  moduleType: 'special',
  title: '后台活动',
  jumpType: 'product',
  jumpTarget: 'product-2'
}, products, new Date('2026-09-20T12:00:00+08:00').getTime());

assert.equal(minimal.periodText, '');
assert.equal(minimal.status, 'available');
assert.equal(minimal.statusText, '活动详情');
assert.deepEqual(minimal.rules, []);
assert.deepEqual(minimal.productIds, ['product-2']);
assert.deepEqual(minimal.products.map((item) => item.id), ['product-2']);
assert(!JSON.stringify(minimal).includes('09.18—09.25'));
assert(!JSON.stringify(minimal).includes('68.00'));
assert(!JSON.stringify(minimal).includes('冻品组合优惠'));

console.log('home campaign state test: passed');
