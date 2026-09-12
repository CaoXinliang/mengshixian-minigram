const assert = require('assert/strict');
const fs = require('fs');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
const saveCalls = [];
const defaultCalls = [];
const removeCalls = [];
const toasts = [];
let listFails = true;
let rows = [{ _id: 'address-1', name: '张三', phoneMasked: '138****0000', provinceCode: '440000', cityCode: '440300', districtCode: '440305', regionCode: '440305', detail: '科技园 1 号', tag: '公司', isDefault: false }];

const addressStub = {
  list: async () => listFails ? { ok: false, error: { message: '地址网络错误' } } : { ok: true, data: { rows } },
  save: async (payload) => { saveCalls.push(payload); return { ok: true, data: { address: { _id: payload.id || 'address-2' } } }; },
  setDefault: async (id) => { defaultCalls.push(id); rows = rows.map((item) => ({ ...item, isDefault: item._id === id })); return { ok: true, data: { address: { _id: id, isDefault: true } } }; },
  remove: async (id) => { removeCalls.push(id); rows = rows.filter((item) => item._id !== id); return { ok: true, data: { id } }; }
};

Module._load = function (request, parent, isMain) {
  if (request === '../../../services' || request === '../../../services/index') return { address: addressStub };
  return originalLoad.call(this, request, parent, isMain);
};
global.Page = (definition) => { pageDefinition.value = definition; };
global.wx = {
  showToast: (payload) => toasts.push(payload),
  showModal: (payload) => payload.success({ confirm: true }),
  navigateBack: () => { global.wx.backCount += 1; },
  backCount: 0
};
try {
  require(path.resolve(__dirname, '../miniapp/package-trade/pages/addresses/index.js'));
} finally {
  Module._load = originalLoad;
  delete global.Page;
}

function makePage() {
  return Object.assign({}, pageDefinition.value, {
    data: JSON.parse(JSON.stringify(pageDefinition.value.data)),
    setData(patch, callback) { Object.assign(this.data, patch); if (callback) callback.call(this); }
  });
}

async function run() {
  const page = makePage();
  await page.onLoad({ select: '1' });
  assert.equal(page.data.status, 'error');
  assert.equal(page.data.errorText, '地址网络错误');
  listFails = false;
  await page.retry();
  assert.equal(page.data.status, 'ready');
  assert.equal(page.data.rows.length, 1);
  assert.equal(page.data.selectMode, true);

  page.openEdit({ currentTarget: { dataset: { id: 'address-1' } } });
  assert.equal(page.data.form.phone, '', 'the masked phone must never be submitted as plaintext');
  page.data.form = { ...page.data.form, phone: '13900139000', name: '李四', detail: '科技园 2 号' };
  await page.saveAddress();
  assert.equal(saveCalls[0].id, 'address-1');
  assert.equal(saveCalls[0].phone, '13900139000');
  assert.equal(saveCalls[0].regionCode, '440305');

  await page.setDefault({ currentTarget: { dataset: { id: 'address-1' } } });
  assert.deepEqual(defaultCalls, ['address-1'], 'setting the default must use the dedicated id-only action');
  assert.equal(page.data.rows[0].isDefault, true);

  page.deleteAddress({ currentTarget: { dataset: { id: 'address-1' } } });
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(removeCalls, ['address-1']);
  assert.equal(page.data.rows.length, 0);

  const serviceSource = fs.readFileSync(path.resolve(__dirname, '../miniapp/services/address.js'), 'utf8');
  const mainPageSource = fs.readFileSync(path.resolve(__dirname, '../miniapp/pages/index/index.js'), 'utf8');
  const appJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../miniapp/app.json'), 'utf8'));
  assert(serviceSource.includes("request('address.setDefault', { id })"));
  assert(mainPageSource.includes("if (type === 'address') return wx.navigateTo({ url: '/package-trade/pages/addresses/index' })"), 'the Mine address entry must navigate to the independent manager');
  assert(mainPageSource.includes("continuation.type === 'address'"), 'the address entry must still resume after login');
  assert(appJson.subpackages.some((item) => item.root === 'package-trade' && item.pages.includes('pages/addresses/index')));
  console.log('address management test: passed');
}

run().catch((error) => { console.error(error); process.exit(1); });
