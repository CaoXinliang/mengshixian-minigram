const { request } = require('./request');

module.exports = {
  list: (payload) => request('bundles.list', payload),
  get: (payload) => request('bundles.get', payload),
  quote: (payload) => request('bundles.quote', payload)
};
