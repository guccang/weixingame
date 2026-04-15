/**
 * 资源环境配置。
 */

const DEFAULT_ENV_ID = 'cloud1-9gazfwmccd451101';
const DEFAULT_MANIFEST_FUNCTION = 'getAssetManifest';

function getEnvVersion() {
  try {
    if (typeof wx !== 'undefined' && wx.getAccountInfoSync) {
      const info = wx.getAccountInfoSync();
      return info && info.miniProgram ? info.miniProgram.envVersion : '';
    }
  } catch (e) {
    console.warn('[EnvConfig] 获取 envVersion 失败:', e);
  }
  return '';
}

function normalizeMode(mode) {
  if (mode === 'cloud' || mode === 'local' || mode === 'auto') {
    return mode;
  }
  return 'auto';
}

function resolveMode() {
  const globalMode = typeof GameGlobal !== 'undefined' ? GameGlobal.ASSET_SOURCE_MODE : '';
  const storageMode = typeof wx !== 'undefined' && typeof wx.getStorageSync === 'function'
    ? wx.getStorageSync('asset_source_mode')
    : '';
  const mode = normalizeMode(globalMode || storageMode || '');

  if (mode !== 'auto') {
    return mode;
  }

  return 'local';
}

function getConfig() {
  const envVersion = getEnvVersion();
  const mode = resolveMode();

  return {
    envId: DEFAULT_ENV_ID,
    manifestFunctionName: DEFAULT_MANIFEST_FUNCTION,
    mode: mode,
    envVersion: envVersion,
    allowCloudFallbackToLocal: mode === 'local'
  };
}

module.exports = {
  getConfig: getConfig,
  resolveMode: resolveMode
};
