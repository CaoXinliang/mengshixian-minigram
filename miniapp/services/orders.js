const { request } = require('./request');

module.exports = {
  list: (payload) => request('orders.list', payload),
  get: (id) => request('orders.get', { id }),
  cancel: (payload) => request('orders.cancel', payload),
  confirm: (payload) => request('orders.complete', payload)
};
