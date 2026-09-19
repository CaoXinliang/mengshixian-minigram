const assert = require('assert/strict');
const { createPointsAccount } = require('../miniapp/modules/points-account');
const ok = data => ({ ok: true, data });
const rule = { code: 'daily_sign_in', status: 'active', rewardPoints: 7, version: 3, unavailableReason: '' };
const fact = (patch = {}) => ({ account: { balance: 0, lifetimeEarned: 0 }, businessDate: '2040-01-01', signedToday: true, signInRule: rule, ...patch });
const confirmation = (patch = {}) => ({
  ...fact(), account: { balance: 7, lifetimeEarned: 7 },
  ledger: { _id: 'signed-ledger', action: 'daily_sign_in', change: 7, balanceAfter: 7, businessDate: patch.businessDate || '2040-01-01' },
  idempotent: false, ...patch
});
const tests = [];
function test(name, run) { tests.push({ name, run }); }
function make(overrides = {}, store = new Map()) {
  let state;
  let nextKey = 0;
  const membership = {
    pointsAccount: async () => ok(fact()),
    profile: async () => ok({ profile: { lifetimePoints: 0 }, level: null }),
    pointsLedgerAll: async () => ok({ rows: [] }),
    ...overrides
  };
  const module = createPointsAccount({ membership, intentStore: { get: id => store.get(id), set: (id, intent) => store.set(id, intent), remove: id => store.delete(id) }, createKey: () => `stable-${++nextKey}`, onChange: next => { state = next; } });
  return { module, membership, store, state: () => state };
}

test('server business day and explicit zero remain authoritative without ledger inference', async () => {
  const session = make();
  await session.module.load({ userId: 'u1' });
  const state = session.state();
  assert.equal(state.status, 'ready');
  assert.equal(state.account.balance, 0);
  assert.equal(state.account.balanceText, '0');
  assert.equal(state.profile.growthValue, 0);
  assert.equal(state.profile.levelName, '等级暂未配置');
  assert.equal(state.businessDate, '2040-01-01');
  assert.equal(state.account.signedToday, true);
  assert.equal(state.canSignIn, false);
  assert.equal(state.signInRule.rewardPoints, 7);
});

test('missing and malformed entitlements remain unknown, while ledger labels remain readable', async () => {
  for (const value of [undefined, null, '', ' ', 'bad', '0', '8', '-3', NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1, false, {}, []]) {
    const session = make({
      pointsAccount: async () => ok(fact({ account: { balance: value } })),
      profile: async () => ok({ profile: { lifetimePoints: value } }),
      pointsLedgerAll: async () => ok({ rows: [{ _id: 'p1', action: 'daily_sign_in', change: value }, { _id: 'p2', action: 'future_code', change: 0 }] })
    });
    await session.module.load({ userId: 'u1' });
    const state = session.state();
    assert.equal(state.account.balance, null);
    assert.equal(state.account.balanceText, '暂不可用');
    assert.equal(state.profile.growthValue, null);
    assert.equal(state.ledger[0].amountText, '待确认');
    assert.equal(state.ledger[0].label, '每日签到');
    assert.equal(state.ledger[1].label, '积分变动');
    assert.equal(state.ledger[1].amountText, '0');
  }
});

test('only a complete active server rule and explicit unsigned fact enable sign-in', async () => {
  for (const patch of [
    { signInRule: null }, { signInRule: { ...rule, status: 'unavailable', unavailableReason: '正式规则暂未配置' } },
    { signInRule: { ...rule, rewardPoints: null } }, { signInRule: { ...rule, rewardPoints: 0 } },
    { signInRule: { ...rule, version: 0 } }, { signInRule: { ...rule, unavailableReason: undefined } }, { signedToday: undefined }, { businessDate: '' },
    { businessDate: undefined }, { businessDate: '2040-13-01' }, { businessDate: '2040-02-30' }, { businessDate: '2041-02-29' }, { businessDate: '2040-2-01' }
  ]) {
    const session = make({ pointsAccount: async () => ok(fact({ signedToday: false, ...patch })) });
    await session.module.load({ userId: 'u1' });
    assert.equal(session.state().canSignIn, false);
    assert.equal(session.state().status, 'error', `incomplete account fact must fail: ${JSON.stringify(patch)}`);
    assert(session.state().errorText.length > 0);
    assert.equal(session.state().account, null);
    assert.deepEqual(session.state().ledger, []);
  }
  const session = make({ pointsAccount: async () => ok(fact({ signedToday: false })) });
  await session.module.load({ userId: 'u1' });
  assert.equal(session.state().canSignIn, true);
  assert.equal(session.state().ruleText, '每日签到可获得7积分');
});

