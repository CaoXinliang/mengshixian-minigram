const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const test = require('node:test');

const root = path.resolve(__dirname, '../miniapp');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const mainCss = read('pages/index/index.wxss');
const mainWxml = read('pages/index/index.wxml');
const memberCss = read('components/member-home-panel/index.wxss');
const memberWxml = read('components/member-home-panel/index.wxml');
const mealCss = read('components/meal-experience-panel/index.wxss');

function rule(source, selector) {
  const result = {};
  for (const match of source.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!match[1].split(',').map(value => value.trim()).includes(selector)) continue;
    for (const declaration of match[2].split(';')) {
      const colon = declaration.indexOf(':');
      if (colon >= 0) result[declaration.slice(0, colon).trim()] = declaration.slice(colon + 1).trim();
    }
  }
  return result;
}

function page(relative, services, wx = {}) {
  const file = path.join(root, relative);
  const localRequire = createRequire(file);
  let definition;
  vm.runInNewContext(read(relative), {
    Page(value) { definition = value; },
    require(name) { return name === '../../../services/index' && services ? services : localRequire(name); },
    wx
  }, { filename: file });
  return Object.assign({}, definition, {
    data: JSON.parse(JSON.stringify(definition.data)),
    setData(patch, done) { Object.assign(this.data, patch); if (done) done(); }
  });
}

test('narrow-screen title corrections keep the product detail heading on the fixed readable baseline', () => {
  const narrowCss = Array.from(mainCss.matchAll(/@media screen and \(max-width: 360px\)\{([\s\S]*?)\n\}/g), match => match[1]).join('\n');
  const selectors = [
    '.empty-state text:nth-child(2)', '.order-empty text:first-child',
    '.delivery-status>text:nth-child(2)', '.business-title'
  ];
  for (const selector of selectors) {
    assert.deepEqual(rule(narrowCss, selector), { 'font-size': '14px' }, `${selector}: do not change control dimensions to fix small type`);
  }
  assert.equal(rule(mainCss, '.detail-head>text')['font-size'], '22px');
  assert.equal(rule(narrowCss, '.detail-head>text')['font-size'], undefined, 'narrow screens must not shrink the detail heading below the shared baseline');
  assert.equal(rule(mealCss, '.meal-detail-copy>text:first-child')['font-size'], '24px');
  assert.equal(rule(mealCss, '.detail-head>text')['font-size'], '22px');
  assert.equal(mealCss.includes('@media screen and (max-width: 360px)'), false, 'the isolated meal component must keep its readable title baselines on narrow screens');
});

test('quantity dialog labels remain readable and stepper faces use the shared compact pixel baseline', () => {
  const specLabel = rule(mainCss, '.quantity-picker-spec-row>text');
  assert.equal(specLabel['min-height'], '24px');
  assert.equal(specLabel.flex, 'none');
  assert.equal(specLabel['white-space'], 'nowrap');
  const quantityCopy = rule(mainCss, '.quantity-picker-quantity-copy');
  assert.equal(quantityCopy['min-width'], '44px');
  assert.equal(quantityCopy.flex, '0 0 auto');
  assert.equal(quantityCopy['white-space'], 'nowrap');
  assert.equal(rule(mainCss, '.quantity-picker-stepper').flex, 'none');
  const stepperCss = read('components/quantity-stepper/index.wxss');
  assert.equal(rule(stepperCss, '.step-face').width, '30px');
  assert.equal(rule(stepperCss, '.step-face').height, '30px');
  assert.equal(rule(stepperCss, '.quantity-stepper.is-compact .step-face').width, '28px');
  assert.equal(rule(stepperCss, '.quantity-stepper.is-compact .step-face').height, '28px');
});

test('mine receipt badge stays within its button with a compact 99+ label and 24px icon', () => {
  const badge = rule(memberCss, '.order-count');
  assert.equal(badge.top, '0');
  assert.equal(badge.height, '16px');
  assert.equal(badge['white-space'], 'nowrap');
  assert.equal(rule(memberCss, '.member-order-grid image').width, '24px');
  assert.equal(rule(memberCss, '.member-order-grid image').height, '24px');
  assert(memberWxml.includes("{{pendingReceiptCount > 99 ? '99+' : pendingReceiptCount}}"));
  assert(memberWxml.includes('aria-label="{{pendingReceiptCount}}笔订单待收货"'));
});

