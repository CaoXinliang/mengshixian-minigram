const { address: addressApi } = require('../../../services/index');

const EMPTY_FORM = { id: '', name: '', phone: '', phoneMasked: '', provinceCode: '', cityCode: '', districtCode: '', regionCode: '', regionLabel: '', detail: '', tag: '', isDefault: false };
const text = value => String(value || '').trim();
const normalizeAddress = item => ({
  id: item._id,
  name: text(item.name) || '收货人',
  phoneMasked: text(item.phoneMasked),
  provinceCode: text(item.provinceCode),
  cityCode: text(item.cityCode),
  districtCode: text(item.districtCode),
  regionCode: text(item.regionCode),
  regionLabel: [item.provinceCode, item.cityCode, item.districtCode].map(text).filter(Boolean).join(' ') || text(item.regionCode),
  detail: text(item.detail),
  tag: text(item.tag),
  isDefault: item.isDefault === true
});

Page({
  data: {
    status: 'loading', errorText: '', rows: [], selectMode: false,
    formVisible: false, form: { ...EMPTY_FORM }, saving: false, actionBusyId: ''
  },
  onLoad(options = {}) {
    this.setData({ selectMode: String(options.select || '') === '1' });
    return this.loadAddresses();
  },
  async loadAddresses() {
    this.setData({ status: 'loading', errorText: '' });
    const result = await addressApi.list();
    if (!result || !result.ok || !result.data || !Array.isArray(result.data.rows)) {
      return this.setData({ status: 'error', errorText: result && result.error && result.error.message || '收货地址暂时无法加载，请稍后重试' });
    }
    this.setData({ status: 'ready', rows: result.data.rows.map(normalizeAddress) });
  },
  retry() { return this.loadAddresses(); },
  openNew() { this.setData({ formVisible: true, form: { ...EMPTY_FORM, isDefault: !this.data.rows.length } }); },
  openEdit(event) {
    const current = this.data.rows.find((item) => item.id === event.currentTarget.dataset.id);
    if (!current) return;
    this.setData({ formVisible: true, form: { ...EMPTY_FORM, ...current, phone: '' } });
  },
  closeForm() {
    if (this.data.saving) return;
    this.setData({ formVisible: false, form: { ...EMPTY_FORM } });
  },
  updateField(event) {
    const field = event.currentTarget.dataset.field;
    if (!field) return;
    this.setData({ form: { ...this.data.form, [field]: event.detail.value } });
  },
  toggleDefault(event) {
    this.setData({ form: { ...this.data.form, isDefault: Boolean(event.detail.value && event.detail.value.length) } });
  },
  chooseRegion(event) {
    const names = Array.isArray(event.detail && event.detail.value) ? event.detail.value.map(text) : [];
    const codes = Array.isArray(event.detail && event.detail.code) ? event.detail.code.map(text) : [];
    const provinceCode = codes[0] || names[0] || '';
    const cityCode = codes[1] || names[1] || '';
    const districtCode = codes[2] || names[2] || '';
    const regionCode = districtCode || cityCode || [names[1], names[2]].filter(Boolean).join('/');
    this.setData({ form: { ...this.data.form, provinceCode, cityCode, districtCode, regionCode, regionLabel: names.join(' ') } });
  },
  importWechatAddress() {
    if (typeof wx.chooseAddress !== 'function') return wx.showToast({ title: '当前微信版本不支持地址簿', icon: 'none' });
    wx.chooseAddress({
      success: (picked) => {
        const regionLabel = [picked.provinceName, picked.cityName, picked.countyName].map(text).filter(Boolean).join(' ');
        const regionCode = [picked.cityName, picked.countyName].map(text).filter(Boolean).join('/');
        this.setData({ formVisible: true, form: { ...this.data.form, name: text(picked.userName), phone: text(picked.telNumber).replace(/\s/g, ''), provinceCode: text(picked.provinceName), cityCode: text(picked.cityName), districtCode: text(picked.countyName), regionCode, regionLabel, detail: text(picked.detailInfo), isDefault: this.data.form.id ? this.data.form.isDefault : !this.data.rows.length } });
      },
      fail: (error) => {
        if (/cancel/i.test(String(error && error.errMsg || ''))) return;
        wx.showToast({ title: '无法打开微信地址簿，请稍后重试', icon: 'none' });
      }
    });
  },
  async saveAddress() {
    if (this.data.saving) return;
    const form = this.data.form;
    const phone = text(form.phone).replace(/\s/g, '');
    if (!text(form.name)) return wx.showToast({ title: '请输入收货人', icon: 'none' });
    if (!/^1[3-9]\d{9}$/.test(phone)) return wx.showToast({ title: form.id ? '编辑地址需重新输入完整手机号' : '请输入有效的 11 位手机号', icon: 'none' });
    if (!text(form.regionCode)) return wx.showToast({ title: '请选择省市区', icon: 'none' });
    if (!text(form.detail)) return wx.showToast({ title: '请输入详细地址', icon: 'none' });
    this.setData({ saving: true });
    try {
      const result = await addressApi.save({ id: form.id || undefined, name: text(form.name), phone, provinceCode: text(form.provinceCode), cityCode: text(form.cityCode), districtCode: text(form.districtCode), regionCode: text(form.regionCode), detail: text(form.detail), tag: text(form.tag), isDefault: form.isDefault === true });
      if (!result || !result.ok) return wx.showToast({ title: result && result.error && result.error.message || '地址保存失败，请重试', icon: 'none' });
      this.setData({ formVisible: false, form: { ...EMPTY_FORM } });
      await this.loadAddresses();
      wx.showToast({ title: '收货地址已保存', icon: 'success' });
    } finally {
      this.setData({ saving: false });
    }
  },
  setDefault(event) {
    const id = event.currentTarget.dataset.id;
    if (!id || this.data.actionBusyId) return;
    this.setData({ actionBusyId: id });
    return addressApi.setDefault(id).then(async (result) => {
      if (!result || !result.ok) return wx.showToast({ title: result && result.error && result.error.message || '默认地址设置失败', icon: 'none' });
      await this.loadAddresses();
      wx.showToast({ title: '已设为默认地址', icon: 'success' });
    }).finally(() => this.setData({ actionBusyId: '' }));
  },
  deleteAddress(event) {
    const id = event.currentTarget.dataset.id;
    if (!id || this.data.actionBusyId) return;
    wx.showModal({ title: '删除收货地址', content: '删除后无法恢复，确定继续吗？', confirmText: '删除', confirmColor: '#e65353', success: (modal) => {
      if (!modal.confirm) return;
      this.removeAddress(id);
    } });
  },
  async removeAddress(id) {
    this.setData({ actionBusyId: id });
    try {
      const result = await addressApi.remove(id);
      if (!result || !result.ok) return wx.showToast({ title: result && result.error && result.error.message || '地址删除失败', icon: 'none' });
      await this.loadAddresses();
      wx.showToast({ title: '地址已删除', icon: 'success' });
    } finally {
      this.setData({ actionBusyId: '' });
    }
  },
  selectAddress(event) {
    if (!this.data.selectMode) return;
    const current = this.data.rows.find((item) => item.id === event.currentTarget.dataset.id);
    if (!current || this.data.actionBusyId) return;
    if (current.isDefault) return wx.navigateBack();
    this.setData({ actionBusyId: current.id });
    addressApi.setDefault(current.id).then((result) => {
      if (!result || !result.ok) return wx.showToast({ title: result && result.error && result.error.message || '地址选择失败', icon: 'none' });
      wx.navigateBack();
    }).finally(() => this.setData({ actionBusyId: '' }));
  },
  back() {
    if (this.data.formVisible) return this.closeForm();
    wx.navigateBack();
  }
});
