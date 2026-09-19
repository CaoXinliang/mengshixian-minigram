const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const wxml = fs.readFileSync(path.join(root, 'miniapp/pages/index/index.wxml'), 'utf8');
const wxss = fs.readFileSync(path.join(root, 'miniapp/pages/index/index.wxss'), 'utf8');
const js = fs.readFileSync(path.join(root, 'miniapp/pages/index/index.js'), 'utf8');
const campaignStart = wxml.indexOf('<block wx:elif="{{page == \'campaign\'}}">');
const campaignEnd = wxml.indexOf('<block wx:elif="{{page == \'category\'}}">', campaignStart);
const campaignWxml = wxml.slice(campaignStart, campaignEnd);

assert(wxml.includes('data-section-type="special"') && wxml.includes('bindtap="openHomeSection"'), '后台可见的特价模块必须是 UI-008 的首页入口');
assert(wxml.includes("page == 'campaign'") && wxml.includes('{{homeCampaign.title}}') && wxml.includes('{{homeCampaign.periodText}}'), '活动页必须消费后台标题和有效期');
assert(wxml.includes('wx:for="{{homeCampaign.rules}}"') && wxml.includes('{{homeCampaign.categoryLabel}}'), '活动页必须消费后台规则和分类');
assert(wxml.includes('wx:for="{{campaignProducts}}"') && wxml.includes('bind:open="openCampaignProduct"'), '活动页必须只渲染关联商品并提供真实商品入口');
assert(wxml.includes('{{homeCampaign.statusText}}') && wxml.includes('bindtap="returnHomeCampaign"'), '活动页底部必须显示推导状态并可返回首页');
assert(wxml.includes('campaignProductsError') && wxml.includes('bind:action="retryCampaignProducts"'), '活动商品请求失败必须提供独立重试状态');
assert(wxml.includes('campaignQuery') && wxml.includes('没有找到相关活动商品'), '搜索无结果必须与活动未配置商品区分');
assert(!wxml.includes('bindtap="openBanner"') && !js.includes('openBanner('), '轮播必须继续保持纯展示');

for (const forbidden of ['新客专享', '新客尝鲜', '09.18—09.25', '¥68.00', '冻品组合优惠']) {
  assert(!campaignWxml.includes(forbidden), `活动页不得写死原型示例：${forbidden}`);
}

assert(wxss.includes('.campaign-hero{') && wxss.includes('.campaign-action-bar{'), 'UI-008 必须有独立主视觉和固定操作区');

console.log('home campaign runtime test: passed');
