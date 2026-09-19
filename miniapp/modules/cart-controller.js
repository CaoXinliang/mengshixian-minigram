function cartKey(item = {}) {
  return String(item.skuId || item.remoteCartItemId || item.id) + '::' + String(item.selectedSpec || item.specLabel || item.unit || '');
}

function normalizeRemoteRows(rows, context = {}) {
  const products = Array.isArray(context.products) ? context.products : [];
  const priceBySku = context.priceBySku || {};
  return (rows || []).map((item) => {
    const product = item.product || {};
    const sku = item.sku || {};
    const catalogProduct = products.find((entry) => String(entry.id) === String(product._id));
    const unit = sku.packageUnit || sku.netWeight || '规格信息暂不可用';
    return {
      id: product._id || `unavailable-${item._id}`,
      name: product.name || '商品已失效',
      category: product.categoryName || '其他冻品',
      unit,
      priceUnitLabel: context.displayUnitLabel(unit),
      selectedSpec: sku.specName || sku.packageUnit || sku.netWeight || '原规格不可用',
      skuId: item.skuId,
      remoteCartItemId: item._id,
      selected: item.selected !== false,
      qty: item.quantity,
      unavailable: Boolean(item.unavailable || !item.sku || !item.product),
      unavailableReason: item.unavailableReason || (!item.sku ? 'sku_off_sale' : (!item.product ? 'product_off_sale' : '')),
      tag: '',
      coverMediaId: product.coverMediaId || '',
      img: catalogProduct && catalogProduct.img || product.image || product.coverUrl || context.placeholderImage,
      benefit: '冷链配送 · 家庭囤货',
      minOrderQuantity: context.positiveInteger(sku.minOrderQuantity, 1),
      orderMultiple: context.positiveInteger(sku.orderMultiple, 1),
      ...context.pricingForQuantity(priceBySku[item.skuId], sku, item.quantity)
    };
  });
}

