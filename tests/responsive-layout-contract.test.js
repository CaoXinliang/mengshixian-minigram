const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const appJson = JSON.parse(read('miniapp/app.json'));
assert.strictEqual(appJson.window.navigationBarTextStyle, 'black', 'all light-background custom topbars need readable native status controls');
const appWxss = read('miniapp/app.wxss');
const indexJsPath = path.join(root, 'miniapp/pages/index/index.js');
const indexJs = read('miniapp/pages/index/index.js');
const indexWxml = read('miniapp/pages/index/index.wxml');
assert.strictEqual(JSON.parse(read('miniapp/pages/index/index.json')).navigationBarTextStyle, 'black', 'main-page native status controls must remain visible on its light safe-area background');
const indexWxss = read('miniapp/pages/index/index.wxss');
const memberWxml = read('miniapp/components/member-home-panel/index.wxml');
const memberWxss = read('miniapp/components/member-home-panel/index.wxss');
const mealPanelWxml = read('miniapp/components/meal-experience-panel/index.wxml');
const mealPanelWxss = read('miniapp/components/meal-experience-panel/index.wxss');
const stepperWxss = read('miniapp/components/quantity-stepper/index.wxss');
const cartPanelWxss = read('miniapp/components/cart-panel/index.wxss');
const addressWxss = read('miniapp/package-trade/pages/addresses/index.wxss');
const checkoutWxml = read('miniapp/package-trade/pages/checkout/index.wxml');
const checkoutWxss = read('miniapp/package-trade/pages/checkout/index.wxss');
const invoiceWxml = read('miniapp/package-member/pages/invoices/index.wxml');
const invoiceWxss = read('miniapp/package-member/pages/invoices/index.wxss');
const topbarJsPath = path.join(root, 'miniapp/components/responsive-topbar/index.js');
const topbarJs = read('miniapp/components/responsive-topbar/index.js');
const topbarWxml = read('miniapp/components/responsive-topbar/index.wxml');
const topbarWxss = read('miniapp/components/responsive-topbar/index.wxss');
const tabbarWxml = read('miniapp/components/app-tabbar/index.wxml');
const tabbarWxss = read('miniapp/components/app-tabbar/index.wxss');
const layout = require('../miniapp/config/layout');
const layoutVariables = Object.fromEntries(layout.fixedLayerStyle.split(';').map((declaration) => declaration.split(':')));
assert.strictEqual(layout.FIXED_BAR_HEIGHT, 64, 'shared metrics must not enlarge the approved bars');
assert.strictEqual(layout.CONTENT_END_GAP, 12, 'content end gap must retain its approved size');
assert(indexWxml.includes('style="{{fixedLayerStyle}}"') && indexJs.includes('tabbarHeight = LAYOUT.FIXED_BAR_HEIGHT'), 'WXSS and viewport math must consume the same fixed-layer metrics');
assert(
  indexWxml.includes("style=\"height: {{page == 'home' || page == 'campaign' ? '100vh' : pageViewportHeight}}; margin-top: {{page == 'home' || page == 'campaign' ? '0rpx' : navContentTop}};\"") &&
    indexWxml.includes('class="top-safe" style="height: {{navSafeHeight}};"') &&
    !indexWxml.includes('class="sub-nav-safe"'),
  'home and campaign headers must own their safe area in a full-height scroll view while other pages use the capsule-safe viewport and top margin'
);
assert(!/calc\((?:64|76|140)px \+ (?:constant|env)\(safe-area-inset-bottom\)/.test(indexWxss), 'fixed-layer numbers must not drift in duplicated WXSS constants');

const fixedBottomPages = [
  ['miniapp/package-business/pages/frequent/index.wxss', '.bar'],
  ['miniapp/package-business/pages/inquiry-create/index.wxss', '.bar'],
  ['miniapp/package-business/pages/repurchase/index.wxss', '.bar'],
  ['miniapp/package-marketing/pages/bundle-detail/index.wxss', '.bottom'],
  ['miniapp/package-marketing/pages/group-detail/index.wxss', '.bottom'],
  ['miniapp/package-trade/pages/addresses/index.wxss', '.bottom'],
  ['miniapp/package-trade/pages/aftersale-apply/index.wxss', '.submit-bar'],
  ['miniapp/package-trade/pages/checkout/index.wxss', '.bottom'],
  ['miniapp/package-trade/pages/demo-payment/index.wxss', '.bottom'],
  ['miniapp/package-trade/pages/order-detail/index.wxss', '.actions']
];

const ordinaryStatePages = [
  'miniapp/package-business/pages/inquiries/index.wxss',
  'miniapp/package-member/pages/points/index.wxss',
  'miniapp/package-member/pages/reviews/index.wxss',
  'miniapp/package-member/pages/invoices/index.wxss',
  'miniapp/package-member/pages/stored-value/index.wxss'
];

function cssRuleBodies(source, selector) {
  const bodies = [];
  const rulePattern = /([^{}]+)\{([^{}]*)\}/g;
  const css = source.replace(/\/\*[\s\S]*?\*\//g, '');
  let match;
  while ((match = rulePattern.exec(css))) {
    const selectors = match[1].split(',').map((item) => item.trim());
    if (selectors.includes(selector)) bodies.push(match[2]);
  }
  return bodies;
}

function declarations(body) {
  return String(body || '').split(';').reduce((output, declaration) => {
    const separator = declaration.indexOf(':');
    if (separator >= 0) output[declaration.slice(0, separator).trim()] = declaration.slice(separator + 1).trim();
    return output;
  }, {});
}

function effectiveRule(source, selector) {
  return cssRuleBodies(source, selector).reduce((output, body) => Object.assign(output, declarations(body)), {});
}

function px(value) {
  const match = String(value || '').match(/^(\d+(?:\.\d+)?)px(?:!important)?$/);
  return match ? Number(match[1]) : NaN;
}

assert.strictEqual(px(effectiveRule(appWxss, 'page')['font-size']), 14, 'subpackage text without a local font rule must keep a 14px readable baseline on narrow screens');

function hasSafeAreaPair(source, selector, property) {
  const body = cssRuleBodies(source, selector).join(';');
  const prefix = `${property}:\\s*[^;]*`;
  return new RegExp(`${prefix}constant\\(safe-area-inset-bottom\\)`).test(body) &&
    new RegExp(`${prefix}env\\(safe-area-inset-bottom\\)`).test(body);
}

function safeAreaBasePx(source, selector) {
  source = source.replace(/var\((--fixed-[a-z-]+)\)/g, (_, name) => layoutVariables[name] || 'unresolved');
  const values = cssRuleBodies(source, selector).flatMap((body) =>
    [...body.matchAll(/height:\s*calc\(\s*(\d+(?:\.\d+)?)px\s*\+\s*(?:constant|env)\(safe-area-inset-bottom\)\s*\)/g)].map((match) => Number(match[1]))
  );
  return values.length ? Math.min(...values) : NaN;
}

function assertPxFloor(source, selector, property, minimum, label) {
  const values = cssRuleBodies(source, selector).map((body) => px(declarations(body)[property])).filter(Number.isFinite);
  assert(values.length && values.every((value) => value >= minimum), `${label} must keep ${property} at least ${minimum}px`);
}

function assertFontFloor(source, selector, minimum, label) {
  assertPxFloor(source, selector, 'font-size', minimum, label);
}

assert(
  /button,\s*input,\s*textarea,\s*picker\s*\{[^}]*min-width:\s*0;[^}]*min-height:\s*44px;[^}]*box-sizing:\s*border-box;/s.test(appWxss),
  'native buttons and form controls must share a shrinkable border-box baseline'
);
assert(
  !appJson.usingComponents || !appJson.usingComponents['responsive-topbar'],
  'subpackage topbars must not be registered globally because that defeats component lazy injection'
);
assert(
  topbarJs.includes('wx.getWindowInfo') &&
    topbarJs.includes('wx.getMenuButtonBoundingClientRect') &&
    !topbarJs.includes('wx.getSystemInfoSync'),
  'the topbar must derive its safe area from current split APIs and the real menu capsule'
);
assert(
  topbarWxml.includes('padding-right: {{capsuleInsetRight}}px') &&
    topbarWxss.includes('.topbar__copy') &&
    topbarWxss.includes('min-width: 0;') &&
    topbarWxss.includes('text-overflow: ellipsis;'),
  'the topbar title column must stay outside the capsule and shrink without escaping the viewport'
);

