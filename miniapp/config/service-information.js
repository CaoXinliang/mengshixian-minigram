const SERVICE_TYPES = ['service', 'trace', 'aftersale', 'coldchain', 'about', 'faq'];

const CONTENT = {
  service: {
    title: '微信客服',
    subtitle: '咨询商品、订单、配送与售后问题',
    paragraphs: ['客服回复以微信客服会话实际状态为准；当前页面不承诺固定在线时段。'],
    contact: true,
    actions: [{ key: 'orders', label: '查询我的订单' }, { key: 'special', label: '看看今日特价' }]
  },
  trace: {
    title: '商品保障说明',
    paragraphs: ['商品生产信息、批次号和保质期以实际出库包装为准。', '收货时请核对外包装、规格和商品状态。', '商品与配送问题可通过微信客服咨询。'],
    contact: true
  },
  aftersale: {
    title: '售后服务说明',
    paragraphs: ['签收后如遇商品或配送问题，可从订单详情申请售后。', '售后资格、时效、可退数量和金额以订单及服务端审核结果为准。'],
    contact: true
  },
  coldchain: {
    title: '冷链与仓配说明',
    paragraphs: ['冷冻商品的配送范围、仓库和可选时段以结算页实时结果为准。', '收货时请检查外包装、规格和商品状态。', '当前不提供虚构的实时物流轨迹；配送进展以订单状态或客服确认为准。'],
    contact: true
  },
  about: {
    title: '关于梦食鲜',
    paragraphs: ['梦食鲜为冻品商城项目名称。正式运营主体、认证信息和服务范围以微信公众平台及后续运营核验结果为准。'],
    contact: false
  },
  faq: {
    title: '常见问题',
    questions: [
      { question: '配送时间如何确认？', answer: '结算页会按地址、仓库和可用时段展示当前结果，最终以订单状态为准。' },
      { question: '冷冻食品如何验收？', answer: '请在收货时核对包装、规格、数量和商品状态；异常时保留凭证并从订单详情申请售后。' },
      { question: '为什么看不到实时物流？', answer: '当前没有经过核验的承运轨迹来源，因此只展示真实订单处理节点。' }
    ],
    contact: true
  }
};

function getServiceInformation(type, options = {}) {
  const safeType = SERVICE_TYPES.includes(type) ? type : 'service';
  const base = CONTENT[safeType];
  const productName = String(options.productName || '').trim();
  return {
    type: safeType,
    ...base,
    title: safeType === 'trace' && productName ? `${productName} · 商品保障说明` : base.title,
    paragraphs: [...(base.paragraphs || [])],
    questions: [...(base.questions || [])],
    actions: [...(base.actions || [])],
    source: 'operator_review_required'
  };
}

module.exports = { SERVICE_TYPES, getServiceInformation };
