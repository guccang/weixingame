/**
 * 资源清单服务。
 */

const { localManifest } = require('./assetCatalog');
const TEMP_FILE_URL_BATCH_SIZE = 50;

function mergeManifest(baseManifest, overrideManifest) {
  const merged = {
    version: (overrideManifest && overrideManifest.version) || baseManifest.version,
    assets: []
  };
  const assetMap = {};
  const baseAssets = baseManifest && baseManifest.assets ? baseManifest.assets : [];
  const overrideAssets = overrideManifest && overrideManifest.assets ? overrideManifest.assets : [];

  function upsert(asset) {
    if (!asset) return;
    const id = asset.key || asset.localPath;
    if (!id) return;
    assetMap[id] = Object.assign({}, assetMap[id] || {}, asset);
  }

  for (let i = 0; i < baseAssets.length; i++) {
    upsert(baseAssets[i]);
  }

  for (let j = 0; j < overrideAssets.length; j++) {
    upsert(overrideAssets[j]);
  }

  const ids = Object.keys(assetMap);
  for (let k = 0; k < ids.length; k++) {
    merged.assets.push(assetMap[ids[k]]);
  }

  return merged;
}

function normalizeManifestPayload(payload) {
  if (!payload) {
    return null;
  }

  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch (e) {
      return null;
    }
  }

  if (Array.isArray(payload)) {
    if (payload.length === 0) {
      return null;
    }
    return normalizeManifestPayload(payload[0]);
  }

  if (payload.data && payload.data.assets) {
    return payload.data;
  }

  if (payload.data && payload.data.data) {
    return normalizeManifestPayload(payload.data.data);
  }

  if (payload.result && payload.result.assets) {
    return payload.result;
  }

  if (payload.result && payload.result.data) {
    return normalizeManifestPayload(payload.result.data);
  }

  if (payload.manifest) {
    return normalizeManifestPayload(payload.manifest);
  }

  if (payload.assets) {
    return payload;
  }

  return null;
}

function getTempUrls(fileIdList) {
  return new Promise(function(resolve, reject) {
    if (!wx.cloud || typeof wx.cloud.getTempFileURL !== 'function') {
      reject(new Error('wx.cloud.getTempFileURL 不可用'));
      return;
    }

    wx.cloud.getTempFileURL({
      fileList: fileIdList,
      success: function(res) {
        resolve(res.fileList || []);
      },
      fail: function(err) {
        reject(err);
      }
    });
  });
}

async function getTempUrlsInBatches(fileIdList) {
  const results = [];

  for (let i = 0; i < fileIdList.length; i += TEMP_FILE_URL_BATCH_SIZE) {
    const batch = fileIdList.slice(i, i + TEMP_FILE_URL_BATCH_SIZE);
    const batchResults = await getTempUrls(batch);
    for (let j = 0; j < batchResults.length; j++) {
      results.push(batchResults[j]);
    }
  }

  return results;
}

class AssetManifestService {
  constructor(config) {
    this.config = config;
  }

  getLocalManifest() {
    return Promise.resolve(localManifest);
  }

  async getCloudManifest() {
    if (!wx.cloud || typeof wx.cloud.callFunction !== 'function') {
      throw new Error('wx.cloud.callFunction 不可用');
    }

    const res = await new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: this.config.manifestFunctionName,
        data: {},
        success: resolve,
        fail: reject
      });
    });

    const manifest = normalizeManifestPayload(res && res.result ? res.result : res);
    if (!manifest || !manifest.assets || !manifest.version) {
      console.warn('[AssetManifestService] 云端 manifest 原始返回:', JSON.stringify(res && res.result ? res.result : res));
      throw new Error('云端 manifest 返回格式无效');
    }

    if (!Array.isArray(manifest.assets) || manifest.assets.length === 0) {
      console.warn('[AssetManifestService] 云端 manifest 为空:', JSON.stringify(manifest));
      throw new Error('云端 manifest 为空');
    }

    const mergedManifest = mergeManifest(localManifest, manifest);
    if (!mergedManifest.assets || mergedManifest.assets.length === 0) {
      throw new Error('合并后的 manifest 为空');
    }
    await this.fillDownloadUrls(mergedManifest);

    const missingRemoteAssets = [];
    for (let i = 0; i < mergedManifest.assets.length; i++) {
      const asset = mergedManifest.assets[i];
      if (!asset.downloadUrl && !asset.fileID && !asset.tempFileURL && !asset.url) {
        missingRemoteAssets.push(asset.key || asset.localPath || ('asset-' + i));
      }
    }

    if (missingRemoteAssets.length > 0) {
      console.warn('[AssetManifestService] 缺少云端地址的资源:', missingRemoteAssets.join(', '));
      throw new Error('云端 manifest 缺少资源下载地址');
    }

    return mergedManifest;
  }

  async fillDownloadUrls(manifest) {
    const assets = manifest.assets || [];
    const pendingFileIds = [];
    const pendingMap = {};

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      if (asset.downloadUrl || asset.tempFileURL || asset.url) {
        asset.downloadUrl = asset.downloadUrl || asset.tempFileURL || asset.url;
        continue;
      }
      if (asset.fileID) {
        pendingFileIds.push(asset.fileID);
        pendingMap[asset.fileID] = asset;
      }
    }

    if (pendingFileIds.length === 0) {
      return;
    }

    const urlList = await getTempUrlsInBatches(pendingFileIds);
    for (let i = 0; i < urlList.length; i++) {
      const item = urlList[i];
      if (!item || !item.fileID || !pendingMap[item.fileID]) continue;
      pendingMap[item.fileID].downloadUrl = item.tempFileURL;
    }
  }
}

module.exports = AssetManifestService;