test('quantity dialog maximum height uses the actual page safe top on phone and desktop', () => {
  assert(mainWxml.includes('style="--quantity-picker-safe-top: {{navContentTop}};"'));
  const style = rule(mainCss, '.quantity-picker');
  assert.equal(style['max-height'], 'calc(100vh - var(--quantity-picker-safe-top) - 24rpx)');
  assert.equal(style['overflow-y'], 'auto');
  assert.equal(style['box-sizing'], 'border-box', 'bottom safe padding belongs inside the capped height');
  for (const [width, height, menuBottom, desktop] of [[320, 568, 56, false], [375, 667, 56, false], [390, 844, 92, false], [414, 896, 92, false], [480, 752, 38, true]]) {
    const main = page('pages/index/index.js', null, { getMenuButtonBoundingClientRect: () => ({ bottom: menuBottom }) });
    main.updateLayoutMetrics({ windowWidth: width, windowHeight: height, statusBarHeight: 20, system: desktop ? 'Windows 11' : 'iOS 18' });
    const safeTop = parseFloat(main.data.navContentTop) * width / 750;
    const maxSheetHeight = height - safeTop - 24 * width / 750;
    const sheetTop = height - maxSheetHeight;
    assert(maxSheetHeight > 0 && sheetTop >= safeTop, `${width}px dialog must not enter the capsule area`);
    if (!desktop) assert(sheetTop > menuBottom, `${width}px dialog must leave a gap below the capsule`);
    else assert.equal(safeTop, 0, 'desktop must not gain a second native-title inset');
  }
});

const ok = data => ({ ok: true, data });
const fail = code => ({ ok: false, error: { code, message: `提示：${code}` } });

function bundlePage({
  user = { _id: 'customer' },
  quote = async () => ok({ quote: { payableAmountCent: 2499, goodsAmountCent: 2499 } }),
  addressList = async () => ok({ rows: [{ _id: 'address-default', regionCode: '440305', isDefault: true }] }),
  deliveryOptions = async () => ok({
    warehouses: [{ _id: 'warehouse-default', name: '默认仓' }],
    areas: [{ _id: 'area-default', regionCodes: ['440305'], warehouseIds: ['warehouse-default'] }]
  }),
  wx = {}
} = {}) {
  const state = { user, calls: [], addressCalls: 0, deliveryCalls: 0 };
  const instance = page('package-marketing/pages/bundle-detail/index.js', {
    auth: { getMe: async () => ok({ user: state.user }) },
    address: { list: async () => { state.addressCalls += 1; return addressList(); } },
    delivery: { options: async () => { state.deliveryCalls += 1; return deliveryOptions(); } },
    bundles: {
      get: async () => ok({ bundle: { _id: 'bundle', name: '测试套餐', items: [{ skuId: 'sku', quantity: 2 }] } }),
      quote: async payload => { state.calls.push(payload); return quote(payload); }
    }
  }, wx);
  return { instance, state };
}

test('guest bundle page has no quote retry and quantity changes do not call a gated pricing API', async () => {
  const { instance, state } = bundlePage({ user: null });
  await instance.onLoad({ id: 'bundle' });
  assert.equal(instance.data.errorText, '登录后可查看价格并购买');
  assert.equal(instance.data.canRetryQuote, false);
  assert.equal(instance.data.canQuote, false);
  instance.changeQty({ currentTarget: { dataset: { step: 1 } } });
  await instance.loadQuote();
  assert.equal(instance.data.quantity, 2);
  assert.equal(instance.data.quote, null);
  assert.equal(state.calls.length, 0);
  assert.equal(state.addressCalls, 0);
  assert.equal(state.deliveryCalls, 0);
  instance.changeQty({ currentTarget: { dataset: {} }, detail: { source: 'input', valid: true, quantity: 5 } });
  await Promise.resolve();
  assert.equal(instance.data.quantity, 5, '套餐数量必须支持合法数字直输');
  assert.equal(state.calls.length, 0, '游客直输数量也不能绕过报价准入');
  const wxml = read('package-marketing/pages/bundle-detail/index.wxml');
  assert(wxml.includes('<button wx:if="{{canRetryQuote}}" disabled="{{quoting}}" bindtap="retryQuote">重试</button>'));
  assert(wxml.includes('<button wx:if="{{quoteAction}}" bindtap="openQuoteAction">{{quoteActionText}}</button>'));
});

test('logged-in bundle quote uses the default address region and a warehouse serving that region', async () => {
  const { instance, state } = bundlePage({
    addressList: async () => ok({ rows: [
      { _id: 'address-secondary', regionCode: '310101', isDefault: false },
      { _id: 'address-default', regionCode: '440305', isDefault: true }
    ] }),
    deliveryOptions: async () => ok({
      warehouses: [{ _id: 'warehouse-wrong' }, { _id: 'warehouse-serving' }],
      areas: [
        { _id: 'area-wrong', regionCodes: ['310101'], warehouseIds: ['warehouse-wrong'] },
        { _id: 'area-serving', regionCodes: ['440305'], warehouseIds: ['warehouse-serving'] }
      ]
    })
  });
  await instance.onLoad({ id: 'bundle' });
  assert.deepEqual(JSON.parse(JSON.stringify(state.calls)), [{
    bundleId: 'bundle',
    quantity: 1,
    warehouseId: 'warehouse-serving',
    regionCode: '440305',
    fulfillmentType: 'delivery'
  }]);
  assert.deepEqual(JSON.parse(JSON.stringify(instance.data.quoteContext)), { warehouseId: 'warehouse-serving', regionCode: '440305', fulfillmentType: 'delivery' });
  assert.equal(instance.data.quote.total, '24.99');
});

