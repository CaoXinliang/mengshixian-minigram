function hasRows(value) {
  return Array.isArray(value) && value.length > 0;
}

function deriveHomeViewState(input = {}) {
  const catalogStatus = String(input.catalogStatus || 'loading');
  const sourceStatuses = [catalogStatus, String(input.homeCategoriesStatus || 'loading'), String(input.bannerStatus || 'loading'), String(input.homeSectionsStatus || 'loading')];
  const hasPendingSource = sourceStatuses.includes('loading');
  const hasFailedSource = sourceStatuses.includes('error');
  const hasUsableContent = [input.products, input.homeCategories, input.bannerItems, input.homeSections].some(hasRows);
  const refreshMessage = String(input.catalogRefreshError || '').trim();

  if (!hasUsableContent && hasPendingSource) {
    return {
      status: 'loading',
      hasUsableContent: false,
      showBlockingState: true,
      title: '正在加载首页',
      message: '商品与分类加载完成后会立即显示',
      actionLabel: ''
    };
  }

  if (!hasUsableContent && hasFailedSource) {
    return {
      status: 'error',
      hasUsableContent: false,
      showBlockingState: true,
      title: '首页加载失败',
      message: '请检查网络后重试，当前页面不会提交任何操作。',
      actionLabel: '重新加载'
    };
  }

  if (!hasUsableContent) {
    return {
      status: 'empty',
      hasUsableContent: false,
      showBlockingState: true,
      title: '暂无可展示内容',
      message: '当前仓库暂未配置首页内容，可刷新或切换仓库。',
      actionLabel: '刷新首页'
    };
  }

  if (hasUsableContent && (hasFailedSource || refreshMessage)) {
    return {
      status: 'refresh-error',
      hasUsableContent: true,
      showBlockingState: false,
      title: '',
      message: refreshMessage || '刷新失败，已保留当前内容',
      actionLabel: '重新加载'
    };
  }

  return {
    status: 'ready',
    hasUsableContent,
    showBlockingState: false,
    title: '',
    message: '',
    actionLabel: ''
  };
}

module.exports = { deriveHomeViewState };
