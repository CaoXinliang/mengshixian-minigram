const { request } = require('./request');

module.exports = {
  quote: (payload) => request('checkout.quote', payload),
  // 服务端建单路由归属订单域；报价才属于 checkout 域。
  createOrder: (payload) => request('orders.create', payload),
  preparePayment: (payload) => request('payments.wechat.prepare', payload)
};