test('load failures and incomplete successful responses expose no fake empty ledger', async () => {
  for (const override of [
    { pointsAccount: async () => { throw new Error('offline'); } },
    { pointsAccount: async () => ok({}) },
    { profile: async () => ({ ok: false, error: { message: '会员资料未就绪' } }) },
    { pointsLedgerAll: async () => ok({}) },
    { pointsLedgerAll: async () => ({ ok: false, error: { message: '流水未读齐' } }) }
  ]) {
    const session = make(override);
    await session.module.load({ userId: 'u1' });
    assert.equal(session.state().status, 'error');
    assert.equal(session.state().account, null);
    assert.equal(session.state().canSignIn, false);
  }
});

test('load revisions, reset and disposal stop stale assets from reappearing', async () => {
  let release;
  const session = make({ pointsAccount: () => new Promise(resolve => { release = resolve; }) });
  const pending = session.module.load({ userId: 'u1' });
  session.module.reset();
  release(ok(fact({ account: { balance: 999 } })));
  await pending;
  assert.equal(session.state().status, 'forbidden');
  assert.equal(session.state().account, null);
  const next = session.module.load({ userId: 'u2' });
  session.module.dispose();
  const before = session.state();
  release(ok(fact()));
  await next;
  assert.equal(session.state(), before, 'disposed module must not publish late updates');
});

test('sign-in persists its intent before writing and blocks duplicates until confirmed refresh', async () => {
  let release;
  let writes = 0;
  const session = make({ pointsAccount: async () => ok(fact({ signedToday: writes > 0 })), signIn: payload => {
    writes += 1;
    assert.equal(session.store.get('u1').idempotencyKey, payload.idempotencyKey);
    return new Promise(resolve => { release = resolve; });
  } });
  await session.module.signIn();
  assert.equal(writes, 0, 'no write before authorized loading');
  await session.module.load({ userId: 'u1' });
  const pending = session.module.signIn();
  await session.module.signIn();
  assert.equal(writes, 1);
  assert.equal(session.state().signing, true);
  release(ok(confirmation()));
  await pending;
  assert.equal(session.state().account.signedToday, true);
  assert.equal(session.state().signState, 'confirmed');
  assert.equal(session.store.has('u1'), false);
  await session.module.signIn();
  assert.equal(writes, 1);
});

test('timeout resolves before retry and a reconstructed page recovers the same user intent', async () => {
  const events = [];
  let found = false;
  let unavailable = true;
  const session = make({
    pointsAccount: async () => ok(fact({ signedToday: found })),
    signIn: async ({ idempotencyKey }) => { events.push(`write:${idempotencyKey}`); return { ok: false, error: { code: 'REQUEST_TIMEOUT' } }; },
    resolveSignIn: async ({ idempotencyKey }) => {
      events.push(`resolve:${idempotencyKey}`);
      return unavailable ? { ok: false, error: { code: 'REQUEST_TIMEOUT' } } : ok({ found: true, ...confirmation({ idempotent: true }) });
    }
  });
  await session.module.load({ userId: 'u1' });
  await session.module.signIn();
  assert.deepEqual(events, ['write:stable-1', 'resolve:stable-1']);
  assert.equal(session.state().signState, 'unknown');
  await session.module.signIn();
  assert.deepEqual(events, ['write:stable-1', 'resolve:stable-1', 'resolve:stable-1'], 'unknown retries query only');
  session.module.dispose();
  unavailable = false;
  found = true;
  const reopened = make(session.membership, session.store);
  await reopened.module.load({ userId: 'u1' });
  assert.equal(events.at(-1), 'resolve:stable-1');
  assert.equal(reopened.state().signState, 'confirmed');
  assert.equal(reopened.store.has('u1'), false);
  assert.equal(events.filter(item => item.startsWith('write:')).length, 1);
});

