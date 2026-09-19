const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../miniapp');
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');

function effectiveRule(source, selector) {
  source = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const declarations = {};
  const rulePattern = /([^{}]+)\{([^{}]*)\}/g;
  let ruleMatch;
  while ((ruleMatch = rulePattern.exec(source))) {
    const selectors = ruleMatch[1].split(',').map(item => item.trim().replace(/\s*>\s*/g, '>'));
    if (!selectors.includes(selector)) continue;
    for (const declaration of ruleMatch[2].split(';')) {
      const separator = declaration.indexOf(':');
      if (separator < 0) continue;
      declarations[declaration.slice(0, separator).trim()] = declaration.slice(separator + 1).trim();
    }
  }
  return declarations;
}

function px(value) {
  const match = String(value || '').match(/^(\d+(?:\.\d+)?)px$/);
  return match ? Number(match[1]) : NaN;
}

assert.equal(effectiveRule('/* readable baseline */ .page {font-size:16px}', '.page')['font-size'], '16px', 'CSS comments must not be treated as part of a selector');

const favoritesWxss = read('package-member/pages/favorites/index.wxss');
const favoritesJs = read('package-member/pages/favorites/index.js');
const favoritesWxml = read('package-member/pages/favorites/index.wxml');
const favoriteSpecRule = effectiveRule(favoritesWxss, '.product-copy text:not(:first-child)');
for (const property of ['min-width', 'min-height', 'padding', 'border-radius']) {
  assert.equal(favoriteSpecRule[property], undefined, `favorite specification prose must not inherit button geometry (${property}) at 480px`);
}
assert.equal(favoriteSpecRule['font-size'], '14px', '480px specification text keeps its readable size');
assert.match(favoritesJs, /favorites\.listAll|createFavoritesLifecycle/, 'favorites must read the complete collection through its lifecycle module');
assert.match(favoritesJs, /authorizeMemberPage|onShow\(\)|onUnload\(\)/, 'favorites must refresh and invalidate protected state with the member page lifecycle');
assert.doesNotMatch(favoritesJs, /catalog|listAllProducts|recommendations/, 'favorites must not scan the product catalog or invent recommendations');
assert.doesNotMatch(favoritesWxml, /你可能需要|recommendation-card/, 'favorites must not present arbitrary catalog rows as recommendations');
assert.match(favoritesWxml, /item\.unavailableText/, 'unavailable favorites must explain the server-provided lifecycle state');
assert.match(favoritesWxml, /item\.removeText/, 'remove failures and unknown results must remain visible beside the original favorite');

const storedJs = read('package-member/pages/stored-value/index.js');
const storedWxml = read('package-member/pages/stored-value/index.wxml');
const storedWxss = read('package-member/pages/stored-value/index.wxss');
assert(storedWxml.includes('储值与充值服务暂未开放'), 'stored-value page must expose a clear read-only production status');
assert.doesNotMatch(storedWxml, /<\s*(?:input|form|button)\b|bind(?:tap|submit)\s*=|充值意向/, 'unavailable stored-value capability must not render a top-up form or action');
assert(storedJs.includes('!this.data.account.topupEnabled'), 'top-up action must enforce the capability again');
assert(storedWxss.includes('.page{font-size:14px}'), 'stored-value status text must remain readable');

// Points labels and unknown action fallback are exercised through the page's
// public ledger in member-auth-refresh.test.js and points-account.test.js.

const invoiceWxml = read('package-member/pages/invoices/index.wxml');
const invoiceWxss = read('package-member/pages/invoices/index.wxss');
assert(invoiceWxml.includes('电子发票暂未开放'), 'invoice page must expose a clear read-only production status');
assert.doesNotMatch(invoiceWxml, /<\s*(?:input|form|button)\b|bind(?:tap|submit)\s*=|申请开票|新增抬头/, 'unavailable invoice capability must not render application forms or actions');
assert(invoiceWxss.includes('.page{font-size:14px}'), 'invoice status text must remain readable');

