const { identityView } = require('./identity-state');

const ORDER_ACTIONS = [
  { type: 'orders', filter: '待付款', label: '待付款', icon: '/assets/icons/wallet.svg' },
  { type: 'orders', filter: '待收货', label: '待收货', icon: '/assets/icons/box.svg' },
  { type: 'aftersale', filter: '', label: '售后/退款', icon: '/assets/icons/refresh.svg' },
  { type: 'review', filter: '', label: '评价晒单', icon: '/assets/icons/file.svg' }
];

const COMMON_SERVICES = [
  { type: 'address', label: '收货地址', icon: '/assets/icons/location.svg' },
  { type: 'favorites', label: '商品收藏', icon: '/assets/icons/heart.svg' },
  { type: 'coupon', label: '优惠券', icon: '/assets/icons/coupon.svg' },
  { type: 'points', label: '积分中心', icon: '/assets/icons/coupon.svg' },
  { type: 'policy', label: '协议与隐私', icon: '/assets/icons/file.svg' },
  { type: 'service', label: '联系客服', icon: '/assets/icons/headset.svg' }
];

const BUSINESS_PERMISSION_LABELS = [
  ['business-center', 'B端入口'],
  ['organization', '组织权限'],
  ['business-price', '价格权限'],
  ['inquiry', '询价权限'],
  ['policy', '协议与隐私'],
  ['service', '联系客服']
];

function businessCopy(kind) {
  if (kind === 'business_approved') return { title: '梦食鲜商家', subtitle: '企业采购账户', status: '已通过' };
  if (kind === 'business_pending') return { title: '企业身份审核中', subtitle: '当前仍使用顾客账户', status: '审核中' };
  if (kind === 'business_rejected') return { title: '企业申请未通过', subtitle: '当前仍使用顾客账户', status: '未通过' };
  if (kind === 'business_invalid') return { title: '企业身份暂不可用', subtitle: '当前仍使用顾客账户', status: '待修复' };
  return null;
}

function deriveMemberHomeModel(user) {
  const identity = identityView(user);
  if (identity.kind === 'guest') {
    return {
      kind: 'guest', loggedIn: false, title: '梦食鲜顾客', subtitle: '登录后查看账户', avatarText: '鲜',
      showSettings: false, showCustomerOrders: false, showBusinessApplication: false, businessStatusLabel: '',
      canOpenProcurement: false, guestActions: [{ type: 'login', label: '微信登录' }, { type: 'service', label: '联系客服' }],
      orderActions: [], commonServices: [], businessActions: [], businessPermissions: []
    };
  }

  const business = businessCopy(identity.kind);
  const disabled = identity.kind === 'disabled';
  const approved = identity.kind === 'business_approved';
  const businessIdentity = Boolean(business);
  const title = business ? business.title : '梦食鲜顾客';
  const subtitle = business ? business.subtitle : (disabled ? '账号已停用' : '微信用户 · 顾客账户');
  const businessActions = businessIdentity ? [
    { type: 'application-record', label: '申请记录' },
    { type: 'business-profile', label: '企业资料' },
    { type: 'orders', label: '顾客订单' },
    { type: 'service', label: '联系管理员' }
  ] : [];

  return {
    kind: identity.kind,
    loggedIn: true,
    title,
    subtitle,
    avatarText: approved ? '商' : '鲜',
    showSettings: !disabled,
    showCustomerOrders: !disabled && !businessIdentity,
    showBusinessApplication: businessIdentity,
    businessStatusLabel: business ? business.status : '',
    canOpenProcurement: approved,
    guestActions: [],
    orderActions: disabled ? [] : ORDER_ACTIONS,
    commonServices: disabled ? COMMON_SERVICES.filter((item) => ['policy', 'service'].includes(item.type)) : COMMON_SERVICES,
    businessActions,
    businessPermissions: businessIdentity
      ? BUSINESS_PERMISSION_LABELS.map(([type, label]) => ({ type, label, enabled: approved || ['policy', 'service'].includes(type) }))
      : []
  };
}

function loginTimeText(value) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return '暂无登录时间记录';
  return new Date(timestamp + 8 * 60 * 60 * 1000).toISOString().slice(0, 16).replace('T', ' ');
}

function deriveAccountModel(user) {
  const identity = identityView(user);
  const identityLabel = identity.kind === 'business_approved' ? 'B端客户' : 'C端客户';
  const statusLabels = {
    business_approved: '企业身份已通过',
    business_pending: '企业身份审核中',
    business_rejected: '企业申请未通过',
    business_invalid: '企业身份暂不可用',
    disabled: '账户已停用',
    customer: '顾客账户'
  };
  return {
    kind: identity.kind,
    identityLabel,
    identityStatusLabel: statusLabels[identity.kind] || '顾客账户',
    lastLoginText: user && user.lastLoginAt ? loginTimeText(user.lastLoginAt) : '暂无登录时间记录',
    organizationLabel: identity.organizationId ? '已关联组织' : '未关联组织',
    canApplyBusiness: identity.canApplyBusiness,
    canOpenProcurement: identity.isApprovedBusiness,
    disabled: identity.kind === 'disabled'
  };
}

function finiteNumber(value) {
  return value !== '' && value !== null && value !== undefined && Number.isFinite(Number(value)) ? Number(value) : null;
}

function deriveMembershipModel(input) {
  const source = input || {};
  const profile = source.profile || {};
  const level = source.level && source.level.name ? source.level : null;
  const growthValue = finiteNumber(profile.lifetimePoints);
  const nextThreshold = finiteNumber(source.nextLevel && source.nextLevel.minPoints);
  return {
    configured: Boolean(level),
    levelCode: level && level.code || '',
    levelName: level ? level.name : '等级暂未配置',
    growthValue,
    threshold: level ? finiteNumber(level.minPoints) : null,
    nextLevelHint: source.nextLevel && source.nextLevel.name && growthValue !== null && nextThreshold !== null
      ? `距离${source.nextLevel.name}还需${Math.max(0, nextThreshold - growthValue)}成长值`
      : '升级条件暂未配置',
    benefits: level && Array.isArray(level.benefits) ? level.benefits.map(String) : []
  };
}

module.exports = { deriveAccountModel, deriveMemberHomeModel, deriveMembershipModel };
