/**
 * 游戏结束界面绘制模块
 */

const { drawGameOverBackground } = require('./background');
const { GAME_MODES } = require('../game/constants');
const {
  font,
  drawSceneBackdrop,
  drawGlassPanel,
  drawBadge,
  drawMetricCard,
  drawActionButton
} = require('./menuTheme');
const worldview = require('../worldview/index');

function formatElapsed(ms) {
  const totalSeconds = Math.max(0, Math.floor((ms || 0) / 1000));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return mins + '分' + secs.toString().padStart(2, '0') + '秒';
}

function wrapText(ctx, text, maxWidth) {
  const result = [];
  if (!text) return result;

  let line = '';
  for (let i = 0; i < text.length; i++) {
    const next = line + text[i];
    if (ctx.measureText(next).width > maxWidth && line) {
      result.push(line);
      line = text[i];
    } else {
      line = next;
    }
  }

  if (line) {
    result.push(line);
  }
  return result;
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const lines = wrapText(ctx, text, maxWidth);
  const visible = typeof maxLines === 'number' ? lines.slice(0, maxLines) : lines;
  for (let i = 0; i < visible.length; i++) {
    let line = visible[i];
    if (typeof maxLines === 'number' && i === maxLines - 1 && lines.length > maxLines) {
      while (line.length > 1 && ctx.measureText(line + '…').width > maxWidth) {
        line = line.slice(0, -1);
      }
      line += '…';
    }
    ctx.fillText(line, x, y + i * lineHeight);
  }
}

function getResultMeta(game) {
  if (game && typeof game.isDebugRun === 'function' && game.isDebugRun()) {
    return {
      title: 'Debug 结束',
      accent: '#ffd37b',
      modeLabel: 'Debug Run',
      summaryText: '本局高度 ' + (game.score || 0) + ' m',
      sideLabel: '结算',
      sideValue: '不计入'
    };
  }

  const score = game.score || 0;
  const gameMode = game.gameMode;

  if (gameMode.gameMode === GAME_MODES.TIME_ATTACK) {
    return {
      title: '时间到',
      accent: '#7ce7ff',
      modeLabel: '竞速模式',
      summaryText: '本局高度 ' + score + ' m',
      sideLabel: '用时',
      sideValue: formatElapsed(game.finalElapsedTime || 0)
    };
  }

  if (gameMode.gameMode === GAME_MODES.CHALLENGE && gameMode.selectedLandmark) {
    const target = gameMode.selectedLandmark.targetHeight;
    const achieved = score >= target;
    return {
      title: achieved ? '挑战成功' : '目标未完成',
      accent: achieved ? '#7cf3c8' : '#ffba7c',
      modeLabel: '闯关模式',
      summaryText: gameMode.selectedLandmark.name + ' ' + score + ' / ' + target + ' m',
      sideLabel: '目标',
      sideValue: String(target) + ' m'
    };
  }

  return {
    title: '挑战结束',
    accent: '#7cf3c8',
    modeLabel: '无尽模式',
    summaryText: '本局高度 ' + score + ' m',
    sideLabel: '模式',
    sideValue: '持续冲层'
  };
}

function getFinalMessage(game) {
  const score = game.score || 0;
  const playerName = game.playerName || '玩家';
  const playerJob = game.playerJob || '选手';

  if (score < 50) {
    return playerName + '说：这才刚热身，下一把直接进入状态。';
  }
  if (score < 200) {
    return '节奏已经起来了，' + playerJob + '的爆发力开始显现。';
  }
  if (score < 500) {
    return playerName + '的弹跳已经很稳，再往上就是纪录线。';
  }
  if (score < 1000) {
    return '这一局已经打出统治力，继续冲就是新的高度。';
  }
  if (score < 2000) {
    return '高空区表现很强，' + playerJob + '的节奏完全拉满。';
  }
  return '这一把已经接近传说级表现，继续冲榜。';
}

function getRewardItems(reward) {
  if (!reward) return [];

  const items = [
    { label: '基础', value: reward.baseCoins },
    { label: '高度', value: reward.heightCoins },
    { label: '连跳', value: reward.comboCoins }
  ];

  if (reward.challengeBonus > 0) {
    items.push({ label: '闯关', value: reward.challengeBonus });
  }
  if (reward.pickupCoins > 0) {
    items.push({ label: '拾取', value: reward.pickupCoins });
  }
  if (reward.bossCoins > 0) {
    items.push({ label: 'Boss', value: reward.bossCoins });
  }
  if (reward.eventCoins > 0) {
    items.push({ label: '事件', value: reward.eventCoins });
  }

  if (reward.modeMultiplier && reward.modeMultiplier > 1) {
    items.push({ label: '倍率', value: 'x' + reward.modeMultiplier.toFixed(1) });
  }

  return items;
}

