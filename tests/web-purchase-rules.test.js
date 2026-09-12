const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const collection = require('../miniapp/services/collection');

const source = fs.readFileSync(path.join(__dirname, '../web-preview/app.js'), 'utf8');
const apiSource = fs.readFileSync(path.join(__dirname, '../web-preview/services/api.js'), 'utf8');
assert(apiSource.includes("request('catalog.prices', { skuIds, channel: 'web' })"), 'web API adapter must request web-channel catalog prices');

async function flush(turns = 8) {
  for (let index = 0; index < turns; index += 1) await new Promise(resolve => setImmediate(resolve));
}

async function boot() {
  const nodes = new Map();
  const node = selector => {
    if (!nodes.has(selector)) nodes.set(selector, {
      innerHTML: '', textContent: '', dataset: {}, hidden: false, checked: true,
      classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
      addEventListener() {}, setAttribute() {}, querySelector: child => node(selector + child), querySelectorAll: () => []
    });
    return nodes.get(selector);
  };
  const priceCalls = [];
  const cartCalls = [];
  const product = {
    _id: 'product-rule', name: '采购规则商品', categoryName: '测试分类', coverMediaId: '',
    skus: [
      { _id: 'sku-public', specName: '公开规则规格', packageUnit: '10袋/箱', minOrderQuantity: 10, orderMultiple: 5 },
      { _id: 'sku-price', specName: '价格覆盖规格', packageUnit: '20袋/箱', minOrderQuantity: 6, orderMultiple: 3 }
    ]
  };
  const api = {
    config: { provider: 'cloudbase' },
    getSessionToken: () => '',
    catalog: {
      async listProducts() { return { ok: true, data: { rows: [product] } }; },
      async listCategories() { return { ok: true, data: { rows: [] } }; },
      async getProduct() { return { ok: true, data: { product, skus: product.skus, media: [] } }; },
      async listPrices(ids) {
        priceCalls.push([...ids]);
        return {
          ok: true,
          data: {
            rows: [
              { skuId: 'sku-public', amountCent: 2500, quantityTiers: [{ minQuantity: 10, maxQuantity: 19, amountCent: 2200 }, { minQuantity: 20, maxQuantity: null, amountCent: 2000 }] },
              { skuId: 'sku-price', amountCent: 3000, minOrderQuantity: 20, orderMultiple: 10, quantityTiers: [{ minQuantity: 20, maxQuantity: 29, amountCent: 1900 }, { minQuantity: 30, maxQuantity: null, amountCent: 1700 }] }
            ].filter(row => ids.includes(row.skuId))
          }
        };
      }
    },
    content: {
      async getBanners() { return { ok: true, data: { rows: [] } }; },
      async getHomeSections() { return { ok: true, data: { rows: [] } }; },
      async resolveMedia() { return { ok: true, data: { rows: [] } }; }
    },
    cart: {
      async updateItem(payload) { cartCalls.push({ ...payload }); return { ok: true, data: { item: { _id: 'cart-price', ...payload } } }; },
      async removeItem(id) { return { ok: true, data: { id, removed: true } }; }
    }
  };
  const context = vm.createContext({
    document: { querySelector: node, querySelectorAll: () => [], addEventListener() {}, body: { contains() { return true; } } },
    window: { MengshixianApi: api, MengshixianCollection: collection, scrollTo() {}, matchMedia: () => ({ matches: true }) },
    setInterval() {}, setTimeout() {}, clearTimeout() {}, console
  });
  vm.runInContext(source, context);
  await flush();
  return { context, nodes, api, priceCalls, cartCalls };
}

