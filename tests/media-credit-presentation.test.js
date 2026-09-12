const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../miniapp');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

// Read the final declarations rather than matching obsolete rules earlier in the file.
function declarations(source, selector) {
  const rules = source.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g);
  const normalize = value => value.replace(/\s+/g, '');
  const result = {};
  for (const [, selectors, body] of rules) {
    if (!selectors.split(',').some(value => normalize(value) === normalize(selector))) continue;
    for (const declaration of body.split(';')) {
      const colon = declaration.indexOf(':');
      if (colon > -1) result[declaration.slice(0, colon).trim()] = declaration.slice(colon + 1).trim();
    }
  }
  return result;
}

function mediaLayoutContracts() {
  const review = read('package-member/pages/reviews/index.wxss');
  const aftersale = read('package-trade/pages/aftersale-apply/index.wxss');
  for (const [name, source, selector, addSelector] of [
    ['review', review, '.media', '.media > .media-add'],
    ['aftersale', aftersale, '.evidence', '.evidence > button']
  ]) {
    const grid = declarations(source, selector);
    assert.equal(grid.display, 'grid', `${name} media must use a wrapping grid`);
    assert.equal(grid['grid-template-columns'], 'repeat(auto-fill, minmax(120px, 1fr))');
    assert.equal(grid.gap, '8px');
    const add = declarations(source, addSelector);
    assert.equal(add.width, '100%', `${name} add action must not inherit a tiny rpx width`);
    assert.equal(add['min-width'], '0');
    assert.equal(add['white-space'], 'normal', `${name} add action must allow complete large-font text`);
    assert.equal(add['line-height'], '1.4');
  }
  assert.equal(declarations(review, '.media-actions')['grid-template-columns'], 'repeat(auto-fit, minmax(48px, 1fr))');
  assert.equal(declarations(review, '.media-actions > button')['white-space'], 'normal');
  assert.equal(declarations(review, '.media > view').width, '100%');
  assert.equal(declarations(aftersale, '.evidence > view').width, '100%');

  // This is a layout contract, not a substitute for final WeChat simulator screenshots.
  for (const viewport of [320, 375, 390, 414, 480]) {
    const contentWidth = viewport - (18 * 2 + 24 * 2) * viewport / 750;
    const columns = Math.floor((contentWidth + 8) / (120 + 8));
    const cellWidth = (contentWidth - (columns - 1) * 8) / columns;
    assert(columns >= 2 && cellWidth >= 120, `${viewport}px must retain usable media columns`);
    const actionWidth = (cellWidth - 6) / 2;
    assert(actionWidth >= 26 * 2 + 4 * 2, `${viewport}px must fit two-character retry/remove at 26px`);
  }
  const reviewMarkup = read('package-member/pages/reviews/index.wxml');
  for (const handler of ['retryMedia', 'removeMedia', 'chooseMedia']) assert(reviewMarkup.includes(`bindtap="${handler}"`));
  const aftersaleMarkup = read('package-trade/pages/aftersale-apply/index.wxml');
  assert(aftersaleMarkup.includes('＋ 添加凭证'));
  for (const handler of ['retryEvidence', 'removeEvidence', 'chooseEvidence']) assert(aftersaleMarkup.includes(`bindtap="${handler}"`));
}

async function creditDisplayContracts() {
  const cases = [
    ['open', '待结算'], ['partial', '部分结算'], ['paid', '已结清'],
    ['credited', '已冲减'], ['partial_credit', '部分冲减'],
    ['future_internal_code', '状态待确认'], ['', '状态待确认'],
    [null, '状态待确认'], ['toString', '状态待确认'], ['__proto__', '状态待确认']
  ];
  const actions = [
    ['credit_reserved', '额度已占用'], ['credit_released', '额度已释放'],
    ['receivable_created', '应收已生成'], ['receivable_settled', '应收已核销'],
    ['receivable_refund_credit', '售后应收冲减'], ['unknown_action', '状态待确认'],
    ['toString', '状态待确认']
  ];
  const statements = cases.map(([status], index) => Object.freeze({ _id: `s${index}`, status, amountCent: 15000, outstandingCent: 5000 }));
  const receivables = [
    ...actions.map(([action], index) => Object.freeze({ _id: `r${index}`, action, amountCent: 15000 })),
    ...cases.map(([status], index) => Object.freeze({ _id: `rs${index}`, status, amountCent: 2500 }))
  ];
  const snapshot = JSON.stringify({ statements, receivables });
  const ok = data => ({ ok: true, data });
  const services = {
    auth: { getMe: async () => ok({ user: { userType: 'b', businessStatus: 'approved', organizationId: 'org-test', status: 'active' } }) },
    procurement: {
      getAccount: async () => ok({ account: { creditLimitCent: 100000, occupiedCent: 20000, receivableCent: 15000, availableCent: 65000 } }),
      listAllReceivables: async () => ok({ rows: receivables }),
      listAllStatements: async () => ok({ rows: statements })
    }
  };
  const file = path.join(root, 'package-business/pages/center/index.js');
  let definition;
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), {
    Page(value) { definition = value; },
    require(name) { return name === '../../../services/index' ? services : require(path.resolve(path.dirname(file), name)); },
    wx: { navigateTo() {}, navigateBack() {} }
  }, { filename: file });
  const page = Object.assign({}, definition, {
    data: JSON.parse(JSON.stringify(definition.data)),
    setData(patch) { Object.assign(this.data, patch); }
  });
  await page.load();
  assert.equal(page.data.status, 'ready');
  assert.deepEqual(Array.from(page.data.statements, row => row.statusText), cases.map(([, text]) => text));
  assert.deepEqual(Array.from(page.data.receivables, row => row.statusText), [...actions, ...cases].map(([, text]) => text));
  assert.deepEqual(Array.from(page.data.statements, row => row.status), cases.map(([status]) => status));
  assert.deepEqual(Array.from(page.data.receivables.slice(0, actions.length), row => row.action), actions.map(([action]) => action));
  assert(page.data.statements.every(row => row.amountCent === 15000 && row.outstandingCent === 5000 && row.amount === '150.00'));
  assert.equal(page.data.account.creditAvailable, '650.00');
  assert.equal(JSON.stringify({ statements, receivables }), snapshot, 'display mapping must not mutate backend states or amounts');
  const markup = read('package-business/pages/center/index.wxml');
  assert.equal((markup.match(/\{\{item\.statusText\}\}/g) || []).length, 2);
  assert.doesNotMatch(markup, /\{\{item\.(?:status|action)(?:\s|\})/, 'raw credit codes must not reach customer-facing templates');
}

async function run() {
  mediaLayoutContracts();
  await creditDisplayContracts();
  console.log('media grid and credit presentation test: passed');
}

run().catch(error => { console.error(error); process.exitCode = 1; });
