const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const apiSource = fs.readFileSync(path.join(root, 'web-preview', 'services', 'api.js'), 'utf8');
const appSource = fs.readFileSync(path.join(root, 'web-preview', 'app.js'), 'utf8');

for (const action of ['bundles.list', 'bundles.get', 'bundles.quote', 'groups.mine', 'coupons.templates', 'coupons.claim', 'coupons.list', 'points.account', 'points.signIn', 'points.ledger', 'membership.profile', 'reviews.list', 'reviews.eligible', 'reviews.create', 'reviews.mine', 'invoiceTitles.list', 'invoiceTitles.upsert', 'invoiceTitles.delete', 'invoices.request', 'invoices.list', 'invoices.get', 'storedValue.account', 'storedValue.ledger', 'storedValue.topupIntent']) assert(apiSource.includes(`'${action}'`), `${action} web adapter is required`);
assert.match(appSource, /if \(!state\.user\.loggedIn \|\| window\.MengshixianApi\?\.config\.provider !== 'cloudbase'\) return;/, 'account services must not load before login');
assert.match(appSource, /protectedPage = \[[^\]]*'bundles'[^\]]*'storedValue'/, 'bundle and stored-value account views must be login protected');
assert.match(appSource, /favorites\.save\(\{ skuId: sku\.id/, 'B and C users need real favorites persistence');
assert.match(appSource, /coupons\.claim\(\{ templateId:[\s\S]*idempotencyKey:/, 'coupon claim must be idempotent');
assert.match(appSource, /points\.signIn\(\{ idempotencyKey:/, 'daily sign in must be idempotent');
assert.match(appSource, /reviews\.create\(\{ orderId, orderItemId,[\s\S]*idempotencyKey:/, 'review creation must bind an eligible order item and idempotency');
assert.match(appSource, /invoices\.request\(\{ orderId:[\s\S]*titleId:[\s\S]*idempotencyKey:/, 'invoice request must bind order/title and idempotency');
assert.match(appSource, /intent\?\.status === 'unavailable' && unchanged/, 'unavailable top-up must verify unchanged balance');
assert.match(appSource, /不会伪造支付或退款成功/, 'group UI must preserve real channel boundary');
assert.match(appSource, /评价提交后进入审核，不会立即公开/, 'review UI must not imply immediate publication');

console.log('web commerce services contract: passed');
