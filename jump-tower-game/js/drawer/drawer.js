/**
 * 绘制器模块入口
 */

const { roundRect } = require('./helper');
const { drawBackground } = require('./background');
const { drawPlatforms } = require('./platform');
const { drawPlayer } = require('./player');
const { drawParticles } = require('./particle');
const { drawUI } = require('./ui');
const { drawStartScreen } = require('./startScreen');
const { drawGameOverScreen } = require('./gameOver');

/**
 * 主渲染方法
 * @param {Object} game - 游戏实例
 * @param {Object} images - 图片资源
 * @param {Object} characterConfig - 角色配置
 * @param {Object} jobConfig - 职业配置
 */
function render(game, images, characterConfig, jobConfig) {
  const { ctx, W, H, shakeTimer } = game;

  ctx.clearRect(0, 0, W, H);
  let shakeX = 0, shakeY = 0;
  if (shakeTimer > 0) {
    shakeX = (Math.random() - 0.5) * shakeTimer;
    shakeY = (Math.random() - 0.5) * shakeTimer;
  }
  ctx.save();
  ctx.translate(shakeX, shakeY);

  if (game.state === 'start') {
    drawStartScreen(ctx, game, images, characterConfig, jobConfig);
  } else if (game.state === 'playing') {
    drawBackground(ctx, W, H, game.cameraY, game.score, game.bgStars);
    drawPlatforms(ctx, game.platforms, game.cameraY);
    drawPlayer(ctx, game.player, game.cameraY, characterConfig);
    drawParticles(ctx, game.particles, game.cameraY);
    game.barrage.draw(ctx, W);
    drawUI(ctx, W, H, game.score, game.combo, game.state, game.gameMode);
  } else if (game.state === 'gameover') {
    drawGameOverScreen(ctx, game);
  }

  ctx.restore();
}

module.exports = {
  render,
  // 导出各子模块供外部使用
  roundRect,
  drawBackground,
  drawPlatforms,
  drawPlayer,
  drawParticles,
  drawUI,
  drawStartScreen,
  drawGameOverScreen
};