test('only definitive absence permits retry with the same key, even after a business-day rollover', async () => {
  const keys = [];
  const session = make({
    pointsAccount: async () => ok(fact({ signedToday: keys.length > 1, businessDate: '2040-01-02' })),
    signIn: async ({ idempotencyKey }) => { keys.push(idempotencyKey); return keys.length === 1 ? { ok: false } : ok(confirmation({ businessDate: '2040-01-02' })); },
    resolveSignIn: async () => ok({ found: false, businessDate: '2040-01-02' })
  });
  await session.module.load({ userId: 'u1' });
  await session.module.signIn();
  assert.equal(session.state().signState, 'retry');
  await session.module.signIn();
  assert.deepEqual(keys, ['stable-1', 'stable-1']);
  assert.equal(session.state().signState, 'confirmed');
});

test('incomplete resolution remains unknown and never starts a second write', async () => {
  for (const data of [{ found: false }, { found: true }, { ...confirmation(), found: true, account: null }, { ...confirmation(), found: true, signInRule: null }, { ...confirmation(), found: true, signInRule: { code: 'daily_sign_in' } }, { ...confirmation(), found: true, ledger: [] }]) {
    let writes = 0;
    const session = make({ pointsAccount: async () => ok(fact({ signedToday: false })), signIn: async () => { writes += 1; return { ok: false }; }, resolveSignIn: async () => ok(data) });
    await session.module.load({ userId: 'u1' });
    await session.module.signIn();
    await session.module.signIn();
    assert.equal(session.state().signState, 'unknown');
    assert.equal(writes, 1);
  }
});

test('confirmed sign-in stays confirmed when subsequent account refresh fails', async () => {
  let signed = false;
  const session = make({ pointsAccount: async () => signed ? { ok: false } : ok(fact({ signedToday: false })), signIn: async () => { signed = true; return ok(confirmation()); } });
  await session.module.load({ userId: 'u1' });
  await session.module.signIn();
  assert.equal(session.state().status, 'error');
  assert.equal(session.state().signState, 'confirmed');
  assert.equal(session.state().signText, '签到已确认，数据刷新失败，请重新加载');
  assert.equal(session.state().account, null);
  assert.equal(session.state().canSignIn, false);
});

test('old-user sign-in completion and disposed actions never publish into a new context', async () => {
  for (const action of ['switch', 'dispose']) {
    let release;
    const session = make({ pointsAccount: async () => ok(fact({ signedToday: false })), signIn: () => new Promise(resolve => { release = resolve; }) });
    await session.module.load({ userId: 'u1' });
    const pending = session.module.signIn();
    if (action === 'switch') await session.module.load({ userId: 'u2' });
    else session.module.dispose();
    const current = session.state();
    release(ok(confirmation()));
    await pending;
    assert.equal(session.state(), current);
    assert.equal(session.store.has('u1'), true, 'ignored old result remains recoverable by its owner');
    assert.equal(session.store.has('u2'), false);
  }
});

test('resolving yesterday refreshes today and leaves a new legitimate sign-in available', async () => {
  const store = new Map([['u1', { userId: 'u1', idempotencyKey: 'yesterday-key', businessDate: '2039-12-31' }]]);
  const session = make({
    pointsAccount: async () => ok(fact({ signedToday: false })),
    resolveSignIn: async () => ok({ found: true, ...confirmation({ businessDate: '2039-12-31', idempotent: true }) }),
    signIn: async () => ok(confirmation())
  }, store);
  await session.module.load({ userId: 'u1' });
  assert.equal(session.state().businessDate, '2040-01-01');
  assert.equal(session.state().account.signedToday, false);
  assert.equal(session.state().canSignIn, true);
  await session.module.signIn();
  assert.equal(session.state().signState, 'confirmed');
  assert.equal(store.has('u1'), false);
});

test('server revocation during sign-in clears protected assets without further writes', async () => {
  const session = make({ pointsAccount: async () => ok(fact({ signedToday: false })), signIn: async () => ({ ok: false, error: { code: 'UNAUTHORIZED' } }) });
  await session.module.load({ userId: 'u1' });
  await session.module.signIn();
  assert.equal(session.state().status, 'forbidden');
  assert.equal(session.state().account, null);
  assert.deepEqual(session.state().ledger, []);
  assert.equal(session.state().canSignIn, false);
});

