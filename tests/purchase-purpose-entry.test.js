const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../miniapp');
const pageJs = fs.readFileSync(path.join(root, 'pages/index/index.js'), 'utf8');
const pageWxml = fs.readFileSync(path.join(root, 'pages/index/index.wxml'), 'utf8');
const pageJson = JSON.parse(fs.readFileSync(path.join(root, 'pages/index/index.json'), 'utf8'));
const componentJs = fs.readFileSync(path.join(root, 'components/purchase-purpose/index.js'), 'utf8');
const componentWxml = fs.readFileSync(path.join(root, 'components/purchase-purpose/index.wxml'), 'utf8');
const componentWxss = fs.readFileSync(path.join(root, 'components/purchase-purpose/index.wxss'), 'utf8');

assert.equal(pageJson.usingComponents['purchase-purpose'], '/components/purchase-purpose/index', 'the purpose entry must be a shared component');
assert(pageWxml.includes('<purchase-purpose') && pageWxml.includes('bind:select="selectPurchasePurpose"') && pageWxml.includes('bind:skip="skipPurchasePurpose"'), 'the main shell must consume semantic purpose events');
assert(componentJs.includes('商家采购') && componentJs.includes('家庭个人') && componentWxml.includes('先浏览'), 'the entry must offer exactly the two confirmed purposes plus guest browsing');
assert(!componentWxml.includes('餐饮商家') && !componentWxml.includes('零售类') && !componentJs.includes('餐饮商家') && !componentJs.includes('零售类'), 'restaurant and retail belong to the application form, not a third purpose');
assert(componentJs.includes("value: 'business'") && componentJs.includes("value: 'personal'"), 'the component must emit stable navigation intentions');
assert(componentWxss.includes('env(safe-area-inset-bottom)') && componentWxss.includes('position:fixed'), 'the entry must cover the app shell and respect the phone safe area');
assert(componentWxss.includes(':host{display:block;width:100%;height:100%}') && componentWxss.includes('.purpose-options{display:flex;width:686rpx') && componentWxss.includes('.purpose-option{position:relative;display:flex') && componentWxss.includes('width:686rpx'), 'the custom-component host and option cards must keep a stable viewport-relative width');
assert(componentWxml.includes('class="purpose-option-arrow"') && componentWxss.includes('.purpose-option-arrow{'), 'the purpose-card arrow must use an explicit component class');
assert(!/(?:>|\s)(?:image|text)(?:\b|\[)/.test(componentWxss) && !/\[[^\]]+\]/.test(componentWxss), 'component WXSS must use classes instead of forbidden tag or attribute selectors');
[320, 375, 390, 414, 428, 480].forEach((width) => {
  const cardWidth = width * 686 / 750;
  const sideSpace = (width - cardWidth) / 2;
  const copyWidth = cardWidth - 24 - 22 - 70 - 14;
  assert(sideSpace >= 12, `${width}px purpose card must retain visible side space`);
  assert(copyWidth >= 160, `${width}px purpose card must keep the title and arrow on one readable row`);
});
assert(pageJs.includes("purpose === 'business'") && pageJs.includes("type: 'businessApplication'"), 'business purpose must continue to login/application rather than grant access');
assert(pageJs.includes("purpose === 'personal'") && pageJs.includes("purchasePurposeVisible: false"), 'personal purpose must enter the customer path');
assert(!/userType\s*:\s*['\"]b['\"]/.test(pageJs.slice(pageJs.indexOf('selectPurchasePurpose'), pageJs.indexOf('selectPurchasePurpose') + 1400)), 'purpose selection must not write a B identity');

console.log('purchase purpose entry contract test: passed');
