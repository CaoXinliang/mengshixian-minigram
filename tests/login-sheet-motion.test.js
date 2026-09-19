const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const js = fs.readFileSync(path.join(root, 'miniapp/pages/index/index.js'), 'utf8');
const wxml = fs.readFileSync(path.join(root, 'miniapp/pages/index/index.wxml'), 'utf8');
const wxss = fs.readFileSync(path.join(root, 'miniapp/pages/index/index.wxss'), 'utf8');
const memberWxml = fs.readFileSync(path.join(root, 'miniapp/components/member-home-panel/index.wxml'), 'utf8');
const memberWxss = fs.readFileSync(path.join(root, 'miniapp/components/member-home-panel/index.wxss'), 'utf8');
const stepperWxml = fs.readFileSync(path.join(root, 'miniapp/components/quantity-stepper/index.wxml'), 'utf8');
const stepperWxss = fs.readFileSync(path.join(root, 'miniapp/components/quantity-stepper/index.wxss'), 'utf8');
const tabbarWxml = fs.readFileSync(path.join(root, 'miniapp/components/app-tabbar/index.wxml'), 'utf8');
const tabbarWxss = fs.readFileSync(path.join(root, 'miniapp/components/app-tabbar/index.wxss'), 'utf8');
const config = fs.readFileSync(path.join(root, 'miniapp/services/config.js'), 'utf8');
const navigationCommonState = fs.readFileSync(path.join(root, 'miniapp/modules/navigation-common-state.js'), 'utf8');

function cssDeclarations(source, selector) {
  const rulePattern = /([^{}]+)\{([^{}]*)\}/g;
  const output = {};
  let match;
  while ((match = rulePattern.exec(source))) {
    if (!match[1].split(',').map((item) => item.trim()).includes(selector)) continue;
    match[2].split(';').forEach((declaration) => {
      const separator = declaration.indexOf(':');
      if (separator >= 0) output[declaration.slice(0, separator).trim()] = declaration.slice(separator + 1).trim();
    });
  }
  return output;
}

function hasSafeAreaPair(source, selector, property) {
  const bodies = [];
  const rulePattern = /([^{}]+)\{([^{}]*)\}/g;
  let match;
  while ((match = rulePattern.exec(source))) {
    if (match[1].split(',').map((item) => item.trim()).includes(selector)) bodies.push(match[2]);
  }
  const body = bodies.join(';');
  const prefix = `${property}:\\s*[^;]*`;
  return new RegExp(`${prefix}constant\\(safe-area-inset-bottom\\)`).test(body) &&
    new RegExp(`${prefix}env\\(safe-area-inset-bottom\\)`).test(body);
}

const px = (value) => {
  const match = String(value || '').match(/^(\d+(?:\.\d+)?)px$/);
  return match ? Number(match[1]) : NaN;
};

