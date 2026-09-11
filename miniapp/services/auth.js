const { request } = require('./request');

module.exports = {
  login: () => request('auth.wechatLogin'),
  getMe: () => request('auth.me'),
  applyBusiness: (payload) => request('auth.applyBusiness', payload)
};
