const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const miniappRoot = path.resolve(__dirname, '..', 'miniapp');
const read = (relativePath) => fs.readFileSync(path.join(miniappRoot, relativePath), 'utf8');

let definition;
global.Component = (value) => { definition = value; };
require(path.join(miniappRoot, 'components', 'product-purchase-action', 'index.js'));
delete global.Component;

const events = [];
const instance = {
  data: { productId: 'p-1', specLabel: '500克装', disabled: false },
  triggerEvent(name, detail) { events.push({ name, detail }); }
};
Object.entries(definition.methods).forEach(([name, method]) => { instance[name] = method.bind(instance); });
instance.chooseSpec();
instance.forwardQuantity({ detail: { valid: true, quantity: 4, source: 'input' } });
assert.deepEqual(events, [
  { name: 'choose', detail: { id: 'p-1' } },
  { name: 'change', detail: { valid: true, quantity: 4, source: 'input', id: 'p-1', spec: '500克装' } }
], 'the shared slot must submit only selection and quantity intent');
instance.data.disabled = true;
instance.chooseSpec();
assert.equal(events.length, 2, 'disabled selection must not emit an intent');

const wxml = read('components/product-purchase-action/index.wxml');
const wxss = read('components/product-purchase-action/index.wxss');
const pageWxml = read('pages/index/index.wxml');
const pageWxss = read('pages/index/index.wxss');
const pageJson = JSON.parse(read('pages/index/index.json'));
assert(wxml.includes('<quantity-stepper') && wxml.includes('bind:change="forwardQuantity"'), 'quantity mode must delegate validation and editing to the established public stepper');
assert(wxss.includes('width:120px') && wxss.includes('max-width:120px') && wxss.includes('white-space:normal'), 'selection and quantity modes must share one fixed slot without stretching the label');
assert(!/(?:>|\s)text(?:\b|\[)/.test(wxss) && !/\[[^\]]+\]/.test(wxss), 'component WXSS must use classes instead of forbidden tag or attribute selectors');
assert.equal(pageJson.usingComponents['product-purchase-action'], '/components/product-purchase-action/index');
assert(pageWxml.includes('<product-purchase-action') && pageWxml.includes('bind:choose="chooseProductFromCard"') && pageWxml.includes('bind:change="changeProductPurchaseQuantity"'), 'a real catalog list must consume both semantic events');
assert(!pageWxml.includes('minimum="0"') && pageWxml.includes('minimum="{{item.minimumQuantity || 1}}"') && wxml.includes('allow-zero="{{true}}"'), 'the list control must validate the real positive minimum while allowing zero only as an explicit deletion value');
assert.equal((pageWxml.match(/action-label="\{\{loggedIn \? \(item\.specSelectionText \|\| '选规格'\) : '选规格'\}\}"/g) || []).length, 3, 'catalog, search and campaign results must never pass a null action label into the shared component');
assert(pageWxss.includes('.catalog-row>product-purchase-action{grid-area:catalog-action;justify-self:end;align-self:center;margin:0}'), 'the migrated action host must occupy the established catalog grid slot at every width');

console.log('product purchase action contract test: passed');
