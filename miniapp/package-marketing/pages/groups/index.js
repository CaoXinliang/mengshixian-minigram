const { auth, groups } = require('../../../services/index');
const timeText = value => value ? String(value).replace('T', ' ').slice(0, 16) : '';
Page({
  data: { tab: 'campaigns', status: 'loading', errorText: '', campaigns: [], mine: [] },
  onLoad() { return this.load(); },
  async load() {
    this.setData({ status: 'loading', errorText: '' });
    const campaignResult = await groups.campaigns({ page: 1, pageSize: 100 });
    if (!campaignResult || !campaignResult.ok) return this.setData({ status: 'error', errorText: campaignResult && campaignResult.error && campaignResult.error.message || '拼团活动加载失败' });
    const me = await auth.getMe(); const loggedIn = Boolean(me && me.ok && me.data && me.data.user);
    const mineResult = loggedIn ? await groups.mine({ page: 1, pageSize: 100 }) : { ok: true, data: { rows: [] } };
    if (!mineResult || !mineResult.ok) return this.setData({ status: 'error', errorText: mineResult && mineResult.error && mineResult.error.message || '我的拼团加载失败' });
    const campaigns = (campaignResult.data && campaignResult.data.rows || []).map(item => ({ ...item, id: item._id, name: item.name || item.title || '限时拼团', groupSize: Number(item.groupSize || item.targetCount || 0), endText: timeText(item.endAt), statusText: item.statusText || item.status || '进行中' }));
    const mine = (mineResult.data && mineResult.data.rows || []).map(entry => { const item = entry.group || entry; return { ...item, member: entry.member || null, id: item._id, name: item.groupNo || '我的拼团', joined: Number(item.memberCount || item.reservedMemberCount || 0), target: Number(item.groupSize || 0), statusText: ({ open: '待成团', success: '已成团', failed: '未成团' }[item.status] || item.status || '处理中'), endText: timeText(item.expiresAt) }; });
    this.setData({ status: 'ready', campaigns, mine });
  },
  retry() { return this.load(); },
  switchTab(event) { this.setData({ tab: event.currentTarget.dataset.tab }); },
  openCampaign(event) { wx.navigateTo({ url: `/package-marketing/pages/group-detail/index?campaignId=${encodeURIComponent(event.currentTarget.dataset.id)}` }); },
  openGroup(event) { wx.navigateTo({ url: `/package-marketing/pages/group-detail/index?groupId=${encodeURIComponent(event.currentTarget.dataset.id)}` }); },
  back() { wx.navigateBack(); }
});
