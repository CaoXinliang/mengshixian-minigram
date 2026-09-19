Component({
  properties: {
    visible: { type: Boolean, value: false },
    safeTop: { type: String, value: '0px' }
  },
  data: {
    options: [
      { value: 'business', title: '商家采购', copy: '餐厅、食堂、门店等团体用菜', mark: '商' },
      { value: 'personal', title: '家庭个人', copy: '采购家庭日常用菜', mark: '家' }
    ]
  },
  methods: {
    select(event) {
      const value = event.currentTarget && event.currentTarget.dataset && event.currentTarget.dataset.value;
      if (value !== 'business' && value !== 'personal') return;
      this.triggerEvent('select', { value });
    },
    skip() { this.triggerEvent('skip'); },
    preventClose() {}
  }
});
