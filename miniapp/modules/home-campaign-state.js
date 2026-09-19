function text(value) {
  return String(value == null ? '' : value).trim();
}

function uniqueText(values) {
  return [...new Set((values || []).map(text).filter(Boolean))];
}

function dateLabel(value) {
  const match = text(value).match(/^\d{4}-(\d{2})-(\d{2})/);
  return match ? `${match[1]}.${match[2]}` : '';
}

function periodText(section) {
  const start = dateLabel(section && section.startAt);
  const end = dateLabel(section && section.endAt);
  if (start && end) return `活动有效期 ${start}—${end}`;
  if (start) return `活动开始于 ${start}`;
  if (end) return `活动截止至 ${end}`;
  return '';
}

function campaignStatus(section) {
  const status = text(section && section.activityStatus);
  if (status === 'upcoming') return { status, statusText: '未开始' };
  if (status === 'active') return { status, statusText: '进行中' };
  if (status === 'ended') return { status, statusText: '已结束' };
  return { status: 'available', statusText: '活动详情' };
}

function deriveHomeCampaign(section, productRows, now) {
  const source = section || {};
  const jumpType = text(source.jumpType || 'none');
  const jumpTarget = text(source.jumpTarget);
  const rules = uniqueText([
    ...(Array.isArray(source.rules) ? source.rules : []),
    ...text(source.ruleText).split(/\r?\n/),
    ...(!source.rules && !source.ruleText ? text(source.subtitle).split(/\r?\n/) : [])
  ]);
  const categoryLabel = text(source.categoryName || source.categoryLabel || (jumpType === 'category' ? jumpTarget : ''));
  const productIds = uniqueText([
    ...(Array.isArray(source.productIds) ? source.productIds : []),
    ...(jumpType === 'product' && jumpTarget ? [jumpTarget] : [])
  ]);
  const products = Array.isArray(productRows) ? productRows : [];
  const selected = productIds.length
    ? productIds.map((id) => products.find((item) => String(item && item.id) === id)).filter(Boolean)
    : categoryLabel ? products.filter((item) => text(item && item.category) === categoryLabel) : [];
  const foundIds = new Set(selected.map((item) => String(item.id)));
  return {
    id: text(source._id || source.id || source.contentKey),
    title: text(source.title),
    subtitle: text(source.subtitle),
    image: text(source.image),
    imageUnavailable: Boolean(source.imageUnavailable),
    periodText: periodText(source),
    rules,
    categoryLabel,
    productIds,
    products: selected,
    missingProductIds: productIds.filter((id) => !foundIds.has(id)),
    ...campaignStatus(source)
  };
}

module.exports = { deriveHomeCampaign };
