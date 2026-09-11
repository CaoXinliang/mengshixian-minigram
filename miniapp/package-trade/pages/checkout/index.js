const { config, address: addressApi, cart: cartApi, delivery: deliveryApi, checkout: checkoutApi, auth: authApi } = require('../../../services/index');
const { money } = require('../../services/trade-format');

const EMPTY_ADDRESS = { id: '', name: '', masked: '', detail: '' };
const customerWarehouseName = (name) => String(name || '配送仓').replace(/演示/g, '').replace(/\s{2,}/g, ' ').trim() || '配送仓';
const customerAddressText = (value, fallback) => String(value || '').replace(/梦食鲜演示收货点（非客户地址）/g, '已保存的收货地址').replace(/演示用户/g, '收货人').replace(/演示/g, '').trim() || fallback;
const productImage = (product) => product && (product.image || product.coverUrl) || '/assets/products/placeholder.svg';

Page({
  data: {
    address: EMPTY_ADDRESS, warehouses: [], warehouse: null, warehouseAreaText: '', cartItems: [],
    cartTotal: '--', freightTotal: '--', orderTotal: '--', quoteState: 'loading', quoteErrorText: '', submitting: false, loadError: false, loadErrorText: ''
  },
  async onLoad() {
    await Promise.all([this.loadAddress(), this.loadDelivery(), this.loadCart()]);
    await this.loadQuote();
  },
  async onShow() {
    if (this._loaded) return;
    this._loaded = true;
  },
  async loadAddress() {
    const result = await addressApi.list();
    if (!result || !result.ok) { this.setData({ loadError: true, loadErrorText: '收货地址读取失败，请重新加载' }); return false; }
    const rows = result && result.ok && result.data && Array.isArray(result.data.rows) ? result.data.rows : [];
    const item = rows.find((row) => row.isDefault) || rows[0];
    await new Promise((resolve) => this.setData({ address: item ? { id: item._id, name: customerAddressText(item.name, '收货人'), masked: item.phoneMasked || '', detail: customerAddressText(item.detail, '已保存的收货地址') } : EMPTY_ADDRESS }, resolve));
    return true;
  },
  async loadDelivery() {
    const result = await deliveryApi.options();
    if (!result || !result.ok) { this.setData({ loadError: true, loadErrorText: '配送范围读取失败，请重新加载' }); return false; }
    const deliveryAreas = result && result.data && (Array.isArray(result.data.deliveryAreas) ? result.data.deliveryAreas : result.data.areas);
    const rawWarehouses = result && result.ok && result.data && Array.isArray(result.data.warehouses) ? result.data.warehouses : [];
    const normalizedAreas = Array.isArray(deliveryAreas) ? deliveryAreas : [];
    const warehouses = rawWarehouses.map((item) => ({
      id: item._id,
      name: customerWarehouseName(item.name),
      eta: '预计送达时间以订单确认页为准',
      areas: normalizedAreas.filter((area) => !area.warehouseIds || !area.warehouseIds.length || area.warehouseIds.includes(item._id)).flatMap((area) => area.regionCodes || [])
    }));
    const warehouse = warehouses[0] || null;
    await new Promise((resolve) => this.setData({ warehouses, warehouse, warehouseAreaText: warehouse && warehouse.areas.length ? warehouse.areas.join('、') : '配送区域以订单确认页为准' }, resolve));
    return true;
  },
  async loadCart() {
    const result = await cartApi.getAll();
    if (!result || !result.ok) { this.setData({ loadError: true, loadErrorText: '购物车读取失败，请重新加载' }); return false; }
    const rows = result && result.ok && result.data && Array.isArray(result.data.rows) ? result.data.rows : [];
    const cartItems = rows.filter((item) => item.selected !== false && item.sku && item.product && !item.unavailable).map((item) => ({
      id: item._id, skuId: item.skuId, name: item.product.name || '未命名商品', unit: item.sku.specName || item.sku.packageUnit || item.sku.netWeight || '规格待补充', qty: item.quantity, image: productImage(item.product)
    }));
    await new Promise((resolve) => this.setData({ cartItems }, resolve));
    return true;
  },
  async loadQuote() {
    const requestToken = (this._quoteRequestSeq || 0) + 1;
    this._quoteRequestSeq = requestToken;
    const { address, warehouse, cartItems } = this.data;
    const commit = (patch) => new Promise((resolve) => this.setData(patch, resolve));
    const unpricedCartItems = cartItems.map((item) => ({ ...item, unitPriceText: '', subtotalText: '' }));
    if (!address.id || !warehouse || !cartItems.length) {
      const reason = !address.id ? '请先添加收货地址' : !warehouse ? '暂未配置可配送仓' : '购物车暂无可结算商品';
      return commit({ cartItems: unpricedCartItems, quoteState: 'invalid', quoteErrorText: reason, cartTotal: '--', freightTotal: '--', orderTotal: '--' });
    }
    await commit({ cartItems: unpricedCartItems, quoteState: 'loading', quoteErrorText: '', cartTotal: '--', freightTotal: '--', orderTotal: '--' });
    const result = await checkoutApi.quote({ addressId: address.id, warehouseId: warehouse.id, items: cartItems.map((item) => ({ skuId: item.skuId, quantity: item.qty })) });
    if (requestToken !== this._quoteRequestSeq) return;
    const quote = result && result.ok && result.data && result.data.quote;
    if (!quote) return commit({ cartItems: unpricedCartItems, quoteState: 'error', quoteErrorText: result && result.error && result.error.message || '配送费和订单金额暂时无法核验，请重试' });
    const payable = quote.payableAmountCent !== undefined ? quote.payableAmountCent : quote.totalAmountCent;
    const quoteItems = Array.isArray(quote.items) ? quote.items : [];
    const quotedCartItems = cartItems.map((item) => {
      const quoteItem = quoteItems.find((entry) => String(entry && entry.skuId) === String(item.skuId));
      return { ...item, unitPriceText: quoteItem && Number.isFinite(Number(quoteItem.unitPriceCent)) ? money(Number(quoteItem.unitPriceCent) / 100) : '', subtotalText: quoteItem && Number.isFinite(Number(quoteItem.subtotalCent)) ? money(Number(quoteItem.subtotalCent) / 100) : '' };
    });
    await commit({ cartItems: quotedCartItems, quoteState: 'ready', quoteErrorText: '', cartTotal: money(Number(quote.goodsAmountCent || 0) / 100), freightTotal: money(Number(quote.freightAmountCent || 0) / 100), orderTotal: money(Number(payable || 0) / 100) });
  },
  chooseAddress() {
    if (typeof wx.chooseAddress !== 'function') return wx.showToast({ title: '当前微信版本不支持选择地址', icon: 'none' });
    wx.chooseAddress({
      success: async (picked) => {
      const phone = String(picked.telNumber || '').replace(/\s/g, '');
      const regionCode = [picked.cityName, picked.countyName].map((item) => String(item || '').trim()).filter(Boolean).join('/');
      if (!/^1[3-9]\d{9}$/.test(phone) || !regionCode || !picked.detailInfo) return wx.showToast({ title: '微信地址信息不完整，暂不能保存', icon: 'none' });
      const saved = await addressApi.save({ name: picked.userName, phone, provinceCode: picked.provinceName, cityCode: picked.cityName, districtCode: picked.countyName, regionCode, detail: picked.detailInfo, isDefault: true });
      if (!saved || !saved.ok) return wx.showToast({ title: saved && saved.error && saved.error.message || '地址保存失败', icon: 'none' });
      await this.loadAddress();
      await this.loadQuote();
      },
      fail: (error) => {
        const message = String(error && error.errMsg || '');
        if (/cancel/i.test(message)) return;
        wx.showToast({ title: '无法打开地址簿，请稍后重试', icon: 'none' });
      }
    });
  },
  selectWarehouse(event) {
    const warehouse = this.data.warehouses.find((item) => item.id === event.currentTarget.dataset.id);
    if (!warehouse) return;
    this.setData({ warehouse, warehouseAreaText: warehouse.areas && warehouse.areas.length ? warehouse.areas.join('、') : '配送区域以订单确认页为准' }, () => this.loadQuote());
  },
  async retryLoad() {
    this.setData({ loadError: false, loadErrorText: '', quoteState: 'loading', quoteErrorText: '' });
    await Promise.all([this.loadAddress(), this.loadDelivery(), this.loadCart()]);
    await this.loadQuote();
  },
  retryQuote() { return this.loadQuote(); },
  async submitOrder() {
    if (this._submittingOrder || this.data.submitting) return wx.showToast({ title: '正在提交订单，请稍候', icon: 'none' });
    if (this.data.quoteState !== 'ready') {
      const hint = this.data.quoteState === 'error' ? '报价核验失败，请点击重新核验报价' : '正在核验本次报价，请稍候';
      return wx.showToast({ title: hint, icon: 'none' });
    }
    const { address, warehouse, cartItems } = this.data;
    if (!address.id || !warehouse || !cartItems.length) return wx.showToast({ title: '请先完善地址、配送仓和商品', icon: 'none' });
    this._submittingOrder = true;
    this.setData({ submitting: true });
    try {
      if (!this._orderIdempotencyKey) this._orderIdempotencyKey = `mini-demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const idempotencyKey = this._orderIdempotencyKey;
      // 与主包内嵌结算的支付方式口径一致：已审核商家走线下结算，其余走演示支付
      const me = await authApi.getMe();
      if (!me || !me.ok || !me.data || !me.data.user) return wx.showToast({ title: '登录状态已失效，请重新登录', icon: 'none' });
      const isBusiness = me.data.user.userType === 'b' && me.data.user.businessStatus === 'approved';
      const paymentMethod = isBusiness ? 'offline' : 'demo';
      const result = await checkoutApi.createOrder({ idempotencyKey, addressId: address.id, warehouseId: warehouse.id, items: cartItems.map((item) => ({ skuId: item.skuId, quantity: item.qty })), paymentMethod });
      const order = result && result.ok && result.data && result.data.order;
      if (!order) return wx.showToast({ title: result && result.error && result.error.message || '订单创建失败，请稍后重试', icon: 'none' });
      this._orderIdempotencyKey = '';
      const removed = await Promise.all(cartItems.map((item) => cartApi.removeItem(item.id)));
      if (removed.some((item) => !item || !item.ok)) wx.showToast({ title: '订单已创建，购物车同步失败', icon: 'none' });
      if (paymentMethod === 'demo') return wx.redirectTo({ url: `/package-trade/pages/demo-payment/index?id=${encodeURIComponent(order._id)}` });
      wx.redirectTo({ url: '/package-trade/pages/orders/index?filter=' + encodeURIComponent('全部订单') });
    } finally {
      this._submittingOrder = false;
      this.setData({ submitting: false });
    }
  },
  back() { wx.navigateBack(); }
});
