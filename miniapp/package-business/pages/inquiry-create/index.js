const { auth, catalog, inquiries } = require('../../../services/index');
const positive = (value, fallback = 1) => Number.isInteger(Number(value)) && Number(value) > 0 ? Number(value) : fallback;
const firstQuantity = row => Math.ceil(positive(row.minOrderQuantity) / positive(row.orderMultiple)) * positive(row.orderMultiple);
Page({
  data: { status: 'loading', errorText: '', rows: [], query: '', description: '', submitLocked: false, submitError: '' },
  onLoad() { return this.load(); },
  async load() {
    this.setData({ status: 'loading', errorText: '' });
    const me = await auth.getMe(); const user = me && me.ok && me.data && me.data.user;
    if (!user || user.userType !== 'b' || user.businessStatus !== 'approved') return this.setData({ status: 'forbidden', errorText: '新建询价仅对已审核企业采购账户开放' });
    const result = await catalog.listAllProducts();
    if (!result || !result.ok) return this.setData({ status: 'error', errorText: result && result.error && result.error.message || '询价商品加载失败，请重试' });
    const products = result.data && result.data.rows || result.rows || [];
    const rows = products.flatMap(product => (product.skus || []).map(sku => { const minOrderQuantity = positive(sku.minOrderQuantity); const orderMultiple = positive(sku.orderMultiple); return { id: sku._id, skuId: sku._id, name: product.name || '采购商品', spec: sku.specName || sku.packageUnit || '默认规格', minOrderQuantity, orderMultiple, quantity: firstQuantity({ minOrderQuantity, orderMultiple }), selected: false, visible: true }; }));
    this.setData({ status: rows.length ? 'ready' : 'empty', rows });
  }, retry() { return this.load(); },
  inputSearch(event) { const query = String(event.detail.value || '').trim().toLowerCase(); this.setData({ query, rows: this.data.rows.map(row => ({ ...row, visible: !query || `${row.name} ${row.spec}`.toLowerCase().includes(query) })) }); },
  toggle(event) { const id = event.currentTarget.dataset.id; this.setData({ rows: this.data.rows.map(row => row.id === id ? { ...row, selected: !row.selected } : row), submitError: '' }); },
  quantity(event) { const id = event.currentTarget.dataset.id; const direction = Number(event.currentTarget.dataset.direction || 0); this.setData({ rows: this.data.rows.map(row => row.id === id ? { ...row, selected: true, quantity: Math.max(firstQuantity(row), Math.min(999, row.quantity + (direction < 0 ? -row.orderMultiple : row.orderMultiple))) } : row) }); },
  description(event) { this.setData({ description: String(event.detail.value || '').slice(0, 500), submitError: '' }); },
  async submit() {
    if (this.data.submitLocked) return; const items = this.data.rows.filter(row => row.selected).map(row => ({ skuId: row.skuId, quantity: row.quantity }));
    if (!items.length) return this.setData({ submitError: '请至少选择一个询价商品' }); if (items.length > 50) return this.setData({ submitError: '单次询价最多选择 50 个商品项' });
    const idempotencyKey = this._key || `inquiry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; this._key = idempotencyKey; this.setData({ submitLocked: true, submitError: '' });
    try { const result = await inquiries.create({ items, description: this.data.description.trim(), idempotencyKey }); if (!result || !result.ok || !result.data || !result.data.inquiry) { if (result && result.error && result.error.code !== 'REQUEST_FAILED') this._key = ''; return this.setData({ submitError: result && result.error && result.error.message || '询价提交失败，请重试' }); } this._key = ''; wx.redirectTo({ url: `/package-business/pages/inquiry-detail/index?id=${encodeURIComponent(result.data.inquiry._id)}` }); } finally { this.setData({ submitLocked: false }); }
  }, back() { wx.navigateBack(); }
});