test('confirmed historical sign-in accepts an unavailable current rule with its retained version', async () => {
  for (const version of [3, null]) {
    const store = new Map([['u1', { userId: 'u1', idempotencyKey: 'historical-key', businessDate: '2039-12-31' }]]);
    const unavailableRule = { ...rule, status: 'unavailable', rewardPoints: null, version, unavailableReason: 'inactive' };
    const session = make({
      pointsAccount: async () => ok(fact({ signInRule: unavailableRule })),
      resolveSignIn: async () => ok({ found: true, ...confirmation({ signInRule: unavailableRule, idempotent: true }) })
    }, store);
    await session.module.load({ userId: 'u1' });
    assert.equal(session.state().signState, 'confirmed');
    assert.equal(session.state().canSignIn, false);
    assert.equal(session.state().ruleText, '签到活动已暂停');
  }
});

test('real backend authentication codes clear assets on both sign-in and resolution', async () => {
  for (const code of ['UNAUTHENTICATED', 'AUTH_ACCOUNT_DISABLED']) {
    for (const action of ['signIn', 'resolveSignIn']) {
      let writes = 0;
      const session = make({
        pointsAccount: async () => ok(fact({ signedToday: false })),
        signIn: async () => { writes += 1; return { ok: false, error: { code: action === 'signIn' ? code : 'REQUEST_TIMEOUT' } }; },
        resolveSignIn: async () => ({ ok: false, error: { code } })
      });
      await session.module.load({ userId: 'u1' });
      await session.module.signIn();
      assert.equal(session.state().status, 'forbidden', `${action}: ${code}`);
      assert.equal(session.state().account, null);
      assert.equal(session.state().profile, null);
      assert.deepEqual(session.state().ledger, []);
      assert.equal(session.state().canSignIn, false);
      await session.module.signIn();
      assert.equal(writes, 1, 'revoked context must not issue another write');
    }
  }
});

test('active rules accept null or a positive integer version without inventing one', async () => {
  for (const version of [null, 1, 3]) {
    const nullVersionRule = { ...rule, version };
    const session = make({
      pointsAccount: async () => ok(fact({ signedToday: false, signInRule: nullVersionRule })),
      signIn: async () => ok(confirmation({ signInRule: nullVersionRule }))
    });
    await session.module.load({ userId: 'u1' });
    assert.equal(session.state().canSignIn, true);
    assert.equal(session.state().signInRule.version, version);
    await session.module.signIn();
    assert.equal(session.state().signState, 'confirmed');
  }
});

test('negative balances and growth are unknown but signed ledger debits remain real', async () => {
  const session = make({
    pointsAccount: async () => ok(fact({ account: { balance: -5 } })),
    profile: async () => ok({ profile: { lifetimePoints: -8 } }),
    pointsLedgerAll: async () => ok({ rows: [{ _id: 'debit', action: 'refund_reversal', change: -5 }] })
  });
  await session.module.load({ userId: 'u1' });
  assert.equal(session.state().account.balance, null);
  assert.equal(session.state().account.balanceText, '暂不可用');
  assert.equal(session.state().profile.growthValue, null);
  assert.equal(session.state().ledger[0].change, -5);
  assert.equal(session.state().ledger[0].amountText, '-5');
});

test('a valid owner and key recover a persisted intent even when its local date is damaged', async () => {
  for (const businessDate of [undefined, null, '', 'broken', '2040-02-30']) {
    for (const found of [true, false]) {
      const store = new Map([['u1', { userId: 'u1', idempotencyKey: 'recoverable-key', businessDate }]]);
      const events = [];
      const session = make({
        pointsAccount: async () => ok(fact({ signedToday: found })),
        resolveSignIn: async payload => {
          events.push(['resolve', payload]);
          return ok(found ? { ...confirmation({ idempotent: true }), found: true } : { found: false, businessDate: '2040-01-01' });
        },
        signIn: async payload => { events.push(['write', payload]); return ok(confirmation()); }
      }, store);
      await session.module.load({ userId: 'u1' });
      assert.equal(session.state().signState, found ? 'confirmed' : 'retry');
      assert.deepEqual(events, [['resolve', { idempotencyKey: 'recoverable-key' }]], 'local date is never a resolution prerequisite or input');
      if (!found) {
        await session.module.signIn();
        assert.deepEqual(events[1], ['write', { idempotencyKey: 'recoverable-key' }]);
        assert.equal(session.state().signState, 'confirmed');
      }
    }
  }
});

