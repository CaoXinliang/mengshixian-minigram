const { config, health: healthApi, address: addressApi, cart: cartApi, delivery: deliveryApi, checkout: checkoutApi, orders: ordersApi, auth: authApi, bundles: bundleApi, groups: groupsApi } = require('../../../services/index');
const { money } = require('../../services/trade-format');
const { checkoutAddress } = require('../../../modules/address-presentation');
const {
  normalizeDeliveryOptions,
  deliveryAreaFor,
  resolveWarehouseForAddress
} = require('../../../modules/warehouse-state');
const { createCheckoutQuoteSession, invalidQuoteState, isInquiryQuoteInvalidCode, loadingQuoteState, quotePreconditionState } = require('../../../modules/checkout-quote-state');
const { createOrderSubmission, orderIntentFromCheckout, orderIntentValidation, paymentMethodForUser, requiresRequote } = require('../../../modules/order-submission');

const EMPTY_ADDRESS = { id: '', name: '', masked: '', detail: '' };
const customerWarehouseName = (name) => String(name || '配送仓').replace(/演示/g, '').replace(/\s{2,}/g, ' ').trim() || '配送仓';
const productImage = (product) => product && (product.image || product.coverUrl) || '/assets/products/placeholder.svg';
const itemQuantity = (items) => (Array.isArray(items) ? items : []).reduce((total, item) => total + Math.max(0, Number(item && item.qty || 0)), 0);

