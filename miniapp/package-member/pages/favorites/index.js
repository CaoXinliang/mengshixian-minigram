const { auth, favorites, catalog } = require('../../../services/index');

Page({
  data: { status: 'loading', errorText: '', rows: [], busyId: '' },
  onLoad() { return this.load(); },
  async load() {
    this.setData({ status: 'loading', errorText: '' });
    const me = await auth.getMe();
    if (!me || !me.ok || !me.data || !me.data.user) return this.setData({ status: 'forbidden', errorText: '请先登录后查看收藏' });
    const [result, catalogResult] = await Promise.all([favorites.list({ page: 1, pageSize: 100 }), catalog.listAllProducts()]);
    if (!result || !result.ok) return this.setData({ status: 'error', errorText: result && result.error && result.error.message || '收藏加载失败，请重试' });
    if (!catalogResult || !catalogResult.ok) return this.setData({ status: 'error', errorText: catalogResult && catalogResult.error && catalogResult.error.message || '收藏商品资料加载失败' });
    const products = catalogResult.data && catalogResult.data.rows || []; const rows = result.data && result.data.rows || [];
    this.setData({ status: rows.length ? 'ready' : 'empty', rows: rows.map(row => { let product = {}; let sku = {}; for (const item of products) { const found = (item.skus || []).find(entry => entry._id === row.skuId); if (found) { product = item; sku = found; break; } } return { id: row._id, productId: product._id || '', skuId: row.skuId, name: product.name || '收藏商品', spec: sku.specName || sku.packageUnit || '规格以商品页为准', image: product.coverUrl || product.image || '/assets/products/placeholder.svg', unavailable: !product._id }; }) });
  },
  retry() { return this.load(); },
  openProduct(event) { const item = this.data.rows.find(row => row.id === event.currentTarget.dataset.id); if (!item || !item.productId) return; wx.redirectTo({ url: `/pages/index/index?productId=${encodeURIComponent(item.productId)}` }); },
  async remove(event) {
    const id = event.currentTarget.dataset.id;
    if (!id || this.data.busyId) return;
    this.setData({ busyId: id });
    try {
      const result = await favorites.remove({ id });
      if (!result || !result.ok) return wx.showToast({ title: result && result.error && result.error.message || '取消收藏失败', icon: 'none' });
      await this.load();
    } finally { this.setData({ busyId: '' }); }
  },
  back() { wx.navigateBack(); }
});
