/**
 * 云资源下载器。
 */

class AssetDownloader {
  constructor(cache) {
    this.cache = cache;
  }

  downloadManifestAssets(manifest) {
    const assets = manifest && manifest.assets ? manifest.assets : [];
    const version = manifest && manifest.version ? manifest.version : 'unknown';
    const tasks = [];

    this.cache.ensureRootDir();
    this.cache.ensureDir(this.cache.getVersionDir(version));

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      if (!asset || !asset.downloadUrl || !asset.localPath) {
        continue;
      }

      const targetPath = this.cache.getAssetPath(version, asset.localPath);
      if (this.cache.exists(targetPath)) {
        continue;
      }

      this.cache.ensureDir(targetPath.substring(0, targetPath.lastIndexOf('/')));
      tasks.push(this.downloadFile(asset.downloadUrl, targetPath, asset.key || asset.localPath));
    }

    return Promise.all(tasks);
  }

  downloadFile(url, targetPath, assetName) {
    return new Promise(function(resolve, reject) {
      wx.downloadFile({
        url: url,
        filePath: targetPath,
        success: function(res) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(targetPath);
            return;
          }
          reject(new Error('[AssetDownloader] 下载失败 ' + assetName + ' status=' + res.statusCode));
        },
        fail: function(err) {
          reject(new Error('[AssetDownloader] 下载失败 ' + assetName + ': ' + JSON.stringify(err)));
        }
      });
    });
  }
}

module.exports = AssetDownloader;
