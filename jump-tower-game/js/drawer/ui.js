/**
 * UI绘制模块
 * 文本从表格加载：UIText.txt
 */

const gameConstants = require('../game/constants');
const { GAME_MODES } = gameConstants;
const { getText } = require('../ui/text');
const { roundRect, roundedRectPath } = require('./helper');
const uiTheme = require('../ui/theme');

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
  const theme = uiTheme.getThemeFromGame(game);
  const safeTop = gameConstants.UI_SAFE_TOP;
  const stats = [];

  if (gameMode.gameMode === GAME_MODES.TIME_ATTACK) {
    const timeRemaining = gameMode.timeRemaining;
    const seconds = Math.ceil(timeRemaining / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    stats.push({
      label: '倒计时',
      value: getText('TIMER_LABEL', mins, secs.toString().padStart(2, '0')),
      color: theme.cardMeta
    });
  }
  stats.push({
    label: '高度',
    value: score + 'm',
    color: theme.accentSoft
  });
  stats.push({
    label: '连跳',
    value: String(combo),
    color: theme.accent
  });

  // 蓄力冲刺中显示
  if (chargeDashing) {
    ctx.fillStyle = theme.hudAccent;
    ctx.shadowColor = 'rgba(0,0,0,0.10)';
    ctx.shadowBlur = 4;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'right';
    drawSoftPanel(ctx, W - 176, safeTop + 6, 162, 30, 15, theme.hudPanel, theme.hudStroke);
    ctx.fillText(getText('DASH_LABEL'), W - 15, safeTop + 30);
    ctx.shadowBlur = 0;
  }

  // 蓄力条
  if (!chargeDashing) {
    const chargeBarWidth = 120;
    const chargeBarHeight = 12;
    const chargeBarX = W - chargeBarWidth - 15;
    const chargeBarY = safeTop + 30 + 7 - chargeBarHeight;
    const maxCharge = Math.max(1, chargeMax || 6);

    drawSoftPanel(ctx, chargeBarX - 10, chargeBarY - 10, chargeBarWidth + 20, 34, 14, theme.hudPanel, theme.hudStroke);
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(chargeBarX, chargeBarY, chargeBarWidth, chargeBarHeight);

    if (chargeFull) {
      ctx.fillStyle = theme.accent;
      ctx.shadowColor = 'rgba(0,0,0,0.10)';
      ctx.shadowBlur = 4;
    } else {
      ctx.fillStyle = theme.accentSoft;
      ctx.shadowColor = 'rgba(0,0,0,0.10)';
      ctx.shadowBlur = 4;
    }
    const fillWidth = (chargeCount / maxCharge) * chargeBarWidth;
    ctx.fillRect(chargeBarX, chargeBarY, fillWidth, chargeBarHeight);

    ctx.shadowBlur = 0;
    ctx.fillStyle = chargeFull ? theme.hudAccent : theme.hudSubtle;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(
      chargeFull ? getText('CHARGE_FULL') : getText('CHARGE_LABEL', chargeCount, maxCharge),
      W - 15, chargeBarY + chargeBarHeight + 18
    );
  }

  if (typeof game.getDisplayedRunCoins === 'function') {
    const coins = game.getDisplayedRunCoins();
    stats.push({
      label: '金币',
      value: String(coins),
      color: theme.cardMeta
    });
  }

  drawLeftHudPanel(ctx, game, safeTop, stats, theme);
  ctx.shadowBlur = 0;
  drawDebugBadge(ctx, game, safeTop);
  drawGoalPanel(ctx, game, safeTop);
  drawBuffChips(ctx, game, safeTop);
  drawPickupChips(ctx, game, safeTop);
  drawThemePill(ctx, game, safeTop);
  drawBanner(ctx, game);

  if (game.runDirector && game.runDirector.isBuffOfferOpen()) {
    drawBuffOfferOverlay(ctx, game);
  }

}

