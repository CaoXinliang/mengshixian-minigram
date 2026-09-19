Component({
  properties: {
    mode: { type: String, value: 'select' },
    productId: { type: String, value: '' },
    specLabel: { type: String, value: '' },
    actionLabel: { type: String, value: '选规格' },
    quantity: { type: Number, value: 0 },
    minimum: { type: Number, value: 0 },
    maximum: { type: Number, value: 999 },
    multiple: { type: Number, value: 1 },
    disabled: { type: Boolean, value: false }
  },

  methods: {
    stopTapPropagation() {},
    chooseSpec() {
      if (!this.data.productId || this.data.disabled) return;
      this.triggerEvent('choose', { id: this.data.productId });
    },
    forwardQuantity(event) {
      this.triggerEvent('change', {
        ...event.detail,
        id: this.data.productId,
        spec: this.data.specLabel
      });
    }
  }
});
