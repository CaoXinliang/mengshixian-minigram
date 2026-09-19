const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const wxml = fs.readFileSync(path.join(root, 'miniapp/pages/index/index.wxml'), 'utf8');
const wxss = fs.readFileSync(path.join(root, 'miniapp/pages/index/index.wxss'), 'utf8');
const js = fs.readFileSync(path.join(root, 'miniapp/pages/index/index.js'), 'utf8');
const memberWxml = fs.readFileSync(path.join(root, 'miniapp/components/member-home-panel/index.wxml'), 'utf8');
const memberWxss = fs.readFileSync(path.join(root, 'miniapp/components/member-home-panel/index.wxss'), 'utf8');
const mealPanelWxml = fs.readFileSync(path.join(root, 'miniapp/components/meal-experience-panel/index.wxml'), 'utf8');
const mealPanelWxss = fs.readFileSync(path.join(root, 'miniapp/components/meal-experience-panel/index.wxss'), 'utf8');

function cssRule(selector) {
  const rules = {};
  const source = `${wxss}\n${memberWxss}`.replace(/\/\*[\s\S]*?\*\//g, '');
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
    wxml.includes('<content-state wx:elif="{{catalogStatus == \'error\'}}"') &&
    wxml.includes('action-label="重新加载商品" bind:action="retryRemoteCatalog"'),
  'home specials must show an immediate skeleton and a retryable failure state instead of a blank gap'
);
assert(
  wxml.includes('<meal-experience-panel') &&
    wxml.includes('status="{{mealIdeasStatus}}"') &&
    wxml.includes('bind:retrycollection="retryRemoteMealIdeas"') &&
    mealPanelWxml.includes("wx:elif=\"{{status == 'loading'}}\"") &&
    mealPanelWxml.includes('wx:for="{{[1,2,3,4]}}"') &&
    mealPanelWxml.includes('菜品搭配加载失败') &&
    mealPanelWxml.includes('bindtap="handleRetryCollection"'),
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
    /prefers-reduced-motion[\s\S]*\.deal-card-skeleton\{animation:none\}/.test(wxss) &&
    /\.app-shell\.is-motion-reduced[\s\S]*\.deal-card-skeleton\{animation:none\}/.test(wxss) &&
    mealPanelWxss.includes('@keyframes content-skeleton-breathe') &&
    /prefers-reduced-motion[\s\S]*\.meal-card-skeleton\{animation:none\}/.test(mealPanelWxss) &&
    mealPanelWxss.includes('.meal-grid-skeleton.is-motion-reduced .meal-card-skeleton{animation:none}') &&
    wxml.includes('motion-reduced="{{motionReduced}}"'),
  'loading feedback must remain visible without forcing animation when reduced motion is requested'
);

for (const requiredMarkup of [
  'class="location-button"',
  'aria-label="联系客服"',
  'class="group-buy"',
  'class="business-return-action"'
]) assert(wxml.includes(requiredMarkup), `missing visible action affordance: ${requiredMarkup}`);

assert(
  wxml.includes('<member-home-panel') &&
    !wxml.includes('class="profile-card"') &&
    !wxml.includes('class="tool-grid more-services"') &&
    memberWxml.includes('class="member-service-grid"') &&
    !memberWxml.includes('更多服务'),
  'mine must expose its routes through the member component without restoring dormant services'
);

assert(
  /detailImageError[\s\S]*class="detail-image-state is-error"><text>图片暂时无法加载<\/text><button[^>]*bindtap="retryDetailImage">重新加载图片<\/button>/.test(wxml),
  'failed product images must expose a real retry button rather than a text-only clickable overlay'
);
assert(
  /class="catalog-row(?:\s[^"]*)?"[\s\S]*?<image(?=[^>]*data-id="\{\{item\.id\}\}")(?=[^>]*binderror="handleCatalogImageError")[^>]*>/.test(wxml) &&
    js.includes('handleCatalogImageError(event)') && js.includes("img: '/assets/products/placeholder.svg'") && js.includes('imageUnavailable: true'),
  'a failed catalog image must fall back to the neutral product placeholder without removing the product card'
);
assert(
  wxml.includes("item.presentation.action == 'disabled'") &&
    wxml.includes('loggedIn && item.specSelectionUnavailable') && wxml.includes('item.specSelectionText') &&
    wxml.includes('class="catalog-item-status">{{item.presentation.statusText}}</text>'),
  'catalog purchase controls must disable and explain a server-derived unusable state through the shared presentation result'
);
assert(
  /<button\b(?=[^>]*\bbindtap="retryProductReviews")[^>]*>[\s\S]*?重新加载评价[\s\S]*?<\/button>/.test(wxml) &&
    /<button\b(?=[^>]*\bbindtap="openUtility")(?=[^>]*\bdata-type="trace")[^>]*>[\s\S]*?查看商品保障说明[\s\S]*?<\/button>/.test(wxml) &&
    /<button\b(?=[^>]*\bbindtap="favoriteProduct")(?=[^>]*\baria-label="\{\{detailFavoriteLoading \? '收藏状态加载中' : \(detailFavorited \? '取消收藏' : '收藏此商品'\)\}\}")(?=[^>]*\bdisabled="\{\{detailFavoriteBusy \|\| detailFavoriteLoading\}\}")[^>]*>[\s\S]*?<\/button>/.test(wxml),
  'review retry, product assurance and favorite actions must remain explicit buttons'
);
assert(
  /<text\b(?=[^>]*\bclass="policy-link")(?=[^>]*\bdata-document="terms")(?=[^>]*\baria-role="link")[^>]*>/.test(wxml) &&
    /<text\b(?=[^>]*\bclass="policy-link")(?=[^>]*\bdata-document="privacy")(?=[^>]*\baria-role="link")[^>]*>/.test(wxml),
  'legal document links must remain conventional text links'
);

