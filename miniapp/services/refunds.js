const { request } = require('./request');

module.exports = {
  request: (payload) => request('refunds.request', payload)
};