const reviewJs = read('package-member/pages/reviews/index.js');
const reviewWxml = read('package-member/pages/reviews/index.wxml');
const reviewWxss = read('package-member/pages/reviews/index.wxss');
assert(reviewJs.includes('订单尾号') && reviewJs.includes('raw.slice(-4)'), 'review order identifiers must be demoted and masked');
assert(!reviewWxml.includes('{{item.orderNo}}') && !reviewWxml.includes('{{current.orderNo}}'), 'review UI must not render raw order numbers');
assert(!reviewWxml.includes('✓') && !reviewWxml.includes('○'), 'selection state must not depend on text glyphs');
const ratingMarkup = (reviewWxml.match(/<view class="rating">([\s\S]*?)<\/view>/) || [])[0] || '';
assert(
  ratingMarkup.includes('wx:for="{{[1,2,3,4,5]}}"') &&
    ratingMarkup.includes('aria-role="button"') &&
    ratingMarkup.includes('aria-label="选择 {{item}} 星评分"') &&
    ratingMarkup.includes('aria-pressed="{{rating == item}}"') &&
    ratingMarkup.includes('bindtap="setRating"'),
  'each review star must announce its rating and pressed state to assistive technology'
);
for (const className of ['check-icon', 'media-add', 'media-retry', 'media-remove', 'review-submit']) assert(reviewWxml.includes(className), `${className} review control is required`);
assert(reviewWxss.includes('.review-submit') && reviewWxss.includes('min-height:44px'), 'review actions must have a stable primary control and touch target');

const inquiryJs = read('package-business/pages/inquiries/index.js');
const inquiryWxml = read('package-business/pages/inquiries/index.wxml');
assert(inquiryWxml.includes("action-label=\"{{canCreateInquiry ? '新建询价' : ''}}\""), 'inquiry header action must bind to an explicit capability');
assert(inquiryJs.includes('if (!this.data.canCreateInquiry) return;'), 'inquiry creation must enforce capability inside the handler');

for (const [relativePath, supportingSelector, actionSelector] of [
  ['package-member/pages/points/index.wxss', '.row>view text:last-child', '.state button'],
  ['package-member/pages/reviews/index.wxss', '.order-label', '.review-submit'],
  ['package-business/pages/inquiries/index.wxss', '.card>text', '.card']
]) {
  const wxss = read(relativePath);
  assert(px(effectiveRule(wxss, '.page')['font-size']) >= 14, `${relativePath} must keep body text at 14px or larger without viewport-scaled units`);
  assert(px(effectiveRule(wxss, supportingSelector)['font-size']) >= 13, `${relativePath} must keep supporting text at 13px or larger without viewport-scaled units`);
  assert(px(effectiveRule(wxss, actionSelector)['min-height']) >= 44, `${relativePath} must keep its primary interactive target at least 44px high`);
}

// Static six-width typography checks, not a substitute for device rendering.
for (const [pageName, selectors] of [
  ['center', ['.account>text:nth-child(2)', '.account>view>view text:first-child', '.row>view text:last-child', '.quick button']],
  ['frequent', ['.info text:first-child', '.info text:not(:first-child)', '.qty text', '.bar button']],
  ['inquiry-create', ['.search', '.info text:first-child', '.info text:last-child', '.note text', '.note textarea']],
  ['inquiry-detail', ['.hero text:not(:first-child)', '.row text', '.row>view text:last-child', '.quote-head text:last-child', '.result button']],
  ['repurchase', ['.row>view text:last-child', '.invalid-row', '.state text:nth-child(2)', '.bar button']]
]) {
  const css = read(`package-business/pages/${pageName}/index.wxss`);
  assert.equal(px(effectiveRule(css, '.page')['font-size']), 16, `${pageName} body must remain readable`);
  for (const width of [320, 375, 390, 414, 428, 480]) {
    for (const selector of selectors) {
      assert(px(effectiveRule(css, selector)['font-size']) >= 14, `${pageName} ${selector} must use readable px typography at ${width}px`);
    }
  }
}
for (const [pageName, rowSelector] of [['frequent', '.card'], ['inquiry-create', '.item']]) {
  const css = read(`package-business/pages/${pageName}/index.wxss`);
  assert.equal(effectiveRule(css, rowSelector)['flex-wrap'], 'wrap', `${pageName} controls must be able to move to another line`);
  assert.equal(effectiveRule(css, '.info').flex, '1 1 120px', `${pageName} product text needs space instead of shrinking beside controls`);
}

console.log('member UI contract test: passed');
