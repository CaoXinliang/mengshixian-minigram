const assert = require('assert/strict');
const { chunkUnique, fetchRemotePages, uniqueValues } = require('../miniapp/services/collection');

assert.deepStrictEqual(uniqueValues(['a', 'a', '', null, 'b']), ['a', 'b']);
assert.deepStrictEqual(chunkUnique(['a', 'b', 'c', 'c'], 2), [['a', 'b'], ['c']]);

let pageCalls = 0;
fetchRemotePages(async ({ page, pageSize }) => {
  pageCalls += 1;
  const start = (page - 1) * pageSize;
  const rows = start < 230 ? Array.from({ length: Math.min(pageSize, 230 - start) }, (_, index) => start + index + 1) : [];
  return { ok: true, data: { rows } };
}, { pageSize: 100, maxPages: 20 }).then((result) => {
  assert.equal(result.ok, true);
  assert.equal(result.rows.length, 230);
  assert.equal(pageCalls, 3);
  return fetchRemotePages(async () => ({ ok: false, data: null }), { pageSize: 100 }).then((failure) => {
    assert.equal(failure.ok, false);
    assert.equal(failure.rows.length, 0);
    return fetchRemotePages(async () => ({ ok: true, data: { rows: Array.from({ length: 100 }, () => ({})), total: 250 } }), { pageSize: 100, maxPages: 2 }).then((limited) => {
      assert.equal(limited.ok, false, 'a truncated paged result must not be treated as complete');
      assert.equal(limited.code, 'REMOTE_PAGE_LIMIT_REACHED');
      console.log('collection helper test: passed');
    });
  });
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
