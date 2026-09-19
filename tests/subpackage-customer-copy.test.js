const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createCouponWallet } = require('../miniapp/modules/coupon-wallet');

const root = path.resolve(__dirname, '../miniapp');
const ok = data => ({ ok: true, data });
const rows = values => ok({ rows: values });
const loggedIn = { getMe: async () => ok({ user: { _id: 'customer', status: 'active' } }) };

function page(relative, services) {
  const file = path.join(root, relative);
  let definition;
  const toasts = [];
  const context = {
    Page(value) { definition = value; },
    require(name) {
      return name === '../../../services/index' ? services : require(path.resolve(path.dirname(file), name));
    },
    wx: { showToast(value) { toasts.push(value); }, navigateBack() {} }
  };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  return Object.assign({}, definition, {
    data: JSON.parse(JSON.stringify(definition.data)),
    toasts,
    setData(patch, done) { Object.assign(this.data, patch); if (done) done(); }
  });
}

async function run() {
  const validTemplate = {
    _id: 'template-percent', name: '九折券', type: 'percent', discountRateBps: 9000,
    minSpendCent: 1000, maxDiscountCent: null, scopeType: 'all', scopeIds: [],
    validFrom: '2026-09-01T00:00:00.000Z', validTo: '2026-10-01T00:00:00.000Z',
    perUserLimit: 1, version: 1
  };
  const createWallet = (templateRows, couponRows) => {
    let state;
    const wallet = createCouponWallet({
      coupons: {
        templatesAll: async () => rows(templateRows),
        listAll: async () => rows(couponRows),
        resolveClaim: async () => ok({ found: false })
      },
      intentStore: { get() { return null; }, set() {}, remove() {} },
      createKey: () => 'copy-test-key',
      onChange(next) { state = next; }
    });
    return { wallet, state: () => state };
  };
  const safeCoupons = createWallet([validTemplate], [
    {
      _id: 'available', templateId: validTemplate._id, status: 'available', snapshot: validTemplate,
      validFrom: validTemplate.validFrom, validTo: validTemplate.validTo
    },
    { _id: 'historical', templateId: 'removed-template', status: 'used', snapshot: null }
  ]);
  await safeCoupons.wallet.load({ userId: 'customer' });
  assert.equal(safeCoupons.state().status, 'ready');
  assert.deepEqual(Array.from(safeCoupons.state().coupons, item => item.valueText), ['减90%', '优惠待确认']);
  assert.equal(safeCoupons.state().coupons[1].name, '券面信息已失效');
  assert.equal(safeCoupons.state().coupons[1].usable, false, 'damaged historical coupons stay visible but cannot become usable');

  const unsafeCoupons = createWallet([validTemplate], [
    { _id: 'unknown', templateId: validTemplate._id, status: 'future_internal_code', snapshot: validTemplate }
  ]);
  await unsafeCoupons.wallet.load({ userId: 'customer' });
  assert.equal(unsafeCoupons.state().status, 'error', 'unknown coupon statuses must fail safely instead of becoming customer copy');
  assert.deepEqual(unsafeCoupons.state().coupons, []);
  const bundles = page('package-marketing/pages/bundles/index.js', {
    auth: { getMe: async () => ok({ user: null }) },
    bundles: { list: async () => rows([{ _id: 'bundle' }]) }
  });
  await bundles.load();
  assert.equal(bundles.data.rows[0].description, '', 'missing merchandising copy must not become a technical disclaimer');
  assert.equal(bundles.data.rows[0].priceHint, '登录后查看价格');
  assert.equal(bundles.data.rows[0].priceText, '', 'copy cleanup must preserve price login gating');

  const checkout = page('package-trade/pages/checkout/index.js', { checkout: { quote: async () => ({ ok: false }) } });
  await checkout.loadQuote();
  assert.equal(checkout.data.quoteErrorText, '当前暂无可配送仓库');
  Object.assign(checkout.data, {
    warehouse: { id: 'warehouse' },
    address: { id: 'address', regionCode: '360700' },
    deliveryAreas: [{ id: 'area', regionCodes: ['360700'], warehouseIds: ['warehouse'] }],
    cartItems: [{ skuId: 'sku', qty: 1 }]
  });
  await checkout.loadQuote();
  assert.equal(checkout.data.quoteState, 'error');
  assert.equal(checkout.data.quoteErrorText, '订单金额计算失败，请重试');
  await checkout.submitOrder();
  assert.equal(checkout.toasts[0].title, '请先重新计算订单金额');
  assert.equal(checkout.data.submitting, false, 'copy changes must not allow submission without a quote');

  let refundStatus = 'awaiting_manual_refund';
  const aftersale = page('package-trade/pages/aftersale-detail/index.js', { aftersales: { get: async () => ok({ refund: { _id: 'r1', status: refundStatus } }) } });
  await aftersale.onLoad({ id: 'r1' });
  assert.equal(aftersale.data.detail.timeline[2].note, '等待运营提交真实退款渠道');
  assert.equal(aftersale.data.detail.statusText, '等待退款处理');
  refundStatus = 'future_internal_code';
  await aftersale.loadDetail();
  assert.equal(aftersale.data.detail.statusText, '处理中');
  refundStatus = 'succeeded';
  await aftersale.loadDetail();
  assert.equal(aftersale.data.detail.statusText, '退款成功');
  assert.equal(aftersale.data.detail.timeline[2].note, '退款处理已完成');

  const groups = page('package-marketing/pages/groups/index.js', { auth: loggedIn, groups: {
    campaigns: async () => rows([{ _id: 'campaign', status: 'active' }]),
    mine: async () => rows(['open', 'success', 'failed', 'future_internal_code'].map((status, index) => ({ _id: `g${index}`, status })))
  } });
  await groups.load();
  assert.equal(groups.data.campaigns[0].statusText, '进行中');
  assert.deepEqual(Array.from(groups.data.mine, item => item.statusText), ['待成团', '已成团', '未成团', '处理中']);

  const order = page('package-trade/pages/order-detail/index.js', {
    auth: loggedIn,
    orders: { get: async () => ok({ order: { _id: 'order', status: 'future_internal_code' }, items: [{ _id: 'item', quantity: 1 }] }) }
  });
  await order.onLoad({ id: 'order' });
  assert.equal(order.data.order.statusText, '处理中');
  assert.equal(order.data.order.items[0].spec, '暂无规格信息');
  assert.equal(order.data.order.canPay, false);
  assert.equal(order.data.order.canConfirm, false);

  const customerTemplates = [
    'package-business/pages/frequent/index.wxml',
    'package-business/pages/inquiry-detail/index.wxml',
    'package-business/pages/repurchase/index.wxml'
  ];
  for (const relativePath of customerTemplates) {
    const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
    const visibleText = Array.from(source.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g), match => match[1]);
    assert(!visibleText.some(text => /\bskuId\b/.test(text)), `${relativePath} must not expose a SKU id as customer-visible fallback copy`);
  }
  const repurchaseSource = fs.readFileSync(path.join(root, 'package-business/pages/repurchase/index.js'), 'utf8');
  assert(!repurchaseSource.includes("snapshot.productNameSnapshot || item.skuId"), 'repurchase display names must use generic customer copy instead of a SKU id');
  console.log('subpackage customer copy test: passed');
}

run().catch(error => { console.error(error); process.exitCode = 1; });
