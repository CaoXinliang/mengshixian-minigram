const { request } = require('./request');

module.exports = {
  pointsAccount: () => request('points.account'),
  signIn: (payload) => request('points.signIn', payload),
  pointsLedger: (payload) => request('points.ledger', payload),
  profile: () => request('membership.profile')
};
