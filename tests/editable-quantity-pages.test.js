const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../miniapp');
const cases = [
  ['package-business/pages/frequent/index', 'changeQuantity'],
  ['package-business/pages/inquiry-create/index', 'quantity'],
  ['package-marketing/pages/bundle-detail/index', 'changeQty'],
  ['package-trade/pages/aftersale-apply/index', 'changeQuantity']
];

for (const [relative, handler] of cases) {
  const config = JSON.parse(fs.readFileSync(path.join(root, `${relative}.json`), 'utf8'));
  const template = fs.readFileSync(path.join(root, `${relative}.wxml`), 'utf8');
  assert.equal(config.usingComponents && config.usingComponents['quantity-stepper'], '/components/quantity-stepper/index', `${relative} must register the shared editable quantity control`);
  assert.match(template, new RegExp(`<quantity-stepper\\b[^>]*bind:change="${handler}"`), `${relative} must render the shared editable quantity control`);
}

console.log('editable quantity pages test: passed');