function createCartController(options = {}) {
  const pendingSelections = new Map();
  const selectionSeqByKey = new Map();
  let loadSeq = 0;
  let writeQueue = Promise.resolve();
  let pendingWrites = 0;

  const currentItems = () => Array.isArray(options.getItems()) ? options.getItems() : [];
  const currentScope = () => options.getScope();
  const scopeIsCurrent = (scope, token) => token === loadSeq && scope === currentScope();

  function mergePendingSelections(items) {
    if (!pendingSelections.size) return items;
    return (items || []).map((item) => pendingSelections.has(cartKey(item)) ? { ...item, selected: pendingSelections.get(cartKey(item)) } : item);
  }

  function enqueue(write) {
    pendingWrites += 1;
    const next = writeQueue.then(write).catch(() => options.toast('购物车更新失败，请重试')).finally(() => { pendingWrites = Math.max(0, pendingWrites - 1); });
    writeQueue = next;
    return next;
  }

  async function applyAddProduct(id, selectedSpec, onComplete, requestedQuantity = 1) {
    const baseProduct = options.findProduct(id);
    if (!baseProduct) return;
    let spec = selectedSpec || baseProduct.specLabel || baseProduct.unit;
    const product = options.cloudMode ? options.productWithPrice(baseProduct, spec, 1) : baseProduct;
    let resolvedSkuId = '';
    if (options.cloudMode && Array.isArray(product.skuOptions) && product.skuOptions.length) {
      const exact = product.skuOptions.find((item) => item.label === spec);
      const option = exact || (product.skuOptions.length === 1 ? product.skuOptions[0] : null);
      if (!option) return options.toast('所选规格暂不可用，请重新选择');
      resolvedSkuId = option.id;
      if (!exact) spec = option.label;
    }
    const items = currentItems().map((item) => ({ ...item }));
    let existing = items.find((item) => String(item.id) === String(product.id) && item.selectedSpec === spec);
    const requested = Math.max(1, Math.min(999, Number(requestedQuantity || 1)));
    let quantity = (existing ? existing.qty : 0) + requested;
    let skuId = existing && existing.skuId || resolvedSkuId;
    if (options.cloudMode) {
      let resolvedSku = (product.skuOptions || []).find((item) => String(item.id) === String(skuId) || item.label === spec) || null;
      if (!skuId) {
        const detail = await options.getProduct(product.id);
        const remoteSkus = detail && detail.ok && detail.data && Array.isArray(detail.data.skus) ? detail.data.skus : [];
        const exactRemote = remoteSkus.find((item) => (item.specName || item.packageUnit || item.netWeight) === spec);
        const option = exactRemote || (remoteSkus.length === 1 ? remoteSkus[0] : null);
        if (!option) return options.toast('商品规格暂不可用');
        skuId = option._id;
        resolvedSku = { id: option._id, label: option.specName || option.packageUnit || option.netWeight || spec, packageUnit: option.packageUnit || '', minOrderQuantity: options.positiveInteger(option.minOrderQuantity, 1), orderMultiple: options.positiveInteger(option.orderMultiple, 1) };
        if (!exactRemote) spec = option.specName || option.packageUnit || option.netWeight || spec;
        existing = items.find((item) => String(item.id) === String(product.id) && item.selectedSpec === spec);
      }
      if (!skuId) return options.toast('商品规格暂不可用');
      const availability = options.availability(skuId);
      if (['sold_out', 'unavailable'].includes(availability)) return options.toast(availability === 'sold_out' ? '暂时缺货' : '暂不可售');
      const ruleItem = { ...product, ...options.pricing(skuId, resolvedSku || product, quantity) };
      quantity = requested === 1 ? (existing ? options.steppedQuantity(ruleItem, existing.qty, 1) : options.firstValidQuantity(ruleItem)) : (existing ? Number(existing.qty || 0) : 0) + requested;
      const issue = options.quantityIssue(ruleItem, quantity);
      if (issue) return options.toast(issue);
      const key = String(skuId) + '::' + String(spec);
      let effectiveSelected = pendingSelections.has(key) ? pendingSelections.get(key) : true;
      const saved = await options.addItem({ skuId, quantity, selected: effectiveSelected });
      if (!saved || !saved.ok || !saved.data || !saved.data.item) return options.toast(saved && saved.error && saved.error.message || '加入购物车失败');
      const latestPending = pendingSelections.has(key) ? pendingSelections.get(key) : undefined;
      if (latestPending !== undefined) effectiveSelected = latestPending;
      pendingSelections.delete(key);
      if (existing) Object.assign(existing, { qty: quantity, skuId, remoteCartItemId: saved.data.item._id, selected: effectiveSelected });
      else items.push({ ...product, ...options.pricing(skuId, resolvedSku || product, quantity), skuId, remoteCartItemId: saved.data.item._id, selectedSpec: spec, qty: quantity, selected: effectiveSelected });
    } else if (existing) {
      existing.qty = quantity;
      existing.selected = true;
    } else {
      items.push({ ...product, selectedSpec: spec, qty: requested });
    }
    options.sync(items, () => {
      options.pulse();
      options.toast('已加入购物车', 'success', 900);
      if (typeof onComplete === 'function') onComplete();
    });
  }

  function addProduct(id, selectedSpec, onComplete, requestedQuantity = 1) {
    const token = options.beginFeedback(id);
    return enqueue(async () => {
      try { return await applyAddProduct(id, selectedSpec, onComplete, requestedQuantity); }
      finally { options.endFeedback(token); }
    });
  }

  async function applyAddFrequent() {
    const frequent = options.getFrequent();
    if (frequent.some((product) => product && product.specs && product.specs.length > 1)) return options.toast('请逐个选择数量和规格');
    if (!options.cloudMode) {
      const items = currentItems().map((item) => ({ ...item }));
      frequent.forEach((product) => {
        const spec = product.specLabel || product.unit;
        const existing = items.find((item) => item.id === product.id && item.selectedSpec === spec);
        if (existing) existing.qty += 1;
        else items.push({ ...product, selectedSpec: spec, qty: 1 });
      });
      options.sync(items);
      options.pulse();
      return options.toast('常购商品已加入购物车', 'success', 900);
    }
    const items = currentItems().map((item) => ({ ...item }));
    let added = 0;
    for (const product of frequent) {
      if (!product || !product.id) continue;
      let skuId = product.skuId;
      if (!skuId && Array.isArray(product.skuOptions)) skuId = (product.skuOptions.find((item) => item.id) || product.skuOptions[0] || {}).id;
      let spec = product.specLabel || product.unit || '默认规格';
      if (!skuId) {
        const detail = await options.getProduct(product.id);
        const remoteSkus = detail && detail.ok && detail.data && Array.isArray(detail.data.skus) ? detail.data.skus : [];
        const option = remoteSkus.find((item) => (item.specName || item.packageUnit || item.netWeight) === spec) || remoteSkus[0];
        if (!option) continue;
        skuId = option._id;
        spec = option.specName || option.packageUnit || option.netWeight || spec;
      }
      if (!skuId || ['sold_out', 'unavailable'].includes(options.availability(skuId))) continue;
      const existingIndex = items.findIndex((item) => String(item.id) === String(product.id) && item.selectedSpec === spec);
      const skuOption = (product.skuOptions || []).find((item) => String(item.id) === String(skuId)) || product;
      const ruleItem = { ...product, ...options.pricing(skuId, skuOption, existingIndex >= 0 ? items[existingIndex].qty : 1) };
      const quantity = existingIndex >= 0 ? options.steppedQuantity(ruleItem, items[existingIndex].qty, 1) : options.firstValidQuantity(ruleItem);
      if (options.quantityIssue(ruleItem, quantity)) continue;
      const saved = await options.addItem({ skuId, quantity, selected: true });
      if (!saved || !saved.ok || !saved.data || !saved.data.item) { options.toast(saved && saved.error && saved.error.message || '常购商品加入购物车失败'); continue; }
      if (existingIndex >= 0) Object.assign(items[existingIndex], { qty: quantity, skuId, remoteCartItemId: saved.data.item._id });
      else items.push({ ...product, skuId, remoteCartItemId: saved.data.item._id, selectedSpec: spec, qty: quantity });
      added += 1;
      options.sync(items);
    }
    options.sync(items);
    if (added) options.pulse();
    options.toast(added ? '常购商品已加入购物车' : '暂无可以加购的常购商品', added ? 'success' : 'none', 900);
  }

  const addFrequent = () => enqueue(applyAddFrequent);

  async function applyChangeQuantity(dataset = {}) {
    const { id, spec, delta } = dataset;
    const direct = Object.prototype.hasOwnProperty.call(dataset, 'quantity');
    const requested = direct ? Number(dataset.quantity) : null;
    if (direct && (!Number.isSafeInteger(requested) || requested < 0 || requested > 999)) return options.toast('请输入有效数量');
    const current = currentItems().find((item) => String(item.id) === String(id) && item.selectedSpec === spec);
    if (!current && direct && requested > 0) {
      const product = options.findProduct(id);
      if (!product) return;
      const selectedSpec = spec || product.specLabel || product.unit;
      const ruleItem = options.productWithPrice(product, selectedSpec, requested);
      const issue = options.quantityIssue(ruleItem, requested);
      if (issue) return options.toast(issue);
      return applyAddProduct(id, selectedSpec, undefined, requested);
    }
    if (!current) return direct ? undefined : (Number(delta) > 0 ? applyAddProduct(id, spec) : undefined);
    const quantity = direct ? requested : options.steppedQuantity(current, current.qty, Number(delta), true);
    const issue = quantity > 0 ? options.quantityIssue(current, quantity) : '';
    if (issue) return options.toast(issue);
    if (options.cloudMode && current.skuId) {
      const availability = options.availability(current.skuId);
      if (quantity > current.qty && ['sold_out', 'unavailable'].includes(availability)) return options.toast(availability === 'sold_out' ? '暂时缺货' : '暂不可售');
      const result = quantity > 0 ? await options.updateItem({ skuId: current.skuId, quantity, selected: current.selected !== false }) : (current.remoteCartItemId ? await options.removeItem(current.remoteCartItemId) : { ok: true });
      if (!result || !result.ok) return options.toast(result && result.error && result.error.message || '购物车更新失败');
    }
    options.sync(currentItems().map((item) => String(item.id) === String(id) && item.selectedSpec === spec ? { ...item, qty: quantity } : { ...item }).filter((item) => item.qty > 0));
  }

  const changeQuantity = dataset => enqueue(() => applyChangeQuantity(dataset));

  async function clear() {
    if (options.cloudMode) {
      return enqueue(async () => {
        const removed = await Promise.all(currentItems().filter((item) => item.remoteCartItemId).map((item) => options.removeItem(item.remoteCartItemId)));
        if (removed.some((item) => !item || !item.ok)) return options.toast('购物车清空失败，请稍后重试');
        pendingSelections.clear();
        options.sync([]);
        options.toast('购物车已清空');
      });
    }
    options.sync([]);
    options.toast('购物车已清空');
  }

  async function toggleSelection(dataset = {}, selected) {
    const item = currentItems().find((entry) => {
      const sameSku = dataset.skuId ? String(entry.skuId) === String(dataset.skuId) : String(entry.id) === String(dataset.id);
      const sameSpec = dataset.spec ? String(entry.selectedSpec || '') === String(dataset.spec) : true;
      return sameSku && sameSpec;
    });
    if (!item) return;
    const key = item.cartKey || cartKey(item);
    const previousSelected = item.selected !== false;
    const next = currentItems().map((entry) => (entry.cartKey || cartKey(entry)) === key
      ? { ...entry, selected, ...(selected ? { cartPriceChanged: false, cartChangeText: '' } : {}) }
      : { ...entry });
    const token = Number(selectionSeqByKey.get(key) || 0) + 1;
    selectionSeqByKey.set(key, token);
    pendingSelections.set(key, selected);
    options.sync(next);
    if (!options.cloudMode || !item.skuId) return;
    return enqueue(async () => {
      const latest = currentItems().find((entry) => (entry.cartKey || cartKey(entry)) === key);
      const result = await options.updateItem({ skuId: item.skuId, quantity: latest ? latest.qty : item.qty, selected });
      if (selectionSeqByKey.get(key) === token) pendingSelections.delete(key);
      if (!result || !result.ok) {
        if (selectionSeqByKey.get(key) === token) {
          options.sync(currentItems().map((entry) => (entry.cartKey || cartKey(entry)) === key ? { ...entry, selected: previousSelected } : { ...entry }));
        }
        options.toast(result && result.error && result.error.message || '购物车选择更新失败');
      }
      return result;
    });
  }

  async function toggleSelectAll(selected, actionable) {
    const rows = currentItems().filter(actionable);
    if (!rows.length) return;
    if (options.cloudMode) {
      const result = await enqueue(async () => {
        for (const item of rows) {
          if (!item.skuId || (item.selected !== false) === selected) continue;
          const updated = await options.updateItem({ skuId: item.skuId, quantity: item.qty, selected });
          if (!updated || !updated.ok) return { ok: false, error: updated && updated.error };
        }
        return { ok: true };
      });
      if (!result || !result.ok) {
        options.toast(result && result.error && result.error.message || '购物车选择更新失败');
        return options.reload();
      }
    }
    options.sync(currentItems().map((item) => actionable(item) ? { ...item, selected, ...(selected ? { cartPriceChanged: false, cartChangeText: '' } : {}) } : item));
  }

  async function load() {
    const token = ++loadSeq;
    const scope = currentScope();
    options.setStatus({ cartStatus: 'loading', cartErrorText: '' });
    if (pendingWrites) await writeQueue.catch(() => null);
    if (!scopeIsCurrent(scope, token)) return false;
    const result = await options.fetch();
    if (!scopeIsCurrent(scope, token)) return false;
    if (!result || !result.ok || !result.data || !Array.isArray(result.data.rows)) {
      options.setStatus({ cartStatus: 'error', cartErrorText: result && result.error && result.error.message || '购物车读取失败，请重试' });
      return false;
    }
    const rows = options.normalizeRows(result.data.rows);
    options.sync(rows);
    options.setStatus({ cartStatus: 'ready', cartErrorText: '' });
    const priceTask = options.loadMissingPrices(rows).catch(() => false);
    const mediaTask = options.hydrateMedia(rows, () => scopeIsCurrent(scope, token)).catch(() => null);
    await Promise.all([priceTask, mediaTask]);
    return scopeIsCurrent(scope, token);
  }

  function clearPendingSelections() { pendingSelections.clear(); }

  return { addFrequent, addProduct, applyAddFrequent, applyAddProduct, applyChangeQuantity, changeQuantity, clear, clearPendingSelections, enqueue, load, mergePendingSelections, toggleSelectAll, toggleSelection };
}

module.exports = { cartKey, createCartController, normalizeRemoteRows };
