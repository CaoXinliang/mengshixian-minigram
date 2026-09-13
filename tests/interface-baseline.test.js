const assert = require('assert');
const fs = require('fs');
const Module = require('module');
const path = require('path');

const root = path.resolve(__dirname, '..');
const js = fs.readFileSync(path.join(root, 'miniapp/pages/index/index.js'), 'utf8');
const wxml = fs.readFileSync(path.join(root, 'miniapp/pages/index/index.wxml'), 'utf8');
const wxss = fs.readFileSync(path.join(root, 'miniapp/pages/index/index.wxss'), 'utf8');
const appJson = JSON.parse(fs.readFileSync(path.join(root, 'miniapp/app.json'), 'utf8'));
const projectConfig = JSON.parse(fs.readFileSync(path.join(root, 'project.config.json'), 'utf8'));
const quantityStepperJs = fs.readFileSync(path.join(root, 'miniapp/components/quantity-stepper/index.js'), 'utf8');
const quantityStepperWxml = fs.readFileSync(path.join(root, 'miniapp/components/quantity-stepper/index.wxml'), 'utf8');
const quantityStepperWxss = fs.readFileSync(path.join(root, 'miniapp/components/quantity-stepper/index.wxss'), 'utf8');
const inquiriesWxml = fs.readFileSync(path.join(root, 'miniapp/package-business/pages/inquiries/index.wxml'), 'utf8');
const checkoutPage = fs.readFileSync(path.join(root, 'miniapp/package-trade/pages/checkout/index.js'), 'utf8');
const paymentPage = fs.readFileSync(path.join(root, 'miniapp/package-trade/pages/demo-payment/index.js'), 'utf8');
const paymentWxml = fs.readFileSync(path.join(root, 'miniapp/package-trade/pages/demo-payment/index.wxml'), 'utf8');
const paymentWxss = fs.readFileSync(path.join(root, 'miniapp/package-trade/pages/demo-payment/index.wxss'), 'utf8');
const ordersPage = fs.readFileSync(path.join(root, 'miniapp/package-trade/pages/orders/index.js'), 'utf8');
const ordersWxml = fs.readFileSync(path.join(root, 'miniapp/package-trade/pages/orders/index.wxml'), 'utf8');
const ordersWxss = fs.readFileSync(path.join(root, 'miniapp/package-trade/pages/orders/index.wxss'), 'utf8');
const checkoutWxml = fs.readFileSync(path.join(root, 'miniapp/package-trade/pages/checkout/index.wxml'), 'utf8');
const tradeFormatPath = path.join(root, 'miniapp/package-trade/services/trade-format.js');
const tradeFormat = fs.readFileSync(tradeFormatPath, 'utf8');
const tradeMoney = require(tradeFormatPath).money;
const addressWxss = fs.readFileSync(path.join(root, 'miniapp/package-trade/pages/addresses/index.wxss'), 'utf8');
const obsoleteMainTradeFormatPath = path.join(root, 'miniapp/services/trade-format.js');
const webPreview = fs.readFileSync(path.join(root, 'web-preview/app.js'), 'utf8');

function cssRuleBodies(source, selector) {
  const bodies = [];
  const rulePattern = /([^{}]+)\{([^{}]*)\}/g;
  let match;
  while ((match = rulePattern.exec(source))) {
    const selectors = match[1].split(',').map((item) => item.trim());
    if (selectors.includes(selector)) bodies.push(match[2]);
  }
  return bodies;
}

function cssDeclarations(body) {
  return String(body || '').split(';').reduce((output, declaration) => {
    const separator = declaration.indexOf(':');
    if (separator < 0) return output;
    output[declaration.slice(0, separator).trim()] = declaration.slice(separator + 1).trim();
    return output;
  }, {});
}

function cssRules(source, selector) {
  return cssRuleBodies(source, selector).map(cssDeclarations);
}

function px(value) {
  const match = String(value || '').match(/^(\d+(?:\.\d+)?)px$/);
  return match ? Number(match[1]) : NaN;
}

function loadIndexInternals() {
  const filename = path.join(root, 'miniapp/pages/index/index.js');
  const testModule = new Module(filename, module);
  testModule.filename = filename;
  testModule.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalPage = global.Page;
  let pageDefinition;
  global.Page = (definition) => { pageDefinition = definition; };
  try {
    testModule._compile(`${js}\nmodule.exports = { fixedHomeCategories, HOME_CATEGORIES, productWithPrice, shortcutProfile, calculateTotals, selectedCartSummary, hasCompleteCartPricing };`, filename);
  } finally {
    if (originalPage === undefined) delete global.Page;
    else global.Page = originalPage;
  }
  return { ...testModule.exports, pageDefinition };
}

const indexInternals = loadIndexInternals();
const registeredWxml = [
  ...(appJson.pages || []).map((page) => path.join(root, 'miniapp', `${page}.wxml`)),
  ...(appJson.subpackages || []).flatMap((subpackage) =>
    subpackage.pages.map((page) => path.join(root, 'miniapp', subpackage.root, `${page}.wxml`))
  )
].map((filename) => fs.readFileSync(filename, 'utf8')).join('\n');

function sourceSlice(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert(start >= 0 && end > start, `expected source markers: ${startMarker} ... ${endMarker}`);
  return source.slice(start, end);
}

const homeHeaderTemplate = sourceSlice(wxml, '<template name="homeHeroHeader">', '</template>');
const homeStoreRowWxml = sourceSlice(homeHeaderTemplate, '<view class="store-row">', '<view class="search-row">');
const homePageWxml = sourceSlice(wxml, '<block wx:if="{{page == \'home\'}}">', '<block wx:elif="{{page == \'category\'}}">');
const specialHeadingWxml = sourceSlice(homePageWxml, '<view class="section-heading">', '<view class="deal-list">');

