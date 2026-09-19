const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const miniappRoot = path.resolve(__dirname, '..', 'miniapp');
const read = (relativePath) => fs.readFileSync(path.join(miniappRoot, relativePath), 'utf8');

let definition;
global.Component = (value) => { definition = value; };
require(path.join(miniappRoot, 'components', 'content-state', 'index.js'));
delete global.Component;

const events = [];
const instance = {
  data: { actionLabel: '重新加载商品' },
  triggerEvent(name) { events.push(name); }
};
Object.entries(definition.methods).forEach(([name, method]) => { instance[name] = method.bind(instance); });
instance.handleAction();
assert.deepEqual(events, ['action'], 'an actionable state must expose one semantic action event');
instance.data.actionLabel = '';
instance.handleAction();
assert.equal(events.length, 1, 'an informational empty state must not emit a hidden action');

const componentWxml = read('components/content-state/index.wxml');
const componentWxss = read('components/content-state/index.wxss');
const pageWxml = read('pages/index/index.wxml');
const pageJson = JSON.parse(read('pages/index/index.json'));
assert(componentWxml.includes('aria-live="polite"') && componentWxml.includes("tone == 'error'"), 'loading, empty and error messages must be announced and visually distinguishable');
assert(componentWxml.includes("layout == 'home-blocking' ? 'is-home-blocking' : ''") && definition.properties.layout, 'the shared state component must expose the home blocking-state presentation without duplicating recovery behavior');
assert(componentWxss.includes('min-height:44px'), 'the optional recovery action must keep a full touch target');
assert(componentWxss.includes('.content-state.is-home-blocking') && componentWxss.includes('.is-home-blocking .content-state__action'), 'the home blocking state must separate its information card from the recovery action');
assert(!/(?:>|\s)text(?:\b|\[)/.test(componentWxss) && !/\[[^\]]+\]/.test(componentWxss), 'component WXSS must use classes instead of forbidden tag or attribute selectors');
assert.equal(pageJson.usingComponents['content-state'], '/components/content-state/index');
assert(pageWxml.includes('<content-state') && pageWxml.includes('bind:action="retryRemoteCatalog"'), 'the real home catalog must use the public recovery event');

console.log('content state contract test: passed');
