const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const collection = require('../miniapp/services/collection');
const source = fs.readFileSync(path.join(__dirname, '../web-preview/app.js'), 'utf8');

async function boot(rows, failPage = 0) {
  const nodes = new Map();
  const node = selector => {
    if (!nodes.has(selector)) nodes.set(selector, {
      innerHTML: '', textContent: '', dataset: {}, hidden: false,
      classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
      addEventListener() {}, querySelector: child => node(selector + child), querySelectorAll: () => []
    });
    return nodes.get(selector);
  };
  const batches = [];
  const pages = [];
  const api = {
    config: { provider: 'cloudbase' },
    catalog: {
      async listProducts({ page, pageSize }) {
        pages.push(page);
        return page === failPage ? { ok: false } : { ok: true, data: { rows: rows.slice((page - 1) * pageSize, page * pageSize) } };
      },
      async listCategories() { return { ok: true, data: { rows: [] } }; }
    },
    content: {
      async getBanners() { return { ok: true, data: { rows: [] } }; },
      async getHomeSections() { return { ok: true, data: { rows: [] } }; },
      async resolveMedia(ids) {
        batches.push(ids.length);
        return { ok: true, data: { rows: ids.map(_id => ({ _id, url: 'https://example.test/' + _id + '.jpg' })) } };
      }
    }
  };
  const context = vm.createContext({
    document: { querySelector: node, querySelectorAll: () => [], addEventListener() {} },
    window: { MengshixianApi: api, MengshixianCollection: collection },
    setInterval() {}, setTimeout() {}, clearTimeout() {}, console
  });
  vm.runInContext(source, context);
  for (let i = 0; i < 8; i++) await new Promise(resolve => setImmediate(resolve));
  return { context, nodes, batches, pages };
}

(async () => {
  const rows = Array.from({ length: 205 }, (_, i) => ({
    _id: 'remote-' + i, name: '商品' + i, categoryName: '海鲜水产', coverMediaId: 'media-' + i,
    skus: [{ _id: 'sku-' + i, specName: '500克', packageUnit: '10袋/箱' }]
  }));
  const loaded = await boot(rows);
  assert.equal(vm.runInContext('products.length', loaded.context), 50);
  assert.deepEqual(loaded.pages, [1]);
  assert.deepEqual(loaded.batches, [50]);
  assert(loaded.nodes.get('#dealList').innerHTML.includes('remote-0'));
  assert(loaded.nodes.get('#dealList').innerHTML.includes('https://example.test/media-0.jpg'));
  assert(!loaded.nodes.get('#dealList').innerHTML.includes('../assets/products/https:'));
  const empty = await boot([]);
  assert.equal(vm.runInContext('products.length', empty.context), 0);
  assert.equal(empty.nodes.get('#dealList').innerHTML, '');
  const failed = await boot(rows, 1);
  assert.equal(vm.runInContext('products.length', failed.context), 0, 'partial results must not replace the catalog');
  assert.equal(failed.nodes.get('#dealList').innerHTML, '');
  assert(failed.nodes.get('.toast').textContent.includes('加载失败'));
  console.log('web remote runtime: passed (50-product display boundary, string IDs, media batches, empty and failed pages)');
})().catch(error => { console.error(error); process.exitCode = 1; });
