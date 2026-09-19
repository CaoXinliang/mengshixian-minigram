const { auth, favorites, content } = require('../../../services/index');
const { createFavoritesLifecycle } = require('../../../modules/favorites-lifecycle');
const { authorizeMemberPage, isCurrentMemberLoad } = require('../../member-auth');

Page({
  data: { status: 'loading', errorText: '', rows: [], busyId: '' },
  onLoad() {},
  onShow() { return this.load(); },
  onUnload() {
    this._favoritesUnloaded = true;
    this._memberAuthRevision = Number(this._memberAuthRevision || 0) + 1;
    if (this._favoritesLifecycle) this._favoritesLifecycle.dispose();
  },
  favoritesLifecycle() {
    if (!this._favoritesLifecycle) this._favoritesLifecycle = createFavoritesLifecycle({
      favorites,
      resolveMedia: content && typeof content.resolveMediaFiles === 'function' ? content.resolveMediaFiles : async () => ({}),
      onChange: state => { if (!this._favoritesUnloaded) this.setData(state); }
    });
    return this._favoritesLifecycle;
  },
  async load() {
    if (this._favoritesUnloaded) return;
    const lifecycle = this.favoritesLifecycle();
    lifecycle.reset();
    const access = await authorizeMemberPage(this, auth, {
      forbiddenText: '请先登录后查看收藏',
      clear: { rows: [], busyId: '' },
      reset: () => lifecycle.reset()
    });
    if (!access || this._favoritesUnloaded || !isCurrentMemberLoad(this, access)) return;
    return lifecycle.load({ userId: access.user._id || access.user.id });
  },
  retry() { return this.load(); },
  openProduct(event) {
    const item = this.data.rows.find(row => row.id === event.currentTarget.dataset.id);
    if (!item || !item.purchasable || !item.productId) return;
    wx.redirectTo({ url: `/pages/index/index?productId=${encodeURIComponent(item.productId)}` });
  },
  remove(event) {
    if (this._favoritesUnloaded) return;
    return this.favoritesLifecycle().remove(event.currentTarget.dataset.id);
  },
  back() { wx.navigateBack(); }
});
