const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const miniappRoot = path.resolve(__dirname, '..', 'miniapp');
const read = (relativePath) => fs.readFileSync(path.join(miniappRoot, relativePath), 'utf8');

let definition;
global.Component = (value) => { definition = value; };
const componentPath = path.join(miniappRoot, 'components', 'product-card', 'index.js');
require(componentPath);
delete global.Component;

const events = [];
const instance = {
  data: { productId: 'p-1', actionDisabled: false, specLabel: '500克' },
  triggerEvent(name, detail) { events.push({ name, detail }); }
};
Object.entries(definition.methods).forEach(([name, method]) => { instance[name] = method.bind(instance); });
instance.openProduct();
instance.chooseSpec();
instance.mediaError();
instance.forwardQuantity({ detail: { quantity: 2 } });
assert.deepEqual(events, [
  { name: 'open', detail: { id: 'p-1' } },
  { name: 'choose', detail: { id: 'p-1' } },
  { name: 'mediaerror', detail: { id: 'p-1' } },
  { name: 'change', detail: { quantity: 2, id: 'p-1', spec: '500克' } }
], 'product card must expose semantic events without page-specific handlers');
instance.data.actionDisabled = true;
instance.chooseSpec();
assert.equal(events.length, 4, 'an unavailable product must not emit a purchase action');

const wxml = read('components/product-card/index.wxml');
const wxss = read('components/product-card/index.wxss');
const pageWxml = read('pages/index/index.wxml');
const pageJson = JSON.parse(read('pages/index/index.json'));

assert(wxml.includes('{{priceText}}') && wxml.includes('{{priceLabel}}') && wxml.includes("priceState == 'locked'"), 'price presentation must make locked and unavailable states explicit');
assert(wxml.includes('product-card__price-amount') && wxml.includes('product-card__price-unit') && wxml.includes('{{priceUnitLabel}}'), 'a visible price must separate amount and packaging unit semantics');
assert(wxml.includes('<product-purchase-action') && wxml.includes('bind:change="forwardQuantity"'), 'single SKU quantity and multi SKU selection must share the fixed purchase-action slot');
assert(/\.product-card__name\{[^}]*-webkit-line-clamp:2/.test(wxss), 'long product names must clamp to two lines without moving the action slot');
assert(/\.product-card__action\{[^}]*width:120px[^}]*min-height:44px/.test(wxss), 'add, choose-spec and unavailable actions must share a fixed accessible slot');
assert(wxss.includes('@media (max-width:350px)') && wxss.includes('grid-template-rows:auto auto'), '320px cards must move the fixed action slot to its own row while regular phone widths keep the Pixso right-aligned action slot');
assert(/\.product-card__price\{[^}]*white-space:nowrap/.test(wxss), 'a complete price must stay on one line; wide values use the dedicated wide-price layout');
assert(/\.product-card__price\.is-locked\{[^}]*white-space:normal[^}]*overflow-wrap:anywhere/.test(wxss), 'locked-price copy must wrap inside its column instead of intruding into the action slot');
assert(wxml.includes('statusText') && wxml.includes('binderror="mediaError"'), 'availability and broken-media states must have visible component paths');
assert(wxss.includes('minmax(0,1fr)') && wxss.includes('overflow-wrap:anywhere'), 'narrow screens must preserve the action position while allowing content to wrap');
assert(!/(?:>|\s)(?:image|text)(?:\b|\[)/.test(wxss) && !/\[[^\]]+\]/.test(wxss), 'component WXSS must use classes instead of forbidden tag or attribute selectors');
assert.equal(pageJson.usingComponents['product-card'], '/components/product-card/index');
const cardJson = JSON.parse(read('components/product-card/index.json'));
assert.equal(cardJson.usingComponents['product-purchase-action'], '/components/product-purchase-action/index');
assert(pageWxml.includes('<product-card') && pageWxml.includes('price-text="{{loggedIn ? (item.priceText || \'\') : \'\'}}"'), 'the real list must not pass a price value into the card for a guest and must not pass null for a logged-in missing price');
assert(pageWxml.includes('price-unit-label="{{loggedIn && item.priceText ? item.priceUnitLabel : \'\'}}"'), 'real product cards must pass a unit only when a price is visible');
assert(pageWxml.includes('action-disabled="{{item.presentation.action == \'disabled\'}}"'), 'known purchase-rule and availability failures must disable the card through the shared presentation state without treating a guest price lock as sold out');
assert(pageWxml.includes('bind:open="openProductFromCard"') && pageWxml.includes('bind:choose="chooseProductFromCard"'), 'the real list must consume semantic component events');
assert(pageWxml.includes('bind:change="changeProductPurchaseQuantity"'), 'the real list must consume quantity changes from the shared card slot');
assert((pageWxml.match(/spec-label="\{\{item\.specLabel \|\| item\.unit\}\}"/g) || []).length >= 2 && !pageWxml.includes('spec-label="{{item.unit}}"'), 'quantity events must carry the selected SKU specification rather than a packaging display unit');
const pageJs = read('pages/index/index.js');
assert(pageJs.includes('this.syncHomeCampaignProducts(products);') && pageJs.indexOf('this.syncHomeCampaignProducts(products);', pageJs.indexOf('syncCart(cartItems')) > -1, 'cart changes must refresh campaign card quantities as well as home and catalog cards');

console.log('product card contract test: passed');
