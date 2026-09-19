const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
const submitted = [];
const uploaded = [];

const servicesStub = {
  config: { provider: 'cloudbase', cloudFunctionName: 'api', cloudEnvId: 'test-env', priceFieldsNeverFallback: true },
  auth: {
    login: async () => ({ ok: true, data: { user: { userType: 'c', businessStatus: '' } } }),
    getMe: async () => ({ ok: true, data: { user: { userType: 'c', businessStatus: '' } } }),
    applyBusiness: async (payload) => { submitted.push(payload); return { ok: true, data: { application: { _id: 'application-1' } } }; },
    uploadBusinessMedia: async (payload) => { uploaded.push(payload); return { ok: true, data: { mediaId: `media-${payload.kind}-uploaded` } }; }
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
global.wx = {
  showToast: () => {},
  chooseMedia: ({ success }) => success({ tempFiles: [{ tempFilePath: 'wxfile://storefront.jpg', size: 12 }] }),
  getFileSystemManager: () => ({ readFile: ({ success }) => success({ data: Buffer.from('test-image').toString('base64') }) })
};

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

  page.chooseBusinessMedia({ currentTarget: { dataset: { kind: 'storefront' } } });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(uploaded.length, 1, '门头图片必须先上传为私有媒体资源');
  assert.equal(uploaded[0].kind, 'storefront');
  assert.equal(page.data.businessStorefrontMediaId, 'media-storefront-uploaded');

  await page.submitBusinessApplication({
    detail: {
      value: {
        companyName: '测试餐饮有限公司',
        storeName: '测试餐厅南山店',
        storefrontMediaId: 'media-storefront-1',
        storeAddress: '深圳市南山区测试路1号',
        mainBusinessType: 'restaurant',
        unifiedCode: '91340100TEST000001',
        contactName: '采购员',
        contactPhone: '13900139000',
        businessLicenseMediaId: 'media-license-1',
        salesCode: 'SALES-001',
        chainEnabled: 'true'
      }
    }
  });
  assert.equal(submitted.length, 1, '企业申请表单应提交一次');
  assert.equal(submitted[0].companyName, '测试餐饮有限公司');
  assert.equal(submitted[0].storeName, '测试餐厅南山店');
  assert.equal(submitted[0].storefrontMediaId, 'media-storefront-1');
  assert.equal(submitted[0].mainBusinessType, 'restaurant');
  assert.equal(submitted[0].chainEnabled, true);
  assert(submitted[0].idempotencyKey, 'enterprise application must include a retry-safe idempotency key');
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
