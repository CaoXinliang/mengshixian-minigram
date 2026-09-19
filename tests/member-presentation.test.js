const assert = require('node:assert/strict');
const test = require('node:test');

const { deriveAccountModel, deriveMemberHomeModel, deriveMembershipModel } = require('../miniapp/modules/member-presentation');

const customer = { _id: 'c-1', userType: 'c', businessStatus: '', organizationId: '', status: 'active' };
const approvedBusiness = { _id: 'b-1', userType: 'b', businessStatus: 'approved', organizationId: 'org-1', status: 'active' };

test('guest model exposes only login and customer-service actions', () => {
  const model = deriveMemberHomeModel(null);
  assert.equal(model.kind, 'guest');
  assert.equal(model.loggedIn, false);
  assert.equal(model.showCustomerOrders, false);
  assert.deepEqual(model.guestActions.map((item) => item.type), ['login', 'service']);
  assert.equal(model.commonServices.length, 0);
  assert.equal(model.businessPermissions.length, 0);
});

test('customer model uses a real account label and only approved visible services', () => {
  const model = deriveMemberHomeModel(customer);
  assert.equal(model.kind, 'customer');
  assert.equal(model.subtitle, '微信用户 · 顾客账户');
  assert.equal(model.showCustomerOrders, true);
  assert.deepEqual(model.commonServices.map((item) => item.type), ['address', 'favorites', 'coupon', 'points', 'policy', 'service']);
  assert.equal(JSON.stringify(model).includes('普通会员'), false);
  assert.equal(JSON.stringify(model).includes('电子发票'), false);
  assert.equal(JSON.stringify(model).includes('储值账户'), false);
  assert.equal(JSON.stringify(model).includes('套餐采购'), false);
});

test('pending business identity keeps the customer account and never grants enterprise permissions', () => {
  const model = deriveMemberHomeModel({ ...customer, userType: 'b', businessStatus: 'pending' });
  assert.equal(model.kind, 'business_pending');
  assert.equal(model.title, '企业身份审核中');
  assert.equal(model.subtitle, '当前仍使用顾客账户');
  assert.equal(model.showBusinessApplication, true);
  assert.equal(model.businessStatusLabel, '审核中');
  assert(model.businessPermissions.length > 0);
  assert(model.businessPermissions.slice(0, 4).every((item) => item.enabled === false));
  assert(model.businessPermissions.slice(4).every((item) => item.enabled === true));
  assert.equal(model.canOpenProcurement, false);
});

test('rejected, invalid and disabled identities remain mutually exclusive and do not gain B-side access', () => {
  const rejected = deriveMemberHomeModel({ ...customer, userType: 'b', businessStatus: 'rejected' });
  const invalid = deriveMemberHomeModel({ ...approvedBusiness, organizationId: '' });
  const disabled = deriveMemberHomeModel({ ...approvedBusiness, status: 'disabled' });
  assert.deepEqual([rejected.kind, invalid.kind, disabled.kind], ['business_rejected', 'business_invalid', 'disabled']);
  assert.equal(rejected.canOpenProcurement, false);
  assert.equal(invalid.canOpenProcurement, false);
  assert.equal(disabled.canOpenProcurement, false);
  assert.equal(disabled.showCustomerOrders, false);
});

test('only a complete active approved B-side identity can open procurement', () => {
  const model = deriveMemberHomeModel(approvedBusiness);
  assert.equal(model.kind, 'business_approved');
  assert.equal(model.canOpenProcurement, true);
  assert(model.businessPermissions.every((item) => item.enabled === true));
});

test('account model displays UTC login time in Shanghai without inventing editable profile fields', () => {
  const model = deriveAccountModel({ ...customer, lastLoginAt: '2026-09-18T09:30:00.000Z' });
  assert.equal(model.identityLabel, 'C端客户');
  assert.equal(model.lastLoginText, '2026-09-18 17:30');
  assert.equal(model.canApplyBusiness, true);
  assert.equal(model.canOpenProcurement, false);
  assert.equal(Object.prototype.hasOwnProperty.call(model, 'phone'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(model, 'nickname'), false);
});

test('account login time rolls into the next Shanghai calendar day', () => {
  const model = deriveAccountModel({ ...customer, lastLoginAt: '2026-09-18T20:30:00.000Z' });
  assert.equal(model.lastLoginText, '2026-09-19 04:30');
});

test('membership model never turns a missing level or growth fact into a default membership', () => {
  const unconfigured = deriveMembershipModel({ profile: {}, level: null });
  assert.equal(unconfigured.configured, false);
  assert.equal(unconfigured.levelName, '等级暂未配置');
  assert.equal(unconfigured.growthValue, null);
  assert.equal(unconfigured.nextLevelHint, '升级条件暂未配置');
  assert.deepEqual(unconfigured.benefits, []);

  const configured = deriveMembershipModel({
    profile: { lifetimePoints: 120 },
    level: { code: 'silver', name: '银卡会员', minPoints: 100, benefits: ['专属活动'] }
  });
  assert.equal(configured.configured, true);
  assert.equal(configured.levelName, '银卡会员');
  assert.equal(configured.growthValue, 120);
  assert.deepEqual(configured.benefits, ['专属活动']);
});

test('membership model does not invent an upgrade gap when current growth is missing', () => {
  const model = deriveMembershipModel({
    profile: {},
    level: { code: 'silver', name: '银卡会员', minPoints: 100 },
    nextLevel: { code: 'gold', name: '金卡会员', minPoints: 400 }
  });
  assert.equal(model.nextLevelHint, '升级条件暂未配置');
});

test('membership model does not invent an upgrade gap when the next threshold is missing', () => {
  const model = deriveMembershipModel({
    profile: { lifetimePoints: 120 },
    level: { code: 'silver', name: '银卡会员', minPoints: 100 },
    nextLevel: { code: 'gold', name: '金卡会员', minPoints: null }
  });
  assert.equal(model.nextLevelHint, '升级条件暂未配置');
});

test('membership model shows a real upgrade gap when both values exist', () => {
  const model = deriveMembershipModel({
    profile: { lifetimePoints: 120 },
    level: { code: 'silver', name: '银卡会员', minPoints: 100 },
    nextLevel: { code: 'gold', name: '金卡会员', minPoints: 400 }
  });
  assert.equal(model.nextLevelHint, '距离金卡会员还需280成长值');
});
