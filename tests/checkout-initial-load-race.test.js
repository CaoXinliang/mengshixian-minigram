const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
const quoteCalls = [];
let addressSelectedHandler = null;
let quoteResponder = async () => ({ ok: true, data: { quote: { goodsAmountCent: 5000, freightAmountCent: 800, discountAmountCent: 0, totalAmountCent: 5800, items: [{ skuId: 'sku-1', quantity: 2, unitPriceCent: 2500, subtotalCent: 5000 }] } } });

const servicesStub = {
  config: { provider: 'cloudbase' },
  address: { list: async () => { await new Promise(resolve => setTimeout(resolve, 20)); return { ok: true, data: { rows: [{ _id: 'address-1', name: '收货人', phoneMasked: '138****0000', detail: '深圳市南山区测试路', regionCode: '深圳市/南山区', isDefault: true }] } }; } },
  delivery: { options: async () => ({ ok: true, data: { warehouses: [{ _id: 'warehouse-other', name: '其他仓' }, { _id: 'warehouse-1', name: '南山仓' }], areas: [{ regionCodes: ['赣州市/章贡区'], warehouseIds: ['warehouse-other'] }, { regionCodes: ['深圳市/南山区', '深圳市/福田区'], warehouseIds: ['warehouse-1'] }] } }) },
  cart: { get: async () => ({ ok: true, data: { rows: [{ _id: 'cart-1', skuId: 'sku-1', quantity: 2, selected: true, sku: { specName: '500g装' }, product: { name: '测试冻品', image: '/assets/products/placeholder.svg' } }] } }), getAll: async () => ({ ok: true, data: { rows: [{ _id: 'cart-1', skuId: 'sku-1', quantity: 2, selected: true, sku: { specName: '500g装' }, product: { name: '测试冻品', image: '/assets/products/placeholder.svg' } }] } }) },
  checkout: {
    quote: async (payload) => {
      quoteCalls.push(payload);
      return quoteResponder(payload);
    },
    createOrder: async () => ({ ok: true, data: {} })
  }
};

Module._load = function (request, parent, isMain) {
  if (request === '../../../services' || request === '../../../services/index') return servicesStub;
  return originalLoad.call(this, request, parent, isMain);
};

global.Page = (definition) => { pageDefinition.value = definition; };
global.wx = {
  showToast: () => {},
  navigateTo: ({ url, success }) => {
    assert.equal(url, '/package-trade/pages/addresses/index?select=1');
    if (success) success({
      eventChannel: {
        on(name, handler) {
          assert.equal(name, 'addressSelected');
          addressSelectedHandler = handler;
        }
      }
    });
  }
};

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

  await page.onLoad({ source: 'cart' });
  assert.equal(quoteCalls.length, 1, 'initial checkout load must quote after all state is committed');
  assert.equal(quoteCalls[0].addressId, 'address-1');
  assert.equal(quoteCalls[0].warehouseId, 'warehouse-1');
  assert.deepEqual(quoteCalls[0].items, [{ skuId: 'sku-1', quantity: 2 }]);
  assert.equal(page.data.warehouseAreaText, '深圳市/南山区、深圳市/福田区');
  assert.equal(page.data.cartItemQty, 2, 'checkout quantity must equal the sum of selected item quantities');
  assert.equal(page.data.quoteState, 'ready');
  assert.equal(page.data.cartItems[0].unitPriceText, '25.00');
  assert.equal(page.data.cartItems[0].subtotalText, '50.00');

  quoteResponder = async () => ({ ok: true, data: { quote: { goodsAmountCent: null, freightAmountCent: '', totalAmountCent: false, items: [{ skuId: 'sku-1', unitPriceCent: null, subtotalCent: '' }] } } });
  await page.loadQuote();
  assert.equal(page.data.quoteState, 'error', 'an incomplete server quote must not be presented as a ready zero-priced order');
  assert.equal(page.data.orderTotal, '--');
  quoteResponder = async () => ({ ok: true, data: { quote: { goodsAmountCent: 5000, freightAmountCent: 800, discountAmountCent: 0, totalAmountCent: 5800, items: [{ skuId: 'sku-1', quantity: 2, unitPriceCent: 2500, subtotalCent: 5000 }] } } });

  page.chooseAddress();
  assert.equal(typeof addressSelectedHandler, 'function', 'checkout must listen for the selected address');
  await addressSelectedHandler({
    id: 'address-2',
    name: '李四',
    phoneMasked: '139****0000',
    detail: '深圳市福田区测试路',
    regionCode: '深圳市/福田区'
  });
  assert.equal(page.data.address.id, 'address-2', 'selected address must replace the checkout address');
  assert.equal(quoteCalls.at(-1).addressId, 'address-2', 'selected address must be used for the new quote');
  const quoteCountAfterSelection = quoteCalls.length;
  await page.onShow();
  assert.equal(page.data.address.id, 'address-2', 'returning from address manager must not restore the default address');
  assert.equal(quoteCalls.length, quoteCountAfterSelection, 'address selection must not trigger a duplicate quote on onShow');
  console.log('checkout initial load race test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
