const { request } = require('./request');

module.exports = {
  list: (payload) => request('reviews.list', payload),
  eligible: (payload) => request('reviews.eligible', payload),
  mine: (payload) => request('reviews.mine', payload),
  create: (payload) => request('reviews.create', payload),
  uploadMedia: (payload) => request('reviews.media.upload', payload)
};
