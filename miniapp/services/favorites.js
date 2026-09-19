const { request } = require('./request');
const { fetchRemotePages } = require('./collection');

async function listAll() {
  const result = await fetchRemotePages(params => request('favorites.list', params), { pageSize: 100, maxPages: 50 });
  if (!result.ok) return { ok: false, data: null, error: { code: result.code, message: result.message || '收藏状态读取失败，请重试。' } };
  const ids = result.rows.map(row => row && row._id);
  if (ids.some(id => typeof id !== 'string' || !id.trim()) || new Set(ids).size !== ids.length) {
    return { ok: false, data: null, error: { code: 'REMOTE_PAGE_INCONSISTENT', message: '收藏列表在翻页时发生变化，请重新加载。' } };
  }
  return { ok: true, data: { rows: result.rows }, error: null };
}

module.exports = {
  list: (payload) => request('favorites.list', payload),
  listAll,
  upsert: (payload) => request('favorites.upsert', payload),
  remove: (payload) => request('favorites.remove', payload)
};
