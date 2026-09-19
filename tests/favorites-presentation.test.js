const assert = require('assert/strict');
const { presentFavorites } = require('../miniapp/modules/favorites-presentation');

const rows = presentFavorites([
  {
    _id: 'favorite-ready',
    skuId: 'sku-ready',
    productId: 'product-ready',
    productNameSnapshot: '潮汕牛肉丸',
    specSnapshot: '500克装',
    packageUnitSnapshot: '袋',
    mediaSnapshot: 'media-ready',
    purchasable: true,
    unavailableReason: ''
  },
  {
    _id: 'favorite-off-sale',
    skuId: 'sku-off-sale',
    productId: 'product-off-sale',
    productNameSnapshot: '手打鱼丸',
    specSnapshot: '1千克',
    packageUnitSnapshot: '包',
    mediaSnapshot: 'media-missing',
    purchasable: false,
    unavailableReason: 'sku_off_sale'
  },
  {
    _id: 'favorite-invalid',
    skuId: 'sku-invalid',
    productId: '',
    productNameSnapshot: '',
    specSnapshot: '',
    packageUnitSnapshot: '',
    mediaSnapshot: '',
    purchasable: false,
    unavailableReason: 'product_missing'
  }
], { 'media-ready': 'https://example.test/ready.jpg' });

assert.deepEqual(rows[0], {
  id: 'favorite-ready',
  skuId: 'sku-ready',
  productId: 'product-ready',
  name: '潮汕牛肉丸',
  spec: '500克装 / 袋',
  image: 'https://example.test/ready.jpg',
  purchasable: true,
  unavailable: false,
  unavailableText: '',
  canRemove: true,
  removing: false,
  removeState: 'idle',
  removeText: ''
});
assert.equal(rows[1].name, '手打鱼丸', 'off-sale favorites must keep their safe snapshot');
assert.equal(rows[1].purchasable, false);
assert.equal(rows[1].unavailableText, '该规格已下架');
assert.equal(rows[1].image, '/assets/products/placeholder.svg', 'an unresolved media snapshot must use the neutral placeholder');
assert.equal(rows[2].name, '商品信息已失效', 'missing snapshots must not invent a product name');
assert.equal(rows[2].spec, '规格信息已失效', 'missing snapshots must not invent a specification');
assert.equal(rows[2].unavailableText, '商品信息已失效');
assert.equal(rows[2].canRemove, true, 'invalid favorites must remain removable');
assert.equal(Object.hasOwn(rows[0], 'price'), false, 'presentation must not infer prices');
assert.equal(Object.hasOwn(rows[0], 'stock'), false, 'presentation must not infer inventory');

console.log('favorites presentation test: passed');