const packagePages = appJson.subpackages.flatMap((subpackage) =>
  subpackage.pages.map((page) => `miniapp/${subpackage.root}/${page}.wxml`)
);
assert.strictEqual(packagePages.length, 26, 'all 26 package routes must remain declared');
assert(
  packagePages.includes('miniapp/package-member/pages/legal/index.wxml'),
  'the versioned privacy policy and service agreement route must remain declared'
);
for (const pagePath of packagePages) {
  const wxml = read(pagePath);
  const pageJson = JSON.parse(read(pagePath.replace(/\.wxml$/, '.json')));
  assert(wxml.includes('<responsive-topbar'), `${pagePath} must use the shared topbar`);
  assert(
    pageJson.usingComponents && pageJson.usingComponents['responsive-topbar'] === '/components/responsive-topbar/index',
    `${pagePath} must register the shared topbar locally for lazy injection`
  );
  assert(!wxml.includes('class="topbar"'), `${pagePath} must not render a legacy copied topbar`);
}

assert(
  indexWxss.includes('.quantity-picker{max-height:calc(100vh - var(--quantity-picker-safe-top) - 24rpx);overflow-y:auto}') &&
    indexWxml.includes('style="--quantity-picker-safe-top: {{navContentTop}};"') &&
    indexWxml.includes('class="quantity-picker-action-face"') &&
    effectiveRule(indexWxss, '.quantity-picker-actions')['justify-content'] === 'center' &&
    effectiveRule(indexWxss, '.quantity-picker-actions')['flex-wrap'] === 'wrap',
  'quantity sheet must stay scrollable while its compact action faces remain centered and wrap safely'
);
const quantityPickerActionButton = effectiveRule(indexWxss, '.quantity-picker-actions button');
const quantityPickerActionFace = effectiveRule(indexWxss, '.quantity-picker-action-face');
assert(
  quantityPickerActionButton.display === 'flex' &&
    quantityPickerActionButton['align-items'] === 'center' &&
    quantityPickerActionButton['justify-content'] === 'center' &&
    quantityPickerActionButton.width === 'auto' &&
    quantityPickerActionButton.height === '44px' &&
    quantityPickerActionButton.background === 'transparent' &&
    quantityPickerActionFace['border-radius'] === '999px' &&
    px(quantityPickerActionFace['min-height']) > 0 && px(quantityPickerActionFace['min-height']) < 44,
  'quantity picker actions must separate a 44px transparent hit target from their compact content-width pill faces'
);
const catalogBaseSpace = safeAreaBasePx(indexWxss, '.catalog-bottom-space');
const catalogStackedSpace = safeAreaBasePx(indexWxss, '.catalog-bottom-space.has-quick-checkout');
assert(
  hasSafeAreaPair(indexWxss, '.catalog-bottom-space', 'height') &&
    hasSafeAreaPair(indexWxss, '.catalog-bottom-space.has-quick-checkout', 'height') &&
    Number.isFinite(catalogBaseSpace) &&
    catalogStackedSpace > catalogBaseSpace &&
    indexWxml.includes('class="catalog-bottom-space {{cartCount ? \'has-quick-checkout\' : \'\'}}"'),
  'catalog content must reserve one fixed layer normally and a larger safe-area-aware space when quick checkout is present'
);
const mealBaseSpace = safeAreaBasePx(mealPanelWxss, '.meal-bottom-space');
const mealStackedSpace = safeAreaBasePx(mealPanelWxss, '.meal-bottom-space.has-quick-checkout');
assert(
  indexWxml.includes('<meal-experience-panel') &&
    hasSafeAreaPair(mealPanelWxss, '.meal-bottom-space', 'height') &&
    hasSafeAreaPair(mealPanelWxss, '.meal-bottom-space.has-quick-checkout', 'height') &&
    Number.isFinite(mealBaseSpace) &&
    mealStackedSpace > mealBaseSpace &&
    (mealPanelWxml.match(/class="meal-bottom-space \{\{cartCount \? 'has-quick-checkout' : ''\}\}"/g) || []).length === 2,
  'meal list and detail must reserve exactly the fixed layers that are currently visible, including the bottom safe area'
);
assert(
  indexWxss.includes('@media screen and (max-width: 414px)') &&
    indexWxss.includes('-webkit-line-clamp:2') &&
    indexWxss.includes('.choose-spec-face{display:flex;align-items:center;justify-content:center;min-height:34px;padding:0 13px;') &&
    !/\.choose-spec-face\{[^}]*min-width:\s*\d+rpx/.test(indexWxss),
  'compact and regular phone widths must wrap long labels while the visible catalog action stays content-sized'
);
assert(
  indexWxml.includes('class="catalog-side" scroll-y="true" enhanced="true"') &&
    !indexWxml.includes('class="catalog-side" scroll-x="true"') &&
    !indexWxss.includes('.catalog-layout>.catalog-side{display:block;width:auto;height:56px') &&
    !indexWxss.includes('.catalog-layout>.catalog-results{width:100%;height:calc(100% - 64px)'),
  '320/375/390px catalog pages must preserve the vertical secondary rail instead of duplicating categories above the products'
);
const majorScrollTag = indexWxml.match(/<scroll-view[^>]*class="major-scroll"[^>]*>/)?.[0] || '';
const sideScrollTag = indexWxml.match(/<scroll-view[^>]*class="catalog-side"[^>]*>/)?.[0] || '';
const resultScrollTag = indexWxml.match(/<scroll-view[^>]*class="catalog-results"[^>]*>/)?.[0] || '';
const catalogLayoutRule = effectiveRule(indexWxss, '.catalog-layout');
const catalogSideRule = effectiveRule(indexWxss, '.catalog-side');
const catalogResultsRule = effectiveRule(indexWxss, '.catalog-results');
assert(
  majorScrollTag.includes('scroll-x="true"') && !majorScrollTag.includes('scroll-y="true"') &&
    sideScrollTag.includes('scroll-y="true"') && !sideScrollTag.includes('scroll-x="true"') &&
    resultScrollTag.includes('scroll-y="true"') && !resultScrollTag.includes('scroll-x="true"'),
  'primary categories, secondary categories, and product results must own horizontal, vertical, and vertical scrolling respectively'
);
assert(
  indexWxml.includes('class="catalog-layout" style="height: {{catalogHeight}};"') &&
    catalogLayoutRule.overflow === 'hidden' &&
    catalogSideRule.height === '100%' && catalogSideRule['max-height'] === '100%' && catalogSideRule['align-self'] === 'flex-start' &&
    catalogResultsRule.height === '100%',
  'the secondary scroll viewport must have a real bounded height; its transparent surface and naturally sized items must not stretch the final category'
);
for (const selector of ['.sub-head', '.detail-head']) {
  const rule = effectiveRule(indexWxss, selector);
  assert.strictEqual(rule.position, 'sticky', `${selector} must remain visible while a long main-page view scrolls`);
  assert.strictEqual(rule.top, '0', `${selector} sticky offset must align to its capsule-safe scroll viewport`);
}
for (const [selector, minimum, label] of [
  ['.home-category text', 14, 'home category labels'],
  ['.catalog-row .catalog-item-spec', 13, 'catalog supporting copy'],
  ['.result-title text:last-child', 13, 'catalog result count']
]) assertFontFloor(indexWxss, selector, minimum, label);
assertFontFloor(tabbarWxss, '.tabbar__label', 13, 'tab labels');
for (const [selector, label] of [
  ['.catalog-search input', 'catalog search input'],
  ['.major-item text', 'catalog category labels'],
  ['.detail-line', 'detail body copy']
]) assertFontFloor(indexWxss, selector, 14, label);
assertFontFloor(cartPanelWxss, '.cart-spec', 14, 'cart package copy');
assertFontFloor(topbarWxss, '.topbar__subtitle', 13, 'topbar supporting copy');
assertFontFloor(topbarWxss, '.topbar__action', 14, 'topbar action copy');