function getGameOverButtonLayout(game) {
  const W = game.W;
  const H = game.H;
  const panelW = Math.min(W - 28, 408);
  const panelH = Math.min(H - 56, 574);
  const panelX = (W - panelW) / 2;
  const panelY = Math.max(28, (H - panelH) / 2);
  const contentX = panelX + 18;
  const contentW = panelW - 36;
  const gap = 8;
  const btnW = Math.floor((contentW - gap * 2) / 3);
  const btnH = 48;
  const btnY = panelY + panelH - btnH - 18;

  return {
    panelX: panelX,
    panelY: panelY,
    panelW: panelW,
    panelH: panelH,
    contentX: contentX,
    contentW: contentW,
    actionY: btnY,
    restartX: contentX,
    restartY: btnY,
    restartW: btnW,
    restartH: btnH,
    shareX: contentX + btnW + gap,
    shareY: btnY,
    shareW: btnW,
    shareH: btnH,
    homeX: contentX + (btnW + gap) * 2,
    homeY: btnY,
    homeW: btnW,
    homeH: btnH
  };
}

function drawRewardChip(ctx, x, y, w, h, label, value) {
  drawGlassPanel(ctx, x, y, w, h, {
    radius: 16,
    shadowBlur: 8,
    glow: 'rgba(124, 231, 255, 0.06)',
    stroke: 'rgba(255, 255, 255, 0.08)',
    stops: [
      [0, 'rgba(20, 31, 50, 0.78)'],
      [1, 'rgba(11, 18, 31, 0.8)']
    ]
  });

  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(199, 214, 235, 0.68)';
  ctx.font = font(10, '600');
  ctx.fillText(label, x + 12, y + 8);

  ctx.fillStyle = '#ffffff';
  ctx.font = font(13, '700');
  ctx.fillText(String(value), x + 12, y + 24);
  ctx.restore();
}

/**
 * 绘制游戏结束界面
 * @param {CanvasRenderingContext2D} ctx - canvas上下文
 * @param {Object} game - 游戏实例
 * @param {Object} images - 图片资源
 */
