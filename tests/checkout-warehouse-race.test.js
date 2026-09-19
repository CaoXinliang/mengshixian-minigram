const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
const quoteCalls = [];
let quoteResponder = async () => ({ ok: true, data: { quote: { goodsAmountCent: 5000, freightAmountCent: 800, discountAmountCent: 0, totalAmountCent: 5800, items: [{ skuId: 'sku-1', unitPriceCent: 5000, subtotalCent: 5000 }] } } });

const servicesStub = {
  config: { provider: 'cloudbase' },
  address: {},
  cart: {},
  delivery: {},
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

  page.data.address = { id: 'address-1', name: '收货人', detail: '测试地址', regionCode: '440305' };
  page.data.warehouses = [
    { id: 'warehouse-old', name: '旧仓', eta: '今天 18:00 前', areas: ['赣州市/章贡区'] },
    { id: 'warehouse-new', name: '新仓', eta: '今天 19:00 前', areas: ['深圳市/南山区'] }
  ];
  page.data.warehouse = page.data.warehouses[0];
  page.data.deliveryAreas = [
    { _id: 'area-old', regionCodes: ['360702'], warehouseIds: ['warehouse-old'] },
    { _id: 'area-new', regionCodes: ['440305'], warehouseIds: ['warehouse-new'] }
  ];
  page.data.cartItems = [{ skuId: 'sku-1', qty: 1 }];

  page.selectWarehouse({ currentTarget: { dataset: { id: 'warehouse-new' } } });
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(quoteCalls.length, 1);
  assert.equal(quoteCalls[0].warehouseId, 'warehouse-new', 'warehouse selection must quote with the newly selected warehouse');
  assert.equal(page.data.warehouseAreaText, '深圳市/南山区', 'warehouse selection must update the displayed delivery area');

  const outOfArea = Object.assign({}, pageDefinition.value, {
    data: JSON.parse(JSON.stringify(pageDefinition.value.data)),
    setData(patch, callback) { Object.assign(this.data, patch); if (callback) callback.call(this); }
  });
  outOfArea.data.address = { id: 'address-out', name: '收货人', detail: '超区地址', regionCode: '999999' };
  outOfArea.data.deliveryAreas = [
    { _id: 'area-old', regionCodes: ['360702'], warehouseIds: ['warehouse-old'] },
    { _id: 'area-new', regionCodes: ['440305'], warehouseIds: ['warehouse-new'] }
  ];
  outOfArea.data.warehouses = page.data.warehouses;
  outOfArea.data.warehouse = page.data.warehouses[0];
  outOfArea.data.cartItems = [{ skuId: 'sku-1', qty: 1 }];
  const beforeOutOfAreaQuote = quoteCalls.length;
  await outOfArea.loadQuote();
  assert.equal(outOfArea.data.quoteState, 'invalid');
  assert.equal(outOfArea.data.quoteErrorText, '当前地址超出配送范围，请更换地址或选择到店自提');
  assert.equal(quoteCalls.length, beforeOutOfAreaQuote, 'out-of-area delivery must stop before requesting a quote');

  const matched = Object.assign({}, pageDefinition.value, {
    data: JSON.parse(JSON.stringify(pageDefinition.value.data)),
    setData(patch, callback) { Object.assign(this.data, patch); if (callback) callback.call(this); }
  });
  matched.data.address = { id: 'address-new', name: '收货人', detail: '南山区', regionCode: '440305' };
  matched.data.deliveryAreas = outOfArea.data.deliveryAreas;
  matched.data.warehouses = page.data.warehouses;
  matched.data.warehouse = page.data.warehouses[0];
  matched.data.cartItems = [{ skuId: 'sku-1', qty: 1 }];
  matched.data.acceptedQuoteToken = 'stale-token';
  await matched.applySelectedAddress(matched.data.address);
  assert.equal(matched.data.warehouse.id, 'warehouse-new', 'a new address must select a warehouse by stable region and warehouse ids');
  assert.equal(matched.data.acceptedQuoteToken, '', 'changing address must invalidate an accepted quote token');
  assert.equal(Object.hasOwn(quoteCalls.at(-1), 'acceptedQuoteToken'), false, 'requote after address change must not reuse the old quote token');

  let resolveOldQuote;
  quoteResponder = () => new Promise(resolve => { resolveOldQuote = resolve; });
  const oldQuote = matched.loadQuote();
  await new Promise(resolve => setImmediate(resolve));
  matched.selectWarehouse({ currentTarget: { dataset: { id: 'warehouse-old' } } });
  resolveOldQuote({ ok: true, data: { quote: { goodsAmountCent: 1, freightAmountCent: 1, discountAmountCent: 0, totalAmountCent: 2, items: [{ skuId: 'sku-1', unitPriceCent: 1, subtotalCent: 1 }] } } });
  await oldQuote;
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(matched.data.quoteState, 'invalid', 'a late quote must not overwrite a newer incompatible warehouse selection');
  assert.equal(matched.data.quoteErrorText, '当前地址超出配送范围，请更换地址或选择到店自提');
  console.log('checkout warehouse race test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
