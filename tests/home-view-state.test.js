const assert = require('assert/strict');
const path = require('path');

const { deriveHomeViewState } = require(path.resolve(__dirname, '../miniapp/modules/home-view-state'));

function state(overrides = {}) {
  return deriveHomeViewState({
    catalogStatus: 'loading',
    homeCategoriesStatus: 'loading',
    bannerStatus: 'loading',
    homeSectionsStatus: 'loading',
    catalogRefreshError: '',
    products: [],
    homeCategories: [],
    bannerItems: [],
    homeSections: [],
    ...overrides
  });
}

function run() {
  assert.deepEqual(state(), {
    status: 'loading',
    hasUsableContent: false,
    showBlockingState: true,
    title: '正在加载首页',
    message: '商品与分类加载完成后会立即显示',
    actionLabel: ''
  });

  assert.deepEqual(state({ catalogStatus: 'error', homeCategoriesStatus: 'error', bannerStatus: 'error', homeSectionsStatus: 'error' }), {
    status: 'error',
    hasUsableContent: false,
    showBlockingState: true,
    title: '首页加载失败',
    message: '请检查网络后重试，当前页面不会提交任何操作。',
    actionLabel: '重新加载'
  });

  assert.deepEqual(state({ catalogStatus: 'ready', homeCategoriesStatus: 'ready', bannerStatus: 'ready', homeSectionsStatus: 'ready' }), {
    status: 'empty',
    hasUsableContent: false,
    showBlockingState: true,
    title: '暂无可展示内容',
    message: '当前仓库暂未配置首页内容，可刷新或切换仓库。',
    actionLabel: '刷新首页'
  });

  assert.deepEqual(state({
    catalogStatus: 'error',
    homeCategoriesStatus: 'ready',
    bannerStatus: 'ready',
    homeSectionsStatus: 'ready',
    products: [{ id: 'kept' }]
  }), {
    status: 'refresh-error',
    hasUsableContent: true,
    showBlockingState: false,
    title: '',
    message: '刷新失败，已保留当前内容',
    actionLabel: '重新加载'
  });

  assert.deepEqual(state({
    catalogStatus: 'loading',
    homeCategories: [{ label: '海鲜水产' }]
  }), {
    status: 'ready',
    hasUsableContent: true,
    showBlockingState: false,
    title: '',
    message: '',
    actionLabel: ''
  });

  assert.equal(state({
    catalogStatus: 'ready',
    homeCategoriesStatus: 'ready',
    bannerStatus: 'ready',
    homeSectionsStatus: 'ready',
    bannerItems: [{ image: '/banner.jpg' }]
  }).status, 'ready', '任一真实首页内容可用时不得误显示整体空态');

  assert.equal(state({
    catalogStatus: 'ready',
    homeCategoriesStatus: 'ready',
    bannerStatus: 'ready',
    homeSectionsStatus: 'ready',
    catalogRefreshError: '刷新失败，已保留当前商品',
    products: [{ id: 'kept' }]
  }).message, '刷新失败，已保留当前商品');

  assert.equal(state({
    catalogStatus: 'ready',
    homeCategoriesStatus: 'ready',
    bannerStatus: 'loading',
    homeSectionsStatus: 'ready'
  }).status, 'loading', '目录先返回空时必须等待其他首页内容请求完成，不能提前显示空态');

  assert.equal(state({
    catalogStatus: 'ready',
    homeCategoriesStatus: 'ready',
    bannerStatus: 'error',
    homeSectionsStatus: 'ready'
  }).status, 'error', '所有请求完成且没有可用内容时，任一首页来源失败都应显示整体失败');

  assert.equal(state({
    catalogStatus: 'ready',
    homeCategoriesStatus: 'ready',
    bannerStatus: 'error',
    homeSectionsStatus: 'ready',
    homeCategories: [{ label: '海鲜水产' }]
  }).status, 'refresh-error', '已有分类时 Banner 失败只能成为局部刷新失败');

  assert.equal(state({
    catalogStatus: 'ready',
    homeCategoriesStatus: 'loading',
    bannerStatus: 'ready',
    homeSectionsStatus: 'ready'
  }).status, 'loading', '空商品先返回时必须等待分类请求完成');

  console.log('home view state test: passed');
}

run();
