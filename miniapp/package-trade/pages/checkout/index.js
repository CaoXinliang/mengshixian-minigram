const { config, address: addressApi, cart: cartApi, delivery: deliveryApi, checkout: checkoutApi, auth: authApi, bundles: bundleApi, groups: groupsApi } = require('../../../services/index');
const { money } = require('../../services/trade-format');

const EMPTY_ADDRESS = { id: '', name: '', masked: '', detail: '' };
const customerWarehouseName = (name) => String(name || '配送仓').replace(/演示/g, '').replace(/\s{2,}/g, ' ').trim() || '配送仓';
const customerAddressText = (value, fallback) => String(value || '').replace(/梦食鲜演示收货点（非客户地址）/g, '已保存的收货地址').replace(/演示用户/g, '收货人').replace(/演示/g, '').trim() || fallback;
const productImage = (product) => product && (product.image || product.coverUrl) || '/assets/products/placeholder.svg';

Page({
  data: {
    address: EMPTY_ADDRESS, warehouses: [], warehouse: null, warehouseAreaText: '', cartItems: [],
    deliveryAreas: [], allDeliverySlots: [], deliverySlots: [], deliverySlot: null, deliverySlotsContractAvailable: false,
    fulfillmentType: 'delivery', allPickupSites: [], pickupSites: [], pickupSite: null, pickupFree: false,
    cartTotal: '--', freightTotal: '--', discountTotal: '0.00', orderTotal: '--', quoteState: 'loading', quoteErrorText: '', submitting: false, loadError: false, loadErrorText: '', entryInvalid: false, acceptedQuoteToken: '', couponId: '', coupon: null, bundleId: '', bundleQuantity: 1, groupId: '', groupCampaignId: '', groupSkuId: '', groupMode: false
  },
  async onLoad(query = {}) {
    let acceptedQuoteToken = query.acceptedQuoteToken || '';
    try { acceptedQuoteToken = decodeURIComponent(acceptedQuoteToken); } catch (error) { acceptedQuoteToken = ''; }
    let bundleId = query.bundleId || ''; try { bundleId = decodeURIComponent(bundleId); } catch (error) { bundleId = ''; }
    const groupId = query.groupId ? decodeURIComponent(query.groupId) : ''; const groupCampaignId = query.groupCampaignId ? decodeURIComponent(query.groupCampaignId) : ''; const groupSkuId = query.groupSkuId ? decodeURIComponent(query.groupSkuId) : '';
    const hasCheckoutContext = query.source === 'cart' || Boolean(acceptedQuoteToken || bundleId || (groupId && groupCampaignId && groupSkuId));
    if (!hasCheckoutContext) {
      this._entryInvalid = true;
      this._loaded = true;
      this.setData({ entryInvalid: true, quoteState: 'invalid', quoteErrorText: '请从购物车选择商品后进入结算' });
      return;
    }
    this.setData({ acceptedQuoteToken, bundleId, bundleQuantity: Math.max(1, Number(query.bundleQuantity || 1)), groupId, groupCampaignId, groupSkuId, groupMode: Boolean(groupId && groupCampaignId && groupSkuId), fulfillmentType: groupId ? 'delivery' : 'delivery' });
    this._initializing = true;
    await Promise.all([this.loadAddress(), this.loadDelivery(), this.loadCart()]);
    await this.loadQuote();
    this._initializing = false;
    this._loaded = true;
  },
  async onShow() {
    if (this._entryInvalid || !this._loaded || this._initializing || this._refreshingFromAddress) return;
    this._refreshingFromAddress = true;
    try {
      await this.loadAddress();
      this.syncDeliverySlots();
      await this.loadQuote();
    } finally {
      this._refreshingFromAddress = false;
    }
  },
  async loadAddress() {
    const result = await addressApi.list();
    if (!result || !result.ok) { this.setData({ loadError: true, loadErrorText: '收货地址读取失败，请重新加载' }); return false; }
    const rows = result && result.ok && result.data && Array.isArray(result.data.rows) ? result.data.rows : [];
    const item = rows.find((row) => row.isDefault) || rows[0];
    await new Promise((resolve) => this.setData({ address: item ? { id: item._id, name: customerAddressText(item.name, '收货人'), masked: item.phoneMasked || '', detail: customerAddressText(item.detail, '已保存的收货地址'), regionCode: item.regionCode || '' } : EMPTY_ADDRESS }, resolve));
    return true;
  },
  async loadDelivery() {
    const result = await deliveryApi.options();
    if (!result || !result.ok) { this.setData({ loadError: true, loadErrorText: '配送范围读取失败，请重新加载' }); return false; }
    const deliveryAreas = result && result.data && (Array.isArray(result.data.deliveryAreas) ? result.data.deliveryAreas : result.data.areas);
    const slotsSource = result && result.data && (Array.isArray(result.data.deliverySlots) ? result.data.deliverySlots : result.data.slots);
    const pickupSitesSource = result && result.data && Array.isArray(result.data.pickupSites) ? result.data.pickupSites : [];
    const rawWarehouses = result && result.ok && result.data && Array.isArray(result.data.warehouses) ? result.data.warehouses : [];
    const normalizedAreas = Array.isArray(deliveryAreas) ? deliveryAreas : [];
    const warehouses = rawWarehouses.map((item) => ({
      id: item._id,
      name: customerWarehouseName(item.name),
      eta: '',
      areas: normalizedAreas.filter((area) => !area.warehouseIds || !area.warehouseIds.length || area.warehouseIds.includes(item._id)).flatMap((area) => area.regionCodes || [])
    }));
    const warehouse = warehouses[0] || null;
    const deliverySlotsContractAvailable = Array.isArray(slotsSource);
    const allDeliverySlots = deliverySlotsContractAvailable ? slotsSource.map((item) => ({ id: item._id, name: item.name || `${item.startTime || ''}-${item.endTime || ''}`, startTime: item.startTime || '', endTime: item.endTime || '', warehouseId: item.warehouseId || '', deliveryAreaId: item.deliveryAreaId || '' })) : [];
    const allPickupSites = pickupSitesSource.map((item) => ({ id: item._id, name: item.name || '自提点', address: item.address || '', regionCode: item.regionCode || '', warehouseId: item.warehouseId || '', openingHours: item.openingHours || '请联系门店确认' }));
    await new Promise((resolve) => this.setData({ warehouses, warehouse, deliveryAreas: normalizedAreas, allDeliverySlots, deliverySlotsContractAvailable, allPickupSites, warehouseAreaText: warehouse && warehouse.areas.length ? warehouse.areas.join('、') : '暂无配送范围信息' }, resolve));
    this.syncDeliverySlots();
    this.syncPickupSites();
    return true;
  },
  syncDeliverySlots(overrides = {}) {
    const address = overrides.address || this.data.address || EMPTY_ADDRESS;
    const warehouse = overrides.warehouse || this.data.warehouse;
    const areas = this.data.deliveryAreas || [];
    const area = address.regionCode && warehouse ? areas.find((item) => (item.regionCodes || []).includes(address.regionCode) && (!(item.warehouseIds || []).length || item.warehouseIds.includes(warehouse.id))) : null;
    const deliverySlots = !this.data.deliverySlotsContractAvailable || !warehouse || !area ? [] : (this.data.allDeliverySlots || []).filter((item) => (!item.warehouseId || item.warehouseId === warehouse.id) && (!item.deliveryAreaId || item.deliveryAreaId === area._id));
    const currentId = this.data.deliverySlot && this.data.deliverySlot.id;
    const deliverySlot = deliverySlots.find((item) => item.id === currentId) || deliverySlots[0] || null;
    this.setData({ deliverySlots, deliverySlot });
    return deliverySlot;
  },
  syncPickupSites(overrides = {}) {
    const warehouse = overrides.warehouse || this.data.warehouse;
    const pickupSites = warehouse ? (this.data.allPickupSites || []).filter((item) => item.warehouseId === warehouse.id) : [];
    const currentId = this.data.pickupSite && this.data.pickupSite.id;
    const pickupSite = pickupSites.find((item) => item.id === currentId) || pickupSites[0] || null;
    this.setData({ pickupSites, pickupSite });
    return pickupSite;
  },
  async loadCart() {
    if (this.data.groupMode) { await new Promise(resolve => this.setData({ cartItems: [{ id: 'group-item', skuId: this.data.groupSkuId, name: '拼团商品', unit: '', qty: 1, image: '/assets/products/placeholder.svg' }] }, resolve)); return true; }
    if (this.data.bundleId) {
      const result = await bundleApi.get({ id: this.data.bundleId });
      const bundle = result && result.ok && result.data && (result.data.bundle || result.data);
      if (!bundle) { this.setData({ loadError: true, loadErrorText: result && result.error && result.error.message || '套餐内容读取失败，请重试' }); return false; }
      const rows = result.data.items || bundle.items || [];
      const cartItems = rows.map((item, index) => ({ id: `bundle-${index}`, skuId: item.skuId || item._id, name: item.productName || item.name || '套餐商品', unit: item.specName || item.spec || '', qty: Number(item.quantity || 1) * this.data.bundleQuantity, image: item.image || '/assets/products/placeholder.svg' }));
      await new Promise(resolve => this.setData({ cartItems }, resolve)); return true;
    }
    const result = await cartApi.getAll();
    if (!result || !result.ok) { this.setData({ loadError: true, loadErrorText: '购物车读取失败，请重新加载' }); return false; }
    const rows = result && result.ok && result.data && Array.isArray(result.data.rows) ? result.data.rows : [];
    const cartItems = rows.filter((item) => item.selected !== false && item.sku && item.product && !item.unavailable).map((item) => ({
      id: item._id, skuId: item.skuId, name: item.product.name || '商品信息暂不可用', unit: item.sku.specName || item.sku.packageUnit || item.sku.netWeight || '暂无规格信息', qty: item.quantity, image: productImage(item.product)
    }));
    await new Promise((resolve) => this.setData({ cartItems }, resolve));
    return true;
  },
  async loadQuote() {
    const requestToken = (this._quoteRequestSeq || 0) + 1;
    this._quoteRequestSeq = requestToken;
    const { address, warehouse, cartItems, deliverySlotsContractAvailable, fulfillmentType } = this.data;
    const deliverySlot = fulfillmentType === 'delivery' ? this.syncDeliverySlots() : null;
    const pickupSite = fulfillmentType === 'pickup' ? this.syncPickupSites() : null;
    const commit = (patch) => new Promise((resolve) => this.setData(patch, resolve));
    const unpricedCartItems = cartItems.map((item) => ({ ...item, unitPriceText: '', subtotalText: '' }));
    const missingDelivery = fulfillmentType === 'delivery' && (!address.id || (deliverySlotsContractAvailable && !deliverySlot));
    const missingPickup = fulfillmentType === 'pickup' && !pickupSite;
    if (!warehouse || !cartItems.length || missingDelivery || missingPickup) {
      const reason = !warehouse ? '当前暂无可配送仓库' : !cartItems.length ? '购物车暂无可结算商品' : fulfillmentType === 'pickup' ? '当前仓库暂无可用自提点' : !address.id ? '请先添加收货地址' : '当前仓库与收货区域暂无可用配送时段';
      return commit({ cartItems: unpricedCartItems, quoteState: 'invalid', quoteErrorText: reason, cartTotal: '--', freightTotal: '--', discountTotal: '0.00', orderTotal: '--', pickupFree: false });
    }
    await commit({ cartItems: unpricedCartItems, quoteState: 'loading', quoteErrorText: '', cartTotal: '--', freightTotal: '--', orderTotal: '--', pickupFree: false });
    const fulfillmentPayload = fulfillmentType === 'pickup'
      ? { fulfillmentType: 'pickup', pickupSiteId: pickupSite.id }
      : { fulfillmentType: 'delivery', addressId: address.id, regionCode: address.regionCode || '', ...(deliverySlotsContractAvailable ? { deliverySlotId: deliverySlot.id } : {}) };
    const quotePayload = { ...fulfillmentPayload, warehouseId: warehouse.id, ...(this.data.bundleId ? { bundleId: this.data.bundleId, quantity: this.data.bundleQuantity } : { items: cartItems.map((item) => ({ skuId: item.skuId, quantity: item.qty })) }), ...(this.data.couponId ? { couponId: this.data.couponId } : {}), ...(this.data.acceptedQuoteToken ? { acceptedQuoteToken: this.data.acceptedQuoteToken } : {}) };
    const result = this.data.groupMode ? await groupsApi.quote({ ...quotePayload, campaignId: this.data.groupCampaignId }) : this.data.bundleId ? await bundleApi.quote(quotePayload) : await checkoutApi.quote(quotePayload);
    if (requestToken !== this._quoteRequestSeq) return;
    const quote = result && result.ok && result.data && result.data.quote;
    if (!quote) return commit({ cartItems: unpricedCartItems, quoteState: 'error', quoteErrorText: result && result.error && result.error.message || '订单金额计算失败，请重试', pickupFree: false });
    const payable = quote.payableAmountCent !== undefined ? quote.payableAmountCent : quote.totalAmountCent;
    const quoteItems = Array.isArray(quote.items) ? quote.items : [];
    const quotedCartItems = cartItems.map((item) => {
      const quoteItem = quoteItems.find((entry) => String(entry && entry.skuId) === String(item.skuId));
      return { ...item, unitPriceText: quoteItem && Number.isFinite(Number(quoteItem.unitPriceCent)) ? money(Number(quoteItem.unitPriceCent) / 100) : '', subtotalText: quoteItem && Number.isFinite(Number(quoteItem.subtotalCent)) ? money(Number(quoteItem.subtotalCent) / 100) : '' };
    });
    await commit({ cartItems: quotedCartItems, quoteState: 'ready', quoteErrorText: '', cartTotal: money(Number(quote.goodsAmountCent || 0) / 100), freightTotal: money(Number(quote.freightAmountCent || 0) / 100), discountTotal: money(Number(quote.discountAmountCent || 0) / 100), orderTotal: money(Number(payable || 0) / 100), pickupFree: fulfillmentType === 'pickup' && Number(quote.freightAmountCent || 0) === 0, coupon: quote.couponSnapshot || this.data.coupon });
  },
  chooseAddress() {
    wx.navigateTo({ url: '/package-trade/pages/addresses/index?select=1' });
  },
  selectWarehouse(event) {
    const warehouse = this.data.warehouses.find((item) => item.id === event.currentTarget.dataset.id);
    if (!warehouse) return;
    this.setData({ warehouse, warehouseAreaText: warehouse.areas && warehouse.areas.length ? warehouse.areas.join('、') : '暂无配送范围信息' }, () => { this.syncDeliverySlots({ warehouse }); this.syncPickupSites({ warehouse }); this.loadQuote(); });
  },
  selectFulfillmentType(event) {
    if (this.data.groupMode) return wx.showToast({ title: '拼团订单仅支持冷链配送', icon: 'none' });
    const fulfillmentType = event.currentTarget.dataset.type;
    if (!['delivery', 'pickup'].includes(fulfillmentType) || fulfillmentType === this.data.fulfillmentType) return;
    this.setData({ fulfillmentType, quoteState: 'loading', quoteErrorText: '', cartTotal: '--', freightTotal: '--', orderTotal: '--', pickupFree: false }, () => {
      if (fulfillmentType === 'delivery') this.syncDeliverySlots();
      else this.syncPickupSites();
      this.loadQuote();
    });
  },
  selectDeliverySlot(event) {
    const deliverySlot = this.data.deliverySlots.find((item) => item.id === event.currentTarget.dataset.id);
    if (!deliverySlot || deliverySlot.id === (this.data.deliverySlot && this.data.deliverySlot.id)) return;
    this.setData({ deliverySlot }, () => this.loadQuote());
  },
  selectPickupSite(event) {
    const pickupSite = this.data.pickupSites.find((item) => item.id === event.currentTarget.dataset.id);
    if (!pickupSite || pickupSite.id === (this.data.pickupSite && this.data.pickupSite.id)) return;
    this.setData({ pickupSite }, () => this.loadQuote());
  },
  async retryLoad() {
    this.setData({ loadError: false, loadErrorText: '', quoteState: 'loading', quoteErrorText: '' });
    await Promise.all([this.loadAddress(), this.loadDelivery(), this.loadCart()]);
    await this.loadQuote();
  },
  retryQuote() { return this.loadQuote(); },
  chooseCoupon() { wx.navigateTo({ url: '/package-marketing/pages/coupons/index?select=1', events: { couponSelected: data => this.setData({ couponId: data && data.couponId || '', coupon: data && data.coupon || null }, () => this.loadQuote()) } }); },
  async submitOrder() {
    if (this._submittingOrder || this.data.submitting) return wx.showToast({ title: '正在提交订单，请稍候', icon: 'none' });
    if (this.data.quoteState !== 'ready') {
      const hint = this.data.quoteState === 'error' ? '请先重新计算订单金额' : '正在计算订单金额，请稍候';
      return wx.showToast({ title: hint, icon: 'none' });
    }
    const { address, warehouse, cartItems, deliverySlot, deliverySlotsContractAvailable, fulfillmentType, pickupSite } = this.data;
    if (!warehouse || !cartItems.length) return wx.showToast({ title: '请先选择仓库和商品', icon: 'none' });
    if (fulfillmentType === 'delivery' && !address.id) return wx.showToast({ title: '请先选择收货地址', icon: 'none' });
    if (fulfillmentType === 'delivery' && deliverySlotsContractAvailable && !deliverySlot) return wx.showToast({ title: '当前没有可用配送时段，暂不能提交订单', icon: 'none' });
    if (fulfillmentType === 'pickup' && !pickupSite) return wx.showToast({ title: '当前仓库暂无可用自提点', icon: 'none' });
    this._submittingOrder = true;
    this.setData({ submitting: true });
    try {
      if (!this._orderIdempotencyKey) this._orderIdempotencyKey = `mini-demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const idempotencyKey = this._orderIdempotencyKey;
      // 与主包内嵌结算的支付方式口径一致：已审核商家走线下结算，其余走演示支付
      const me = await authApi.getMe();
      if (!me || !me.ok || !me.data || !me.data.user) return wx.showToast({ title: '登录状态已失效，请重新登录', icon: 'none' });
      const user = me.data.user;
      const isBusiness = user.userType === 'b' && user.businessStatus === 'approved' && Boolean(user.organizationId) && user.status !== 'disabled';
      const paymentMethod = this.data.groupMode ? 'wechat' : isBusiness ? 'offline' : 'demo';
      const fulfillmentPayload = fulfillmentType === 'pickup'
        ? { fulfillmentType: 'pickup', pickupSiteId: pickupSite.id }
        : { fulfillmentType: 'delivery', addressId: address.id, ...(deliverySlotsContractAvailable ? { deliverySlotId: deliverySlot.id } : {}) };
      const orderPayload = { idempotencyKey, ...fulfillmentPayload, warehouseId: warehouse.id, ...(this.data.bundleId ? { bundleId: this.data.bundleId, bundleQuantity: this.data.bundleQuantity } : { items: cartItems.map((item) => ({ skuId: item.skuId, quantity: item.qty })) }), paymentMethod, ...(this.data.couponId ? { couponId: this.data.couponId } : {}), ...(this.data.acceptedQuoteToken ? { acceptedQuoteToken: this.data.acceptedQuoteToken } : {}) };
      const result = this.data.groupMode ? await groupsApi.join({ ...orderPayload, groupId: this.data.groupId }) : await checkoutApi.createOrder(orderPayload);
      const order = result && result.ok && result.data && result.data.order;
      if (!order) { if (result && result.error && result.error.code === 'PAYMENT_NOT_CONFIGURED') return wx.showModal({ title: '微信支付暂不可用', content: '当前无法完成拼团参团，也不会发生扣款。', showCancel: false }); return wx.showToast({ title: result && result.error && result.error.message || '订单创建失败，请稍后重试', icon: 'none' }); }
      this._orderIdempotencyKey = '';
      const removed = this.data.bundleId ? [] : await Promise.all(cartItems.map((item) => cartApi.removeItem(item.id)));
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
