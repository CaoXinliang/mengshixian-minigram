const assert = require('node:assert/strict');
const test = require('node:test');

const {
  mainTabIntent,
  pageMotionPatch,
  logoutPageState
} = require('../miniapp/modules/navigation-common-state');

test('main tab intent sends approved business frequent entry to its independent page', () => {
  assert.deepEqual(mainTabIntent({
    tab: 'frequent',
    page: 'home',
    isApprovedBusiness: true,
    cloudMode: true
  }), {
    kind: 'external',
    url: '/package-business/pages/frequent/index',
    closeQuantityPicker: true
  });
});

test('main tab intent centralizes transient state cleanup without touching domain data', () => {
  const result = mainTabIntent({
    tab: 'cart',
    page: 'category',
    activeTab: 'category',
    searchMode: true,
    showAddressForm: true,
    quantityPickerVisible: true,
    cloudMode: true
  });
  assert.equal(result.kind, 'internal');
  assert.equal(result.deactivateCatalog, true);
  assert.equal(result.clearCatalogExpansion, true);
  assert.equal(result.resetSearchContext, true);
  assert.deepEqual(result.patch, {
    page: 'cart', activeTab: 'cart', query: '', searchDraft: '', searchMode: false,
    showAddressForm: false, quantityPickerVisible: false, quantityPickerProduct: null,
    quantityPickerSpec: '', quantityPickerQty: 1, catalogBrowseLoading: false,
    catalogBrowseError: ''
  });
});

test('meal tab intent preserves the meal domain patch behind the navigation seam', () => {
  const mealPatch = { mealScene: '全部', mealIdeaRows: [{ id: 'meal-1' }] };
  const result = mainTabIntent({
    tab: 'frequent', page: 'home', activeTab: 'home', customerMealIdeasEnabled: true,
    mealPatch
  });
  assert.equal(result.kind, 'internal');
  assert.equal(result.ensureCatalog, true);
  assert.deepEqual(result.patch, {
    page: 'mealIdeas', activeTab: 'frequent', showAddressForm: false,
    quantityPickerVisible: false, quantityPickerProduct: null, quantityPickerSpec: '',
    quantityPickerQty: 1, ...mealPatch
  });
});

test('page motion patch owns scroll reset semantics', () => {
  assert.deepEqual(pageMotionPatch(0, { page: 'cart' }), { page: 'cart', pageMotion: false, pageScrollTop: 1 });
  assert.deepEqual(pageMotionPatch(320, { page: 'home' }), { page: 'home', pageMotion: false, pageScrollTop: 0 });
  assert.deepEqual(pageMotionPatch(320, { page: 'detail', pageScrollTop: 88 }), { page: 'detail', pageMotion: false, pageScrollTop: 88 });
});

test('logout page state clears private cloud data but keeps shared public content', () => {
  const state = logoutPageState({ cloudMode: true, page: 'home' });
  assert.equal(state.loggedIn, false);
  assert.equal(state.page, 'home');
  assert.deepEqual(state.cartItems, []);
  assert.deepEqual(state.orderRows, []);
  assert.deepEqual(state.address, { id: '', name: '', phone: '', masked: '', detail: '', regionCode: '' });
  assert.equal(state.priceFallback, '登录后查看价格');
  assert.equal(Object.prototype.hasOwnProperty.call(state, 'products'), false);
});
