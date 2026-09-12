const { auth, frequent, catalog } = require('../../../services/index');
const { authorizeBusinessPage, isCurrentBusinessLoad } = require('../../business-auth');
const { purchaseRuleText, purchaseFailureText } = require('../../purchase-display');

const positive = (value, fallback = 1) => Number.isInteger(Number(value)) && Number(value) > 0 ? Number(value) : fallback;
const firstQuantity = row => Math.ceil(positive(row.minOrderQuantity) / positive(row.orderMultiple)) * positive(row.orderMultiple);
const rowModel = raw => {
  const sku = raw.sku || raw.skuSnapshot || {};
  const product = raw.product || raw.productSnapshot || {};
  const minOrderQuantity = positive(raw.minOrderQuantity || sku.minOrderQuantity);
  const orderMultiple = positive(raw.orderMultiple || sku.orderMultiple);
  const base = { minOrderQuantity, orderMultiple };
  const ruleText = purchaseRuleText(minOrderQuantity, orderMultiple, sku.packageUnit);
  return { id: raw._id || raw.id || raw.skuId, skuId: raw.skuId || sku._id || sku.id || '', name: raw.productName || raw.productNameSnapshot || product.name || '常购商品', spec: raw.specName || raw.specSnapshot || sku.specName || sku.packageUnit || '暂无规格信息', image: raw.image || raw.mediaUrl || product.image || '', minOrderQuantity, orderMultiple, purchaseRuleText: ruleText, quantity: positive(raw.quantity, firstQuantity(base)), selected: raw.selected !== false, unavailable: raw.available === false || raw.status === 'unavailable', unavailableReason: raw.invalidReason || raw.unavailableReason || '' };
};

Page({
  data: { status: 'loading', errorText: '', rows: [], submitLocked: false, resultVisible: false, addedItems: [], invalidItems: [] },
  onLoad() {},
  onShow() { return this.load(); },
  async load() {
    const access = await authorizeBusinessPage(this, auth, { forbiddenText: '常购清单仅对已审核企业采购账户开放', clear: { rows: [], submitLocked: false, resultVisible: false, addedItems: [], invalidItems: [] }, reset: () => { this._batchKey = ''; } });
    if (!access) return;
    this.setData({ resultVisible: false });
    const result = typeof frequent.listAll === 'function' ? await frequent.listAll() : await frequent.list({ page: 1, pageSize: 100 });
    if (!isCurrentBusinessLoad(this, access)) return;
    if (!result || !result.ok) return this.setData({ status: 'error', errorText: result && result.error && result.error.message || '常购清单加载失败，请重试' });
    const savedRows = result.data && result.data.rows || [];
    const [catalogResult, priceResult] = await Promise.all([catalog.listAllProducts(), catalog.listPrices(savedRows.map(item => item.skuId))]);
    if (!isCurrentBusinessLoad(this, access)) return;
    if (!catalogResult || !catalogResult.ok || !priceResult || !priceResult.ok) { const failed = !catalogResult || !catalogResult.ok ? catalogResult : priceResult; return this.setData({ status: 'error', errorText: failed && failed.error && failed.error.message || '常购商品资料加载失败，请重试' }); }
    const products = catalogResult.data && catalogResult.data.rows || catalogResult.rows || [];
    const productBySku = new Map(); products.forEach(product => (product.skus || []).forEach(sku => productBySku.set(sku._id, { product, sku })));
    const priceBySku = new Map((priceResult.data && priceResult.data.rows || []).map(price => [price.skuId, price]));
    const rows = savedRows.map(raw => { const found = productBySku.get(raw.skuId) || {}; const price = priceBySku.get(raw.skuId) || {}; return rowModel({ ...raw, product: found.product, sku: { ...(found.sku || {}), minOrderQuantity: price.minOrderQuantity || found.sku && found.sku.minOrderQuantity, orderMultiple: price.orderMultiple || found.sku && found.sku.orderMultiple }, available: Boolean(found.sku && Number.isInteger(Number(price.amountCent))) }); });
    this.setData({ status: rows.length ? 'ready' : 'empty', rows });
  },
  retry() { return this.load(); },
  toggle(event) { const id = event.currentTarget.dataset.id; this.setData({ rows: this.data.rows.map(row => row.id === id && !row.unavailable ? { ...row, selected: !row.selected } : row) }); },
  changeQuantity(event) {
    const id = event.currentTarget.dataset.id; const direction = Number(event.currentTarget.dataset.direction || 0);
    this.setData({ rows: this.data.rows.map(row => {
      if (row.id !== id || row.unavailable) return row;
      const minimum = firstQuantity(row); const next = Math.max(minimum, row.quantity + (direction < 0 ? -row.orderMultiple : row.orderMultiple));
      return { ...row, quantity: Math.min(999, next), selected: true };
    }) });
  },
  async batchAdd() {
    if (this.data.submitLocked) return;
    const items = this.data.rows.filter(row => row.selected && !row.unavailable).map(row => ({ id: row.id, skuId: row.skuId, quantity: row.quantity }));
    if (!items.length) return wx.showToast({ title: '请选择可以加购的商品', icon: 'none' });
    const idempotencyKey = this._batchKey || `frequent-batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; this._batchKey = idempotencyKey;
    this.setData({ submitLocked: true });
    try {
      const result = await frequent.batchAddToCart({ ids: items.map(item => item.id), items, idempotencyKey });
      if (!result || !result.ok) { if (result && result.error && result.error.code !== 'REQUEST_FAILED') this._batchKey = ''; return this.setData({ resultVisible: true, addedItems: [], invalidItems: [{ reason: purchaseFailureText(result && result.error, '批量加购失败，请重试') }] }); }
      this._batchKey = '';
      const data = result.data || {};
      this.setData({ resultVisible: true, addedItems: data.addedItems || [], invalidItems: (data.invalidItems || []).map(item => ({ ...item, reason: purchaseFailureText(item) })) });
    } finally { this.setData({ submitLocked: false }); }
  },
  goCart() { wx.reLaunch({ url: '/pages/index/index?tab=cart' }); },
  back() { wx.navigateBack(); }
});
