function uniqueValues(items) {
  return [...new Set((Array.isArray(items) ? items : []).filter((item) => item !== undefined && item !== null && item !== ''))];
}

function chunkUnique(items, size = 50) {
  const values = uniqueValues(items);
  const chunks = [];
  for (let index = 0; index < values.length; index += size) chunks.push(values.slice(index, index + size));
  return chunks;
}

async function fetchRemotePages(loadPage, options = {}) {
  const pageSize = Math.min(100, Math.max(1, Number(options.pageSize) || 100));
  const maxPages = Math.max(1, Math.min(50, Number(options.maxPages) || 20));
  const rows = [];
  let expectedTotal = null;
  let complete = false;
  for (let page = 1; page <= maxPages; page += 1) {
    const result = await loadPage({ page, pageSize });
    if (!result || !result.ok || !result.data || !Array.isArray(result.data.rows)) {
      const remoteError = result && result.error && typeof result.error === 'object' ? result.error : {};
      return {
        ok: false,
        rows: [],
        code: typeof remoteError.code === 'string' && remoteError.code ? remoteError.code : 'REMOTE_PAGE_FAILED',
        message: typeof remoteError.message === 'string' ? remoteError.message : ''
      };
    }
    rows.push(...result.data.rows);
    const rawTotal = result.data.total;
    const total = typeof rawTotal === 'number' || (typeof rawTotal === 'string' && rawTotal.trim()) ? Number(rawTotal) : NaN;
    if (Number.isSafeInteger(total) && total >= 0) {
      if ((expectedTotal !== null && expectedTotal !== total) || rows.length > total) return { ok: false, rows: [], code: 'REMOTE_PAGE_INCONSISTENT' };
      expectedTotal = total;
    }
    if (result.data.rows.length < pageSize || (expectedTotal !== null && rows.length >= expectedTotal)) {
      complete = true;
      break;
    }
  }
  if (!complete || (expectedTotal !== null && rows.length < expectedTotal)) return { ok: false, rows: [], code: 'REMOTE_PAGE_LIMIT_REACHED' };
  return { ok: true, rows };
}

const collectionTools = { chunkUnique, fetchRemotePages, uniqueValues };
if (typeof module !== 'undefined' && module.exports) module.exports = collectionTools;
if (typeof window !== 'undefined') window.MengshixianCollection = collectionTools;
