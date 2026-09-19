const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');

const originalLoad = Module._load;
const pageDefinition = {};
const pendingDelivery = [];
const okRows = {
  warehouses: [
    { _id: 'warehouse-1', name: '一号仓', status: 'active' },
    { _id: 'warehouse-2', name: '二号仓', status: 'active' },
    { _id: 'warehouse-3', name: '三号仓', status: 'active' }
  ],
  areas: []
};

const servicesStub = {
  config: { provider: 'cloudbase' },
  auth: {}, address: {}, cart: {}, checkout: {}, orders: {}, refunds: {}, groups: {}, favorites: {}, reviews: {},
  catalog: { listProducts: async () => ({ ok: true, data: { rows: [], total: 0 } }), listCategories: async () => ({ ok: true, data: { rows: [], total: 0 } }) },
  content: {},
  delivery: { options: () => new Promise((resolve) => pendingDelivery.push(resolve)) }
};

Module._load = function (request, parent, isMain) {
  if (request === '../../services' || request === '../../services/index') return servicesStub;
  return originalLoad.call(this, request, parent, isMain);
};
global.Page = (definition) => { pageDefinition.value = definition; };
global.wx = { showToast: () => {} };

try {
  require(path.resolve(__dirname, '../miniapp/pages/index/index.js'));
} finally {
  Module._load = originalLoad;
  delete global.Page;
}

async function run() {
  const page = Object.assign({}, pageDefinition.value, {
    data: JSON.parse(JSON.stringify(pageDefinition.value.data)),
    setData(patch, callback) { Object.assign(this.data, patch); if (callback) callback.call(this); },
    triggerPageMotion(patch, callback) { this.setData(patch, callback); },
    loadRemoteCatalog: async () => true
  });
  page.data.warehouses = okRows.warehouses.map((item) => ({ ...item, id: item._id, areas: [] }));
  page.data.warehouse = page.data.warehouses[0];

  const older = page.selectWarehouse({ currentTarget: { dataset: { id: 'warehouse-2' } } });
  const newer = page.selectWarehouse({ currentTarget: { dataset: { id: 'warehouse-3' } } });
  pendingDelivery[1]({ ok: true, data: okRows });
  await newer;
  assert.equal(page.data.warehouse.id, 'warehouse-3', 'newer warehouse selection must win');
  pendingDelivery[0]({ ok: true, data: okRows });
  await older;
  assert.equal(page.data.warehouse.id, 'warehouse-3', 'late response from an older selection must be ignored');

  const pageWithBackgroundLoad = Object.assign({}, pageDefinition.value, {
    data: JSON.parse(JSON.stringify(pageDefinition.value.data)),
    setData(patch, callback) { Object.assign(this.data, patch); if (callback) callback.call(this); },
    triggerPageMotion(patch, callback) { this.setData(patch, callback); },
    loadRemoteCatalog: async () => true
  });
  pageWithBackgroundLoad.data.warehouses = okRows.warehouses.map((item) => ({ ...item, id: item._id, areas: [] }));
  pageWithBackgroundLoad.data.warehouse = pageWithBackgroundLoad.data.warehouses[0];
  const backgroundLoad = pageWithBackgroundLoad.loadRemoteDeliveryOptions();
  const foregroundSwitch = pageWithBackgroundLoad.selectWarehouse({ currentTarget: { dataset: { id: 'warehouse-2' } } });
  pendingDelivery[3]({ ok: true, data: okRows });
  await foregroundSwitch;
  pendingDelivery[2]({ ok: true, data: okRows });
  await backgroundLoad;
  assert.equal(pageWithBackgroundLoad.data.warehouse.id, 'warehouse-2', 'a delivery refresh started before the user action must not restore its old default');
  console.log('warehouse selection race test: passed');
}

run().catch((error) => { console.error(error); process.exit(1); });
