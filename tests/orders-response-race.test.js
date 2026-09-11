const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
const pending = [];

const servicesStub = {
  orders: {
    list: () => new Promise((resolve) => pending.push(resolve)),
    cancel: async () => ({ ok: true }),
    confirm: async () => ({ ok: true })
  },
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

const rows = [
  { _id: 'order-pending', orderNo: 'P1', status: 'pending_payment', paymentStatus: 'unpaid', refundStatus: '', totalAmountCent: 1000 },
  { _id: 'order-refunded', orderNo: 'R1', status: 'delivered', paymentStatus: 'paid', refundStatus: 'requested', totalAmountCent: 5000 }
];

async function run() {
  const page = Object.assign({}, pageDefinition.value, {
    data: JSON.parse(JSON.stringify(pageDefinition.value.data)),
    setData(patch, callback) {
      Object.assign(this.data, patch);
      if (callback) callback.call(this);
    }
  });

  page.data.filter = '售后/退款';
  const first = page.loadOrders();
  page.data.filter = '待付款';
  const second = page.loadOrders();
  assert.equal(pending.length, 2);

  pending[1]({ ok: true, data: { rows } });
  await second;
  pending[0]({ ok: true, data: { rows } });
  await first;
  assert.equal(page.data.filter, '待付款');
  assert.deepEqual(page.data.rows.map((row) => row.id), ['order-pending'], 'stale order response must not overwrite the latest filter result');
  console.log('orders response race test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
