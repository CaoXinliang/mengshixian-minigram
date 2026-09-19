const { getLegalDocument } = require('../../../config/legal-documents');

Page({
  data: {
    activeType: 'privacy',
    document: getLegalDocument('privacy'),
    contactAvailable: true
  },

  onLoad(query = {}) {
    const contactAvailable = typeof wx !== 'undefined' && (typeof wx.canIUse !== 'function' || wx.canIUse('button.open-type.contact'));
    this.setData({ contactAvailable });
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
      fail: () => wx.showToast({ title: '微信隐私指引暂时无法打开，请稍后重试', icon: 'none' })
    });
  },

  contact() {
    if (!this.data.contactAvailable) wx.showToast({ title: '当前微信版本无法打开客服，请稍后重试', icon: 'none' });
  },

  back() {
    wx.navigateBack({ fail: () => wx.reLaunch({ url: '/pages/index/index?tab=mine' }) });
  }
});
