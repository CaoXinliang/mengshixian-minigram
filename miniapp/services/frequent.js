const { request } = require('./request');
const { fetchRemotePages } = require('./collection');

async function listAll() {
  const result = await fetchRemotePages(params => request('frequent.list', params), { pageSize: 100, maxPages: 50 });
  return result.ok ? { ok: true, data: { rows: result.rows }, error: null } : { ok: false, data: null, error: { code: result.code, message: '常购清单读取失败，请重试。' } };
}

module.exports = {
  list: (payload) => request('frequent.list', payload),
  listAll,
  upsert: (payload) => request('frequent.upsert', payload),
  remove: (payload) => request('frequent.remove', payload),
  batchAddToCart: (payload) => request('frequent.batchAddToCart', payload)
};
