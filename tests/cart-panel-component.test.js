const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../miniapp');
const pageJson = JSON.parse(fs.readFileSync(path.join(root, 'pages/index/index.json'), 'utf8'));
const pageWxml = fs.readFileSync(path.join(root, 'pages/index/index.wxml'), 'utf8');
const componentJson = JSON.parse(fs.readFileSync(path.join(root, 'components/cart-panel/index.json'), 'utf8'));
const componentJs = fs.readFileSync(path.join(root, 'components/cart-panel/index.js'), 'utf8');
const componentWxml = fs.readFileSync(path.join(root, 'components/cart-panel/index.wxml'), 'utf8');
const componentWxss = fs.readFileSync(path.join(root, 'components/cart-panel/index.wxss'), 'utf8');

assert.equal(pageJson.usingComponents['cart-panel'], '/components/cart-panel/index');
assert(pageWxml.includes('<cart-panel') && pageWxml.includes('bind:quantitychange="handleCartPanelQuantityChange"'));
assert.equal(pageWxml.includes('class="cart-row'), false, 'cart row structure must live in the cart domain component');
assert.equal(componentJson.component, true);
assert.equal(componentJson.usingComponents['content-state'], '/components/content-state/index');
assert.equal(componentJson.usingComponents['quantity-stepper'], '/components/quantity-stepper/index');
for (const eventName of ['clear', 'retry', 'toggleall', 'togglerow', 'quantitychange', 'checkout', 'browse']) {
  assert(componentJs.includes(`triggerEvent('${eventName}'`), `cart panel must expose the ${eventName} semantic event`);
}
assert(componentWxml.includes('wx:for="{{cartItems}}"') && componentWxml.includes('wx:key="cartKey"'));
assert(componentWxml.includes('{{selectedCartTotal}}') && componentWxml.includes('{{cartErrorText}}'));
assert(componentWxml.includes('disabled="{{!selectedCartCount || !selectedCartPriceReady}}"'), 'cart checkout must be natively disabled when no payable selection exists');
assert(componentJs.includes("triggerEvent('toggleall', { selected: Boolean("), 'select-all must emit a semantic selected intent');
assert(componentJs.includes("id: dataset.id || ''") && componentJs.includes('selected: Boolean(value.length)'), 'row selection must emit a semantic cart intent');
assert(componentJs.includes('...event.detail') && !componentJs.includes('dataset: { ...event.currentTarget.dataset }'), 'quantity changes must not leak raw component events');
assert(componentWxss.includes('.cart-row') && componentWxss.includes('.cart-total') && componentWxss.includes('@media'));
console.log('cart panel component test: passed');
