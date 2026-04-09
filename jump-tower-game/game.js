// 跳跳楼游戏入口
require('./js/render');

// 自动判断资源加载模式
// 本地开发环境(develop)使用本地资源，正式环境使用云端资源
function resolveAssetMode() {
  try {
    if (typeof wx !== 'undefined' && wx.getAccountInfoSync) {
      const info = wx.getAccountInfoSync();
      const envVersion = info && info.miniProgram ? info.miniProgram.envVersion : '';
      // develop: 开发版, trial: 体验版, release: 正式版
      if (envVersion === 'develop') {
        return 'local';
      }
    }
  } catch (e) {
    console.warn('[game.js] 获取环境版本失败，使用本地模式:', e);
    return 'local';
  }
  return 'cloud';
}

GameGlobal.ASSET_SOURCE_MODE = resolveAssetMode();
console.log('[game.js] 资源加载模式:', GameGlobal.ASSET_SOURCE_MODE);

require('./js/bootstrap');