for (const [selector, property, minimum] of [
  ['.location-button', 'min-height', 44],
  ['.sub-head .text-btn', 'height', 44],
  ['.member-card-head>button', 'min-height', 44],
  ['.detail-image-state button', 'min-height', 44],
  ['.detail-name-row>.detail-favorite', 'height', 44],
  ['.link-button', 'min-height', 44],
  ['.group-buy', 'min-height', 44],
  ['.order-empty button', 'min-height', 44],
  ['.catalog-empty button', 'min-height', 44],
  ['.catalog-inline-status button', 'min-height', 44],
  ['.business-form-card>.business-return-action', 'min-height', 44],
  ['.group-card>button', 'min-height', 44]
]) assertTouchTarget(selector, property, minimum);

assertTouchTarget('.member-order-grid button', 'min-height', 44);
assertTouchTarget('.member-service-grid button', 'min-height', 44);
assert(
  !wxml.includes('class="banner-action"') &&
    !wxml.includes('bindtap="openBanner"') &&
    !/<view[^>]+class="banner-(?:slide|empty)"[^>]+aria-role="button"/.test(wxml),
  'home banners must remain visual content after their conflicting promotion action is removed'
);

for (const selector of [
  '.member-card-head>button',
  '.detail-image-state button',
  '.detail-name-row>.detail-favorite',
  '.link-button',
  '.group-buy',
  '.order-empty button',
  '.business-form-card>.business-return-action'
]) {
  const rule = cssRule(selector);
  assert(rule.background && rule.background !== 'transparent', `${selector} must have a visible button surface`);
  assert(rule['border-radius'], `${selector} must have a bounded button shape`);
}
const subHeadTextTarget = cssRule('.sub-head .text-btn');
const subHeadTextFace = cssRule('.text-btn-face');
assert(
  subHeadTextTarget.background === 'transparent' &&
    subHeadTextTarget['min-width'] === '44px' &&
    subHeadTextTarget.height === '44px' &&
    subHeadTextFace.background && subHeadTextFace.background !== 'transparent' &&
    subHeadTextFace.border && subHeadTextFace['border-radius'] === '999px',
  'sub-head text actions must use a compact visible pill inside a full 44px transparent hit target'
);
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
