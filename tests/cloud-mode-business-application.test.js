const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
const submitted = [];

const servicesStub = {
  config: { provider: 'cloudbase', cloudFunctionName: 'api', cloudEnvId: 'test-env', priceFieldsNeverFallback: true },
  auth: {
    login: async () => ({ ok: true, data: { user: { userType: 'c', businessStatus: '' } } }),
    getMe: async () => ({ ok: true, data: { user: { userType: 'c', businessStatus: '' } } }),
    applyBusiness: async (payload) => { submitted.push(payload); return { ok: true, data: { application: { _id: 'application-1' } } }; }
  },
  catalog: { getHome: async () => ({ ok: true, data: { rows: [] } }), listCategories: async () => ({ ok: true, data: { rows: [] } }), listProducts: async () => ({ ok: true, data: { rows: [] } }), getProduct: async () => ({ ok: true, data: { skus: [] } }) },
  content: { getBanners: async () => ({ ok: true, data: { rows: [] } }), getHomeSections: async () => ({ ok: true, data: { rows: [] } }), resolveMedia: async () => ({ ok: true, data: { rows: [] } }) },
  address: { list: async () => ({ ok: true, data: { rows: [] } }), save: async () => ({ ok: true, data: {} }), remove: async () => ({ ok: true, data: {} }) },
  cart: { get: async () => ({ ok: true, data: { rows: [] } }), addItem: async () => ({ ok: true, data: { item: {} } }), updateItem: async () => ({ ok: true, data: { item: {} } }), removeItem: async () => ({ ok: true, data: {} }) },
  delivery: { options: async () => ({ ok: true, data: { warehouses: [], areas: [], slots: [] } }) },
  checkout: { quote: async () => ({ ok: true, data: {} }), createOrder: async () => ({ ok: true, data: {} }), preparePayment: async () => ({ ok: true, data: {} }) },
  orders: { list: async () => ({ ok: true, data: { rows: [] } }), get: async () => ({ ok: true, data: {} }), cancel: async () => ({ ok: true, data: {} }), confirm: async () => ({ ok: true, data: {} }) },
  refunds: { request: async () => ({ ok: true, data: {} }) },
  groups: { campaigns: async () => ({ ok: true, data: { rows: [] } }), quote: async () => ({ ok: true, data: {} }), create: async () => ({ ok: true, data: {} }), join: async () => ({ ok: true, data: {} }), get: async () => ({ ok: true, data: {} }) }
};

Module._load = function (request, parent, isMain) {
  if (request === '../../services' || request === '../../services/index') return servicesStub;
  return originalLoad.call(this, request, parent, isMain);
};

global.Page = (definition) => {
  pageDefinition.value = definition;
};
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
    setData(patch, callback) {
      Object.assign(this.data, patch);
      if (callback) callback.call(this);
    }
  });
  page.data.loggedIn = true;
  page.data.userType = 'c';
  page.data.businessStatus = '';

  await page.submitBusinessApplication({
    detail: {
      value: {
        companyName: '测试餐饮有限公司',
        unifiedCode: '91340100TEST000001',
        contactName: '采购员',
        contactPhone: '13900139000'
      }
    }
  });
  assert.equal(submitted.length, 1, '企业申请表单应提交一次');
  assert.equal(submitted[0].companyName, '测试餐饮有限公司');
  assert.equal(page.data.businessStatus, 'pending');
  assert.equal(page.data.profileSub, '企业采购申请审核中');
  assert.equal(page.data.businessSubmitting, false);

  await page.submitBusinessApplication({
    detail: {
      value: {
        companyName: '第二家公司',
        unifiedCode: '91340100TEST000002',
        contactName: '采购员',
        contactPhone: '123'
      }
    }
  });
  assert.equal(submitted.length, 1, '非法手机号不得调用企业申请接口');

  console.log('cloud mode business application test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
