const assert = require('assert');
const fs = require('fs');
const Module = require('module');
const path = require('path');

const root = path.resolve(__dirname, '..', 'miniapp');

function loadComponent() {
  let definition;
  global.Component = (value) => { definition = value; };
  const target = path.join(root, 'components', 'quantity-stepper', 'index.js');
  delete require.cache[require.resolve(target)];
  require(target);
  delete global.Component;
  return definition;
}

function componentInstance(definition, properties) {
  const events = [];
  const instance = {
    data: { ...definition.data, ...properties },
    setData(patch) { Object.assign(this.data, patch); },
    triggerEvent(name, detail) { events.push({ name, detail }); }
  };
  Object.entries(definition.methods).forEach(([name, method]) => { instance[name] = method.bind(instance); });
  definition.lifetimes.attached.call(instance);
  return { instance, events };
}

function loadPage() {
  let definition;
  const originalLoad = Module._load;
  Module._load = function(request, parent, isMain) {
    if (request === '../../services/index' && parent && /pages[\\/]index[\\/]index\.js$/.test(parent.filename)) {
      const emptyApi = new Proxy({}, { get: () => () => Promise.resolve({ ok: false, data: null }) });
      return {
        config: { provider: 'mock', motionEnabled: true }, auth: emptyApi, catalog: emptyApi,
        content: emptyApi, address: emptyApi, cart: emptyApi, delivery: emptyApi,
        checkout: emptyApi, orders: emptyApi, refunds: emptyApi, groups: emptyApi,
        favorites: emptyApi, reviews: emptyApi
      };
    }
    return originalLoad.call(this, request, parent, isMain);
  };
  global.Page = (value) => { definition = value; };
  global.wx = { showToast() {} };
  const target = path.join(root, 'pages', 'index', 'index.js');
  delete require.cache[require.resolve(target)];
  try { require(target); } finally {
    Module._load = originalLoad;
    delete global.Page;
  }
  return definition;
}

