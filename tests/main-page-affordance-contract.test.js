const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const wxml = fs.readFileSync(path.join(root, 'miniapp/pages/index/index.wxml'), 'utf8');
const wxss = fs.readFileSync(path.join(root, 'miniapp/pages/index/index.wxss'), 'utf8');

function cssRule(selector) {
  const rules = {};
  const source = wxss.replace(/\/\*[\s\S]*?\*\//g, '');
  const pattern = /([^{}]+)\{([^{}]*)\}/g;
  let match;
  while ((match = pattern.exec(source))) {
    const selectors = match[1].split(',').map((item) => item.trim());
    if (!selectors.includes(selector)) continue;
    for (const declaration of match[2].split(';')) {
      const splitAt = declaration.indexOf(':');
      if (splitAt < 0) continue;
      rules[declaration.slice(0, splitAt).trim()] = declaration.slice(splitAt + 1).trim();
    }
  }
  return rules;
}

function px(value) {
  const match = String(value || '').match(/^(\d+(?:\.\d+)?)px$/);
  return match ? Number(match[1]) : NaN;
}

function assertTouchTarget(selector, property = 'min-height', minimum = 44) {
  const rule = cssRule(selector);
  assert(Number.isFinite(px(rule[property])) && px(rule[property]) >= minimum, `${selector} must keep a ${minimum}px touch target`);
}

assert(
  wxml.includes("wx:elif=\"{{catalogStatus == 'loading'}}\"") &&
    (wxml.match(/class=\"deal-card deal-card-skeleton\"/g) || []).length === 2 &&
    wxml.includes('class="home-load-state is-error"') &&
    wxml.includes('重新加载商品'),
  'home specials must show an immediate skeleton and a retryable failure state instead of a blank gap'
);
assert(
  wxml.includes("wx:elif=\"{{mealIdeasStatus == 'loading'}}\"") &&
    (wxml.match(/class=\"meal-card meal-card-skeleton\"/g) || []).length === 4 &&
    wxml.includes('菜品搭配加载失败') &&
    wxml.includes('重新加载菜品'),
  'meal ideas must show an immediate skeleton and a retryable failure state instead of a blank gap'
);
assert(
  wxml.includes("wx:elif=\"{{catalogBrowseLoading && !categoryProducts.length}}\"") &&
    wxml.includes("wx:elif=\"{{catalogBrowseError && !categoryProducts.length}}\"") &&
    wxml.includes('bindtap="retryCatalogBrowse"') &&
    wxml.includes('catalogBrowseLoading && categoryProducts.length'),
  'category and search requests must distinguish loading and failure from a genuine empty result'
);
assert(
  wxss.includes('@keyframes content-skeleton-breathe') &&
    /prefers-reduced-motion[\s\S]*\.deal-card-skeleton,[\s\S]*\.meal-card-skeleton\{animation:none\}/.test(wxss) &&
    /\.app-shell\.is-motion-reduced[\s\S]*\.deal-card-skeleton,[\s\S]*\.app-shell\.is-motion-reduced \.meal-card-skeleton\{animation:none\}/.test(wxss),
  'loading feedback must remain visible without forcing animation when reduced motion is requested'
);

for (const requiredMarkup of [
  'class="location-button"',
  'aria-label="查看优惠活动"',
  'aria-label="查看积分"',
  'aria-label="查看特价好物"',
  'class="mine-orders-action"',
  'class="contact-action"',
  'class="group-buy"',
  'class="business-return-action"'
]) assert(wxml.includes(requiredMarkup), `missing visible action affordance: ${requiredMarkup}`);

assert(
  /detailImageError[\s\S]*class="detail-image-state is-error"><text>图片暂时无法加载<\/text><button[^>]*bindtap="retryDetailImage">重新加载图片<\/button>/.test(wxml),
  'failed product images must expose a real retry button rather than a text-only clickable overlay'
);
assert(
  wxml.includes('<button class="link-button" hover-class="control-pressed" bindtap="retryProductReviews">重新加载评价</button>') &&
    wxml.includes('<button class="link-button" hover-class="control-pressed" bindtap="openUtility" data-type="trace">查看商品保障说明 ›</button>') &&
    wxml.includes('<button class="link-button" hover-class="control-pressed" bindtap="favoriteProduct">收藏此商品</button>'),
  'review retry, product assurance and favorite actions must remain explicit buttons'
);
assert(
  wxml.includes('<text data-document="terms" aria-role="link"') &&
    wxml.includes('<text data-document="privacy" aria-role="link"'),
  'legal document links must remain conventional text links'
);

for (const [selector, property, minimum] of [
  ['.location-button', 'min-height', 44],
  ['.sub-head .text-btn', 'height', 44],
  ['.profile-stats button', 'min-height', 44],
  ['.mine-title button', 'min-height', 44],
  ['.contact-panel button', 'min-height', 44],
  ['.detail-image-state button', 'min-height', 44],
  ['.link-button', 'min-height', 44],
  ['.group-buy', 'min-height', 44],
  ['.order-empty button', 'min-height', 44],
  ['.catalog-empty button', 'min-height', 44],
  ['.catalog-inline-status button', 'min-height', 44],
  ['.business-form-card>.business-return-action', 'min-height', 44],
  ['.group-card>button', 'min-height', 44]
]) assertTouchTarget(selector, property, minimum);

assertTouchTarget('.order-grid button', 'min-height', 44);
assertTouchTarget('.tool-grid button', 'min-height', 44);
assert(
  !wxml.includes('class="banner-action"') &&
    !wxml.includes('bindtap="openBanner"') &&
    !/<view[^>]+class="banner-(?:slide|empty)"[^>]+aria-role="button"/.test(wxml),
  'home banners must remain visual content after their conflicting promotion action is removed'
);

for (const selector of [
  '.sub-head .text-btn',
  '.profile-stats button',
  '.mine-title button',
  '.contact-panel button',
  '.detail-image-state button',
  '.link-button',
  '.group-buy',
  '.order-empty button',
  '.business-form-card>.business-return-action'
]) {
  const rule = cssRule(selector);
  assert(rule.background && rule.background !== 'transparent', `${selector} must have a visible button surface`);
  assert(rule['border-radius'], `${selector} must have a bounded button shape`);
}
const locationHitTarget = cssRule('.location-button');
const locationFace = cssRule('.location-name');
assert(
  locationHitTarget.padding === '0' &&
    locationHitTarget.width === 'fit-content' &&
    locationHitTarget['min-width'] === '44px' &&
    locationHitTarget['min-height'] === '44px' &&
    locationHitTarget['max-width'] &&
    locationHitTarget.background === 'transparent' &&
    locationFace.background &&
    locationFace.border &&
    locationFace['border-radius'],
  'warehouse affordance must keep a content-width outlined face inside its 44px hit target without shifting the approved left-aligned text'
);

console.log('main page affordance contract test: passed');
