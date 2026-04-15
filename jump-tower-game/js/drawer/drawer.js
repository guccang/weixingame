/**
 * 绘制器模块入口
 */

const { roundRect } = require('./helper');
const { drawBackground, drawStartBackground, drawGameOverBackground } = require('./background');
const { drawPlatforms } = require('./platform');
const { drawPickups } = require('./pickup');
const { drawCoins } = require('./coin');
const { drawPlayer } = require('./player');
const { drawParticles } = require('./particle');
const { drawTrails } = require('../effects/trail');
const { drawPet } = require('../pet/pet');
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
  if (game.uiRegistry) {
    game.uiRegistry.beginFrame(game.state);
  }
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
    drawBackground(
      ctx,
      W,
      H,
      game.cameraY,
      game.score,
      game.bgStars,
      images,
      game.runDirector ? game.runDirector.getActiveTheme() : null
    );
    drawPlatforms(ctx, game.platforms, game.cameraY);
    drawPickups(ctx, game, Date.now());
    drawCoins(ctx, game.coins, game.cameraY, game.levelGenerator, Date.now());
    drawTrails(ctx, game.trailEffects, game.cameraY);
    drawPet(ctx, game.pet, game.cameraY);
    drawPlayer(ctx, game.player, game.cameraY, characterConfig, game.skillSystem);
    drawParticles(ctx, game.particles, game.cameraY);
    game.bossSystem.render(ctx); // 渲染Boss
    game.barrage.draw(ctx, W);
    drawUI(ctx, game);
  } else if (game.state === 'gameover') {
    drawGameOverScreen(ctx, game, images);
  }

  ctx.restore();
}

module.exports = {
  render,
  // 导出各子模块供外部使用
  roundRect,
  drawBackground,
  drawStartBackground,
  drawGameOverBackground,
  drawPlatforms,
  drawPickups,
  drawCoins,
  drawTrails,
  drawPet,
  drawPlayer,
  drawParticles,
  drawUI,
  drawStartScreen,
  drawGameOverScreen
};