for (const [source, selector, property, label] of [
  [appWxss, 'button', 'min-height', 'native buttons'],
  [appWxss, 'input', 'min-height', 'native inputs'],
  [appWxss, 'picker', 'min-height', 'native pickers'],
  [stepperWxss, '.quantity-stepper .step-control', 'width', 'quantity controls'],
  [stepperWxss, '.quantity-stepper .step-control', 'height', 'quantity controls'],
  [topbarWxss, '.topbar__back', 'width', 'topbar back control'],
  [topbarWxss, '.topbar__back', 'height', 'topbar back control'],
  [indexWxss, '.login-close', 'width', 'login close control'],
  [indexWxss, '.login-close', 'height', 'login close control']
]) assertPxFloor(source, selector, property, 44, label);

const regularStepper = effectiveRule(stepperWxss, '.quantity-stepper');
const mealCardAction = effectiveRule(mealPanelWxss, '.meal-card-copy>button');
assert(!memberWxml.includes('更多服务') && !memberWxml.includes('class="mine-legal-links"'), 'mine must not repeat dormant or legal surfaces below the service grid');
assert.strictEqual(effectiveRule(memberWxss, '.member-card-head>button').background, '#eaf2fd', 'all-orders must keep a compact visible face inside its touch target');
assert(px(effectiveRule(memberWxss, '.member-service-grid button>text')['font-size']) >= 13, 'Pixso mine service labels must stay clear and dark while retaining the compact grid rhythm');
assert(
  mealCardAction.width === 'auto' &&
    mealCardAction['max-width'] === '100%' &&
    px(mealCardAction['min-width']) >= 0 && px(mealCardAction['min-width']) <= 44 &&
    mealCardAction['box-sizing'] === 'border-box' &&
    px(mealCardAction['min-height']) >= 44 &&
    mealCardAction['white-space'] === 'normal',
  'meal-card buttons must remain content-sized, card-bounded, touchable, and able to wrap normally'
);
const regularStepperControl = effectiveRule(stepperWxss, '.quantity-stepper .step-control');
const compactStepper = effectiveRule(stepperWxss, '.quantity-stepper.is-compact');
const compactStepperControl = effectiveRule(stepperWxss, '.quantity-stepper.is-compact .step-control');
assert(
  px(regularStepper.width) === 120 && px(regularStepper['min-width']) === 120 && px(regularStepper['max-width']) === 120 && regularStepper.flex === '0 0 120px' &&
    px(regularStepperControl.width) === 44 && px(regularStepperControl['min-width']) === 44 && px(regularStepperControl['max-width']) === 44 && px(regularStepperControl.height) === 44 && regularStepperControl.flex === '0 0 44px' &&
    px(compactStepper.width) === 120 && px(compactStepper['min-width']) === 120 && px(compactStepper['max-width']) === 120 && px(compactStepper['flex-basis']) === 120 &&
    px(compactStepperControl.width) === 44 && px(compactStepperControl['min-width']) === 44 && px(compactStepperControl['max-width']) === 44 && px(compactStepperControl.height) === 44 && px(compactStepperControl['flex-basis']) === 44,
  'quantity steppers and their buttons must keep fixed max widths and flex bases so detail controls cannot stretch into capsules'
);
const topbarBackRule = effectiveRule(topbarWxss, '.topbar__back');
const badgeBox = effectiveRule(tabbarWxss, '.tabbar__cart-icon');
const badge = effectiveRule(tabbarWxss, '.tabbar__badge');
const tabbarCellDivider = effectiveRule(tabbarWxss, '.tabbar__item+.tabbar__item');
assert(
  tabbarCellDivider['border-left'] === '1px solid var(--tabbar-divider)',
  'the five bottom navigation cells must keep visible boundaries instead of blending into one white strip'
);
assert(Number.parseFloat(badge.top) >= 0 && Number.parseFloat(badge.right) >= 0, 'cart badge must not be positioned outside its icon box');
assert(px(badge.height) <= px(badgeBox.height) && px(badge['max-width']) <= px(badgeBox.width), 'the full bounded badge must fit inside the icon box');
assert(tabbarWxml.includes("cartCount > 99 ? '99+' : cartCount") && tabbarWxml.includes('aria-label="\u8d2d\u7269\u8f66\uff0c\u5171 {{cartCount}} \u4ef6\u5546\u54c1"'), 'large cart quantities must remain bounded visually while the accessible label keeps the full count');
const topbarBackFace = effectiveRule(topbarWxss, '.topbar__back-face');
assert(
  topbarWxml.includes('class="topbar__back"') && topbarWxml.includes('aria-label="返回"') &&
    px(topbarBackRule.width) === 44 && px(topbarBackRule.height) === 44 &&
    ['#eaf2fd', 'var(--color-brand-soft)'].includes(topbarBackFace.background) &&
    px(topbarBackFace.width) === 32 && px(topbarBackFace.height) === 32,
  'back hit areas must stay accessible without enlarging the outlined visual face'
);
const regularFace = effectiveRule(stepperWxss, '.step-face');
const compactFace = effectiveRule(stepperWxss, '.quantity-stepper.is-compact .step-face');
const regularValue = effectiveRule(stepperWxss, '.quantity-value');
const compactValue = effectiveRule(stepperWxss, '.quantity-stepper.is-compact .quantity-value');
assert(px(regularFace.width) >= 28 && px(regularFace.height) >= 28 && px(compactFace.width) >= 28 && px(compactFace.height) >= 28, 'quantity visual circles must remain clearly visible at every phone width');
assert(regularStepperControl.background === 'transparent' && regularStepperControl.margin === '0', 'the large hit area must not become a visible capsule or inherit native auto margins');
assert(px(regularValue.width) >= 27 && px(compactValue.width) >= 24, 'the quantity slot must fit the supported three-digit maximum');
for (const [host, control, value] of [[regularStepper, regularStepperControl, regularValue], [compactStepper, compactStepperControl, compactValue]]) {
  const gap = Number.parseFloat(host.gap || '0');
  assert(2 * px(control.width) + px(value.width) + 2 * gap <= px(host.width), 'quantity controls and number must fit without flex shrink or overlap');
}

