const assert = require('assert/strict');
const Module = require('module');
const path = require('path');
const originalLoad = Module._load; const pages = []; let sensitiveCalls = 0;
const sensitive = () => { sensitiveCalls += 1; return Promise.resolve({ ok: true, data: { rows: [] } }); };
const services = { auth: { getMe: async () => ({ ok: false, error: { code: 'UNAUTHORIZED' } }) }, membership: { pointsAccount: sensitive, profile: sensitive, pointsLedger: sensitive }, favorites: { list: sensitive, listAll: sensitive }, coupons: { templatesAll: sensitive, listAll: sensitive }, reviews: { eligible: sensitive, mine: sensitive }, invoices: { titles: sensitive, list: sensitive }, orders: { list: sensitive }, storedValue: { account: sensitive, ledger: sensitive } };
Module._load = function (request, parent, isMain) { if (request === '../../../services/index') return services; return originalLoad.call(this, request, parent, isMain); };
global.Page = definition => pages.push(definition); global.wx = { navigateBack() {} };
const memberPages = ['account', 'membership', 'points', 'favorites', 'reviews', 'invoices', 'stored-value'];
try {
  memberPages.forEach(name => require(path.resolve(__dirname, `../miniapp/package-member/pages/${name}/index.js`)));
  require(path.resolve(__dirname, '../miniapp/package-marketing/pages/coupons/index.js'));
} finally { Module._load = originalLoad; delete global.Page; }
const makePage = definition => Object.assign({}, definition, { data: JSON.parse(JSON.stringify(definition.data)), setData(patch) { Object.assign(this.data, patch); } });
(async () => {
  const protectedData = {
    account: { account: { identityLabel: '上一账号' } },
    membership: { model: { levelName: '上一账号等级' } },
    points: { account: { balance: 88 }, profile: { level: '旧等级' }, ledger: [{ id: 'old' }] },
    favorites: { rows: [{ id: 'old-favorite' }] },
    coupons: { templates: [{ id: 'old-template' }], coupons: [{ id: 'old-coupon' }] }
  };
  for (const [index, definition] of pages.entries()) {
    const page = makePage(definition);
    const stale = protectedData[memberPages[index] || 'coupons'] || {};
    page.setData(stale);
    await page.load();
    assert.equal(page.data.status, 'forbidden');
    for (const key of Object.keys(stale)) {
      assert.deepEqual(page.data[key], Array.isArray(stale[key]) ? [] : null, `${key} from the prior account must be cleared`);
    }
  }
  assert.equal(sensitiveCalls, 0, 'logged-out users must not request member-private data');
  console.log('member auth isolation test: passed');
})().catch(error => { console.error(error); process.exit(1); });
