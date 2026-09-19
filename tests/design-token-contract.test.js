const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const appWxss = read('miniapp/app.wxss');
const topbarWxss = read('miniapp/components/responsive-topbar/index.wxss');
const sharedComponentWxss = [
  'miniapp/components/app-tabbar/index.wxss',
  'miniapp/components/content-state/index.wxss',
  'miniapp/components/product-card/index.wxss',
  'miniapp/components/product-purchase-action/index.wxss',
].map(read).join('\n');

const requiredTokens = {
  '--color-brand-primary': '#176bd5',
  '--color-brand-soft': '#eaf2fd',
  '--color-text-primary': '#0f1b2d',
  '--color-text-secondary': '#667085',
  '--color-surface-page': '#f5f8fc',
  '--color-surface-card': '#ffffff',
  '--color-border-default': '#d7e2ef',
  '--color-state-success': '#1aa76c',
  '--color-state-warning': '#d98b26',
  '--color-state-danger': '#e65353',
  '--space-sm': '8px',
  '--space-md': '12px',
  '--space-lg': '16px',
  '--radius-card': '14px',
  '--radius-pill': '22px',
};

for (const [name, value] of Object.entries(requiredTokens)) {
  assert.match(
    appWxss,
    new RegExp(`${name}\\s*:\\s*${value.replace('#', '\\#')}\\s*;`, 'i'),
    `${name} must map to the approved Pixso value`,
  );
}

assert.match(appWxss, /background:\s*var\(--color-surface-page\)/, 'page must consume the semantic page surface token');
assert.match(appWxss, /color:\s*var\(--color-text-primary\)/, 'page must consume the semantic primary text token');

for (const token of ['--color-brand-primary', '--color-brand-soft', '--color-text-secondary', '--color-surface-page', '--radius-pill']) {
  assert.ok(topbarWxss.includes(`var(${token})`), `responsive topbar must consume ${token}`);
}

for (const token of ['--color-border-default', '--color-state-warning', '--color-state-danger']) {
  assert.ok(sharedComponentWxss.includes(`var(${token}`), `new shared components must consume ${token}`);
}
assert(!/var\(--color-(?:border|warning|danger),/.test(sharedComponentWxss), 'shared components must not invent undeclared shorthand color tokens');

console.log('design-token-contract: ok');
