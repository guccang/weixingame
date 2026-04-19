/**
 * 排行榜面板绘制
 */

const {
  font,
  drawGlassPanel,
  drawBadge,
  drawMetricCard,
  drawModalScrim,
  drawCloseButton
} = require('./menuTheme');

const avatarCache = {};
const avatarCacheOrder = [];
const MAX_AVATAR_CACHE = 64;

function touchAvatarCache(url) {
  const index = avatarCacheOrder.indexOf(url);
  if (index !== -1) {
    avatarCacheOrder.splice(index, 1);
  }
  avatarCacheOrder.push(url);

  while (avatarCacheOrder.length > MAX_AVATAR_CACHE) {
    const evicted = avatarCacheOrder.shift();
    if (evicted) {
      delete avatarCache[evicted];
    }
  }
}

function fitText(ctx, text, maxWidth) {
  const source = text || '';
  if (ctx.measureText(source).width <= maxWidth) {
    return source;
  }

  let next = source;
  while (next.length > 1 && ctx.measureText(next + '…').width > maxWidth) {
    next = next.slice(0, -1);
  }
  return next + '…';
}

function getAvatarImage(url) {
  if (!url || typeof wx === 'undefined' || typeof wx.createImage !== 'function') {
    return null;
  }

  if (!avatarCache[url]) {
    const img = wx.createImage();
    avatarCache[url] = {
      img: img,
      loaded: false,
      failed: false
    };

    img.onload = function() {
      avatarCache[url].loaded = true;
    };
    img.onerror = function() {
      avatarCache[url].failed = true;
    };
    img.src = url;
  }

  touchAvatarCache(url);

  const cached = avatarCache[url];
  return cached.loaded && !cached.failed ? cached.img : null;
}

function getRankTone(index) {
  if (index === 0) {
    return {
      accent: '#ffd166',
      glow: 'rgba(255, 209, 102, 0.16)'
    };
  }
  if (index === 1) {
    return {
      accent: '#c7d2e6',
      glow: 'rgba(199, 210, 230, 0.14)'
    };
  }
  if (index === 2) {
    return {
      accent: '#ffb480',
      glow: 'rgba(255, 180, 128, 0.14)'
    };
  }
  return {
    accent: '#7ce7ff',
    glow: 'rgba(124, 231, 255, 0.08)'
  };
}

function drawRankAvatar(ctx, x, y, size, item, accent) {
  const avatar = getAvatarImage(item.avatarUrl);

  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();

  if (avatar && avatar.width > 0) {
    ctx.drawImage(avatar, x, y, size, size);
  } else {
    ctx.fillStyle = accent;
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#07131d';
    ctx.font = font(14, '700');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((item.nickname || '匿').slice(0, 1), x + size / 2, y + size / 2 + 1);
  }
  ctx.restore();
}

function drawSelfProfileCard(ctx, x, y, w, h, game) {
  const wxUserInfo = game.wxUserInfo || {};
  const localBest = (((game.progression || {}).achievementStats || {}).highestScore) || 0;
  const liveScore = Math.max(0, Math.floor(game.score || 0));
  const bestScore = Math.max(localBest, liveScore);
  const item = {
    nickname: wxUserInfo.nickName || game.playerName || '匿名用户',
    avatarUrl: wxUserInfo.avatarUrl || ''
  };

  drawGlassPanel(ctx, x, y, w, h, {
    radius: 22,
    shadowBlur: 12,
    glow: 'rgba(124, 231, 255, 0.12)',
    stroke: 'rgba(124, 231, 255, 0.18)',
    stops: [
      [0, 'rgba(21, 34, 52, 0.9)'],
      [1, 'rgba(10, 18, 30, 0.9)']
    ]
  });

  drawRankAvatar(ctx, x + 14, y + 14, 42, item, '#7ce7ff');

  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#ffffff';
  ctx.font = font(16, '700');
  ctx.fillText(fitText(ctx, item.nickname, w - 156), x + 68, y + 14);

  ctx.fillStyle = 'rgba(199, 214, 235, 0.72)';
  ctx.font = font(11, '500');
  ctx.fillText('我的微信信息', x + 68, y + 38);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#7ce7ff';
  ctx.font = font(20, '700');
  ctx.fillText(String(bestScore) + ' m', x + w - 14, y + 18);

  ctx.fillStyle = 'rgba(199, 214, 235, 0.72)';
  ctx.font = font(11, '500');
  ctx.fillText('我的积分', x + w - 14, y + 42);
  ctx.restore();
}

