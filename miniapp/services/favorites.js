const { request } = require('./request');

module.exports = {
  list: (payload) => request('favorites.list', payload),
  upsert: (payload) => request('favorites.upsert', payload),
  remove: (payload) => request('favorites.remove', payload)
};
