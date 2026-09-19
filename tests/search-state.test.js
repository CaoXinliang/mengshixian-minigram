const assert = require('assert/strict');
const path = require('path');

const {
  addRecentSearch,
  normalizeRecentSearches,
  buildSearchCategorySuggestions,
  captureSearchReturnContext,
  restoreSearchReturnPatch
} = require(path.resolve(__dirname, '../miniapp/modules/search-state'));

function run() {
  assert.deepEqual(
    normalizeRecentSearches([' 牛肉卷 ', '虾滑', '牛肉卷', '', null, { price: 12 }, '丸子', '羊肉卷', '面点']),
    ['牛肉卷', '虾滑', '丸子', '羊肉卷'],
    '最近搜索只能保存去重后的纯关键词，且最多四条'
  );
  assert.deepEqual(
    addRecentSearch(['虾滑', '丸子', '羊肉卷', '面点'], '  牛肉卷  '),
    ['牛肉卷', '虾滑', '丸子', '羊肉卷'],
    '新搜索应置顶并截断到四条'
  );
  assert.deepEqual(
    addRecentSearch(['牛肉卷', '虾滑'], '牛肉卷'),
    ['牛肉卷', '虾滑'],
    '重复关键词不应产生重复记录'
  );

  const suggestions = buildSearchCategorySuggestions([
    { id: 'all', label: '全部分类', categories: ['牛肉类', '海鲜水产'] },
    { id: 'beef', label: '牛肉类', categories: ['牛肉类'] },
    { id: 'seafood', label: '海鲜水产', categories: ['海鲜水产'] },
    { id: 'dup', label: '牛肉类', categories: ['牛肉类'] }
  ]);
  assert.deepEqual(suggestions, [
    { id: 'search-results', label: '搜索结果', type: 'results' },
    { id: 'beef', label: '牛肉类', type: 'category', category: '牛肉类' },
    { id: 'seafood', label: '海鲜水产', type: 'category', category: '海鲜水产' }
  ], '搜索侧栏只能使用真实分类，并去掉全部分类和重复项');

  const context = captureSearchReturnContext({
    page: 'category',
    activeTab: 'category',
    query: '',
    searchDraft: '尚未提交',
    categoryGroup: 'beef',
    category: '牛肉类',
    pageScrollTop: 7,
    catalogResultsScrollTop: 23
  }, { pageScrollTop: 118, catalogResultsScrollTop: 326 });
  assert.deepEqual(context, {
    page: 'category',
    activeTab: 'category',
    query: '',
    searchDraft: '尚未提交',
    categoryGroup: 'beef',
    category: '牛肉类',
    pageScrollTop: 118,
    catalogResultsScrollTop: 326
  });
  assert.deepEqual(restoreSearchReturnPatch(context), {
    page: 'category',
    activeTab: 'category',
    query: '',
    searchDraft: '尚未提交',
    categoryGroup: 'beef',
    category: '牛肉类',
    pageScrollTop: 118,
    catalogResultsScrollTop: 326,
    searchMode: false,
    catalogBrowseLoading: false,
    catalogBrowseError: ''
  });

  console.log('search state test: passed');
}

run();