/**
 * 绘制排行榜面板
 */
function drawLeaderboardPanel(ctx, game, W, H) {
  const registry = game.uiRegistry;
  const rankList = game.rankList || [];
  const isLoading = game.rankLoading;
  const bestScore = rankList.length > 0 ? rankList[0].score || 0 : 0;
  const localBest = (((game.progression || {}).achievementStats || {}).highestScore) || 0;

  const panelW = Math.min(W - 24, 406);
  const panelH = Math.min(H - 70, 566);
  const panelX = (W - panelW) / 2;
  const panelY = Math.max(36, (H - panelH) / 2);
  const contentX = panelX + 16;
  const contentW = panelW - 32;

  drawModalScrim(ctx, W, H);
  drawGlassPanel(ctx, panelX, panelY, panelW, panelH, {
    radius: 30,
    innerStroke: 'rgba(255, 255, 255, 0.06)',
    shadowBlur: 22,
    glow: 'rgba(124, 231, 255, 0.12)',
    stroke: 'rgba(207, 230, 255, 0.18)',
    stops: [
      [0, 'rgba(24, 29, 47, 0.94)'],
      [1, 'rgba(10, 14, 25, 0.94)']
    ]
  });

  drawBadge(ctx, contentX, panelY + 18, 'LEADERBOARD', {
    dotColor: '#7ce7ff',
    color: '#f5fbff'
  });

  const closeSize = 30;
  const closeX = panelX + panelW - closeSize - 16;
  const closeY = panelY + 18;
  drawCloseButton(ctx, closeX, closeY, closeSize);
  registry.register('start.leaderboard.panel', { x: panelX, y: panelY, w: panelW, h: panelH }, {
    consume: true
  });
  registry.register('start.leaderboard.close', { x: closeX, y: closeY, w: closeSize, h: closeSize }, {
    action: { type: 'close-panel', panel: 'showLeaderboardPanel' }
  });

  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#ffffff';
  ctx.font = font(28, '700');
  ctx.fillText('好友排行榜', contentX, panelY + 62);

  ctx.fillStyle = 'rgba(214, 227, 245, 0.72)';
  ctx.font = font(13, '500');
  ctx.fillText('查看当前云端成绩，继续冲更高纪录。', contentX, panelY + 98);
  ctx.restore();

  const profileY = panelY + 128;
  drawSelfProfileCard(ctx, contentX, profileY, contentW, 70, game);

  const metricY = profileY + 82;
  const metricGap = 10;
  const metricW = (contentW - metricGap * 2) / 3;
  drawMetricCard(ctx, contentX, metricY, metricW, 60, '上榜人数', String(rankList.length), {
    valueColor: '#ffffff',
    valueFont: font(18, '700')
  });
  drawMetricCard(ctx, contentX + metricW + metricGap, metricY, metricW, 60, '榜首高度', String(bestScore) + ' m', {
    valueColor: '#ffd88a',
    valueFont: font(18, '700')
  });
  drawMetricCard(ctx, contentX + (metricW + metricGap) * 2, metricY, metricW, 60, '我的最好', String(localBest) + ' m', {
    valueColor: '#7ce7ff',
    valueFont: font(18, '700')
  });

  const listY = metricY + 76;
  const rowH = 60;
  const rowGap = 8;
  const footerSpace = 18;
  const maxShow = Math.max(1, Math.floor((panelY + panelH - footerSpace - listY) / (rowH + rowGap)));

  if (isLoading) {
    drawGlassPanel(ctx, contentX, listY, contentW, 112, {
      radius: 22,
      shadowBlur: 10,
      glow: 'rgba(124, 231, 255, 0.08)',
      stroke: 'rgba(255, 255, 255, 0.1)',
      stops: [
        [0, 'rgba(18, 28, 44, 0.84)'],
        [1, 'rgba(10, 17, 28, 0.84)']
      ]
    });

    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = font(18, '700');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('加载中...', W / 2, listY + 48);

    ctx.fillStyle = 'rgba(214, 227, 245, 0.68)';
    ctx.font = font(12, '500');
    ctx.fillText('正在同步好友成绩', W / 2, listY + 76);
    ctx.restore();
    return;
  }

  if (rankList.length === 0) {
    drawGlassPanel(ctx, contentX, listY, contentW, 112, {
      radius: 22,
      shadowBlur: 10,
      glow: 'rgba(124, 231, 255, 0.08)',
      stroke: 'rgba(255, 255, 255, 0.1)',
      stops: [
        [0, 'rgba(18, 28, 44, 0.84)'],
        [1, 'rgba(10, 17, 28, 0.84)']
      ]
    });

    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = font(18, '700');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('暂无排行数据', W / 2, listY + 48);

    ctx.fillStyle = 'rgba(214, 227, 245, 0.68)';
    ctx.font = font(12, '500');
    ctx.fillText('完成一局后即可上传成绩', W / 2, listY + 76);
    ctx.restore();
    return;
  }

  const showCount = Math.min(rankList.length, maxShow);
  for (let i = 0; i < showCount; i++) {
    const item = rankList[i];
    const y = listY + i * (rowH + rowGap);
    const tone = getRankTone(i);
    const rankText = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : String(i + 1);

    const isSelf = !!item.isSelf;

    drawGlassPanel(ctx, contentX, y, contentW, rowH, {
      radius: 20,
      shadowBlur: 10,
      glow: isSelf ? 'rgba(124, 231, 255, 0.14)' : tone.glow,
      stroke: isSelf
        ? 'rgba(124, 231, 255, 0.24)'
        : (i < 3 ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.1)'),
      stops: isSelf ? [
        [0, 'rgba(17, 42, 58, 0.9)'],
        [1, 'rgba(8, 24, 36, 0.88)']
      ] : (i < 3 ? [
        [0, 'rgba(36, 38, 50, 0.9)'],
        [1, 'rgba(17, 18, 27, 0.88)']
      ] : [
        [0, 'rgba(18, 28, 44, 0.84)'],
        [1, 'rgba(10, 17, 28, 0.84)']
      ])
    });

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = tone.accent;
    ctx.font = font(18, '700');
    ctx.fillText(rankText, contentX + 22, y + rowH / 2 + 1);
    ctx.restore();

    drawRankAvatar(ctx, contentX + 42, y + 12, 36, item, tone.accent);

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffffff';
    ctx.font = font(15, '700');
    ctx.fillText(fitText(ctx, item.nickname || '匿名用户', contentW - 170), contentX + 90, y + 14);

    ctx.fillStyle = 'rgba(199, 214, 235, 0.68)';
    ctx.font = font(11, '500');
    ctx.fillText(isSelf ? '我自己' : '好友成绩', contentX + 90, y + 36);

    ctx.textAlign = 'right';
    ctx.fillStyle = tone.accent;
    ctx.font = font(18, '700');
    ctx.fillText(String(item.score || 0) + ' m', contentX + contentW - 16, y + 18);
    ctx.restore();
  }

  if (rankList.length > showCount) {
    ctx.save();
    ctx.fillStyle = 'rgba(214, 227, 245, 0.6)';
    ctx.font = font(11, '500');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('还有 ' + (rankList.length - showCount) + ' 位好友未展示', W / 2, listY + showCount * (rowH + rowGap) - 2);
    ctx.restore();
  }
}

module.exports = {
  drawLeaderboardPanel
};
