const assert = require('node:assert/strict');
const test = require('node:test');

const {
  APPROVED_BUSINESS,
  continuationFor,
  identityView,
  isApprovedBusiness,
  safeReturnPage
} = require('../miniapp/modules/identity-state');

const customer = { _id: 'c-1', userType: 'c', businessStatus: '', organizationId: '', status: 'active' };
const approved = { _id: 'b-1', userType: 'b', businessStatus: 'approved', organizationId: 'org-1', status: 'active' };

test('identity view distinguishes server-backed states without granting access from a client purpose', () => {
  assert.deepEqual(identityView(null), {
    kind: 'guest', userType: '', businessStatus: '', organizationId: '', userStatus: '',
    isApprovedBusiness: false, canApplyBusiness: false, profileTitle: '梦食鲜顾客',
    profileSub: '登录后可查看账户', shortcutLabel: '吃什么', shortcutToolLabel: '吃什么', shortcutIcon: '/assets/icons/meal.svg'
  });
  assert.equal(identityView(customer).kind, 'customer');
  assert.equal(identityView(customer).profileSub, '微信用户 · 顾客账户');
  assert.equal(identityView({ ...customer, purchasePurpose: 'business' }).isApprovedBusiness, false);
  assert.equal(identityView({ ...customer, businessStatus: 'pending' }).kind, 'business_pending');
  assert.equal(identityView({ ...customer, businessStatus: 'rejected' }).kind, 'business_rejected');
  assert.equal(identityView(approved).kind, APPROVED_BUSINESS);
  assert.equal(identityView({ ...approved, organizationId: '' }).kind, 'business_invalid');
  assert.equal(identityView({ ...approved, status: 'disabled' }).kind, 'disabled');
});

test('only a complete active server identity is approved for business access', () => {
  assert.equal(isApprovedBusiness(approved), true);
  for (const patch of [{ userType: 'c' }, { businessStatus: 'pending' }, { organizationId: '' }, { status: 'disabled' }]) {
    assert.equal(isApprovedBusiness({ ...approved, ...patch }), false);
  }
});

test('continuations are allow-listed and carry only the fields needed to resume', () => {
  assert.deepEqual(continuationFor({ type: 'addProduct', id: 'p-1', spec: '500g', quantity: 3, returnPage: 'detail', injected: 'secret' }), {
    type: 'addProduct', id: 'p-1', spec: '500g', quantity: 3, returnPage: 'detail'
  });
  assert.deepEqual(continuationFor({ type: 'businessApplication', injected: 'secret' }), { type: 'businessApplication' });
  assert.equal(continuationFor({ type: 'admin', token: 'secret' }), null);
  assert.equal(continuationFor(null), null);
});

test('approved business users cannot be returned to customer-only content', () => {
  assert.equal(safeReturnPage('mealIdeas', approved), 'home');
  assert.equal(safeReturnPage('mealIdea', approved), 'home');
  assert.equal(safeReturnPage('detail', approved), 'detail');
  assert.equal(safeReturnPage('mealIdeas', customer), 'mealIdeas');
});