test('missing address blocks pricing and offers address management without sending an invalid quote', async () => {
  const navigations = [];
  const { instance, state } = bundlePage({
    addressList: async () => ok({ rows: [] }),
    wx: { navigateTo: options => navigations.push(options.url) }
  });
  await instance.onLoad({ id: 'bundle' });
  assert.equal(state.calls.length, 0);
  assert.equal(instance.data.canQuote, false);
  assert.equal(instance.data.canRetryQuote, false);
  assert.equal(instance.data.quoteAction, 'address');
  assert.match(instance.data.errorText, /收货地址/);
  instance.openQuoteAction();
  assert.deepEqual(navigations, ['/package-trade/pages/addresses/index?select=1']);
});

test('a region with no serving warehouse blocks pricing and links to checkout context', async () => {
  const navigations = [];
  const { instance, state } = bundlePage({
    deliveryOptions: async () => ok({
      warehouses: [{ _id: 'warehouse-other' }],
      areas: [{ _id: 'area-other', regionCodes: ['110101'], warehouseIds: ['warehouse-other'] }]
    }),
    wx: { navigateTo: options => navigations.push(options.url) }
  });
  await instance.onLoad({ id: 'bundle' });
  assert.equal(state.calls.length, 0);
  assert.equal(instance.data.canQuote, false);
  assert.equal(instance.data.canRetryQuote, false);
  assert.equal(instance.data.quoteAction, 'checkout');
  assert.match(instance.data.errorText, /暂无可配送仓库/);
  instance.openQuoteAction();
  assert.deepEqual(navigations, ['/package-trade/pages/checkout/index?bundleId=bundle&bundleQuantity=1']);
});

test('a recoverable delivery-context failure retries the context before pricing', async () => {
  let first = true;
  const { instance, state } = bundlePage({
    deliveryOptions: async () => {
      if (first) return fail('REQUEST_TIMEOUT');
      return ok({ warehouses: [{ _id: 'warehouse-default' }], areas: [{ regionCodes: ['440305'], warehouseIds: ['warehouse-default'] }] });
    }
  });
  await instance.onLoad({ id: 'bundle' });
  assert.equal(instance.data.canRetryQuote, true);
  assert.equal(state.calls.length, 0);
  first = false;
  await instance.retryQuote();
  assert.equal(state.deliveryCalls, 2);
  assert.equal(state.calls.length, 1);
  assert.equal(instance.data.quote.total, '24.99');
});

test('only recoverable quote failures expose retry and a successful retry clears the error', async () => {
  for (const code of ['REQUEST_FAILED', 'REQUEST_TIMEOUT', 'INVALID_API_RESPONSE', 'INTERNAL_ERROR']) {
    let failed = true;
    const { instance, state } = bundlePage({ quote: async () => failed ? fail(code) : ok({ quote: { payableAmountCent: 2499, goodsAmountCent: 2499 } }) });
    await instance.onLoad({ id: 'bundle' });
    assert.equal(instance.data.canRetryQuote, true, code);
    assert.equal(instance.data.quote, null);
    failed = false;
    await instance.loadQuote();
    assert.equal(instance.data.canRetryQuote, false);
    assert.equal(instance.data.errorText, '');
    assert.equal(instance.data.quote.total, '24.99', 'display continues using the returned server cents');
    assert.equal(state.calls.length, 2);
  }
});

test('authorization, missing data and business-rule failures do not offer an ineffective quote retry', async () => {
  for (const code of ['UNAUTHENTICATED', 'AUTH_ACCOUNT_DISABLED', 'AUTH_SESSION_EXPIRED', 'PRICE_NOT_AVAILABLE', 'BUNDLE_NOT_AVAILABLE', 'WAREHOUSE_NOT_AVAILABLE', 'ADDRESS_NOT_AVAILABLE', 'MIN_ORDER_QUANTITY_NOT_MET', 'VALIDATION_ERROR', 'FUTURE_BUSINESS_ERROR']) {
    const { instance } = bundlePage({ quote: async () => fail(code) });
    await instance.onLoad({ id: 'bundle' });
    assert.equal(instance.data.canRetryQuote, false, code);
    assert.equal(instance.data.quote, null);
    assert(instance.data.errorText, 'necessary failure information remains visible');
  }
});

test('thrown transport failures are retryable and reloading as a guest removes old pricing state', async () => {
  const { instance, state } = bundlePage({ quote: async () => { throw new Error('network disconnected'); } });
  await instance.onLoad({ id: 'bundle' });
  assert.equal(instance.data.canRetryQuote, true);
  assert.equal(instance.data.quoting, false);
  state.user = null;
  await instance.load();
  assert.equal(instance.data.canRetryQuote, false);
  assert.equal(instance.data.canQuote, false);
  assert.equal(instance.data.quote, null);
  assert.equal(state.calls.length, 1);
});
