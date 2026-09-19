const REVOKED_CODES = new Set(['UNAUTHENTICATED', 'AUTH_ACCOUNT_DISABLED', 'UNAUTHORIZED', 'FORBIDDEN', 'USER_DISABLED']);
const COUPON_STATUSES = new Set(['available', 'used', 'expired']);
const DEFINITIVE_CLAIM_CODES = new Set(['COUPON_NOT_AVAILABLE', 'COUPON_SOLD_OUT', 'COUPON_USER_LIMIT', 'IDEMPOTENCY_CONFLICT', 'VALIDATION_ERROR', 'IDEMPOTENCY_KEY_REQUIRED']);

function isRecord(value) { return Boolean(value && typeof value === 'object' && !Array.isArray(value)); }
function revoked(result) { return Boolean(result && result.ok === false && result.error && REVOKED_CODES.has(result.error.code)); }
function money(cents) { return `¥${(cents / 100).toFixed(2)}`; }

function validTemplate(source) {
  if (!isRecord(source) || typeof source._id !== 'string' || !source._id.trim() || typeof source.name !== 'string' || !source.name.trim()) return false;
  if (!['fixed', 'percent'].includes(source.type) || !Number.isSafeInteger(source.minSpendCent) || source.minSpendCent < 0) return false;
  if (source.type === 'fixed' && (!Number.isSafeInteger(source.discountCent) || source.discountCent < 1)) return false;
  if (source.type === 'percent' && (!Number.isSafeInteger(source.discountRateBps) || source.discountRateBps < 1 || source.discountRateBps > 10000)) return false;
  if (source.maxDiscountCent !== null && source.maxDiscountCent !== undefined
    && (!Number.isSafeInteger(source.maxDiscountCent) || source.maxDiscountCent < 0)) return false;
  if (!['all', 'product', 'category'].includes(source.scopeType) || !Array.isArray(source.scopeIds)) return false;
  if (!Number.isSafeInteger(source.version) || source.version < 1) return false;
  if ([source.validFrom, source.validTo].some(value => value && Number.isNaN(new Date(value).getTime()))) return false;
  return Number.isSafeInteger(source.perUserLimit) && source.perUserLimit > 0;
}

function presentTemplate(source, claimedCount) {
  const canClaim = claimedCount < source.perUserLimit;
  return {
    ...source,
    id: source._id,
    valueText: source.type === 'fixed' ? money(source.discountCent) : `减${source.discountRateBps / 100}%`,
    thresholdText: source.minSpendCent > 0 ? `满 ${money(source.minSpendCent)} 可用` : '无门槛',
    validityText: [source.validFrom, source.validTo].filter(Boolean).map(value => String(value).slice(0, 10)).join(' 至 '),
    claimedCount,
    canClaim,
    claimText: canClaim ? (claimedCount ? '继续领取' : '领取') : '已达限领数量'
  };
}

function presentCoupon(source) {
  const snapshot = source.snapshot;
  const validSnapshot = validTemplate(snapshot);
  return {
    ...source,
    id: source._id,
    name: validSnapshot ? snapshot.name : '券面信息已失效',
    valueText: validSnapshot ? presentTemplate(snapshot, 0).valueText : '优惠待确认',
    thresholdText: validSnapshot ? presentTemplate(snapshot, 0).thresholdText : '使用条件待确认',
    validityText: [source.validFrom, source.validTo].filter(Boolean).map(value => String(value).slice(0, 10)).join(' 至 '),
    statusText: { available: '可使用', used: '已使用', expired: '已过期' }[source.status],
    usable: source.status === 'available' && validSnapshot
  };
}

function validCoupon(source, templateId = '') {
  return Boolean(isRecord(source) && typeof source._id === 'string' && source._id.trim()
    && typeof source.templateId === 'string' && source.templateId.trim() && (!templateId || source.templateId === templateId)
    && COUPON_STATUSES.has(source.status) && (source.status !== 'available' || validTemplate(source.snapshot)));
}

