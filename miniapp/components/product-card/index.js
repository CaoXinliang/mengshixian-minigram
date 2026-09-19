Component({
  properties: {
    productId: { type: String, value: '' },
    name: { type: String, value: '' },
    specLabel: { type: String, value: '' },
    imageSrc: { type: String, value: '/assets/products/placeholder.svg' },
    tag: { type: String, value: '' },
    priceText: { type: String, value: '' },
    priceUnitLabel: { type: String, value: '' },
    priceLabel: { type: String, value: '登录后查看价格' },
    priceState: { type: String, value: 'locked' },
    statusText: { type: String, value: '' },
    actionLabel: { type: String, value: '选规格' },
    actionDisabled: { type: Boolean, value: false },
    actionMode: { type: String, value: 'select' },
    quantity: { type: Number, value: 0 },
    minimum: { type: Number, value: 0 },
    maximum: { type: Number, value: 999 },
    multiple: { type: Number, value: 1 },
    widePrice: { type: Boolean, value: false }
  },

  methods: {
    openProduct() {
      if (!this.data.productId) return;
      this.triggerEvent('open', { id: this.data.productId });
    },
    chooseSpec() {
      if (!this.data.productId || this.data.actionDisabled) return;
      this.triggerEvent('choose', { id: this.data.productId });
    },
    forwardQuantity(event) {
      if (!this.data.productId || this.data.actionDisabled) return;
      this.triggerEvent('change', { ...(event.detail || {}), id: this.data.productId, spec: this.data.specLabel });
    },
    mediaError() {
      if (!this.data.productId) return;
      this.triggerEvent('mediaerror', { id: this.data.productId });
    }
  }
});
