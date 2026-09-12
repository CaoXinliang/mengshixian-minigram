const { request } = require('./request');

module.exports = {
  account: () => request('storedValue.account'),
  ledger: (payload) => request('storedValue.ledger', payload),
  topupIntent: (payload) => request('storedValue.topupIntent', payload)
};
