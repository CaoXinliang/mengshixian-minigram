const { presentFavorites } = require('./favorites-presentation');

const REVOKED_CODES = new Set(['UNAUTHENTICATED', 'AUTH_ACCOUNT_DISABLED', 'UNAUTHORIZED', 'FORBIDDEN', 'USER_DISABLED']);
const UNAVAILABLE_REASONS = new Set(['', 'sku_missing', 'sku_off_sale', 'product_missing', 'product_off_sale', 'not_permitted']);

function isText(value, allowEmpty = false) {
  return typeof value === 'string' && (allowEmpty || Boolean(value.trim()));
}

function validFavoriteRow(row) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return false;
  if (!isText(row._id) || !isText(row.skuId) || !isText(row.productId, true)) return false;
  if (![row.productNameSnapshot, row.specSnapshot, row.packageUnitSnapshot, row.mediaSnapshot].every(value => isText(value, true))) return false;
  if (typeof row.purchasable !== 'boolean' || !UNAVAILABLE_REASONS.has(row.unavailableReason)) return false;
  return row.purchasable ? row.unavailableReason === '' && Boolean(row.productId.trim()) : row.unavailableReason !== '';
}

function revoked(result) {
  return Boolean(result && result.ok === false && result.error && REVOKED_CODES.has(result.error.code));
}

function createFavoritesLifecycle({ favorites, resolveMedia = async () => ({}), onChange = () => {} }) {
  const empty = status => ({ status, errorText: '', rows: [], busyId: '' });
  let state = empty('loading');
  let revision = 0;
  let disposed = false;
  let userId = '';

  const current = (token, owner) => !disposed && token === revision && owner === userId;
  const emit = patch => {
    if (!disposed) {
      state = { ...state, ...patch };
      onChange(state);
    }
    return state;
  };

  async function fetchRows(token, owner) {
    let result;
    try { result = await favorites.listAll(); } catch (error) { result = null; }
    if (!current(token, owner)) return { kind: 'stale' };
    if (revoked(result)) return { kind: 'revoked' };
    const rows = result && result.ok && result.data && Array.isArray(result.data.rows) ? result.data.rows : null;
    const ids = rows && rows.map(row => row && row._id);
    if (!rows || rows.some(row => !validFavoriteRow(row)) || new Set(ids).size !== ids.length) {
      return { kind: 'error', message: result && result.error && result.error.message || '收藏加载失败，请重试' };
    }
    const mediaIds = [...new Set(rows.map(row => row.mediaSnapshot).filter(Boolean))];
    let mediaFiles = {};
    try { mediaFiles = mediaIds.length ? await resolveMedia(mediaIds) : {}; } catch (error) { mediaFiles = {}; }
    if (!current(token, owner)) return { kind: 'stale' };
    return { kind: 'ok', rows: presentFavorites(rows, mediaFiles && typeof mediaFiles === 'object' ? mediaFiles : {}) };
  }

  function publishRevoked() {
    userId = '';
    revision += 1;
    return emit({ ...empty('forbidden'), errorText: '登录状态已失效，请重新登录' });
  }

  function publishRows(presented) {
    emit({ status: presented.length ? 'ready' : 'empty', errorText: '', rows: presented, busyId: '' });
    return presented;
  }

  async function readRows(token, owner) {
    const fetched = await fetchRows(token, owner);
    if (fetched.kind === 'revoked') publishRevoked();
    else if (fetched.kind === 'error') emit({ ...empty('error'), errorText: fetched.message });
    else if (fetched.kind === 'ok') publishRows(fetched.rows);
    return fetched;
  }

  async function load(input = {}) {
    if (disposed) return state;
    const token = ++revision;
    userId = typeof input.userId === 'string' ? input.userId.trim() : '';
    emit(empty(userId ? 'loading' : 'forbidden'));
    if (!userId) return state;
    await readRows(token, userId);
    return state;
  }

  async function remove(id) {
    id = typeof id === 'string' ? id.trim() : '';
    if (disposed || !userId || state.busyId || !id || !state.rows.some(row => row.id === id && row.canRemove)) return state;
    const token = revision;
    const owner = userId;
    const before = state.rows;
    emit({
      busyId: id,
      rows: before.map(row => row.id === id ? { ...row, removing: true, removeState: 'removing', removeText: '' } : row)
    });
    let result;
    try { result = await favorites.remove({ id }); } catch (error) { result = null; }
    if (!current(token, owner)) return state;
    if (revoked(result)) return publishRevoked();
    const confirmed = Boolean(result && result.ok === true && result.data && result.data.removed === true && result.data.id === id);
    if (confirmed) {
      const remaining = before.filter(row => row.id !== id);
      publishRows(remaining);
      return state;
    }

    const failureText = result && result.ok === false && result.error && result.error.message || '';
    const checked = await fetchRows(token, owner);
    if (!current(token, owner)) return state;
    if (checked.kind === 'revoked') return publishRevoked();
    if (checked.kind === 'ok') {
      const exists = checked.rows.some(row => row.id === id);
      if (!exists) {
        publishRows(checked.rows);
        return state;
      }
      const rows = checked.rows.map(row => row.id === id ? {
        ...row,
        removing: false,
        removeState: 'error',
        removeText: failureText || '取消收藏未完成，请重试'
      } : row);
      emit({ status: 'ready', errorText: '', rows, busyId: '' });
      return state;
    }

    const rows = before.map(row => row.id === id ? {
      ...row,
      removing: false,
      removeState: 'unknown',
      removeText: '取消结果待核对，请重新加载'
    } : row);
    emit({ status: 'ready', errorText: '', rows, busyId: '' });
    return state;
  }

  function reset() {
    revision += 1;
    userId = '';
    return emit(empty('forbidden'));
  }

  function dispose() {
    revision += 1;
    userId = '';
    disposed = true;
  }

  return { load, remove, reset, dispose };
}

module.exports = { createFavoritesLifecycle };
