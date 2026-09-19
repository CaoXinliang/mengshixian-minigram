const SESSION_EXPIRY_CODES = new Set(['AUTH_ACCOUNT_DISABLED', 'AUTH_SESSION_EXPIRED', 'AUTH_EXPIRED', 'AUTH_REQUIRED', 'UNAUTHORIZED']);

function classifyPhoneAuthorization(detail) {
  if (!detail) return { status: 'failed', code: '', message: '手机号授权失败，请稍后重试' };
  const errMsg = String(detail.errMsg || '');
  const code = String(detail.code || '').trim();
  if (errMsg === 'getPhoneNumber:ok') {
    return code
      ? { status: 'authorized', code, message: '' }
      : { status: 'failed', code: '', message: '手机号授权凭证缺失，请重新授权' };
  }
  if (/deny|cancel/i.test(errMsg)) return { status: 'denied', code: '', message: '您已拒绝手机号授权，可重试或先返回浏览' };
  if (/not support|unsupported|scope is not declared|api not found/i.test(errMsg)) return { status: 'unsupported', code: '', message: '当前微信环境暂不支持手机号授权，请更新微信后重试' };
  return { status: 'failed', code: '', message: /timeout|network/i.test(errMsg) ? '手机号授权失败，请检查网络后重试' : '手机号授权失败，请稍后重试' };
}

function isSessionExpired(result) {
  return SESSION_EXPIRY_CODES.has(result && result.error && result.error.code);
}

module.exports = { classifyPhoneAuthorization, isSessionExpired };