assert(js.includes('loginMounted: false') && js.includes('loginVisible: false'), 'login sheet needs separate mount and visibility state');
assert(js.includes('this.dismissLogin();') && js.includes('loginMounted: false'), 'login sheet close path must defer teardown');
assert(js.includes('setTimeout(() => {') && js.includes('}, 220);'), 'login sheet close path must wait for the exit transition');
assert(wxml.includes('wx:if="{{loginMounted}}"'), 'login mask must stay mounted during exit animation');
assert(wxml.includes("{{loginVisible ? 'is-visible' : ''}}"), 'login mask and card must receive visibility state');
assert(wxss.includes('transform:translate3d(0,100%,0)') && wxss.includes('.login-card.is-visible'), 'login card must enter from the bottom');
assert(wxss.includes('opacity 220ms ease') && wxss.includes('visibility 0s linear 220ms'), 'login mask must fade and defer visibility teardown');
const loginClose = cssDeclarations(wxss, '.login-close');
assert(wxml.includes('class="login-close"') && wxml.includes('aria-label="关闭登录窗口"') && px(loginClose.width) >= 44 && px(loginClose['min-width']) === px(loginClose.width) && px(loginClose['max-width']) === px(loginClose.width) && px(loginClose.height) === px(loginClose.width) && loginClose['box-sizing'] === 'border-box' && loginClose['border-radius'] === '50%', 'login close control must remain an accessible circular touch target instead of stretching to the native button width');
assert(hasSafeAreaPair(wxss, '.login-card', 'padding'), 'login sheet content must clear the bottom safe area with constant() and env() compatibility');
const agreementTarget = cssDeclarations(wxss, '.login-agreement label');
const policyTarget = cssDeclarations(wxss, '.policy-link');
const minePolicyTarget = cssDeclarations(memberWxss, '.member-service-grid button');
assert(
  wxml.includes('<label aria-role="checkbox" aria-label="同意用户服务协议和隐私政策" aria-checked="{{agreed}}">') &&
    (wxml.match(/class="policy-link"[^>]*aria-role="link"[^>]*aria-label="查看(?:用户服务协议|隐私政策)"/g) || []).length === 2 &&
    (wxml.match(/data-document="(?:terms|privacy)" aria-role="link" aria-label="查看(?:用户服务协议|隐私政策)" catchtap="openLegalDocument"/g) || []).length === 2 &&
    memberWxml.includes('wx:for="{{model.commonServices}}"') && memberWxml.includes('aria-label="{{item.label}}"') &&
    px(agreementTarget['min-height']) >= 44 && px(policyTarget['min-height']) >= 44 && px(minePolicyTarget['min-height']) >= 44,
  'agreement and legal-document entries must expose accessible semantics and 44px touch targets'
);
assert(wxss.includes('@keyframes catalog-status-breathe') && wxss.includes('.catalog-empty.is-loading text:first-child{animation:catalog-status-breathe'), 'catalog loading state must provide restrained progress feedback');
assert(wxss.includes('.catalog-empty.is-loading text:first-child{animation:none}'), 'catalog loading feedback must respect reduced-motion preferences');
assert(js.includes('cartFeedbackId:') && js.includes('cartPulse:'), 'cart feedback state must be explicit');
assert(js.includes('pulseCartBadge()') && js.includes('cartFeedbackSeq'), 'cart feedback must reconcile after the queued write');
assert(stepperWxml.includes('quantity == min && !allowZero') && stepperWxml.includes('disabled="{{disabled || quantity >= max}}"') && /<input\b[^>]*class="quantity-value(?:\s|\")/.test(stepperWxml) && stepperWxml.includes('bindconfirm="confirmQuantity"') && stepperWxml.includes('bindblur="blurQuantity"') && !stepperWxml.includes('wx:if="{{quantity <= 0}}"'), 'shared quantity control must keep direct input and distinguish an impossible minimum action from explicit zero-removal');
assert(stepperWxml.includes('hover-class="is-pressed"'), 'shared add controls must expose press feedback');
assert(tabbarWxml.includes("cartPulse ? 'is-pulsing' : ''"), 'cart tab must expose success feedback state');
assert(stepperWxss.includes('transition:transform 160ms ease,opacity 160ms ease') && tabbarWxss.includes('@keyframes cart-badge-pulse'), 'cart feedback must use restrained transform motion');
assert(stepperWxss.includes('@media (prefers-reduced-motion: reduce){.quantity-stepper .step-control{transition:none}}') && wxss.includes('.login-mask,.login-card{transition:none}'), 'add controls and login sheet must disable transitions for reduced-motion users with sufficient selector specificity');
assert(config.includes('motionEnabled: true') && js.includes('motionReduced: serviceConfig.motionEnabled === false'), 'miniapp must expose an explicit motion-off fallback when the platform preference is unavailable');
assert(wxml.includes("motionReduced ? 'is-motion-reduced' : ''") && wxss.includes('.app-shell.is-motion-reduced .page-scroll.is-page-entering'), 'explicit motion-off mode must disable page animations and transitions at the root');
assert(js.includes('pageMotion: false') && js.includes('triggerPageMotion'), 'page transitions must have explicit state and helper');
assert(navigationCommonState.includes("if (tab === input.page && !input.searchMode && !input.showAddressForm && !input.quantityPickerVisible)"), 'same-tab taps must not replay page motion unless search mode or a stale overlay must be closed');
assert(wxml.includes("pageMotion ? 'is-page-entering' : ''"), 'page content must receive transition state');
assert(wxss.includes('@keyframes page-content-enter') && wxss.includes('prefers-reduced-motion'), 'page transition must be restrained and motion-aware');
assert(wxss.includes('.login-mask,.login-card{transition:none}'), 'login sheet must also respect reduced-motion preference');
assert(js.includes('detailImageLoading: false') && js.includes('detailImageError: false'), 'detail image loading and error states must be explicit');
assert(wxml.includes('data-src="{{detailImageSrc}}"') && js.includes('isCurrentDetailImageEvent(event)') && js.includes('eventSrc === this.data.detailImageSrc'), 'late image events must not overwrite the currently selected product image state');
assert(js.includes('previewDetailImage()') && js.includes('retryDetailImage()'), 'detail image must support preview and retry');
assert(wxml.includes('catchtap="previewDetailImage"') && wxml.includes('图片暂时无法加载'), 'detail image must expose preview and error feedback');
assert(!js.includes('detailVideoSrc') && !js.includes('detailVideoError') && !js.includes('handleDetailVideoError') && !wxml.includes('商品视频'), 'ordinary product detail must not expose product-video state, controls or empty media copy while the separate recipe detail may use video');
assert(wxml.includes("catalogStatus == 'loading'") && wxml.includes("catalogStatus == 'error'"), 'catalog must distinguish loading and error from empty');
assert(wxss.includes('.detail-image-state') && wxss.includes('.catalog-empty button'), 'image and catalog states must have dedicated layout styles');
assert(wxss.includes('.detail-image>text{position:absolute;') && !wxss.includes('.detail-image text{position:absolute;'), 'detail tag styling must not capture image error-state copy');

console.log('login sheet motion contract test: passed');
