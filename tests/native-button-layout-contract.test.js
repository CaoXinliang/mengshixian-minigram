const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

function ruleBodies(source, selector) {
  const bodies = [];
  const css = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const pattern = /([^{}]+)\{([^{}]*)\}/g;
  let match;
  while ((match = pattern.exec(css))) {
    const normalize = value => value.trim().replace(/\s*>\s*/g, '>');
    const selectors = match[1].split(',').map(normalize);
    if (selectors.includes(normalize(selector))) bodies.push(match[2]);
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
  return ruleBodies(source, selector).reduce((output, body) => Object.assign(output, declarations(body)), {});
}

function assertGridButtons(relativePath, containerSelector, buttonSelector, columns, label) {
  const source = read(relativePath);
  const container = effectiveRule(source, containerSelector);
  const button = effectiveRule(source, buttonSelector);
  assert.strictEqual(container['grid-template-columns'].replace(/\s+/g, ''), columns, `${label} must use shrinkable grid tracks`);
  assert.strictEqual(button.width, '100%', `${label} buttons must fill only their own track`);
  assert.strictEqual(button['min-width'], '0', `${label} buttons must be allowed to shrink`);
  assert.strictEqual(button['max-width'], '100%', `${label} buttons must not escape their track`);
}

assertGridButtons(
  'miniapp/package-trade/pages/checkout/index.wxss',
  '.fulfillment-tabs',
  '.fulfillment-tabs button',
  'minmax(0,1fr)minmax(0,1fr)',
  'checkout fulfillment choices'
);
assertGridButtons(
  'miniapp/package-business/pages/center/index.wxss',
  '.quick',
  '.quick button',
  'repeat(3,minmax(0,1fr))',
  'procurement quick actions'
);
assertGridButtons(
  'miniapp/package-marketing/pages/groups/index.wxss',
  '.tabs',
  '.tabs button',
  'minmax(0,1fr)minmax(0,1fr)',
  'group tabs'
);

for (const [relativePath, selector, label] of [
  ['miniapp/package-business/pages/inquiry-detail/index.wxss', '.result button', 'inquiry result actions'],
  ['miniapp/package-trade/pages/orders/index.wxss', '.refund-actions button', 'refund dialog actions'],
  ['miniapp/pages/index/index.wxss', '.service-quick-actions button', 'service quick actions']
]) {
  const button = effectiveRule(read(relativePath), selector);
  assert.strictEqual(button.width, '100%', `${label} must divide the available row instead of using native button width`);
  assert.strictEqual(button['min-width'], '0', `${label} must shrink on compact screens`);
  assert.strictEqual(button['max-width'], '100%', `${label} must stay inside its column`);
}

for (const [relativePath, selector, expectedMinimum, label] of [
  ['miniapp/package-trade/pages/addresses/index.wxss', '.address-actions button', '0', 'address text actions'],
  ['miniapp/package-marketing/pages/coupons/index.wxss', '.coupon button', '44px', 'coupon action'],
  ['miniapp/package-member/pages/favorites/index.wxss', '.card button', '44px', 'favorite action'],
  ['miniapp/package-trade/pages/orders/index.wxss', '.actions button', '0', 'order-card actions'],
  ['miniapp/package-trade/pages/order-detail/index.wxss', '.actions button', '0', 'order-detail actions'],
  ['miniapp/pages/index/index.wxss', '.order-card-actions button', '0', 'main order-card actions'],
  ['miniapp/pages/index/index.wxss', '.order-filter button', '0', 'main order filters'],
  ['miniapp/pages/index/index.wxss', '.group-card>button', '112rpx', 'main group-card action']
]) {
  const button = effectiveRule(read(relativePath), selector);
  assert.strictEqual(button.width, 'auto', `${label} must remain a compact content-width control`);
  assert.strictEqual(button['min-width'], expectedMinimum, `${label} must use only its explicit layout minimum`);
}

const checkout = read('miniapp/package-trade/pages/checkout/index.wxss');
for (const selector of ['.warehouse-list button', '.delivery-slot-list button']) {
  const button = effectiveRule(checkout, selector);
  assert.strictEqual(button.width, 'auto', `${selector} must keep content width while wrapping`);
  assert.strictEqual(button['max-width'], '100%', `${selector} must fit compact cards`);
  assert.strictEqual(button.flex, '0 1 auto', `${selector} must shrink before overflowing`);
}
assert.strictEqual(effectiveRule(checkout, '.pickup-site').width, '100%', 'pickup sites must fill their one-column list');

const main = read('miniapp/pages/index/index.wxss');
const appStyles = read('miniapp/app.wxss');
for (const selector of ['.state>button', '.empty>button']) {
  const action = effectiveRule(appStyles, selector);
  assert.strictEqual(action.display, 'inline-flex', `${selector} must shrink its visible surface to the action label`);
  assert.strictEqual(action.width, 'fit-content', `${selector} must not render as a full-row native button`);
  assert.strictEqual(action['min-width'], '44px', `${selector} must retain a 44px horizontal target`);
  assert.strictEqual(action['min-height'], '44px', `${selector} must retain a 44px vertical target`);
  assert.strictEqual(action['max-width'], '100%', `${selector} must still fit narrow cards`);
  assert.strictEqual(action.flex, 'none', `${selector} must not stretch as a flex item`);
}
for (const selector of ['.spec-list button', '.quantity-picker-specs button']) {
  const button = effectiveRule(main, selector);
  assert.strictEqual(button.width, 'auto', `${selector} must size to its label rather than the native default`);
  assert.strictEqual(button['min-width'], '44px', `${selector} must retain a full touch target around its compact face`);
  assert.strictEqual(button['min-height'], '44px', `${selector} must retain a full touch target around its compact face`);
  assert.strictEqual(button['max-width'], '100%', `${selector} must stay inside the dialog/card`);
  assert.strictEqual(button.flex, '0 1 auto', `${selector} must shrink for long specifications`);
  assert.strictEqual(button.background, 'transparent', `${selector} hit target must not become the visible oversized rectangle`);
  assert.strictEqual(button.border, '0', `${selector} hit target must stay visually transparent`);
}
const specOptionFace = effectiveRule(main, '.spec-option-face');
assert(
  specOptionFace['min-height'] === '34px' &&
    specOptionFace['max-width'] === '100%' &&
    specOptionFace.padding === '5px 10px' &&
    specOptionFace['border-radius'] === '999px' &&
    /^1px solid\b/.test(specOptionFace.border || ''),
  'detail and quantity-picker specifications must share one compact outlined pill face'
);
assert.strictEqual(effectiveRule(main, '.spec-list').gap, '16px', 'detail specification faces must keep a readable gap');
assert.strictEqual(effectiveRule(main, '.quantity-picker-specs').gap, '8px 14px', 'quantity-picker specification faces must retain the approved row and column gaps around 44px controls');

for (const [relativePath, selector, label] of [
  ['miniapp/package-trade/pages/addresses/index.wxss', '.address-actions', 'address actions'],
  ['miniapp/package-trade/pages/orders/index.wxss', '.actions', 'order-card actions'],
  ['miniapp/pages/index/index.wxss', '.order-card-actions', 'main order-card actions']
]) {
  assert.strictEqual(effectiveRule(read(relativePath), selector)['flex-wrap'], 'wrap', `${label} must wrap as a group on compact screens`);
}

for (const [relativePath, controlSelector, faceSelector, faceWidth, label] of [
  ['miniapp/components/quantity-stepper/index.wxss', '.quantity-stepper .step-control', '.step-face', '30px', 'cart quantity'],
  ['miniapp/package-business/pages/frequent/index.wxss', '.qty button', '.qty button > text', '42rpx', 'frequent quantity'],
  ['miniapp/package-business/pages/inquiry-create/index.wxss', '.qty button', '.qty button > text', '40rpx', 'inquiry quantity'],
  ['miniapp/package-marketing/pages/bundle-detail/index.wxss', '.qty button', '.qty button > text', '46rpx', 'bundle quantity'],
  ['miniapp/package-trade/pages/aftersale-apply/index.wxss', '.quantity button', '.quantity button > text', '28px', 'aftersale quantity']
]) {
  const source = read(relativePath);
  const control = { ...effectiveRule(source, 'button'), ...effectiveRule(source, controlSelector) };
  const face = effectiveRule(source, faceSelector);
  assert.strictEqual(control.width, '44px', `${label} hit target must stay 44px`);
  assert.strictEqual(control.height, '44px', `${label} hit target must stay 44px`);
  assert.strictEqual(control.background, 'transparent', `${label} hit target must not become the visible button`);
  assert.strictEqual(control.border, '0', `${label} hit target must remain visually transparent`);
  assert.strictEqual(face.width, faceWidth, `${label} face must retain its compact diameter`);
  assert.strictEqual(face.height, faceWidth, `${label} face must remain circular rather than stretched`);
  assert.strictEqual(face['border-radius'], '50%', `${label} face must remain circular`);
  assert.match(face.border || '', /^1px solid /, `${label} face must use a thin clarity outline`);
  if (faceWidth.endsWith('rpx')) {
    assert.strictEqual(face['min-width'], '0', `${label} rpx face must remain symmetrically capped on wider screens`);
    assert.match(face['max-width'] || '', /^\d+px$/, `${label} face must cap width together with max-height`);
  }
}

const quantityPickerClose = effectiveRule(main, '.quantity-picker-head>.quantity-picker-close');
const quantityPickerCloseFace = effectiveRule(main, '.quantity-picker-close-face');
const quantityPickerStepper = effectiveRule(main, '.quantity-picker-stepper');
const quantityPickerHead = effectiveRule(main, '.quantity-picker-head');
const quantityPickerSummaryImage = effectiveRule(main, '.quantity-picker-summary>image');
const quantityPickerDisabledAction = effectiveRule(main, '.quantity-picker-actions button[disabled]');
assert.strictEqual(quantityPickerHead['min-height'], '104px', 'quantity picker summary must retain the approved readable header height');
assert(quantityPickerSummaryImage.width === '64px' && quantityPickerSummaryImage.height === '64px', 'the narrow-screen summary image must retain the approved bounded size');
assert(quantityPickerSummaryImage['min-width'] === '44px' && quantityPickerSummaryImage['min-height'] === '44px', 'the tappable summary image must remain at least 44px on 320px compact phones');
assert.strictEqual(quantityPickerClose.width, '44px', 'quantity picker close hit target must remain 44px');
assert.strictEqual(quantityPickerClose.background, 'transparent', 'quantity picker close hit target must be visually transparent');
assert.strictEqual(quantityPickerCloseFace.width, '36px', 'quantity picker close face must retain its compact diameter');
assert.strictEqual(quantityPickerCloseFace.height, '36px', 'quantity picker close face must remain circular');
assert.strictEqual(quantityPickerCloseFace['border-radius'], '50%', 'quantity picker close face must remain circular');
assert.strictEqual(quantityPickerCloseFace.border, '0', 'quantity picker close face uses the approved subtle surface rather than an extra outline');
assert.strictEqual(quantityPickerStepper.background, 'transparent', 'quantity picker stepper wrapper must not render a large visible pill');
assert.strictEqual(quantityPickerDisabledAction.opacity, '1', 'quantity picker disabled faces must not be faded twice by the global disabled opacity');
assert.strictEqual(effectiveRule(main, '.quantity-picker-action-face').padding, '0 20px', 'quantity picker actions must retain the approved spacing around readable labels');

console.log('native button layout contract test: passed');
