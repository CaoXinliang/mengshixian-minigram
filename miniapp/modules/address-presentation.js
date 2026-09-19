const text = value => String(value || '').trim();

function customerAddressText(value, fallback) {
  const source = text(value);
  if (source === '梦食鲜演示收货点（非客户地址）') return '已保存的收货地址';
  if (source === '演示用户') return '收货人';
  return source || fallback;
}

function checkoutAddress(item) {
  if (!item) return null;
  return {
    id: item.id || item._id || '',
    name: customerAddressText(item.name, '收货人'),
    masked: text(item.phoneMasked || item.masked),
    detail: customerAddressText(item.detail, '已保存的收货地址'),
    regionCode: text(item.regionCode)
  };
}

function managementAddress(item = {}) {
  const name = text(item.name);
  const detail = text(item.detail);
  const tag = text(item.tag);
  return {
    id: item.id || item._id || '',
    name,
    displayName: customerAddressText(name, '收货人'),
    phoneMasked: text(item.phoneMasked),
    provinceCode: text(item.provinceCode),
    cityCode: text(item.cityCode),
    districtCode: text(item.districtCode),
    regionCode: text(item.regionCode),
    regionLabel: [item.provinceCode, item.cityCode, item.districtCode].map(text).filter(Boolean).join(' ') || text(item.regionCode),
    detail,
    displayDetail: customerAddressText(detail, ''),
    tag,
    displayTag: tag === '演示' ? '' : tag,
    isDefault: item.isDefault === true
  };
}

module.exports = { checkoutAddress, customerAddressText, managementAddress };
