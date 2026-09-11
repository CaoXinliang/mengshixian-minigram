const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
const quoteCalls = [];

const servicesStub = {
  config: { provider: 'cloudbase' },
  address: { list: async () => ({ ok: true, data: { rows: [{ _id: 'address-1', name: '收货人', phoneMasked: '138****0000', detail: '深圳市南山区测试路', isDefault: true }] } }) },
  delivery: { options: async () => ({ ok: true, data: { warehouses: [{ _id: 'warehouse-1', name: '南山仓' }], areas: [{ regionCodes: ['深圳市/南山区'], warehouseIds: ['warehouse-1'] }] } }) },
  cart: { get: async () => ({ ok: true, data: { rows: [{ _id: 'cart-1', skuId: 'sku-1', quantity: 2, selected: true, sku: { specName: '500g装' }, product: { name: '测试冻品', image: '/assets/products/placeholder.svg' } }] } }), getAll: async () => ({ ok: true, data: { rows: [{ _id: 'cart-1', skuId: 'sku-1', quantity: 2, selected: true, sku: { specName: '500g装' }, product: { name: '测试冻品', image: '/assets/products/placeholder.svg' } }] } }) },
  checkout: {
    quote: async (payload) => {
      quoteCalls.push(payload);
      return { ok: true, data: { quote: { goodsAmountCent: 5000, freightAmountCent: 800, totalAmountCent: 5800, items: [{ skuId: 'sku-1', quantity: 2, unitPriceCent: 2500, subtotalCent: 5000 }] } } };
    },
    createOrder: async () => ({ ok: true, data: {} })
  }
};

Module._load = function (request, parent, isMain) {
  if (request === '../../../services' || request === '../../../services/index') return servicesStub;
  return originalLoad.call(this, request, parent, isMain);
};

global.Page = (definition) => { pageDefinition.value = definition; };
global.wx = { showToast: () => {} };

try {
  require(path.resolve(__dirname, '../miniapp/package-trade/pages/checkout/index.js'));
} finally {
  Module._load = originalLoad;
  delete global.Page;
}

async function run() {
  const page = Object.assign({}, pageDefinition.value, {
    data: JSON.parse(JSON.stringify(pageDefinition.value.data)),
    setData(patch, callback) {
      setImmediate(() => {
        Object.assign(this.data, patch);
        if (callback) callback.call(this);
      });
    }
  });

  await page.onLoad();
  assert.equal(quoteCalls.length, 1, 'initial checkout load must quote after all state is committed');
  assert.equal(quoteCalls[0].addressId, 'address-1');
  assert.equal(quoteCalls[0].warehouseId, 'warehouse-1');
  assert.deepEqual(quoteCalls[0].items, [{ skuId: 'sku-1', quantity: 2 }]);
  assert.equal(page.data.warehouseAreaText, '深圳市/南山区');
  assert.equal(page.data.quoteState, 'ready');
  assert.equal(page.data.cartItems[0].unitPriceText, '25');
  assert.equal(page.data.cartItems[0].subtotalText, '50');
  console.log('checkout initial load race test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
