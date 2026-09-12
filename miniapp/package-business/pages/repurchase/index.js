const { auth, orders } = require('../../../services/index');
const validRows = data => data.availableItems || data.validItems || data.addedItems || data.items || [];
Page({
  data: { orderId: '', status: 'loading', errorText: '', rows: [], invalidItems: [], commitLocked: false, commitError: '', addedItems: [] },
  onLoad(query = {}) { let orderId = query.orderId || ''; try { orderId = decodeURIComponent(orderId); } catch (error) { orderId = ''; } this.setData({ orderId }); return this.load(); },
  async load() {
    if (!this.data.orderId) return this.setData({ status: 'empty', errorText: '原订单编号无效' }); this.setData({ status: 'loading', errorText: '' });
    const me = await auth.getMe(); const user = me && me.ok && me.data && me.data.user; if (!user || user.userType !== 'b' || user.businessStatus !== 'approved') return this.setData({ status: 'forbidden', errorText: '再次购买仅对已审核企业采购账户开放' });
    const [result, detailResult] = await Promise.all([orders.repurchasePreview({ orderId: this.data.orderId }), typeof orders.get === 'function' ? orders.get(this.data.orderId) : Promise.resolve(null)]);
    if (!result || !result.ok) return this.setData({ status: 'error', errorText: result && result.error && result.error.message || '再次购买清单加载失败，请重试' });
    const data = result.data || {}; const snapshots = detailResult && detailResult.ok && detailResult.data && detailResult.data.items || []; const snapshotBySku = new Map(snapshots.map(item => [item.skuId, item]));
    const describe = item => { const snapshot = snapshotBySku.get(item.skuId) || {}; return { ...item, name: item.productNameSnapshot || item.productName || item.name || snapshot.productNameSnapshot || item.skuId || '订单商品', spec: item.specSnapshot || item.specName || snapshot.specSnapshot || snapshot.packageUnitSnapshot || '' }; };
    const rows = validRows(data).map(item => ({ ...describe(item), skuId: item.skuId || item._id, quantity: Number(item.quantity || item.suggestedQuantity || 1), selected: item.selected !== false }));
    const invalidItems = (data.invalidItems || []).map(describe);
    this.setData({ status: rows.length || invalidItems.length ? 'ready' : 'empty', rows, invalidItems });
  }, retry() { return this.load(); },
  toggle(event) { const skuId = event.currentTarget.dataset.skuId; this.setData({ rows: this.data.rows.map(row => row.skuId === skuId ? { ...row, selected: !row.selected } : row) }); },
  async commit() {
    if (this.data.commitLocked) return; const items = this.data.rows.filter(row => row.selected).map(row => ({ skuId: row.skuId, quantity: row.quantity })); if (!items.length) return this.setData({ commitError: '请选择仍可购买的商品' });
    const idempotencyKey = this._key || `repurchase-${this.data.orderId}-${Date.now()}`; this._key = idempotencyKey; this.setData({ commitLocked: true, commitError: '' });
    try { const result = await orders.repurchaseCommit({ orderId: this.data.orderId, items, idempotencyKey }); if (!result || !result.ok) { if (result && result.error && result.error.code !== 'REQUEST_FAILED') this._key = ''; return this.setData({ commitError: result && result.error && result.error.message || '再次购买失败，请重试' }); } this._key = ''; const data = result.data || {}; this.setData({ addedItems: data.addedItems || [], invalidItems: data.invalidItems || [] }); } finally { this.setData({ commitLocked: false }); }
  },
  goCart() { wx.reLaunch({ url: '/pages/index/index?tab=cart' }); }, back() { wx.navigateBack(); }
});
