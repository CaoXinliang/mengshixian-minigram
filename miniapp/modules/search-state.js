const MAX_RECENT_SEARCHES = 4;

function normalizeKeyword(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function normalizeRecentSearches(values, limit = MAX_RECENT_SEARCHES) {
  const rows = [];
  const seen = new Set();
  (Array.isArray(values) ? values : []).forEach((value) => {
    const keyword = normalizeKeyword(value);
    const key = keyword.toLocaleLowerCase();
    if (!keyword || seen.has(key) || rows.length >= limit) return;
    seen.add(key);
    rows.push(keyword);
  });
  return rows;
}

function addRecentSearch(values, value) {
  const keyword = normalizeKeyword(value);
  if (!keyword) return normalizeRecentSearches(values);
  return normalizeRecentSearches([keyword, ...(Array.isArray(values) ? values : [])]);
}

function buildSearchCategorySuggestions(groups) {
  const rows = [{ id: 'search-results', label: '搜索结果', type: 'results' }];
  const seen = new Set();
  (Array.isArray(groups) ? groups : []).forEach((group) => {
    const label = normalizeKeyword(group && group.label);
    if (!label || label === '全部分类' || String(group.id || '') === '全部' || seen.has(label)) return;
    seen.add(label);
    rows.push({ id: String(group.id || label), label, type: 'category', category: label });
  });
  return rows;
}

function finiteScroll(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : Math.max(0, Number(fallback) || 0);
}

function captureSearchReturnContext(data = {}, scroll = {}) {
  return {
    page: data.page || 'home',
    activeTab: data.activeTab || 'home',
    query: normalizeKeyword(data.query),
    searchDraft: normalizeKeyword(data.searchDraft),
    categoryGroup: data.categoryGroup || '全部',
    category: data.category || '全部',
    pageScrollTop: finiteScroll(scroll.pageScrollTop, data.pageScrollTop),
    catalogResultsScrollTop: finiteScroll(scroll.catalogResultsScrollTop, data.catalogResultsScrollTop)
  };
}

function restoreSearchReturnPatch(context = {}) {
  return {
    page: context.page || 'home',
    activeTab: context.activeTab || 'home',
    query: normalizeKeyword(context.query),
    searchDraft: normalizeKeyword(context.searchDraft),
    categoryGroup: context.categoryGroup || '全部',
    category: context.category || '全部',
    pageScrollTop: finiteScroll(context.pageScrollTop),
    catalogResultsScrollTop: finiteScroll(context.catalogResultsScrollTop),
    searchMode: false,
    catalogBrowseLoading: false,
    catalogBrowseError: ''
  };
}

module.exports = {
  MAX_RECENT_SEARCHES,
  normalizeKeyword,
  normalizeRecentSearches,
  addRecentSearch,
  buildSearchCategorySuggestions,
  captureSearchReturnContext,
  restoreSearchReturnPatch
};
