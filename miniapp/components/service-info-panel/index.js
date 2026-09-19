Component({
  properties: {
    model: { type: Object, value: null },
    contactAvailable: { type: Boolean, value: true }
  },
  methods: {
    navigate(event) { this.triggerEvent('navigate', { type: event.currentTarget.dataset.type }); },
    contactUnavailable() { this.triggerEvent('contactunavailable'); }
  }
});
