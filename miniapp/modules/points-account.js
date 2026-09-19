const POINT_ACTION_LABELS = { daily_sign_in: '每日签到', order_reward: '订单奖励', refund_reversal: '退款扣回', admin_adjust: '后台调整' };
function pointsNumber(value, allowNegative = false) {
  return typeof value === 'number' && Number.isSafeInteger(value) && (allowNegative || value >= 0) ? value : null;
}
function presentRow(row) {
  const change = pointsNumber(row.change, true);
  return {
    ...row, change,
    amountText: change === null ? '待确认' : `${change > 0 ? '+' : ''}${change}`,
    label: row.description || row.reason || POINT_ACTION_LABELS[row.action] || '积分变动',
    time: row.createdAt ? String(row.createdAt).replace('T', ' ').slice(0, 16) : '时间待确认'
  };
}
function isBusinessDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthDays = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return year > 0 && month >= 1 && month <= 12 && day >= 1 && day <= monthDays[month - 1];
}
function activeRule(rule) {
  return Boolean(rule && rule.code === 'daily_sign_in' && rule.status === 'active' && typeof rule.unavailableReason === 'string'
    && Number.isSafeInteger(rule.rewardPoints) && rule.rewardPoints > 0
    && (rule.version === null || (Number.isSafeInteger(rule.version) && rule.version > 0)));
}
function isRecord(value) { return Boolean(value && typeof value === 'object' && !Array.isArray(value)); }
function completeRule(rule) {
  return Boolean(isRecord(rule) && rule.code === 'daily_sign_in' && typeof rule.unavailableReason === 'string'
    && (activeRule(rule) || (rule.status === 'unavailable' && rule.rewardPoints === null && rule.unavailableReason.trim()
      && (rule.version === null || (Number.isSafeInteger(rule.version) && rule.version > 0)))));
}
function unavailableRuleText(reason) {
  const labels = { not_configured: '签到规则暂未配置', inactive: '签到活动已暂停', not_formal: '签到规则尚未正式发布', invalid_reward: '签到奖励暂不可用' };
  return Object.prototype.hasOwnProperty.call(labels, reason) ? labels[reason] : '签到规则暂不可用';
}

function confirmedSignIn(result) {
  const data = result && result.ok === true && result.data;
  return Boolean(data && isRecord(data.account) && isRecord(data.ledger)
    && pointsNumber(data.account.balance) !== null && pointsNumber(data.account.lifetimeEarned) !== null
    && typeof data.ledger._id === 'string' && data.ledger._id.trim() && data.ledger.action === 'daily_sign_in'
    && Number.isSafeInteger(data.ledger.change) && data.ledger.change > 0 && pointsNumber(data.ledger.balanceAfter) !== null
    && isBusinessDate(data.ledger.businessDate) && data.ledger.businessDate === data.businessDate
    && data.signedToday === true && isBusinessDate(data.businessDate) && completeRule(data.signInRule)
    && typeof data.idempotent === 'boolean');
}
function confirmedResolution(result) {
  return Boolean(confirmedSignIn(result) && result.data.found === true && result.data.idempotent === true);
}
function revoked(result) { return Boolean(result && !result.ok && result.error && ['UNAUTHENTICATED', 'AUTH_ACCOUNT_DISABLED', 'UNAUTHORIZED', 'FORBIDDEN', 'USER_DISABLED'].includes(result.error.code)); }