for (const [selector, safeProperty, stylesheet] of [
  ['.tabbar', 'height', tabbarWxss],
  ['.quick-checkout', 'bottom'],
  ['.cart-total', 'bottom', cartPanelWxss],
  ['.detail-actions', 'height']
]) {
  const css = stylesheet || indexWxss;
  const positionRule = selector === '.tabbar' ? effectiveRule(css, ':host') : effectiveRule(css, selector);
  assert.strictEqual(positionRule.position, 'fixed', `${selector} must remain a fixed layer`);
  assert(hasSafeAreaPair(css, selector, safeProperty), `${selector} must account for the bottom safe area`);
}
for (const [relativePath, barSelector] of fixedBottomPages) {
  const source = read(relativePath);
  assert.strictEqual(effectiveRule(source, barSelector).position, 'fixed', `${relativePath} ${barSelector} must remain fixed`);
  assert(hasSafeAreaPair(source, barSelector, 'padding'), `${relativePath} fixed bar must support both constant() and env() bottom safe areas`);
  assert(hasSafeAreaPair(source, '.page', 'padding-bottom'), `${relativePath} page content must reserve the fixed bar plus both bottom safe-area syntaxes`);
}
const checkoutButtonRule = effectiveRule(checkoutWxss, '.submit-button');
assert(
  checkoutWxml.includes("quoteState == 'error' ? '请先重新计算金额'") &&
    checkoutButtonRule['white-space'] === 'normal' &&
    (checkoutButtonRule['overflow-wrap'] === 'anywhere' || checkoutButtonRule['word-break'] === 'break-word'),
  'checkout fixed action must allow its dynamic status text to wrap instead of clipping'
);
for (const relativePath of ordinaryStatePages) {
  const source = read(relativePath);
  const stateRule = effectiveRule(source, '.state');
  assert(!/^(?:350|360)rpx$/.test(stateRule['min-height'] || ''), `${relativePath} ordinary states must not reserve a giant 350/360rpx placeholder`);
}
assert(
  addressWxss.includes('grid-template-columns:minmax(0,1fr) minmax(0,1.35fr)') &&
    addressWxss.includes('.form-actions button{display:flex;align-items:center;justify-content:center;width:100%;min-width:0;') &&
    addressWxss.includes('@media screen and (max-width: 360px)'),
  'address actions must shrink safely and switch to equal columns on compact screens'
);
assert(
  invoiceWxml.includes('title="电子发票"') &&
    invoiceWxml.includes('电子发票暂未开放') &&
    !/<(?:input|form|button)\b/.test(invoiceWxml) &&
    !/bind(?:tap|submit)=/.test(invoiceWxml) &&
    invoiceWxss.includes('.page{font-size:14px}'),
  'unavailable invoicing must render a readable status only, without exposing forms or submission actions'
);