function drawLeftHudPanel(ctx, game, safeTop, stats, theme) {
  if (!stats || stats.length === 0) return;

  const x = 12;
  const y = Math.max(12, safeTop - 10);
  const w = 132;
  const h = 18 + stats.length * 38;

  ctx.save();
  drawSoftPanel(ctx, x, y, w, h, 18, theme.hudPanel, theme.hudStroke);

  ctx.strokeStyle = theme.hudStroke;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 42, y + 12);
  ctx.lineTo(x + 42, y + h - 12);
  ctx.stroke();

  for (let i = 0; i < stats.length; i++) {
    const item = stats[i];
    const rowY = y + 12 + i * 38;
    ctx.fillStyle = withAlpha(item.color || '#ffffff', 0.14);
    roundRect(ctx, x + 10, rowY, 22, 22, 11);
    ctx.fill();

    ctx.fillStyle = item.color || '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((item.label || '?').slice(0, 1), x + 21, rowY + 15);

    ctx.fillStyle = theme.hudSubtle;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(item.label, x + 50, rowY + 9);

    ctx.fillStyle = theme.hudText;
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(item.value, x + 50, rowY + 24);
  }

  ctx.restore();
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
  const theme = uiTheme.getThemeFromGame(game);
  const challengeGoal = game.gameMode && typeof game.gameMode.getChallengeGoal === 'function'
    ? game.gameMode.getChallengeGoal()
    : null;
  const goal = challengeGoal || (game.runDirector ? game.runDirector.getCurrentGoal() : null);
  if (!goal) return;

  const x = 14;
  const w = 158;
  const h = 56;
  const y = getBottomHudBaseY(game) - h;
  const accent = challengeGoal && game.gameMode && game.gameMode.selectedLandmark
    ? (game.gameMode.selectedLandmark.theme.accentColor || '#ffb680')
    : theme.accent;
  const rewardLabel = challengeGoal
    ? '赛区目标'
    : '奖励 +' + goal.rewardCoins;

  ctx.save();
  drawSoftPanel(ctx, x, y, w, h, 12, theme.hudPanel, theme.hudStroke);
  ctx.fillStyle = accent;
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(goal.title, x + 12, y + 20);
  ctx.fillStyle = theme.hudSubtle;
  ctx.font = '12px sans-serif';
  ctx.fillText(goal.desc + ' ' + goal.progress + '/' + goal.target, x + 12, y + 38);
  ctx.fillStyle = challengeGoal ? theme.hudAccent : theme.cardMeta;
  ctx.fillText(rewardLabel, x + 12, y + 52);
  ctx.restore();
}

function drawBuffChips(ctx, game, safeTop) {
  if (!game.runDirector) return;
  const theme = uiTheme.getThemeFromGame(game);
  const buffs = game.runDirector.getActiveBuffs();
  if (!buffs || buffs.length === 0) return;

  let x = game.W - 106;
  let y = getBottomHudBaseY(game) - getBuffStackHeight(buffs.length);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 12px sans-serif';
  for (let i = 0; i < buffs.length && i < 4; i++) {
    const buff = buffs[i];
    ctx.fillStyle = withAlpha(buff.color, 0.14);
    roundRect(ctx, x, y + i * 26, 92, 20, 10);
    ctx.fill();
    ctx.fillStyle = theme.hudText;
    ctx.fillText(buff.shortName || buff.name, x + 46, y + 14 + i * 26);
  }
  ctx.restore();
}

function drawPickupChips(ctx, game, safeTop) {
  if (!game.runDirector) return;
  const theme = uiTheme.getThemeFromGame(game);
  const entries = game.runDirector.getPickupHudEntries(Date.now());
  if (!entries || entries.length === 0) return;

  const buffs = game.runDirector.getActiveBuffs();
  const buffCount = buffs.length;
  const x = game.W - 118;
  const y = getBottomHudBaseY(game) - getBuffStackHeight(buffCount) - 8 - getPickupStackHeight(entries.length);

  ctx.save();
  ctx.textAlign = 'left';
  ctx.font = 'bold 12px sans-serif';

  for (let i = 0; i < entries.length && i < 4; i++) {
    const entry = entries[i];
    const chipY = y + i * 24;
    ctx.fillStyle = withAlpha(entry.color, entry.negative ? 0.16 : 0.12);
    roundRect(ctx, x, chipY, 104, 18, 9);
    ctx.fill();
    ctx.fillStyle = theme.hudText;
    ctx.fillText((entry.negative ? '负 ' : '正 ') + (entry.shortName || entry.name), x + 8, chipY + 13);
    ctx.textAlign = 'right';
    ctx.fillStyle = theme.hudSubtle;
    ctx.fillText(entry.secondsRemaining + 's', x + 96, chipY + 13);
    ctx.textAlign = 'left';
  }

  ctx.restore();
}

