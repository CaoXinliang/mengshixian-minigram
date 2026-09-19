const assert = require('assert');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};

Module._load = function (request, parent, isMain) {
  if (request === '../../services' || request === '../../services/index') return { config: { provider: 'mock', cloudFunctionName: 'api', cloudEnvId: '', priceFieldsNeverFallback: true } };
  return originalLoad.call(this, request, parent, isMain);
};

global.Page = (definition) => {
  pageDefinition.value = definition;
};

try {
  require(path.resolve(__dirname, '../miniapp/pages/index/index.js'));
} finally {
  Module._load = originalLoad;
  delete global.Page;
}

const initial = pageDefinition.value && pageDefinition.value.data;
assert(initial, 'mock mode should register a page definition');
assert(initial.products.length > 0, 'mock mode must keep the approved demo product data source');
assert(initial.bannerItems.length > 0, 'mock mode must keep the approved demo banner data source');
assert(initial.homeCategories.length > 0, 'mock mode must keep the approved home category icons');
assert.strictEqual(initial.homeCategories.length, 10, 'home shortcuts must show exactly ten categories');
assert(initial.categoryGroups.length > 0, 'mock mode must keep the approved category group shell');
assert.strictEqual(initial.warehouses.length, 2, 'mock mode must keep the two demo warehouses');
assert.strictEqual(initial.cartItems.length, 2, 'mock mode must keep the approved demo cart seed');
assert.strictEqual(initial.cartCount, 3, 'mock mode cart count must remain unchanged');
assert(initial.groupDeals.length > 0, 'mock mode must keep the approved demo group deals');
assert.strictEqual(initial.couponCount, 2, 'mock mode must keep the approved demo coupon count');
assert.strictEqual(initial.points, 268, 'mock mode must keep the approved demo points baseline');

console.log('mock mode state test: passed');
