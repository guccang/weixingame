/**
 * 统一资源管理器。
 */

const AssetCache = require('./assetCache');
const AssetDownloader = require('./assetDownloader');
const AssetManifestService = require('./assetManifestService');
const { getConfig } = require('./envConfig');

class AssetManager {
  constructor() {
    this.ready = false;
    this.mode = 'local';
    this.manifest = null;
    this.cache = new AssetCache();
    this.config = getConfig();
    this.service = new AssetManifestService(this.config);
    this.downloader = new AssetDownloader(this.cache);
    this.keyMap = {};
    this.localPathMap = {};
  }

  async init() {
    if (this.ready) return;

    let manifest = null;
    let mode = this.config.mode;

    if (mode === 'cloud') {
      try {
        manifest = await this.service.getCloudManifest();
        await this.prepareCloudCache(manifest);
      } catch (e) {
        if (this.config.allowCloudFallbackToLocal) {
          console.warn('[AssetManager] 云端资源初始化失败，回退本地模式:', e);
          manifest = await this.service.getLocalManifest();
          mode = 'local';
        } else {
          throw e;
        }
      }
    } else {
      manifest = await this.service.getLocalManifest();
      mode = 'local';
    }

    this.mode = mode;
    this.manifest = manifest;
    this.buildIndexes();
    this.ready = true;
    console.log('[AssetManager] 初始化完成, mode=', this.mode, 'version=', this.manifest.version);
  }

  async prepareCloudCache(manifest) {
    const storedManifest = this.cache.getStoredManifest();
    const currentVersion = manifest.version;
    const previousVersion = storedManifest && storedManifest.version ? storedManifest.version : '';

    if (previousVersion && previousVersion !== currentVersion) {
      this.cache.clearVersion(previousVersion);
    }

    await this.downloader.downloadManifestAssets(manifest);
    this.cache.saveManifest({
      version: currentVersion
    });
  }

  buildIndexes() {
    this.keyMap = {};
    this.localPathMap = {};

    const assets = this.manifest && this.manifest.assets ? this.manifest.assets : [];
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      if (!asset) continue;
      if (asset.key) {
        this.keyMap[asset.key] = asset;
      }
      if (asset.localPath) {
        this.localPathMap[asset.localPath] = asset;
      }
    }
  }

  isReady() {
    return this.ready;
  }

  getAsset(ref) {
    return this.keyMap[ref] || this.localPathMap[ref] || null;
  }

  getImagePath(ref) {
    return this.getAssetPath(ref);
  }

  getAudioPath(ref) {
    return this.getAssetPath(ref);
  }

  getAssetPath(ref) {
    const asset = this.getAsset(ref);
    if (!asset) {
      return ref;
    }

    if (this.mode === 'cloud') {
      const cachedPath = this.cache.getAssetPath(this.manifest.version, asset.localPath);
      if (this.cache.exists(cachedPath)) {
        return cachedPath;
      }
    }

    return asset.localPath || ref;
  }

  getTableText(ref) {
    const assetPath = this.getAssetPath(ref);
    const fs = wx.getFileSystemManager();
    return fs.readFileSync(assetPath, 'utf-8');
  }

  getManifest() {
    return this.manifest;
  }

  getMode() {
    return this.mode;
  }
}

module.exports = new AssetManager();
