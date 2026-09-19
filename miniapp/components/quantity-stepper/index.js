Component({
  properties: {
    quantity: {
      type: Number,
      value: 0,
      observer(value) {
        if (!this._editingQuantity) this.setData({ draftValue: String(value) });
      }
    },
    compact: { type: Boolean, value: false },
    disabled: {
      type: Boolean,
      value: false,
      observer(value) {
        if (!value) return;
        this._editingQuantity = false;
        this._quantityCommitDone = true;
        this.setData({ draftValue: String(this.data.quantity), editing: false, invalid: false });
      }
    },
    min: { type: Number, value: 0 },
    max: { type: Number, value: 999 },
    step: { type: Number, value: 1 },
    allowZero: { type: Boolean, value: false }
  },
  data: {
    draftValue: '0',
    editing: false,
    invalid: false
  },
  lifetimes: {
    attached() {
      this._editingQuantity = false;
      this._quantityCommitDone = false;
      this.setData({ draftValue: String(this.data.quantity), editing: false, invalid: false });
    }
  },
  methods: {
    stopTapPropagation() {},
    add() {
      if (!this.data.disabled && this.data.quantity < this.data.max) {
        this.triggerEvent('change', { delta: 1, source: 'step' });
      }
    },
    subtract() {
      if (!this.data.disabled && (this.data.quantity > this.data.min || (this.data.allowZero && this.data.quantity === this.data.min))) {
        this.triggerEvent('change', { delta: -1, source: 'step' });
      }
    },
    editQuantity(event) {
      if (this.data.disabled) return;
      this._editingQuantity = true;
      this._quantityCommitDone = false;
      this.setData({ draftValue: String(event.detail.value), editing: true, invalid: false });
    },
    confirmQuantity() {
      return this.commitQuantity();
    },
    blurQuantity() {
      return this.commitQuantity();
    },
    commitQuantity() {
      if (this.data.disabled) {
        this.resetDraft();
        return;
      }
      if (this._quantityCommitDone) return;
      this._quantityCommitDone = true;
      const raw = String(this.data.draftValue === undefined ? '' : this.data.draftValue).trim();
      const min = Number.isSafeInteger(Number(this.data.min)) ? Number(this.data.min) : 0;
      const max = Number.isSafeInteger(Number(this.data.max)) ? Number(this.data.max) : 999;
      const step = Number.isSafeInteger(Number(this.data.step)) && Number(this.data.step) > 0 ? Number(this.data.step) : 1;
      let reason = '';
      let message = '';
      let quantity = Number(raw);
      if (!raw) {
        reason = 'EMPTY'; message = '请输入数量';
      } else if (!/^\d+$/.test(raw) || !Number.isSafeInteger(quantity)) {
        reason = 'NOT_INTEGER'; message = '数量必须是整数';
      } else if (quantity < min && !(this.data.allowZero && quantity === 0)) {
        reason = 'BELOW_MIN'; message = `数量不能少于 ${min}`;
      } else if (quantity > max) {
        reason = 'ABOVE_MAX'; message = `数量不能超过 ${max}`;
      } else if (quantity % step !== 0) {
        reason = 'STEP_MISMATCH'; message = `数量须为 ${step} 的倍数`;
      }
      if (reason) {
        this.triggerEvent('change', { valid: false, value: raw, reason, message, source: 'input' });
        this.setData({ invalid: true, editing: true });
        return;
      }
      if (quantity !== Number(this.data.quantity)) {
        this.triggerEvent('change', { valid: true, quantity, source: 'input' });
      }
      this.resetDraft();
    },
    resetDraft() {
      this._editingQuantity = false;
      this.setData({ draftValue: String(this.data.quantity), editing: false, invalid: false });
    }
  }
});
