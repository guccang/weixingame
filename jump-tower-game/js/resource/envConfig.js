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

function getRuntimePlatform() {
  try {
    if (typeof wx !== 'undefined' && typeof wx.getSystemInfoSync === 'function') {
      const info = wx.getSystemInfoSync();
      return info && info.platform ? String(info.platform).toLowerCase() : '';
    }
  } catch (e) {
    console.warn('[EnvConfig] 获取 platform 失败:', e);
  }
  return '';
}

function normalizeMode(mode) {
  if (mode === 'cloud' || mode === 'local' || mode === 'auto') {
    return mode;
  }
  return 'auto';
}

function resolveAutoMode(envVersion, platform) {
  const runtimePlatform = String(platform || '').toLowerCase();

  if (envVersion === 'develop') {
    // 开发者工具本地运行走本地资源；真机调试虽然仍是 develop，但必须走云资源，避免首包超限。
    return runtimePlatform === 'devtools' ? 'local' : 'cloud';
  }

  if (envVersion === 'trial' || envVersion === 'release') {
    return 'cloud';
  }

  if (runtimePlatform === 'devtools') {
    return 'local';
  }

  // 在未知真机环境下优先走云资源，避免继续依赖首包中的大资源。
  if (runtimePlatform) {
    return 'cloud';
  }

  // 无法识别环境时优先保证本地可运行。
  return 'local';
}

function resolveMode(envVersion, platform) {
  const globalMode = typeof GameGlobal !== 'undefined' ? GameGlobal.ASSET_SOURCE_MODE : '';
  const storageMode = typeof wx !== 'undefined' && typeof wx.getStorageSync === 'function'
    ? wx.getStorageSync('asset_source_mode')
    : '';
  const mode = normalizeMode(globalMode || storageMode || '');

  if (mode !== 'auto') {
    return mode;
  }

  return resolveAutoMode(envVersion || getEnvVersion(), platform || getRuntimePlatform());
}

function getConfig() {
  const envVersion = getEnvVersion();
  const platform = getRuntimePlatform();
  const mode = resolveMode(envVersion, platform);

  return {
    envId: DEFAULT_ENV_ID,
    manifestFunctionName: DEFAULT_MANIFEST_FUNCTION,
    mode: mode,
    envVersion: envVersion,
    platform: platform,
    allowCloudFallbackToLocal: mode === 'local'
  };
}

module.exports = {
  getConfig: getConfig,
  resolveMode: resolveMode,
  resolveAutoMode: resolveAutoMode,
  getRuntimePlatform: getRuntimePlatform
};
