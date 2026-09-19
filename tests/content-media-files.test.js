const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
Module._load = function load(requestName, parent, isMain) {
  if (requestName === './request' && parent && /services[\\/]content\.js$/.test(parent.filename)) {
    return {
      request: async (action, payload) => ({
        ok: true,
        data: {
          rows: payload.ids.map(id => ({ _id: id, fileId: id === 'media-missing' ? '' : 'cloud://shared-image' }))
        }
      })
    };
  }
  return originalLoad.call(this, requestName, parent, isMain);
};

global.wx = {
  cloud: {
    getTempFileURL: async ({ fileList }) => ({
      fileList: fileList.map(fileID => ({ fileID, tempFileURL: 'https://example.test/shared-image.jpg' }))
    })
  }
};

let content;
try {
  content = require(path.resolve(__dirname, '../miniapp/services/content.js'));
} finally {
  Module._load = originalLoad;
}

content.resolveMediaFiles(['media-a', 'media-b', 'media-missing']).then(files => {
  assert.deepEqual(files, {
    'media-a': 'https://example.test/shared-image.jpg',
    'media-b': 'https://example.test/shared-image.jpg'
  }, '共享同一文件的每个媒体记录都必须获得可访问URL');
  delete global.wx;
  console.log('content media files test: passed');
}).catch(error => {
  delete global.wx;
  console.error(error);
  process.exit(1);
});
