const PLACEHOLDER_IMAGE = '/assets/products/placeholder.svg';

const UNAVAILABLE_TEXT = {
  sku_missing: '商品规格已失效',
  sku_off_sale: '该规格已下架',
  product_missing: '商品信息已失效',
  product_off_sale: '该商品已下架',
  not_permitted: '当前身份不可购买'
};

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function specText(row) {
  const values = [...new Set([text(row.specSnapshot), text(row.packageUnitSnapshot)].filter(Boolean))];
  return values.length ? values.join(' / ') : '规格信息已失效';
}

function presentFavorite(row, mediaFiles = {}) {
  const id = text(row && row._id);
  const purchasable = Boolean(row && row.purchasable === true && text(row.productId));
  const reason = text(row && row.unavailableReason);
  const mediaId = text(row && row.mediaSnapshot);
  return {
    id,
    skuId: text(row && row.skuId),
    productId: text(row && row.productId),
    name: text(row && row.productNameSnapshot) || '商品信息已失效',
    spec: specText(row || {}),
    image: text(mediaFiles[mediaId]) || PLACEHOLDER_IMAGE,
    purchasable,
    unavailable: !purchasable,
    unavailableText: purchasable ? '' : (UNAVAILABLE_TEXT[reason] || '商品当前不可购买'),
    canRemove: Boolean(id),
    removing: false,
    removeState: 'idle',
    removeText: ''
  };
}

function presentFavorites(rows, mediaFiles = {}) {
  return (Array.isArray(rows) ? rows : []).map(row => presentFavorite(row, mediaFiles));
}

module.exports = { PLACEHOLDER_IMAGE, presentFavorite, presentFavorites };