let mainPageDefinition;
const originalPage = global.Page;
global.Page = (definition) => {
  mainPageDefinition = definition;
};
try {
  delete require.cache[require.resolve(indexJsPath)];
  require(indexJsPath);
} finally {
  if (originalPage === undefined) delete global.Page;
  else global.Page = originalPage;
}
assert(mainPageDefinition && typeof mainPageDefinition.updateLayoutMetrics === 'function', 'the main page must register runtime layout metrics');
assert(indexJs.includes('system.safeArea && system.safeArea.bottom'), 'main-page layout metrics must include the runtime bottom safe area');

let componentDefinition;
const originalComponent = global.Component;
const originalWx = global.wx;
global.Component = (definition) => {
  componentDefinition = definition;
};
delete require.cache[require.resolve(topbarJsPath)];
require(topbarJsPath);

const layoutCases = [
  {
    name: 'compact iPhone',
    windowInfo: { windowWidth: 320, windowHeight: 568, screenHeight: 568, statusBarHeight: 20, safeArea: { bottom: 548 }, system: 'iOS 18.0', model: 'iPhone' },
    menuRect: { left: 223, top: 24, bottom: 56, width: 87, height: 32 }
  },
  {
    name: 'standard iPhone',
    windowInfo: { windowWidth: 375, windowHeight: 667, screenHeight: 667, statusBarHeight: 20, safeArea: { bottom: 647 }, system: 'iOS 18.0', model: 'iPhone' },
    menuRect: { left: 278, top: 24, bottom: 56, width: 87, height: 32 }
  },
  {
    name: 'regular iPhone',
    windowInfo: { windowWidth: 390, windowHeight: 844, screenHeight: 844, statusBarHeight: 20, safeArea: { bottom: 810 }, system: 'iOS 18.0', model: 'iPhone' },
    menuRect: { left: 293, top: 24, bottom: 56, width: 87, height: 32 }
  },
  {
    name: 'large iPhone',
    windowInfo: { windowWidth: 414, windowHeight: 896, screenHeight: 896, statusBarHeight: 20, safeArea: { bottom: 862 }, system: 'iOS 18.0', model: 'iPhone' },
    menuRect: { left: 317, top: 24, bottom: 56, width: 87, height: 32 }
  },
  {
    name: 'wide Android phone',
    windowInfo: { windowWidth: 428, windowHeight: 926, screenHeight: 926, statusBarHeight: 24, safeArea: { bottom: 902 }, system: 'Android 16', model: 'Phone' },
    menuRect: { left: 331, top: 28, bottom: 60, width: 87, height: 32 }
  },
  {
    name: 'phone simulator hosted by macOS DevTools',
    windowInfo: { windowWidth: 414, windowHeight: 896, screenHeight: 896, statusBarHeight: 20, safeArea: { bottom: 896 }, system: 'macOS 10.14.3', model: 'Mac 21-inch and above', platform: 'devtools' },
    menuRect: { left: 321, top: 28, bottom: 59, width: 87, height: 31 }
  },
  {
    name: 'Windows simulator',
    windowInfo: { windowWidth: 480, windowHeight: 752, screenHeight: 800, statusBarHeight: 0, safeArea: { bottom: 752 }, system: 'Windows 11 x64', model: 'PC', platform: 'windows' },
    menuRect: { left: 382, top: 6, bottom: 38, width: 88, height: 32 },
    desktop: true
  }
];

