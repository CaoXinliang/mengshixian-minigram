const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
let createCount = 0;
let releaseCreate;

const servicesStub = {
  config: { provider: 'cloudbase' },
  address: {},
  auth: { getMe: async () => ({ ok: true, data: { user: { userType: 'c', businessStatus: '' } } }) },
  cart: { removeItem: async () => ({ ok: true }) },
  delivery: {},
  checkout: {
    quote: async () => ({ ok: true, data: { quote: { goodsAmountCent: 5000, freightAmountCent: 800, totalAmountCent: 5800 } } }),
    createOrder: async () => {
      createCount += 1;
      return new Promise((resolve) => { releaseCreate = resolve; });
    }
  }
};

Module._load = function (request, parent, isMain) {
  if (request === '../../../services' || request === '../../../services/index') return servicesStub;
  return originalLoad.call(this, request, parent, isMain);
};

global.Page = (definition) => { pageDefinition.value = definition; };
global.wx = { showToast: () => {}, redirectTo: () => {} };

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
      Object.assign(this.data, patch);
      if (callback) callback.call(this);
    }
  });
  page.data.address = { id: 'address-1', name: '收货人', detail: '测试地址' };
  page.data.warehouse = { id: 'warehouse-1', name: '南山仓', eta: '预计送达' };
  page.data.cartItems = [{ id: 'cart-1', skuId: 'sku-1', name: '测试冻品', unit: '500g装', qty: 1 }];
  page.data.quoteState = 'ready';

  const first = page.submitOrder();
  const second = page.submitOrder();
  // 提交前会先校验登录身份（一次异步 getMe），等它落地后 createOrder 才进入
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(createCount, 1, 'rapid checkout taps must create only one order');
  releaseCreate({ ok: true, data: { order: { _id: 'order-1', orderNo: 'MSX-1', paymentMethod: 'demo', totalAmountCent: 5800, items: [] } } });
  await first;
  await second;
  assert.equal(page._submittingOrder, false);
  console.log('checkout submit lock test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