assert(wxml.includes('class="wide-outline"') && wxml.includes('bindtap="showAddressForm"'), 'address entry must remain a clear interactive control');
assert(wxss.includes('.wide-outline{display:flex;align-items:center;justify-content:center;'), 'address entry text must be optically centered');
assert(!wxml.includes('class="chevron">⌄</text>') && wxml.includes('class="location-name"') && wxss.includes('.store-row{position:relative;') && wxss.includes('.location-button{position:absolute;left:0;top:50%;') && wxss.includes('.location-name{min-width:0;') && wxss.includes('.brand{position:absolute;left:50%;top:50%;') && wxss.includes('transform:translate(-50%,-50%)'), 'header must remove the trailing warehouse glyph, preserve the visible left warehouse label, and center the brand against the viewport');
assert(homeStoreRowWxml.includes('class="location-name">{{warehouse.name}}</view>') && homeStoreRowWxml.includes('<view class="brand">') && homeStoreRowWxml.includes('<text>梦食鲜</text>'), 'home header must preserve the warehouse and brand text after removing decorative marks');
assert(!homeStoreRowWxml.includes('<image') && !/(?:location-icon|brand-logo|logo-mark)/.test(homeStoreRowWxml), 'home header must not restore a location icon or circular logo');
assert(!homePageWxml.includes('class="news-strip"') && !homePageWxml.includes('data-section-type="news"') && !homePageWxml.includes('{{activityTitle}}') && !homePageWxml.includes('{{activityCopy}}') && !homePageWxml.includes('{{activityMoreText}}'), 'the approved home page must not restore the activity headline module');
assert(specialHeadingWxml.includes('{{specialTitle}}') && specialHeadingWxml.includes('{{specialSubtitle}}') && !specialHeadingWxml.includes('<button') && !specialHeadingWxml.includes('{{specialMoreText}}') && !specialHeadingWxml.includes('更多'), 'the special-offer heading must keep its title and subtitle without a more button');
const approvedBusinessShortcut = indexInternals.shortcutProfile({ userType: 'b', businessStatus: 'approved', organizationId: 'org-1', status: 'active' });
assert.deepStrictEqual({ label: approvedBusinessShortcut.shortcutLabel, toolLabel: approvedBusinessShortcut.shortcutToolLabel, icon: approvedBusinessShortcut.shortcutIcon, approved: approvedBusinessShortcut.isApprovedBusiness }, { label: '常购清单', toolLabel: '常购清单', icon: '/assets/icons/list.svg', approved: true }, 'a complete enabled B identity must receive the frequent-purchase shortcut');
for (const [name, user] of [
  ['C identity', { userType: 'c', businessStatus: '', organizationId: '', status: 'active' }],
  ['B identity without organization', { userType: 'b', businessStatus: 'approved', organizationId: '', status: 'active' }],
  ['disabled B identity', { userType: 'b', businessStatus: 'approved', organizationId: 'org-1', status: 'disabled' }]
]) {
  const shortcut = indexInternals.shortcutProfile(user);
  assert.deepStrictEqual({ label: shortcut.shortcutLabel, toolLabel: shortcut.shortcutToolLabel, icon: shortcut.shortcutIcon, approved: shortcut.isApprovedBusiness }, { label: '吃什么', toolLabel: '吃什么', icon: '/assets/icons/meal.svg', approved: false }, `${name} must fall back to the customer meal shortcut`);
}
assert(wxml.includes('商品小计 ¥{{cartTotal}}') && wxml.includes('配送费 ¥{{freightTotal}}') && wxml.includes('应付合计 ¥{{orderTotal}}'), 'checkout must expose all three amount layers with an explicit currency marker');
const quickAmountRule = cssRules(wxss, '.quick-checkout .quick-amount')[0] || {};
const quickCountRule = cssRules(wxss, '.quick-checkout .quick-count')[0] || {};
const quickCountLabelRule = cssRules(wxss, '.quick-checkout .quick-count-label')[0] || {};
const quickTotalLabelRule = cssRules(wxss, '.quick-checkout .quick-total-label')[0] || {};
const quickCheckoutActionRule = Object.assign({}, ...cssRules(wxss, '.quick-checkout>button:last-child'));
assert(wxml.includes('wx:if="{{selectedCartPriceReady}}" class="quick-currency">¥</text>') && wxml.includes("selectedCartCount > 99 ? '99+' : selectedCartCount") && wxml.includes("selectedCartPriceReady ? '合计' + selectedCartTotal + '元' : '价格待确认'"), 'quick checkout must identify numeric currency only, bound the visible count, and preserve the full amount and count for accessibility');
assert(wxml.includes('class="quick-count-label">数量</text>') && wxml.includes('class="quick-total-label">合计</text>') && !wxml.includes('class="quick-delivery"') && px(quickAmountRule['font-size']) === 24 && px(quickCountRule['font-size']) === 15 && px(quickCountLabelRule['font-size']) === 14 && quickCountRule.flex === 'none' && px(quickTotalLabelRule['margin-left']) >= 8 && px(quickTotalLabelRule['padding-left']) >= 8 && /^1px solid\b/.test(quickTotalLabelRule['border-left'] || ''), 'quick checkout must keep readable count and total typography in one clear, divided row without the redundant delivery helper');
assert(wxml.includes('class="quick-checkout-action"') && px(quickCheckoutActionRule.width) === 108 && px(quickCheckoutActionRule.height) === 52 && px(quickCheckoutActionRule['font-size']) === 17, 'quick checkout copy refinements must preserve the confirmed action size while keeping its label visually substantial');
assert(wxss.includes('@media screen and (max-width: 374px)') && wxss.includes('@media screen and (max-width: 390px)') && wxss.includes('.quick-checkout .quick-count-label{display:none}') && wxss.includes('.quick-checkout .quick-summary-line.is-compact .quick-count-label{display:none}') && wxss.includes('.quick-checkout .quick-summary-line.is-compact .quick-amount{font-size:17px;') && wxss.includes('.quick-checkout .quick-summary-line.is-pending .quick-amount{font-size:16px;') && wxss.includes('.quick-checkout .quick-summary-line.is-compact .quick-total-label{display:none}') && wxss.includes('.quick-checkout .quick-summary-line.is-compact .quick-amount{font-size:14px}'), 'quick checkout must use large regular typography and progressively compact only on narrow phones or exceptional long totals');
assert.strictEqual(indexInternals.calculateTotals([{ price: 10, qty: 1 }, { price: 20, qty: 2 }]).cartTotal, '50.00');
assert.strictEqual(indexInternals.calculateTotals([{ price: 10, qty: 1 }, { price: null, qty: 1 }]).cartTotal, '价格待补充', 'a mixed priced/unpriced selection must never display a partial total');
assert.strictEqual(indexInternals.selectedCartSummary([{ price: 10, qty: 1 }, { price: undefined, qty: 1 }]).selectedCartPriceReady, false, 'quick checkout must remain unavailable until every selected row has a valid price');
assert.strictEqual(indexInternals.selectedCartSummary([{ price: 10, qty: 1 }, { price: 20, qty: 2 }]).selectedCartPriceReady, true);
assert(wxml.includes('disabled="{{!selectedCartCount || !selectedCartPriceReady}}"') && js.includes("if (!this.data.selectedCartPriceReady) return wx.showToast({ title: '所选商品价格待确认'"), 'quick checkout must block incomplete pricing both visually and in the handler');
assert(wxml.includes('<text>{{item.specLabel || item.unit}}</text>') && !wxml.includes('<text>{{item.unit}}</text>\n<text>{{item.specLabel'), 'catalog rows must render one canonical spec-or-package line instead of repeating both values');
const chooseSpecRules = cssRules(wxss, '.choose-spec');
assert(chooseSpecRules.length && chooseSpecRules.some((rule) => rule.display === 'flex' && rule['align-items'] === 'center' && rule['justify-content'] === 'center') && chooseSpecRules.every((rule) => !rule.width || (px(rule.width) >= 44 && px(rule.width) <= 120)) && chooseSpecRules.every((rule) => !rule.height || px(rule.height) >= 44), 'catalog actions must retain a bounded column and a phone-safe touch target');
assert(wxss.includes('.detail-line text:first-child{width:92rpx;') && wxss.includes('text-align:left;line-height:1.5'), 'detail labels and long values must use stable readable columns');
assert(wxml.includes("item.priceTemporary ? 'is-temporary' : (!item.priceText ? 'is-locked' : '')") && wxml.includes('price-pending is-locked'), 'confirmed prices, temporary prices and access-locked prices must use separate visual states');
assert(wxss.includes('.price-pending.is-locked') && wxss.includes('.price-pending.is-temporary'), 'price states must have distinct visual semantics');
assert(wxss.includes('.simple-row>view .price-pending.is-locked,.cart-row>view .price-pending.is-locked{color:#6f8498;'), 'list-context selectors must not recolor access-locked prices as temporary prices');
assert(js.includes('const hasPriceAmount = price =>') && js.includes('priceTemporary: Boolean(amountCent !== null && price && price.temporary)'), 'quantity-aware temporary price styling must still require a readable amount');
assert(js.includes('if (this.data.loggedIn || this._remoteUser) await this.loadRemoteCatalogPrices(products);'), 'catalog pricing must still load when a restored session is available before the catalog request finishes');
assert(wxml.includes('{{item.priceText || priceFallback}}') && js.includes("priceFallback: '登录后查看价格'") && js.includes('mx_price_cache'), 'logged-in catalog rows must distinguish a price request in progress from a missing login price');
assert(js.includes("priceText: amountCent === null ? ''") && js.includes("priceFallback: '暂未定价'") && js.includes('priceUnavailable: IS_CLOUD_MODE && !hasPriceAmount(price)') && wxml.includes('loggedIn && item.priceUnavailable'), 'logged-in products without a verified price must show an unavailable state and block purchase controls');
assert(js.includes("detailLimited: true, detailErrorText: '商品暂不可购买'") && wxml.includes('wx:if="{{detailLimited}}"') && wxml.includes('<text>商品暂不可购买</text>') && wxss.includes('.detail-load-state.is-limited'), 'catalog products without SKU details must retain one customer-facing non-purchasable state instead of exposing internal data status');
assert(!wxml.includes('全场满 99 元免基础配送费') && !js.includes('低至 8 折') && wxml.includes('配送范围与费用在下单前确认'), 'fallback banners must not claim unverified freight thresholds or discounts');
assert(wxml.includes('wx:if="{{detailVideoSrc || detailVideoError}}"') && !wxml.includes('该商品暂未上传视频'), 'products without video must omit the empty video module');
assert(js.includes('return number.toFixed(2);') && tradeFormat.includes('return number.toFixed(2);') && !js.includes("toFixed(2).replace(/\\.00$/") && !tradeFormat.includes("toFixed(2).replace(/\\.00$/"), 'cart, checkout and order totals must always render two decimal places');
assert(wxml.includes('class="order-card-actions"') && wxss.includes('.order-card-actions{display:flex;justify-content:flex-end;'), 'order actions must form a distinct, readable action row');
assert(wxss.includes('.tool-grid button{width:33.333%;flex:0 0 33.333%}'), 'nine common tools must form a balanced three-column grid');
assert(wxml.includes("共 {{categoryProducts.length || '0'}} 件"), 'catalog empty state must render an explicit zero count');
assert(!wxml.includes('class="deal-benefit"') && !wxml.includes('{{item.benefit}}'), 'storefront cards must omit the redundant delivery-benefit helper line and keep the purchase decision compact');
assert(!js.includes('wx.getSystemInfoSync') && js.includes('wx.getWindowInfo') && js.includes('wx.getDeviceInfo') && js.includes('const isDesktopWindow =') && js.includes('const contentTop = isDesktopWindow ? 0 : Math.max(statusBarHeight, menuBottom)') && js.includes('system.safeArea && system.safeArea.bottom'), 'layout metrics must use current split APIs, skip duplicate desktop chrome, and retain the phone capsule/safe-area path');
assert(tradeMoney(61.2) === '61.20' && tradeMoney(74) === '74.00' && tradeMoney(63.81) === '63.81', 'representative prices must keep exactly two decimal places');
assert(addressWxss.includes('.form-card input{height:72rpx;padding:0 17rpx;line-height:72rpx}') && addressWxss.includes('.form-card textarea{padding:15rpx 17rpx;line-height:1.5}'), 'address inputs must reserve a stable Windows-safe text box without clipping multiline fields');
assert(wxml.includes('class="detail-price price-pending') && wxss.includes('.detail-product>view .detail-price{') && !wxss.includes('.detail-product>view text:last-child'), 'detail current price must use semantic styling and never inherit obsolete-price deletion');
assert(wxml.includes('selectedProduct.specs && selectedProduct.specs.length > 1') && wxml.includes('包装规格') && wxml.includes('selectedProduct.unit != selectedSpec') && !wxml.includes('<text>商品规格</text>'), 'single-SKU products must not render a redundant spec selector, while distinct packaging remains visible');
assert(wxml.includes('quantity="{{detailDraftQty}}"') && wxml.includes('{{selectedSpec}}') && !wxml.includes('已选 {{detailDraftQty}} 件') && !wxml.includes('请继续选择规格'), 'detail quantity and selected spec must remain visible without a duplicate instructional sentence');
assert(wxml.includes("item.specs && item.specs.length > 1") && wxml.includes('openQuantityPicker') && wxml.includes('selectQuantityPickerSpec') && wxml.includes('openDetailFromQuantityPicker') && wxml.includes('addQuantityPicker') && wxml.includes('class="quantity-picker-actions"') && wxml.includes('查看详情') && wxml.includes('加入购物车'), 'multi-SKU rows must retain the quantity/spec panel and its normal product actions');
assert(wxml.includes("checkoutQuoteState == 'ready' ? '提交订单'") && wxml.includes('在线支付暂未开放') && !wxml.includes('aria-label="完成支付确认"') && !wxml.includes('bindtap="finishDemoPayment"'), 'checkout may submit an order, but unavailable online payment must be read-only and expose no completion action');
assert(wxml.includes('<button wx:if="{{!frequentHasMultiSku}}" bindtap="addFrequent">全部加购</button>') && wxml.includes('<text wx:else class="frequent-spec-hint">逐个选择</text>') && wxml.includes('catchtap="openQuantityPicker"') && js.includes('const hasMultiSku = items =>'), 'frequent bulk-add must disappear when any row requires an explicit SKU choice, while per-row selection remains available');
const selectedSkuProduct = indexInternals.productWithPrice({
  specLabel: '旧规格',
  unit: '旧包装',
  selectedSkuId: 'sku-old',
  skuOptions: [
    { id: 'sku-a', label: '500g', packageUnit: '12包/件' },
    { id: 'sku-b', label: '1kg', packageUnit: '6包/件' }
  ]
}, { 'sku-b': { amountCent: 1280 } }, '1kg');
assert.strictEqual(selectedSkuProduct.specLabel, '1kg');
assert.strictEqual(selectedSkuProduct.unit, '6包/件');
assert.strictEqual(selectedSkuProduct.priceUnitLabel, '件', '12包/件 describes a case price, not a price per inner bag');
for (const [packageUnit, expected] of [['1袋', '袋'], ['220g/盅', '盅'], ['1件*30斤*15包', '件'], ['500g', '500g'], ['', ''], ['包装待补充', '']]) {
  const item = indexInternals.productWithPrice({skuOptions: [{id: 'unit-sku', label: '规格', packageUnit}]}, {'unit-sku': {amountCent: 1000}}, '规格');
  assert.strictEqual(item.priceUnitLabel, expected, `price unit for ${packageUnit || 'missing data'} must not invent 件`);
}
assert(!wxml.includes("priceUnitLabel || '件'"), 'unknown packaging must not be hard-coded to a per-piece price');
assert.strictEqual(selectedSkuProduct.selectedSkuId, 'sku-b');
assert(js.includes('const selectedPriced = selectedBase ? productWithPrice(selectedBase') && js.includes('selectedProduct = selectedPriced ? { ...selectedPriced'), 'cart refresh must keep the detail page on the currently selected SKU');
assert(js.includes('const baseProduct = this.findProduct(id)') && js.includes("productWithPrice(baseProduct, this._remotePriceBySku || {}, spec)"), 'adding a selected SKU must carry that SKU\'s display fields and price into the cart instead of reverting to the first SKU');
assert(js.includes('existing.remoteCartItemId = saved.data.item._id; existing.selected = effectiveSelected') && js.includes('existing.qty = quantity; existing.selected = true'), 're-adding an existing SKU must select it again before the user proceeds to checkout');
assert(js.includes('paymentStatus: order.paymentStatus || \'\'') && js.includes("canRefund: order.paymentStatus === 'paid'") && tradeFormat.includes("canRefund: order.paymentStatus === 'paid'"), 'refund actions must be hidden until the server reports a paid order');
assert(js.includes("canCancel: order.status === 'pending_payment' || (order.status === 'pending_confirmation' && order.paymentStatus !== 'paid')") && tradeFormat.includes("canCancel: order.status === 'pending_payment' || (order.status === 'pending_confirmation' && order.paymentStatus !== 'paid')"), 'paid pending-confirmation orders must not expose direct cancellation');
assert(js.includes("demoPayment: ['支付服务', '在线支付暂未开放']") && wxml.includes('在线支付暂未开放') && !wxml.includes('bindtap="finishDemoPayment"'), 'unavailable payment must be represented as a read-only production capability status, without a simulated completion action');
assert(js.includes("checkoutQuoteState !== 'ready'") && js.includes("checkoutQuoteState: 'loading', cartTotal: '--', freightTotal: '--', orderTotal: '--'") && wxml.includes("checkoutQuoteState == 'ready' ? '提交订单' : '正在计算订单金额'") && wxml.includes("checkoutQuoteState == 'ready' ? '' : 'is-disabled'"), 'checkout must block submission and suppress stale totals until the quote is ready, using customer-facing state copy');
assert(js.includes("amountLabel: order.paymentMethod === 'demo' ? '订单金额' : '实付'") && wxml.includes("{{item.amountLabel || '实付'}} ¥{{item.total}}") && !wxml.includes('不会扣款'), 'unpaid orders must use a neutral amount label without demo-only charging explanations');
assert(js.includes('const remoteCartItems = purchasedCartItems.filter') && js.includes('cartApi.removeItem(item.remoteCartItemId)') && js.includes('订单已创建，购物车同步失败'), 'remote cart rows must be removed after a successful remote order and failures must remain visible');
assert(wxss.includes('.profile-card{margin:18rpx 18rpx 0;padding:25rpx;border-radius:12rpx;background:linear-gradient(115deg,#eff5ff,#dceaff)'), 'miniapp member card must retain the web-preview light-blue brand baseline');
assert(wxml.includes('class="service-actions"') && wxml.includes('class="service-contact-action"') && wxml.includes('class="service-quick-actions"'), 'customer service must separate the contact action from navigation shortcuts');
assert(wxss.includes('.service-contact-action{width:100%;') && wxss.includes('.service-quick-actions{display:flex;margin-top:12rpx;gap:12rpx}'), 'customer service primary and secondary actions must keep distinct visual hierarchy');
assert(Array.isArray(appJson.subpackages) && appJson.subpackages.some((item) => item.root === 'package-trade' && item.pages.includes('pages/checkout/index') && item.pages.includes('pages/demo-payment/index') && item.pages.includes('pages/orders/index')), 'the transaction flow must be declared as a real mini-program subpackage');
assert(appJson.lazyCodeLoading === 'requiredComponents', 'the mini-program must enable official required-component lazy injection');
assert(!js.includes('const [result, categoryResult]'), 'catalog loading must avoid the Nightly SWC array-destructuring helper regression under lazy injection');
assert(js.includes("wx.navigateTo({ url: '/package-trade/pages/checkout/index?source=cart' })") && js.includes("/package-trade/pages/orders/index?filter="), 'core-page transaction entries must navigate to the independently loaded trade package with checkout context');
assert(checkoutPage.includes('checkoutApi.quote') && checkoutPage.includes('checkoutApi.createOrder') && checkoutPage.includes('cartApi.removeItem') && !checkoutPage.includes('orderTotal: event'), 'trade checkout must re-fetch a server quote and must not trust an amount passed through navigation');
assert(checkoutPage.includes("quoteErrorText: ''") && checkoutPage.includes('retryQuote()') && checkoutPage.includes("quoteState: 'error'") && checkoutPage.includes('_quoteRequestSeq'), 'checkout quote failures must expose a recoverable error state instead of leaving the user in an endless loading state');
assert(checkoutWxml.includes("wx:elif=\"{{quoteState == 'invalid'}}\">{{quoteErrorText}}") && checkoutWxml.includes('disabled="{{quoteState != \'ready\' || submitting}}"') && checkoutWxml.includes("quoteState == 'invalid' ? '暂不能提交订单'") && checkoutWxml.includes('bindtap="retryQuote"'), 'checkout must show the concrete invalid requirement, disable submission outside the ready state, and keep failures retryable');
assert(checkoutWxml.includes('{{item.unit}} × {{item.qty}}'), 'checkout item rows must show a readable spec and quantity expression');
assert(checkoutPage.includes('quote.items') && checkoutPage.includes('unitPriceText') && checkoutPage.includes('subtotalText') && checkoutWxml.includes('单价 ¥{{item.unitPriceText}}') && checkoutWxml.includes('item.subtotalText'), 'checkout item rows must show server-quoted unit and line prices when the quote provides them');
assert(paymentPage.includes('orders.get(orderId)') && paymentPage.includes('retry()') && paymentPage.includes('result.data.items || rawOrder.items || rawOrder.itemsSnapshot') && paymentWxml.includes('在线支付暂未开放') && !paymentWxml.includes('bindtap="finish"'), 'unavailable online payment must still reload the persisted order for review and retry, without exposing a payment-completion action');
assert(paymentWxml.includes('订单号 {{order.orderNo}}') && paymentWxml.includes('class="item-summary"') && !paymentWxml.includes('{{order.summary}}'), 'test payment confirmation must show the persisted order number and purchased item summary without a duplicate summary line');
assert(ordersPage.includes('orders.list') && ordersPage.includes('orders.cancel') && ordersPage.includes('aftersale-apply/index?orderId=') && tradeFormat.includes('itemSummary'), 'orders package must keep remote order actions, enter the structured aftersale flow, and render persisted item summaries in the subpackage');
assert(ordersPage.includes('decodeURIComponent') && ordersPage.includes('FILTERS.includes(filter)'), 'orders package must decode URL filters before applying the requested order tab');
assert(fs.existsSync(tradeFormatPath) && !fs.existsSync(obsoleteMainTradeFormatPath), 'trade-only formatting code must live inside the trade subpackage instead of inflating the main package');
const orderFilterRules = cssRules(ordersWxss, '.filters button');
const orderFilterRule = orderFilterRules[orderFilterRules.length - 1] || {};
assert(ordersWxml.includes('class="filter-track"') && cssRules(ordersWxss, '.filter-track').some((rule) => rule.display === 'flex') && orderFilterRule.flex === '1' && orderFilterRule['min-width'] === '0' && px(orderFilterRule['font-size']) >= 13, 'all order filters must share the row evenly and keep readable labels without horizontal overflow');
assert(ordersWxml.includes('class="order-items"') && ordersWxml.includes('class="order-total"') && ordersWxss.includes('.order-items{') && ordersWxss.includes('.order-total{'), 'order cards must show the purchased SKU summary separately from delivery and amount');
assert(wxml.includes('精选冻品 · 冷链严选') && wxml.includes('配送范围与费用在下单前确认') && !wxml.includes('演示素材') && wxml.includes('/assets/products/frozen-hero-v2.jpg') && wxss.includes('.banner-empty>image{width:100%;height:100%}'), 'customer-facing fallback banner must use neutral storefront copy while temporary provenance remains internal');
assert(wxml.includes('<template name="homeHeroHeader">') && wxml.includes('class="home-hero-swiper"') && (wxml.match(/<template is="homeHeroHeader" data=/g) || []).length === 2 && wxml.includes('warehouse: warehouse') && wxss.includes('.home-hero-slide{width:100%;height:100%;overflow:hidden}'), 'header and banner must be rendered together as one complete carousel slide in both remote and fallback states without losing dynamic warehouse data');
assert(js.includes('function orderCategoriesForHome(rows)') && js.includes('remoteCategories = orderCategoriesForHome(categoryRows);'), 'remote category data must use the approved shared presentation order rather than incidental database order');
assert(wxss.includes('background:#f7faff'), 'miniapp shell must share the web-preview light-blue background baseline');
assert(wxss.includes('.catalog-side{width:150rpx') && wxml.includes('<quantity-stepper wx:else quantity="{{item.cartQty || 0}}"') && wxml.includes('compact bind:change="changeQuantity"'), 'catalog proportions must preserve a readable category rail and use the shared quantity control');
assert(quantityStepperJs.includes('disabled: { type: Boolean, value: false }') && quantityStepperJs.includes('min: { type: Number, value: 0 }') && quantityStepperJs.includes('max: { type: Number, value: 999 }') && quantityStepperJs.includes('this.data.quantity < this.data.max') && quantityStepperJs.includes('this.data.quantity > this.data.min') && quantityStepperWxml.includes('disabled="{{disabled || quantity <= min}}"') && quantityStepperWxml.includes('disabled="{{disabled || quantity >= max}}"') && cssRules(quantityStepperWxss, '.quantity-stepper .step-control.is-disabled').some((rule) => Number.parseFloat(rule.opacity) < 1), 'the shared quantity control must block impossible programmatic changes and expose matching minimum and maximum disabled states');
assert(inquiriesWxml.includes('<block wx:else><view wx:for="{{rows}}"') && !inquiriesWxml.includes('wx:else wx:for='), 'the inquiry list must keep wx:else on a wrapper so the release compiler can associate it with the preceding wx:elif');
const majorScrollRule = Object.assign({}, ...cssRules(wxss, '.major-scroll'));
const majorItemRule = Object.assign({}, ...cssRules(wxss, '.major-item'));
assert(px(majorScrollRule.height) === 82 && px(majorItemRule.width) === 76 && majorItemRule.flex === '0 0 76px', 'the horizontal category strip must keep an 82px viewport and fixed 76px items instead of scaling with device width');
const catalogResultsRule = Object.assign({}, ...cssRules(wxss, '.catalog-results'));
const catalogRowRule = Object.assign({}, ...cssRules(wxss, '.catalog-row'));
assert(catalogResultsRule['min-width'] === '0' && catalogResultsRule.overflow === 'hidden' && catalogRowRule['min-width'] === '0' && catalogRowRule.overflow === 'hidden', 'catalog results and rows must allow their content columns to shrink without horizontal overflow');
const compactHostRules = ['.catalog-row quantity-stepper', '.simple-row quantity-stepper', '.deal-card quantity-stepper'].map((selector) => Object.assign({}, ...cssRules(wxss, selector)));
const detailHostRule = Object.assign({}, ...cssRules(wxss, '.detail-quantity quantity-stepper'));
assert(compactHostRules.every((rule) => px(rule.width) === 112 && px(rule['min-width']) === 112 && px(rule['max-width']) === 112 && rule.flex === '0 0 112px') && px(detailHostRule.width) === 120 && px(detailHostRule['min-width']) === 120 && px(detailHostRule['max-width']) === 120 && detailHostRule.flex === '0 0 120px', 'quantity-stepper component hosts must reserve fixed 112px compact and 120px detail widths');
assert(js.includes('const catalogChromeHeight = 191;') && js.includes('const tabbarHeight = LAYOUT.FIXED_BAR_HEIGHT;') && js.includes('windowHeight - contentTop - catalogChromeHeight - tabbarHeight - safeBottom') && js.includes("catalogHeight: `${catalogHeight}px`"), 'catalog viewport math must use the measured 191px catalog chrome and shared fixed navigation metrics with the bottom safe area');
const cartStepperRule = Object.assign({}, ...cssRules(wxss, '.cart-row>.stepper'));
const cartStepperButtonRules = cssRules(wxss, '.stepper button');
assert(cartStepperRule.display === 'flex' && px(cartStepperRule.width) >= 3 * 40 && px(cartStepperRule.width) <= 160 && cartStepperButtonRules.length && cartStepperButtonRules.every((rule) => (!rule.width || px(rule.width) >= 44) && (!rule.height || px(rule.height) >= 44)), 'cart quantity controls must reserve a bounded action column and preserve full touch targets');
assert(wxml.includes('scroll-top="{{pageScrollTop}}"') && js.includes('pageScrollTop: 0') && js.includes('pageScrollTop: 1'), 'switching between long product views must reset the shared scroll container');
assert(wxml.includes('bindchange="toggleCartSelection"') && wxml.includes('checked="{{item.selected !== false}}"') && js.includes('const selectedCartItems ='), 'cart must expose selected-item semantics instead of always checking out every row');
assert(js.includes('const previousCartItems = this.data.cartItems.map') && js.includes('const nextCartItems = this.data.cartItems.map') && js.includes('this._cartSelectionSeq') && js.includes('购物车选择更新失败'), 'cloud cart selection must update optimistically and roll back only the latest failed request');
assert(js.includes("if (!selected.length) return { selectedCartCount: 0, selectedCartTotal: money(0), selectedCartPriceReady: false"), 'cart totals must show a two-decimal zero when rows exist but none are selected instead of exposing a missing-price placeholder');
assert(js.includes("请先选择要结算的商品") && wxml.includes('{{selectedCartTotal}}'), 'checkout must be blocked when no cart item is selected and the footer must show the selected total');
assert(checkoutPage.includes('item.selected !== false') && checkoutPage.includes("wx.navigateTo({ url: '/package-trade/pages/addresses/index?select=1' })"), 'trade checkout must use selected cart rows and enter the independent address manager');
assert(js.includes("type: 'detailCheckout'") && js.includes("type: 'addFrequent'") && js.includes("continuation.type === 'addProduct'"), 'login-gated product actions must resume the original action after login');
assert(js.includes("continuation.type === 'checkout'") && js.includes('const purchasedCartItems = selectedCartItems(this.data.cartItems || [])') && js.includes('this.data.cartItems.filter((item) => !purchasedCartItems.includes(item))'), 'checkout must resume after login and remove only the selected rows after order creation');
assert(js.includes('customerWarehouseName') && checkoutPage.includes('customerWarehouseName'), 'customer-facing warehouse labels must not expose internal demo wording');
assert(wxml.includes('scroll-top="{{catalogResultsScrollTop}}"') && js.includes('resetCatalogScroll'), 'changing catalog groups or categories must reset the nested product list scroll position');
const oneRealCategory = indexInternals.fixedHomeCategories([{ label: '后台真实分类', image: '/real-category.jpg' }]);
const manyRealCategories = indexInternals.fixedHomeCategories(Array.from({ length: 14 }, (_, index) => ({ label: `分类${index}`, image: `/category-${index}.jpg` })));
const homeCategoryRule = Object.assign({}, ...cssRules(wxss, '.home-categories'));
assert.strictEqual(indexInternals.fixedHomeCategories([]).length, 0, 'an empty cloud category result must stay a truthful empty state');
assert.strictEqual(oneRealCategory.length, 10, 'a non-empty category module must be padded to exactly ten entries');
  assert.strictEqual(manyRealCategories.length, 10, 'a non-empty category module must be capped at exactly ten entries');
  assert(oneRealCategory.some((item) => item.label === '后台真实分类') && wxml.includes('wx:for="{{homeCategories}}"') && /^repeat\(5,/.test(homeCategoryRule['grid-template-columns'] || ''), 'home categories must retain real backend content in a five-column presentation');
  assert.strictEqual(homeCategoryRule['min-height'], '192px', 'home categories must reserve the same two-row height before and after remote data loads');
  assert(wxml.includes('wx:for="{{homeCategorySkeletons}}"') && wxml.includes('分类暂时无法显示'), 'loading and truthful empty states must not collapse the fixed category module');
assert(wxml.includes('{{selectedCartTotal}}') && wxml.includes("selectedCartCount > 99 ? '99+' : selectedCartCount") && wxml.includes('disabled="{{!selectedCartCount || !selectedCartPriceReady}}"'), 'quick checkout must reflect selected cart rows, bound a long visible count and disable checkout when selection or pricing is incomplete');
assert(wxml.includes('wx:for="{{checkoutItems}}"') && wxml.includes('{{checkoutItemCount}} 种 · {{checkoutItemQty}} 件'), 'the in-page checkout summary must list only selected cart rows');
assert(wxml.includes('utilityType == \'favorites\'') && wxml.includes('暂无收藏商品') && wxml.includes('已收藏的商品会显示在这里') && !wxml.includes('<block wx:elif="{{utilityType == \'favorites\'}}">\n<view class="simple-list">'), 'favorites must not present unrelated special-offer products as if they were user-saved records');
assert(js.includes('const merged = { ...mergedBase, cartQty: cartQuantityFor') && js.includes('cartQty: cartQuantityFor(pricedSelected'), 'remote detail and price refresh must preserve the current SKU quantity');
assert(js.includes('selected: current.selected !== false'), 'changing quantity must preserve an explicitly unselected remote cart row');
assert(paymentWxml.includes('bindtap="back"') && paymentPage.includes("back() { wx.redirectTo({ url: '/package-trade/pages/orders/index?filter=全部订单' })"), 'payment confirmation must return to the order list instead of reopening a stale checkout page');
assert(paymentWxss.includes('.topbar{display:flex;gap:20rpx;align-items:center;') && paymentWxss.includes('.topbar view text:first-child'), 'payment confirmation header must keep the back affordance and title hierarchy separated');
assert(ordersPage.includes('error: false') && ordersPage.includes('retry()') && ordersWxml.includes('{{error}}') && ordersWxml.includes('重新加载'), 'orders page must distinguish a failed request from a genuinely empty order list');
assert(checkoutPage.includes("const productImage = (product) => product && (product.image || product.coverUrl) || '/assets/products/placeholder.svg'") && checkoutPage.includes('productImage(item.product)') && checkoutPage.includes('result.data.areas'), 'checkout must preserve real product media and use a neutral placeholder when media is absent');
assert(js.includes("img: '/assets/products/placeholder.svg'") && !js.includes('categoryFallback ? categoryFallback.image'), 'catalog and cart must not use a category image as a misleading product-image fallback');
assert(wxml.includes('wx:if="{{detailVideoSrc || detailVideoError}}" class="detail-panel detail-video-panel"') && wxml.includes('<video wx:if="{{detailVideoSrc && !detailVideoError}}"') && wxml.includes('binderror="handleDetailVideoError"') && wxml.includes('商品视频暂时无法播放') && !wxml.includes('该商品暂未上传视频') && js.includes('detailVideoError'), 'detail pages must show controlled video or its playback error while omitting an empty no-media module');
assert(wxml.includes('wx:key="cartKey"') && wxml.includes('data-spec="{{item.selectedSpec}}"') && js.includes('cartKey: String(item.skuId || item.remoteCartItemId || item.id)') && js.includes('sameSpec'), 'rapid cart selection updates must match stable SKU/spec row IDs instead of stale object references');
assert(wxml.includes("item.tag && item.tag != '待补充'") && wxml.includes("selectedProduct.tag && selectedProduct.tag != '待补充'"), 'customer-facing cards must not expose the internal incomplete-data marker');
assert(Array.isArray(projectConfig.packOptions && projectConfig.packOptions.ignore) && projectConfig.packOptions.ignore.length === 0, 'category and fallback product assets must not be excluded from the uploaded mini-program package');
assert(projectConfig.setting && projectConfig.setting.ignoreUploadUnusedFiles === false, 'runtime-selected category and fallback product assets must be retained in the uploaded package');
assert(ordersPage.includes('actionBusyId') && ordersPage.includes('runOrderAction') && ordersWxml.includes("actionBusyId == item.id") && ordersWxml.includes('处理中'), 'order actions must be guarded against duplicate taps while a request is pending');
assert(checkoutPage.includes('loadError') && checkoutPage.includes('retryLoad') && checkoutPage.includes('收货地址读取失败') && fs.readFileSync(path.join(root, 'miniapp/package-trade/pages/checkout/index.wxml'), 'utf8').includes('重新加载'), 'checkout must expose a retry state when address, delivery or cart loading fails');
assert(checkoutPage.includes('this._orderIdempotencyKey') && checkoutPage.includes('const idempotencyKey = this._orderIdempotencyKey') && checkoutPage.includes("this._orderIdempotencyKey = ''"), 'checkout retries must reuse one idempotency key until an order is created');
assert(checkoutPage.includes('customerAddressText') && js.includes('customerAddressText') && !fs.readFileSync(path.join(root, 'miniapp/package-trade/pages/checkout/index.js'), 'utf8').includes("name: item.name || ''"), 'internal test address markers must not be shown as customer-facing address labels');
assert(js.includes('catalogApi.listAllProducts()') && js.includes('catalogApi.listAllCategories()') && !js.includes('result.rows.slice(0, LOCAL_PRODUCT_LIMIT)'), 'miniapp remote catalog must load every product and category page instead of truncating the customer catalog to the local 50-product demo scope');
assert(webPreview.includes('const LOCAL_PRODUCT_LIMIT = 50') && webPreview.includes('products.splice(LOCAL_PRODUCT_LIMIT)') && webPreview.includes('pageSize: REMOTE_PAGE_SIZE, maxPages: REMOTE_MAX_PAGES') && !webPreview.includes('result.rows.slice(0, LOCAL_PRODUCT_LIMIT)'), 'web preview must keep the local 50-product demo boundary while loading the complete remote catalog');
assert(js.includes('orderActionBusyId') && js.includes('runRemoteOrderAction') && wxml.includes("orderActionBusyId == item.id") && wxml.includes('处理中'), 'inline order actions must be guarded against duplicate taps as well as the trade subpackage');
assert(js.includes("请逐个选择数量和规格") && js.includes("const multiSku = (this.data.frequent || []).find"), 'bulk frequent add must not silently choose the first SKU when products have multiple specs');
assert(js.includes("const mineUtilityTypes = ['orders', 'coupon', 'address', 'favorites', 'trace', 'aftersale', 'invoice', 'points', 'review', 'account']") && js.includes('const utilityActiveTab = mineUtilityTypes.includes(type) ? \'mine\' : this.data.activeTab'), 'mine utility pages must keep the 我的 tab highlighted when entered from another tab');
assert(webPreview.includes('提交订单</button>') && webPreview.includes('订单已创建，可在订单页查看状态') && webPreview.includes('订单状态与配送进度') && !webPreview.includes('提交演示订单') && !webPreview.includes('交互演示订单已创建'), 'web checkout and order copy must use normal storefront language instead of exposing temporary demo wording');
assert(webPreview.includes('展示批次：待批次数据录入') && !webPreview.includes('MSX-DEMO-01') && !webPreview.includes('demo@example.com'), 'web preview must not expose fake batch or invoice data as if it were real customer data');
assert(!/(?:服务端|CloudBase|云函数|\bAPI\b|provider\s*=|mock provider)/i.test(registeredWxml) && !registeredWxml.includes('通过小面板选择数量和规格'), 'customer-facing templates must describe business outcomes and next steps without implementation or obsolete helper terminology');

console.log('interface baseline contract test: passed');
