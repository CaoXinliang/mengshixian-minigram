const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const collection = require('../miniapp/services/collection');
const source = fs.readFileSync(path.join(__dirname, '../web-preview/app.js'), 'utf8');

async function boot(rows, failPage = 0, failDetail = false) {
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
  const detailCalls = [];
  const api = {
    config: { provider: 'cloudbase' },
    getSessionToken: () => '',
    catalog: {
      async listProducts({ page, pageSize }) {
        pages.push(page);
        return page === failPage ? { ok: false } : { ok: true, data: { rows: rows.slice((page - 1) * pageSize, page * pageSize) } };
      },
      async listCategories() { return { ok: true, data: { rows: [] } }; },
      async getProduct(productId) {
        detailCalls.push(productId);
        if (failDetail) return { ok: false, error: { code: 'DETAIL_FAILED', message: '详情读取失败' } };
        return {
          ok: true,
          data: {
            product: { ...rows.find(item => item._id === productId), brand: '测试品牌', origin: '赣州', frozenTemperature: '-18℃', shelfLifeDays: 365 },
            skus: [
              { _id: 'detail-sku-1', specName: '500克', packageUnit: '10袋/箱', netWeight: '500', weightUnit: '克', mediaIds: ['sku-media'] },
              { _id: 'detail-sku-2', specName: '1千克', packageUnit: '5袋/箱' }
            ],
            media: [
              { mediaAssetId: 'detail-image', mediaType: 'image', role: 'detail', sort: 1 },
              { mediaAssetId: 'detail-video', mediaType: 'video', role: 'detail', sort: 2 },
              { mediaAssetId: 'video-poster', mediaType: 'image', role: 'video_cover', sort: 3 }
            ]
          }
        };
      }
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
    window: { MengshixianApi: api, MengshixianCollection: collection, scrollTo() {}, matchMedia: () => ({ matches: true }) },
    setInterval() {}, setTimeout() {}, clearTimeout() {}, console
  });
  vm.runInContext(source, context);
  for (let i = 0; i < 8; i++) await new Promise(resolve => setImmediate(resolve));
  return { context, nodes, batches, pages, detailCalls };
}

(async () => {
  const rows = Array.from({ length: 205 }, (_, i) => ({
    _id: 'remote-' + i, name: '商品' + i, categoryName: '海鲜水产', coverMediaId: 'media-' + i,
    skus: [{ _id: 'sku-' + i, specName: '500克', packageUnit: '10袋/箱' }]
  }));
  const loaded = await boot(rows);
  assert.equal(vm.runInContext('products.length', loaded.context), 205);
  assert.deepEqual(loaded.pages, [1, 2, 3]);
  assert.deepEqual(loaded.batches, [50, 50, 50, 50, 5]);
  assert(loaded.nodes.get('#dealList').innerHTML.includes('remote-0'));
  assert(loaded.nodes.get('#dealList').innerHTML.includes('https://example.test/media-0.jpg'));
  assert(!loaded.nodes.get('#dealList').innerHTML.includes('../assets/products/https:'));
  vm.runInContext("openProduct('remote-0')", loaded.context);
  for (let i = 0; i < 6; i++) await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(loaded.detailCalls, ['remote-0']);
  assert.equal(vm.runInContext('products[0].skuOptions.length', loaded.context), 2);
  assert.equal(vm.runInContext('products[0].brand', loaded.context), '测试品牌');
  assert.equal(vm.runInContext('products[0].detailImages[0]', loaded.context), 'https://example.test/detail-image.jpg');
  assert.equal(vm.runInContext('products[0].video', loaded.context), 'https://example.test/detail-video.jpg');
  assert(loaded.nodes.get('#detailView').innerHTML.includes('测试品牌'));
  assert(loaded.nodes.get('#detailView').innerHTML.includes('detail-image.jpg'));
  assert(loaded.nodes.get('#detailView').innerHTML.includes('<video'));
  const detailFailed = await boot(rows, 0, true);
  vm.runInContext("openProduct('remote-0')", detailFailed.context);
  for (let i = 0; i < 4; i++) await new Promise(resolve => setImmediate(resolve));
  assert(detailFailed.nodes.get('#detailView').innerHTML.includes('商品详情加载失败'));
  assert(detailFailed.nodes.get('#detailView').innerHTML.includes('data-action="retry-detail"'));
  const empty = await boot([]);
  assert.equal(vm.runInContext('products.length', empty.context), 0);
  assert.equal(empty.nodes.get('#dealList').innerHTML, '');
  const failed = await boot(rows, 1);
  assert.equal(vm.runInContext('products.length', failed.context), 0, 'partial results must not replace the catalog');
  assert(failed.nodes.get('#dealList').innerHTML.includes('商品加载失败'));
  assert(failed.nodes.get('.toast').textContent.includes('加载失败'));
  assert(failed.nodes.get('#dealList').innerHTML.includes('data-action="retry-catalog"'));
  console.log('web remote runtime: passed (complete pagination, detail SKU/media, loading, retry, empty and failed pages)');
})().catch(error => { console.error(error); process.exitCode = 1; });
