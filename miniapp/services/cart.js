const { request } = require('./request');
const { fetchRemotePages } = require('./collection');

module.exports = {
  get: (payload) => request('cart.list', payload),
  // 购物车条目可能超过单页 100 条：分页拉全，避免静默截断
  getAll: async () => {
    const result = await fetchRemotePages((page) => request('cart.list', { page, pageSize: 100 }));
    return { ok: result.ok, data: { rows: result.rows }, error: result.ok ? null : { code: result.code, message: '购物车读取失败' } };
  },
  addItem: (payload) => request('cart.upsert', payload),
  updateItem: (payload) => request('cart.upsert', payload),
  removeItem: (id) => request('cart.remove', { id })
};
