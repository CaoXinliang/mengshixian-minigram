const EMPTY_ADDRESS = { id: '', name: '', phone: '', masked: '', detail: '', regionCode: '' };

function transientPagePatch(page, options = {}) {
  return {
    page,
    activeTab: page,
    query: '',
    searchDraft: '',
    searchMode: false,
    showAddressForm: false,
    quantityPickerVisible: false,
    quantityPickerProduct: null,
    quantityPickerSpec: '',
    quantityPickerQty: 1,
    ...(page === 'category'
      ? { catalogBrowseError: '' }
      : { catalogBrowseLoading: false, catalogBrowseError: '' }),
    ...(options.patch || {})
  };
}

function mainTabIntent(input = {}) {
  const tab = input.tab;
  if (!tab) return { kind: 'noop' };
  if (tab === 'frequent' && input.isApprovedBusiness && input.cloudMode) {
    return {
      kind: 'external',
      url: '/package-business/pages/frequent/index',
      closeQuantityPicker: true
    };
  }
  if (tab === 'frequent' && input.customerMealIdeasEnabled) {
    if (input.page === 'mealIdeas' && !input.showAddressForm && !input.quantityPickerVisible) {
      return { kind: 'noop' };
    }
    return {
      kind: 'internal',
      patch: {
        page: 'mealIdeas',
        activeTab: 'frequent',
        showAddressForm: false,
        quantityPickerVisible: false,
        quantityPickerProduct: null,
        quantityPickerSpec: '',
        quantityPickerQty: 1,
        ...(input.mealPatch || {})
      },
      deactivateCatalog: true,
      clearCatalogExpansion: false,
      resetSearchContext: false,
      ensureCatalog: true
    };
  }
  if (tab === input.page && !input.searchMode && !input.showAddressForm && !input.quantityPickerVisible) {
    return { kind: 'noop' };
  }
  return {
    kind: 'internal',
    patch: transientPagePatch(tab),
    deactivateCatalog: tab !== 'category',
    clearCatalogExpansion: !['category', 'frequent'].includes(tab),
    resetSearchContext: true,
    ensureCatalog: tab === 'category'
  };
}

function pageMotionPatch(currentScrollTop, patch = {}) {
  const pageScrollTop = Object.prototype.hasOwnProperty.call(patch, 'pageScrollTop')
    ? patch.pageScrollTop
    : Number(currentScrollTop || 0) === 0 ? 1 : 0;
  return { ...patch, pageMotion: false, pageScrollTop };
}

function logoutPageState(options = {}) {
  const logoutPage = options.page === 'home' ? 'home' : 'mine';
  const patch = {
    loggedIn: false,
    page: logoutPage,
    activeTab: logoutPage,
    priceFallback: '登录后查看价格',
    selectedMealIdea: null,
    quantityPickerVisible: false,
    quantityPickerProduct: null,
    quantityPickerSpec: '',
    quantityPickerQty: 1,
    loginStatus: 'idle',
    loginErrorText: '',
    ...(options.identityPatch || {})
  };
  if (!options.cloudMode) return patch;
  return {
    ...patch,
    cartItems: [],
    cartCount: 0,
    cartStatus: 'idle',
    cartErrorText: '',
    selectableCartCount: 0,
    allCartSelected: false,
    orderRows: [],
    allOrderRows: [],
    lastOrder: null,
    orderEmptyTitle: '暂无订单记录',
    orderEmptyHint: '下单后会在这里显示订单状态和预计送达时间',
    address: { ...EMPTY_ADDRESS },
    couponCount: 0,
    points: 0,
    checkedIn: false
  };
}

module.exports = {
  mainTabIntent,
  pageMotionPatch,
  logoutPageState
};