async function run() {
  const component = loadComponent();
  const componentWxml = fs.readFileSync(path.join(root, 'components', 'quantity-stepper', 'index.wxml'), 'utf8');
  assert(
    /class="quantity-stepper[^\"]*"\s+catchtap="stopTapPropagation"/.test(componentWxml),
    'the stepper root must stop taps before a product-card parent can navigate to detail'
  );
  assert(
    /class="quantity-value[^\"]*"[^>]*catchtap="stopTapPropagation"/.test(componentWxml),
    'the number input itself must stop its tap before the keyboard focus event reaches a product card'
  );
  assert(/adjust-position="\{\{true\}\}"/.test(componentWxml) && /cursor-spacing="16"/.test(componentWxml), 'the native keyboard must keep the active product and stepper visible and restore the viewport after closing');
  assert(/invalid \? 'is-invalid'/.test(componentWxml), 'invalid direct input must remain visibly correctable');
  assert.equal(typeof component.methods.stopTapPropagation, 'function', 'the tap barrier handler must exist');

  const mainWxml = fs.readFileSync(path.join(root, 'pages', 'index', 'index.wxml'), 'utf8');
  assert(!mainWxml.includes('minimum="0"') && mainWxml.includes('minimum="{{item.minimumQuantity || 1}}"'), 'home, campaign and category cards must pass the real minimum while the shared action separately permits zero-removal');
  assert.equal((mainWxml.match(/<quantity-stepper/g) || []).length, (mainWxml.match(/<quantity-stepper[^>]*\bstep="\{\{/g) || []).length, 'every storefront quantity input must receive the real SKU multiple instead of validating with a default step');
  assert(!/<view class="catalog-row"[^>]*bindtap="openProduct"/.test(mainWxml), 'catalog quantity controls must not live inside a detail-navigation tap target');
  assert(!/<view class="simple-row"[^>]*bindtap="openProduct"/.test(mainWxml), 'frequent quantity controls must not live inside a detail-navigation tap target');
  const utilitySpecialBlock = mainWxml.split("utilityType == 'special'")[1].split("utilityType == 'group'")[0];
  assert(!/<view class="deal-card"[^>]*bindtap="openProduct"/.test(utilitySpecialBlock), 'special-list quantity controls must not live inside a detail-navigation tap target');
  const { instance, events } = componentInstance(component, { quantity: 2, min: 2, max: 10, step: 2, allowZero: false, disabled: false });

  instance.editQuantity({ detail: { value: '' } });
  assert.equal(events.length, 0, 'typing must not emit a cart update');
  instance.confirmQuantity();
  instance.blurQuantity();
  assert.equal(events.length, 1, 'confirm followed by blur must commit only once');
  assert.equal(events[0].detail.reason, 'EMPTY');

  instance.editQuantity({ detail: { value: '7' } });
  instance.blurQuantity();
  assert.equal(events.at(-1).detail.reason, 'STEP_MISMATCH');
  assert.equal(instance.data.draftValue, '7', 'invalid input must remain visible so the user can correct it');
  assert.equal(instance.data.invalid, true, 'invalid input must retain an explicit error state');

  for (const [value, reason] of [['-1', 'NOT_INTEGER'], ['1', 'BELOW_MIN'], ['12', 'ABOVE_MAX'], ['1.5', 'NOT_INTEGER']]) {
    instance.editQuantity({ detail: { value } });
    instance.blurQuantity();
    assert.equal(events.at(-1).detail.reason, reason, `input ${value} must be rejected as ${reason}`);
  }

  instance.editQuantity({ detail: { value: '8' } });
  instance.confirmQuantity();
  assert.deepEqual(events.at(-1), { name: 'change', detail: { valid: true, quantity: 8, source: 'input' } });
  instance.blurQuantity();
  assert.equal(events.filter((event) => event.detail.quantity === 8).length, 1);
  instance.data.quantity = 8;
  component.properties.quantity.observer.call(instance, 8);
  assert.equal(instance.data.draftValue, '8', 'an asynchronous parent property update must become authoritative');

  instance.data.quantity = 4;
  instance.add();
  instance.subtract();
  assert.deepEqual(events.slice(-2).map((event) => event.detail.delta), [1, -1], 'step buttons must retain the delta protocol');

  const removable = componentInstance(component, { quantity: 6, min: 6, max: 20, step: 2, allowZero: true, disabled: false });
  removable.instance.editQuantity({ detail: { value: '4' } });
  removable.instance.blurQuantity();
  assert.equal(removable.events.at(-1).detail.reason, 'BELOW_MIN', 'a positive quantity below the real minimum must stay invalid even when zero-removal is allowed');
  assert.equal(removable.instance.data.draftValue, '4');
  removable.instance.editQuantity({ detail: { value: '0' } });
  removable.instance.blurQuantity();
  assert.deepEqual(removable.events.at(-1), { name: 'change', detail: { valid: true, quantity: 0, source: 'input' } }, 'zero must remain an explicit cart-removal value');
  removable.instance.data.quantity = 6;
  removable.instance.subtract();
  assert.equal(removable.events.at(-1).detail.delta, -1, 'the minus control at the minimum must still emit the explicit remove transition');

  const disabled = componentInstance(component, { quantity: 3, min: 0, max: 10, step: 1, disabled: true });
  disabled.instance.editQuantity({ detail: { value: '5' } });
  disabled.instance.add();
  disabled.instance.subtract();
  assert.equal(disabled.events.length, 0, 'disabled component must not emit changes');

  const disabledDuringEdit = componentInstance(component, { quantity: 4, min: 0, max: 10, step: 1, disabled: false });
  disabledDuringEdit.instance.editQuantity({ detail: { value: '9' } });
  disabledDuringEdit.instance.data.disabled = true;
  component.properties.disabled.observer.call(disabledDuringEdit.instance, true);
  disabledDuringEdit.instance.confirmQuantity();
  disabledDuringEdit.instance.blurQuantity();
  assert.equal(disabledDuringEdit.events.length, 0, 'becoming disabled while editing must discard the draft');
  assert.equal(disabledDuringEdit.instance.data.draftValue, '4');

  const page = loadPage();
  const toasts = [];
  global.wx.showToast = (payload) => { toasts.push(payload.title); };
  const product = {
    id: 'p1', name: '测试商品', unit: '箱', specLabel: '箱', selectedSkuId: 'sku1',
    skuOptions: [{ id: 'sku1', label: '箱', packageUnit: '箱', minOrderQuantity: 2, orderMultiple: 2 }],
    minOrderQuantity: 2, orderMultiple: 2, minimumQuantity: 2, maximumQuantity: 998
  };
  const detailContext = {
    data: { selectedProduct: product, selectedSpec: '箱', detailDraftQty: 2 },
    _remotePriceBySku: {},
    setData(patch) { Object.assign(this.data, patch); }
  };
  page.changeDetailQuantity.call(detailContext, { detail: { valid: true, quantity: 4, source: 'input' } });
  assert.equal(detailContext.data.detailDraftQty, 4, 'detail input must update parent state');
  page.changeDetailQuantity.call(detailContext, { detail: { valid: true, quantity: 3, source: 'input' } });
  assert.equal(detailContext.data.detailDraftQty, 4, 'invalid business multiple must not update parent state');
  assert.match(toasts.at(-1), /倍数/);

  const pickerContext = {
    data: { quantityPickerProduct: product, quantityPickerSpec: '箱', quantityPickerQty: 2 },
    _remotePriceBySku: {},
    setData(patch) { Object.assign(this.data, patch); }
  };
  page.changeQuantityPicker.call(pickerContext, { detail: { valid: true, quantity: 6, source: 'input' } });
  assert.equal(pickerContext.data.quantityPickerQty, 6, 'picker input must update parent state');

  const synced = [];
  const cartContext = {
    data: { cartItems: [{ ...product, selectedSpec: '箱', qty: 2, selected: true }] },
    syncCart(items) { synced.push(items); this.data.cartItems = items; },
    getCartController: page.getCartController
  };
  await page.applyChangeQuantity.call(cartContext, { currentTarget: { dataset: { id: 'p1', spec: '箱', quantity: 4 } } });
  assert.equal(synced.at(-1)[0].qty, 4, 'cart input must set an absolute quantity');
  await page.applyChangeQuantity.call(cartContext, { currentTarget: { dataset: { id: 'p1', spec: '箱', quantity: 0 } } });
  assert.equal(synced.at(-1).length, 0, 'cart quantity zero must retain delete semantics');

  const emptyCartToasts = [];
  const emptyCartContext = {
    data: { cartItems: [], products: [product], frequent: [] },
    _remotePriceBySku: {},
    findProduct() { return product; },
    syncCart(items, callback) { this.data.cartItems = items; if (callback) callback(); },
    pulseCartBadge() {},
    setData(patch) { Object.assign(this.data, patch); },
    getCartController: page.getCartController
  };
  global.wx.showToast = (payload) => { emptyCartToasts.push(payload.title); };
  await page.applyChangeQuantity.call(emptyCartContext, { currentTarget: { dataset: { id: 'p1', spec: '箱', quantity: 3 } } });
  assert.equal(emptyCartContext.data.cartItems.length, 0, 'invalid direct quantity must not add an empty cart row');
  assert.match(emptyCartToasts.at(-1), /倍数/);
  await page.applyChangeQuantity.call(emptyCartContext, { currentTarget: { dataset: { id: 'p1', spec: '箱', quantity: 6 } } });
  assert.equal(emptyCartContext.data.cartItems[0].qty, 6, 'direct input on an empty cart row must add the requested quantity once');

  console.log('quantity direct input tests: passed');
}

run().catch((error) => { console.error(error); process.exit(1); });
