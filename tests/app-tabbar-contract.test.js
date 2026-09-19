const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const componentJs = read('miniapp/components/app-tabbar/index.js');
const componentWxml = read('miniapp/components/app-tabbar/index.wxml');
const componentWxss = read('miniapp/components/app-tabbar/index.wxss');
const pageJson = JSON.parse(read('miniapp/pages/index/index.json'));
const pageWxml = read('miniapp/pages/index/index.wxml');
const pageJs = read('miniapp/pages/index/index.js');

assert(componentJs.includes("this.triggerEvent('change', { tab })"), 'tabbar must expose the selected destination through its public change event');
assert.equal((componentWxml.match(/<button\b/g) || []).length, 5, 'tabbar must expose exactly five primary destinations');
assert(componentWxml.includes("cartCount > 99 ? '99+' : cartCount"), 'visual cart badge must remain bounded');
assert(componentWxml.includes('aria-label="\u8d2d\u7269\u8f66\uff0c\u5171 {{cartCount}} \u4ef6\u5546\u54c1"'), 'assistive text must retain the full cart quantity');
assert(/:host\s*\{[^}]*position:fixed[^}]*right:0[^}]*bottom:0[^}]*left:0/s.test(componentWxss), 'the component host must remain fixed to the viewport bottom after extraction');
assert(componentWxss.includes('env(safe-area-inset-bottom)'), 'fixed navigation must reserve the device safe area');
assert(componentWxss.includes('.tabbar__item+.tabbar__item') && componentWxss.includes('border-left:'), 'five cells must retain visible boundaries');
assert(!/(?:>|\s)(?:image|text)(?:\b|\[)/.test(componentWxss) && !/\[[^\]]+\]/.test(componentWxss), 'component WXSS must use classes instead of forbidden tag or attribute selectors');
assert.equal(pageJson.usingComponents['app-tabbar'], '/components/app-tabbar/index', 'the real main page must register the shared tabbar');
assert(pageWxml.includes('<app-tabbar') && pageWxml.includes('bind:change="changeMainTab"'), 'the real main page must consume the public component event');
assert(pageJs.includes('changeMainTab(event)') && pageJs.includes('event.detail.tab'), 'the page adapter must pass the component destination into existing navigation behavior');

console.log('app tabbar contract test: passed');