function createPointsAccount({ membership, intentStore, createKey, onChange = () => {} }) {
  const empty = () => ({ status: 'loading', errorText: '', account: null, profile: null, ledger: [], businessDate: '', signInRule: null, ruleText: '', canSignIn: false, signing: false, signState: 'idle', signText: '' });
  let state = empty();
  let revision = 0;
  let disposed = false;
  let userId = '';
  let busyToken = null;
  let pendingIntent = null;
  let retryReady = false;
  const current = token => !disposed && token === revision;
  const emit = patch => { if (!disposed) { state = { ...state, ...patch }; onChange(state); } return state; };
  async function load(input = {}) {
    if (disposed) return state;
    const token = ++revision;
    userId = input.userId || '';
    busyToken = null;
    pendingIntent = null;
    retryReady = false;
    emit(empty());
    if (!userId) return emit({ status: 'forbidden' });
    try {
      const stored = intentStore.get(userId);
      if (stored && (stored.userId !== userId || typeof stored.idempotencyKey !== 'string' || !stored.idempotencyKey.trim())) throw new Error('invalid stored intent');
      pendingIntent = stored ? { userId, idempotencyKey: stored.idempotencyKey, businessDate: isBusinessDate(stored.businessDate) ? stored.businessDate : '' } : null;
    } catch (error) { return emit({ status: 'error', errorText: '签到记录暂时无法安全读取，请重新加载后重试' }); }
    await readAccount(token);
    if (current(token) && pendingIntent) return resolveIntent(token, userId);
    return state;
  }
  async function readAccount(token) {
    let results;
    try { results = await Promise.all([membership.pointsAccount(), membership.profile(), membership.pointsLedgerAll()]); }
    catch (error) { results = []; }
    if (!current(token)) return state;
    const [accountResult, profileResult, ledgerResult] = results;
    if (results.some(revoked)) { reset(); return emit({ errorText: '登录状态已失效，请重新登录' }); }
    const failed = results.find(result => !result || !result.ok);
    if (results.length !== 3 || failed || !accountResult.data || !isRecord(accountResult.data.account)
      || !isBusinessDate(accountResult.data.businessDate) || typeof accountResult.data.signedToday !== 'boolean' || !completeRule(accountResult.data.signInRule)
      || !isRecord(profileResult.data) || !ledgerResult.data || !Array.isArray(ledgerResult.data.rows)
      || ledgerResult.data.rows.some(row => !isRecord(row))) {
      return emit({ status: 'error', account: null, profile: null, ledger: [], businessDate: '', signInRule: null, ruleText: '', canSignIn: false,
        errorText: failed && failed.error && failed.error.message || '积分数据加载失败，请重试' });
    }
    const source = accountResult.data;
    const profile = profileResult.data.profile || {};
    const level = profileResult.data.level;
    const balance = pointsNumber(source.account.balance);
    const rule = source.signInRule || null;
    const signedToday = typeof source.signedToday === 'boolean' ? source.signedToday : null;
    return emit({
      status: 'ready', account: { balance, balanceText: balance === null ? '暂不可用' : String(balance), signedToday },
      profile: { growthValue: pointsNumber(profile.lifetimePoints), levelName: level && level.name || '等级暂未配置', benefits: level && Array.isArray(level.benefits) ? level.benefits.map(String) : [] },
      businessDate: source.businessDate || '', signInRule: rule, ledger: ledgerResult.data.rows.map(presentRow),
      ruleText: activeRule(rule) ? `每日签到可获得${rule.rewardPoints}积分` : unavailableRuleText(rule && rule.unavailableReason),
      canSignIn: !pendingIntent && signedToday === false && isBusinessDate(source.businessDate) && activeRule(rule)
    });
  }
  async function confirmAndRefresh(token, owner) {
    if (!current(token)) return state;
    try { intentStore.remove(owner); } catch (error) { /* Confirmed writes can safely be resolved again after reopening. */ }
    pendingIntent = null;
    busyToken = null;
    const refreshToken = ++revision;
    emit(empty());
    await readAccount(refreshToken);
    if (!current(refreshToken)) return state;
    return emit({ signState: 'confirmed', signText: state.status === 'error' ? '签到已确认，数据刷新失败，请重新加载' : '签到已确认', signing: false });
  }
  async function resolveIntent(token, owner) {
    if (!current(token) || !pendingIntent) return state;
    busyToken = token;
    emit({ signing: true, canSignIn: false, signState: 'checking', signText: '正在核对签到结果' });
    let result;
    try { result = await membership.resolveSignIn({ idempotencyKey: pendingIntent.idempotencyKey }); } catch (error) { result = null; }
    if (!current(token)) return state;
    if (revoked(result)) { reset(); return emit({ errorText: '登录状态已失效，请重新登录' }); }
    if (confirmedResolution(result)) return confirmAndRefresh(token, owner);
    if (result && result.ok && result.data && result.data.found === false && isBusinessDate(result.data.businessDate)) {
      await readAccount(token);
      if (!current(token)) return state;
      retryReady = true;
      busyToken = null;
      return emit({ signing: false, signState: 'retry', signText: '已核对本次签到尚未完成，可重试',
        canSignIn: state.status === 'ready' && state.account.signedToday === false && isBusinessDate(state.businessDate) && activeRule(state.signInRule) });
    }
    busyToken = null;
    return emit({ signing: false, signState: 'unknown', signText: '签到结果暂时无法确认，请核对结果' });
  }
  async function signIn() {
    if (disposed || !userId || busyToken !== null) return state;
    const token = revision;
    const owner = userId;
    if (pendingIntent && !retryReady) return resolveIntent(token, owner);
    if (state.status !== 'ready' || !state.canSignIn) return state;
    let intent;
    try {
      intent = pendingIntent || { userId: owner, idempotencyKey: String(createKey() || ''), businessDate: state.businessDate };
      if (!intent.idempotencyKey) throw new Error('intent key unavailable');
      intentStore.set(owner, intent);
      pendingIntent = intent;
      retryReady = false;
    } catch (error) { return emit({ canSignIn: false, signState: 'error', signText: '签到记录暂时无法安全保存，请重新加载后重试' }); }
    busyToken = token;
    emit({ signing: true, canSignIn: false, signState: 'signing', signText: '' });
    let result;
    try { result = await membership.signIn({ idempotencyKey: intent.idempotencyKey }); } catch (error) { result = null; }
    if (!current(token)) return state;
    if (revoked(result)) { reset(); return emit({ errorText: '登录状态已失效，请重新登录' }); }
    if (confirmedSignIn(result)) return confirmAndRefresh(token, owner);
    return resolveIntent(token, owner);
  }
  function reset() { revision += 1; userId = ''; busyToken = null; pendingIntent = null; return emit({ ...empty(), status: 'forbidden' }); }
  function dispose() { revision += 1; disposed = true; userId = ''; }
  return { load, signIn, reset, dispose };
}

module.exports = { createPointsAccount };
