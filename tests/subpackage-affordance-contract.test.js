const assert = require('assert');
const fs = require('fs');
const path = require('path');

const miniapp = path.resolve(__dirname, '../miniapp');
const read = relativePath => fs.readFileSync(path.join(miniapp, relativePath), 'utf8');

const favoritesWxml = read('package-member/pages/favorites/index.wxml');
const favoritesWxss = read('package-member/pages/favorites/index.wxss');
const aftersaleWxml = read('package-trade/pages/aftersale-apply/index.wxml');
const aftersaleWxss = read('package-trade/pages/aftersale-apply/index.wxss');

assert.match(favoritesWxml, /class="product-link" bindtap="openProduct"/,
  '收藏商品的图片和正文必须组成完整可点击区域');
assert.match(favoritesWxml, /wx:else class="product-link is-disabled" aria-disabled="true"/,
  '不可购买的收藏商品必须呈现为禁用内容，不能保留无效跳转语义');
assert.match(favoritesWxml, /class="product-link-action">查看商品 ›<\/text>/,
  '收藏商品必须显示明确的查看商品行动提示');
assert.match(favoritesWxss, /\.product-link\{[^}]*min-height:44px/,
  '收藏商品入口必须保留不随窄屏缩小的 44px 可点击高度');
assert.match(favoritesWxss, /\.product-link-action\{[^}]*border:/,
  '查看商品提示必须有可辨识的按钮轮廓');

assert.match(aftersaleWxml, /class="evidence-action evidence-action-retry"[^>]*bindtap="retryEvidence"/,
  '售后凭证重试必须使用真正的按钮');
assert.match(aftersaleWxml, /class="evidence-action evidence-action-remove"[^>]*bindtap="removeEvidence"/,
  '售后凭证移除必须使用真正的按钮');
assert.match(aftersaleWxss, /\.evidence-status,[\s\S]*?\.evidence-action \{[\s\S]*?min-height: 44px/,
  '凭证操作按钮必须保留 44px 的点击高度');

console.log('subpackage affordance contract test: passed');