function drawThemePill(ctx, game, safeTop) {
  if (!game.runDirector) return;
  const themePalette = uiTheme.getThemeFromGame(game);
  const theme = game.runDirector.getActiveTheme();
  if (!theme) return;

  const text = theme.eventLabel || (theme.name + ' 空域');
  const w = Math.max(120, text.length * 13);
  const x = (game.W - w) / 2;
  const y = safeTop - 8;
  ctx.save();
  ctx.fillStyle = withAlpha(theme.theme.accentColor || themePalette.accent, 0.16);
  roundRect(ctx, x, y, w, 26, 13);
  ctx.fill();
  ctx.fillStyle = themePalette.hudText;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, x + w / 2, y + 17);
  ctx.restore();
}

function drawBanner(ctx, game) {
  if (!game.runDirector) return;
  const theme = uiTheme.getThemeFromGame(game);
  const banner = game.runDirector.getBanner();
  if (!banner) return;

  const w = Math.min(game.W - 60, 280);
  const x = (game.W - w) / 2;
  const y = 118;
  ctx.save();
  drawSoftPanel(ctx, x, y, w, 34, 14, theme.hudPanel, theme.hudStroke);
  ctx.fillStyle = banner.color || '#ffffff';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(banner.text, x + w / 2, y + 22);
  ctx.restore();
}

function getBottomHudBaseY(game) {
  const hintReserve = 38;
  return game.H - hintReserve;
}

function getBuffStackHeight(buffCount) {
  return Math.min(4, Math.max(0, buffCount)) * 26;
}

function getPickupStackHeight(entryCount) {
  return Math.min(4, Math.max(0, entryCount)) * 24;
}

function drawBuffOfferOverlay(ctx, game) {
  const theme = uiTheme.getThemeFromGame(game);
  const offer = game.runDirector ? game.runDirector.buffOffer : null;
  if (!offer) return;
  const layout = game.runDirector.getOfferLayout();

  ctx.save();
  ctx.fillStyle = 'rgba(3, 6, 14, 0.60)';
  ctx.fillRect(0, 0, game.W, game.H);
  drawSoftPanel(ctx, layout.panelX, layout.panelY, layout.panelW, layout.panelH, 18, theme.panelStrongStops[1][1], theme.panelStroke);
  ctx.fillStyle = theme.cardLabel;
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('三选一增益', layout.panelX + layout.panelW / 2, layout.panelY + 28);
  ctx.fillStyle = theme.cardSubtle;
  ctx.font = '13px sans-serif';
  ctx.fillText('本局生效，立即选择一项', layout.panelX + layout.panelW / 2, layout.panelY + 48);

  for (let i = 0; i < layout.cards.length; i++) {
    const card = layout.cards[i];
    const option = offer.options[i];
    if (!option) continue;
    ctx.fillStyle = withAlpha(option.color, 0.12);
    roundRect(ctx, card.x, card.y, card.w, card.h, 14);
    ctx.fill();
    ctx.strokeStyle = withAlpha(option.color, 0.9);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = option.color;
    ctx.font = 'bold 17px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(option.name, card.x + 14, card.y + 24);
    ctx.fillStyle = theme.cardSubtle;
    ctx.font = '12px sans-serif';
    ctx.fillText(option.desc, card.x + 14, card.y + 46);
    ctx.fillStyle = theme.cardMeta;
    ctx.fillText('点击领取', card.x + 14, card.y + 70);
  }
  ctx.restore();
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

function drawSoftPanel(ctx, x, y, w, h, radius, fill, stroke) {
  ctx.save();
  ctx.fillStyle = fill;
  roundedRectPath(ctx, x, y, w, h, radius);
  ctx.fill();
  if (stroke) {
    roundedRectPath(ctx, x, y, w, h, radius);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

module.exports = {
  drawUI,
  getText
};
