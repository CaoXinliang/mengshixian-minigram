const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../miniapp');
const pageJson = JSON.parse(fs.readFileSync(path.join(root, 'pages/index/index.json'), 'utf8'));
const pageWxml = fs.readFileSync(path.join(root, 'pages/index/index.wxml'), 'utf8');
const componentJson = JSON.parse(fs.readFileSync(path.join(root, 'components/member-home-panel/index.json'), 'utf8'));
const componentJs = fs.readFileSync(path.join(root, 'components/member-home-panel/index.js'), 'utf8');
const componentWxml = fs.readFileSync(path.join(root, 'components/member-home-panel/index.wxml'), 'utf8');
const componentWxss = fs.readFileSync(path.join(root, 'components/member-home-panel/index.wxss'), 'utf8');

assert.equal(pageJson.usingComponents['member-home-panel'], '/components/member-home-panel/index');
assert(pageWxml.includes('<member-home-panel'));
for (const binding of ['bind:login="handleMemberLogin"', 'bind:navigate="handleMemberNavigate"', 'bind:shortcut="handleMemberShortcut"', 'bind:businessapplication="openBusinessApplication"', 'bind:procurement="openProcurementCenter"']) {
  assert(pageWxml.includes(binding), `main page must wire ${binding}`);
}
for (const oldStructure of ['class="profile-card"', 'class="mine-card mine-order-card"', 'class="tool-grid common-services"', 'class="tool-grid more-services"']) {
  assert.equal(pageWxml.includes(oldStructure), false, `${oldStructure} must move out of the main page`);
}

assert.equal(componentJson.component, true);
for (const eventName of ['login', 'navigate', 'shortcut', 'businessapplication', 'procurement']) {
  assert(componentJs.includes(`triggerEvent('${eventName}'`), `member panel must expose ${eventName} as a semantic event`);
}
assert(componentJs.includes("type: dataset.type || ''") && componentJs.includes("filter: dataset.filter || ''"));
assert.equal(componentJs.includes('currentTarget: event.currentTarget'), false, 'component events must not leak raw WeChat events');

for (const visibleText of ['我的订单', '常用服务', '企业采购申请', '企业权限', '关于与帮助']) {
  assert(componentWxml.includes(visibleText), `member panel must include ${visibleText}`);
}
for (const dormantText of ['电子发票', '储值账户', '套餐采购', '拼团活动']) {
  assert.equal(componentWxml.includes(dormantText), false, `${dormantText} must remain hidden`);
}
assert(componentWxml.includes('disabled="{{!item.enabled}}"'), 'unapproved enterprise capabilities must be visibly disabled');
assert(componentWxss.includes('.member-profile') && componentWxss.includes('.member-service-grid') && componentWxss.includes('@media'));

console.log('member home panel component test: passed');
