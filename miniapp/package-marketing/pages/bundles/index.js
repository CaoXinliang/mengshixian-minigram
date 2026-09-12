const { bundles, auth } = require('../../../services/index');
const money = cents => (Number(cents || 0) / 100).toFixed(2);
Page({
  data: { status: 'loading', errorText: '', rows: [] },
  onLoad() { return this.load(); },
  async load() { this.setData({ status: 'loading', errorText: '' }); const [result, me] = await Promise.all([bundles.list({ page: 1, pageSize: 100 }), auth.getMe()]); if (!result || !result.ok) return this.setData({ status: 'error', errorText: result && result.error && result.error.message || '套餐加载失败，请重试' }); const loggedIn = Boolean(me && me.ok && me.data && me.data.user); const rows = result.data && result.data.rows || []; this.setData({ status: rows.length ? 'ready' : 'empty', rows: rows.map(item => ({ ...item, id: item._id, name: item.name || item.title || '采购套餐', description: item.description || '套餐内容以详情和服务端报价为准', image: item.coverUrl || item.image || '/assets/products/placeholder.svg', priceText: loggedIn && Number.isFinite(Number(item.bundlePriceCent)) ? money(item.bundlePriceCent) : '', priceHint: loggedIn ? '暂未定价' : '登录后查看服务端报价' })) }); },
  retry() { return this.load(); },
  open(event) { wx.navigateTo({ url: `/package-marketing/pages/bundle-detail/index?id=${encodeURIComponent(event.currentTarget.dataset.id)}` }); },
  back() { wx.navigateBack(); }
});
