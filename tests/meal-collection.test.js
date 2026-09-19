const assert = require('assert/strict');
const { loadCompleteMealCollection } = require('../miniapp/modules/meal-collection');

function ok(rows, total, page, pageSize) {
  return { ok: true, data: { rows, total, page, pageSize } };
}

async function run() {
  const pages = [];
  const complete = await loadCompleteMealCollection(async ({ page, pageSize }) => {
    pages.push(page);
    const rows = page === 1
      ? [{ _id: 'meal-1' }, { _id: 'meal-2' }]
      : [{ _id: 'meal-3' }];
    return ok(rows, 3, page, pageSize);
  }, { pageSize: 2 });
  assert.deepEqual(pages, [1, 2], '总数超过第一页时必须继续加载后续页');
  assert.deepEqual(complete.rows.map(item => item._id), ['meal-1', 'meal-2', 'meal-3']);
  assert.equal(complete.total, 3);
  assert.equal(complete.pageCount, 2);

  let shortPageCalls = 0;
  const shortPage = await loadCompleteMealCollection(async ({ page, pageSize }) => {
    shortPageCalls += 1;
    return ok(page === 1 ? [{ _id: 'only-meal' }] : [], undefined, page, pageSize);
  }, { pageSize: 2 });
  assert.equal(shortPageCalls, 1, '没有total时应以短页作为完整集合边界');
  assert.deepEqual(shortPage.rows.map(item => item._id), ['only-meal']);

  const empty = await loadCompleteMealCollection(async ({ page, pageSize }) => ok([], 0, page, pageSize), { pageSize: 2 });
  assert.deepEqual(empty.rows, [], '权威成功空集合必须作为完整结果返回');
  assert.equal(empty.complete, true);

  await assert.rejects(
    () => loadCompleteMealCollection(async ({ page, pageSize }) => ok([{ _id: 'same-meal' }], 3, page, pageSize), { pageSize: 1 }),
    error => error && error.code === 'MEAL_COLLECTION_REPEATED_PAGE',
    '接口重复返回同一页时必须中止，不能无限请求或把不完整集合当权威结果'
  );

  await assert.rejects(
    () => loadCompleteMealCollection(async ({ page, pageSize }) => ok([{ _id: 'only-first' }], 3, page, pageSize), { pageSize: 2 }),
    error => error && error.code === 'MEAL_COLLECTION_INCOMPLETE',
    '接口声明还有数据却提前返回短页时不能把残缺列表当权威集合'
  );

  await assert.rejects(
    () => loadCompleteMealCollection(async () => ({ ok: false, error: { code: 'NETWORK_ERROR' } }), { pageSize: 2 }),
    error => error && error.code === 'MEAL_COLLECTION_REQUEST_FAILED',
    '任意分页失败必须让整次集合刷新失败'
  );

  await assert.rejects(
    () => loadCompleteMealCollection(async ({ page, pageSize }) => ok([{ _id: `meal-${page}` }], 5, page, pageSize), { pageSize: 1, maxPages: 2 }),
    error => error && error.code === 'MEAL_COLLECTION_PAGE_LIMIT',
    '超过安全页数仍未读完整时必须失败，不能静默截断'
  );

  console.log('meal collection: passed');
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
