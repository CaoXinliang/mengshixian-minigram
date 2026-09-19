const assert = require('assert');
const fs = require('fs');
const Module = require('module');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const appWxss = read('miniapp/app.wxss');
const indexJs = read('miniapp/pages/index/index.js');
const indexWxml = read('miniapp/pages/index/index.wxml');
const indexWxss = read('miniapp/pages/index/index.wxss');
const cartPanelWxss = read('miniapp/components/cart-panel/index.wxss');
const tabbarWxss = read('miniapp/components/app-tabbar/index.wxss');
const stepperWxss = read('miniapp/components/quantity-stepper/index.wxss');
const checkoutWxml = read('miniapp/package-trade/pages/checkout/index.wxml');
const checkoutWxss = read('miniapp/package-trade/pages/checkout/index.wxss');

const ACCEPTED_WIDTHS = [320, 375, 390, 414, 428, 480];
assert.deepStrictEqual(ACCEPTED_WIDTHS, [320, 375, 390, 414, 428, 480], 'first-batch acceptance must cover all six agreed widths');

function topLevelBlocks(source) {
  const css = String(source || '').replace(/\/\*[\s\S]*?\*\//g, '');
  const blocks = [];
  let cursor = 0;

  while (cursor < css.length) {
    const openBrace = css.indexOf('{', cursor);
    if (openBrace < 0) break;

    let depth = 1;
    let quote = '';
    let escaped = false;
    let index = openBrace + 1;
    for (; index < css.length && depth > 0; index += 1) {
      const character = css[index];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (quote && character === '\\') {
        escaped = true;
        continue;
      }
      if (character === '"' || character === "'") {
        if (!quote) quote = character;
        else if (quote === character) quote = '';
        continue;
      }
      if (quote) continue;
      if (character === '{') depth += 1;
      else if (character === '}') depth -= 1;
    }

    assert.strictEqual(depth, 0, `CSS block starting at ${openBrace} must be balanced`);
    blocks.push({
      prelude: css.slice(cursor, openBrace).trim(),
      body: css.slice(openBrace + 1, index - 1)
    });
    cursor = index;
  }

  return blocks;
}

function cssRuleBodies(source, selector) {
  return topLevelBlocks(source).reduce((bodies, block) => {
    if (block.prelude.startsWith('@')) return bodies;
    const selectors = block.prelude.split(',').map((item) => item.trim());
    if (selectors.includes(selector)) bodies.push(block.body);
    return bodies;
  }, []);
}

function atRuleBodies(source, pattern) {
  return topLevelBlocks(source)
    .filter((block) => block.prelude.startsWith('@') && pattern.test(block.prelude))
    .map((block) => block.body);
}

function declarations(body) {
  return String(body || '').split(';').reduce((output, declaration) => {
    const separator = declaration.indexOf(':');
    if (separator >= 0) output[declaration.slice(0, separator).trim()] = declaration.slice(separator + 1).trim();
    return output;
  }, {});
}

function baseRule(source, selector) {
  const body = cssRuleBodies(source, selector)[0];
  return declarations(body);
}

function effectiveRule(source, selector) {
  return cssRuleBodies(source, selector).reduce((output, body) => Object.assign(output, declarations(body)), {});
}

function px(value) {
  const match = String(value || '').match(/^(\d+(?:\.\d+)?)px$/);
  return match ? Number(match[1]) : NaN;
}

assert.strictEqual(px(baseRule(appWxss, 'page')['font-size']), 14, 'shared page copy must keep a fixed readable 14px baseline');
for (const selector of ['button', 'input', 'picker']) {
  assert.strictEqual(px(effectiveRule(appWxss, selector)['min-height']), 44, `${selector} must keep a 44px hit-area floor`);
}
assert(!/min-width\s*:\s*390px/.test(`${appWxss}\n${indexWxss}\n${checkoutWxss}`), 'first-batch pages must not impose a 390px minimum viewport');
assert(!/(?:^|[;}])\s*(?:page|\.page|\.app-shell)\s*\{[^}]*transform\s*:\s*scale\(/s.test(`${appWxss}\n${indexWxss}\n${checkoutWxss}`), 'first-batch pages must not use whole-page scaling as adaptation');

const pageMotion = baseRule(indexWxss, '.page-scroll.is-page-entering').animation || '';
const pageMotionMs = Number((pageMotion.match(/(\d+)ms/) || [])[1]);
assert(Number.isFinite(pageMotionMs) && pageMotionMs <= 120, 'page entry feedback must complete within 120ms');

const categoryGrid = effectiveRule(indexWxss, '.is-home .home-categories');
assert.strictEqual(categoryGrid['grid-template-columns'], 'repeat(5,minmax(0,1fr))', 'home categories must keep the Pixso five-column grid');
assert(/repeat\(2,/.test(categoryGrid['grid-template-rows'] || ''), 'home categories must remain two rows');
const compactHomeCss = atRuleBodies(indexWxss, /max-width\s*:\s*350px/).join('\n');
const compactCategoryGrid = effectiveRule(compactHomeCss, '.is-home .home-categories');
assert.strictEqual(compactCategoryGrid['grid-template-columns'], '56px 54px minmax(70px,1fr) 56px 54px', 'compact home must reserve space for full labels, 54px circles and gaps');
assert.strictEqual(px(compactCategoryGrid['margin-left']), 6);
assert.strictEqual(px(compactCategoryGrid['margin-right']), 6);
assert.strictEqual(px(compactCategoryGrid['column-gap']), 4);
assert.strictEqual(px(effectiveRule(compactHomeCss, '.is-home .home-category>text')['font-size']), 14);
assert.strictEqual(cssRuleBodies(indexWxss, '.is-home .home-category>text').length, 0, 'compact type override must not leak into regular viewports');
const homeStyleBlocks = topLevelBlocks(indexWxss);
const finalNormalLabelRule = homeStyleBlocks.map((block, index) => block.prelude === '.is-home .home-category text' ? index : -1).filter(index => index >= 0).pop();
const compactLabelRule = homeStyleBlocks.findIndex(block => /max-width\s*:\s*350px/.test(block.prelude) && block.body.includes('.is-home .home-category>text'));
assert(compactLabelRule > finalNormalLabelRule, 'compact font override must follow normal typography so the cascade keeps the Pixso 14px label size');
const homeCategoryLabel = effectiveRule(indexWxss, '.is-home .home-category text');
assert.strictEqual(px(homeCategoryLabel['font-size']), 14, 'home category labels must use the Pixso 14px size');
assert(homeCategoryLabel['white-space'] === 'nowrap' && homeCategoryLabel.overflow === 'visible' && homeCategoryLabel['text-overflow'] === 'clip', 'home category labels must remain complete on one line without truncation');
const homeCategoryCircle = effectiveRule(indexWxss, '.home-category-icon');
const homeCategoryIcon = effectiveRule(indexWxss, '.is-home .home-category image');
assert(px(homeCategoryCircle.width) === 48 && px(homeCategoryCircle.height) === 48, 'home category circle must use the Pixso 48px size');
assert(px(homeCategoryIcon.width) === 34 && px(homeCategoryIcon.height) === 34, 'home category artwork must use the Pixso 34px size');
assert.strictEqual(px(effectiveRule(indexWxss, '.major-item text')['font-size']), 14, 'category-strip labels must keep the Pixso readable size');
assert.strictEqual(px(effectiveRule(indexWxss, '.is-home .banner-copy text:nth-child(2)')['font-size']), 24, 'hero title must keep the Pixso size without viewport scaling');
assert(px(baseRule(indexWxss, '.detail-head>text')['font-size']) >= 18, 'detail navigation title must stay at or above the readable 18px floor');
assert(!/@media screen and \(max-width: 360px\)\{[\s\S]*?\.detail-head>text[^}]*font-size:\s*14px/.test(indexWxss), 'compact layout must not shrink the detail title below its 18px baseline');

const chooseTarget = baseRule(indexWxss, '.choose-spec');
const chooseFace = effectiveRule(indexWxss, '.choose-spec-face');
assert(px(chooseTarget['min-width']) === 44 && px(chooseTarget.height) === 44 && chooseTarget.background === 'transparent', '选规格 must separate the hit target from the visible face');
assert(!chooseFace['min-width'] && px(chooseFace['min-height']) >= 34 && px(chooseFace['min-height']) <= 40 && px(chooseFace['font-size']) >= 14 && chooseFace['border-radius'] === '999px', '选规格 face must size to its text with the Pixso readable action font');
assert((indexWxml.match(/'选规格'/g) || []).length >= 4, 'all product-list triggers and their null-safe fallbacks must use the 选规格 label');
assert(!indexWxml.includes('选数量'), 'the obsolete 选数量 label must not remain in the first-batch template');

const stepFace = baseRule(stepperWxss, '.step-face');
const compactStepFace = baseRule(stepperWxss, '.quantity-stepper.is-compact .step-face');
assert(px(stepFace.width) >= 28 && px(stepFace.height) >= 28 && px(compactStepFace.width) >= 28 && px(compactStepFace.height) >= 28, 'stepper visual circles must remain clear while their controls retain 44px hit areas');
assert(indexWxss.includes('grid-template-areas:"catalog-image catalog-copy" "catalog-image catalog-action"') && cartPanelWxss.includes('grid-template-columns:44px 72px minmax(0,1fr)'), '320px catalog and isolated cart rows must preserve a 44px selection target without crushing product copy');

assert(indexWxml.includes('wx:for="{{quantityPickerProduct.skuOptions}}"') && indexWxml.includes('disabled="{{!item.purchaseAvailable}}"') && indexWxss.includes('.quantity-picker-specs{display:flex;align-items:center;width:100%;min-width:0;flex-wrap:wrap;'), 'the specification sheet must wrap one to three real selling specifications and expose unavailable states');
assert(indexWxml.includes('class="quantity-picker-handle"') && indexWxml.includes('catchtouchend="endQuantityPickerSummarySwipe"') && indexWxml.includes('bindtap="openDetailFromQuantityPicker"'), 'the sheet must retain its visible pull cue, swipe-up detail path and whole-summary detail entry');

for (const [source, selector] of [[cartPanelWxss, '.cart-checkout-face'], [indexWxss, '.quick-checkout-action-face'], [indexWxss, '.detail-action-face']]) {
  const rule = baseRule(source, selector);
  assert(px(rule['min-height']) >= 38 && rule['border-radius'] === '999px', `${selector} must be a compact rounded visible face`);
}
for (const [source, selector] of [[cartPanelWxss, '.cart-total button[disabled]'], [indexWxss, '.quick-checkout>button:last-child[disabled]'], [indexWxss, '.detail-actions button[disabled]']]) {
  assert.strictEqual(effectiveRule(source, selector).opacity, '1', `${selector} must remain readable and use color, not transparency, for its disabled state`);
}
assert(indexWxss.includes('.detail-actions{') && indexWxss.includes('gap:24px'), 'detail actions must retain clear separation instead of filling the full footer as square blocks');
assert(px(effectiveRule(tabbarWxss, '.tabbar__icon').width) === 24 && px(effectiveRule(tabbarWxss, '.tabbar__label')['font-size']) === 13, 'bottom navigation icons and labels must use the Pixso scale');
assert(effectiveRule(indexWxss, '.is-home .home-header').background === '#f5f8fc' && effectiveRule(indexWxss, '.is-home .brand').color === '#176bd5', 'home header must retain the Pixso light brand baseline');
assert(effectiveRule(indexWxss, '.is-home .deal-purchase>.price-pending').color === '#176bd5' && effectiveRule(indexWxss, '.is-home .quick-checkout .quick-amount').color === '#e45b38', 'home list prices must use Pixso brand blue while the checkout total keeps its approved emphasis color');

assert(checkoutWxml.includes('共 {{cartItemQty}} 件') && checkoutWxml.includes('共 <text>{{cartItemQty}}</text> 件') && checkoutWxml.includes('wx:if="{{quoteState == \'ready\'}}" class="bottom-amount">¥{{orderTotal}}'), 'checkout list and footer must use the summed item quantity and real quote data');
assert(checkoutWxss.includes('.submit-button[disabled] {') && checkoutWxss.includes('opacity: 1;'), 'checkout disabled actions must stay readable instead of inheriting the global low-opacity treatment');
assert(checkoutWxml.includes('<text wx:else>—</text>') && !checkoutWxml.includes('未定价'), 'checkout non-ready states must not reuse an old payable amount or expose unpriced wording');
assert(!checkoutWxml.includes('<text>¥{{cartTotal}}</text>') && checkoutWxml.includes('<text wx:if="{{quoteState == \'ready\'}}">¥{{cartTotal}}</text>'), 'goods subtotal must not render a currency prefix around a non-ready placeholder');
const checkoutStateAction = baseRule(checkoutWxss, '.state-action');
assert(checkoutStateAction.display === 'inline-flex' && checkoutStateAction.width === 'auto' && checkoutStateAction['align-self'] === 'center', 'checkout retry actions must be compact content-width pills');
const checkoutDisabledSubmit = baseRule(checkoutWxss, '.submit-button[disabled]');
assert(checkoutDisabledSubmit.opacity === '1' && checkoutDisabledSubmit.color === '#43566d' && checkoutDisabledSubmit.border === '1px solid #c6d2df', 'checkout disabled submit must remain clearly readable');
assert(/padding-bottom:\s*calc\(104px \+ constant\(safe-area-inset-bottom\)\)/.test(checkoutWxss) && /padding-bottom:\s*calc\(104px \+ env\(safe-area-inset-bottom\)\)/.test(checkoutWxss), 'checkout content must retain the expanded 104px safe-area-aware clearance above its fixed footer');
assert(/@media \(max-width: 360px\)/.test(checkoutWxss) && /@media \(min-width: 480px\)/.test(checkoutWxss), 'checkout must include compact and wide-phone constraints without device-specific patches');
assert(baseRule(checkoutWxss, '.item-amount')['text-overflow'] !== 'ellipsis' && baseRule(checkoutWxss, '.bottom-amount')['text-overflow'] !== 'ellipsis', 'checkout must not truncate product or payable amounts');
assert(/@media \(max-width: 360px\)[\s\S]*?\.item\s*\{[^}]*grid-template-rows:\s*auto auto/.test(checkoutWxss) && /@media \(max-width: 360px\)[\s\S]*?\.bottom-summary\s*\{[^}]*display:\s*grid/.test(checkoutWxss), '320px checkout must move amounts to a second row instead of shrinking or clipping them');

for (const banned of ['示例', '演示', '测试', '未定价', '占位', '选数量']) {
  assert(!`${indexWxml}\n${checkoutWxml}`.includes(banned), `first-batch customer templates must not contain ${banned}`);
}

let pageDefinition;
const testModule = new Module(path.join(root, 'miniapp/pages/index/index.js'), module);
testModule.filename = path.join(root, 'miniapp/pages/index/index.js');
testModule.paths = Module._nodeModulePaths(path.dirname(testModule.filename));
const originalPage = global.Page;
global.Page = (definition) => { pageDefinition = definition; };
try {
  testModule._compile(indexJs, testModule.filename);
} finally {
  if (originalPage === undefined) delete global.Page;
  else global.Page = originalPage;
}
assert(pageDefinition && typeof pageDefinition.updateLayoutMetrics === 'function' && typeof pageDefinition.openRequestedProduct === 'function', 'main page must expose shared layout calculation and direct product entry');
for (const width of ACCEPTED_WIDTHS) {
  const context = { data: {}, setData(patch) { this.data = { ...this.data, ...patch }; } };
  global.wx = { getMenuButtonBoundingClientRect: () => ({ bottom: 60 }) };
  pageDefinition.updateLayoutMetrics.call(context, {
    windowWidth: width,
    windowHeight: 844,
    screenHeight: 844,
    statusBarHeight: 20,
    safeArea: { bottom: 820 },
    system: width === 480 ? 'Windows 11' : 'iOS 18',
    model: width === 480 ? 'PC' : 'Phone'
  });
  assert(/^\d+px$/.test(context.data.catalogHeight) && Number.parseInt(context.data.catalogHeight, 10) >= 180, `${width}px must produce a valid catalog viewport`);
}
delete global.wx;

console.log('first batch presentation contract test: passed');
