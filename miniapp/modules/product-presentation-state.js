function text(value) {
  return String(value == null ? '' : value).trim();
}

function normalizedAvailability(value) {
  const normalized = text(value).toLowerCase();
  return ['available', 'unknown', 'sold_out', 'unavailable'].includes(normalized)
    ? normalized
    : 'unavailable';
}

function optionCanPurchase(option) {
  const availability = normalizedAvailability(option && option.availability);
  return ['available', 'unknown'].includes(availability)
    && Boolean(text(option && option.priceText))
    && !(option && option.purchaseRuleUnavailable);
}

function deriveMediaStatus(product) {
  if (product && product.imageUnavailable) return 'error';
  const source = text(product && (product.img || product.image || product.cover));
  return source ? 'ready' : 'empty';
}

function deriveProductPresentation(product = {}, context = {}) {
  const loggedIn = Boolean(context.loggedIn);
  const options = Array.isArray(product.skuOptions) ? product.skuOptions.filter(Boolean) : [];
  const hasMultipleSkus = options.length > 1;
  const selectedSku = options.find((option) => String(option.id) === String(product.selectedSkuId)) || options[0] || null;
  const selectedAvailability = normalizedAvailability(selectedSku ? selectedSku.availability : product.availability);
  const selectedPriceText = text(selectedSku && selectedSku.priceText || product.priceText);
  const selectedRuleUnavailable = Boolean(selectedSku ? selectedSku.purchaseRuleUnavailable : product.purchaseRuleUnavailable);
  const anyPurchasable = options.length
    ? options.some(optionCanPurchase)
    : ['available', 'unknown'].includes(selectedAvailability) && Boolean(selectedPriceText) && !selectedRuleUnavailable;
  const selectedSkuPurchasable = ['available', 'unknown'].includes(selectedAvailability) && Boolean(selectedPriceText) && !selectedRuleUnavailable;
  const normalizedStatus = text(product.status).toLowerCase();
  const offShelf = ['off_shelf', 'unpublished', 'disabled', 'inactive'].includes(normalizedStatus);
  const base = {
    hasMultipleSkus,
    mediaStatus: deriveMediaStatus(product),
    priceVisible: loggedIn && Boolean(selectedPriceText),
    priceText: loggedIn ? selectedPriceText : '',
    productUnavailable: false,
    action: hasMultipleSkus ? 'select' : 'quantity',
    confirmAction: selectedSkuPurchasable ? 'purchase' : (anyPurchasable && hasMultipleSkus ? 'select' : 'disabled'),
    selectedSkuPurchasable,
    statusCode: 'available',
    statusText: ''
  };

  if (offShelf) return { ...base, productUnavailable: true, action: 'disabled', confirmAction: 'disabled', selectedSkuPurchasable: false, statusCode: 'off_shelf', statusText: '商品已下架' };
  if (!loggedIn) return { ...base, priceVisible: false, priceText: '', action: 'login', confirmAction: 'login', selectedSkuPurchasable: false, statusCode: 'login_required', statusText: '登录后查看价格' };
  if (context.priceRequestFailed) return anyPurchasable && hasMultipleSkus
    ? { ...base, priceVisible: false, action: 'select', confirmAction: 'select', selectedSkuPurchasable: false, statusCode: 'selected_sku_request_failed', statusText: '当前规格价格加载失败' }
    : { ...base, priceVisible: false, productUnavailable: true, action: 'disabled', confirmAction: 'disabled', selectedSkuPurchasable: false, statusCode: 'request_failed', statusText: '价格加载失败，请重试' };
  if (selectedRuleUnavailable) return { ...base, productUnavailable: !anyPurchasable, action: anyPurchasable && hasMultipleSkus ? 'select' : 'disabled', confirmAction: anyPurchasable && hasMultipleSkus ? 'select' : 'disabled', selectedSkuPurchasable: false, statusCode: 'rule_unavailable', statusText: '购买规则暂不可用' };
  if (!selectedPriceText) return { ...base, priceVisible: false, productUnavailable: !anyPurchasable, action: anyPurchasable && hasMultipleSkus ? 'select' : 'disabled', confirmAction: anyPurchasable && hasMultipleSkus ? 'select' : 'disabled', selectedSkuPurchasable: false, statusCode: 'no_price', statusText: '价格暂不可用' };
  if (['sold_out', 'unavailable'].includes(selectedAvailability)) {
    if (anyPurchasable && hasMultipleSkus) return { ...base, action: 'select', confirmAction: 'select', selectedSkuPurchasable: false, statusCode: 'selected_sku_sold_out', statusText: '当前规格暂不可售' };
    return { ...base, productUnavailable: true, action: 'disabled', confirmAction: 'disabled', selectedSkuPurchasable: false, statusCode: selectedAvailability === 'sold_out' ? 'sold_out' : 'unavailable', statusText: selectedAvailability === 'sold_out' ? '暂时缺货' : '暂不可售' };
  }
  return base;
}

module.exports = { deriveProductPresentation };
