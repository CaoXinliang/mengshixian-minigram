const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
const quoteCalls = [];
const createCalls = [];
const toasts = [];
const navigations = [];
const okRows = rows => ({ ok: true, data: { rows } });

const servicesStub = {
  config: { provider: 'cloudbase' },
  address: { list: async () => okRows([{ _id: 'address-1', name: '张三', phoneMasked: '138****0000', detail: '南山区科技园', regionCode: '440305', isDefault: true }]) },
  delivery: { options: async () => ({ ok: true, data: {
    warehouses: [{ _id: 'warehouse-1', name: '南山仓' }, { _id: 'warehouse-2', name: '宝安仓' }],
    areas: [{ _id: 'area-1', regionCodes: ['440305'], warehouseIds: ['warehouse-1'] }, { _id: 'area-2', regionCodes: ['440305'], warehouseIds: ['warehouse-2'] }],
    slots: [
      { _id: 'slot-am', name: '上午配送', deliveryAreaId: 'area-1', warehouseId: 'warehouse-1', startTime: '09:00', endTime: '12:00' },
      { _id: 'slot-pm', name: '下午配送', deliveryAreaId: 'area-1', warehouseId: 'warehouse-1', startTime: '14:00', endTime: '18:00' },
      { _id: 'slot-other', name: '次日配送', deliveryAreaId: 'area-2', warehouseId: 'warehouse-2', startTime: '09:00', endTime: '18:00' }
    ]
  } }) },
  cart: {
    getAll: async () => okRows([{ _id: 'cart-1', skuId: 'sku-1', quantity: 2, selected: true, sku: { specName: '500g' }, product: { name: '鱼丸' } }]),
    removeItem: async () => ({ ok: true })
  },
  checkout: {
    quote: async (payload) => { quoteCalls.push(payload); return { ok: true, data: { quote: { goodsAmountCent: 2000, freightAmountCent: 500, payableAmountCent: 2500, items: [] } } }; },
    createOrder: async (payload) => { createCalls.push(payload); return { ok: true, data: { order: { _id: 'order-1' } } }; }
  },
  auth: { getMe: async () => ({ ok: true, data: { user: { userType: 'c', businessStatus: '' } } }) }
};

Module._load = function (request, parent, isMain) {
  if (request === '../../../services' || request === '../../../services/index') return servicesStub;
  return originalLoad.call(this, request, parent, isMain);
};
global.Page = (definition) => { pageDefinition.value = definition; };
global.wx = {
  showToast: payload => toasts.push(payload),
  navigateTo: payload => navigations.push(payload.url),
  redirectTo: payload => navigations.push(payload.url)
};
try {
  require(path.resolve(__dirname, '../miniapp/package-trade/pages/checkout/index.js'));
} finally {
  Module._load = originalLoad;
  delete global.Page;
}

function makePage() {
  return Object.assign({}, pageDefinition.value, {
    data: JSON.parse(JSON.stringify(pageDefinition.value.data)),
    setData(patch, callback) { Object.assign(this.data, patch); if (callback) callback.call(this); }
  });
}

async function run() {
  const page = makePage();
  await page.onLoad({ source: 'cart' });
  assert.deepEqual(page.data.deliverySlots.map((item) => item.id), ['slot-am', 'slot-pm'], 'slots must be filtered by both warehouse and delivery area');
  assert.equal(page.data.deliverySlot.id, 'slot-am');
  assert.equal(quoteCalls[0].deliverySlotId, 'slot-am');

  await page.selectDeliverySlot({ currentTarget: { dataset: { id: 'slot-pm' } } });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(page.data.deliverySlot.id, 'slot-pm');
  assert.equal(quoteCalls.at(-1).deliverySlotId, 'slot-pm', 'changing a slot must refresh the server quote');

  page.selectWarehouse({ currentTarget: { dataset: { id: 'warehouse-2' } } });
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(page.data.deliverySlots.map((item) => item.id), ['slot-other']);
  assert.equal(quoteCalls.at(-1).deliverySlotId, 'slot-other');

  page.data.allDeliverySlots = [];
  const quoteCount = quoteCalls.length;
  await page.loadQuote();
  assert.equal(page.data.quoteState, 'invalid');
  assert.match(page.data.quoteErrorText, /暂无可用配送时段/);
  assert.equal(quoteCalls.length, quoteCount, 'checkout must not quote without an available slot');

  page.data.allDeliverySlots = [{ id: 'slot-other', name: '次日配送', deliveryAreaId: 'area-2', warehouseId: 'warehouse-2', startTime: '09:00', endTime: '18:00' }];
  page.syncDeliverySlots();
  await page.loadQuote();
  await page.submitOrder();
  assert.equal(createCalls[0].fulfillmentType, 'delivery');
  assert.equal(createCalls[0].deliverySlotId, 'slot-other', 'order creation must carry the selected delivery slot');
  assert.equal(createCalls[0].addressId, 'address-1');

  page.chooseAddress();
  assert.equal(navigations.at(-1), '/package-trade/pages/addresses/index?select=1');
  assert(navigations.some((url) => url.includes('/package-trade/pages/demo-payment/index?id=order-1')));
  assert(!JSON.stringify(createCalls[0]).includes('pickup'), 'pickup must not be sent before its server contract exists');
  console.log('delivery slot checkout test: passed');
}

run().catch((error) => { console.error(error); process.exit(1); });
