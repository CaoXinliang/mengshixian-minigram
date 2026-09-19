const { auth, membership } = require('../../../services/index');
const { deriveMembershipModel } = require('../../../modules/member-presentation');
const { authorizeMemberPage, isCurrentMemberLoad } = require('../../member-auth');

Page({
  data: { status: 'loading', errorText: '', model: null },
  onLoad() {},
  onShow() { return this.load(); },
  async load() {
    const access = await authorizeMemberPage(this, auth, {
      forbiddenText: '请先登录后查看会员等级',
      clear: { model: null }
    });
    if (!access) return;
    let result = null;
    try { result = await membership.profile(); } catch (error) { result = null; }
    if (!isCurrentMemberLoad(this, access)) return;
    if (!result || !result.ok) return this.setData({ model: null, status: 'error', errorText: result && result.error && result.error.message || '会员资料加载失败，请重试' });
    this.setData({ status: 'ready', errorText: '', model: deriveMembershipModel(result.data || {}) });
  },
  retry() { return this.load(); },
  openPoints() { wx.navigateTo({ url: '/package-member/pages/points/index' }); },
  back() { wx.navigateBack(); }
});
