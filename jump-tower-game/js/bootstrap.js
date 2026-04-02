const assetManager = require('./resource/assetManager');

function initCloudIfNeeded() {
  const config = require('./resource/envConfig').getConfig();

  if (config.mode !== 'cloud') {
    return;
  }

  if (!wx.cloud) {
    console.warn('[Bootstrap] wx.cloud 不可用，资源系统将回退到本地模式');
    return;
  }

  wx.cloud.init({
    env: config.envId
  });
}

async function bootstrap() {
  try {
    initCloudIfNeeded();
    await assetManager.init();
    require('./main');
  } catch (e) {
    console.error('[Bootstrap] 资源系统初始化失败:', e);
    renderFatalError('资源加载失败', '请检查网络后重试');
  }
}

function renderFatalError(title, message) {
  if (!GameGlobal.canvas) {
    return;
  }

  const canvas = GameGlobal.canvas;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#08111f';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(title, width / 2, height / 2 - 20);

  ctx.fillStyle = '#9db0c7';
  ctx.font = '16px sans-serif';
  ctx.fillText(message, width / 2, height / 2 + 20);
  ctx.fillText('当前版本依赖云端资源', width / 2, height / 2 + 48);
}

bootstrap();
