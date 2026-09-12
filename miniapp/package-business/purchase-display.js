function purchaseUnitLabel(packageUnit) {
  const value = typeof packageUnit === 'string' ? packageUnit.trim() : '';
  if (!value) return '';
  const unitNames = '件|箱|包|袋|盒|桶|盘|盅|卷|只|条|根|份';
  const outerUnit = value.match(new RegExp(`/\\s*(?:1\\s*)?(${unitNames})$`));
  if (outerUnit) return outerUnit[1];
  const leadingUnit = value.match(new RegExp(`^(?:1\\s*)?(${unitNames})(?:[/*×xX]|$)`));
  if (leadingUnit) return leadingUnit[1];
  // 净含量或“称重”不等于采购单位，不能从规格描述猜出按盒还是按箱购买。
  return /^(?:kg|g|ml|L|克|千克|公斤|斤|毫升|升)$/i.test(value) ? value : '';
}

function purchaseRuleText(minimum, multiple, packageUnit) {
  const unit = purchaseUnitLabel(packageUnit);
  return unit
    ? `${minimum} ${unit}起购 · 按 ${multiple} ${unit}倍数购买`
    : `起购数量 ${minimum} · 按 ${multiple} 的倍数购买`;
}

function purchaseFailureText(error, fallback = '当前不可用') {
  if (error && error.code === 'MIN_ORDER_QUANTITY_NOT_MET') return '未达到该规格的起购数量';
  return error && (error.reason || error.message) || fallback;
}

module.exports = { purchaseUnitLabel, purchaseRuleText, purchaseFailureText };
