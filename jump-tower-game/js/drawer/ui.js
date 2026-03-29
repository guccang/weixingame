/**
 * UI绘制模块
 */

const { GAME_MODES } = require('../game/constants');

/**
 * 绘制游戏UI
 * @param {CanvasRenderingContext2D} ctx - canvas上下文
 * @param {number} W - 屏幕宽度
 * @param {number} H - 屏幕高度
 * @param {number} score - 当前分数
 * @param {number} combo - 连跳数
 * @param {string} state - 游戏状态
 * @param {Object} gameMode - 游戏模式对象
 */
function drawUI(ctx, W, H, score, combo, state, gameMode) {
  if (state !== 'playing') return;
  ctx.fillStyle = '#ffdd57';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(255,221,87,0.8)';
  ctx.shadowBlur = 10;

  // 竞速模式显示倒计时
  if (gameMode.gameMode === GAME_MODES.TIME_ATTACK) {
    const timeRemaining = gameMode.timeRemaining;
    const seconds = Math.ceil(timeRemaining / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    ctx.fillText('⏱️ ' + mins + ':' + secs.toString().padStart(2, '0'), 15, 35);
    ctx.fillText('🏆 ' + score + 'm', 15, 65);
    ctx.fillText('💪 ' + combo, 15, 95);
  } else {
    ctx.fillText('🏆 高度: ' + score + 'm', 15, 35);
    ctx.fillText('💪 连跳: ' + combo, 15, 65);
  }

  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('滑动屏幕左右移动 | 连点两次二段跳', W / 2, H - 20);
}

module.exports = {
  drawUI
};
