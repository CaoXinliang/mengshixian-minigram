const { request } = require('./request');

module.exports = {
  options: (payload) => request('delivery.options', payload)
};
