/**
 * UI绘制模块
 * 文本从表格加载：UIText.txt
 */

const gameConstants = require('../game/constants');
const { GAME_MODES } = gameConstants;
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
function drawUI(ctx, game) {
  const {
    W,
    H,
    score,
    combo,
    state,
    gameMode,
    chargeCount,
    chargeFull,
    chargeDashing,
    chargeMax
  } = game;
  if (state !== 'playing') return;
  ctx.fillStyle = '#ffdd57';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(255,221,87,0.8)';
  ctx.shadowBlur = 10;

  // 顶部安全区域
  const safeTop = gameConstants.UI_SAFE_TOP;

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

  if (typeof game.getDisplayedRunCoins === 'function') {
    const coins = game.getDisplayedRunCoins();
    ctx.fillStyle = '#ffd166';
    ctx.shadowColor = 'rgba(255, 209, 102, 0.8)';
    ctx.shadowBlur = 10;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('💰 ' + coins, 15, safeTop + 60);
    ctx.shadowBlur = 0;
  }

  ctx.shadowBlur = 0;
  drawDebugBadge(ctx, game, safeTop);
  drawGoalPanel(ctx, game, safeTop);
  drawBuffChips(ctx, game, safeTop);
  drawPickupChips(ctx, game, safeTop);
  drawThemePill(ctx, game, safeTop);
  drawBanner(ctx, game);
  drawBottomHint(ctx, game);

  if (game.runDirector && game.runDirector.isBuffOfferOpen()) {
    drawBuffOfferOverlay(ctx, game);
  }

}

function drawDebugBadge(ctx, game, safeTop) {
  if (!game || typeof game.isDebugRun !== 'function' || !game.isDebugRun()) return;
  const text = typeof game.getDebugRunLabel === 'function' ? game.getDebugRunLabel() : 'DEBUG';
  const w = Math.max(120, text.length * 10 + 28);
  const x = (game.W - w) / 2;
  const y = safeTop + 2;
  ctx.save();
  ctx.fillStyle = 'rgba(255, 170, 76, 0.18)';
  roundRect(ctx, x, y, w, 22, 11);
  ctx.fillStyle = '#ffd37b';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, x + w / 2, y + 15);
  ctx.restore();
}

function drawGoalPanel(ctx, game, safeTop) {
  if (!game.runDirector) return;
  const goal = game.runDirector.getCurrentGoal();
  if (!goal) return;

  const x = 14;
  const y = safeTop + 88;
  const w = 158;
  const h = 56;

  ctx.save();
  ctx.fillStyle = 'rgba(8, 12, 24, 0.66)';
  roundRect(ctx, x, y, w, h, 12);
  ctx.fillStyle = '#55efc4';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(goal.title, x + 12, y + 20);
  ctx.fillStyle = 'rgba(255,255,255,0.86)';
  ctx.font = '12px sans-serif';
  ctx.fillText(goal.desc + ' ' + goal.progress + '/' + goal.target, x + 12, y + 38);
  ctx.fillStyle = '#ffd166';
  ctx.fillText('奖励 +' + goal.rewardCoins, x + 12, y + 52);
  ctx.restore();
}

function drawBuffChips(ctx, game, safeTop) {
  if (!game.runDirector) return;
  const buffs = game.runDirector.getActiveBuffs();
  if (!buffs || buffs.length === 0) return;

  let x = game.W - 106;
  let y = safeTop + 90;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 12px sans-serif';
  for (let i = 0; i < buffs.length && i < 4; i++) {
    const buff = buffs[i];
    ctx.fillStyle = withAlpha(buff.color, 0.24);
    roundRect(ctx, x, y + i * 26, 92, 20, 10);
    ctx.fillStyle = buff.color;
    ctx.fillText(buff.shortName || buff.name, x + 46, y + 14 + i * 26);
  }
  ctx.restore();
}

