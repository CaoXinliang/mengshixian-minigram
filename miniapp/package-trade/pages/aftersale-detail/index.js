const { aftersales } = require('../../../services/index');
const { toAftersaleDetail } = require('../../../modules/aftersale-presentation');

const safeDecode = value => { try { return decodeURIComponent(value || ''); } catch (error) { return ''; } };

Page({
  data: { orderId: '', refundId: '', status: 'loading', errorText: '', detail: null },
  onLoad(query = {}) { this.setData({ orderId: safeDecode(query.orderId), refundId: safeDecode(query.id) }); return this.loadDetail(); },
  async loadDetail() {
    if (!this.data.orderId && !this.data.refundId) return this.setData({ status: 'empty', errorText: '售后申请编号无效' });
    const token = (this._loadSeq || 0) + 1; this._loadSeq = token;
    this.setData({ status: 'loading', errorText: '' });
    let result;
    if (this.data.refundId) result = await aftersales.get({ id: this.data.refundId });
    else {
      const listed = await aftersales.list({ page: 1, pageSize: 20 });
      const rows = listed && listed.ok && listed.data && listed.data.rows || [];
      const match = rows.find(item => item.orderId === this.data.orderId);
      result = match ? { ok: true, data: { refund: match } } : listed && listed.ok ? { ok: false, error: { code: 'REFUND_NOT_FOUND', message: '该订单暂无售后申请' } } : listed;
    }
    if (token !== this._loadSeq) return;
    const refund = result && result.ok && result.data && (result.data.refund || result.data);
    if (!refund || !refund._id) {
      const code = result && result.error && result.error.code;
      return this.setData({ status: ['REFUND_NOT_FOUND', 'ORDER_NOT_FOUND'].includes(code) ? 'empty' : 'error', errorText: result && result.error && result.error.message || '售后进度暂时无法加载，请稍后重试' });
    }
    const media = result && result.data && Array.isArray(result.data.media) ? result.data.media : [];
    this.setData({ status: 'ready', detail: toAftersaleDetail(refund, media), errorText: '' });
  },
  retry() { return this.loadDetail(); },
  back() { wx.navigateBack(); }
});
