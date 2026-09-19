const { request } = require('./request');

module.exports = {
  campaigns: (payload) => request('groups.campaigns', payload),
  quote: (payload) => request('groups.quote', payload),
  create: (payload) => request('groups.create', payload),
  join: (payload) => request('groups.join', payload),
  get: (payload) => request('groups.get', payload && payload.groupId ? payload : { groupId: payload && (payload.id || payload) }),
  mine: (payload) => request('groups.mine', payload)
};
