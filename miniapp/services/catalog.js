const { request } = require('./request');

module.exports = {
  getHome: (payload) => request('content.home', payload),
  listCategories: (payload) => request('catalog.categories', payload),
  listProducts: (payload) => request('catalog.products', payload),
  getProduct: (productId) => request('catalog.product', { productId }),
  listPrices: (skuIds) => request('catalog.prices', { skuIds })
};
