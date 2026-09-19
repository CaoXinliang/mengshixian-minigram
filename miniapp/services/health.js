const { request } = require('./request');

module.exports = {
  get: () => request('health', {})
};
