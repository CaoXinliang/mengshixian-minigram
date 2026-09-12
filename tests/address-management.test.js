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

  rows = [
    { _id: 'saved-test-address', name: '演示用户', phoneMasked: '138****0000', regionCode: '440305', detail: '梦食鲜演示收货点（非客户地址）', tag: '演示', isDefault: false },
    { _id: 'customer-address', name: '演示用户服务中心', phoneMasked: '139****0000', regionCode: '440305', detail: '演示路 8 号', tag: '公司', isDefault: false }
  ];
  const originalRows = JSON.parse(JSON.stringify(rows));
  await page.retry();
  const savedTestAddress = page.data.rows[0];
  assert.equal(savedTestAddress.displayName, '收货人');
  assert.equal(savedTestAddress.displayDetail, '已保存的收货地址');
  assert.equal(savedTestAddress.displayTag, '', 'the exact demo tag must not leak into the delivery UI');
  assert.equal(savedTestAddress.name, originalRows[0].name, 'display labels must not replace stored form values');
  assert.equal(savedTestAddress.detail, originalRows[0].detail);
  assert.equal(page.data.rows[1].displayName, originalRows[1].name, 'only the exact test recipient marker may be replaced');
  assert.equal(page.data.rows[1].displayDetail, originalRows[1].detail, 'normal customer addresses containing 演示 must stay intact');
  assert.equal(page.data.rows[1].displayTag, originalRows[1].tag, 'real customer address tags must stay visible');
  assert.deepEqual(rows, originalRows, 'normalizing list labels must not mutate API data');

  page.openEdit({ currentTarget: { dataset: { id: 'saved-test-address' } } });
  assert.equal(page.data.form.name, originalRows[0].name);
  assert.equal(page.data.form.detail, originalRows[0].detail);
  page.data.form.phone = '13800138000';
  await page.saveAddress();
  assert.equal(saveCalls.at(-1).name, originalRows[0].name, 'saving an address must preserve the actual recipient');
  assert.equal(saveCalls.at(-1).detail, originalRows[0].detail, 'saving an address must preserve the actual address');
  assert(!Object.hasOwn(saveCalls.at(-1), 'displayName'), 'display-only fields must not be submitted');
  assert(!Object.hasOwn(saveCalls.at(-1), 'displayDetail'));

  const addressTemplate = fs.readFileSync(path.resolve(__dirname, '../miniapp/package-trade/pages/addresses/index.wxml'), 'utf8');
  assert(addressTemplate.includes('aria-label="选择 {{item.displayName}} 的收货地址"'));
  assert(addressTemplate.includes('<text>{{item.displayName}}</text>') && addressTemplate.includes('<text>{{item.displayDetail}}</text>'), 'address rows must use presentation labels');
  assert(addressTemplate.includes('wx:if="{{item.displayTag}}"') && addressTemplate.includes('{{item.displayTag}}'), 'address rows must use the sanitized presentation tag');
  assert(addressTemplate.includes('value="{{form.name}}"') && addressTemplate.includes('value="{{form.detail}}"'), 'editable values must remain the raw address fields');

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
