const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');

const root = path.resolve(__dirname, '../miniapp');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const appJson = JSON.parse(read('app.json'));
const memberPackage = appJson.subpackages.find(item => item.root === 'package-member');
assert(memberPackage.pages.includes('pages/account/index'));
assert(memberPackage.pages.includes('pages/membership/index'));

const mainJs = read('pages/index/index.js');
const mainWxml = read('pages/index/index.wxml');
assert(mainJs.includes("account: '/package-member/pages/account/index'"));
assert.equal(mainWxml.includes("utilityType == 'account'"), false, 'account UI must leave the main page');

const accountJs = read('package-member/pages/account/index.js');
const accountWxml = read('package-member/pages/account/index.wxml');
const membershipJs = read('package-member/pages/membership/index.js');
const membershipWxml = read('package-member/pages/membership/index.wxml');
for (const source of [accountJs, membershipJs]) {
  assert(source.includes('authorizeMemberPage') && source.includes('isCurrentMemberLoad'), 'member pages must share identity revision isolation');
}
assert(accountWxml.includes('账户信息') && accountWxml.includes('会员等级') && accountWxml.includes('积分中心'));
for (const icon of ['building2', 'award', 'filetext', 'shieldcheck']) {
  assert(accountWxml.includes(`/assets/icons/account-${icon}.svg`), `account page should render the Pixso ${icon} icon`);
}
assert(accountWxml.includes('退出登录') && accountJs.includes("url: '/pages/index/index?tab=mine&logout=1'"));
assert(membershipWxml.includes('{{model.levelName}}') && membershipWxml.includes('升级条件暂未配置'));
assert(membershipWxml.includes('title="会员中心"') && membershipWxml.includes('compact-title="{{true}}"'), 'membership page should use the approved compact Pixso header');
assert(membershipWxml.includes('查看积分账户'), 'unconfigured membership must still reach the real points account');
assert(membershipWxml.includes('class="points-wrap"'), 'points action should occupy the full content row on the membership page');
assert.equal(membershipWxml.includes('普通会员'), false);

const originalLoad = Module._load;
const definitions = [];
let currentUser = { _id: 'u1', userType: 'c', status: 'active', businessStatus: '', organizationId: '', lastLoginAt: '2026-09-18T09:30:00.000Z' };
let membershipResult = { ok: true, data: { profile: {}, level: null } };
const services = {
  auth: { getMe: async () => currentUser ? { ok: true, data: { user: currentUser } } : { ok: false, error: { code: 'UNAUTHORIZED' } } },
  membership: { profile: async () => membershipResult }
};
Module._load = function (request, parent, isMain) {
  if (request === '../../../services/index') return services;
  return originalLoad.call(this, request, parent, isMain);
};
global.Page = definition => definitions.push(definition);
global.wx = { navigateBack() {}, navigateTo() {}, reLaunch() {}, showModal() {} };
try {
  require(path.join(root, 'package-member/pages/account/index.js'));
  require(path.join(root, 'package-member/pages/membership/index.js'));
} finally {
  Module._load = originalLoad;
  delete global.Page;
}

const makePage = definition => Object.assign({}, definition, {
  data: JSON.parse(JSON.stringify(definition.data)),
  setData(patch) { Object.assign(this.data, patch); }
});

(async () => {
  assert.equal(definitions.length, 2);
  const account = makePage(definitions[0]);
  await account.load();
  assert.equal(account.data.status, 'ready');
  assert.equal(account.data.account.identityLabel, 'C端客户');
  assert.equal(account.data.account.lastLoginText, '2026-09-18 17:30');

  const membership = makePage(definitions[1]);
  await membership.load();
  assert.equal(membership.data.status, 'ready');
  assert.equal(membership.data.model.configured, false);
  assert.equal(membership.data.model.growthValue, null);

  membershipResult = { ok: false, error: { message: '会员资料加载失败' } };
  await membership.load();
  assert.equal(membership.data.status, 'error');
  assert.equal(membership.data.model, null);

  currentUser = null;
  await account.load();
  assert.equal(account.data.status, 'forbidden');
  assert.equal(account.data.account, null);

  const priorUser = { _id: 'u1', userType: 'c', status: 'active' };
  let releaseOldAuth;
  let signalAuthStart;
  const authStarted = new Promise(resolve => { signalAuthStart = resolve; });
  services.auth.getMe = () => {
    signalAuthStart();
    return new Promise(resolve => { releaseOldAuth = resolve; });
  };
  const oldAccountLoad = account.load();
  await authStarted;
  services.auth.getMe = async () => ({ ok: false, error: { code: 'UNAUTHORIZED' } });
  await account.load();
  releaseOldAuth({ ok: true, data: { user: priorUser } });
  await oldAccountLoad;
  assert.equal(account.data.status, 'forbidden', 'late authentication must not restore the previous account');
  assert.equal(account.data.account, null);

  let releaseOldProfile;
  let signalProfileStart;
  const profileStarted = new Promise(resolve => { signalProfileStart = resolve; });
  services.auth.getMe = async () => ({ ok: true, data: { user: priorUser } });
  services.membership.profile = () => {
    signalProfileStart();
    return new Promise(resolve => { releaseOldProfile = resolve; });
  };
  const oldMembershipLoad = membership.load();
  await profileStarted;
  services.auth.getMe = async () => ({ ok: false, error: { code: 'UNAUTHORIZED' } });
  await membership.load();
  releaseOldProfile({ ok: true, data: { profile: {}, level: { name: '旧等级' } } });
  await oldMembershipLoad;
  assert.equal(membership.data.status, 'forbidden', 'late membership data must not restore a revoked account');
  assert.equal(membership.data.model, null);
  console.log('account and membership pages test: passed');
})().catch(error => { console.error(error); process.exit(1); });
