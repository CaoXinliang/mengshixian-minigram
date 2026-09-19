function collectionError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function rowKey(row, index) {
  const key = row && (row.contentKey || row._id || row.id);
  return key ? String(key) : `anonymous:${index}:${JSON.stringify(row || {})}`;
}

async function loadCompleteMealCollection(fetchPage, options = {}) {
  if (typeof fetchPage !== 'function') throw collectionError('MEAL_COLLECTION_FETCH_REQUIRED', '缺少菜谱分页读取器');
  const pageSize = Math.max(1, Math.min(100, Number(options.pageSize) || 100));
  const maxPages = Math.max(1, Math.min(100, Number(options.maxPages) || 20));
  const rows = [];
  const rowKeys = new Set();
  const pageSignatures = new Set();
  let total = null;

  for (let page = 1; page <= maxPages; page += 1) {
    const result = await fetchPage({ page, pageSize });
    const data = result && result.ok && result.data;
    if (!data || !Array.isArray(data.rows)) {
      throw collectionError('MEAL_COLLECTION_REQUEST_FAILED', '菜谱集合读取失败');
    }
    const pageRows = data.rows;
    const signature = pageRows.map((row, index) => rowKey(row, index)).join('|');
    if (pageRows.length && pageSignatures.has(signature)) {
      throw collectionError('MEAL_COLLECTION_REPEATED_PAGE', '菜谱分页重复，集合不完整');
    }
    if (pageRows.length) pageSignatures.add(signature);
    pageRows.forEach((row, index) => {
      const key = rowKey(row, index);
      if (rowKeys.has(key)) return;
      rowKeys.add(key);
      rows.push(row);
    });
    if (Number.isFinite(Number(data.total)) && Number(data.total) >= 0) total = Number(data.total);
    if (total !== null && rows.length >= total) {
      return { rows: rows.slice(0, total), total, pageCount: page, complete: true };
    }
    if (pageRows.length < pageSize) {
      if (total !== null && rows.length < total) {
        throw collectionError('MEAL_COLLECTION_INCOMPLETE', '菜谱分页提前结束，集合不完整');
      }
      return { rows, total: rows.length, pageCount: page, complete: true };
    }
  }
  throw collectionError('MEAL_COLLECTION_PAGE_LIMIT', '菜谱分页超过安全上限，集合不完整');
}

module.exports = { loadCompleteMealCollection };
