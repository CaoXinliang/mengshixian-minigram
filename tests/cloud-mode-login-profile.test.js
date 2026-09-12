const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
const storage = {};
let getMeResult = { ok: true, data: { user: { userType: 'b', businessStatus: 'approved', organizationId: 'org-1', status: 'active' } } };

const servicesStub = {
  config: { provider: 'cloudbase', cloudFunctionName: 'api', cloudEnvId: 'test-env', priceFieldsNeverFallback: true },
  auth: {
    login: async () => ({ ok: true, data: { user: { userType: 'b', businessStatus: 'approved', organizationId: 'org-1', status: 'active' } } }),
    getMe: async () => getMeResult,
    applyBusiness: async () => ({ ok: true, data: {} })
  },
  catalog: { getHome: async () => ({ ok: true, data: { rows: [] } }), listCategories: async () => ({ ok: true, data: { rows: [] } }), listProducts: async () => ({ ok: true, data: { rows: [] } }), getProduct: async () => ({ ok: true, data: { skus: [] } }) },
  content: { getBanners: async () => ({ ok: true, data: { rows: [] } }), getHomeSections: async () => ({ ok: true, data: { rows: [] } }), resolveMedia: async () => ({ ok: true, data: { rows: [] } }) },
  address: { list: async () => ({ ok: true, data: { rows: [] } }), save: async () => ({ ok: true, data: {} }), remove: async () => ({ ok: true, data: {} }) },
  cart: { get: async () => ({ ok: true, data: { rows: [] } }), getAll: async () => ({ ok: true, data: { rows: [] } }), addItem: async () => ({ ok: true, data: { item: {} } }), updateItem: async () => ({ ok: true, data: { item: {} } }), removeItem: async () => ({ ok: true, data: {} }) },
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
  setStorageSync: (key, value) => { storage[key] = String(value); },
  getStorageSync: (key) => storage[key] || '',
  removeStorageSync: (key) => { delete storage[key]; }
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
  page.data.agreed = true;
  await page.completeLogin({ detail: { errMsg: 'getPhoneNumber:ok' } });
  assert.equal(page.data.loggedIn, true);
  assert.equal(page.data.userType, 'b');
  assert.equal(page.data.businessStatus, 'approved');
  assert.equal(page.data.profileTitle, '梦食鲜商家');
  assert.equal(page.data.profileSub, '商家采购账号');
  assert.equal(storage['mengshixian_login_agreed'], '1');

  page.data.page = 'mealIdea';
  page.data.activeTab = 'frequent';
  page.data.detailReturnPage = 'mealIdea';
  page.data.selectedMealIdea = { id: 'oden' };
  await page.refreshRemoteIdentity();
  assert.equal(page.data.page, 'home', '已审核 B 用户不得滞留在 C 端菜品页');
  assert.equal(page.data.activeTab, 'home');
  assert.equal(page.data.detailReturnPage, 'home');
  assert.equal(page.data.selectedMealIdea, null);

  getMeResult = { ok: true, data: { user: { userType: 'c', businessStatus: 'pending', organizationId: '', status: 'active' } } };
  await page.refreshRemoteIdentity();
  assert.equal(page.data.isApprovedBusiness, false);
  assert.equal(page.data.shortcutLabel, '吃什么');
  assert.equal(page.data.profileSub, '企业采购申请审核中');

  getMeResult = { ok: true, data: { user: { userType: 'b', businessStatus: 'approved', organizationId: '', status: 'active' } } };
  await page.refreshRemoteIdentity();
  assert.equal(page.data.isApprovedBusiness, false, '缺少企业归属的异常 B 用户不得开放采购入口');

  page.data.loggedIn = false;
  page.data.userType = '';
  page.data.profileTitle = '梦食鲜顾客';
  getMeResult = { ok: true, data: { user: { userType: 'b', businessStatus: 'approved', organizationId: 'org-1', status: 'active' } } };
  await page.restoreRemoteSession();
  assert.equal(page.data.loggedIn, true);
  assert.equal(page.data.userType, 'b');
  assert.equal(page.data.profileTitle, '梦食鲜商家');

  let resolveDelayedIdentity;
  getMeResult = new Promise((resolve) => { resolveDelayedIdentity = resolve; });
  const delayedRefresh = page.refreshRemoteIdentity();
  page.performLogout({ silent: true });
  resolveDelayedIdentity({ ok: true, data: { user: { userType: 'b', businessStatus: 'approved', organizationId: 'org-1', status: 'active' } } });
  await delayedRefresh;
  assert.equal(page.data.loggedIn, false, '退出后的旧身份响应不得把用户反向登录');
  assert.equal(page.data.isApprovedBusiness, false);

  page.applyRemoteIdentity({ userType: 'b', businessStatus: 'approved', organizationId: 'org-1', status: 'active' });
  storage['mengshixian_login_agreed'] = '1';
  getMeResult = { ok: false, error: { code: 'AUTH_ACCOUNT_DISABLED', message: '用户已停用' } };
  await page.refreshRemoteIdentity();
  assert.equal(page.data.loggedIn, false, '停用账号应静默退出本地会话');
  assert.equal(page.data.isApprovedBusiness, false);
  assert.equal(page.data.organizationId, '');
  assert.equal(storage['mengshixian_login_agreed'], undefined);

  page.performLogout({ silent: true });
  assert.equal(storage['mengshixian_login_agreed'], undefined);
  console.log('cloud mode login profile test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
