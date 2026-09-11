const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
const rows = [
  { _id: 'order-pending', orderNo: 'P1', status: 'pending_payment', paymentStatus: 'unpaid', refundStatus: '', totalAmountCent: 1000 },
  { _id: 'order-refunded', orderNo: 'R1', status: 'delivered', paymentStatus: 'paid', refundStatus: 'requested', totalAmountCent: 5000 }
];

const servicesStub = {
  orders: { list: async () => ({ ok: true, data: { rows } }), cancel: async () => ({ ok: true }), confirm: async () => ({ ok: true }) },
  refunds: { request: async () => ({ ok: true }) }
};

Module._load = function (request, parent, isMain) {
  if (request === '../../../services' || request === '../../../services/index') return servicesStub;
  return originalLoad.call(this, request, parent, isMain);
};

global.Page = (definition) => { pageDefinition.value = definition; };
global.wx = { showToast: () => {}, navigateBack: () => {} };

try {
  require(path.resolve(__dirname, '../miniapp/package-trade/pages/orders/index.js'));
} finally {
  Module._load = originalLoad;
  delete global.Page;
}

const waitForAsyncSetData = () => new Promise((resolve) => setTimeout(resolve, 20));

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

  page.onLoad({ filter: encodeURIComponent('售后/退款') });
  await waitForAsyncSetData();
  assert.equal(page.data.filter, '售后/退款');
  assert.deepEqual(page.data.rows.map((row) => row.id), ['order-refunded'], 'deep-link filter must be applied before loading orders');

  page.switchFilter({ currentTarget: { dataset: { filter: '待付款' } } });
  await waitForAsyncSetData();
  assert.equal(page.data.filter, '待付款');
  assert.deepEqual(page.data.rows.map((row) => row.id), ['order-pending'], 'tab filter must be applied before reloading orders');
  console.log('orders filter race test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
