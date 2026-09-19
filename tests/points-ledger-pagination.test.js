const assert = require('assert/strict');
const { fetchRemotePages } = require('../miniapp/services/collection');

async function run() {
  for (const total of [undefined, null, '', 'invalid', -1, 1.5, false]) {
    const complete = await fetchRemotePages(async ({ page }) => ({ ok: true, data: { total, rows: page === 1 ? [1, 2] : [3] } }), { pageSize: 2, maxPages: 2 });
    assert.equal(complete.ok, true);
    assert.deepEqual(complete.rows, [1, 2, 3], `unusable total ${String(total)} must not truncate a full first page`);
    const truncated = await fetchRemotePages(async () => ({ ok: true, data: { total, rows: [1, 2] } }), { pageSize: 2, maxPages: 2 });
    assert.equal(truncated.ok, false, `a full final page with unusable total ${String(total)} is not proof of completeness`);
    assert.equal(truncated.code, 'REMOTE_PAGE_LIMIT_REACHED');
    assert.deepEqual(truncated.rows, []);
  }
  const zero = await fetchRemotePages(async () => ({ ok: true, data: { rows: [], total: 0 } }));
  assert.deepEqual(zero, { ok: true, rows: [] });
  const contradictory = await fetchRemotePages(async () => ({ ok: true, data: { rows: [1, 2], total: 0 } }), { pageSize: 2 });
  assert.equal(contradictory.ok, false, 'a claimed total below the observed rows is not a complete ledger');
  const changingTotal = await fetchRemotePages(async ({ page }) => ({ ok: true, data: { rows: [page * 2, page * 2 + 1], total: page === 1 ? 4 : 5 } }), { pageSize: 2, maxPages: 3 });
  assert.equal(changingTotal.ok, false, 'a changing collection must be read again before claiming completeness');
  console.log('points ledger pagination test: passed');
}
run().catch(error => { console.error(error); process.exit(1); });
