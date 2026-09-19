const assert = require('assert/strict');
const path = require('path');

const { createCatalogBrowse } = require(path.resolve(__dirname, '../miniapp/modules/catalog-browse'));

async function run() {
  const browse = createCatalogBrowse({
    cloudMode: false,
    listProducts: async () => ({ ok: true, data: { rows: [], total: 0 } })
  });
  const groups = [
    { id: 'seafood', label: '水产', categories: ['海鲜水产', '鱼虾类'] },
    { id: 'meat', label: '肉类', categories: ['牛肉类'] }
  ];
  const products = [
    { id: 'prawn', name: '厄瓜多尔白虾', category: '海鲜水产' },
    { id: 'fish', name: '深海鳕鱼', category: '鱼虾类' },
    { id: 'beef', name: '原切牛肉', category: '牛肉类' }
  ];

  const view = browse.deriveView({
    current: { categoryGroup: 'seafood', category: '全部', query: '' },
    next: { query: '虾' },
    groups,
    products
  });

  assert.equal(view.categoryGroup, 'seafood');
  assert.equal(view.category, '全部');
  assert.equal(view.query, '虾');
  assert.equal(view.activeGroup.id, 'seafood');
  assert.deepEqual(view.products.map((item) => item.id), ['prawn', 'fish']);
  assert.deepEqual(view.subCategories, ['全部', '海鲜水产', '鱼虾类', '牛肉类']);
  assert.deepEqual(view.requestState, { loading: false, error: '' });

  const pending = new Map();
  const appliedRows = [];
  const requestBrowse = createCatalogBrowse({
    cloudMode: true,
    pageSize: 100,
    listProducts: ({ keyword }) => new Promise((resolve) => pending.set(keyword, resolve)),
    onRows: (rows) => {
      appliedRows.push(...rows);
      return { incoming: rows, products: rows };
    }
  });
  const oldRequest = requestBrowse.load({ keyword: '旧筛选' }, { scopeToken: 7, visible: true });
  const newRequest = requestBrowse.load({ keyword: '新筛选' }, { scopeToken: 7, visible: true });
  pending.get('旧筛选')({ ok: true, data: { rows: [{ _id: 'old' }], total: 1 } });
  assert.equal(await oldRequest, false, '迟到的旧筛选请求必须被丢弃');
  assert.deepEqual(appliedRows, []);
  pending.get('新筛选')({ ok: true, data: { rows: [{ _id: 'new' }], total: 1 } });
  assert.equal(await newRequest, true);
  assert.deepEqual(appliedRows.map((item) => item._id), ['new']);

  let shouldFail = true;
  let retryCalls = 0;
  const retainedRows = [{ _id: 'kept' }];
  const publishedStates = [];
  const retryBrowse = createCatalogBrowse({
    cloudMode: true,
    listProducts: async () => {
      retryCalls += 1;
      return shouldFail
        ? { ok: false }
        : { ok: true, data: { rows: [{ _id: 'recovered' }], total: 1 } };
    },
    onRows: (rows) => {
      retainedRows.push(...rows);
      return { incoming: rows, products: retainedRows };
    },
    onState: (state) => publishedStates.push(state)
  });
  assert.equal(await retryBrowse.load({ categoryId: 'seafood' }, { scopeToken: 9, visible: true }), false);
  assert.deepEqual(retainedRows.map((item) => item._id), ['kept'], '续载失败不能清空已有商品');
  assert.deepEqual(publishedStates.at(-1), { loading: false, error: '商品加载失败，请重试' });

  shouldFail = false;
  assert.equal(await retryBrowse.load({ categoryId: 'seafood' }, { scopeToken: 9, visible: true }), true);
  assert.deepEqual(retainedRows.map((item) => item._id), ['kept', 'recovered']);
  assert.deepEqual(publishedStates.at(-1), { loading: false, error: '' });
  const completedCalls = retryCalls;
  assert.equal(await retryBrowse.load({ categoryId: 'seafood' }, { scopeToken: 9, visible: true }), true);
  assert.equal(retryCalls, completedCalls, '完整加载过的相同筛选不能重复请求');

  console.log('catalog browse module test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
