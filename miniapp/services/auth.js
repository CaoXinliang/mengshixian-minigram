const { request } = require('./request');

module.exports = {
  login: (payload) => request('auth.wechatLogin', payload || {}),
  getMe: () => request('auth.me'),
  applyBusiness: (payload) => request('auth.applyBusiness', payload),
  uploadBusinessMedia: (payload) => request('auth.businessMedia.upload', payload)
};
