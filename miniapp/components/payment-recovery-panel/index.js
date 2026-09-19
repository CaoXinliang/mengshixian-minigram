Component({
  properties: {
    kind: { type: String, value: 'unknown' },
    text: { type: String, value: '' },
    canRetry: { type: Boolean, value: false },
    canQuery: { type: Boolean, value: false },
    showViewOrder: { type: Boolean, value: false },
    busy: { type: Boolean, value: false }
  },

  methods: {
    handleQuery() {
      if (this.data.busy) return;
      this.triggerEvent('query');
    },
    handleRetry() {
      if (this.data.busy) return;
      this.triggerEvent('retry');
    },
    handleViewOrder() {
      if (this.data.busy) return;
      this.triggerEvent('vieworder');
    }
  }
});