test('incomplete sign-in and resolution records retain the intent until complete evidence arrives', async () => {
  const malformed = [
    ['empty account and ledger', data => ({ ...data, account: {}, ledger: {} })],
    ['missing balance', data => ({ ...data, account: { lifetimeEarned: 7 } })],
    ['negative balance', data => ({ ...data, account: { balance: -1, lifetimeEarned: 7 } })],
    ['string balance', data => ({ ...data, account: { balance: '7', lifetimeEarned: 7 } })],
    ['missing lifetime earned', data => ({ ...data, account: { balance: 7 } })],
    ['negative lifetime earned', data => ({ ...data, account: { balance: 7, lifetimeEarned: -1 } })],
    ['unsafe lifetime earned', data => ({ ...data, account: { balance: 7, lifetimeEarned: Number.MAX_SAFE_INTEGER + 1 } })],
    ['empty ledger id', data => ({ ...data, ledger: { ...data.ledger, _id: ' ' } })],
    ['wrong ledger action', data => ({ ...data, ledger: { ...data.ledger, action: 'order_reward' } })],
    ['missing ledger change', data => ({ ...data, ledger: { ...data.ledger, change: undefined } })],
    ['zero ledger change', data => ({ ...data, ledger: { ...data.ledger, change: 0 } })],
    ['string ledger change', data => ({ ...data, ledger: { ...data.ledger, change: '7' } })],
    ['missing balance after', data => ({ ...data, ledger: { ...data.ledger, balanceAfter: undefined } })],
    ['negative balance after', data => ({ ...data, ledger: { ...data.ledger, balanceAfter: -1 } })],
    ['invalid ledger date', data => ({ ...data, ledger: { ...data.ledger, businessDate: '2040-02-30' } })],
    ['different ledger date', data => ({ ...data, ledger: { ...data.ledger, businessDate: '2039-12-31' } })]
  ];
  for (const [name, corrupt] of malformed) {
    for (const action of ['signIn', 'resolveSignIn']) {
      const invalid = corrupt(confirmation({ idempotent: action === 'resolveSignIn' }));
      let writes = 0;
      const session = make({
        pointsAccount: async () => ok(fact({ signedToday: false })),
        signIn: async () => { writes += 1; return action === 'signIn' ? ok(invalid) : { ok: false }; },
        resolveSignIn: async () => action === 'resolveSignIn' ? ok({ ...invalid, found: true }) : { ok: false }
      });
      await session.module.load({ userId: 'u1' });
      await session.module.signIn();
      assert.equal(session.state().signState, 'unknown', `${action}: ${name}`);
      assert.equal(session.store.get('u1').idempotencyKey, 'stable-1');
      await session.module.signIn();
      assert.equal(writes, 1, 'unknown outcomes can only be queried again');
    }
  }
});

test('resolution requires idempotent true while a complete direct sign-in may be new or replayed', async () => {
  const session = make({
    pointsAccount: async () => ok(fact({ signedToday: false })), signIn: async () => ({ ok: false }),
    resolveSignIn: async () => ok({ ...confirmation(), found: true })
  });
  await session.module.load({ userId: 'u1' });
  await session.module.signIn();
  assert.equal(session.state().signState, 'unknown');
  assert.equal(session.store.has('u1'), true);
  for (const idempotent of [false, true]) {
    const direct = make({ pointsAccount: async () => ok(fact({ signedToday: false })), signIn: async () => ok(confirmation({ idempotent })) });
    await direct.module.load({ userId: 'u1' });
    await direct.module.signIn();
    assert.equal(direct.state().signState, 'confirmed');
    assert.equal(direct.store.has('u1'), false);
  }
});

test('unavailable rule reasons are safe Chinese copy rather than server machine codes', async () => {
  for (const [reason, expected] of [
    ['not_configured', '签到规则暂未配置'], ['inactive', '签到活动已暂停'],
    ['not_formal', '签到规则尚未正式发布'], ['invalid_reward', '签到奖励暂不可用'],
    ['internal_rule_failure', '签到规则暂不可用'], ['内部异常详情', '签到规则暂不可用'], ['__proto__', '签到规则暂不可用']
  ]) {
    const session = make({ pointsAccount: async () => ok(fact({ signInRule: { ...rule, status: 'unavailable', rewardPoints: null, unavailableReason: reason } })) });
    await session.module.load({ userId: 'u1' });
    assert.equal(session.state().status, 'ready');
    assert.equal(session.state().ruleText, expected);
    assert.equal(session.state().canSignIn, false);
  }
});

async function run() {
  for (const item of tests) { await item.run(); console.log(`PASS ${item.name}`); }
  console.log(`points account test: ${tests.length} passed`);
}
run().catch(error => { console.error(error); process.exit(1); });
