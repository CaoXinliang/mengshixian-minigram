const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
const servicesStub = {
  config: { provider: 'mock', cloudFunctionName: 'api', cloudEnvId: 'test-env', priceFieldsNeverFallback: true, motionEnabled: true },
  auth: {}, catalog: {}, content: {}, address: {}, delivery: {}, checkout: {}, orders: {}, refunds: {}, cart: {}, groups: {}
};

Module._load = function (request, parent, isMain) {
  if (request === '../../services' || request === '../../services/index') return servicesStub;
  return originalLoad.call(this, request, parent, isMain);
};

global.Page = (definition) => { pageDefinition.value = definition; };
global.wx = { showToast: () => {}, getStorageSync: () => '', getSystemInfoSync: () => ({ windowWidth: 375, windowHeight: 667, screenHeight: 667, statusBarHeight: 20 }) };

try {
  require(path.resolve(__dirname, '../miniapp/pages/index/index.js'));
} finally {
  Module._load = originalLoad;
  delete global.Page;
}

function createPage() {
  return Object.assign({}, pageDefinition.value, {
    data: JSON.parse(JSON.stringify(pageDefinition.value.data)),
    setData(patch, callback) {
      Object.assign(this.data, patch);
      if (callback) callback.call(this);
    }
  });
}

function run() {
  const page = createPage();
  page.data.activeTab = 'cart';
  let patch;
  page.triggerPageMotion = (nextPatch) => { patch = nextPatch; };
  page.setUtility('orders');
  assert.equal(patch.page, 'utility');
  assert.equal(patch.utilityType, 'orders');
  assert.equal(patch.activeTab, 'mine');
  console.log('utility active tab test: passed');
}

try {
  run();
} catch (error) {
  console.error(error);
  process.exit(1);
}
