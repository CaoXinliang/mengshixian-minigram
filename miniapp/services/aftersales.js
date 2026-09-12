const refunds = require('./refunds');
const { request: apiRequest } = require('./request');

const MAX_EVIDENCE_FILES = 6;
let localSequence = 0;

function prepareEvidenceUploads(files) {
  return (Array.isArray(files) ? files : []).slice(0, MAX_EVIDENCE_FILES).map((item) => ({
    id: `local-${Date.now()}-${++localSequence}`,
    path: item && (item.tempFilePath || item.path) || '',
    size: Number(item && item.size || 0),
    type: item && item.fileType || (/\.(mp4|mov|webm)$/i.test(item && (item.tempFilePath || item.path) || '') ? 'video' : 'image'),
    status: 'pending',
    mediaId: '',
    errorText: ''
  })).filter((item) => item.path);
}

function request(payload) {
  return refunds.request(payload);
}

function get(payload) { return apiRequest('refunds.get', payload); }
function list(payload) { return apiRequest('refunds.list', payload); }

function mediaMetadata(item) {
  const path = String(item && item.path || '');
  const fileName = path.split(/[\\/]/).pop() || `evidence-${Date.now()}`;
  const extension = (fileName.match(/\.([^.?#]+)(?:[?#].*)?$/) || [])[1];
  const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime' };
  const mimeType = mimeMap[String(extension || '').toLowerCase()] || (item && item.type === 'video' ? 'video/mp4' : 'image/jpeg');
  return { type: item && item.type === 'video' ? 'video' : 'image', mimeType, fileName };
}

function uploadEvidence(item) {
  const maxSize = item && item.type === 'video' ? 10 * 1024 * 1024 : 4 * 1024 * 1024;
  if (Number(item && item.size || 0) > maxSize) return Promise.resolve({ ok: false, data: null, error: { code: 'MEDIA_SIZE_INVALID', message: `售后${item.type === 'video' ? '视频' : '图片'}不能超过 ${item.type === 'video' ? 10 : 4} MB。` } });
  if (typeof wx === 'undefined' || typeof wx.getFileSystemManager !== 'function') return Promise.resolve({ ok: false, data: null, error: { code: 'FILE_READ_UNAVAILABLE', message: '当前微信版本无法读取所选凭证。' } });
  return new Promise((resolve) => {
    wx.getFileSystemManager().readFile({
      filePath: item.path,
      encoding: 'base64',
      success: async result => {
        const metadata = mediaMetadata(item);
        resolve(await apiRequest('refunds.media.upload', { ...metadata, sizeBytes: Number(item.size || 0), contentBase64: result.data }));
      },
      fail: () => resolve({ ok: false, data: null, error: { code: 'FILE_READ_FAILED', message: '凭证读取失败，请重新选择。' } })
    });
  });
}

module.exports = { MAX_EVIDENCE_FILES, prepareEvidenceUploads, request, get, list, uploadEvidence, mediaMetadata };
