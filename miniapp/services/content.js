const { request } = require('./request');
const { chunkUnique } = require('./collection');

async function resolveMediaFiles(ids) {
  const fileMap = {};
  if (typeof wx === 'undefined' || !wx.cloud || typeof wx.cloud.getTempFileURL !== 'function') return fileMap;
  for (const mediaIds of chunkUnique(ids, 50)) {
    let result = null;
    try { result = await request('content.media.resolve', { ids: mediaIds, platform: 'miniapp' }); } catch (error) { result = null; }
    const rows = result && result.ok && result.data && Array.isArray(result.data.rows) ? result.data.rows : [];
    const fileIdsByMedia = rows
      .filter(row => row && row._id && row.fileId)
      .map(row => ({ mediaId: row._id, fileId: row.fileId }));
    for (const fileIds of chunkUnique(rows.map(row => row && row.fileId), 50)) {
      let resolved = { fileList: [] };
      try { resolved = await wx.cloud.getTempFileURL({ fileList: fileIds }); } catch (error) { resolved = { fileList: [] }; }
      const urls = {};
      (resolved.fileList || []).forEach(file => { if (file && file.fileID && file.tempFileURL) urls[file.fileID] = file.tempFileURL; });
      fileIdsByMedia.forEach(({ mediaId, fileId }) => { if (urls[fileId]) fileMap[mediaId] = urls[fileId]; });
    }
  }
  return fileMap;
}

module.exports = {
  getBanners: (payload) => request('content.banners', payload),
  getHomeSections: (payload) => request('content.homeSections', payload),
  getMealIdeas: (payload) => request('content.mealIdeas', payload),
  resolveMedia: (ids) => request('content.media.resolve', { ids, platform: 'miniapp' }),
  resolveMediaFiles
};
