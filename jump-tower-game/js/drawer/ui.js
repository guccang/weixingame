/**
 * UI绘制模块
 * 文本从表格加载：UIText.txt
 */

const { GAME_MODES } = require('../game/constants');
const tableManager = require('../tables/tableManager');

/**
 * 获取UI文本
 * @param {string} key - 文本键
 * @param {Array} args - 格式化参数
 */
function getText(key, ...args) {
  const texts = tableManager.getAll('UIText');
  const item = texts.find(t => t.Key === key);
  if (!item) return key;

  let text = item.Text;
  // 替换 {0}, {1} 等占位符
  for (let i = 0; i < args.length; i++) {
    text = text.replace(`{${i}}`, args[i]);
  }
  return text;
}

/**
 * 绘制游戏UI
 */
function drawUI(ctx, W, H, score, combo, state, gameMode, chargeCount, chargeFull, chargeDashing, chargeMax, coins) {
  if (state !== 'playing') return;
  ctx.fillStyle = '#ffdd57';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(255,221,87,0.8)';
  ctx.shadowBlur = 10;

  // 顶部安全区域
  const safeTop = 60;

  if (gameMode.gameMode === GAME_MODES.TIME_ATTACK) {
    const timeRemaining = gameMode.timeRemaining;
    const seconds = Math.ceil(timeRemaining / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    ctx.fillText('⏱️ ' + mins + ':' + secs.toString().padStart(2, '0'), 15, safeTop);
    ctx.fillText('🏆 ' + score + 'm', 15, safeTop + 30);
    ctx.fillText('💪 ' + combo, 15, safeTop + 60);
  } else {
    ctx.fillText(getText('HEIGHT_LABEL', score), 15, safeTop);
    ctx.fillText(getText('COMBO_LABEL', combo), 15, safeTop + 30);
  }

  // 蓄力冲刺中显示
  if (chargeDashing) {
    ctx.fillStyle = '#ff00ff';
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 15;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('⚡ ' + getText('DASH_LABEL') + ' ⚡', W - 15, safeTop + 30);
    ctx.shadowBlur = 0;
  }

  // 蓄力条
  if (!chargeDashing) {
    const chargeBarWidth = 120;
    const chargeBarHeight = 12;
    const chargeBarX = W - chargeBarWidth - 15;
    const chargeBarY = safeTop + 30 + 7 - chargeBarHeight;
    const maxCharge = Math.max(1, chargeMax || 6);

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(chargeBarX, chargeBarY, chargeBarWidth, chargeBarHeight);

    if (chargeFull) {
      ctx.fillStyle = '#ff00ff';
      ctx.shadowColor = '#ff00ff';
      ctx.shadowBlur = 15;
    } else {
      ctx.fillStyle = '#55efc4';
      ctx.shadowColor = '#55efc4';
      ctx.shadowBlur = 8;
    }
    const fillWidth = (chargeCount / maxCharge) * chargeBarWidth;
    ctx.fillRect(chargeBarX, chargeBarY, fillWidth, chargeBarHeight);

    ctx.shadowBlur = 0;
    ctx.fillStyle = chargeFull ? '#ff00ff' : '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(
      chargeFull ? getText('CHARGE_FULL') : getText('CHARGE_LABEL', chargeCount, maxCharge),
      W - 15, chargeBarY + chargeBarHeight + 18
    );
  }

  if (typeof coins === 'number') {
    ctx.fillStyle = '#ffd166';
    ctx.shadowColor = 'rgba(255, 209, 102, 0.8)';
    ctx.shadowBlur = 10;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('💰 ' + coins, 15, safeTop + 60);
    ctx.shadowBlur = 0;
  }

  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(getText('MOVE_HINT'), W / 2, H - 20);

}

module.exports = {
  drawUI,
  getText
};
