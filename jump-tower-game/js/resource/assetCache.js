/**
 * 本地缓存管理。
 */

const MANIFEST_FILE = 'current-manifest.json';

function joinPath(base, child) {
  if (!base) return child;
  if (!child) return base;
  if (base.charAt(base.length - 1) === '/') {
    return base + child;
  }
  return base + '/' + child;
}

class AssetCache {
  constructor() {
    this.fs = wx.getFileSystemManager();
    this.rootDir = joinPath(wx.env.USER_DATA_PATH, 'assets');
    this.manifestPath = joinPath(this.rootDir, MANIFEST_FILE);
  }

  ensureRootDir() {
    this.ensureDir(this.rootDir);
  }

  ensureDir(dirPath) {
    try {
      this.fs.mkdirSync(dirPath, true);
    } catch (e) {
      try {
        this.fs.accessSync(dirPath);
      } catch (accessErr) {
        console.warn('[AssetCache] 创建目录失败:', dirPath, e || accessErr);
      }
    }
  }

  exists(filePath) {
    try {
      this.fs.accessSync(filePath);
      return true;
    } catch (e) {
      return false;
    }
  }

  getVersionDir(version) {
    return joinPath(this.rootDir, version);
  }

  getAssetPath(version, relativePath) {
    return joinPath(this.getVersionDir(version), relativePath);
  }

  getStoredManifest() {
    if (!this.exists(this.manifestPath)) {
      return null;
    }

    try {
      const content = this.fs.readFileSync(this.manifestPath, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.warn('[AssetCache] 读取 manifest 缓存失败:', e);
      return null;
    }
  }

  saveManifest(manifest) {
    this.ensureRootDir();
    this.fs.writeFileSync(this.manifestPath, JSON.stringify(manifest), 'utf-8');
  }

  clearVersion(version) {
    if (!version) return;
    const versionDir = this.getVersionDir(version);
    if (!this.exists(versionDir)) return;

    try {
      this.fs.rmdirSync(versionDir, true);
    } catch (e) {
      console.warn('[AssetCache] 删除旧版本缓存失败:', versionDir, e);
    }
  }
}

module.exports = AssetCache;
