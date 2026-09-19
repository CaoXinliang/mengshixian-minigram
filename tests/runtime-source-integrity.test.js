const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Source wiring only: no page lifecycle, cloud API, simulator or UI is executed.
const project = path.resolve(__dirname, '..');
const root = path.join(project, 'miniapp');
const read = file => fs.readFileSync(file, 'utf8');
const app = JSON.parse(read(path.join(root, 'app.json')));
const config = JSON.parse(read(path.join(project, 'project.config.json')));
assert.equal(config.miniprogramRoot.replace(/\\/g, '/').replace(/\/$/, ''), 'miniapp');
const routes = [...app.pages, ...(app.subpackages || []).flatMap(pkg => pkg.pages.map(page => `${pkg.root}/${page}`))];
assert.equal(new Set(routes).size, routes.length, 'registered routes must be unique');
assert.equal(routes.length, 27, 'all 27 current routes, including account and membership, must be retained');

const checked = new Set();
let eventCount = 0;
let localAssetCount = 0;
function inspectUnit(base, component = false) {
  if (checked.has(base)) return;
  checked.add(base);
  assert(base.startsWith(root + path.sep), `unit outside original runtime: ${base}`);
  for (const extension of ['.js', '.json', '.wxml', '.wxss']) {
    assert(fs.existsSync(base + extension), `missing source: ${base}${extension}`);
  }
  const js = read(base + '.js');
  new vm.Script(js, { filename: base + '.js' });
  const settings = JSON.parse(read(base + '.json'));
  if (component) assert.equal(settings.component, true, `${base} must declare component mode`);
  const wxml = read(base + '.wxml');
  for (const match of wxml.matchAll(/\b(?:capture-)?(?:bind|catch):?[\w-]+\s*=\s*["']([^"']+)["']/g)) {
    const handler = match[1];
    assert.match(handler, /^[A-Za-z_$][\w$]*$/, `dynamic handler needs explicit coverage: ${base} ${handler}`);
    assert(new RegExp(`(?:^|[,{])\\s*(?:async\\s+)?${handler}\\s*\\([^)]*\\)\\s*\\{`, 'm').test(js), `missing declared handler ${handler} in ${base}`);
    eventCount++;
  }
  for (const match of wxml.matchAll(/\bsrc\s*=\s*["'](\/assets\/[^"']+)["']/g)) {
    if (match[1].includes('{{')) continue;
    const asset = path.join(root, match[1]);
    assert(fs.existsSync(asset), `missing literal local media ${match[1]} in ${base}`);
    localAssetCount++;
  }
  for (const match of wxml.matchAll(/\burl\s*=\s*["'](\/[^"']+)["']/g)) {
    const route = match[1].split('?')[0].slice(1);
    if (route.includes('{{')) continue;
    assert(routes.includes(route), `navigator targets an unregistered route: ${route}`);
  }
  for (const reference of Object.values(settings.usingComponents || {})) {
    assert(!reference.includes('rebuild'), 'original pages must not import rebuild components');
    const target = reference.startsWith('/') ? path.join(root, reference) : path.resolve(path.dirname(base), reference);
    inspectUnit(target, true);
  }
}
for (const route of routes) inspectUnit(path.join(root, route));
for (const reference of Object.values(app.usingComponents || {})) {
  inspectUnit(path.join(root, reference), true);
}
console.log(`source integrity: ${routes.length} routes, ${checked.size} units, ${eventCount} event attributes, ${localAssetCount} literal media references; static only`);
