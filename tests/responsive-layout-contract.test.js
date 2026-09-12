const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const appJson = JSON.parse(read('miniapp/app.json'));
const appWxss = read('miniapp/app.wxss');
const indexWxss = read('miniapp/pages/index/index.wxss');
const addressWxss = read('miniapp/package-trade/pages/addresses/index.wxss');
const invoiceWxml = read('miniapp/package-member/pages/invoices/index.wxml');
const invoiceWxss = read('miniapp/package-member/pages/invoices/index.wxss');
const topbarJsPath = path.join(root, 'miniapp/components/responsive-topbar/index.js');
const topbarJs = read('miniapp/components/responsive-topbar/index.js');
const topbarWxml = read('miniapp/components/responsive-topbar/index.wxml');
const topbarWxss = read('miniapp/components/responsive-topbar/index.wxss');

assert(
  /button,\s*input,\s*textarea,\s*picker\s*\{[^}]*min-width:\s*0;[^}]*box-sizing:\s*border-box;/s.test(appWxss),
  'native buttons and form controls must share a shrinkable border-box baseline'
);
assert(
  appJson.usingComponents && appJson.usingComponents['responsive-topbar'] === '/components/responsive-topbar/index',
  'the responsive topbar must be registered once at application level'
);
assert(
  topbarJs.includes('wx.getWindowInfo') &&
    topbarJs.includes('wx.getMenuButtonBoundingClientRect') &&
    !topbarJs.includes('wx.getSystemInfoSync'),
  'the topbar must derive its safe area from current split APIs and the real menu capsule'
);
assert(
  topbarWxml.includes('padding-right: {{capsuleInsetRight}}px') &&
    topbarWxss.includes('.topbar__copy') &&
    topbarWxss.includes('min-width: 0;') &&
    topbarWxss.includes('text-overflow: ellipsis;'),
  'the topbar title column must stay outside the capsule and shrink without escaping the viewport'
);

const packagePages = appJson.subpackages.flatMap((subpackage) =>
  subpackage.pages.map((page) => `miniapp/${subpackage.root}/${page}.wxml`)
);
assert.strictEqual(packagePages.length, 24, 'all 24 package routes must remain declared');
assert(
  packagePages.includes('miniapp/package-member/pages/legal/index.wxml'),
  'the versioned privacy policy and service agreement route must remain declared'
);
for (const pagePath of packagePages) {
  const wxml = read(pagePath);
  assert(wxml.includes('<responsive-topbar'), `${pagePath} must use the shared topbar`);
  assert(!wxml.includes('class="topbar"'), `${pagePath} must not render a legacy copied topbar`);
}

assert(
  indexWxss.includes('.quantity-picker{max-height:calc(100vh - 24rpx);overflow-y:auto}') &&
    indexWxss.includes('.quantity-picker-actions{grid-template-columns:minmax(0,.9fr) minmax(0,1.4fr)}') &&
    indexWxss.includes('.quantity-picker-actions button,.detail-actions button{width:100%;min-width:0;'),
  'quantity and detail action sheets must stay scrollable and keep both actions inside their grid'
);
assert(
  indexWxss.includes('.catalog-bottom-space{height:calc(260rpx + constant(safe-area-inset-bottom))') &&
    indexWxss.includes('height:calc(260rpx + env(safe-area-inset-bottom))'),
  'catalog content must reserve both fixed action layers and the platform safe area'
);
assert(
  indexWxss.includes('@media screen and (max-width: 414px)') &&
    indexWxss.includes('-webkit-line-clamp:2') &&
    indexWxss.includes('.home-category text{font-size:21rpx}'),
  'compact and regular phone widths must have bounded long product and category labels'
);
assert(
  addressWxss.includes('grid-template-columns:minmax(0,1fr) minmax(0,1.35fr)') &&
    addressWxss.includes('.form-actions button{display:flex;align-items:center;justify-content:center;width:100%;min-width:0;') &&
    addressWxss.includes('@media screen and (max-width: 360px)'),
  'address actions must shrink safely and switch to equal columns on compact screens'
);
assert(
  invoiceWxml.includes('class="sheet-submit"') &&
    invoiceWxss.includes('.sheet{max-height:calc(100vh - 24rpx)') &&
    invoiceWxss.includes('overflow-y:auto') &&
    invoiceWxss.includes('env(safe-area-inset-bottom)') &&
    invoiceWxss.includes('.sheet-submit{align-self:stretch;width:auto!important;'),
  'invoice controls must be reachable, safe-area aware, and use a full-width submit action'
);

let componentDefinition;
const originalComponent = global.Component;
const originalWx = global.wx;
global.Component = (definition) => {
  componentDefinition = definition;
};
delete require.cache[require.resolve(topbarJsPath)];
require(topbarJsPath);

const layoutCases = [
  {
    name: 'compact iPhone',
    windowInfo: { windowWidth: 320, statusBarHeight: 20 },
    menuRect: { left: 223, top: 24, width: 87, height: 32 }
  },
  {
    name: 'regular iPhone',
    windowInfo: { windowWidth: 390, statusBarHeight: 20 },
    menuRect: { left: 293, top: 24, width: 87, height: 32 }
  },
  {
    name: 'Windows simulator',
    windowInfo: { windowWidth: 480, statusBarHeight: 0 },
    menuRect: { left: 382, top: 6, width: 88, height: 32 }
  }
];

for (const layoutCase of layoutCases) {
  global.wx = {
    getWindowInfo: () => layoutCase.windowInfo,
    getMenuButtonBoundingClientRect: () => layoutCase.menuRect
  };
  const context = {
    data: {},
    setData(next) {
      this.data = { ...this.data, ...next };
    }
  };
  componentDefinition.methods.updateLayout.call(context);
  assert(Number.isFinite(context.data.statusBarHeight), `${layoutCase.name} status bar must be finite`);
  assert(context.data.navigationHeight >= 40, `${layoutCase.name} navigation row must remain tappable`);
  assert(
    context.data.capsuleInsetRight >= layoutCase.windowInfo.windowWidth - layoutCase.menuRect.left,
    `${layoutCase.name} content must end before the capsule`
  );
}

global.Component = originalComponent;
global.wx = originalWx;

console.log('responsive layout contract test: passed');
