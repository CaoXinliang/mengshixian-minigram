const APPROVED_BUSINESS = 'business_approved';

const CONTINUATION_FIELDS = {
  addProduct: ['id', 'spec', 'quantity', 'returnPage', 'activeTab'],
  setCartQuantity: ['id', 'spec', 'quantity', 'returnPage', 'activeTab'],
  quantityPicker: ['id', 'returnPage', 'activeTab'],
  quantityPickerAdd: ['id', 'spec', 'quantity', 'returnPage', 'activeTab'],
  detailCheckout: ['id', 'spec', 'quantity', 'activeTab'],
  addFrequent: ['returnPage', 'activeTab'],
  checkout: ['returnPage', 'activeTab'],
  address: [], frequentPage: [], mine: [], businessApplication: [],
  orders: ['filter', 'returnPage', 'activeTab'], coupon: ['returnPage', 'activeTab'],
  favorites: ['returnPage', 'activeTab'], trace: ['returnPage', 'activeTab'],
  aftersale: ['returnPage', 'activeTab'], invoice: ['returnPage', 'activeTab'],
  points: ['returnPage', 'activeTab'], review: ['returnPage', 'activeTab'],
  storedValue: ['returnPage', 'activeTab'], account: ['returnPage', 'activeTab'],
  group: []
};

function isApprovedBusiness(user) {
  return Boolean(user && user.userType === 'b' && user.businessStatus === 'approved' && user.organizationId && user.status === 'active');
}

function identityKind(user) {
  if (!user) return 'guest';
  if (user.status === 'disabled') return 'disabled';
  if (isApprovedBusiness(user)) return APPROVED_BUSINESS;
  if (user.userType === 'b' && user.businessStatus === 'approved') return 'business_invalid';
  if (user.businessStatus === 'pending') return 'business_pending';
  if (user.businessStatus === 'rejected') return 'business_rejected';
  return 'customer';
}

function shortcutProfile(user) {
  const approved = isApprovedBusiness(user);
  return {
    isApprovedBusiness: approved,
    shortcutLabel: approved ? '常购清单' : '吃什么',
    shortcutToolLabel: approved ? '常购清单' : '吃什么',
    shortcutIcon: approved ? '/assets/icons/list.svg' : '/assets/icons/meal.svg'
  };
}

function profileFor(kind) {
  if (kind === APPROVED_BUSINESS) return { profileTitle: '梦食鲜商家', profileSub: '商家采购账号' };
  if (kind === 'business_pending') return { profileTitle: '梦食鲜顾客', profileSub: '企业采购申请审核中' };
  if (kind === 'business_rejected') return { profileTitle: '梦食鲜顾客', profileSub: '企业申请未通过，可重新提交' };
  if (kind === 'disabled') return { profileTitle: '梦食鲜顾客', profileSub: '账号已停用' };
  if (kind === 'business_invalid') return { profileTitle: '梦食鲜顾客', profileSub: '企业身份暂不可用' };
  if (kind === 'guest') return { profileTitle: '梦食鲜顾客', profileSub: '登录后可查看账户' };
  return { profileTitle: '梦食鲜顾客', profileSub: '微信用户 · 顾客账户' };
}

function identityView(user) {
  const kind = identityKind(user);
  return {
    kind,
    userType: user && user.userType || '',
    businessStatus: user && user.businessStatus || '',
    organizationId: user && user.organizationId || '',
    userStatus: user && user.status || '',
    canApplyBusiness: Boolean(user && kind !== APPROVED_BUSINESS && kind !== 'business_pending' && kind !== 'disabled'),
    ...profileFor(kind),
    ...shortcutProfile(user)
  };
}

function safeReturnPage(page, user) {
  return isApprovedBusiness(user) && ['mealIdeas', 'mealIdea', 'frequent'].includes(page) ? 'home' : page;
}

function continuationFor(value) {
  if (!value || !Object.prototype.hasOwnProperty.call(CONTINUATION_FIELDS, value.type)) return null;
  const output = { type: value.type };
  CONTINUATION_FIELDS[value.type].forEach((field) => {
    if (value[field] !== undefined && value[field] !== null && value[field] !== '') output[field] = value[field];
  });
  return output;
}

module.exports = { APPROVED_BUSINESS, continuationFor, identityView, isApprovedBusiness, safeReturnPage, shortcutProfile };
