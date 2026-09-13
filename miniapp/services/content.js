const { request } = require('./request');

module.exports = {
  getBanners: (payload) => request('content.banners', payload),
  getHomeSections: (payload) => request('content.homeSections', payload),
  getMealIdeas: (payload) => request('content.mealIdeas', payload),
  resolveMedia: (ids) => request('content.media.resolve', { ids, platform: 'miniapp' })
};
