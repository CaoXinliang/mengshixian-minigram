const { request } = require('./request');
const { fetchRemotePages } = require('./collection');

async function readAll(action, errorMessage) {
  const result = await fetchRemotePages(async params => {
    const response = await request(action, params);
    const data = response && response.data;
    if (response && response.ok && (!data || !Array.isArray(data.rows) || !Number.isSafeInteger(data.total) || data.total < 0
      || data.page !== params.page || data.pageSize !== params.pageSize)) {
      return { ok: false, data: null, error: { code: 'REMOTE_PAGE_INCONSISTENT', message: '优惠券分页信息不一致，请重新加载。' } };
    }
    return response;
  }, { pageSize: 100, maxPages: 50 });
  if (!result.ok) return { ok: false, data: null, error: { code: result.code, message: result.message || errorMessage } };
  const ids = result.rows.map(row => row && row._id);
  if (ids.some(id => typeof id !== 'string' || !id.trim()) || new Set(ids).size !== ids.length) {
    return { ok: false, data: null, error: { code: 'REMOTE_PAGE_INCONSISTENT', message: '优惠券列表在翻页时发生变化，请重新加载。' } };
  }
  return { ok: true, data: { rows: result.rows }, error: null };
}

const listAll = () => readAll('coupons.list', '优惠券状态读取失败，请重试。');
const templatesAll = () => readAll('coupons.templates', '可领取优惠券读取失败，请重试。');

module.exports = {
  templates: (payload) => request('coupons.templates', payload),
  templatesAll,
  claim: (payload) => request('coupons.claim', payload),
  resolveClaim: (payload) => request('coupons.claim.resolve', payload),
  list: (payload) => request('coupons.list', payload),
  listAll
};
