Component({
  properties: {
    title: {
      type: String,
      value: ''
    },
    subtitle: {
      type: String,
      value: ''
    },
    actionLabel: {
      type: String,
      value: ''
    },
    compactTitle: {
      type: Boolean,
      value: false
    }
  },

  data: {
    statusBarHeight: 20,
    navigationHeight: 44,
    capsuleInsetRight: 96
  },

  lifetimes: {
    attached() {
      this.updateLayout();
    }
  },

  pageLifetimes: {
    resize() {
      this.updateLayout();
    }
  },

  methods: {
    updateLayout() {
      const windowInfo = typeof wx.getWindowInfo === 'function' ? wx.getWindowInfo() : {};
      const menuRect = typeof wx.getMenuButtonBoundingClientRect === 'function'
        ? wx.getMenuButtonBoundingClientRect()
        : null;
      const rawStatusBarHeight = Number(windowInfo.statusBarHeight);
      const rawWindowWidth = Number(windowInfo.windowWidth);
      const statusBarHeight = Number.isFinite(rawStatusBarHeight) && rawStatusBarHeight >= 0
        ? rawStatusBarHeight
        : 20;
      const windowWidth = Number.isFinite(rawWindowWidth) && rawWindowWidth > 0
        ? rawWindowWidth
        : 375;
      const hasUsableMenuRect = menuRect
        && Number(menuRect.width) > 0
        && Number(menuRect.height) > 0
        && Number(menuRect.left) >= 0
        && Number(menuRect.top) >= statusBarHeight;
      const navigationHeight = hasUsableMenuRect
        ? Math.max(44, Number(menuRect.height) + (Number(menuRect.top) - statusBarHeight) * 2)
        : 44;
      const capsuleInsetRight = hasUsableMenuRect
        ? Math.max(88, windowWidth - Number(menuRect.left) + 8)
        : 96;

      this.setData({
        statusBarHeight,
        navigationHeight,
        capsuleInsetRight
      });
    },

    handleBack() {
      this.triggerEvent('back');
    },

    handleAction() {
      if (!this.data.actionLabel) return;
      this.triggerEvent('action');
    }
  }
});
