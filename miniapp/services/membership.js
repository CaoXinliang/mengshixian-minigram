const { request } = require('./request');
const { fetchRemotePages } = require('./collection');

async function pointsLedgerAll() {
  let result;
  try { result = await fetchRemotePages(payload => request('points.ledger', payload), { pageSize: 100, maxPages: 50 }); }
  catch (error) { result = { ok: false, code: 'REMOTE_PAGE_FAILED' }; }
  return result.ok
    ? { ok: true, data: { rows: result.rows }, error: null }
    : { ok: false, data: null, error: { code: result.code, message: '积分流水未能完整读取，请重试。' } };
}

module.exports = {
  pointsAccount: () => request('points.account'),
  signIn: (payload) => request('points.signIn', payload),
  resolveSignIn: (payload) => request('points.signIn.resolve', payload),
  pointsLedger: (payload) => request('points.ledger', payload),
  pointsLedgerAll,
  profile: () => request('membership.profile')
};
