const { request } = require('./request');

module.exports = {
  titles: (payload) => request('invoiceTitles.list', payload),
  saveTitle: (payload) => request('invoiceTitles.upsert', payload),
  deleteTitle: (payload) => request('invoiceTitles.delete', payload),
  request: (payload) => request('invoices.request', payload),
  list: (payload) => request('invoices.list', payload),
  get: (payload) => request('invoices.get', payload)
};
