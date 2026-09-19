const assert = require('assert/strict');
const Module = require('module');
const originalLoad = Module._load;
const calls = [];
let failPage = 0;
const records = Array.from({ length: 101 }, (_, index) => ({ _id: `p-${index}`, change: index }));
Module._load = function (name, parent, isMain) {
  if (name === './request' && /services[\\/]membership\.js$/.test(parent.filename)) return { request: async (action, payload) => {
    calls.push({ action, payload });
    if (action !== 'points.ledger') return { ok: true, data: { found: false, businessDate: '2026-09-19' } };
    if (payload.page === failPage) return { ok: false, error: { code: 'REQUEST_TIMEOUT' } };
    return { ok: true, data: { rows: records.slice((payload.page - 1) * payload.pageSize, payload.page * payload.pageSize), total: records.length } };
  } };
  return originalLoad.call(this, name, parent, isMain);
};
let membership;
try { membership = require('../miniapp/services/membership'); } finally { Module._load = originalLoad; }

async function run() {
  const result = await membership.pointsLedgerAll();
  assert.equal(result.ok, true);
  assert.equal(result.data.rows.length, 101);
  assert.equal(result.data.rows[100]._id, 'p-100');
  failPage = 2;
  const failure = await membership.pointsLedgerAll();
  assert.equal(failure.ok, false);
  assert.equal(failure.data, null, 'partial ledger must never be exposed as complete');
  await membership.resolveSignIn({ idempotencyKey: 'stable-key' });
  assert.deepEqual(calls.at(-1), { action: 'points.signIn.resolve', payload: { idempotencyKey: 'stable-key' } });
  for (const name of ['pointsAccount', 'pointsLedger', 'profile', 'signIn']) assert.equal(typeof membership[name], 'function');
  console.log('membership points service test: passed');
}
run().catch(error => { console.error(error); process.exit(1); });
