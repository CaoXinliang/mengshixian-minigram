function ownValue(source, key, fallback) {
  return source && Object.prototype.hasOwnProperty.call(source, key) ? source[key] : fallback;
}

function createCatalogBrowse(options = {}) {
  const cloudMode = Boolean(options.cloudMode);
  const pageSize = Number(options.pageSize || 100);
  const listProducts = options.listProducts;
  const onRows = typeof options.onRows === 'function' ? options.onRows : (rows) => ({ incoming: rows, products: rows });
  const onState = typeof options.onState === 'function' ? options.onState : () => {};
  const onSideEffects = typeof options.onSideEffects === 'function' ? options.onSideEffects : () => {};
  const requestState = { loading: false, error: '' };
  const completedStates = new Map();
  const requests = new Map();
  let currentScopeToken;
  let activeRequestKey = '';

  function publishRequestState(patch, context = {}) {
    const changed = Object.keys(patch).some((key) => requestState[key] !== patch[key]);
    Object.assign(requestState, patch);
    if (changed) onState({ ...requestState }, context);
  }

  function deriveView(input = {}) {
    const current = input.current || {};
    const next = input.next || {};
    const groups = Array.isArray(input.groups) ? input.groups : [];
    const products = Array.isArray(input.products) ? input.products : [];
    const categoryGroup = ownValue(next, 'categoryGroup', current.categoryGroup);
    const category = ownValue(next, 'category', current.category);
    const query = String(ownValue(next, 'query', current.query) || '');
    const activeGroup = groups.find((group) => group.id === categoryGroup) || groups[0] || null;
    const validCategories = activeGroup && Array.isArray(activeGroup.categories) ? activeGroup.categories : [];
    const visibleProducts = products.filter((product) => {
      const categoryMatches = category === '全部'
        ? validCategories.includes(product.category)
        : product.category === category;
      const queryMatches = !query || String(product.name || '').includes(query) || String(product.category || '').includes(query);
      return categoryMatches && queryMatches;
    });
    const subCategoryValues = cloudMode
      ? groups.filter((group) => group.id !== '全部').map((group) => group.label)
      : products.map((product) => product.category);

    return {
      categoryGroup,
      category,
      query,
      activeGroup,
      subCategories: ['全部', ...new Set(subCategoryValues.filter(Boolean))],
      products: visibleProducts,
      requestState: { ...requestState }
    };
  }

  function reset(scopeToken) {
    currentScopeToken = scopeToken;
    activeRequestKey = '';
    completedStates.clear();
    requests.clear();
    publishRequestState({ loading: false, error: '' }, { visible: false, scopeToken });
  }

  function deactivate() {
    activeRequestKey = '';
    publishRequestState({ loading: false, error: '' }, { visible: true, scopeToken: currentScopeToken });
  }

  async function load(payload = {}, context = {}) {
    if (typeof listProducts !== 'function') return false;
    const scopeToken = context.scopeToken;
    if (currentScopeToken !== scopeToken) reset(scopeToken);
    const key = JSON.stringify(payload);
    const requestKey = `${String(scopeToken)}:${key}`;
    activeRequestKey = requestKey;
    const completed = completedStates.get(key);
    if (completed && !completed.failed && !completed.hasMore) {
      publishRequestState({ loading: false, error: '' }, { ...context, payload });
      return true;
    }
    publishRequestState({ loading: true, error: '' }, { ...context, payload });
    if (requests.has(requestKey)) return requests.get(requestKey);

    const request = (async () => {
      let page = 1;
      let total = null;
      const seenIds = new Set();
      const sideTasks = [];
      completedStates.set(key, { page: 0, total: null, hasMore: true, failed: false });
      while (currentScopeToken === scopeToken && activeRequestKey === requestKey) {
        const result = await listProducts({ ...payload, page, pageSize });
        if (currentScopeToken !== scopeToken || activeRequestKey !== requestKey) return false;
        if (!result || !result.ok || !result.data || !Array.isArray(result.data.rows)) {
          completedStates.set(key, { page: page - 1, total, hasMore: true, failed: true });
          publishRequestState({ loading: false, error: '商品加载失败，请重试' }, { ...context, payload });
          return false;
        }
        const rows = result.data.rows;
        const before = seenIds.size;
        rows.forEach((item) => seenIds.add(String(item._id)));
        const merged = await onRows(rows, { ...context, payload, page });
        const reportedTotal = Number(result.data.total);
        if (Number.isFinite(reportedTotal)) total = reportedTotal;
        const hasMore = rows.length > 0 && (Number.isFinite(total) ? seenIds.size < total : rows.length >= pageSize);
        completedStates.set(key, { page, total, hasMore, failed: false });
        sideTasks.push(Promise.resolve(onSideEffects(merged, { ...context, payload, page })).catch(() => null));
        if (!hasMore || seenIds.size === before) break;
        page += 1;
      }
      await Promise.all(sideTasks);
      return currentScopeToken === scopeToken && activeRequestKey === requestKey;
    })();

    requests.set(requestKey, request);
    try {
      return await request;
    } finally {
      if (requests.get(requestKey) === request) requests.delete(requestKey);
      if (currentScopeToken === scopeToken && activeRequestKey === requestKey) {
        publishRequestState({ loading: false }, { ...context, payload });
      }
    }
  }

  return { deriveView, load, deactivate, reset };
}

module.exports = { createCatalogBrowse };