function drawPickupChips(ctx, game, safeTop) {
  if (!game.runDirector) return;
  const entries = game.runDirector.getPickupHudEntries(Date.now());
  if (!entries || entries.length === 0) return;

  const buffCount = game.runDirector.getActiveBuffs().length;
  const x = game.W - 118;
  const y = safeTop + 98 + Math.min(4, buffCount) * 26 + 8;

  ctx.save();
  ctx.textAlign = 'left';
  ctx.font = 'bold 12px sans-serif';

  for (let i = 0; i < entries.length && i < 4; i++) {
    const entry = entries[i];
    const chipY = y + i * 24;
    ctx.fillStyle = withAlpha(entry.color, entry.negative ? 0.28 : 0.22);
    roundRect(ctx, x, chipY, 104, 18, 9);
    ctx.fillStyle = entry.color;
    ctx.fillText((entry.negative ? '负 ' : '正 ') + (entry.shortName || entry.name), x + 8, chipY + 13);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(entry.secondsRemaining + 's', x + 96, chipY + 13);
    ctx.textAlign = 'left';
  }

  ctx.restore();
}

function drawThemePill(ctx, game, safeTop) {
  if (!game.runDirector) return;
  const theme = game.runDirector.getActiveTheme();
  if (!theme) return;

  const text = theme.name + ' 空域';
  const w = Math.max(120, text.length * 13);
  const x = (game.W - w) / 2;
  const y = safeTop - 8;
  ctx.save();
  ctx.fillStyle = withAlpha(theme.theme.accentColor || '#ffffff', 0.22);
  roundRect(ctx, x, y, w, 26, 13);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, x + w / 2, y + 17);
  ctx.restore();
}

function drawBanner(ctx, game) {
  if (!game.runDirector) return;
  const banner = game.runDirector.getBanner();
  if (!banner) return;

  const w = Math.min(game.W - 60, 280);
  const x = (game.W - w) / 2;
  const y = 118;
  ctx.save();
  ctx.fillStyle = 'rgba(5, 8, 18, 0.8)';
  roundRect(ctx, x, y, w, 34, 14);
  ctx.fillStyle = banner.color || '#ffffff';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(banner.text, x + w / 2, y + 22);
  ctx.restore();
}

function drawBottomHint(ctx, game) {
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(getText('MOVE_HINT'), game.W / 2, game.H - 20);
}

function drawBuffOfferOverlay(ctx, game) {
  const offer = game.runDirector ? game.runDirector.buffOffer : null;
  if (!offer) return;
  const layout = game.runDirector.getOfferLayout();

  ctx.save();
  ctx.fillStyle = 'rgba(3, 6, 14, 0.78)';
  ctx.fillRect(0, 0, game.W, game.H);
  ctx.fillStyle = 'rgba(10, 14, 28, 0.96)';
  roundRect(ctx, layout.panelX, layout.panelY, layout.panelW, layout.panelH, 18);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('三选一增益', layout.panelX + layout.panelW / 2, layout.panelY + 28);
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.font = '13px sans-serif';
  ctx.fillText('本局生效，立即选择一项', layout.panelX + layout.panelW / 2, layout.panelY + 48);

  for (let i = 0; i < layout.cards.length; i++) {
    const card = layout.cards[i];
    const option = offer.options[i];
    if (!option) continue;
    ctx.fillStyle = withAlpha(option.color, 0.2);
    roundRect(ctx, card.x, card.y, card.w, card.h, 14);
    ctx.strokeStyle = withAlpha(option.color, 0.9);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = option.color;
    ctx.font = 'bold 17px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(option.name, card.x + 14, card.y + 24);
    ctx.fillStyle = 'rgba(255,255,255,0.86)';
    ctx.font = '12px sans-serif';
    ctx.fillText(option.desc, card.x + 14, card.y + 46);
    ctx.fillStyle = 'rgba(255,255,255,0.66)';
    ctx.fillText('点击领取', card.x + 14, card.y + 70);
  }
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

function withAlpha(hexColor, alpha) {
  const normalized = (hexColor || '').replace('#', '');
  if (normalized.length !== 6) {
    return `rgba(255,255,255,${alpha})`;
  }
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

module.exports = {
  drawUI,
  getText
};