Page({
  data: {
    address: EMPTY_ADDRESS, warehouses: [], warehouse: null, warehouseAreaText: '', cartItems: [], cartItemQty: 0,
    deliveryAreas: [], allDeliverySlots: [], deliverySlots: [], deliverySlot: null, deliverySlotsContractAvailable: false,
    fulfillmentType: 'delivery', allPickupSites: [], pickupSites: [], pickupSite: null, pickupFree: false,
    cartTotal: '--', freightTotal: '--', discountTotal: '0.00', orderTotal: '--', quoteState: 'loading', quoteErrorText: '', submitting: false, orderSubmitState: 'idle', orderSubmitText: '', loadError: false, loadErrorText: '', entryInvalid: false, acceptedQuoteToken: '', inquiryQuoteInvalid: false, paymentCapabilities: null, couponId: '', coupon: null, bundleId: '', bundleQuantity: 1, groupId: '', groupCampaignId: '', groupSkuId: '', groupMode: false
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
    await Promise.all([this.loadCapabilities(), this.loadAddress(), this.loadDelivery(), this.loadCart()]);
    await this.syncWarehouseForAddress();
    await this.loadQuote();
    this._initializing = false;
    this._loaded = true;
  },
  async onShow() {
    if (this._entryInvalid || this.data.inquiryQuoteInvalid || !this._loaded || this._initializing || this._refreshingFromAddress) return;
    if (this._skipNextAddressRefresh) {
      this._skipNextAddressRefresh = false;
      return;
    }
    this._refreshingFromAddress = true;
    try {
      await this.loadAddress();
      await this.syncWarehouseForAddress();
      await this.loadQuote();
    } finally {
      this._refreshingFromAddress = false;
    }
  },
  async loadCapabilities() {
    const result = healthApi && typeof healthApi.get === 'function' ? await healthApi.get() : null;
    const capabilities = result && result.ok && result.data && result.data.capabilities;
    this.setData({ paymentCapabilities: capabilities || {} });
    return Boolean(capabilities);
  },
  async loadAddress() {
    const result = await addressApi.list();
    if (!result || !result.ok) { this.setData({ loadError: true, loadErrorText: '收货地址读取失败，请重新加载' }); return false; }
    const rows = result && result.ok && result.data && Array.isArray(result.data.rows) ? result.data.rows : [];
    const item = rows.find((row) => row.isDefault) || rows[0];
    await new Promise((resolve) => this.setData({ address: checkoutAddress(item) || EMPTY_ADDRESS }, resolve));
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
    const warehouses = normalizeDeliveryOptions({ warehouses: rawWarehouses, areas: normalizedAreas }, customerWarehouseName);
    const matchedWarehouse = resolveWarehouseForAddress(this.data.warehouse, warehouses, normalizedAreas, this.data.address);
    const warehouse = matchedWarehouse.warehouse || warehouses[0] || null;
    const deliverySlotsContractAvailable = Array.isArray(slotsSource);
    const allDeliverySlots = deliverySlotsContractAvailable ? slotsSource.map((item) => ({ id: item._id, name: item.name || `${item.startTime || ''}-${item.endTime || ''}`, startTime: item.startTime || '', endTime: item.endTime || '', warehouseId: item.warehouseId || '', deliveryAreaId: item.deliveryAreaId || '' })) : [];
    const allPickupSites = pickupSitesSource.map((item) => ({ id: item._id, name: item.name || '自提点', address: item.address || '', regionCode: item.regionCode || '', warehouseId: item.warehouseId || '', openingHours: item.openingHours || '请联系门店确认' }));
    await new Promise((resolve) => this.setData({ warehouses, warehouse, deliveryAreas: normalizedAreas, allDeliverySlots, deliverySlotsContractAvailable, allPickupSites, warehouseAreaText: warehouse && warehouse.areas.length ? warehouse.areas.join('、') : '暂无配送范围信息' }, resolve));
    this.syncDeliverySlots();
    this.syncPickupSites();
    return true;
  },
  async syncWarehouseForAddress() {
    const warehouses = this.data.warehouses || [];
    const matched = resolveWarehouseForAddress(this.data.warehouse, warehouses, this.data.deliveryAreas, this.data.address);
    const warehouse = matched.warehouse || warehouses[0] || null;
    await new Promise((resolve) => this.setData({
      warehouse,
      warehouseAreaText: warehouse && warehouse.areas && warehouse.areas.length ? warehouse.areas.join('、') : '暂无配送范围信息'
    }, resolve));
    this.syncDeliverySlots({ address: this.data.address, warehouse });
    this.syncPickupSites({ warehouse });
    return matched;
  },
  syncDeliverySlots(overrides = {}) {
    const address = overrides.address || this.data.address || EMPTY_ADDRESS;
    const warehouse = overrides.warehouse || this.data.warehouse;
    const areas = this.data.deliveryAreas || [];
    const area = deliveryAreaFor(address, warehouse, areas);
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
    if (this.data.groupMode) {
      const cartItems = [{ id: 'group-item', skuId: this.data.groupSkuId, name: '拼团商品', unit: '', qty: 1, image: '/assets/products/placeholder.svg' }];
      await new Promise(resolve => this.setData({ cartItems, cartItemQty: itemQuantity(cartItems) }, resolve));
      return true;
    }
    if (this.data.bundleId) {
      const result = await bundleApi.get({ id: this.data.bundleId });
      const bundle = result && result.ok && result.data && (result.data.bundle || result.data);
      if (!bundle) { this.setData({ loadError: true, loadErrorText: result && result.error && result.error.message || '套餐内容读取失败，请重试' }); return false; }
      const rows = result.data.items || bundle.items || [];
      const cartItems = rows.map((item, index) => ({ id: `bundle-${index}`, skuId: item.skuId || item._id, name: item.productName || item.name || '套餐商品', unit: item.specName || item.spec || '', qty: Number(item.quantity || 1) * this.data.bundleQuantity, image: item.image || '/assets/products/placeholder.svg' }));
      await new Promise(resolve => this.setData({ cartItems, cartItemQty: itemQuantity(cartItems) }, resolve)); return true;
    }
    const result = await cartApi.getAll();
    if (!result || !result.ok) { this.setData({ loadError: true, loadErrorText: '购物车读取失败，请重新加载' }); return false; }
    const rows = result && result.ok && result.data && Array.isArray(result.data.rows) ? result.data.rows : [];
    const cartItems = rows.filter((item) => item.selected !== false && item.sku && item.product && !item.unavailable).map((item) => ({
      id: item._id, skuId: item.skuId, name: item.product.name || '商品信息暂不可用', unit: item.sku.specName || item.sku.packageUnit || item.sku.netWeight || '暂无规格信息', qty: item.quantity, image: productImage(item.product)
    }));
    await new Promise((resolve) => this.setData({ cartItems, cartItemQty: itemQuantity(cartItems) }, resolve));
    return true;
  },
  async loadQuote() {
    if (this.data.inquiryQuoteInvalid) return this.setData(invalidQuoteState(this.data.cartItems, '询价报价已失效，请返回询价单确认最新报价', { acceptedQuoteToken: '', inquiryQuoteInvalid: true }));
    const { address, warehouse, cartItems, deliverySlotsContractAvailable, fulfillmentType } = this.data;
    const deliverySlot = fulfillmentType === 'delivery' ? this.syncDeliverySlots() : null;
    const pickupSite = fulfillmentType === 'pickup' ? this.syncPickupSites() : null;
    const commit = (patch) => new Promise((resolve) => this.setData(patch, resolve));
    const deliveryArea = fulfillmentType === 'delivery' ? deliveryAreaFor(address, warehouse, this.data.deliveryAreas) : null;
    const precondition = quotePreconditionState({ warehouseId: warehouse && warehouse.id, cartItems, fulfillmentType, pickupSiteId: pickupSite && pickupSite.id, addressId: address.id, regionCode: address.regionCode, hasDeliveryArea: Boolean(deliveryArea), deliverySlotsContractAvailable, deliverySlotId: deliverySlot && deliverySlot.id });
    if (precondition) return commit(precondition);
    await commit(loadingQuoteState(cartItems));
    if (!this._quoteSession) this._quoteSession = createCheckoutQuoteSession({ quote: payload => checkoutApi.quote(payload), quoteBundle: payload => bundleApi.quote(payload), quoteGroup: payload => groupsApi.quote(payload) });
    const outcome = await this._quoteSession.load({
      mode: this.data.groupMode ? 'group' : this.data.bundleId ? 'bundle' : 'standard',
      context: {
        fulfillmentType,
        pickupSiteId: pickupSite && pickupSite.id,
        addressId: address.id,
        regionCode: address.regionCode || '',
        deliverySlotsContractAvailable,
        deliverySlotId: deliverySlot && deliverySlot.id,
        warehouseId: warehouse.id,
        cartItems,
        bundleId: this.data.bundleId,
        bundleQuantity: this.data.bundleQuantity,
        couponId: this.data.couponId,
        acceptedQuoteToken: this.data.acceptedQuoteToken,
        groupCampaignId: this.data.groupCampaignId
      },
      presentation: { cartItems, fulfillmentType, coupon: this.data.coupon, deliverySlot, pickupSite, deliverySlots: this.data.deliverySlots || [], allDeliverySlots: this.data.allDeliverySlots || [], pickupSites: this.data.pickupSites || [], allPickupSites: this.data.allPickupSites || [], money }
    });
    if (outcome.kind === 'current') await commit(outcome.patch);
  },
  invalidateQuote() {
    if (this._quoteSession) this._quoteSession.invalidate();
    return {
      acceptedQuoteToken: '',
      quoteState: 'loading',
      quoteErrorText: '',
      cartTotal: '--',
      freightTotal: '--',
      discountTotal: '0.00',
      orderTotal: '--',
      pickupFree: false
    };
  },
  chooseAddress() {
    wx.navigateTo({
      url: '/package-trade/pages/addresses/index?select=1',
      success: (navigation) => {
        const eventChannel = navigation && navigation.eventChannel;
        if (!eventChannel || typeof eventChannel.on !== 'function') return;
        eventChannel.on('addressSelected', (item) => this.applySelectedAddress(item));
      }
    });
  },
  async applySelectedAddress(item) {
    const id = item && (item.id || item._id);
    if (!id) return;
    const address = checkoutAddress(item);
    const matched = resolveWarehouseForAddress(this.data.warehouse, this.data.warehouses, this.data.deliveryAreas, address);
    const warehouse = matched.warehouse || this.data.warehouse;
    this._skipNextAddressRefresh = true;
    const quotePatch = this.invalidateQuote();
    await new Promise((resolve) => this.setData({
      address,
      warehouse,
      warehouseAreaText: warehouse && warehouse.areas && warehouse.areas.length ? warehouse.areas.join('、') : '暂无配送范围信息',
      ...quotePatch
    }, resolve));
    this.syncDeliverySlots({ address, warehouse });
    this.syncPickupSites({ warehouse });
    await this.loadQuote();
  },
  selectWarehouse(event) {
    const warehouse = this.data.warehouses.find((item) => item.id === event.currentTarget.dataset.id);
    if (!warehouse) return;
    const quotePatch = this.invalidateQuote();
    this.setData({ warehouse, warehouseAreaText: warehouse.areas && warehouse.areas.length ? warehouse.areas.join('、') : '暂无配送范围信息', ...quotePatch }, () => { this.syncDeliverySlots({ warehouse }); this.syncPickupSites({ warehouse }); this.loadQuote(); });
  },
  selectFulfillmentType(event) {
    if (this.data.groupMode) return wx.showToast({ title: '拼团订单仅支持冷链配送', icon: 'none' });
    const fulfillmentType = event.currentTarget.dataset.type;
    if (!['delivery', 'pickup'].includes(fulfillmentType) || fulfillmentType === this.data.fulfillmentType) return;
    const quotePatch = this.invalidateQuote();
    this.setData({
      fulfillmentType,
      ...quotePatch,
      ...(fulfillmentType === 'delivery' ? { pickupSite: null } : { deliverySlot: null })
    }, () => {
      if (fulfillmentType === 'delivery') this.syncDeliverySlots();
      else this.syncPickupSites();
      this.loadQuote();
    });
  },
  selectDeliverySlot(event) {
    const deliverySlot = this.data.deliverySlots.find((item) => item.id === event.currentTarget.dataset.id);
    if (!deliverySlot || deliverySlot.id === (this.data.deliverySlot && this.data.deliverySlot.id)) return;
    const quotePatch = this.invalidateQuote();
    this.setData({ deliverySlot, ...quotePatch }, () => this.loadQuote());
  },
  selectPickupSite(event) {
    const pickupSite = this.data.pickupSites.find((item) => item.id === event.currentTarget.dataset.id);
    if (!pickupSite || pickupSite.id === (this.data.pickupSite && this.data.pickupSite.id)) return;
    const quotePatch = this.invalidateQuote();
    this.setData({ pickupSite, ...quotePatch }, () => this.loadQuote());
  },
  async retryLoad() {
    this.setData({ loadError: false, loadErrorText: '', quoteState: 'loading', quoteErrorText: '' });
    await Promise.all([this.loadCapabilities(), this.loadAddress(), this.loadDelivery(), this.loadCart()]);
    await this.syncWarehouseForAddress();
    await this.loadQuote();
  },
  retryQuote() { return this.loadQuote(); },
  returnToInquiry() {
    wx.navigateBack({ fail: () => wx.redirectTo({ url: '/package-business/pages/inquiries/index' }) });
  },
  applySelectedCoupon(data) {
    const quotePatch = this.invalidateQuote();
    this.setData({
      couponId: data && data.couponId || '',
      coupon: data && data.coupon || null,
      ...quotePatch
    }, () => this.loadQuote());
  },
  chooseCoupon() {
    wx.navigateTo({
      url: '/package-marketing/pages/coupons/index?select=1',
      events: { couponSelected: data => this.applySelectedCoupon(data) }
    });
  },
  orderSubmission() {
    if (!this._orderSubmission) {
      this._orderSubmission = createOrderSubmission({
        createKey: () => `mini-order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createOrder: payload => this.data.groupMode ? groupsApi.join({ ...payload, groupId: this.data.groupId }) : checkoutApi.createOrder(payload),
        resolveOrder: payload => ordersApi.resolveCreate(payload)
      });
    }
    return this._orderSubmission;
  },
  async finishCreatedOrder(order, cartItems, fallbackPaymentMethod) {
    const removed = this.data.bundleId ? [] : await Promise.all(cartItems.map(item => cartApi.removeItem(item.id)));
    if (removed.some(item => !item || !item.ok)) wx.showToast({ title: '订单已创建，购物车同步失败', icon: 'none' });
    const paymentMethod = order.paymentMethod || fallbackPaymentMethod;
    if (paymentMethod === 'demo') return wx.redirectTo({ url: `/package-trade/pages/demo-payment/index?id=${encodeURIComponent(order._id)}` });
    return wx.redirectTo({ url: '/package-trade/pages/orders/index?filter=' + encodeURIComponent('全部订单') });
  },
  async queryOrderResult() {
    if (this.data.submitting) return;
    this.setData({ submitting: true, orderSubmitState: 'resolving', orderSubmitText: '正在核对订单结果，请勿重复提交' });
    try {
      const outcome = await this.orderSubmission().resolve();
      if (outcome.kind === 'created') return this.finishCreatedOrder(outcome.order, this.data.cartItems, outcome.order.paymentMethod);
      if (outcome.kind === 'not_found') return this.setData({ orderSubmitState: 'not_found', orderSubmitText: '未查询到已创建订单，可以安全地重新提交' });
      this.setData({ orderSubmitState: 'unknown', orderSubmitText: '订单结果仍未确认，请继续查询，不要重复提交' });
    } finally {
      this.setData({ submitting: false });
    }
  },
  async submitOrder() {
    if (this._submittingOrder || this.data.submitting) return wx.showToast({ title: '正在提交订单，请稍候', icon: 'none' });
    if (this.data.quoteState !== 'ready') {
      const hint = this.data.quoteState === 'error' ? '请先重新计算订单金额' : '正在计算订单金额，请稍候';
      return wx.showToast({ title: hint, icon: 'none' });
    }
    const { address, warehouse, cartItems, deliverySlot, deliverySlotsContractAvailable, fulfillmentType, pickupSite } = this.data;
    const orderInput = { fulfillmentType, pickupSiteId: pickupSite && pickupSite.id, addressId: address.id, deliverySlotsContractAvailable, deliverySlotId: deliverySlot && deliverySlot.id, warehouseId: warehouse && warehouse.id, cartItems, bundleId: this.data.bundleId, bundleQuantity: this.data.bundleQuantity, couponId: this.data.couponId, acceptedQuoteToken: this.data.acceptedQuoteToken };
    const validation = orderIntentValidation(orderInput);
    if (!validation.ok) return wx.showToast({ title: validation.message, icon: 'none' });
    this._submittingOrder = true;
    this.setData({ submitting: true, orderSubmitState: 'submitting', orderSubmitText: '' });
    try {
      const me = await authApi.getMe();
      if (!me || !me.ok || !me.data || !me.data.user) return wx.showToast({ title: '登录状态已失效，请重新登录', icon: 'none' });
      const user = me.data.user;
      const paymentMethod = paymentMethodForUser({ user, groupMode: this.data.groupMode, capabilities: this.data.paymentCapabilities || {} });
      if (!paymentMethod) {
        this.setData({ orderSubmitState: 'error', orderSubmitText: '当前没有可用支付方式，请稍后再试' });
        return wx.showModal({ title: '支付暂不可用', content: '当前环境未启用真实微信支付，也未开放测试支付，不会创建订单或发生扣款。', showCancel: false });
      }
      const orderPayload = orderIntentFromCheckout({ input: orderInput, paymentMethod });
      const outcome = await this.orderSubmission().submit(orderPayload);
      if (outcome.kind === 'created') {
        this.setData({ orderSubmitState: 'created', orderSubmitText: '' });
        return this.finishCreatedOrder(outcome.order, cartItems, paymentMethod);
      }
      if (outcome.kind === 'unknown') return this.setData({ orderSubmitState: 'unknown', orderSubmitText: '订单提交结果暂时无法确认，请先查询结果，不要重复提交' });
      const error = outcome.error || {};
      this.setData({ orderSubmitState: 'error', orderSubmitText: error.message || '订单创建失败，请核对后重试' });
      if (error.code === 'PAYMENT_NOT_CONFIGURED') return wx.showModal({ title: '微信支付暂不可用', content: '当前无法完成拼团参团，也不会发生扣款。', showCancel: false });
      if (isInquiryQuoteInvalidCode(error.code)) {
        return this.setData(invalidQuoteState(cartItems, '询价报价已失效，请返回询价单确认最新报价', {
          acceptedQuoteToken: '',
          inquiryQuoteInvalid: true,
          orderSubmitState: 'error',
          orderSubmitText: '询价报价已失效，不能按普通价格继续下单'
        }));
      }
      if (requiresRequote(error.code)) {
        this.setData({ orderSubmitText: '订单条件已变化，正在重新计算最新金额' });
        await this.loadQuote();
        this.setData({ orderSubmitState: 'idle', orderSubmitText: '' });
        wx.showToast({ title: '订单金额已更新，请确认后重新提交', icon: 'none' });
      }
    } finally {
      this._submittingOrder = false;
      this.setData({ submitting: false });
    }
  },
  back() { wx.navigateBack(); }
});
