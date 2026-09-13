const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const appJson = JSON.parse(read('miniapp/app.json'));
const appWxss = read('miniapp/app.wxss');
const indexJsPath = path.join(root, 'miniapp/pages/index/index.js');
const indexJs = read('miniapp/pages/index/index.js');
const indexWxml = read('miniapp/pages/index/index.wxml');
assert.strictEqual(JSON.parse(read('miniapp/pages/index/index.json')).navigationBarTextStyle, 'black', 'main-page native status controls must remain visible on its light safe-area background');
const indexWxss = read('miniapp/pages/index/index.wxss');
const stepperWxss = read('miniapp/components/quantity-stepper/index.wxss');
const addressWxss = read('miniapp/package-trade/pages/addresses/index.wxss');
const checkoutWxml = read('miniapp/package-trade/pages/checkout/index.wxml');
const checkoutWxss = read('miniapp/package-trade/pages/checkout/index.wxss');
const invoiceWxml = read('miniapp/package-member/pages/invoices/index.wxml');
const invoiceWxss = read('miniapp/package-member/pages/invoices/index.wxss');
const topbarJsPath = path.join(root, 'miniapp/components/responsive-topbar/index.js');
const topbarJs = read('miniapp/components/responsive-topbar/index.js');
const topbarWxml = read('miniapp/components/responsive-topbar/index.wxml');
const topbarWxss = read('miniapp/components/responsive-topbar/index.wxss');
const layout = require('../miniapp/config/layout');
const layoutVariables = Object.fromEntries(layout.fixedLayerStyle.split(';').map((declaration) => declaration.split(':')));
assert.strictEqual(layout.FIXED_BAR_HEIGHT, 64, 'shared metrics must not enlarge the approved bars');
assert.strictEqual(layout.CONTENT_END_GAP, 12, 'content end gap must retain its approved size');
assert(indexWxml.includes('style="{{fixedLayerStyle}}"') && indexJs.includes('tabbarHeight = LAYOUT.FIXED_BAR_HEIGHT'), 'WXSS and viewport math must consume the same fixed-layer metrics');
assert(indexWxml.includes('height: {{pageViewportHeight}}; margin-top: {{navContentTop}};') && !indexWxml.includes("page == 'home' ? '100vh'"), 'the home carousel must share the capsule-safe scroll boundary, not scroll content behind native controls');
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
  /button,\s*input,\s*textarea,\s*picker\s*\{[^}]*min-width:\s*0;[^}]*box-sizing:\s*border-box;/s.test(appWxss),
  'native buttons and form controls must share a shrinkable border-box baseline'
);
assert(
  appJson.usingComponents && appJson.usingComponents['responsive-topbar'] === '/components/responsive-topbar/index',
  'the responsive topbar must be registered once at application level'
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
assert.strictEqual(packagePages.length, 24, 'all 24 package routes must remain declared');
assert(
  packagePages.includes('miniapp/package-member/pages/legal/index.wxml'),
  'the versioned privacy policy and service agreement route must remain declared'
);
for (const pagePath of packagePages) {
  const wxml = read(pagePath);
  assert(wxml.includes('<responsive-topbar'), `${pagePath} must use the shared topbar`);
  assert(!wxml.includes('class="topbar"'), `${pagePath} must not render a legacy copied topbar`);
}

assert(
  indexWxss.includes('.quantity-picker{max-height:calc(100vh - var(--quantity-picker-safe-top) - 24rpx);overflow-y:auto}') &&
    indexWxml.includes('style="--quantity-picker-safe-top: {{navContentTop}};"') &&
    indexWxss.includes('.quantity-picker-actions{grid-template-columns:minmax(0,.9fr) minmax(0,1.4fr)}') &&
    indexWxss.includes('.quantity-picker-actions button,.detail-actions button{width:100%;min-width:0;'),
  'quantity and detail action sheets must stay scrollable and keep both actions inside their grid'
);
const quantityPickerActionButton = effectiveRule(indexWxss, '.quantity-picker-actions button');
assert(
  quantityPickerActionButton.display === 'flex' &&
    quantityPickerActionButton['align-items'] === 'center' &&
    quantityPickerActionButton['justify-content'] === 'center' &&
    quantityPickerActionButton.height === '48px',
  'quantity picker action labels must stay centered without changing the approved 48px button height'
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
const mealBaseSpace = safeAreaBasePx(indexWxss, '.meal-bottom-space');
const mealStackedSpace = safeAreaBasePx(indexWxss, '.meal-bottom-space.has-quick-checkout');
assert(
  hasSafeAreaPair(indexWxss, '.meal-bottom-space', 'height') &&
    hasSafeAreaPair(indexWxss, '.meal-bottom-space.has-quick-checkout', 'height') &&
    Number.isFinite(mealBaseSpace) &&
    mealStackedSpace > mealBaseSpace &&
    (indexWxml.match(/class="meal-bottom-space \{\{cartCount \? 'has-quick-checkout' : ''\}\}"/g) || []).length === 2,
  'meal list and detail must reserve exactly the fixed layers that are currently visible, including the bottom safe area'
);
assert(
  indexWxss.includes('@media screen and (max-width: 414px)') &&
    indexWxss.includes('-webkit-line-clamp:2') &&
    !/font-size:\s*(?:1[8-9]|2[0-3])rpx/.test(indexWxss),
  'compact and regular phone widths must wrap long labels without reintroducing viewport-scaled tiny type'
);
for (const selector of ['.sub-head', '.detail-head']) {
  const rule = effectiveRule(indexWxss, selector);
  assert.strictEqual(rule.position, 'sticky', `${selector} must remain visible while a long main-page view scrolls`);
  assert.strictEqual(rule.top, '0', `${selector} sticky offset must align to its capsule-safe scroll viewport`);
}
for (const [selector, minimum, label] of [
  ['.home-category text', 13, 'home category labels'],
  ['.catalog-row>view text:nth-child(2)', 13, 'catalog supporting copy'],
  ['.result-title text:last-child', 13, 'catalog result count'],
  ['.tabbar button>text', 13, 'tab labels']
]) assertFontFloor(indexWxss, selector, minimum, label);
for (const [selector, label] of [
  ['.catalog-search input', 'catalog search input'],
  ['.major-item text', 'catalog category labels'],
  ['.detail-line', 'detail body copy'],
  ['.cart-row>view text:nth-child(2)', 'cart package copy']
]) assertFontFloor(indexWxss, selector, 14, label);
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
const mealCardAction = effectiveRule(indexWxss, '.meal-card-copy>button');
assert(!cssRuleBodies(indexWxss, '.contact-panel text:first-child').length && !cssRuleBodies(indexWxss, '.contact-panel text:nth-child(2)').length, 'contact heading/copy selectors must not override nested legal-link colors and sizes');
assert.strictEqual(effectiveRule(indexWxss, '.mine-legal-links').color, '#1257bc', 'both legal links must inherit the same readable color');
assert(mealCardAction.width === '100%' && mealCardAction['max-width'] === '100%' && mealCardAction['min-width'] === '0' && mealCardAction['box-sizing'] === 'border-box', 'meal-card buttons must fit their card instead of inheriting the wider native button width');
const regularStepperControl = effectiveRule(stepperWxss, '.quantity-stepper .step-control');
const compactStepper = effectiveRule(stepperWxss, '.quantity-stepper.is-compact');
const compactStepperControl = effectiveRule(stepperWxss, '.quantity-stepper.is-compact .step-control');
assert(
  px(regularStepper.width) === 120 && px(regularStepper['min-width']) === 120 && px(regularStepper['max-width']) === 120 && regularStepper.flex === '0 0 120px' &&
    px(regularStepperControl.width) === 44 && px(regularStepperControl['min-width']) === 44 && px(regularStepperControl['max-width']) === 44 && px(regularStepperControl.height) === 44 && regularStepperControl.flex === '0 0 44px' &&
    px(compactStepper.width) === 112 && px(compactStepper['min-width']) === 112 && px(compactStepper['max-width']) === 112 && px(compactStepper['flex-basis']) === 112 &&
    px(compactStepperControl.width) === 44 && px(compactStepperControl['min-width']) === 44 && px(compactStepperControl['max-width']) === 44 && px(compactStepperControl.height) === 44 && px(compactStepperControl['flex-basis']) === 44,
  'quantity steppers and their buttons must keep fixed max widths and flex bases so detail controls cannot stretch into capsules'
);
const topbarBackRule = effectiveRule(topbarWxss, '.topbar__back');
const badgeBox = effectiveRule(indexWxss, '.tabbar button>view');
const badge = effectiveRule(indexWxss, '.tabbar button>view text');
assert(Number.parseFloat(badge.top) >= 0 && Number.parseFloat(badge.right) >= 0, 'cart badge must not be positioned outside its icon box');
assert(px(badge.height) <= px(badgeBox.height) && px(badge['max-width']) <= px(badgeBox.width), 'the full bounded badge must fit inside the icon box');
assert(indexWxml.includes("cartCount > 99 ? '99+' : cartCount"), 'large cart quantities must remain bounded visually while the accessible label keeps the full count');
const topbarBackFace = effectiveRule(topbarWxss, '.topbar__back-face');
assert(
  topbarWxml.includes('class="topbar__back"') && topbarWxml.includes('aria-label="返回"') &&
    px(topbarBackRule.width) === 44 && px(topbarBackRule.height) === 44 && /^1px solid\b/.test(topbarBackFace.border || '') &&
    topbarBackFace.width === '50rpx' && topbarBackFace.height === '50rpx',
  'back hit areas must stay accessible without enlarging the outlined visual face'
);
const regularFace = effectiveRule(stepperWxss, '.step-face');
const compactFace = effectiveRule(stepperWxss, '.quantity-stepper.is-compact .step-face');
const regularValue = effectiveRule(stepperWxss, '.quantity-value');
const compactValue = effectiveRule(stepperWxss, '.quantity-stepper.is-compact .quantity-value');
assert(regularFace.width === '50rpx' && regularFace.height === '50rpx' && compactFace.width === '46rpx' && compactFace.height === '46rpx', 'quantity visual circles must retain the approved 50/46rpx diameters');
assert(regularStepperControl.background === 'transparent' && regularStepperControl.margin === '0', 'the large hit area must not become a visible capsule or inherit native auto margins');
assert(px(regularValue.width) >= 27 && px(compactValue.width) >= 24, 'the quantity slot must fit the supported three-digit maximum');
for (const [host, control, value] of [[regularStepper, regularStepperControl, regularValue], [compactStepper, compactStepperControl, compactValue]]) {
  const gap = Number.parseFloat(host.gap || '0');
  assert(2 * px(control.width) + px(value.width) + 2 * gap <= px(host.width), 'quantity controls and number must fit without flex shrink or overlap');
}

for (const [selector, safeProperty] of [
  ['.tabbar', 'height'],
  ['.quick-checkout', 'bottom'],
  ['.cart-total', 'bottom'],
  ['.detail-actions', 'height'],
  ['.checkout-action-bar', 'height']
]) {
  assert.strictEqual(effectiveRule(indexWxss, selector).position, 'fixed', `${selector} must remain a fixed layer`);
  assert(hasSafeAreaPair(indexWxss, selector, safeProperty), `${selector} must account for the bottom safe area`);
}
for (const [relativePath, barSelector] of fixedBottomPages) {
  const source = read(relativePath);
  assert.strictEqual(effectiveRule(source, barSelector).position, 'fixed', `${relativePath} ${barSelector} must remain fixed`);
  assert(hasSafeAreaPair(source, barSelector, 'padding'), `${relativePath} fixed bar must support both constant() and env() bottom safe areas`);
  assert(hasSafeAreaPair(source, '.page', 'padding-bottom'), `${relativePath} page content must reserve the fixed bar plus both bottom safe-area syntaxes`);
}
const checkoutButtonRule = effectiveRule(checkoutWxss, '.bottom button');
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
    name: 'Windows simulator',
    windowInfo: { windowWidth: 480, windowHeight: 752, screenHeight: 800, statusBarHeight: 0, safeArea: { bottom: 752 }, system: 'Windows 11 x64', model: 'PC' },
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
  const expectedNavContentTop = `${Math.ceil(expectedContentTop / layoutCase.windowInfo.windowWidth * 750)}rpx`;
  const expectedSafeBottom = Math.max(0, layoutCase.windowInfo.screenHeight - layoutCase.windowInfo.safeArea.bottom);
  const expectedCatalogHeight = Math.max(260, Math.floor(layoutCase.windowInfo.windowHeight - expectedContentTop - 191 - 64 - expectedSafeBottom));
  assert.strictEqual(pageContext.data.navContentTop, expectedNavContentTop, `${layoutCase.name} must apply the correct capsule-safe top offset`);
  assert.strictEqual(pageContext.data.navSafeHeight, '0rpx', `${layoutCase.name} must not add a second safe inset inside the scrolling carousel`);
  assert(viewport && Number(viewport[1]) > 0, `${layoutCase.name} main viewport must be a positive px value`);
  assert.strictEqual(pageContext.data.pageViewportHeight, `${layoutCase.windowInfo.windowHeight - expectedContentTop}px`, `${layoutCase.name} main viewport must subtract only its real top inset`);
  assert(catalog && Number(catalog[1]) > 0, `${layoutCase.name} catalog viewport must be a positive px value`);
  assert.strictEqual(pageContext.data.catalogHeight, `${expectedCatalogHeight}px`, `${layoutCase.name} catalog viewport must subtract the fixed 191px catalog chrome`);
}

global.Component = originalComponent;
global.wx = originalWx;

console.log('responsive layout contract test: passed');
