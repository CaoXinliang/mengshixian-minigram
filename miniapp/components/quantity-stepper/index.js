Component({
  properties: {
    quantity: { type: Number, value: 0 },
    compact: { type: Boolean, value: false },
    disabled: { type: Boolean, value: false }
  },
  methods: {
    add() { if (!this.data.disabled) this.triggerEvent('change', { delta: 1 }); },
    subtract() { if (!this.data.disabled) this.triggerEvent('change', { delta: -1 }); }
  }
});
