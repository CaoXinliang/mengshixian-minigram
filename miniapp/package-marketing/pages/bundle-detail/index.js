const { auth, bundles, address: addressApi, delivery: deliveryApi } = require('../../../services/index');

const money = cents => (Number(cents || 0) / 100).toFixed(2);
const RETRYABLE_QUOTE_ERRORS = new Set(['REQUEST_FAILED', 'REQUEST_TIMEOUT', 'INVALID_API_RESPONSE', 'INTERNAL_ERROR']);
const AUTH_QUOTE_ERRORS = new Set(['UNAUTHENTICATED', 'AUTH_ACCOUNT_DISABLED', 'AUTH_SESSION_EXPIRED']);
const DELIVERY_QUOTE_ERRORS = new Set(['WAREHOUSE_NOT_AVAILABLE', 'ADDRESS_NOT_AVAILABLE', 'OUT_OF_DELIVERY_RANGE', 'FREIGHT_RULE_NOT_AVAILABLE']);

const resultError = result => result && result.error || {};
const resultRows = result => result && result.ok && result.data && Array.isArray(result.data.rows) ? result.data.rows : [];
const itemId = item => String(item && (item._id || item.id) || '').trim();

Page({
  data: {
    id: '',
    status: 'loading',
    errorText: '',
    bundle: null,
    quantity: 1,
    quote: null,
    quoteContext: null,
    quoteAction: '',
    quoteActionText: '',
    quoting: false,
    canQuote: false,
    canRetryQuote: false
  },

  onLoad(query = {}) {
    this.setData({ id: query.id ? decodeURIComponent(query.id) : '' });
    return this.load();
  },

  onShow() {
    if (!this._refreshQuoteContextOnShow) return;
    this._refreshQuoteContextOnShow = false;
    return this.loadQuoteContext();
  },

  async load() {
    if (!this.data.id) return this.setData({ status: 'empty', errorText: '套餐编号无效' });
    this.setData({
      status: 'loading',
      errorText: '',
      quote: null,
      quoteContext: null,
      quoteAction: '',
      quoteActionText: '',
      quoting: false,
      canQuote: false,
      canRetryQuote: false
    });
    const result = await bundles.get({ id: this.data.id });
    const source = result && result.ok && result.data && (result.data.bundle || result.data);
    if (!source) {
      return this.setData({
        status: result && result.error && ['BUNDLE_NOT_FOUND', 'BUNDLE_NOT_AVAILABLE'].includes(result.error.code) ? 'empty' : 'error',
        errorText: result && result.error && result.error.message || '套餐详情加载失败'
      });
    }
    const quantity = Math.max(1, Number(source.minQuantity || 1));
    this.setData({
      status: 'ready',
      quantity,
      bundle: {
        ...source,
        id: source._id || this.data.id,
        name: source.name || source.title || '采购套餐',
        description: source.description || '',
        items: (result.data.items || source.items || []).map(item => ({
          ...item,
          name: item.productName || item.name || '套餐商品',
          spec: item.specName || item.spec || '',
          quantity: Number(item.quantity || 0)
        }))
      }
    });
    const me = await auth.getMe();
    if (!me || !me.ok || !me.data || !me.data.user) {
      return this.setData({
        quote: null,
        quoteContext: null,
        canQuote: false,
        canRetryQuote: false,
        errorText: '登录后可查看价格并购买'
      });
    }
    return this.loadQuoteContext();
  },

  retry() {
    return this.load();
  },

  changeQty(event) {
    const step = Number(event.currentTarget.dataset.step || 0);
    const min = Math.max(1, Number(this.data.bundle && this.data.bundle.minQuantity || 1));
    this.setData({ quantity: Math.max(min, this.data.quantity + step), quote: null }, () => this.loadQuote());
  },

  async loadQuoteContext() {
    const requestToken = (this._contextRequestSeq || 0) + 1;
    this._contextRequestSeq = requestToken;
    this.setData({
      quoting: true,
      quote: null,
      quoteContext: null,
      quoteAction: '',
      quoteActionText: '',
      canQuote: false,
      canRetryQuote: false,
      errorText: ''
    });
    let addressResult;
    let deliveryResult;
    try {
      [addressResult, deliveryResult] = await Promise.all([addressApi.list(), deliveryApi.options()]);
    } catch (_) {
      addressResult = { ok: false, error: { code: 'REQUEST_FAILED', message: '配送信息加载失败，请重试' } };
    }
    if (requestToken !== this._contextRequestSeq) return;
    const failure = [addressResult, deliveryResult].find(result => !result || !result.ok);
    if (failure) {
      const error = resultError(failure);
      const errorCode = error.code || 'INVALID_API_RESPONSE';
      const authRequired = AUTH_QUOTE_ERRORS.has(errorCode);
      return this.setData({
        quoting: false,
        canQuote: false,
        canRetryQuote: !authRequired && RETRYABLE_QUOTE_ERRORS.has(errorCode),
        errorText: authRequired ? '登录后可查看价格并购买' : error.message || '配送信息加载失败，请稍后重试'
      });
    }

    const addressRows = resultRows(addressResult);
    const address = addressRows.find(item => item && item.isDefault) || addressRows[0];
    const addressId = itemId(address);
    const regionCode = String(address && address.regionCode || '').trim();
    if (!addressId || !regionCode) {
      return this.setData({
        quoting: false,
        canQuote: false,
        canRetryQuote: false,
        quoteAction: 'address',
        quoteActionText: '添加收货地址',
        errorText: '请先添加完整收货地址，再查看含配送费的套餐价格'
      });
    }

    const deliveryData = deliveryResult.data || {};
    const warehouses = Array.isArray(deliveryData.warehouses) ? deliveryData.warehouses : [];
    const areas = Array.isArray(deliveryData.deliveryAreas) ? deliveryData.deliveryAreas : (Array.isArray(deliveryData.areas) ? deliveryData.areas : []);
    const availableWarehouseIds = new Set();
    areas.forEach(area => {
      if (!(area && Array.isArray(area.regionCodes) && area.regionCodes.includes(regionCode))) return;
      const scopedIds = Array.isArray(area.warehouseIds) ? area.warehouseIds.map(String) : [];
      if (scopedIds.length) scopedIds.forEach(id => availableWarehouseIds.add(id));
      else warehouses.forEach(item => availableWarehouseIds.add(itemId(item)));
    });
    const warehouse = warehouses.find(item => availableWarehouseIds.has(itemId(item)));
    const warehouseId = itemId(warehouse);
    if (!warehouseId) {
      return this.setData({
        quoting: false,
        canQuote: false,
        canRetryQuote: false,
        quoteAction: 'checkout',
        quoteActionText: '进入结算',
        errorText: '当前收货区域暂无可配送仓库，请进入结算调整地址或查看配送方式'
      });
    }

    const quoteContext = { warehouseId, regionCode, fulfillmentType: 'delivery' };
    this.setData({
      quoting: false,
      quoteContext,
      canQuote: true,
      canRetryQuote: false,
      quoteAction: '',
      quoteActionText: '',
      errorText: ''
    });
    return this.loadQuote();
  },

  async loadQuote() {
    if (!this.data.canQuote || !this.data.quoteContext) {
      return this.setData({ quote: null, quoting: false, canRetryQuote: false });
    }
    const requestToken = (this._quoteRequestSeq || 0) + 1;
    this._quoteRequestSeq = requestToken;
    const context = this.data.quoteContext;
    this.setData({ quoting: true, canRetryQuote: false, quoteAction: '', quoteActionText: '' });
    let result;
    try {
      result = await bundles.quote({
        bundleId: this.data.id,
        quantity: this.data.quantity,
        warehouseId: context.warehouseId,
        regionCode: context.regionCode,
        fulfillmentType: context.fulfillmentType
      });
    } catch (_) {
      result = { ok: false, error: { code: 'REQUEST_FAILED', message: '套餐价格加载失败，请重试' } };
    }
    if (requestToken !== this._quoteRequestSeq) return;
    const quote = result && result.ok && result.data && (result.data.quote || result.data);
    const error = resultError(result);
    const errorCode = error.code || 'INVALID_API_RESPONSE';
    const authRequired = !quote && AUTH_QUOTE_ERRORS.has(errorCode);
    const deliveryBlocked = !quote && DELIVERY_QUOTE_ERRORS.has(errorCode);
    this.setData({
      quoting: false,
      quote: quote ? {
        total: money(quote.payableAmountCent === undefined ? quote.totalAmountCent : quote.payableAmountCent),
        goods: money(quote.goodsAmountCent),
        snapshot: quote.bundleSnapshot || null
      } : null,
      quoteContext: authRequired || deliveryBlocked ? null : this.data.quoteContext,
      canQuote: !authRequired && !deliveryBlocked,
      canRetryQuote: !quote && RETRYABLE_QUOTE_ERRORS.has(errorCode),
      quoteAction: deliveryBlocked ? 'checkout' : '',
      quoteActionText: deliveryBlocked ? '进入结算' : '',
      errorText: quote ? '' : authRequired ? '登录后可查看价格并购买' : error.message || '套餐价格加载失败，请重试'
    });
  },

  retryQuote() {
    return this.data.quoteContext ? this.loadQuote() : this.loadQuoteContext();
  },

  openQuoteAction() {
    if (this.data.quoteAction === 'address') {
      this._refreshQuoteContextOnShow = true;
      return wx.navigateTo({ url: '/package-trade/pages/addresses/index?select=1' });
    }
    if (this.data.quoteAction === 'checkout') {
      return wx.navigateTo({ url: `/package-trade/pages/checkout/index?bundleId=${encodeURIComponent(this.data.id)}&bundleQuantity=${this.data.quantity}` });
    }
  },

  async buy() {
    const me = await auth.getMe();
    if (!me || !me.ok || !me.data || !me.data.user) return wx.showToast({ title: '请先登录后购买套餐', icon: 'none' });
    if (!this.data.quote) return wx.showToast({ title: '请先刷新套餐价格', icon: 'none' });
    wx.navigateTo({ url: `/package-trade/pages/checkout/index?bundleId=${encodeURIComponent(this.data.id)}&bundleQuantity=${this.data.quantity}` });
  },

  back() {
    wx.navigateBack();
  }
});