for (const layoutCase of layoutCases) {
  global.wx = {
    getWindowInfo: () => layoutCase.windowInfo,
    getMenuButtonBoundingClientRect: () => layoutCase.menuRect
  };
  const context = {
    data: {},
    setData(next) {
      this.data = { ...this.data, ...next };
    }
  };
  componentDefinition.methods.updateLayout.call(context);
  assert(Number.isFinite(context.data.statusBarHeight), `${layoutCase.name} status bar must be finite`);
  assert(context.data.navigationHeight >= 40, `${layoutCase.name} navigation row must remain stable`);
  assert(
    context.data.capsuleInsetRight >= layoutCase.windowInfo.windowWidth - layoutCase.menuRect.left,
    `${layoutCase.name} content must end before the capsule`
  );

  const pageContext = {
    data: {},
    setData(next) {
      this.data = { ...this.data, ...next };
    }
  };
  mainPageDefinition.updateLayoutMetrics.call(pageContext, layoutCase.windowInfo);
  const viewport = String(pageContext.data.pageViewportHeight || '').match(/^(\d+)px$/);
  const catalog = String(pageContext.data.catalogHeight || '').match(/^(\d+)px$/);
  const expectedContentTop = layoutCase.desktop ? 0 : Math.max(layoutCase.windowInfo.statusBarHeight, layoutCase.menuRect.bottom + 4);
  const expectedHomeSafeTop = layoutCase.desktop ? 0 : Math.max(layoutCase.windowInfo.statusBarHeight, expectedContentTop - 44);
  const expectedNavContentTop = `${Math.ceil(expectedContentTop / layoutCase.windowInfo.windowWidth * 750)}rpx`;
  const expectedNavSafeHeight = `${Math.ceil(expectedHomeSafeTop / layoutCase.windowInfo.windowWidth * 750)}rpx`;
  const expectedSafeBottom = Math.max(0, layoutCase.windowInfo.screenHeight - layoutCase.windowInfo.safeArea.bottom);
  const expectedCatalogHeight = Math.max(180, Math.floor(layoutCase.windowInfo.windowHeight - expectedContentTop - (56 + 48 + 82 + Math.ceil(10 * layoutCase.windowInfo.windowWidth / 750)) - 64 - expectedSafeBottom));
  assert.strictEqual(pageContext.data.navContentTop, expectedNavContentTop, `${layoutCase.name} must apply the correct capsule-safe top offset`);
  assert.strictEqual(pageContext.data.navSafeHeight, expectedNavSafeHeight, `${layoutCase.name} home header must embed only the compact safe inset above its 44px store row`);
  assert(viewport && Number(viewport[1]) > 0, `${layoutCase.name} main viewport must be a positive px value`);
  assert.strictEqual(pageContext.data.pageViewportHeight, `${layoutCase.windowInfo.windowHeight - expectedContentTop}px`, `${layoutCase.name} non-home viewport must subtract the same native-capsule inset applied as its top margin`);
  assert(catalog && Number(catalog[1]) > 0, `${layoutCase.name} catalog viewport must be a positive px value`);
  assert.strictEqual(pageContext.data.catalogHeight, `${expectedCatalogHeight}px`, `${layoutCase.name} catalog viewport must subtract the actual chrome including responsive margin`);
}

global.Component = originalComponent;
global.wx = originalWx;

console.log('responsive layout contract test: passed');
