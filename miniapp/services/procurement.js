const { request } = require('./request');
const { fetchRemotePages } = require('./collection');

async function listAll(action) {
  const result = await fetchRemotePages(params => request(action, params), { pageSize: 100, maxPages: 50 });
  return result.ok ? { ok: true, data: { rows: result.rows }, error: null } : { ok: false, data: null, error: { code: result.code, message: '企业账务记录读取失败，请重试。' } };
}

module.exports = {
  getAccount: () => request('procurement.account.get'),
  listReceivables: (payload) => request('procurement.receivables.list', payload),
  listAllReceivables: () => listAll('procurement.receivables.list'),
  listStatements: (payload) => request('procurement.statements.list', payload),
  listAllStatements: () => listAll('procurement.statements.list')
};
