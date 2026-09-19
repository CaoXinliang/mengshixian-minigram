const assert = require('node:assert/strict');
const test = require('node:test');

const { classifyPhoneAuthorization, isSessionExpired } = require('../miniapp/modules/login-flow');

test('phone authorization result keeps refusal, unsupported platform and transport failure distinct', () => {
  assert.deepEqual(classifyPhoneAuthorization({ errMsg: 'getPhoneNumber:ok', code: 'phone-code-1' }), { status: 'authorized', code: 'phone-code-1', message: '' });
  assert.deepEqual(classifyPhoneAuthorization({ errMsg: 'getPhoneNumber:fail user deny' }), { status: 'denied', code: '', message: '您已拒绝手机号授权，可重试或先返回浏览' });
  assert.deepEqual(classifyPhoneAuthorization({ errMsg: 'getPhoneNumber:fail api scope is not declared' }), { status: 'unsupported', code: '', message: '当前微信环境暂不支持手机号授权，请更新微信后重试' });
  assert.deepEqual(classifyPhoneAuthorization({ errMsg: 'getPhoneNumber:fail timeout' }), { status: 'failed', code: '', message: '手机号授权失败，请检查网络后重试' });
  assert.deepEqual(classifyPhoneAuthorization(null), { status: 'failed', code: '', message: '手机号授权失败，请稍后重试' });
});

test('success without a one-time phone code is not treated as an authorized phone', () => {
  assert.deepEqual(classifyPhoneAuthorization({ errMsg: 'getPhoneNumber:ok' }), { status: 'failed', code: '', message: '手机号授权凭证缺失，请重新授权' });
});

test('only known authentication expiry responses clear the local session', () => {
  for (const code of ['AUTH_ACCOUNT_DISABLED', 'AUTH_SESSION_EXPIRED', 'AUTH_EXPIRED', 'AUTH_REQUIRED', 'UNAUTHORIZED']) {
    assert.equal(isSessionExpired({ error: { code } }), true);
  }
  assert.equal(isSessionExpired({ error: { code: 'NETWORK_TIMEOUT' } }), false);
  assert.equal(isSessionExpired(null), false);
});
