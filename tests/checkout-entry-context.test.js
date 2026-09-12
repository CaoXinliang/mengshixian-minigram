const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const holder = {};
const calls = { address: 0, delivery: 0, cart: 0, quote: 0 };
let deliveryFails = false;
const okRows = rows => ({ ok: true, data: { rows } });
const services = {
  config: { provider: 'cloudbase' },
  address: { list: async () => { calls.address += 1; return okRows([{ _id: 'address-1', name: '收货人', detail: '深圳市南山区', regionCode: '440305', isDefault: true }]); } },
  delivery: { options: async () => { calls.delivery += 1; return deliveryFails ? { ok: false, error: { code: 'DELIVERY_FAILED' } } : { ok: true, data: { warehouses: [{ _id: 'warehouse-1', name: '南山仓' }], areas: [{ _id: 'area-1', regionCodes: ['440305'], warehouseIds: ['warehouse-1'] }], slots: [{ _id: 'slot-1', name: '下午配送', deliveryAreaId: 'area-1', warehouseId: 'warehouse-1' }] } }; } },
  cart: { getAll: async () => { calls.cart += 1; return okRows([{ _id: 'cart-1', skuId: 'sku-1', quantity: 2, selected: true, sku: { specName: '500g' }, product: { name: '鱼丸' } }]); } },
  checkout: { quote: async payload => { calls.quote += 1; return { ok: true, data: { quote: { goodsAmountCent: 4000, freightAmountCent: 800, payableAmountCent: 4800, items: payload.items.map(item => ({ ...item, unitPriceCent: 2000, subtotalCent: 4000 })) } } }; } }
};

Module._load = function (request, parent, isMain) {
  if (request === '../../../services' || request === '../../../services/index') return services;
  return originalLoad.call(this, request, parent, isMain);
};
global.Page = definition => { holder.value = definition; };
global.wx = { navigateBack: () => {} };
try {
  require(path.resolve(__dirname, '../miniapp/package-trade/pages/checkout/index.js'));
} finally {
  Module._load = originalLoad;
  delete global.Page;
}

function makePage() {
  return Object.assign({}, holder.value, {
    data: JSON.parse(JSON.stringify(holder.value.data)),
    setData(patch, callback) { Object.assign(this.data, patch); if (callback) callback.call(this); }
  });
}

async function run() {
  const direct = makePage();
  await direct.onLoad({});
  assert.equal(direct.data.entryInvalid, true);
  assert.equal(direct.data.loadError, false, 'missing entry context is not a transport or delivery failure');
  assert.equal(direct.data.quoteErrorText, '请从购物车选择商品后进入结算');
  assert.deepEqual(calls, { address: 0, delivery: 0, cart: 0, quote: 0 }, 'direct routing must not issue misleading checkout requests');
  await direct.onShow();
  assert.deepEqual(calls, { address: 0, delivery: 0, cart: 0, quote: 0 }, 'direct-entry empty state must remain stable on show');

  const fromCart = makePage();
  await fromCart.onLoad({ source: 'cart' });
  assert.equal(fromCart.data.entryInvalid, false);
  assert.deepEqual(calls, { address: 1, delivery: 1, cart: 1, quote: 1 }, 'normal cart checkout must load its full fulfillment context and quote once');
  assert.equal(fromCart.data.warehouse.id, 'warehouse-1');
  assert.equal(fromCart.data.quoteState, 'ready');
  assert.equal(fromCart.data.orderTotal, '48.00');

  deliveryFails = true;
  const failedDelivery = makePage();
  await failedDelivery.onLoad({ source: 'cart' });
  assert.equal(failedDelivery.data.entryInvalid, false);
  assert.equal(failedDelivery.data.loadError, true, 'a real delivery API failure must remain an error, not an empty-context state');
  assert.equal(failedDelivery.data.loadErrorText, '配送范围读取失败，请重新加载');
  assert.equal(calls.quote, 1, 'a real delivery failure must not send an incomplete quote');
  console.log('checkout entry context test: passed');
}

run().catch(error => { console.error(error); process.exit(1); });
