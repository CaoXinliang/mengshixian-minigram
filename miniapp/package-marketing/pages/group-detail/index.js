const { auth, groups } = require('../../../services/index');
const money = cents => (Number(cents || 0) / 100).toFixed(2);
const timeText = value => value ? String(value).replace('T', ' ').slice(0, 16) : '';
Page({
  data: { campaignId: '', groupId: '', status: 'loading', errorText: '', campaign: null, group: null, quote: null, busy: false },
  onLoad(query = {}) { this.setData({ campaignId: query.campaignId ? decodeURIComponent(query.campaignId) : '', groupId: query.groupId ? decodeURIComponent(query.groupId) : '' }); return this.load(); },
  async load() {
    this.setData({ status: 'loading', errorText: '' });
    let group = null; let campaign = null;
    if (this.data.groupId) { const [result, campaignsResult] = await Promise.all([groups.get({ id: this.data.groupId }), groups.campaigns({ page: 1, pageSize: 100 })]); group = result && result.ok && result.data && (result.data.group || result.data); if (!group) return this.setData({ status: 'error', errorText: result && result.error && result.error.message || '拼团详情加载失败' }); campaign = (campaignsResult && campaignsResult.ok && campaignsResult.data && campaignsResult.data.rows || []).find(item => item._id === group.campaignId) || null; }
    else { const result = await groups.campaigns({ page: 1, pageSize: 100 }); campaign = result && result.ok && result.data && (result.data.rows || []).find(item => String(item._id) === String(this.data.campaignId)); if (!campaign) return this.setData({ status: 'empty', errorText: result && result.error && result.error.message || '拼团活动不存在或已结束' }); }
    const campaignId = campaign && (campaign._id || campaign.id) || group && group.campaignId || this.data.campaignId;
    this.setData({ status: 'ready', campaignId, campaign: campaign ? { ...campaign, name: campaign.name || campaign.title || '限时拼团', groupSize: Number(campaign.groupSize || campaign.targetCount || 0), endText: timeText(campaign.endAt) } : null, group: group ? { ...group, id: group._id || this.data.groupId, joined: Number(group.memberCount || group.reservedMemberCount || 0), target: Number(group.groupSize || campaign && campaign.groupSize || 0), statusText: group.statusText || ({ open: '待成团', success: '已成团', failed: '未成团' }[group.status] || '处理中'), expiryText: timeText(group.expiresAt) } : null, quote: campaign ? { pending: true } : null, errorText: campaign ? '' : '活动已结束，不能继续参团' });
  },
  retry() { return this.load(); },
  async submit(event) {
    if (this.data.busy || !this.data.quote) return;
    const me = await auth.getMe(); if (!me || !me.ok || !me.data || !me.data.user) return wx.showToast({ title: '请先登录后参与拼团', icon: 'none' });
    const action = event.currentTarget.dataset.action; this.setData({ busy: true });
    try {
      if (!this._submitKey) this._submitKey = `group-${action}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      let groupId = this.data.group && this.data.group.id;
      if (action === 'create') { const result = await groups.create({ campaignId: this.data.campaignId, idempotencyKey: this._submitKey }); const created = result && result.ok && result.data && result.data.group; if (!created) return wx.showToast({ title: result && result.error && result.error.message || '发起拼团失败', icon: 'none' }); groupId = created._id; }
      this._submitKey = '';
      wx.navigateTo({ url: `/package-trade/pages/checkout/index?groupId=${encodeURIComponent(groupId)}&groupCampaignId=${encodeURIComponent(this.data.campaignId)}&groupSkuId=${encodeURIComponent(this.data.campaign.skuId)}` });
    } finally { this.setData({ busy: false }); }
  },
  back() { wx.navigateBack(); }
});
