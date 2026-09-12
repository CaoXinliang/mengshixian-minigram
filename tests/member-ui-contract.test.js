const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../miniapp');
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');

const storedJs = read('package-member/pages/stored-value/index.js');
const storedWxml = read('package-member/pages/stored-value/index.wxml');
const storedWxss = read('package-member/pages/stored-value/index.wxss');
assert(storedWxml.includes('储值与充值服务暂未开放'), 'stored-value page must expose a clear read-only production status');
assert.doesNotMatch(storedWxml, /<\s*(?:input|form|button)\b|bind(?:tap|submit)\s*=|充值意向/, 'unavailable stored-value capability must not render a top-up form or action');
assert(storedJs.includes('!this.data.account.topupEnabled'), 'top-up action must enforce the capability again');
assert(storedWxss.includes('.page{font-size:14px}'), 'stored-value status text must remain readable');

const pointsJs = read('package-member/pages/points/index.js');
for (const label of ['每日签到', '订单奖励', '退款扣回', '后台调整']) assert(pointsJs.includes(label), `${label} points label is required`);
assert(!pointsJs.includes('|| row.action ||'), 'raw points action codes must never be the display fallback');
assert(pointsJs.includes("POINT_ACTION_LABELS[row.action] || '积分变动'"), 'unknown points action codes need a generic Chinese fallback');

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

for (const relativePath of [
  'package-member/pages/points/index.wxss',
  'package-member/pages/reviews/index.wxss',
  'package-business/pages/inquiries/index.wxss'
]) {
  const wxss = read(relativePath);
  assert(wxss.includes('.page{font-size:14px}'), `${relativePath} must keep body text at 14px or larger`);
  assert(wxss.includes('font-size:13px'), `${relativePath} must keep supporting text at 13px or larger`);
  assert(wxss.includes('min-height:44px'), `${relativePath} must keep interactive targets at least 44px high`);
}

console.log('member UI contract test: passed');
