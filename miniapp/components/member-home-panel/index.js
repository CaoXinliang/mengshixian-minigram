Component({
  properties: {
    model: { type: Object, value: null },
    pendingReceiptCount: { type: Number, value: 0 }
  },
  methods: {
    login() { this.triggerEvent('login'); },
    navigate(event) {
      const dataset = event.currentTarget.dataset || {};
      this.triggerEvent('navigate', { type: dataset.type || '', filter: dataset.filter || '' });
    },
    shortcut() { this.triggerEvent('shortcut'); },
    businessApplication() { this.triggerEvent('businessapplication'); },
    businessAction(event) {
      const dataset = event.currentTarget.dataset || {};
      if (['application-record', 'business-profile'].includes(dataset.type)) return this.triggerEvent('businessapplication');
      this.triggerEvent('navigate', { type: dataset.type || '', filter: '' });
    },
    businessPermission(event) {
      const dataset = event.currentTarget.dataset || {};
      if (!dataset.enabled) return;
      if (['policy', 'service'].includes(dataset.type)) return this.triggerEvent('navigate', { type: dataset.type, filter: '' });
      this.triggerEvent('procurement', { type: dataset.type || '' });
    }
  }
});
