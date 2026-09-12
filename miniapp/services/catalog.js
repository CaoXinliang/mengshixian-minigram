const { request } = require('./request');

async function listAll(action, payload) {
  const pageSize = 100;
  const rows = [];
  const seenPages = new Set();
  let page = 1;

  while (true) {
    const result = await request(action, { ...(payload || {}), page, pageSize });
    if (!result || !result.ok || !result.data || !Array.isArray(result.data.rows)) return result;

    const batch = result.data.rows;
    const pageKey = batch.map((item) => String(item && (item._id || item.id) || '')).join('|');
    if (batch.length && seenPages.has(pageKey)) {
      return {
        ok: false,
        data: null,
        error: { code: 'CATALOG_PAGINATION_STALLED', message: '商品目录分页异常，请稍后重试。' },
        requestId: result.requestId || ''
      };
    }
    if (batch.length) seenPages.add(pageKey);
    rows.push(...batch);

    const hasTotal = result.data.total !== undefined && result.data.total !== null && result.data.total !== '';
    const total = hasTotal ? Number(result.data.total) : Number.NaN;
    if (batch.length < pageSize || (Number.isFinite(total) && rows.length >= total)) {
      return {
        ok: true,
        data: { ...result.data, rows, total: Number.isFinite(total) ? total : rows.length, page: 1, pageSize: rows.length },
        error: null,
        requestId: result.requestId || ''
      };
    }
    page += 1;
  }
}

async function listPrices(skuIds) {
  const ids = [...new Set((Array.isArray(skuIds) ? skuIds : []).filter(Boolean))];
  const rows = [];
  let requestId = '';
  for (let index = 0; index < ids.length; index += 100) {
    const result = await request('catalog.prices', { skuIds: ids.slice(index, index + 100) });
    if (!result || !result.ok || !result.data || !Array.isArray(result.data.rows)) return result;
    rows.push(...result.data.rows);
    requestId = result.requestId || requestId;
  }
  return { ok: true, data: { rows }, error: null, requestId };
}

module.exports = {
  getHome: (payload) => request('content.home', payload),
  listCategories: (payload) => request('catalog.categories', payload),
  listAllCategories: (payload) => listAll('catalog.categories', payload),
  listProducts: (payload) => request('catalog.products', payload),
  listAllProducts: (payload) => listAll('catalog.products', payload),
  getProduct: (productId) => request('catalog.product', { productId }),
  listPrices
};
