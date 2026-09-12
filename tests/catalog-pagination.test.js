const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const calls = [];
const productRows = Array.from({ length: 230 }, (_, index) => ({ _id: `product-${index + 1}` }));
const categoryRows = Array.from({ length: 205 }, (_, index) => ({ _id: `category-${index + 1}` }));
let failProductPage = 0;

Module._load = function (request, parent, isMain) {
  if (request === './request' && parent && /services[\\/]catalog\.js$/.test(parent.filename)) {
    return {
      request: async (action, payload) => {
        calls.push({ action, payload });
        const source = action === 'catalog.products' ? productRows : categoryRows;
        if (action === 'catalog.products' && payload.page === failProductPage) {
          return { ok: false, data: null, error: { code: 'NETWORK', message: '网络错误' }, requestId: 'failed-page' };
        }
        const start = (payload.page - 1) * payload.pageSize;
        return { ok: true, data: { rows: source.slice(start, start + payload.pageSize), total: source.length, page: payload.page, pageSize: payload.pageSize }, requestId: `${action}-${payload.page}` };
      }
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

let catalog;
try {
  catalog = require(path.resolve(__dirname, '../miniapp/services/catalog.js'));
} finally {
  Module._load = originalLoad;
}

async function run() {
  const products = await catalog.listAllProducts({ keyword: '冻品' });
  assert.equal(products.ok, true);
  assert.equal(products.data.rows.length, 230, 'all product pages must be returned');
  assert.deepEqual(calls.filter((item) => item.action === 'catalog.products').map((item) => item.payload.page), [1, 2, 3]);
  assert(calls.filter((item) => item.action === 'catalog.products').every((item) => item.payload.keyword === '冻品'));

  const categories = await catalog.listAllCategories();
  assert.equal(categories.ok, true);
  assert.equal(categories.data.rows.length, 205, 'all category pages must be returned');
  assert.deepEqual(calls.filter((item) => item.action === 'catalog.categories').map((item) => item.payload.page), [1, 2, 3]);

  failProductPage = 2;
  const failure = await catalog.listAllProducts();
  assert.equal(failure.ok, false, 'a failed later page must fail the complete catalog read');
  assert.equal(failure.data, null, 'partial product pages must not be exposed as a complete catalog');
  console.log('catalog pagination test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