function drawGameOverScreen(ctx, game, images) {
  const { W, H, score } = game;
  const registry = game.uiRegistry;
  const narrative = worldview.getResultNarrative(game);
  const meta = narrative.meta || getResultMeta(game);
  const reward = game.runRewardSummary;
  const layout = getGameOverButtonLayout(game);
  const message = narrative.message || getFinalMessage(game);
  const rewardItems = getRewardItems(reward);

  drawGameOverBackground(ctx, W, H, game.cameraY, score, game.bgStars, images);
  drawSceneBackdrop(ctx, W, H);

  drawGlassPanel(ctx, layout.panelX, layout.panelY, layout.panelW, layout.panelH, {
    radius: 34,
    innerStroke: 'rgba(255, 255, 255, 0.06)',
    shadowBlur: 24,
    glow: 'rgba(112, 196, 255, 0.14)',
    stroke: 'rgba(212, 231, 255, 0.16)',
    stops: [
      [0, 'rgba(21, 34, 56, 0.94)'],
      [1, 'rgba(9, 15, 27, 0.94)']
    ]
  });

  drawBadge(ctx, layout.contentX, layout.panelY + 18, 'RUN SUMMARY', {
    dotColor: meta.accent,
    color: '#f5fbff'
  });
  drawBadge(ctx, layout.panelX + layout.panelW - 122, layout.panelY + 18, meta.modeLabel, {
    width: 102,
    color: meta.accent,
    glow: 'rgba(124, 231, 255, 0.12)',
    stroke: 'rgba(124, 231, 255, 0.18)'
  });

  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#ffffff';
  ctx.font = font(32, '700');
  ctx.fillText(meta.title, layout.contentX, layout.panelY + 60);

  ctx.fillStyle = meta.accent;
  ctx.font = font(16, '700');
  ctx.fillText(meta.summaryText, layout.contentX, layout.panelY + 104);
  ctx.restore();

  const metricY = layout.panelY + 134;
  const metricGap = 10;
  const metricW = (layout.contentW - metricGap * 2) / 3;
  drawMetricCard(ctx, layout.contentX, metricY, metricW, 62, '最终高度', String(score) + ' m', {
    valueColor: '#ffffff',
    valueFont: font(18, '700')
  });
  drawMetricCard(ctx, layout.contentX + metricW + metricGap, metricY, metricW, 62, '最高连跳', String(game.maxCombo || 0), {
    valueColor: '#ffd88a',
    valueFont: font(18, '700')
  });
  drawMetricCard(ctx, layout.contentX + (metricW + metricGap) * 2, metricY, metricW, 62, meta.sideLabel, meta.sideValue, {
    valueColor: meta.accent,
    valueFont: font(15, '700')
  });

  const messageY = metricY + 76;
  const messageH = 76;
  drawGlassPanel(ctx, layout.contentX, messageY, layout.contentW, messageH, {
    radius: 22,
    shadowBlur: 10,
    glow: 'rgba(124, 231, 255, 0.08)',
    stroke: 'rgba(255, 255, 255, 0.1)',
    stops: [
      [0, 'rgba(19, 30, 48, 0.82)'],
      [1, 'rgba(10, 17, 29, 0.84)']
    ]
  });

  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(199, 214, 235, 0.68)';
  ctx.font = font(11, '600');
  ctx.fillText('赛事点评', layout.contentX + 16, messageY + 12);

  ctx.fillStyle = '#ffffff';
  ctx.font = font(14, '600');
  drawWrappedText(ctx, message, layout.contentX + 16, messageY + 32, layout.contentW - 32, 20, 2);
  ctx.restore();

  const rewardY = messageY + messageH + 14;
  const rewardH = layout.actionY - rewardY - 14;
  drawGlassPanel(ctx, layout.contentX, rewardY, layout.contentW, rewardH, {
    radius: 24,
    shadowBlur: 12,
    glow: reward ? 'rgba(255, 209, 102, 0.12)' : 'rgba(124, 231, 255, 0.06)',
    stroke: 'rgba(255, 255, 255, 0.1)',
    stops: reward ? [
      [0, 'rgba(49, 39, 18, 0.82)'],
      [1, 'rgba(23, 18, 9, 0.84)']
    ] : [
      [0, 'rgba(19, 30, 48, 0.82)'],
      [1, 'rgba(10, 17, 29, 0.84)']
    ]
  });

  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = reward ? '#ffe4a3' : 'rgba(199, 214, 235, 0.68)';
  ctx.font = font(12, '700');
  ctx.fillText(reward ? '本局奖励' : '等待结算', layout.contentX + 16, rewardY + 14);

  if (reward) {
    ctx.fillStyle = '#ffffff';
    ctx.font = font(28, '700');
    ctx.fillText('+' + reward.totalCoins, layout.contentX + 16, rewardY + 34);

    ctx.fillStyle = '#ffd166';
    ctx.font = font(12, '600');
    ctx.fillText('当前金币 ' + reward.balance, layout.contentX + 16, rewardY + 68);

    const chipsY = rewardY + 94;
    const chipGap = 8;
    const chipCols = 2;
    const chipW = (layout.contentW - 32 - chipGap) / chipCols;
    const chipH = 42;
    const availableRows = Math.max(1, Math.floor((rewardH - 108) / (chipH + chipGap)) + 1);
    const visibleItems = rewardItems.slice(0, availableRows * chipCols);
    for (let i = 0; i < visibleItems.length; i++) {
      const row = Math.floor(i / chipCols);
      const col = i % chipCols;
      drawRewardChip(
        ctx,
        layout.contentX + 16 + col * (chipW + chipGap),
        chipsY + row * (chipH + chipGap),
        chipW,
        chipH,
        visibleItems[i].label,
        visibleItems[i].value
      );
    }
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.font = font(17, '700');
    ctx.fillText(game.isDebugRun && game.isDebugRun() ? 'Debug 局不结算奖励' : '结算信息准备中', layout.contentX + 16, rewardY + 38);
    ctx.fillStyle = 'rgba(199, 214, 235, 0.68)';
    ctx.font = font(12, '500');
    ctx.fillText(game.isDebugRun && game.isDebugRun()
      ? '不会写入金币、纪录、任务或排行榜。'
      : '可以直接重新开始，或回到主页调整配置。', layout.contentX + 16, rewardY + 68);
  }
  ctx.restore();

  drawActionButton(ctx, layout.restartX, layout.restartY, layout.restartW, layout.restartH, '再来一局', {
    font: font(15, '700'),
    textColor: '#03121f',
    shadowColor: 'rgba(66, 214, 242, 0.24)'
  });
  drawActionButton(ctx, layout.shareX, layout.shareY, layout.shareW, layout.shareH, '转发', {
    font: font(15, '700'),
    textColor: '#ffffff',
    shadowColor: 'rgba(255, 145, 120, 0.22)',
    stops: [
      [0, '#ff9a71'],
      [0.55, '#ff7d8a'],
      [1, '#d85dff']
    ]
  });
  drawActionButton(ctx, layout.homeX, layout.homeY, layout.homeW, layout.homeH, '返回主页', {
    font: font(15, '700'),
    textColor: '#ffffff',
    shadowColor: 'rgba(74, 144, 255, 0.2)',
    stops: [
      [0, '#7ab8ff'],
      [0.55, '#4f8fff'],
      [1, '#3158e8']
    ]
  });

  registry.register('gameover.panel', {
    x: layout.panelX,
    y: layout.panelY,
    w: layout.panelW,
    h: layout.panelH
  }, {
    consume: true
  });
  registry.register('gameover.restart', {
    x: layout.restartX,
    y: layout.restartY,
    w: layout.restartW,
    h: layout.restartH
  }, {
    action: { type: 'game-restart' }
  });
  registry.register('gameover.share', {
    x: layout.shareX,
    y: layout.shareY,
    w: layout.shareW,
    h: layout.shareH
  }, {
    action: { type: 'game-share' }
  });
  registry.register('gameover.home', {
    x: layout.homeX,
    y: layout.homeY,
    w: layout.homeW,
    h: layout.homeH
  }, {
    action: { type: 'game-home' }
  });
}

module.exports = {
  drawGameOverScreen,
  getGameOverButtonLayout
};
