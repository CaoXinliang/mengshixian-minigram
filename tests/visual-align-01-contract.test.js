const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

function rule(source, selector) {
  const compact = String(source).replace(/\/\*[\s\S]*?\*\//g, '');
  const matcher = new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`, 'g');
  let match;
  const result = {};
  while ((match = matcher.exec(compact))) {
    for (const declaration of match[1].split(';')) {
      const separator = declaration.indexOf(':');
      if (separator < 0) continue;
      result[declaration.slice(0, separator).trim()] = declaration.slice(separator + 1).trim();
    }
  }
  return result;
}

const appWxss = read('miniapp/app.wxss');
const pageWxml = read('miniapp/pages/index/index.wxml');
const pageWxss = read('miniapp/pages/index/index.wxss');
const tabbarWxss = read('miniapp/components/app-tabbar/index.wxss');
const productWxss = read('miniapp/components/product-card/index.wxss');
const actionWxss = read('miniapp/components/product-purchase-action/index.wxss');
const cartWxml = read('miniapp/components/cart-panel/index.wxml');
const cartWxss = read('miniapp/components/cart-panel/index.wxss');
const memberWxml = read('miniapp/components/member-home-panel/index.wxml');
const memberWxss = read('miniapp/components/member-home-panel/index.wxss');
const stateWxss = read('miniapp/components/content-state/index.wxss');

assert.equal(rule(appWxss, 'page')['font-size'], '14px');
assert.equal(rule(pageWxss, 'page')['font-size'], '14px', 'main page must not restore the retired 16px root scale');

const homeHeader = rule(pageWxss, '.is-home .home-header');
assert.equal(homeHeader.background, '#f5f8fc');
assert.equal(homeHeader.color, '#176bd5');
assert.equal(rule(pageWxss, '.is-home .brand')['font-size'], '18px');
assert.equal(rule(pageWxss, '.is-home .home-category text')['font-size'], '14px');
assert.equal(rule(pageWxss, '.is-home .section-heading view text:first-child')['font-size'], '20px');

assert.equal(rule(productWxss, '.product-card__name')['font-size'], '16px');
assert.equal(rule(productWxss, '.product-card__spec')['font-size'], '13px');
assert.equal(rule(productWxss, '.product-card__price')['font-size'], '19px');
assert.equal(rule(productWxss, '.product-card__price').color, 'var(--color-brand-primary,#176bd5)');
assert.equal(rule(productWxss, '.product-card__price.is-temporary').color, '#e96762', 'temporary prices must remain visibly distinct from formal Pixso-blue prices');
assert.equal(rule(productWxss, '.product-card__action').width, '120px');
assert.equal(rule(actionWxss, ':host').width, '120px');
assert.equal(rule(actionWxss, '.purchase-action__face')['font-size'], '14px');

assert.equal(rule(tabbarWxss, '.tabbar__icon').width, '24px');
assert.equal(rule(tabbarWxss, '.tabbar__label')['font-size'], '13px');
assert(tabbarWxss.includes('.tabbar__item+.tabbar__item'), 'the confirmed customer preference keeps visible cell boundaries in the Pixso-aligned tabbar');

assert.equal(rule(cartWxss, '.cart-item-name')['font-size'], '16px');
assert.equal(rule(cartWxss, '.cart-spec')['font-size'], '14px');
assert.equal(rule(cartWxss, '.cart-unit-price')['font-size'], '19px');
assert.equal(rule(cartWxss, '.cart-unit-price').color, 'var(--color-brand-primary,#176bd5)');
assert.equal(rule(cartWxss, '.price-pending.is-temporary').color, '#e96762', 'temporary cart prices must retain the shared warning semantic');
assert.equal(rule(cartWxss, '.cart-total-copy')['flex-wrap'], 'nowrap');
assert(cartWxml.includes('class="cart-address"') && cartWxml.includes('class="delivery-method"'), 'cart must restore Pixso address and delivery surfaces');
assert(cartWxml.includes('bindtap="openAddress"') && cartWxml.includes('class="delivery-method-note"') && !cartWxml.includes("warehouseEta : '以结算页为准'}} ›"), 'address must be operable and delivery must not expose a fake navigation affordance');
assert(cartWxml.includes('tone="loading"') && cartWxml.includes('message="请稍候"'), 'cart must use the content-state public API');
assert.equal(rule(cartWxss, '.cart-row>.cart-check').width, '44px');
assert.equal(rule(cartWxss, '.cart-remove-invalid')['min-height'], '44px');
assert.equal(rule(cartWxss, '.empty-state button')['min-height'], '44px');

assert.equal(rule(memberWxss, '.member-head')['font-size'], '20px');
assert.equal(rule(memberWxss, '.member-head').color, 'var(--color-text-primary,#172b43)');
assert.equal(rule(memberWxss, '.member-settings').width, '44px');
assert.equal(rule(memberWxss, '.member-profile-copy text:first-child')['font-size'], '16px');
assert.equal(rule(memberWxss, '.member-service-grid button>text')['font-size'], '13px');
assert.equal(rule(memberWxss, '.guest-action').width, '100%');
assert(memberWxml.includes('class="member-settings"') && !memberWxss.includes('.member-profile>button'), 'settings belongs to the page heading, not inside the profile card');

assert(pageWxml.includes('<text>购买规格</text>'), 'the product sheet must use the Pixso purchase-specification label');
assert(pageWxml.includes('class="quantity-picker-current-spec"'), 'the product sheet summary must display the selected specification');
assert(!pageWxml.includes('<button wx:else class="back-control" aria-label="返回首页"'), 'the normal category tab must not render a duplicate return control');
assert.equal(rule(stateWxss, '.content-state__title')['font-size'], '16px');
assert.equal(rule(stateWxss, '.content-state__message')['font-size'], '13px');

console.log('VISUAL-ALIGN-01 contract test: passed');
