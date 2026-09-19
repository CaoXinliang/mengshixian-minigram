const assert = require('assert');
const fs = require('fs');
const Module = require('module');
const path = require('path');

const root = path.resolve(__dirname, '..');
const js = fs.readFileSync(path.join(root, 'miniapp/pages/index/index.js'), 'utf8');
const wxml = fs.readFileSync(path.join(root, 'miniapp/pages/index/index.wxml'), 'utf8');
const wxss = fs.readFileSync(path.join(root, 'miniapp/pages/index/index.wxss'), 'utf8');
const memberWxml = fs.readFileSync(path.join(root, 'miniapp/components/member-home-panel/index.wxml'), 'utf8');
const memberWxss = fs.readFileSync(path.join(root, 'miniapp/components/member-home-panel/index.wxss'), 'utf8');
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
const paymentRecoverySource = fs.readFileSync(path.join(root, 'miniapp/modules/payment-recovery.js'), 'utf8');
const ordersPage = fs.readFileSync(path.join(root, 'miniapp/package-trade/pages/orders/index.js'), 'utf8');
const ordersWxml = fs.readFileSync(path.join(root, 'miniapp/package-trade/pages/orders/index.wxml'), 'utf8');
const ordersWxss = fs.readFileSync(path.join(root, 'miniapp/package-trade/pages/orders/index.wxss'), 'utf8');
const checkoutWxml = fs.readFileSync(path.join(root, 'miniapp/package-trade/pages/checkout/index.wxml'), 'utf8');
const tradeFormatPath = path.join(root, 'miniapp/package-trade/services/trade-format.js');
const tradeFormat = fs.readFileSync(tradeFormatPath, 'utf8');
const orderPresentation = fs.readFileSync(path.join(root, 'miniapp/modules/order-presentation.js'), 'utf8');
const orderActionSession = fs.readFileSync(path.join(root, 'miniapp/modules/order-action-session.js'), 'utf8');
const orderDetailPage = fs.readFileSync(path.join(root, 'miniapp/package-trade/pages/order-detail/index.js'), 'utf8');
const aftersaleApplyPage = fs.readFileSync(path.join(root, 'miniapp/package-trade/pages/aftersale-apply/index.js'), 'utf8');
const aftersaleSubmission = fs.readFileSync(path.join(root, 'miniapp/modules/aftersale-submission.js'), 'utf8');
const tradeMoney = require(tradeFormatPath).money;
const addressWxss = fs.readFileSync(path.join(root, 'miniapp/package-trade/pages/addresses/index.wxss'), 'utf8');
const cartStateSource = fs.readFileSync(path.join(root, 'miniapp/modules/cart-state.js'), 'utf8');
const cartControllerSource = fs.readFileSync(path.join(root, 'miniapp/modules/cart-controller.js'), 'utf8');
const addressPresentationSource = fs.readFileSync(path.join(root, 'miniapp/modules/address-presentation.js'), 'utf8');
const navigationCommonStateSource = fs.readFileSync(path.join(root, 'miniapp/modules/navigation-common-state.js'), 'utf8');
const cartPanelWxml = fs.readFileSync(path.join(root, 'miniapp/components/cart-panel/index.wxml'), 'utf8');
const cartPanelWxss = fs.readFileSync(path.join(root, 'miniapp/components/cart-panel/index.wxss'), 'utf8');
const servicePanelWxml = fs.readFileSync(path.join(root, 'miniapp/components/service-info-panel/index.wxml'), 'utf8');
const servicePanelWxss = fs.readFileSync(path.join(root, 'miniapp/components/service-info-panel/index.wxss'), 'utf8');
const obsoleteMainTradeFormatPath = path.join(root, 'miniapp/services/trade-format.js');
function cssRuleBodies(source, selector) {
  source = source.replace(/\/\*[\s\S]*?\*\//g, '');
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
const specialHeadingWxml = sourceSlice(homePageWxml, '<view wx:if="{{specialSectionEntryEnabled}}" class="section-heading home-module-entry"', '<view class="deal-list">');

assert(wxml.includes('class="wide-outline"') && wxml.includes('bindtap="showAddressForm"'), 'address entry must remain a clear interactive control');
assert(wxss.includes('.wide-outline{display:flex;align-items:center;justify-content:center;'), 'address entry text must be optically centered');
const locationButtonRule = Object.assign({}, ...cssRules(wxss, '.location-button'));
const locationNameRule = Object.assign({}, ...cssRules(wxss, '.location-name'));
const homeBrandRule = Object.assign({}, ...cssRules(wxss, '.brand'));
assert(
  !wxml.includes('class="chevron">⌄</text>') && wxml.includes('class="location-name"') && wxss.includes('.store-row{position:relative;') &&
    locationButtonRule.position === 'absolute' && locationButtonRule.left === '0' && locationButtonRule.top === '50%' && locationButtonRule.width === 'fit-content' && locationButtonRule['min-width'] === '44px' &&
    locationNameRule['min-width'] === '0' && locationNameRule.flex === '0 1 auto' &&
    homeBrandRule.position === 'absolute' && homeBrandRule.left === '50%' && homeBrandRule.top === '50%' && homeBrandRule.transform === 'translate(-50%,-50%)',
  'header must remove the trailing warehouse glyph, keep a content-width left warehouse label, and center the brand against the viewport'
);
assert(/class="location-name">\{\{warehouse\.name(?:\s*\|\|\s*'选择仓库')?\}\}<\/view>/.test(homeStoreRowWxml) && homeStoreRowWxml.includes('<view class="brand">') && homeStoreRowWxml.includes('<text>梦食鲜</text>'), 'home header must preserve the warehouse and brand text, with a readable empty-state fallback, after removing decorative marks');
assert(!homeStoreRowWxml.includes('<image') && !/(?:location-icon|brand-logo|logo-mark)/.test(homeStoreRowWxml), 'home header must not restore a location icon or circular logo');
assert(!homePageWxml.includes('class="news-strip"') && !homePageWxml.includes('data-section-type="news"') && !homePageWxml.includes('{{activityTitle}}') && !homePageWxml.includes('{{activityCopy}}') && !homePageWxml.includes('{{activityMoreText}}'), 'the approved home page must not restore the activity headline module');
assert(!homePageWxml.includes('class="banner-action"') && !homePageWxml.includes('bindtap="openBanner"') && !/\bopenBanner\s*\(/.test(js), 'the approved home banner must remain visual-only without relocating or retaining the deleted banner action');
assert(specialHeadingWxml.includes('{{specialTitle}}') && specialHeadingWxml.includes('data-section-type="special"') && specialHeadingWxml.includes('bindtap="openHomeSection"') && !specialHeadingWxml.includes('{{specialSubtitle}}') && !specialHeadingWxml.includes('<button') && !specialHeadingWxml.includes('{{specialMoreText}}') && !specialHeadingWxml.includes('更多'), 'the special-offer heading must remain compact while a visible backend module becomes the only UI-008 entry');
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
assert(checkoutWxml.includes('<text>商品小计</text>') && checkoutWxml.includes('¥{{cartTotal}}') && checkoutWxml.includes("'自提服务费' : '配送费'") && checkoutWxml.includes('¥{{freightTotal}}') && checkoutWxml.includes('<text>应付合计</text>') && checkoutWxml.includes('¥{{orderTotal}}'), 'the independent checkout must expose all three amount layers with an explicit currency marker');
const quickAmountRule = Object.assign({}, ...cssRules(wxss, '.quick-checkout .quick-amount'));
const quickCountRule = Object.assign({}, ...cssRules(wxss, '.quick-checkout .quick-count'));
const quickCountLabelRule = Object.assign({}, ...cssRules(wxss, '.quick-checkout .quick-count-label'));
const quickTotalLabelRule = Object.assign({}, ...cssRules(wxss, '.quick-checkout .quick-total-label'));
const quickCountGroupRule = Object.assign({}, ...cssRules(wxss, '.quick-checkout .quick-count-group'));
const quickSummaryRule = Object.assign({}, ...cssRules(wxss, '.quick-checkout .quick-summary-line'));
const quickCheckoutActionRule = Object.assign({}, ...cssRules(wxss, '.quick-checkout>button:last-child'));
const quickCheckoutActionFaceRule = Object.assign({}, ...cssRules(wxss, '.quick-checkout-action-face'));
assert(wxml.includes('wx:if="{{selectedCartPriceReady}}" class="quick-currency">¥</text>') && wxml.includes('class="quick-count">{{selectedCartCount}} 件</text>') && wxml.includes("selectedCartPriceReady ? '合计' + selectedCartTotal + '元' : '价格待确认'"), 'quick checkout must identify numeric currency only and preserve the full amount and count both visibly and for accessibility');
assert(wxml.includes('class="quick-count-label">已选</text>') && wxml.includes('class="quick-total-label">合计</text>') && !wxml.includes('class="quick-delivery"') && px(quickAmountRule['font-size']) === 24 && px(quickCountRule['font-size']) === 17 && px(quickCountLabelRule['font-size']) === 16 && px(quickTotalLabelRule['font-size']) === 16 && quickCountGroupRule['margin-right'] === 'auto' && quickSummaryRule['flex-wrap'] === 'wrap' && quickTotalLabelRule.border === '0', 'quick checkout must keep readable count and total typography in the prototype grouping without the redundant delivery helper');
assert(/class="quick-checkout-action(?:\s|\")/.test(wxml) && quickCheckoutActionRule.width === 'auto' && px(quickCheckoutActionRule['min-width']) === 44 && px(quickCheckoutActionRule.height) === 44 && quickCheckoutActionRule.background === 'transparent' && px(quickCheckoutActionFaceRule['min-height']) >= 38 && /^0\s+\d+px$/.test(quickCheckoutActionFaceRule.padding || '') && quickCheckoutActionFaceRule['border-radius'] === '999px', 'quick checkout must keep a compact content-width pill inside a full 44px hit target');
assert(wxss.includes('@media screen and (max-width: 374px)') && px(quickAmountRule['font-size']) >= 24 && px(quickCountLabelRule['font-size']) >= 16 && wxss.includes('.quick-checkout .quick-count-group{flex-basis:100%}'), 'quick checkout must keep the approved type size and move groups when narrow instead of shrinking the text');
assert.strictEqual(indexInternals.calculateTotals([{ price: 10, qty: 1 }, { price: 20, qty: 2 }]).cartTotal, '50.00');
assert.strictEqual(indexInternals.calculateTotals([{ price: 10, qty: 1 }, { price: null, qty: 1 }]).cartTotal, '价格待补充', 'a mixed priced/unpriced selection must never display a partial total');
assert.strictEqual(indexInternals.selectedCartSummary([{ price: 10, qty: 1 }, { price: undefined, qty: 1 }]).selectedCartPriceReady, false, 'quick checkout must remain unavailable until every selected row has a valid price');
assert.strictEqual(indexInternals.selectedCartSummary([{ price: 10, qty: 1 }, { price: 20, qty: 2 }]).selectedCartPriceReady, true);
assert(wxml.includes('disabled="{{!selectedCartCount || !selectedCartPriceReady}}"') && js.includes("if (!this.data.selectedCartPriceReady) return wx.showToast({ title: '所选商品价格待确认'"), 'quick checkout must block incomplete pricing both visually and in the handler');
assert(wxml.includes('<text>{{item.specLabel || item.unit}}</text>') && !wxml.includes('<text>{{item.unit}}</text>\n<text>{{item.specLabel'), 'catalog rows must render one canonical spec-or-package line instead of repeating both values');
const chooseSpecRules = cssRules(wxss, '.choose-spec');
const chooseSpecRule = Object.assign({}, ...chooseSpecRules);
const chooseSpecFaceRules = cssRules(wxss, '.choose-spec-face');
const chooseSpecFaceBaseRule = chooseSpecFaceRules[0] || {};
const chooseSpecFaceCompactRule = chooseSpecFaceRules[1] || {};
const disabledChooseSpecRule = Object.assign({}, ...cssRules(wxss, '.choose-spec[disabled]'));
const productCardWxml = fs.readFileSync(path.join(root, 'miniapp/components/product-card/index.wxml'), 'utf8');
const productCardWxss = fs.readFileSync(path.join(root, 'miniapp/components/product-card/index.wxss'), 'utf8');
const purchaseActionWxml = fs.readFileSync(path.join(root, 'miniapp/components/product-purchase-action/index.wxml'), 'utf8');
const purchaseActionWxss = fs.readFileSync(path.join(root, 'miniapp/components/product-purchase-action/index.wxss'), 'utf8');
assert(
  chooseSpecRules.length &&
    chooseSpecRule.display === 'flex' && chooseSpecRule['align-items'] === 'center' && chooseSpecRule['justify-content'] === 'center' &&
    chooseSpecRule.width === 'auto' && chooseSpecRule.height === '44px' && chooseSpecRule['min-width'] === '44px' && chooseSpecRule.background === 'transparent' &&
    !chooseSpecFaceBaseRule['min-width'] && px(chooseSpecFaceBaseRule['min-height']) === 34 && chooseSpecFaceBaseRule.padding === '0 13px' && px(chooseSpecFaceBaseRule['font-size']) >= 16 && chooseSpecFaceBaseRule['font-weight'] === '600' &&
    disabledChooseSpecRule.opacity === '1' && (wxml.match(/class="choose-spec quantity-first-trigger/g) || []).length === 2 && /class="choose-spec[^\n]+hover-class="control-pressed"/.test(wxml) &&
    productCardWxml.includes('class="product-card__action"') && productCardWxml.includes('<product-purchase-action') && productCardWxss.includes('height:44px') && productCardWxss.includes('min-height:44px') &&
    purchaseActionWxml.includes('class="purchase-action__select {{disabled') && purchaseActionWxss.includes('height:44px') && purchaseActionWxss.includes('white-space:normal') &&
    (wxml.match(/'选规格'/g) || []).length >= 2 && !wxml.includes('选数量'),
  'all four catalog actions must keep a 44px hit target around a readable content-width pill labelled 选规格'
);
const detailLineLabelRule = Object.assign({}, ...cssRules(wxss, '.detail-line>.detail-label'));
const detailLineValueRule = Object.assign({}, ...cssRules(wxss, '.detail-line text:last-child'));
assert(
  detailLineLabelRule.width === '72px' && detailLineLabelRule['flex-basis'] === '72px' && detailLineLabelRule['white-space'] === 'nowrap' &&
    detailLineValueRule['min-width'] === '0' && detailLineValueRule['text-align'] === 'left' && detailLineValueRule['line-height'] === '1.5' && detailLineValueRule['overflow-wrap'] === 'anywhere',
  'detail labels must keep a readable non-wrapping column while long values use the remaining width and wrap safely'
);
assert((wxml.match(/class="detail-label"/g) || []).length === 7 && !/<view wx:for="{{productReviews}}"[^>]*><text class="detail-label"/.test(wxml), 'only fixed semantic detail labels may use the 64px column; dynamic review metadata must remain fluid');
assert((wxml + cartPanelWxml).includes("!item.priceText ? 'is-locked' : (item.priceTemporary ? 'is-temporary' : '')") && wxml.includes('price-pending is-locked'), 'missing prices must take precedence over temporary styling so unavailable products remain visually distinct');
assert(wxss.includes('.price-pending.is-locked') && wxss.includes('.price-pending.is-temporary') && cartPanelWxss.includes('.price-pending.is-locked') && cartPanelWxss.includes('.price-pending.is-temporary'), 'price states must have distinct visual semantics across the page shell and isolated cart component');
for (const [source, lockedSelector, temporarySelector] of [
  [wxss, '.simple-row>view .price-pending.is-locked', '.simple-row>view .price-pending.is-temporary'],
  [cartPanelWxss, '.price-pending.is-locked', '.price-pending.is-temporary']
]) {
  const locked = Object.assign({}, ...cssRules(source, lockedSelector));
  const temporary = Object.assign({}, ...cssRules(source, temporarySelector));
  assert(locked.color === '#46566b' && temporary.color === '#e96762' && px(locked['font-size']) >= 16, 'locked prices must retain readable semantic text distinct from temporary red prices');
}
assert(js.includes('const hasPriceAmount = price =>') && js.includes('priceTemporary: Boolean(amountCent !== null && price && price.temporary)'), 'quantity-aware temporary price styling must still require a readable amount');
assert(js.includes('function hasIdentitySession(page)') && js.includes('if (this.data.loggedIn || hasIdentitySession(this)) await this.loadRemoteCatalogPrices(products);'), 'catalog pricing must use the identity-session public seam when a restored session is available before the catalog request finishes');
assert(wxml.includes('{{item.priceText || priceFallback}}') && js.includes("priceFallback: '登录后查看价格'") && js.includes('mx_price_cache'), 'logged-in catalog rows must distinguish a price request in progress from a missing login price');
assert(js.includes("priceText: amountCent === null ? ''") && js.includes("priceFallback: '暂不可购买'") && js.includes("['sold_out', 'unavailable'].includes(availability)") && js.includes("availability === 'sold_out' ? '暂时缺货'") && wxml.includes("item.presentation.action == 'disabled'") && !wxml.includes('未定价'), 'missing prices and explicit server unavailability block purchase through the shared presentation state; a legacy price does not claim known stock');
assert(js.includes("detailLimited: true, detailErrorText: '商品暂不可购买'") && wxml.includes('wx:if="{{detailLimited}}"') && wxml.includes('<text>商品暂不可购买</text>') && wxss.includes('.detail-load-state.is-limited'), 'catalog products without SKU details must retain one customer-facing non-purchasable state instead of exposing internal data status');
assert(!wxml.includes('全场满 99 元免基础配送费') && !js.includes('低至 8 折') && wxml.includes('配送范围与费用在下单前确认'), 'fallback banners must not claim unverified freight thresholds or discounts');
assert(!wxml.includes('detailVideoSrc') && !wxml.includes('detailVideoError') && !wxml.includes('商品视频'), 'ordinary product detail must omit product video entirely while the separate recipe detail may use video');
assert(js.includes('return number.toFixed(2);') && orderPresentation.includes('number.toFixed(2)') && tradeFormat.includes("require('../../modules/order-presentation')") && !js.includes("toFixed(2).replace(/\\.00$/") && !orderPresentation.includes("toFixed(2).replace(/\\.00$/"), 'cart, checkout and order totals must always render two decimal places');
assert(wxml.includes('class="order-card-actions"') && wxss.includes('.order-card-actions{display:flex;justify-content:flex-end;'), 'order actions must form a distinct, readable action row');
assert(memberWxss.includes('.member-service-grid button{width:33.333%}'), 'visible member services must form a balanced three-column grid');
assert(wxml.includes("共 {{categoryProducts.length || '0'}} 件"), 'catalog empty state must render an explicit zero count');
assert(!wxml.includes('class="deal-benefit"') && !wxml.includes('{{item.benefit}}'), 'storefront cards must omit the redundant delivery-benefit helper line and keep the purchase decision compact');
assert(!js.includes('wx.getSystemInfoSync') && js.includes('wx.getWindowInfo') && js.includes('wx.getDeviceInfo') && js.includes("const isDevToolsPhoneSimulator = String(system.platform || '').toLowerCase() === 'devtools'") && js.includes('const isDesktopWindow = !isDevToolsPhoneSimulator') && js.includes('const contentTop = isDesktopWindow ? 0 : Math.max(statusBarHeight, menuBottom)') && js.includes('system.safeArea && system.safeArea.bottom'), 'layout metrics must use current split APIs, distinguish a DevTools phone simulator from desktop WeChat, skip duplicate desktop chrome, and retain the phone capsule/safe-area path');
assert(tradeMoney(61.2) === '61.20' && tradeMoney(74) === '74.00' && tradeMoney(63.81) === '63.81', 'representative prices must keep exactly two decimal places');
const addressInputRule = Object.assign({}, ...cssRules(addressWxss, '.form-card input'));
const addressTextareaRule = Object.assign({}, ...cssRules(addressWxss, '.form-card textarea'));
assert(px(addressInputRule.height) >= 44 && px(addressInputRule['font-size']) >= 16 && px(addressTextareaRule['min-height']) >= 64 && addressTextareaRule['line-height'] === '1.5', 'address fields must retain readable fixed-pixel input and multiline space');
assert(wxml.includes('class="detail-price price-pending') && wxss.includes('.detail-product>view .detail-price{') && !wxss.includes('.detail-product>view text:last-child'), 'detail current price must use semantic styling and never inherit obsolete-price deletion');
assert(wxml.includes('selectedProduct.specs && selectedProduct.specs.length > 1') && wxml.includes('包装规格') && wxml.includes('selectedProduct.unit != selectedSpec') && !wxml.includes('<text>商品规格</text>'), 'single-SKU products must not render a redundant spec selector, while distinct packaging remains visible');
assert(wxml.includes('quantity="{{detailDraftQty}}"') && wxml.includes('{{selectedSpec}}') && !wxml.includes('已选 {{detailDraftQty}} 件') && !wxml.includes('请继续选择规格'), 'detail quantity and selected spec must remain visible without a duplicate instructional sentence');
assert(
  wxml.includes("item.specs && item.specs.length > 1") && wxml.includes('openQuantityPicker') && wxml.includes('selectQuantityPickerSpec') &&
    wxml.includes('openDetailFromQuantityPicker') && wxml.includes('addQuantityPicker') && wxml.includes('class="quantity-picker-actions"') &&
    wxml.includes('class="quantity-picker-summary"') && wxml.includes('bindtap="openDetailFromQuantityPicker"') &&
    wxml.includes('catchtouchstart="startQuantityPickerSummarySwipe"') && wxml.includes('catchtouchmove="moveQuantityPickerSummarySwipe"') &&
    wxml.includes('catchtouchend="endQuantityPickerSummarySwipe"') && wxml.includes('catchtouchcancel="cancelQuantityPickerSummarySwipe"') &&
    !wxml.includes('class="quantity-picker-detail"') && !wxml.includes('class="quantity-picker-rules"') && wxml.includes('加入购物车'),
  'multi-SKU rows must retain their purchase action while the whole product summary supports click/swipe detail entry without duplicate detail or purchase-rule controls'
);

function quantityPickerGestureContext() {
  const context = Object.assign({}, indexInternals.pageDefinition, {
    data: {
      ...indexInternals.pageDefinition.data,
      quantityPickerVisible: true,
      quantityPickerProduct: { id: 'gesture-product', unit: '1卷', specLabel: '1卷' },
      quantityPickerSpec: '6卷/件',
      quantityPickerQty: 3
    },
    openedDetail: null,
    setData(patch, callback) {
      Object.assign(this.data, patch);
      if (callback) callback.call(this);
    },
    openProductById(id, options) {
      this.openedDetail = { id, options };
    }
  });
  return context;
}

const upwardSwipe = quantityPickerGestureContext();
upwardSwipe.startQuantityPickerSummarySwipe({ touches: [{ clientX: 100, clientY: 200 }] });
upwardSwipe.moveQuantityPickerSummarySwipe({ touches: [{ clientX: 104, clientY: 154 }] });
upwardSwipe.endQuantityPickerSummarySwipe({ changedTouches: [{ clientX: 104, clientY: 140 }] });
assert.deepStrictEqual(upwardSwipe.openedDetail, { id: 'gesture-product', options: { draftQty: 3, selectedSpec: '6卷/件' } }, 'a deliberate upward summary swipe must open detail and preserve the chosen quantity/spec');

const horizontalSwipe = quantityPickerGestureContext();
horizontalSwipe.startQuantityPickerSummarySwipe({ touches: [{ clientX: 100, clientY: 200 }] });
horizontalSwipe.moveQuantityPickerSummarySwipe({ touches: [{ clientX: 170, clientY: 185 }] });
horizontalSwipe.endQuantityPickerSummarySwipe({ changedTouches: [{ clientX: 174, clientY: 135 }] });
assert.strictEqual(horizontalSwipe.openedDetail, null, 'a predominantly horizontal gesture must not navigate');

const shortSwipe = quantityPickerGestureContext();
shortSwipe.startQuantityPickerSummarySwipe({ touches: [{ clientX: 100, clientY: 200 }] });
shortSwipe.endQuantityPickerSummarySwipe({ changedTouches: [{ clientX: 101, clientY: 172 }] });
assert.strictEqual(shortSwipe.openedDetail, null, 'a short upward drag must not navigate accidentally');

const downwardSwipe = quantityPickerGestureContext();
downwardSwipe.startQuantityPickerSummarySwipe({ touches: [{ clientX: 100, clientY: 160 }] });
downwardSwipe.endQuantityPickerSummarySwipe({ changedTouches: [{ clientX: 100, clientY: 230 }] });
assert.strictEqual(downwardSwipe.openedDetail, null, 'a downward drag must not navigate');
assert.strictEqual(downwardSwipe.data.quantityPickerVisible, false, 'a deliberate downward drag must close the product sheet');

const cancelledSwipe = quantityPickerGestureContext();
cancelledSwipe.startQuantityPickerSummarySwipe({ touches: [{ clientX: 100, clientY: 200 }] });
cancelledSwipe.cancelQuantityPickerSummarySwipe();
cancelledSwipe.endQuantityPickerSummarySwipe({ changedTouches: [{ clientX: 100, clientY: 120 }] });
assert.strictEqual(cancelledSwipe.openedDetail, null, 'a cancelled gesture must not navigate');
assert(!wxml.includes("utilityType == 'checkout'") && !wxml.includes("utilityType == 'demoPayment'") && !js.includes('placeRemoteOrder') && !js.includes('loadRemoteQuote'), 'the main page must not retain a second checkout or payment implementation');
assert(wxml.includes('<button wx:if="{{!frequentHasMultiSku}}" bindtap="addFrequent">全部加购</button>') && wxml.includes('<text wx:else class="frequent-spec-hint">逐个选择</text>') && wxml.includes('catchtap="openQuantityPicker"') && js.includes('const hasMultiSku = items =>'), 'frequent bulk-add must disappear when any row requires an explicit SKU choice, while per-row selection remains available');
const selectedSkuProduct = indexInternals.productWithPrice({
  specLabel: '旧规格',
  unit: '旧包装',
  selectedSkuId: 'sku-old',
  skuOptions: [
    { id: 'sku-a', label: '500g', packageUnit: '12包/件' },
    { id: 'sku-b', label: '1kg', packageUnit: '6包/件' }
  ]
}, { 'sku-b': { amountCent: 1280, availability: 'available' } }, '1kg');
assert.strictEqual(selectedSkuProduct.specLabel, '1kg');
assert.strictEqual(selectedSkuProduct.unit, '6包/件');
assert.strictEqual(selectedSkuProduct.priceUnitLabel, '件', '12包/件 describes a case price, not a price per inner bag');
for (const [packageUnit, expected] of [['1袋', '袋'], ['220g/盅', '盅'], ['1件*30斤*15包', '件'], ['500g', '500g'], ['', ''], ['包装待补充', '']]) {
  const item = indexInternals.productWithPrice({skuOptions: [{id: 'unit-sku', label: '规格', packageUnit}]}, {'unit-sku': {amountCent: 1000, availability: 'available'}}, '规格');
  assert.strictEqual(item.priceUnitLabel, expected, `price unit for ${packageUnit || 'missing data'} must not invent 件`);
}
const soldOutProduct = indexInternals.productWithPrice({skuOptions: [{id: 'sold-out-sku', label: '缺货规格', packageUnit: '包'}]}, {'sold-out-sku': {amountCent: 1200, availability: 'sold_out', availabilityReason: 'out_of_stock'}}, '缺货规格');
assert.strictEqual(soldOutProduct.priceUnavailable, true, 'a sold-out SKU must disable purchase even when it still has a visible price');
assert.strictEqual(soldOutProduct.availabilityText, '暂时缺货', 'a sold-out SKU must explain the state instead of using a generic unavailable label');
const unavailableProduct = indexInternals.productWithPrice({skuOptions: [{id: 'unavailable-sku', label: '不可售规格', packageUnit: '包'}]}, {'unavailable-sku': {availability: 'unavailable', availabilityReason: 'price_unavailable'}}, '不可售规格');
assert.strictEqual(unavailableProduct.priceUnavailable, true);
assert.strictEqual(unavailableProduct.availabilityText, '暂不可售');
const missingRuleProduct = indexInternals.productWithPrice({skuOptions: [{id: 'missing-rule-sku', label: '规则缺失', packageUnit: '包', purchaseRuleMissingMinimum: true, purchaseRuleMissingMultiple: true}]}, {'missing-rule-sku': {amountCent: 1200, availability: 'available'}}, '规则缺失', 1, {loggedIn: true});
assert.strictEqual(missingRuleProduct.presentation.statusCode, 'rule_unavailable', 'missing server purchase rules must not be silently treated as one-unit rules');
const failedPriceProduct = indexInternals.productWithPrice({skuOptions: [{id: 'failed-price-sku', label: '报价失败', packageUnit: '包'}]}, {}, '报价失败', 1, {loggedIn: true, priceErrorSkuIds: new Set(['failed-price-sku'])});
assert.strictEqual(failedPriceProduct.presentation.statusCode, 'request_failed', 'transport failure must remain distinct from a valid no-price result');
assert(
  (wxml.match(/presentation\.action == 'disabled'/g) || []).length >= 8 &&
    ((wxml.match(/loggedIn \? item.specSelectionText/g) || []).length + (wxml.match(/loggedIn \? \(item.specSelectionText/g) || []).length) === 5,
  'SKU purchase actions use the shared presentation state, while all five catalog and campaign entries keep the whole-product selection label'
);
assert(!wxml.includes("priceUnitLabel || '件'"), 'unknown packaging must not be hard-coded to a per-piece price');
assert.strictEqual(selectedSkuProduct.selectedSkuId, 'sku-b');
assert(js.includes('const selectedPriced = selectedBase ? productWithPrice(selectedBase') && js.includes('selectedProduct = selectedPriced ? { ...selectedPriced'), 'cart refresh must keep the detail page on the currently selected SKU');
assert(cartControllerSource.includes('const baseProduct = options.findProduct(id)') && cartControllerSource.includes('options.productWithPrice(baseProduct, spec, 1)'), 'adding a selected SKU must carry that SKU\'s display fields and price into the cart instead of reverting to the first SKU');
assert(cartControllerSource.includes('remoteCartItemId: saved.data.item._id, selected: effectiveSelected') && cartControllerSource.includes('existing.selected = true'), 're-adding an existing SKU must select it again before the user proceeds to checkout');
assert(orderPresentation.includes("paymentStatus: order.paymentStatus || ''") && orderPresentation.includes("order.paymentMethod === 'credit'") && orderPresentation.includes("credit_reserved") && orderPresentation.includes("credit_invoiced"), 'refund actions must follow the server contract for paid and eligible credit orders while the aftersale summary is known');
assert(orderPresentation.includes("canCancel: order.status === 'pending_payment' || (order.status === 'pending_confirmation' && order.paymentStatus !== 'paid')"), 'paid pending-confirmation orders must not expose direct cancellation');
assert(paymentRecoverySource.includes('非真实支付、非真实到账，不会产生扣款') && !wxml.includes('bindtap="finishDemoPayment"'), 'test payment must state its boundary in the dedicated trade page and expose no legacy main-page completion action');
assert(checkoutPage.includes("this.data.quoteState !== 'ready'") && checkoutWxml.includes("quoteState != 'ready' || submitting") && checkoutWxml.includes("quoteState == 'ready' ? '提交订单'") && checkoutWxml.includes("'正在计算订单金额'"), 'checkout must block submission and suppress stale totals until the independent trade quote is ready');
assert(js.includes("amountLabel: order.paymentMethod === 'demo' ? '订单金额' : '实付'") && wxml.includes("{{item.amountLabel || '实付'}} ¥{{item.total}}") && !wxml.includes('不会扣款'), 'unpaid orders must use a neutral amount label without demo-only charging explanations');
assert(checkoutPage.includes('cartApi.removeItem(item.id)') && checkoutPage.includes('订单已创建，购物车同步失败'), 'remote cart rows must be removed by the independent checkout after a successful order and failures must remain visible');
assert(memberWxml.includes('class="member-profile') && memberWxss.includes('background:#176bd5'), 'member identity must use the approved Pixso blue account card inside the isolated component');
assert(wxml.includes('<service-info-panel') && servicePanelWxml.includes('class="primary"') && servicePanelWxml.includes('class="actions"'), 'customer service must use the extracted component and separate the contact action from navigation shortcuts');
assert(servicePanelWxss.includes('.primary{') && servicePanelWxss.includes('.actions{display:flex'), 'customer service primary and secondary actions must keep distinct visual hierarchy');
assert(Array.isArray(appJson.subpackages) && appJson.subpackages.some((item) => item.root === 'package-trade' && item.pages.includes('pages/checkout/index') && item.pages.includes('pages/demo-payment/index') && item.pages.includes('pages/orders/index')), 'the transaction flow must be declared as a real mini-program subpackage');
assert(appJson.lazyCodeLoading === 'requiredComponents', 'the mini-program must enable official required-component lazy injection');
assert(!js.includes('const [result, categoryResult]'), 'catalog loading must avoid the Nightly SWC array-destructuring helper regression under lazy injection');
assert(js.includes("wx.navigateTo({ url: '/package-trade/pages/checkout/index?source=cart' })") && js.includes("/package-trade/pages/orders/index?filter="), 'core-page transaction entries must navigate to the independently loaded trade package with checkout context');
assert(checkoutPage.includes('checkoutApi.quote') && checkoutPage.includes('checkoutApi.createOrder') && checkoutPage.includes('cartApi.removeItem') && !checkoutPage.includes('orderTotal: event'), 'trade checkout must re-fetch a server quote and must not trust an amount passed through navigation');
assert(checkoutWxml.includes("quoteState == 'error'") && checkoutWxml.includes('bindtap="retryQuote"') && checkoutWxml.includes('订单金额暂时无法计算'), 'checkout quote failures must expose a recoverable error state instead of leaving the user in an endless loading state');
assert(checkoutWxml.includes("wx:elif=\"{{quoteState == 'invalid'}}\">{{quoteErrorText}}") && checkoutWxml.includes("quoteState != 'ready' || submitting") && checkoutWxml.includes("quoteState == 'invalid' ? '暂不能提交订单'") && checkoutWxml.includes('bindtap="retryQuote"'), 'checkout must show the concrete invalid requirement, disable submission outside the ready state, and keep failures retryable');
assert(checkoutWxml.includes('{{item.unit}} × {{item.qty}}'), 'checkout item rows must show a readable spec and quantity expression');
assert(checkoutWxml.includes('单价 ¥{{item.unitPriceText}}') && checkoutWxml.includes('item.subtotalText') && checkoutWxml.includes("quoteState == 'ready'"), 'checkout item rows must show server-quoted unit and line prices only when the quote is ready');
assert(paymentPage.includes('orders.get(orderId)') && paymentPage.includes('retry()') && paymentPage.includes('result.data.items || rawOrder.items || rawOrder.itemsSnapshot') && paymentRecoverySource.includes('非真实支付、非真实到账，不会产生扣款') && paymentWxml.includes('<payment-recovery-panel') && !paymentPage.includes('requestPayment'), 'test payment must reload the persisted order, state its non-payment boundary, and never invoke real payment');
assert(paymentWxml.includes('<text>订单号</text>') && paymentWxml.includes('{{order.orderNo || order.id}}') && paymentWxml.includes('class="item-summary"') && !paymentWxml.includes('{{order.summary}}'), 'test payment confirmation must show the persisted order number and purchased item summary without a duplicate summary line');
assert(ordersPage.includes('orders.list') && ordersPage.includes('orders.cancel') && ordersPage.includes('aftersale-apply/index?orderId=') && orderPresentation.includes('itemSummary'), 'orders package must keep remote order actions, enter the structured aftersale flow, and render persisted item summaries in the subpackage');
assert(ordersPage.includes('resolveOrderAction') && orderDetailPage.includes('resolveOrderAction') && orderActionSession.includes('async function resolve'), 'unknown order actions must expose a page recovery path backed by the action session');
assert(aftersaleApplyPage.includes('querySubmissionResult') && aftersaleSubmission.includes('async function reconcile'), 'unknown aftersale submissions must expose an explicit reconciliation path');
assert(ordersPage.includes('decodeURIComponent') && ordersPage.includes('FILTERS.includes(filter)'), 'orders package must decode URL filters before applying the requested order tab');
assert(fs.existsSync(tradeFormatPath) && !fs.existsSync(obsoleteMainTradeFormatPath), 'trade-only formatting code must live inside the trade subpackage instead of inflating the main package');
const orderFilterRules = cssRules(ordersWxss, '.filters button');
const orderFilterRule = Object.assign({}, ...orderFilterRules);
assert(ordersWxml.includes('class="filter-track"') && cssRules(ordersWxss, '.filter-track').some((rule) => rule.display === 'flex') && orderFilterRule.flex === '1' && orderFilterRule['min-width'] === '0' && px(orderFilterRule['font-size']) >= 13, 'all order filters must share the row evenly and keep readable labels without horizontal overflow');
assert(ordersWxml.includes('class="order-items"') && ordersWxml.includes('class="order-total"') && ordersWxss.includes('.order-items{') && ordersWxss.includes('.order-total{'), 'order cards must show the purchased SKU summary separately from delivery and amount');
assert(wxml.includes('精选冻品 · 冷链严选') && wxml.includes('配送范围与费用在下单前确认') && !wxml.includes('演示素材') && wxml.includes('/assets/products/frozen-hero-v2.jpg') && wxss.includes('.banner-empty>image{width:100%;height:100%}'), 'customer-facing fallback banner must use neutral storefront copy while temporary provenance remains internal');
assert(wxml.includes('<template name="homeHeroHeader">') && wxml.includes('class="home-hero-swiper"') && (wxml.match(/<template is="homeHeroHeader" data=/g) || []).length === 1 && wxml.indexOf('<template is="homeHeroHeader" data=') < wxml.indexOf('<swiper wx:if="{{bannerItems.length}}"') && wxml.includes('warehouse: warehouse'), 'Pixso home header must retain dynamic warehouse/search state outside the rotating banner');
assert(js.includes('function orderCategoriesForHome(rows)') && js.includes('remoteCategories = orderCategoriesForHome(categoryRows);'), 'remote category data must use the approved shared presentation order rather than incidental database order');
assert(wxss.includes('background:#f7faff'), 'miniapp shell must share the web-preview light-blue background baseline');
assert(wxss.includes('.catalog-side{width:76px') && wxml.includes('<quantity-stepper wx:else quantity="{{item.cartQty || 0}}"') && wxml.includes('compact bind:change="changeQuantity"'), 'catalog proportions must preserve a readable category rail and use the shared quantity control');
assert(/disabled:\s*\{\s*type:\s*Boolean,\s*value:\s*false/.test(quantityStepperJs) && quantityStepperJs.includes('min: { type: Number, value: 0 }') && quantityStepperJs.includes('max: { type: Number, value: 999 }') && quantityStepperJs.includes('allowZero: { type: Boolean, value: false }') && quantityStepperJs.includes('this.data.quantity < this.data.max') && quantityStepperJs.includes('this.data.quantity > this.data.min || (this.data.allowZero && this.data.quantity === this.data.min)') && quantityStepperWxml.includes('quantity == min && !allowZero') && quantityStepperWxml.includes('disabled="{{disabled || quantity >= max}}"') && cssRules(quantityStepperWxss, '.quantity-stepper .step-control.is-disabled').some((rule) => Number.parseFloat(rule.opacity) < 1), 'the shared quantity control must block impossible changes while explicitly separating zero-removal from the positive minimum');
assert(inquiriesWxml.includes('<block wx:else><view wx:for="{{rows}}"') && !inquiriesWxml.includes('wx:else wx:for='), 'the inquiry list must keep wx:else on a wrapper so the release compiler can associate it with the preceding wx:elif');
const majorScrollRule = Object.assign({}, ...cssRules(wxss, '.major-scroll'));
const majorItemRule = Object.assign({}, ...cssRules(wxss, '.major-item'));
assert(px(majorScrollRule.height) === 82 && majorItemRule.width === '20vw' && majorItemRule['max-width'] === '96px' && majorItemRule.flex === '0 0 20vw', 'the Pixso category strip must keep exactly five readable items in the viewport while wider lists remain horizontally scrollable');
const catalogResultsRule = Object.assign({}, ...cssRules(wxss, '.catalog-results'));
const catalogRowRule = Object.assign({}, ...cssRules(wxss, '.catalog-row'));
const catalogChoiceRule = Object.assign({}, ...cssRules(wxss, '.catalog-row>.choose-spec'));
const catalogSpecRule = Object.assign({}, ...cssRules(wxss, '.catalog-row>view .catalog-item-spec'));
const sideItemRule = Object.assign({}, ...cssRules(wxss, '.side-item'));
const catalogSideRule = Object.assign({}, ...cssRules(wxss, '.catalog-side'));
assert(catalogSideRule.height === '100%', 'vertical category scroll-view needs an explicit constrained height, not auto with only max-height');
const catalogStepperHost = Object.assign({}, ...cssRules(wxss, '.catalog-row quantity-stepper'));
const compactStepper = Object.assign({}, ...cssRules(quantityStepperWxss, '.quantity-stepper.is-compact'));
assert(px(catalogChoiceRule.width) === px(compactStepper.width) && px(catalogChoiceRule['min-width']) === 120 && px(catalogChoiceRule['max-width']) === 120 && px(catalogStepperHost.width) === 120, 'choose-spec and its stepper host must match the actual 120px compact component');
assert(catalogSpecRule['align-self'] === 'flex-start' && catalogSpecRule.width === 'fit-content' && catalogSpecRule['max-width'] === '100%', 'spec pill must wrap its text at a fixed left anchor rather than stretch');
for (const selector of ['.catalog-row>view text:nth-child(2)', '.catalog-row>view text:nth-child(3)']) {
  assert(cssRules(wxss, selector).every(rule => rule['white-space'] !== 'nowrap' && rule['text-overflow'] !== 'ellipsis'), 'positional category text rules must not override wrapping of specification, price or login hint');
}
const catalogRetryRule = Object.assign({}, ...cssRules(wxss, '.catalog-empty button'));
const catalogInlineRetryRule = Object.assign({}, ...cssRules(wxss, '.catalog-inline-status button'));
assert(catalogInlineRetryRule.width === 'fit-content' && catalogInlineRetryRule.flex === 'none' && px(catalogInlineRetryRule['min-height']) >= 44, '续载重试应按文字包裹，不随整行拉长，仍保留44px触区');
const categoryBlock = wxml.split('<block wx:elif="{{page == \'category\'}}">')[1].split('<block wx:elif="{{page == \'mealIdeas\'}}">')[0];
const categoryHeading = Object.assign({}, ...cssRules(wxss, '.catalog-head'));
const categoryTitle = Object.assign({}, ...cssRules(wxss, '.catalog-head>.catalog-title'));
assert(categoryBlock.includes('class="sub-head catalog-head"') && categoryBlock.includes("class=\"catalog-title\">{{searchMode ? '搜索商品' : '商品分类'}}</text>") && !categoryBlock.includes('冷链送到家') && categoryHeading.display === 'grid' && categoryHeading['grid-template-columns'] === '104px minmax(0,1fr) 104px' && categoryTitle['text-align'] === 'center', 'approved category/search title must remain centered between equal location and native-capsule zones with no promotional subtitle');
assert(categoryBlock.includes('wx:if="{{searchMode}}" class="back-control"') && categoryBlock.includes('wx:else class="catalog-location"') && !categoryBlock.includes('aria-label="返回首页"'), 'search mode keeps its return action while the normal category tab uses the Pixso location chip without a duplicate back control');
const categorySearch = Object.assign({}, ...cssRules(wxss, '.catalog-search'));
const categorySearchField = Object.assign({}, ...cssRules(wxss, '.catalog-search-field'));
const categorySearchFace = Object.assign({}, ...cssRules(wxss, '.catalog-search-action-face'));
assert(categoryBlock.includes('class="catalog-search-field"') && categorySearch.background === 'transparent' && categorySearch.gap === '8px' && categorySearchField.background === '#fff' && px(categorySearchField['border-radius']) >= 20 && categorySearchField['min-width'] === '0' && px(categorySearchFace['border-radius']) >= 20, 'approved category search must have a shrinkable white rounded input separate from its blue pill action, not a shared grey rectangle');
assert(categoryBlock.includes('bindinput="onSearchInput" bindconfirm="startSearch"') && categoryBlock.includes('bindtap="startSearch"') && categoryBlock.includes('bindtap="clearSearchKeyword"') && px(Object.assign({}, ...cssRules(wxss, '.catalog-search button')).height) >= 44, 'search restyling must retain input, keyboard confirmation, initial submission and search-mode clear with a 44px touch target');
for (const [amountCent, expected] of [[999999, false], [1000000, true], [12345678, true]]) {
  const priced = indexInternals.productWithPrice({ skuOptions: [{ id: 'wide-price', label: '盒' }] }, { 'wide-price': { amountCent } }, '盒');
  assert.strictEqual(priced.catalogPriceWide, expected, 'long amounts need their own card row without changing ordinary prices');
}
assert.strictEqual(indexInternals.productWithPrice({ skuOptions: [{ id: 'no-price', label: '盒' }] }, {}, '盒').catalogPriceWide, false, 'a missing price must not enable the wide numeric layout');
const previousWidePrice = indexInternals.productWithPrice({ skuOptions: [{ id: 'wide-price', label: '盒' }] }, { 'wide-price': { amountCent: 12345678 } }, '盒');
assert.strictEqual(indexInternals.productWithPrice(previousWidePrice, { 'wide-price': { amountCent: 990 } }, '盒').catalogPriceWide, false, 'price refresh must reset a previous wide layout when the new amount is short');
assert.strictEqual(indexInternals.productWithPrice(previousWidePrice, {}, '盒').catalogPriceWide, false, 'losing price access must remove the numeric wide layout');
assert(/class="catalog-wide-price[^>]*bindtap="openProduct"[^>]*data-id="\{\{item.id\}\}"/.test(wxml), 'the wide price must preserve the product-opening tap target');
assert(wxml.includes('catalog-row {{item.catalogPriceWide ? \'has-wide-price\' : \'\'}}') && wxml.includes('wx:if="{{!item.catalogPriceWide}}" class="catalog-item-price') && wxml.includes('wx:if="{{item.catalogPriceWide}}" class="catalog-wide-price'), 'wide and regular prices must be mutually exclusive');
const wideCardRule = Object.assign({}, ...cssRules(wxss, '.catalog-row.has-wide-price'));
const widePriceRule = Object.assign({}, ...cssRules(wxss, '.catalog-row>.catalog-wide-price'));
assert(wideCardRule['grid-template-areas'] === '"catalog-image catalog-copy" "catalog-price catalog-price" "catalog-action catalog-action"' && widePriceRule['grid-area'] === 'catalog-price' && widePriceRule['word-break'] === 'normal', 'large prices must use the full card width while keeping the action right anchored');
assert(catalogRetryRule.width === 'fit-content' && catalogRetryRule['max-width'] === '100%' && px(catalogRetryRule['min-height']) >= 44 && catalogRetryRule.flex === 'none', 'category error recovery must use a text-sized button while preserving its touch target');
// The loading state has a single text node, so both first/last-child rules apply.
const loadingTextRule = Object.assign({}, ...cssRules(wxss, '.catalog-empty.is-loading text:first-child'), ...cssRules(wxss, '.catalog-empty.is-loading text:last-child'));
const loadingOpacity = Number(wxss.match(/@keyframes catalog-status-breathe\{0%,100%\{opacity:([.\d]+)/)[1]);
const rgb = hex => hex.slice(1).match(/../g).map(channel => parseInt(channel, 16) / 255);
const luminance = channels => channels.map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
const loadingBackground = rgb('#f5f8fc');
const faintestLoadingText = rgb(loadingTextRule.color).map((channel, index) => channel * loadingOpacity + loadingBackground[index] * (1 - loadingOpacity));
const loadingContrast = (luminance(loadingBackground) + 0.05) / (luminance(faintestLoadingText) + 0.05);
assert(loadingContrast >= 4.5, `loading text must remain readable throughout animation (contrast ${loadingContrast.toFixed(2)})`);
assert(sideItemRule.border === '0' && catalogRowRule.border === '0' && catalogSideRule.background === '#fff', 'Pixso category layers must use a white rail and white product cards on the light page instead of drawing outlined pills and cards');
assert(catalogResultsRule['min-width'] === '0' && catalogResultsRule.overflow === 'hidden' && catalogRowRule['min-width'] === '0' && catalogRowRule.display === 'grid' && catalogRowRule['grid-template-columns'].includes('minmax(0,1fr)'), 'catalog results and rows must use shrinkable columns without clipping readable row content');
const compactHostRules = ['.catalog-row quantity-stepper', '.simple-row quantity-stepper', '.deal-card quantity-stepper'].map((selector) => Object.assign({}, ...cssRules(wxss, selector)));
const detailHostRule = Object.assign({}, ...cssRules(wxss, '.detail-quantity quantity-stepper'));
assert(compactHostRules.every((rule, index) => px(rule.width) === (index === 0 ? 120 : 112)) && px(detailHostRule.width) === 120 && px(detailHostRule['min-width']) === 120 && px(detailHostRule['max-width']) === 120 && detailHostRule.flex === '0 0 120px', 'category host must fit its real component without changing unrelated compact surfaces');
assert(js.includes('const catalogChromeHeight = 56 + 48 + 82 + Math.ceil(10 * windowWidth / 750);') && js.includes('const tabbarHeight = LAYOUT.FIXED_BAR_HEIGHT;') && js.includes('windowHeight - contentTop - catalogChromeHeight - tabbarHeight - safeBottom') && js.includes("catalogHeight: `${catalogHeight}px`"), 'catalog viewport must include header, search, the five-item Pixso strip and responsive search margin');
const cartStepperRule = Object.assign({}, ...cssRules(cartPanelWxss, '.cart-row>.stepper'));
const cartStepperButtonRules = cssRules(quantityStepperWxss, '.quantity-stepper .step-control');
assert(cartStepperRule.display === 'flex' && px(cartStepperRule.width) >= 3 * 40 && px(cartStepperRule.width) <= 160 && cartStepperButtonRules.length && cartStepperButtonRules.every((rule) => (!rule.width || px(rule.width) >= 44) && (!rule.height || px(rule.height) >= 44)), 'cart quantity controls must reserve a bounded action column and preserve full touch targets');
assert(wxml.includes('scroll-top="{{pageScrollTop}}"') && navigationCommonStateSource.includes('pageMotionPatch') && navigationCommonStateSource.includes('Number(currentScrollTop || 0) === 0 ? 1 : 0'), 'switching between long product views must reset the shared scroll container through the navigation seam');
assert(cartPanelWxml.includes('bindchange="toggleRow"') && cartPanelWxml.includes('checked="{{item.selected !== false}}"') && js.includes('const selectedCartItems ='), 'cart must expose selected-item semantics through the isolated component instead of always checking out every row');
assert(cartControllerSource.includes('const previousSelected = item.selected !== false') && cartControllerSource.includes('const next = currentItems().map') && cartControllerSource.includes('selectionSeqByKey') && cartControllerSource.includes('购物车选择更新失败'), 'cloud cart selection must update optimistically and roll back the latest failed request per cart row');
assert(cartStateSource.includes("if (!selected.length) return { selectedCartCount: 0, selectedCartTotal: money(0), selectedCartPriceReady: false"), 'cart totals must show a two-decimal zero when rows exist but none are selected instead of exposing a missing-price placeholder');
assert(js.includes("请先选择要结算的商品") && cartPanelWxml.includes('{{selectedCartTotal}}'), 'checkout must be blocked when no cart item is selected and the isolated cart footer must show the selected total');
assert(checkoutPage.includes('item.selected !== false') && checkoutPage.includes("url: '/package-trade/pages/addresses/index?select=1'") && checkoutPage.includes("eventChannel.on('addressSelected'") && checkoutPage.includes('applySelectedAddress'), 'trade checkout must use selected cart rows, enter the independent address manager and receive the one-time checkout selection');
assert(js.includes("type: 'detailCheckout'") && js.includes("type: 'addFrequent'") && js.includes("continuation.type === 'addProduct'"), 'login-gated product actions must resume the original action after login');
assert(js.includes("continuation.type === 'checkout'") && js.includes("wx.navigateTo({ url: '/package-trade/pages/checkout/index?source=cart' })") && checkoutPage.includes('Promise.all(cartItems.map'), 'checkout must resume after login and let the independent trade page clear only its submitted rows');
assert(js.includes('customerWarehouseName') && checkoutPage.includes('customerWarehouseName'), 'customer-facing warehouse labels must not expose internal demo wording');
assert(wxml.includes('scroll-top="{{catalogResultsScrollTop}}"') && js.includes('resetCatalogScroll'), 'changing catalog groups or categories must reset the nested product list scroll position');
const oneRealCategory = indexInternals.fixedHomeCategories([{ label: '后台真实分类', image: '/real-category.jpg' }]);
const manyRealCategories = indexInternals.fixedHomeCategories(Array.from({ length: 14 }, (_, index) => ({ label: `分类${index}`, image: `/category-${index}.jpg` })));
const homeCategoryRule = Object.assign({}, ...cssRules(wxss, '.home-categories'));
assert.strictEqual(indexInternals.fixedHomeCategories([]).length, 0, 'an empty cloud category result must stay a truthful empty state');
assert.strictEqual(oneRealCategory.length, 10, 'a non-empty category module must be padded to exactly ten entries');
  assert.strictEqual(manyRealCategories.length, 10, 'a non-empty category module must be capped at exactly ten entries');
  assert(oneRealCategory.some((item) => item.label === '后台真实分类') && wxml.includes('wx:for="{{homeCategories}}"') && /^repeat\(5,/.test(homeCategoryRule['grid-template-columns'] || ''), 'home categories must retain real backend content in a five-column presentation');
  assert.strictEqual(homeCategoryRule['min-height'], '150px', 'home categories must reserve the same compact two-row height before and after remote data loads');
  assert(wxml.includes('wx:for="{{homeCategorySkeletons}}"') && wxml.includes('分类暂时无法显示'), 'loading and truthful empty states must not collapse the fixed category module');
assert(cartPanelWxml.includes('{{selectedCartTotal}}') && wxml.includes('class="quick-count">{{selectedCartCount}} 件</text>') && wxml.includes('aria-disabled="{{!selectedCartCount || !selectedCartPriceReady}}"'), 'cart and quick checkout must reflect the full selected count and total and expose a disabled checkout state when selection or pricing is incomplete');
assert(!wxml.includes('wx:for="{{checkoutItems}}"') && checkoutWxml.includes('wx:for="{{cartItems}}"') && checkoutWxml.includes('{{cartItemQty}} 件'), 'checkout rows must exist only in the independent trade page');
assert(wxml.includes('utilityType == \'favorites\'') && wxml.includes('暂无收藏商品') && wxml.includes('已收藏的商品会显示在这里') && !wxml.includes('<block wx:elif="{{utilityType == \'favorites\'}}">\n<view class="simple-list">'), 'favorites must not present unrelated special-offer products as if they were user-saved records');
assert(js.includes('const merged = { ...mergedBase, cartQty: cartQuantityFor') && js.includes('cartQty: cartQuantityFor(pricedSelected'), 'remote detail and price refresh must preserve the current SKU quantity');
assert(cartControllerSource.includes('selected: current.selected !== false'), 'changing quantity must preserve an explicitly unselected remote cart row');
assert(paymentWxml.includes('bindtap="back"') && paymentPage.includes("back() { wx.redirectTo({ url: '/package-trade/pages/orders/index?filter=全部订单' })"), 'payment confirmation must return to the order list instead of reopening a stale checkout page');
assert(/<responsive-topbar\b[^>]*title="订单结果"[^>]*bind:back="back"/.test(paymentWxml), 'payment confirmation must retain the shared accessible back header');
assert(ordersPage.includes('error: false') && ordersPage.includes('retry()') && ordersWxml.includes('{{error}}') && ordersWxml.includes('重新加载'), 'orders page must distinguish a failed request from a genuinely empty order list');
assert(checkoutPage.includes("const productImage = (product) => product && (product.image || product.coverUrl) || '/assets/products/placeholder.svg'") && checkoutPage.includes('productImage(item.product)') && checkoutPage.includes('result.data.areas'), 'checkout must preserve real product media and use a neutral placeholder when media is absent');
assert(js.includes("img: '/assets/products/placeholder.svg'") && !js.includes('categoryFallback ? categoryFallback.image'), 'catalog and cart must not use a category image as a misleading product-image fallback');
assert(!wxml.includes('detailVideoSrc') && !wxml.includes('detailVideoError') && !wxml.includes('handleDetailVideoError') && !js.includes('handleDetailVideoError'), 'ordinary product detail must not retain obsolete product-video state or handlers');
assert(cartPanelWxml.includes('wx:key="cartKey"') && cartPanelWxml.includes('data-spec="{{item.selectedSpec}}"') && cartStateSource.includes('cartKey: String(item.skuId || item.remoteCartItemId || item.id)') && cartControllerSource.includes('sameSpec'), 'rapid cart selection updates must match stable SKU/spec row IDs instead of stale object references');
assert(wxml.includes("item.tag && item.tag != '待补充'") && wxml.includes("selectedProduct.tag && selectedProduct.tag != '待补充'"), 'customer-facing cards must not expose the internal incomplete-data marker');
assert(Array.isArray(projectConfig.packOptions && projectConfig.packOptions.ignore) && projectConfig.packOptions.ignore.length === 0, 'category and fallback product assets must not be excluded from the uploaded mini-program package');
assert(projectConfig.setting && projectConfig.setting.ignoreUploadUnusedFiles === false, 'runtime-selected category and fallback product assets must be retained in the uploaded package');
assert(ordersPage.includes('actionBusyId') && ordersPage.includes('runOrderAction') && ordersWxml.includes("actionBusyId == item.id") && ordersWxml.includes('处理中'), 'order actions must be guarded against duplicate taps while a request is pending');
assert(checkoutPage.includes('loadError') && checkoutPage.includes('retryLoad') && checkoutPage.includes('收货地址读取失败') && fs.readFileSync(path.join(root, 'miniapp/package-trade/pages/checkout/index.wxml'), 'utf8').includes('重新加载'), 'checkout must expose a retry state when address, delivery or cart loading fails');
assert(checkoutWxml.includes('订单结果正在核对') && checkoutWxml.includes('bindtap="queryOrderResult"') && checkoutWxml.includes("orderSubmitState == 'unknown'"), 'checkout must expose a query-only recovery action while order creation is unknown');
assert(checkoutPage.includes("require('../../../modules/address-presentation')") && js.includes("require('../../modules/address-presentation')") && addressPresentationSource.includes('customerAddressText') && !checkoutPage.includes("name: item.name || ''"), 'all customer address surfaces must use the shared presentation rule instead of leaking internal test markers');
assert(js.includes('catalogApi.listAllProducts()') && js.includes('catalogApi.listAllCategories()') && !js.includes('result.rows.slice(0, LOCAL_PRODUCT_LIMIT)'), 'miniapp remote catalog must load every product and category page instead of truncating the customer catalog to the local 50-product demo scope');
assert(js.includes('orderActionBusyId') && js.includes('runRemoteOrderAction') && wxml.includes("orderActionBusyId == item.id") && wxml.includes('处理中'), 'inline order actions must be guarded against duplicate taps as well as the trade subpackage');
assert(js.includes("请逐个选择数量和规格") && js.includes("const multiSku = (this.data.frequent || []).find"), 'bulk frequent add must not silently choose the first SKU when products have multiple specs');
assert(js.includes("const mineUtilityTypes = ['orders', 'coupon', 'address', 'favorites', 'trace', 'aftersale', 'invoice', 'points', 'review', 'account']") && js.includes('const utilityActiveTab = mineUtilityTypes.includes(type) ? \'mine\' : this.data.activeTab'), 'mine utility pages must keep the 我的 tab highlighted when entered from another tab');
assert(!/(?:服务端|CloudBase|云函数|\bAPI\b|provider\s*=|mock provider)/i.test(registeredWxml) && !registeredWxml.includes('通过小面板选择数量和规格'), 'customer-facing templates must describe business outcomes and next steps without implementation or obsolete helper terminology');

console.log('interface baseline contract test: passed');
