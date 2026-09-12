const { request } = require('./request');

module.exports = {
  templates: (payload) => request('coupons.templates', payload),
  claim: (payload) => request('coupons.claim', payload),
  list: (payload) => request('coupons.list', payload)
};
