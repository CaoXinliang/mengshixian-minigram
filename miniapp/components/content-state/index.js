Component({
  properties: {
    tone: { type: String, value: 'empty' },
    title: { type: String, value: '' },
    message: { type: String, value: '' },
    actionLabel: { type: String, value: '' },
    compact: { type: Boolean, value: false },
    layout: { type: String, value: 'card' }
  },

  methods: {
    handleAction() {
      if (!this.data.actionLabel) return;
      this.triggerEvent('action');
    }
  }
});
