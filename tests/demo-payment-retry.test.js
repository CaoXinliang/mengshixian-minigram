const assert = require('assert/strict');
const Module = require('module');
const path = require('path');
const fs = require('fs');

const originalLoad = Module._load;
const pageDefinition = {};
let getCount = 0;
let nextResult;
const redirects = [];

const servicesStub = {
  orders: {
    get: async () => {
      getCount += 1;
      if (nextResult !== undefined) return nextResult;
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
global.wx = { redirectTo: value => redirects.push(value), showToast: () => {} };

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
  assert.equal(page.data.retryable, true);
  assert.equal(page.data.errorText, '网络暂时不可用');

  await page.retry();
  assert.equal(page.data.loading, false);
  assert.equal(page.data.failed, false);
  assert.equal(page.data.retryable, false);
  assert.equal(page.data.order.orderNo, 'MSX-1');
  assert.equal(page.data.order.itemSummary, '雷洛滋保鲜膜 · 6卷/件 ×1');
  assert.equal(getCount, 2);

  for (const query of [undefined, {}, { id: '' }, { id: '  ' }]) {
    await page.onLoad(query);
    assert.equal(page.data.failed, true);
    assert.equal(page.data.loading, false);
    assert.equal(page.data.retryable, false, 'missing IDs cannot be recovered by repeating the same request');
    assert.equal(page.data.order, null, 'an invalid entry must not retain the previous order');
    await page.retry();
    assert.equal(getCount, 2, 'an invalid retry must not call the order API');
  }
  page.back();
  assert.match(redirects[0].url, /^\/package-trade\/pages\/orders\/index\?/);

  for (const code of ['ORDER_NOT_FOUND', 'UNAUTHORIZED', 'FORBIDDEN', 'UNAUTHENTICATED', 'AUTH_ACCOUNT_DISABLED', 'VALIDATION_ERROR']) {
    nextResult = { ok: false, error: { code } };
    await page.onLoad({ id: 'not-accessible' });
    assert.equal(page.data.failed, true);
    assert.equal(page.data.retryable, false, `${code} must not leave a dead-end reload action`);
    const priorCount = getCount;
    await page.retry();
    assert.equal(getCount, priorCount);
  }
  nextResult = { ok: false, error: { code: 'REQUEST_FAILED' } };
  await page.onLoad({ id: 'order-1' });
  assert.equal(page.data.retryable, true, 'a temporary network failure remains recoverable');
  const template = fs.readFileSync(path.resolve(__dirname, '../miniapp/package-trade/pages/demo-payment/index.wxml'), 'utf8');
  assert.match(template, /<button\s+wx:if="\{\{retryable\}\}"\s+bindtap="retry">重新加载<\/button>/);
  assert.match(template, /<button\s+bindtap="back">返回订单页<\/button>/);
  console.log('demo payment retry test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
