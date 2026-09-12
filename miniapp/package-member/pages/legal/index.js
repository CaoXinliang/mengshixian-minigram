const { getLegalDocument } = require('../../../config/legal-documents');

Page({
  data: {
    activeType: 'privacy',
    document: getLegalDocument('privacy')
  },

  onLoad(query = {}) {
    this.showDocument(query.type);
  },

  showDocument(type) {
    const activeType = type === 'terms' ? 'terms' : 'privacy';
    this.setData({ activeType, document: getLegalDocument(activeType) });
  },

  switchDocument(event) {
    this.showDocument(event.currentTarget.dataset.type);
    wx.pageScrollTo({ scrollTop: 0, duration: 180 });
  },

  openWechatPrivacyContract() {
    if (typeof wx.openPrivacyContract !== 'function') {
      return wx.showToast({ title: '当前微信版本不支持该功能', icon: 'none' });
    }
    wx.openPrivacyContract({
      fail: () => wx.showToast({ title: '微信平台指引尚未配置，请以本页为准', icon: 'none' })
    });
  },

  contact() {},

  back() {
    wx.navigateBack({ fail: () => wx.reLaunch({ url: '/pages/index/index?tab=mine' }) });
  }
});