(async () => {
  const runtime = await boot();
  const { context, nodes, api, priceCalls, cartCalls } = runtime;
  assert.equal(priceCalls.length, 0, 'catalog.prices must not be requested before a logged-in session');
  assert.equal(vm.runInContext("products[0].skuOptions[0].minOrderQuantity", context), 10);
  assert.equal(vm.runInContext("products[0].skuOptions[0].orderMultiple", context), 5);
  assert.equal(vm.runInContext("normalizePurchaseQuantity(1, purchaseRuleFor(products[0]))", context), 10);
  assert.equal(vm.runInContext("normalizePurchaseQuantity(11, purchaseRuleFor(products[0]))", context), 15);
  assert.equal(vm.runInContext("normalizePurchaseQuantity(9, purchaseRuleFor(products[0]), 'down')", context), 0);
  assert.equal(vm.runInContext("normalizePurchaseQuantity(999, { minOrderQuantity: 10, orderMultiple: 10 })", context), 990, 'upper bound must remain a legal multiple at or below 999');
  assert.equal(vm.runInContext("normalizePurchaseQuantity(1, { minOrderQuantity: 700, orderMultiple: 600 })", context), 0, 'an impossible server rule must not produce an invalid client quantity');

  vm.runInContext('state.user.loggedIn = true', context);
  assert.equal(await vm.runInContext("loadRemoteCatalogPrices(['sku-public', 'sku-price'])", context), true);
  assert.deepEqual(priceCalls, [['sku-public', 'sku-price']]);
  assert.equal(vm.runInContext('canSeePrice()', context), true);
  assert.equal(vm.runInContext('unitPriceCentFor(products[0], 10)', context), 2200);
  assert.equal(vm.runInContext('unitPriceCentFor(products[0], 20)', context), 2000);

  vm.runInContext("state.selectedSpecs['product-rule'] = '价格覆盖规格'", context);
  assert.equal(vm.runInContext('purchaseRuleFor(products[0]).minOrderQuantity', context), 20, 'price rule must override the SKU minimum');
  assert.equal(vm.runInContext('purchaseRuleFor(products[0]).orderMultiple', context), 10, 'price rule must override the SKU multiple');
  assert.equal(vm.runInContext('normalizePurchaseQuantity(21, purchaseRuleFor(products[0]))', context), 30);
  assert.equal(vm.runInContext('unitPriceCentFor(products[0], 20)', context), 1900);
  assert.equal(vm.runInContext('unitPriceCentFor(products[0], 30)', context), 1700);

  vm.runInContext("openProduct('product-rule')", context);
  await flush();
  assert.equal(vm.runInContext('state.detailQty', context), 20);
  const detailHtml = nodes.get('#detailView').innerHTML;
  assert(detailHtml.includes('20 件起购 · 按 10 件倍数购买'));
  assert(detailHtml.includes('20-29 件'));
  assert(detailHtml.includes('¥19/件'));
  assert(detailHtml.includes('结算以服务端报价为准'));

  await vm.runInContext("addToCart('product-rule', 1)", context);
  assert.equal(vm.runInContext("state.remoteCartRows[0].quantity", context), 20, 'server-backed cart must keep the corrected quantity');
  assert.equal(cartCalls[0].quantity, 20, 'cart.upsert must receive the corrected absolute quantity');
  assert(nodes.get('#cartView').innerHTML.includes('20 件起购 · 按 10 件倍数购买'));
  assert(nodes.get('#cartView').innerHTML.includes('¥19'));

  api.cart.updateItem = async payload => { cartCalls.push({ ...payload }); return { ok: false, error: { code: 'REQUEST_FAILED', message: 'offline' } }; };
  await vm.runInContext("addToCart('product-rule', 10)", context);
  assert.equal(vm.runInContext("state.remoteCartRows[0].quantity", context), 20, 'failed cart mutation must roll back optimistic quantity');

  api.catalog.listPrices = async () => ({ ok: false, error: { code: 'UNAUTHORIZED', message: 'unauthorized' } });
  assert.equal(await vm.runInContext("loadRemoteCatalogPrices(['sku-public', 'sku-price'])", context), false);
  assert.equal(vm.runInContext('Object.keys(state.remotePrices).length', context), 0, 'failed authorization must remove requested cached prices');
  assert.equal(vm.runInContext('canSeePrice()', context), false);
  assert(vm.runInContext("priceHtml(products[0], 20)", context).includes('暂不可售'));

  console.log('web purchase rules: passed (SKU rules, price overrides, tiers, quantity correction, cart and auth failure)');
})().catch(error => { console.error(error); process.exitCode = 1; });