function createCouponWallet({ coupons, intentStore, createKey, onChange = () => {} }) {
  const empty = status => ({ status, errorText: '', templates: [], coupons: [], busyId: '', claimState: 'idle', claimText: '' });
  let state = empty('loading');
  let revision = 0;
  let disposed = false;
  let userId = '';
  let pendingIntent = null;
  let busy = false;
  let retryReady = false;
  const confirmedUncleared = new Map();
  const current = (token, owner) => !disposed && token === revision && owner === userId;
  const emit = patch => { if (!disposed) { state = { ...state, ...patch }; onChange(state); } return state; };

  async function load(input = {}) {
    if (disposed) return state;
    const token = ++revision;
    userId = typeof input.userId === 'string' ? input.userId.trim() : '';
    busy = false;
    retryReady = false;
    pendingIntent = null;
    emit(empty(userId ? 'loading' : 'forbidden'));
    if (!userId) return state;
    try {
      const stored = intentStore.get(userId);
      if (stored && (!isRecord(stored) || stored.userId !== userId || typeof stored.templateId !== 'string' || !stored.templateId.trim()
        || typeof stored.idempotencyKey !== 'string' || !stored.idempotencyKey.trim())) throw new Error('invalid stored intent');
      pendingIntent = stored ? { userId, templateId: stored.templateId, idempotencyKey: stored.idempotencyKey } : null;
    } catch (error) {
      return emit({ ...empty('error'), errorText: '领取记录暂时无法安全读取，请重新加载后重试' });
    }
    let results;
    try { results = await Promise.all([coupons.templatesAll(), coupons.listAll()]); } catch (error) { results = []; }
    if (!current(token, userId)) return state;
    if (results.some(revoked)) {
      userId = '';
      revision += 1;
      return emit({ ...empty('forbidden'), errorText: '登录状态已失效，请重新登录' });
    }
    const [templatesResult, couponsResult] = results;
    const templateRows = templatesResult && templatesResult.ok && templatesResult.data && templatesResult.data.rows;
    const couponRows = couponsResult && couponsResult.ok && couponsResult.data && couponsResult.data.rows;
    if (!Array.isArray(templateRows) || !Array.isArray(couponRows) || templateRows.some(row => !validTemplate(row))
      || couponRows.some(row => !isRecord(row) || typeof row._id !== 'string' || !row._id.trim() || typeof row.templateId !== 'string' || !COUPON_STATUSES.has(row.status)
        || row.status === 'available' && !validTemplate(row.snapshot))) {
      const failed = results.find(result => !result || !result.ok);
      return emit({ ...empty('error'), errorText: failed && failed.error && failed.error.message || '优惠券加载失败，请重试' });
    }
    const claimedCounts = couponRows.reduce((map, row) => map.set(row.templateId, (map.get(row.templateId) || 0) + 1), new Map());
    const presentedTemplates = templateRows.map(row => presentTemplate(row, claimedCounts.get(row._id) || 0));
    const presentedCoupons = couponRows.map(presentCoupon);
    emit({ status: presentedTemplates.length || presentedCoupons.length ? 'ready' : 'empty', errorText: '', templates: presentedTemplates, coupons: presentedCoupons });
    if (pendingIntent && confirmedUncleared.get(userId) === pendingIntent.idempotencyKey) {
      return emit({ claimState: 'confirmed', claimText: '领取已确认，本地记录清理失败，请重新打开后核对' });
    }
    if (current(token, userId) && pendingIntent) return resolveIntent(token, userId);
    return state;
  }

  async function confirmAndRefresh(owner) {
    let cleanupFailed = false;
    try { intentStore.remove(owner); confirmedUncleared.delete(owner); }
    catch (error) { cleanupFailed = true; confirmedUncleared.set(owner, pendingIntent.idempotencyKey); }
    if (!cleanupFailed) pendingIntent = null;
    retryReady = false;
    busy = false;
    await load({ userId: owner });
    if (!disposed && userId === owner) return emit({ busyId: '', claimState: 'confirmed', claimText: cleanupFailed
      ? '领取已确认，本地记录清理失败，请重新打开后核对'
      : state.status === 'error' ? '领取已确认，列表刷新失败，请重新加载' : '领取成功' });
    return state;
  }

  async function resolveIntent(token, owner) {
    if (!current(token, owner) || !pendingIntent || busy) return state;
    busy = true;
    emit({ busyId: pendingIntent.templateId, claimState: 'checking', claimText: '正在核对领取结果' });
    let result;
    try { result = await coupons.resolveClaim({ idempotencyKey: pendingIntent.idempotencyKey }); } catch (error) { result = null; }
    if (!current(token, owner)) return state;
    if (revoked(result)) {
      busy = false;
      userId = '';
      revision += 1;
      return emit({ ...empty('forbidden'), errorText: '登录状态已失效，请重新登录' });
    }
    const data = result && result.ok && result.data;
    if (data && data.found === true && data.idempotent === true && validCoupon(data.coupon, pendingIntent.templateId)) return confirmAndRefresh(owner);
    if (data && data.found === false) {
      busy = false;
      retryReady = true;
      return emit({ busyId: '', claimState: 'retry', claimText: '已核对本次领取尚未完成，可重试' });
    }
    busy = false;
    retryReady = false;
    return emit({ busyId: '', claimState: 'unknown', claimText: '领取结果暂时无法确认，请稍后继续核对' });
  }

  async function claim(templateId) {
    templateId = typeof templateId === 'string' ? templateId.trim() : '';
    const target = state.templates.find(row => row.id === templateId && row.canClaim);
    if (disposed || !userId || busy || !target) return state;
    const token = revision;
    const owner = userId;
    if (pendingIntent && confirmedUncleared.get(owner) === pendingIntent.idempotencyKey) {
      return emit({ claimState: 'confirmed', claimText: '领取已确认，本地记录清理失败，请重新打开后核对' });
    }
    if (pendingIntent && pendingIntent.templateId !== templateId) {
      return emit({ claimState: 'retry', claimText: '请先核对或重试上一张优惠券的领取结果' });
    }
    if (pendingIntent && !retryReady) return resolveIntent(token, owner);
    try {
      const intent = pendingIntent || { userId: owner, templateId, idempotencyKey: String(createKey() || '').trim() };
      if (!intent.idempotencyKey || intent.userId !== owner || intent.templateId !== templateId) throw new Error('invalid intent');
      intentStore.set(owner, intent);
      pendingIntent = intent;
    } catch (error) {
      return emit({ claimState: 'error', claimText: '领取记录暂时无法安全保存，请重新加载后重试' });
    }
    busy = true;
    emit({ busyId: templateId, claimState: 'claiming', claimText: '' });
    let result;
    try { result = await coupons.claim({ templateId, idempotencyKey: pendingIntent.idempotencyKey }); } catch (error) { result = null; }
    if (!current(token, owner)) return state;
    if (revoked(result)) {
      busy = false;
      userId = '';
      revision += 1;
      return emit({ ...empty('forbidden'), errorText: '登录状态已失效，请重新登录' });
    }
    const coupon = result && result.ok && result.data && result.data.coupon;
    if (validCoupon(coupon, templateId) && typeof result.data.idempotent === 'boolean') return confirmAndRefresh(owner);
    const error = result && result.ok === false && result.error;
    if (error && DEFINITIVE_CLAIM_CODES.has(error.code)) {
      try { intentStore.remove(owner); } catch (storageError) { /* A definitive rejection is safe to query again if cleanup fails. */ }
      pendingIntent = null;
      retryReady = false;
      busy = false;
      return emit({ busyId: '', claimState: 'error', claimText: error.message || '优惠券暂不可领取' });
    }
    busy = false;
    retryReady = false;
    return resolveIntent(token, owner);
  }

  function reset() { revision += 1; userId = ''; pendingIntent = null; busy = false; retryReady = false; return emit(empty('forbidden')); }
  function dispose() { revision += 1; userId = ''; pendingIntent = null; busy = false; retryReady = false; disposed = true; }
  return { load, claim, reset, dispose };
}

module.exports = { createCouponWallet };
