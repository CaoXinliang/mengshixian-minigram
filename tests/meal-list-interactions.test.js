const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const wxml = fs.readFileSync(path.resolve(__dirname, '../miniapp/components/meal-experience-panel/index.wxml'), 'utf8');
const wxss = fs.readFileSync(path.resolve(__dirname, '../miniapp/components/meal-experience-panel/index.wxss'), 'utf8');

assert.match(
  wxml,
  /<block wx:if="\{\{ideas\.length\}\}">\s*<view class="meal-scene-filter">/,
  '场景筛选只能在权威集合有菜谱时出现，整体空态不能提示切换场景'
);
assert.match(
  wxml,
  /<view wx:else class="meal-state"><text>暂时没有符合条件的菜品<\/text><text>可切换上方场景继续挑选<\/text><\/view>/,
  '筛选空态仍需保留切换场景提示'
);
assert.match(
  wxml,
  /<view wx:else class="meal-state"><text>暂时没有菜品搭配<\/text><text>商品与菜品配置完成后会在这里显示<\/text><\/view>/,
  '整体空态必须使用独立说明，不能要求切换不存在的场景'
);
assert.match(wxml, /class="meal-shuffle" disabled="\{\{!canShuffle\}\}"/, '没有下一批时换一批必须明确禁用');
assert.match(wxss, /\.meal-card-copy>text:first-child\{[^}]*white-space:normal[^}]*overflow-wrap:anywhere/, '长菜名必须允许换行而不是挤压操作按钮');
assert.match(wxss, /\.meal-card-copy>button\{[^}]*min-height:44px/, '菜谱卡操作按钮必须保持可点击高度');

console.log('meal list interactions: passed');
