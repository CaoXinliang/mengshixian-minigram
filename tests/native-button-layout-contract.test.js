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
for (const selector of ['.spec-list button', '.quantity-picker-specs button']) {
  const button = effectiveRule(main, selector);
  assert.strictEqual(button.width, 'auto', `${selector} must size to its label rather than the native default`);
  assert.strictEqual(button['max-width'], '100%', `${selector} must stay inside the dialog/card`);
  assert.strictEqual(button.flex, '0 1 auto', `${selector} must shrink for long specifications`);
}

for (const [relativePath, selector, label] of [
  ['miniapp/package-trade/pages/addresses/index.wxss', '.address-actions', 'address actions'],
  ['miniapp/package-trade/pages/orders/index.wxss', '.actions', 'order-card actions'],
  ['miniapp/pages/index/index.wxss', '.order-card-actions', 'main order-card actions']
]) {
  assert.strictEqual(effectiveRule(read(relativePath), selector)['flex-wrap'], 'wrap', `${label} must wrap as a group on compact screens`);
}

for (const [relativePath, controlSelector, faceSelector, faceWidth, label] of [
  ['miniapp/pages/index/index.wxss', '.stepper button', '.stepper .step-face', '50rpx', 'cart quantity'],
  ['miniapp/package-business/pages/frequent/index.wxss', '.qty button', '.qty button > text', '42rpx', 'frequent quantity'],
  ['miniapp/package-business/pages/inquiry-create/index.wxss', '.qty button', '.qty button > text', '40rpx', 'inquiry quantity'],
  ['miniapp/package-marketing/pages/bundle-detail/index.wxss', '.qty button', '.qty button > text', '46rpx', 'bundle quantity'],
  ['miniapp/package-trade/pages/aftersale-apply/index.wxss', '.quantity button', '.quantity button > text', '42rpx', 'aftersale quantity']
]) {
  const source = read(relativePath);
  const control = effectiveRule(source, controlSelector);
  const face = effectiveRule(source, faceSelector);
  assert.strictEqual(control.width, '44px', `${label} hit target must stay 44px`);
  assert.strictEqual(control.height, '44px', `${label} hit target must stay 44px`);
  assert.strictEqual(control.background, 'transparent', `${label} hit target must not become the visible button`);
  assert.strictEqual(control.border, '0', `${label} hit target must remain visually transparent`);
  assert.strictEqual(face.width, faceWidth, `${label} face must retain its compact diameter`);
  assert.strictEqual(face.height, faceWidth, `${label} face must remain circular rather than stretched`);
  assert.strictEqual(face['border-radius'], '50%', `${label} face must remain circular`);
  assert.match(face.border || '', /^1px solid /, `${label} face must use a thin clarity outline`);
  if (relativePath !== 'miniapp/pages/index/index.wxss') {
    assert.strictEqual(face['min-width'], '0', `${label} rpx face must remain symmetrically capped on wider screens`);
    assert.match(face['max-width'] || '', /^\d+px$/, `${label} face must cap width together with max-height`);
  }
}

const quantityPickerClose = effectiveRule(main, '.quantity-picker-head>.quantity-picker-close');
const quantityPickerCloseFace = effectiveRule(main, '.quantity-picker-close-face');
const quantityPickerStepper = effectiveRule(main, '.quantity-picker-stepper');
assert.strictEqual(quantityPickerClose.width, '44px', 'quantity picker close hit target must remain 44px');
assert.strictEqual(quantityPickerClose.background, 'transparent', 'quantity picker close hit target must be visually transparent');
assert.strictEqual(quantityPickerCloseFace.width, '50rpx', 'quantity picker close face must retain its compact diameter');
assert.strictEqual(quantityPickerCloseFace.height, '50rpx', 'quantity picker close face must remain circular');
assert.strictEqual(quantityPickerCloseFace['border-radius'], '50%', 'quantity picker close face must remain circular');
assert.match(quantityPickerCloseFace.border || '', /^1px solid /, 'quantity picker close face must use a thin clarity outline');
assert.strictEqual(quantityPickerStepper.background, 'transparent', 'quantity picker stepper wrapper must not render a large visible pill');

console.log('native button layout contract test: passed');
