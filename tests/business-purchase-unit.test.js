const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const { purchaseUnitLabel, purchaseRuleText, purchaseFailureText } = require('../miniapp/package-business/purchase-display');

test('purchase units come only from unambiguous SKU packaging, not net content or a guessed item unit', () => {
  for (const [value, unit] of [
    ['箱', '箱'], ['1盒', '盒'], [' 袋 ', '袋'], ['件', '件'],
    ['1件*30斤*15包', '件'], ['500g*10盒/箱', '箱'], ['kg', 'kg'],
    ['', ''], [undefined, ''], ['2盒', ''], ['500g', ''], ['称重', ''], ['包装待补充', '']
  ]) assert.equal(purchaseUnitLabel(value), unit, String(value));
  assert.equal(purchaseRuleText(3, 2, '箱'), '3 箱起购 · 按 2 箱倍数购买');
  assert.equal(purchaseRuleText(3, 2, ''), '起购数量 3 · 按 2 的倍数购买');
  assert.equal(purchaseFailureText({ code: 'MIN_ORDER_QUANTITY_NOT_MET', message: '该规格 3 件起购。' }), '未达到该规格的起购数量');
  assert.equal(purchaseFailureText({ message: '商品已下架' }), '商品已下架');
});

const skuUnits = ['箱', '盒', '袋', '件', '', '1件*30斤*15包'];
const products = [{
  _id: 'product-1', name: '采购商品',
  skus: skuUnits.map((packageUnit, index) => ({
    _id: `sku-${index}`, packageUnit, specName: '500g', minOrderQuantity: 3, orderMultiple: 2
  }))
}];
let batchResponse = { ok: true, data: { addedItems: [], invalidItems: [{ id: 'saved-0', skuId: 'sku-0', code: 'MIN_ORDER_QUANTITY_NOT_MET', message: '该规格 3 件起购。' }] } };
const calls = [];
const services = {
  auth: { getMe: async () => ({ ok: true, data: { user: { _id: 'buyer-1', userType: 'b', businessStatus: 'approved', organizationId: 'org-1', status: 'active' } } }) },
  catalog: {
    listAllProducts: async () => ({ ok: true, data: { rows: products } }),
    listPrices: async () => ({ ok: true, data: { rows: skuUnits.map((_, index) => ({ skuId: `sku-${index}`, amountCent: 1800, minOrderQuantity: 3, orderMultiple: 2 })) } })
  },
  frequent: {
    listAll: async () => ({ ok: true, data: { rows: skuUnits.map((_, index) => ({ _id: `saved-${index}`, skuId: `sku-${index}`, quantity: 4 })) } }),
    batchAddToCart: async (payload) => { calls.push(payload); return batchResponse; }
  }
};
const definitions = [];
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === '../../../services/index') return services;
  return originalLoad.call(this, request, parent, isMain);
};
global.Page = (definition) => definitions.push(definition);
global.wx = { showToast() {} };
try {
  require('../miniapp/package-business/pages/frequent/index');
  require('../miniapp/package-business/pages/inquiry-create/index');
} finally {
  Module._load = originalLoad;
  delete global.Page;
}
const makePage = (definition) => Object.assign({}, definition, {
  data: JSON.parse(JSON.stringify(definition.data)),
  setData(patch) { Object.assign(this.data, patch); }
});

for (const [name, index] of [['frequent', 0], ['inquiry-create', 1]]) {
  test(`${name} displays the server SKU packaging and preserves purchase quantities`, async () => {
    const page = makePage(definitions[index]);
    await page.load();
    assert.equal(page.data.status, 'ready');
    assert.deepEqual(page.data.rows.map((row) => row.purchaseRuleText), [
      '3 箱起购 · 按 2 箱倍数购买', '3 盒起购 · 按 2 盒倍数购买',
      '3 袋起购 · 按 2 袋倍数购买', '3 件起购 · 按 2 件倍数购买',
      '起购数量 3 · 按 2 的倍数购买', '3 件起购 · 按 2 件倍数购买'
    ]);
    assert(page.data.rows.every((row) => row.quantity === 4 && row.minOrderQuantity === 3 && row.orderMultiple === 2));
    const template = fs.readFileSync(path.resolve(__dirname, `../miniapp/package-business/pages/${name}/index.wxml`), 'utf8');
    assert(template.includes('{{item.purchaseRuleText}}'), 'the rendered rules must consume the SKU-aware label');
    assert.doesNotMatch(template, /\{\{item\.(?:minOrderQuantity|orderMultiple)\}\}\s*件/);
  });
}

test('frequent maps both batch-item and whole-request minimum-quantity errors without inventing units', async () => {
  const page = makePage(definitions[0]);
  await page.load();
  await page.batchAdd();
  assert.equal(page.data.invalidItems[0].reason, '未达到该规格的起购数量');
  assert.deepEqual(calls[0].items.map((item) => item.quantity), [4, 4, 4, 4, 4, 4]);
  batchResponse = { ok: false, error: { code: 'MIN_ORDER_QUANTITY_NOT_MET', message: '该规格 3 件起购。' } };
  await page.batchAdd();
  assert.equal(page.data.invalidItems[0].reason, '未达到该规格的起购数量');
});
