Component({
  properties: {
    quantity: { type: Number, value: 0 },
    compact: { type: Boolean, value: false }
  },
  methods: {
    add() { this.triggerEvent('change', { delta: 1 }); },
    subtract() { this.triggerEvent('change', { delta: -1 }); }
  }
});
