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
  for (let page = 1; page <= maxPages; page += 1) {
    const result = await loadPage({ page, pageSize });
    if (!result || !result.ok || !result.data || !Array.isArray(result.data.rows)) {
      return { ok: false, rows: [], code: 'REMOTE_PAGE_FAILED' };
    }
    rows.push(...result.data.rows);
    if (result.data.rows.length < pageSize) break;
  }
  return { ok: true, rows };
}

const collectionTools = { chunkUnique, fetchRemotePages, uniqueValues };
if (typeof module !== 'undefined' && module.exports) module.exports = collectionTools;
if (typeof window !== 'undefined') window.MengshixianCollection = collectionTools;
