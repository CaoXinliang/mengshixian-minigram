const UNAVAILABLE_TEXT = {
  out_of_stock: '暂时缺货',
  sold_out: '暂时缺货',
  sku_off_sale: '商品规格已下架',
  product_off_sale: '商品已下架',
  not_permitted: '当前账号不可购买',
  price_unavailable: '价格待重新确认',
  purchase_rule_unavailable: '购买规则已变化',
  fulfillment_unavailable: '当前暂无可用履约方式',
  unavailable: '商品暂不可购买'
};

function createCartState(options = {}) {
  const cloudMode = Boolean(options.cloudMode);
  const pricingForQuantity = options.pricingForQuantity;
  const quantityIssue = options.quantityIssue;
  const displayUnitLabel = options.displayUnitLabel;
  const calculateTotals = options.calculateTotals;
  const hasCompleteCartPricing = options.hasCompleteCartPricing;
  const money = options.money;

  function availabilityFor(item, price) {
    if (item && item.unavailable) return 'unavailable';
    const availability = price && price.availability;
    if (availability === 'sold_out') return 'sold_out';
    if (availability === 'unavailable') return 'unavailable';
    if (availability === 'available' || availability === undefined && (item && item.cartAvailability === 'available' || !cloudMode || Number.isFinite(item && item.price) && item.price > 0)) return 'available';
    return availability === undefined ? 'checking' : 'unavailable';
  }

  function unavailableText(item, price, availability) {
    if (availability === 'checking' || availability === 'available') return '';
    const reason = item && item.unavailableReason || price && price.availabilityReason || availability;
    return UNAVAILABLE_TEXT[reason] || UNAVAILABLE_TEXT[availability] || UNAVAILABLE_TEXT.unavailable;
  }

  const itemActionable = item => (!item || item.cartAvailability === undefined || item.cartAvailability === 'available') && !item.cartPriceChanged && !item.cartRuleChanged;
  const selectedItems = items => (items || []).filter(item => item.selected !== false && itemActionable(item));

  function selectedSummary(items) {
    const selected = selectedItems(items);
    if (!selected.length) return { selectedCartCount: 0, selectedCartTotal: money(0), selectedCartPriceReady: false, selectedCartAmountCompact: false };
    const selectedCartTotal = calculateTotals(selected).cartTotal;
    return {
      selectedCartCount: selected.reduce((sum, item) => sum + Number(item.qty || 0), 0),
      selectedCartTotal,
      selectedCartPriceReady: hasCompleteCartPricing(selected),
      selectedCartAmountCompact: selectedCartTotal.length > 9
    };
  }

  function withLatestRule(item, nextPricing) {
    const merged = { ...item, ...nextPricing };
    const ruleChanged = Boolean(nextPricing.purchaseRuleUnavailable || quantityIssue(merged, item.qty));
    return {
      ...merged,
      selected: ruleChanged ? false : item.selected,
      cartRuleChanged: ruleChanged,
      cartChangeText: ruleChanged ? '购买规则已变化，请调整数量' : (item.cartPriceChanged ? '价格已更新，请重新选择' : '')
    };
  }

  function applyPricingUpdate(items, priceBySku = {}) {
    return (items || []).map((item) => {
      const price = priceBySku[item.skuId];
      const nextPricing = pricingForQuantity(price, item, item.qty);
      const priceChanged = Number.isFinite(item.price) && Number.isFinite(nextPricing.price) && item.price !== nextPricing.price;
      const withRule = withLatestRule(item, nextPricing);
      return {
        ...withRule,
        selected: priceChanged || withRule.cartRuleChanged ? false : withRule.selected,
        cartPriceChanged: Boolean(item.cartPriceChanged || priceChanged),
        cartChangeText: withRule.cartRuleChanged ? withRule.cartChangeText : (priceChanged || item.cartPriceChanged ? '价格已更新，请重新选择' : ''),
        priceUnitLabel: displayUnitLabel(item.unit || item.selectedSpec)
      };
    });
  }

  function normalizeItems(items, priceBySku = {}) {
    return (items || []).map((item) => {
      const price = priceBySku[item.skuId];
      const availability = availabilityFor(item, price);
      const nextPricing = cloudMode ? pricingForQuantity(price, item, item.qty) : {};
      const withRule = withLatestRule(item, nextPricing);
      return {
        ...withRule,
        selected: availability === 'available' && !withRule.cartPriceChanged && !withRule.cartRuleChanged ? withRule.selected !== false : false,
        priceUnitLabel: displayUnitLabel(item.unit || item.selectedSpec),
        cartAvailability: availability,
        cartUnavailableText: unavailableText(item, price, availability),
        cartKey: String(item.skuId || item.remoteCartItemId || item.id) + '::' + String(item.selectedSpec || item.specLabel || item.unit || '')
      };
    });
  }

  return { applyPricingUpdate, availabilityFor, itemActionable, normalizeItems, selectedItems, selectedSummary, unavailableText };
}

module.exports = { createCartState };
