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
 * @param {number} chargeCount - 蓄力层数
 * @param {boolean} chargeFull - 蓄力是否已满
 * @param {boolean} chargeDashing - 蓄力冲刺中
 */
function drawUI(ctx, W, H, score, combo, state, gameMode, chargeCount, chargeFull, chargeDashing) {
  if (state !== 'playing') return;
  ctx.fillStyle = '#ffdd57';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(255,221,87,0.8)';
  ctx.shadowBlur = 10;

  // 竞速模式显示倒计时
  // 注意：顶部留出安全区域，避开刘海屏和微信右上角按钮
  const safeTop = 60; // 顶部安全距离

  if (gameMode.gameMode === GAME_MODES.TIME_ATTACK) {
    const timeRemaining = gameMode.timeRemaining;
    const seconds = Math.ceil(timeRemaining / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    ctx.fillText('⏱️ ' + mins + ':' + secs.toString().padStart(2, '0'), 15, safeTop);
    ctx.fillText('🏆 ' + score + 'm', 15, safeTop + 30);
    ctx.fillText('💪 ' + combo, 15, safeTop + 60);
  } else {
    ctx.fillText('🏆 高度: ' + score + 'm', 15, safeTop);
    ctx.fillText('💪 连跳: ' + combo, 15, safeTop + 30);
  }

  // 蓄力冲刺中显示
  if (chargeDashing) {
    ctx.fillStyle = '#ff00ff';
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 15;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('⚡ 蓄力冲刺中 ⚡', W - 15, safeTop + 30);
    ctx.shadowBlur = 0;
  }

  // 蓄力条（冲刺中不显示，与连跳文字底端对齐）
  if (!chargeDashing) {
    const chargeBarWidth = 120;
    const chargeBarHeight = 12;
    const chargeBarX = W - chargeBarWidth - 15;
    // 蓄力条与连跳文字底端对齐（连跳在safeTop+30，字体约22px，底部约safeTop+30+7=safeTop+37）
    const chargeBarY = safeTop + 30 + 7 - chargeBarHeight;
    const chargeMax = 6;

    // 蓄力条背景
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(chargeBarX, chargeBarY, chargeBarWidth, chargeBarHeight);

    // 蓄力条填充
    if (chargeFull) {
      ctx.fillStyle = '#ff00ff';
      ctx.shadowColor = '#ff00ff';
      ctx.shadowBlur = 15;
    } else {
      ctx.fillStyle = '#55efc4';
      ctx.shadowColor = '#55efc4';
      ctx.shadowBlur = 8;
    }
    const fillWidth = (chargeCount / chargeMax) * chargeBarWidth;
    ctx.fillRect(chargeBarX, chargeBarY, fillWidth, chargeBarHeight);

    // 蓄力文字
    ctx.shadowBlur = 0;
    ctx.fillStyle = chargeFull ? '#ff00ff' : '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(chargeFull ? '⚡满蓄力！' : '⚡蓄力 ' + chargeCount + '/' + chargeMax, W - 15, chargeBarY + chargeBarHeight + 18);
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
