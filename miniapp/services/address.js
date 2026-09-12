const { request } = require('./request');

module.exports = {
  list: () => request('address.list'),
  save: (payload) => request('address.upsert', payload),
  setDefault: (id) => request('address.setDefault', { id }),
  remove: (id) => request('address.delete', { id })
};
