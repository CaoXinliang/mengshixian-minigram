Component({
  properties: {
    quantity: { type: Number, value: 0 },
    compact: { type: Boolean, value: false },
    disabled: { type: Boolean, value: false },
    min: { type: Number, value: 0 },
    max: { type: Number, value: 999 }
  },
  methods: {
    add() { if (!this.data.disabled && this.data.quantity < this.data.max) this.triggerEvent('change', { delta: 1 }); },
    subtract() { if (!this.data.disabled && this.data.quantity > this.data.min) this.triggerEvent('change', { delta: -1 }); }
  }
});
