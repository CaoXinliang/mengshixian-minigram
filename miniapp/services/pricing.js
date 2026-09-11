const { request } = require('./request');

module.exports = {
  quote: (payload) => request('checkout.quote', payload)
};
