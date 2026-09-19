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
const selectedEvents = [];
let listFails = true;
let listOverride = null;
let saveResult = { ok: true, data: { address: { _id: 'address-2' } } };
let defaultResult = { ok: true };
let removeResult = { ok: true };
let rows = [{ _id: 'address-1', name: '张三', phoneMasked: '138****0000', provinceCode: '440000', cityCode: '440300', districtCode: '440305', regionCode: '440305', detail: '科技园 1 号', tag: '公司', isDefault: false }];

const addressStub = {
  list: async () => listOverride ? listOverride() : listFails ? { ok: false, error: { message: '地址网络错误' } } : { ok: true, data: { rows } },
  save: async (payload) => { saveCalls.push(payload); return saveResult.ok ? { ...saveResult, data: { address: { _id: payload.id || 'address-2' } } } : saveResult; },
  setDefault: async (id) => { defaultCalls.push(id); if (!defaultResult.ok) return defaultResult; rows = rows.map((item) => ({ ...item, isDefault: item._id === id })); return { ok: true, data: { address: { _id: id, isDefault: true } } }; },
  remove: async (id) => { removeCalls.push(id); if (!removeResult.ok) return removeResult; rows = rows.filter((item) => item._id !== id); return { ok: true, data: { id } }; }
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
  chooseAddress: null,
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
    setData(patch, callback) { Object.assign(this.data, patch); if (callback) callback.call(this); },
    getOpenerEventChannel() { return { emit: (name, payload) => selectedEvents.push({ name, payload }) }; }
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
  page.openNew();
  page.chooseRegion({ detail: { value: ['广东省', '深圳市', '南山区'] } });
  assert.equal(page.data.form.regionLabel, '广东省 深圳市 南山区');
  assert.equal(page.data.form.provinceCode, '', 'picker labels must not be persisted as province codes');
  assert.equal(page.data.form.cityCode, '', 'picker labels must not be persisted as city codes');
  assert.equal(page.data.form.districtCode, '', 'picker labels must not be persisted as district codes');
  assert.equal(page.data.form.regionCode, '', 'picker labels must not become a delivery-matching code');
  page.data.form = { ...page.data.form, name: '测试收货人', phone: '13800138000', detail: '科技园 1 号' };
  const saveCountBeforeMissingCode = saveCalls.length;
  await page.saveAddress();
  assert.equal(saveCalls.length, saveCountBeforeMissingCode, 'an address without stable region codes must not be saved');
  assert.equal(toasts.at(-1).title, '请选择省市区');
  page.closeForm();
  page.selectAddress({ currentTarget: { dataset: { id: 'address-1' } } });
  assert.equal(selectedEvents.at(-1).name, 'addressSelected');
  assert.equal(selectedEvents.at(-1).payload.id, 'address-1');
  assert.deepEqual(defaultCalls, [], 'selecting for one checkout must not silently replace the default address');
  assert.equal(global.wx.backCount, 1);

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

  defaultResult = { ok: false, error: { message: '默认地址网络失败' } };
  await page.setDefault({ currentTarget: { dataset: { id: 'customer-address' } } });
  assert.equal(page.data.rows[1].isDefault, false, 'a failed default-address write must not change the visible row');
  assert.equal(page.data.actionBusyId, '', 'a failed default-address write must release the action lock');
  assert.equal(toasts.at(-1).title, '默认地址网络失败');
  defaultResult = { ok: true };

  removeResult = { ok: false, error: { message: '删除地址网络失败' } };
  await page.removeAddress('customer-address');
  assert.equal(page.data.rows.some((item) => item.id === 'customer-address'), true, 'a failed deletion must keep the address visible');
  assert.equal(page.data.actionBusyId, '', 'a failed deletion must release the action lock');
  assert.equal(toasts.at(-1).title, '删除地址网络失败');
  removeResult = { ok: true };

  page.openEdit({ currentTarget: { dataset: { id: 'saved-test-address' } } });
  assert.equal(page.data.form.name, originalRows[0].name);
  assert.equal(page.data.form.detail, originalRows[0].detail);
  page.data.form.phone = '13800138000';
  await page.saveAddress();
  assert.equal(saveCalls.at(-1).name, originalRows[0].name, 'saving an address must preserve the actual recipient');
  assert.equal(saveCalls.at(-1).detail, originalRows[0].detail, 'saving an address must preserve the actual address');
  assert(!Object.hasOwn(saveCalls.at(-1), 'displayName'), 'display-only fields must not be submitted');
  assert(!Object.hasOwn(saveCalls.at(-1), 'displayDetail'));

  const draftBeforeFailure = { ...page.data.form, id: '', name: '王五', phone: '13800138000', regionCode: '440305', detail: '失败后仍应保留' };
  page.setData({ formVisible: true, form: draftBeforeFailure });
  saveResult = { ok: false, error: { message: '保存网络失败' } };
  await page.saveAddress();
  assert.equal(page.data.formVisible, true);
  assert.deepEqual(page.data.form, draftBeforeFailure, 'save failure must retain the complete draft');
  assert.equal(toasts.at(-1).title, '保存网络失败');
  saveResult = { ok: true, data: { address: { _id: 'address-3' } } };

  global.wx.chooseAddress = ({ success }) => success({ userName: '赵六', telNumber: '', provinceName: '广东省', cityName: '深圳市', countyName: '南山区', detailInfo: '科技园三号' });
  page.importWechatAddress();
  assert.equal(page.data.formVisible, true);
  assert.equal(page.data.form.name, '赵六');
  assert.equal(page.data.importWarningText, '请补充有效的 11 位手机号、省市区编码');
  assert.equal(page.data.form.detail, '科技园三号');
  assert.equal(page.data.form.regionLabel, '广东省 深圳市 南山区', 'imported names may remain visible while the user completes the region picker');
  assert.equal(page.data.form.regionCode, '', 'region names must never be disguised as a stable region code');
  assert.equal(page.data.form.provinceCode, '');
  assert.equal(page.data.form.cityCode, '');
  assert.equal(page.data.form.districtCode, '');

  const toastCountBeforeCancel = toasts.length;
  global.wx.chooseAddress = ({ fail }) => fail({ errMsg: 'chooseAddress:fail cancel' });
  page.importWechatAddress();
  assert.equal(toasts.length, toastCountBeforeCancel, 'user cancellation must stay silent and preserve the form');

  global.wx.chooseAddress = undefined;
  page.importWechatAddress();
  assert.equal(toasts.at(-1).title, '当前微信版本不支持地址簿');

  const pendingLists = [];
  listOverride = () => new Promise((resolve) => pendingLists.push(resolve));
  const racePage = makePage();
  const olderLoad = racePage.loadAddresses();
  const newerLoad = racePage.loadAddresses();
  pendingLists[1]({ ok: true, data: { rows: [{ _id: 'new-address', name: '最新地址', phoneMasked: '138****0000', regionCode: '440305', detail: '新地址' }] } });
  await newerLoad;
  pendingLists[0]({ ok: true, data: { rows: [{ _id: 'old-address', name: '旧地址', phoneMasked: '138****0000', regionCode: '440305', detail: '旧地址' }] } });
  await olderLoad;
  assert.equal(racePage.data.rows[0].id, 'new-address', 'a late older response must not overwrite the newest address list');
  listOverride = null;

  const addressTemplate = fs.readFileSync(path.resolve(__dirname, '../miniapp/package-trade/pages/addresses/index.wxml'), 'utf8');
  assert(addressTemplate.includes('aria-label="{{selectMode ? \'选择 \' : \'\'}}{{item.displayName}} 的收货地址"'), 'only checkout selection mode may announce address rows as a selection action');
  assert(addressTemplate.includes('wx:if="{{selectMode}}" class="address-select"') && addressTemplate.includes('wx:else class="address-actions"'), 'checkout selection actions must be separate from editing and deletion');
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
