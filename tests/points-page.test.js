const assert = require('assert/strict');
const Module = require('module');
const fs = require('fs');
const path = require('path');
let definition;
let currentUser = { _id: 'u1', status: 'active' };
let privateCalls = 0;
let writes = 0;
let readFails = false;
const rule = { code: 'daily_sign_in', status: 'active', rewardPoints: 8, version: 2, unavailableReason: '' };
const account = () => ({ account: { balance: null }, businessDate: '2040-01-01', signedToday: writes > 0, signInRule: rule });
const confirmed = () => ({
  ...account(), account: { balance: 8, lifetimeEarned: 8 }, signedToday: true,
  ledger: { _id: 'p1', action: 'daily_sign_in', change: 8, balanceAfter: 8, businessDate: '2040-01-01' }, idempotent: false
});
const membership = {
  pointsAccount: async () => { privateCalls += 1; return readFails ? { ok: false } : { ok: true, data: account() }; },
  profile: async () => ({ ok: true, data: { profile: {}, level: null } }),
  pointsLedgerAll: async () => ({ ok: true, data: { rows: [] } }),
  pointsLedger: async () => ({ ok: true, data: { rows: [] } }),
  signIn: async () => { writes += 1; readFails = true; return { ok: true, data: confirmed() }; }
};
const storage = new Map();
let toasts = 0;
global.wx = { getStorageSync: key => storage.get(key), setStorageSync: (key, value) => storage.set(key, value), removeStorageSync: key => storage.delete(key), showToast: () => { toasts += 1; }, navigateBack() {} };
const originalLoad = Module._load;
Module._load = function (name, parent, isMain) {
  if (name === '../../../services/index') return { auth: { getMe: async () => currentUser ? { ok: true, data: { user: currentUser } } : { ok: false } }, membership };
  return originalLoad.call(this, name, parent, isMain);
};
global.Page = value => { definition = value; };
try { require('../miniapp/package-member/pages/points/index'); } finally { Module._load = originalLoad; delete global.Page; }
function page() { return { ...definition, data: JSON.parse(JSON.stringify(definition.data)), setData(patch) { Object.assign(this.data, patch); } }; }

async function run() {
  const view = page();
  await view.onShow();
  assert.equal(view.data.status, 'ready');
  assert.equal(view.data.account.balanceText, '暂不可用');
  assert.equal(view.data.profile.levelName, '等级暂未配置');
  assert.equal(view.data.ruleText, '每日签到可获得8积分');
  await view.signIn();
  assert.equal(view.data.signState, 'confirmed');
  assert.equal(view.data.signText, '签到已确认，数据刷新失败，请重新加载');
  assert.equal(toasts, 0, 'page must not emit a misleading toast after refresh failure');
  currentUser = null;
  const before = privateCalls;
  await view.onShow();
  assert.equal(view.data.status, 'forbidden');
  assert.equal(view.data.account, null);
  assert.equal(privateCalls, before);
  await view.signIn();
  assert.equal(writes, 1);
  const markup = fs.readFileSync(path.resolve(__dirname, '../miniapp/package-member/pages/points/index.wxml'), 'utf8');
  assert(markup.includes('{{account.balanceText}}'), 'visible balance must use the honest display model');
  assert(markup.includes('{{ruleText}}'));
  assert(markup.includes('{{signText}}'));
  assert(markup.includes('!canSignIn'));
  assert(markup.includes('核对签到结果'));
  for (const transition of ['unload', 'identity-change']) {
    currentUser = { _id: 'u1', status: 'active' };
    writes = 0;
    readFails = false;
    let release;
    membership.signIn = () => new Promise(resolve => { release = resolve; });
    const pendingView = page();
    await pendingView.onShow();
    const pending = pendingView.signIn();
    if (transition === 'unload') pendingView.onUnload();
    else { currentUser = { _id: 'u2', status: 'active' }; await pendingView.onShow(); }
    const beforeState = JSON.stringify(pendingView.data);
    let lateUpdates = 0;
    const setData = pendingView.setData;
    pendingView.setData = function (patch) { lateUpdates += 1; setData.call(this, patch); };
    release({ ok: true, data: confirmed() });
    await pending;
    assert.equal(lateUpdates, 0, `${transition} must suppress stale writes`);
    assert.equal(JSON.stringify(pendingView.data), beforeState);
    assert.equal(toasts, 0);
    storage.clear();
  }
  console.log('points page test: passed');
}
run().catch(error => { console.error(error); process.exit(1); });
