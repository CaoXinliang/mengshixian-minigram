const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
const quoteCalls = [];

const servicesStub = {
  config: { provider: 'cloudbase' },
  address: {},
  cart: {},
  delivery: {},
  checkout: {
    quote: async (payload) => {
      quoteCalls.push(payload);
      return { ok: true, data: { quote: { goodsAmountCent: 5000, freightAmountCent: 800, totalAmountCent: 5800 } } };
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

  page.data.address = { id: 'address-1', name: '收货人', detail: '测试地址' };
  page.data.warehouses = [
    { id: 'warehouse-old', name: '旧仓', eta: '今天 18:00 前', areas: ['赣州市/章贡区'] },
    { id: 'warehouse-new', name: '新仓', eta: '今天 19:00 前', areas: ['深圳市/南山区'] }
  ];
  page.data.warehouse = page.data.warehouses[0];
  page.data.cartItems = [{ skuId: 'sku-1', qty: 1 }];

  page.selectWarehouse({ currentTarget: { dataset: { id: 'warehouse-new' } } });
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(quoteCalls.length, 1);
  assert.equal(quoteCalls[0].warehouseId, 'warehouse-new', 'warehouse selection must quote with the newly selected warehouse');
  assert.equal(page.data.warehouseAreaText, '深圳市/南山区', 'warehouse selection must update the displayed delivery area');
  console.log('checkout warehouse race test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
