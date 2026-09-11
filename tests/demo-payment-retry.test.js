const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
let getCount = 0;

const servicesStub = {
  orders: {
    get: async () => {
      getCount += 1;
      if (getCount === 1) return { ok: false, error: { message: '网络暂时不可用' } };
      return { ok: true, data: { order: { _id: 'order-1', orderNo: 'MSX-1', status: 'pending_confirmation', paymentMethod: 'demo', totalAmountCent: 5800 }, items: [{ productNameSnapshot: '雷洛滋保鲜膜', specSnapshot: '6卷/件', quantity: 1 }] } };
    }
  }
};

Module._load = function (request, parent, isMain) {
  if (request === '../../../services' || request === '../../../services/index') return servicesStub;
  return originalLoad.call(this, request, parent, isMain);
};

global.Page = (definition) => { pageDefinition.value = definition; };
global.wx = { redirectTo: () => {}, showToast: () => {} };

try {
  require(path.resolve(__dirname, '../miniapp/package-trade/pages/demo-payment/index.js'));
} finally {
  Module._load = originalLoad;
  delete global.Page;
}

async function run() {
  const page = Object.assign({}, pageDefinition.value, {
    data: JSON.parse(JSON.stringify(pageDefinition.value.data)),
    setData(patch, callback) {
      Object.assign(this.data, patch);
      if (callback) callback.call(this);
    }
  });

  await page.onLoad({ id: 'order-1' });
  assert.equal(page.data.loading, false);
  assert.equal(page.data.failed, true);
  assert.equal(page.data.errorText, '网络暂时不可用');

  await page.retry();
  assert.equal(page.data.loading, false);
  assert.equal(page.data.failed, false);
  assert.equal(page.data.order.orderNo, 'MSX-1');
  assert.equal(page.data.order.itemSummary, '雷洛滋保鲜膜 · 6卷/件 ×1');
  assert.equal(getCount, 2);
  console.log('demo payment retry test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
