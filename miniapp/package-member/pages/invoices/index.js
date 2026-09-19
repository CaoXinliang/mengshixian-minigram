const { auth, invoices, orders } = require('../../../services/index');
const { authorizeMemberPage, isCurrentMemberLoad } = require('../../member-auth');
const money = cents => (Number(cents || 0) / 100).toFixed(2);
const emptyForm = () => ({ id: '', type: 'personal', name: '', taxNo: '', address: '', bankName: '', bankAccount: '' });

Page({
  data: { status: 'loading', errorText: '', titles: [], records: [], orders: [], invoiceEmail: '', formVisible: false, form: { id: '', type: 'personal', name: '', taxNo: '', address: '', bankName: '', bankAccount: '' }, busy: '' },
  onLoad(query = {}) { this._initialOrderId = query.orderId ? decodeURIComponent(query.orderId) : ''; },
  onShow() { return this.load(); },
  async load() {
    const access = await authorizeMemberPage(this, auth, { forbiddenText: '请先登录后管理电子发票', clear: { titles: [], records: [], orders: [], invoiceEmail: '', formVisible: false, form: emptyForm(), busy: '' }, reset: () => { this._requestKeys = {}; } });
    if (!access) return;
    const [titlesResult, recordsResult, ordersResult] = await Promise.all([invoices.titles({ page: 1, pageSize: 100 }), invoices.list({ page: 1, pageSize: 100 }), orders.list({ page: 1, pageSize: 100 })]);
    if (!isCurrentMemberLoad(this, access)) return;
    const failed = [titlesResult, recordsResult, ordersResult].find(item => !item || !item.ok);
    if (failed) return this.setData({ status: 'error', errorText: failed && failed.error && failed.error.message || '发票数据加载失败，请重试' });
    const titles = titlesResult.data && titlesResult.data.rows || [];
    const records = recordsResult.data && recordsResult.data.rows || [];
    const orderRows = ordersResult.data && ordersResult.data.rows || [];
    const requested = new Set(records.map(item => item.orderId));
    const availableOrders = orderRows.filter(item => ['completed', 'delivered'].includes(item.status) && ['paid', 'credit_invoiced'].includes(item.paymentStatus) && !requested.has(item._id)).map(item => ({ id: item._id, orderNo: item.orderNo || item._id, amountText: money(item.totalAmountCent) }));
    if (this._initialOrderId) availableOrders.sort((a, b) => Number(b.id === this._initialOrderId) - Number(a.id === this._initialOrderId));
    this._initialOrderId = '';
    this.setData({ status: 'ready', titles, records: records.map(item => ({ ...item, amountText: money(item.amountCent || item.invoiceAmountCent), titleText: item.titleSnapshot && item.titleSnapshot.name || item.titleName || '电子发票', statusText: item.statusText || ({ requested: '申请已提交', pending_manual: '等待开票处理', issued: '已开票', rejected: '申请已驳回' }[item.status] || '处理中') })), orders: availableOrders });
  },
  retry() { return this.load(); },
  showForm(event) {
    const id = event.currentTarget.dataset.id || '';
    const source = this.data.titles.find(item => item._id === id);
    this.setData({ formVisible: true, form: source ? { id: source._id, type: source.type || 'personal', name: source.name || '', taxNo: source.taxNo || '', address: source.address || '', bankName: source.bankName || '', bankAccount: source.bankAccount || '' } : emptyForm() });
  },
  closeForm() { this.setData({ formVisible: false }); },
  setTitleType(event) { this.setData({ 'form.type': event.currentTarget.dataset.type }); },
  inputEmail(event) { this.setData({ invoiceEmail: String(event.detail.value || '').trim() }); },
  async saveTitle(event) {
    if (this.data.busy) return;
    const value = event.detail.value || {}; const type = this.data.form.type;
    if (!value.name || (type === 'company' && !value.taxNo)) return wx.showToast({ title: '请完整填写发票抬头', icon: 'none' });
    this.setData({ busy: 'title' });
    try {
      const result = await invoices.saveTitle({ ...(this.data.form.id ? { id: this.data.form.id } : {}), type, name: value.name.trim(), taxNo: value.taxNo && value.taxNo.trim() || '', address: value.address && value.address.trim() || '', bankName: value.bankName && value.bankName.trim() || '', bankAccount: value.bankAccount && value.bankAccount.trim() || '' });
      if (!result || !result.ok) return wx.showToast({ title: result && result.error && result.error.message || '保存失败', icon: 'none' });
      this.setData({ formVisible: false }); await this.load();
    } finally { this.setData({ busy: '' }); }
  },
  deleteTitle(event) { const id = event.currentTarget.dataset.id; wx.showModal({ title: '删除发票抬头', content: '删除后不可恢复，已开具的发票不受影响。', success: async result => { if (!result.confirm || this.data.busy) return; this.setData({ busy: id }); try { const response = await invoices.deleteTitle({ id }); if (!response || !response.ok) return wx.showToast({ title: response && response.error && response.error.message || '删除失败', icon: 'none' }); await this.load(); } finally { this.setData({ busy: '' }); } } }); },
  async requestInvoice(event) {
    const orderId = event.currentTarget.dataset.id; const title = this.data.titles[0];
    if (!title) return wx.showToast({ title: '请先添加发票抬头', icon: 'none' });
    if (!/^\S+@\S+\.\S+$/.test(this.data.invoiceEmail)) return wx.showToast({ title: '请填写有效接收邮箱', icon: 'none' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.data.invoiceEmail)) return wx.showToast({ title: '请填写有效的接收邮箱', icon: 'none' });
    if (this.data.busy) return; this.setData({ busy: orderId });
    try {
      if (!this._requestKeys) this._requestKeys = {};
      if (!this._requestKeys[orderId]) this._requestKeys[orderId] = `invoice-${orderId}-${Date.now()}`;
      const result = await invoices.request({ orderId, titleId: title._id, email: this.data.invoiceEmail, idempotencyKey: this._requestKeys[orderId] });
      if (!result || !result.ok) return wx.showToast({ title: result && result.error && result.error.message || '开票申请失败', icon: 'none' });
      delete this._requestKeys[orderId]; await this.load(); wx.showToast({ title: '开票申请已提交', icon: 'success' });
    } finally { this.setData({ busy: '' }); }
  },
  back() { wx.navigateBack(); }
});
