const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const js = read('miniapp/pages/index/index.js');
const wxml = read('miniapp/pages/index/index.wxml');
const wxss = read('miniapp/pages/index/index.wxss');
const tabbarWxml = read('miniapp/components/app-tabbar/index.wxml');
const productCardWxml = read('miniapp/components/product-card/index.wxml');
const productCardWxss = read('miniapp/components/product-card/index.wxss');
const cartPanelWxml = read('miniapp/components/cart-panel/index.wxml');

function effectiveRule(selector) {
  const output = {};
  const rulePattern = /([^{}]+)\{([^{}]*)\}/g;
  const css = wxss.replace(/\/\*[\s\S]*?\*\//g, '');
  let match;
  while ((match = rulePattern.exec(css))) {
    if (!match[1].split(',').map((item) => item.trim()).includes(selector)) continue;
    for (const declaration of match[2].split(';')) {
      const separator = declaration.indexOf(':');
      if (separator >= 0) output[declaration.slice(0, separator).trim()] = declaration.slice(separator + 1).trim();
    }
  }
  return output;
}

const homeBlock = wxml.slice(wxml.indexOf('<block wx:if="{{page == \'home\'}}">'), wxml.indexOf('<block wx:elif="{{page == \'campaign\'}}">'));
const specialHeading = homeBlock.slice(homeBlock.indexOf('<view wx:if="{{specialSectionEntryEnabled}}" class="section-heading home-module-entry"'), homeBlock.indexOf('<view class="deal-list">'));

assert(homeBlock.indexOf('<template is="homeHeroHeader"') < homeBlock.indexOf('<swiper'), 'home header must stay outside the rotating banner');
assert(homeBlock.indexOf('class="home-blocking-state"') < homeBlock.indexOf('<swiper'), 'a full-page home failure or empty state must replace the banner, categories and products instead of appearing beneath them');
assert(homeBlock.includes('layout="home-blocking"'), 'the full-page home state must use the Pixso blocking-state layout');
assert(specialHeading.includes('{{specialTitle}}') && !specialHeading.includes('specialSubtitle') && !specialHeading.includes('更多'), 'special heading must keep only the useful title');
assert(!js.includes("specialSubtitle: '家庭囤货好价'"), 'home runtime must not retain the obsolete demo subtitle');
assert(js.includes("label: '预制菜熟食'") && homeBlock.includes('<text>{{item.label}}</text>'), 'home must retain the complete category name from its real data');

const header = effectiveRule('.is-home .home-header');
const brand = effectiveRule('.is-home .brand');
assert.equal(header.background, '#f5f8fc', 'home must retain the Pixso light header surface');
assert.equal(header.color, '#176bd5');
assert.equal(brand.color, '#176bd5', 'home brand text must use the Pixso blue semantic');

const categoryText = effectiveRule('.is-home .home-category text');
const categoryCircle = effectiveRule('.home-category-icon');
const categoryIcon = effectiveRule('.is-home .home-category image');
assert(wxss.includes('grid-template-columns:repeat(5,minmax(0,1fr))'), 'regular category grid must keep five equal Pixso columns');
assert(wxss.includes('grid-template-columns:56px 54px minmax(70px,1fr) 56px 54px'), 'compact home must reserve room for complete names, unchanged circles and real spacing');
const compactText = effectiveRule('.is-home .home-category>text');
assert.equal(compactText['font-size'], '14px', 'compact labels may use the authorized readable 14px single-line size');
const compactGrid = effectiveRule('.is-home .home-categories');
assert.equal(compactGrid['margin-left'], '6px', 'compact grid must not press the first label against the screen edge');
assert.equal(compactGrid['margin-right'], '6px');
assert.equal(compactGrid['column-gap'], '4px', 'compact category columns need actual separation');
assert.equal(categoryText['font-size'], '14px');
assert.equal(categoryText['white-space'], 'nowrap');
assert.equal(categoryText.overflow, 'visible');
assert.equal(categoryText['text-overflow'], 'clip');
assert.equal(categoryCircle.width, '48px');
assert.equal(categoryCircle.height, '48px');
assert.equal(categoryIcon.width, '34px');
assert.equal(categoryIcon.height, '34px');

const columnCharacters = [4, 3, 5, 4, 3];
for (const width of [320, 375, 390, 414, 428, 480]) {
  const compact = width <= 350;
  const columns = compact
    ? [56, 54, width - 248, 56, 54]
    : columnCharacters.map((characters) => ((width - 32) / 19) * characters);
  assert(columnCharacters.every((characters, index) => columns[index] >= characters * 14), `${width}px category columns must fit complete labels at the Pixso label size`);
  assert(columns.every((column) => column >= 48), `${width}px category columns must fit the Pixso 48px circles`);
}

assert.equal(effectiveRule('.is-home .deal-purchase>.price-pending').color, '#176bd5', 'home list prices must use the Pixso brand-blue semantic');
assert(homeBlock.includes('wide-price="{{loggedIn && item.priceText && item.priceText.length >= 9}}"'), 'long home prices must select a layout with room for the complete amount');
assert(productCardWxss.includes('.product-card.has-wide-price{grid-template-columns:84px minmax(0,1fr)'), 'long-price cards must release the action column for the full price');
assert(productCardWxss.includes('.product-card.has-wide-price .product-card__action{justify-self:end;grid-column:2;grid-row:2}'), 'long-price specification action must remain right aligned in its own row');
assert.equal(effectiveRule('.is-home .quick-checkout .quick-amount').color, '#e45b38', 'checkout total must use the red price semantic');
assert(homeBlock.includes('bindtap="openCategory"') && homeBlock.includes('bind:open="openProductFromCard"') && homeBlock.includes('bind:choose="chooseProductFromCard"') && homeBlock.includes('bind:change="changeProductPurchaseQuantity"') && productCardWxml.includes('bindtap="openProduct"') && productCardWxml.includes('bind:choose="chooseSpec"') && productCardWxml.includes('bind:change="forwardQuantity"'), 'home category, product, specification and quantity actions must remain bound through public component events');
assert(wxml.includes('class="quick-count-label">已选</text>') && wxml.includes('bindtap="goCheckout"'), 'quick checkout must use the prototype label and retain checkout behavior');
assert(!wxml.includes(' disabled="{{!selectedCartCount || !selectedCartPriceReady}}"'), 'the floating quick checkout may stay tappable so goCheckout can explain an unavailable state');
assert(cartPanelWxml.includes('disabled="{{!selectedCartCount || !selectedCartPriceReady}}"'), 'the cart-panel checkout action must use a native disabled state');
assert((((wxml + cartPanelWxml).match(/aria-disabled="\{\{!selectedCartCount \|\| !selectedCartPriceReady\}\}"/g) || []).length === 2), 'cart and quick checkout must both expose their unavailable state to assistive technology');
assert(wxss.includes('pointer-events:none') && wxss.includes('.login-mask.is-visible{visibility:visible;opacity:1;pointer-events:auto'), 'a hidden login layer must never intercept page taps');
assert(wxml.includes('<app-tabbar') && wxml.includes('bind:change="changeMainTab"'), 'home must consume the shared bottom navigation through its public event');
assert.equal((tabbarWxml.match(/<button\b/g) || []).length, 5, 'all five bottom navigation actions must remain');

console.log('home stage 1 contract test: passed');
