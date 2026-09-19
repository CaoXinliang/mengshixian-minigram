Component({
  properties: {
    active: {
      type: String,
      value: 'home'
    },
    shortcutLabel: {
      type: String,
      value: '常用'
    },
    shortcutIcon: {
      type: String,
      value: '/assets/icons/list.svg'
    },
    cartCount: {
      type: Number,
      value: 0
    },
    cartPulse: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    handleChange(event) {
      const tab = event.currentTarget.dataset.tab;
      if (!tab || tab === this.data.active) return;
      this.triggerEvent('change', { tab });
    }
  }
});
