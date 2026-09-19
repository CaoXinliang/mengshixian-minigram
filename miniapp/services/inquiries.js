const { request } = require('./request');
const { fetchRemotePages } = require('./collection');

async function listAll() {
  const result = await fetchRemotePages(params => request('inquiries.list', params), { pageSize: 100, maxPages: 50 });
  return result.ok ? { ok: true, data: { rows: result.rows }, error: null } : { ok: false, data: null, error: { code: result.code, message: '询价记录读取失败，请重试。' } };
}

module.exports = {
  create: (payload) => request('inquiries.create', payload),
  list: (payload) => request('inquiries.list', payload),
  listAll,
  get: (payload) => request('inquiries.get', payload),
  accept: (payload) => request('inquiries.accept', payload)
};
