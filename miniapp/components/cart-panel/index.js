Component({
  options: { styleIsolation: 'isolated' },
  properties: {
    cartStatus: { type: String, value: 'idle' },
    cartErrorText: { type: String, value: '' },
    cartItems: { type: Array, value: [] },
    cartCount: { type: Number, value: 0 },
    warehouseName: { type: String, value: '配送仓' },
    warehouseEta: { type: String, value: '' },
    hasAddress: { type: Boolean, value: false },
    addressName: { type: String, value: '' },
    addressMasked: { type: String, value: '' },
    addressDetail: { type: String, value: '' },
    allCartSelected: { type: Boolean, value: false },
    selectableCartCount: { type: Number, value: 0 },
    selectedCartCount: { type: Number, value: 0 },
    selectedCartTotal: { type: String, value: '¥0.00' },
    selectedCartPriceReady: { type: Boolean, value: false },
    priceFallback: { type: String, value: '登录后查看价格' }
  },
  methods: {
    clear() { this.triggerEvent('clear'); },
    retry() { this.triggerEvent('retry'); },
    openAddress() { this.triggerEvent('address'); },
    toggleAll(event) { this.triggerEvent('toggleall', { selected: Boolean(event.detail && event.detail.value && event.detail.value.length) }); },
    toggleRow(event) {
      const dataset = event.currentTarget.dataset || {};
      const value = event.detail && event.detail.value || [];
      this.triggerEvent('togglerow', {
        id: dataset.id || '',
        skuId: dataset.skuId || '',
        spec: dataset.spec || '',
        selected: Boolean(value.length)
      });
    },
    quantityChange(event) {
      const dataset = event.currentTarget.dataset || {};
      this.triggerEvent('quantitychange', {
        id: dataset.id || '',
        spec: dataset.spec || '',
        ...event.detail
      });
    },
    remove(event) {
      const dataset = event.currentTarget.dataset || {};
      this.triggerEvent('quantitychange', {
        id: dataset.id || '',
        spec: dataset.spec || '',
        valid: true,
        quantity: 0,
        source: 'remove'
      });
    },
    checkout() { this.triggerEvent('checkout'); },
    browse() { this.triggerEvent('browse'); }
  }
});
