const assert = require('assert/strict');
const fs = require('fs');
const Module = require('module');
const path = require('path');

const pageDefinition = {};
const calls = [];
let emitted = null;
const wallet = {
  load: async payload => { calls.push(['load', payload]); },
  claim: async id => { calls.push(['claim', id]); },
  reset: () => { calls.push(['reset']); },
  dispose: () => { calls.push(['dispose']); }
};
const services = { auth: {}, coupons: {} };
const originalLoad = Module._load;
Module._load = function load(requestName, parent, isMain) {
  if ((requestName === '../../../services' || requestName === '../../../services/index') && parent && /package-marketing[\\/]pages[\\/]coupons[\\/]index\.js$/.test(parent.filename)) return services;
  if (requestName === '../../../modules/coupon-wallet') return { createCouponWallet: () => wallet };
  if (requestName === '../../../modules/member-auth') return {
    authorizeMemberPage: async page => ({ revision: page._memberAuthRevision, user: { _id: 'u1' } }),
    isCurrentMemberLoad: () => true
  };
  return originalLoad.call(this, requestName, parent, isMain);
};
global.Page = definition => { pageDefinition.value = definition; };
global.wx = { navigateBack: () => calls.push(['back']), getStorageSync: () => null, setStorageSync: () => {}, removeStorageSync: () => {} };
try {
  require(path.resolve(__dirname, '../miniapp/package-marketing/pages/coupons/index.js'));
} finally {
  Module._load = originalLoad;
  delete global.Page;
}

function page() {
  return Object.assign({}, pageDefinition.value, {
    data: { ...pageDefinition.value.data, selectMode: true, coupons: [{ id: 'c1', usable: true }, { id: 'c2', usable: false }] },
    _memberAuthRevision: 1,
    setData(patch) { Object.assign(this.data, patch); },
    getOpenerEventChannel: () => ({ emit: (_name, payload) => { emitted = payload; } })
  });
}

(async () => {
  const couponWxml = fs.readFileSync(path.resolve(__dirname, '../miniapp/package-marketing/pages/coupons/index.wxml'), 'utf8');
  const couponJs = fs.readFileSync(path.resolve(__dirname, '../miniapp/package-marketing/pages/coupons/index.js'), 'utf8');
  const topbarWxml = fs.readFileSync(path.resolve(__dirname, '../miniapp/components/responsive-topbar/index.wxml'), 'utf8');
  const topbarWxss = fs.readFileSync(path.resolve(__dirname, '../miniapp/components/responsive-topbar/index.wxss'), 'utf8');
  assert(/<responsive-topbar\b[^>]*compact-title="\{\{true\}\}"/.test(couponWxml), 'UI-049必须使用本页紧凑标题变体');
  assert(couponJs.includes("require('../../../modules/member-auth')"), '跨分包页面必须从主包共享身份模块读取，不能引用另一个分包');
  assert(!couponJs.includes("package-member/member-auth"), '营销分包不得引用会员分包模块');
  assert(!/<responsive-topbar\b[^>]*subtitle=/.test(couponWxml), 'UI-049权威原型没有顶部副标题');
  assert(couponWxml.includes("status == 'empty' || status == 'ready'"), '空态与正常态都必须保留使用规则卡');
  assert(couponWxml.includes('可用优惠券 0 张'), 'UI-049空态必须保留左侧数量与右侧行动按钮');
  assert(couponWxml.includes('当前没有可用优惠券'), 'UI-049空态标题应与已确认画板一致，且不暗示已用或过期历史也不存在');
  const emptyWxml = couponWxml.split('<view wx:elif="{{status == \'empty\'}}"')[1]?.split('<block wx:elif="{{status == \'ready\'}}"')[0] || '';
  assert(/wx:if="\{\{selectMode\}\}"[^>]*bindtap="clearSelection"[^>]*><text>不使用优惠券<\/text>/.test(emptyWxml), '结算选券空态必须能明确不使用券并复用可见按钮样式，不能只提供离开结算的选购入口');
  assert(/wx:else[^>]*class="browse-link"/.test(emptyWxml), '非选券空态仍应保留继续选购入口');
  assert(couponWxml.includes('选择后由服务端重新计算应付金额'), '规则必须明确金额由服务端重新计算');
  for (const className of ['coupon-value', 'coupon-threshold', 'coupon-copy', 'coupon-name', 'coupon-validity', 'coupon-status', 'coupon-claim']) {
    assert(couponWxml.includes(`class="${className}`), `券卡字段必须使用语义类名：${className}`);
  }
  assert(topbarWxml.includes("compactTitle ? 'compact-title' : ''"), '共享顶栏必须提供局部紧凑标题变体');
  assert(/\.topbar__content\.compact-title\s+\.topbar__title[\s\S]*font-size:\s*var\(--font-large-title\)[\s\S]*font-weight:\s*400/.test(topbarWxss), '紧凑标题变体必须匹配UI-049的18px常规字重Token');

  const current = page();
  await current.onShow();
  assert.deepEqual(calls.at(-1), ['load', { userId: 'u1' }]);
  await current.claim({ currentTarget: { dataset: { id: 't1' } } });
  assert.deepEqual(calls.at(-1), ['claim', 't1']);
  current.choose({ currentTarget: { dataset: { id: 'c1' } } });
  assert.deepEqual(emitted, { couponId: 'c1' }, '选择事件只能传couponId，展示必须等待服务端报价快照');
  emitted = null;
  current.choose({ currentTarget: { dataset: { id: 'c2' } } });
  assert.equal(emitted, null, '不可用券不得进入结算选择');
  current.clearSelection();
  assert.deepEqual(emitted, { couponId: '' }, '不使用优惠券只清空选择，金额仍须由服务端重报价');
  assert.deepEqual(calls.at(-1), ['back'], '清空选择后必须返回结算页');
  current.onUnload();
  assert.deepEqual(calls.at(-1), ['dispose']);
  console.log('coupon page test: passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
