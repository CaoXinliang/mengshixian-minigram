const { request } = require('./request');

module.exports = {
  list: (payload) => request('orders.list', payload),
  get: (id) => request('orders.get', { id }),
  cancel: (payload) => request('orders.cancel', payload),
  confirm: (payload) => request('orders.complete', payload),
  repurchasePreview: (payload) => request('orders.repurchase.preview', payload),
  repurchaseCommit: (payload) => request('orders.repurchase.commit', payload)
};
