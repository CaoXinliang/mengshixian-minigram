const { request } = require('./request');

module.exports = {
  list: () => request('address.list'),
  save: (payload) => request('address.upsert', payload),
  remove: (id) => request('address.delete', { id })
};
