/**
 * 开始界面绘制模块
 */

const { fillRoundRect, strokeRoundRect } = require('./helper');
const { drawBackground } = require('./background');
const { drawCharacterSelect } = require('./characterSelect');
const { drawModeSelect, drawTimeSelect, drawLandmarkSelect } = require('./modeSelect');
const { drawLeaderboardPanel } = require('./leaderboard');
const { GAME_MODES } = require('../game/constants');
const progressionSystem = require('../progression/progression');
const {
  font,
  createGradient,
  drawSceneBackdrop,
  drawGlassPanel,
  drawBadge,
  drawMetricCard,
  drawActionButton,
  drawIconTile,
  drawModalScrim,
  drawCloseButton
} = require('./menuTheme');

function formatDuration(ms) {
  const mins = Math.max(1, Math.floor((ms || 0) / 60000));
  return mins + ' 分钟';
}

function fitText(ctx, text, maxWidth) {
  if (!text) return '';
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }

  let next = text;
  while (next.length > 1 && ctx.measureText(next + '…').width > maxWidth) {
    next = next.slice(0, -1);
  }
  return next + '…';
}

function getAchievementCount(progress) {
  return Object.keys((progress && progress.achievements) || {}).length;
}

function getModeMeta(game) {
  const mode = game.gameMode.gameMode;
  if (mode === GAME_MODES.TIME_ATTACK) {
    return {
      label: '竞速模式',
      detail: formatDuration(game.gameMode.selectedTimeLimit),
      accent: '#7ce7ff'
    };
  }

  if (mode === GAME_MODES.CHALLENGE) {
    return {
      label: '闯关模式',
      detail: game.gameMode.selectedLandmark ? game.gameMode.selectedLandmark.name : '选择地标',
      accent: '#ffba7c'
    };
  }

  return {
    label: '无尽模式',
    detail: '持续冲层',
    accent: '#7cf3c8'
  };
}

function drawHeroSection(ctx, game, progress, W, H) {
  const modeMeta = getModeMeta(game);
  const stats = progress.achievementStats || {};
  const heroW = Math.min(W - 28, 404);
  const heroH = Math.min(236, Math.max(216, H * 0.29));
  const heroX = (W - heroW) / 2;
  const heroY = Math.max(78, H * 0.1);

  drawGlassPanel(ctx, heroX, heroY, heroW, heroH, {
    radius: 34,
    innerStroke: 'rgba(255, 255, 255, 0.06)',
    shadowBlur: 24,
    glow: 'rgba(96, 188, 255, 0.18)',
    stroke: 'rgba(184, 226, 255, 0.22)',
    stops: [
      [0, 'rgba(19, 36, 62, 0.9)'],
      [0.55, 'rgba(12, 24, 44, 0.92)'],
      [1, 'rgba(8, 16, 31, 0.94)']
    ]
  });

  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  fillRoundRect(ctx, heroX + 18, heroY + 76, heroW - 36, 1, 1);
  ctx.restore();

  drawBadge(ctx, heroX + 20, heroY + 20, 'MODERN ARCADE', {
    dotColor: '#7cf3c8',
    color: '#f5fbff'
  });
  drawBadge(ctx, heroX + heroW - 138, heroY + 20, modeMeta.label, {
    width: 118,
    color: modeMeta.accent,
    glow: 'rgba(124, 231, 255, 0.18)',
    stroke: 'rgba(124, 231, 255, 0.22)'
  });

  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(220, 236, 255, 0.78)';
  ctx.font = font(13, '500');
  ctx.fillText('欢迎回来，' + (game.playerName || '玩家'), heroX + 24, heroY + 60);

  ctx.fillStyle = '#ffffff';
  ctx.font = font(30, '700');
  ctx.fillText('秀彬跳跳', heroX + 24, heroY + 80);

  ctx.fillStyle = '#7ce7ff';
  ctx.font = font(16, '600');
  ctx.fillText('更轻、更快、更有节奏的登塔界面', heroX + 24, heroY + 118);

  ctx.fillStyle = 'rgba(216, 228, 244, 0.78)';
  ctx.font = font(12, '500');
  ctx.fillText('切换角色、强化成长与玩法组合后，直接开跳。', heroX + 24, heroY + 144);
  ctx.restore();

  const metricY = heroY + 162;
  const metricGap = 10;
  const metricW = (heroW - 48 - metricGap * 2) / 3;
  drawMetricCard(ctx, heroX + 24, metricY, metricW, 46, '最高高度', String(stats.highestScore || 0) + ' m', {
    valueFont: font(16, '700'),
    valueColor: '#ffffff'
  });
  drawMetricCard(ctx, heroX + 24 + metricW + metricGap, metricY, metricW, 46, '累计开局', String(stats.totalRuns || 0) + ' 次', {
    valueFont: font(16, '700'),
    valueColor: '#c8f8eb'
  });
  drawMetricCard(ctx, heroX + 24 + (metricW + metricGap) * 2, metricY, metricW, 46, '当前设定', modeMeta.detail, {
    valueFont: font(13, '700'),
    valueColor: modeMeta.accent
  });

  const buttonW = Math.min(heroW - 56, 220);
  const buttonH = 54;
  const btnX = heroX + (heroW - buttonW) / 2;
  const btnY = heroY + heroH + 14;
  drawActionButton(ctx, btnX, btnY, buttonW, buttonH, '开始游戏', {
    font: font(18, '700')
  });

  return {
    buttonArea: {
      x: btnX,
      y: btnY,
      w: buttonW,
      h: buttonH
    },
    contentBottom: btnY + buttonH
  };
}

function drawBottomDock(ctx, game, W, H) {
  const pm = game.panelManager;
  const dockW = Math.min(W - 20, 418);
  const dockH = 100;
  const dockX = (W - dockW) / 2;
  const dockY = H - dockH - 18;
  const icons = [
    { key: 'shop', icon: '强', text: '强化', active: pm.isOpen('showShopPanel'), accent: '#ff9bb6' },
    { key: 'character', icon: '角', text: '角色', active: pm.isOpen('showCharacterPanel'), accent: '#7ce7ff' },
    { key: 'mode', icon: '玩', text: '玩法', active: pm.isOpen('showModeSelect'), accent: '#ffe086' },
    { key: 'achievement', icon: '成', text: '成就', active: pm.isOpen('showAchievementPanel'), accent: '#ffc977' },
    { key: 'leaderboard', icon: '榜', text: '排行', active: pm.isOpen('showLeaderboardPanel'), accent: '#7cf3c8' }
  ];
  const tileGap = 8;
  const tileW = Math.floor((dockW - 28 - tileGap * (icons.length - 1)) / icons.length);
  const tileH = dockH - 24;

  drawGlassPanel(ctx, dockX, dockY, dockW, dockH, {
    radius: 30,
    shadowBlur: 18,
    glow: 'rgba(74, 172, 255, 0.14)',
    stroke: 'rgba(255, 255, 255, 0.14)',
    stops: [
      [0, 'rgba(18, 28, 48, 0.84)'],
      [1, 'rgba(10, 16, 29, 0.88)']
    ]
  });

  game.bottomBtnArea = {};
  for (let i = 0; i < icons.length; i++) {
    const icon = icons[i];
    const x = dockX + 14 + i * (tileW + tileGap);
    const y = dockY + 12;
    game.bottomBtnArea[icon.key] = { x: x, y: y, w: tileW, h: tileH };
    drawIconTile(ctx, x, y, tileW, tileH, icon.icon, icon.text, {
      active: icon.active,
      activeAccent: icon.accent,
      iconColor: icon.accent
    });
  }
}

/**
 * 绘制开始界面
 * @param {CanvasRenderingContext2D} ctx - canvas上下文
 * @param {Object} game - 游戏实例
 * @param {Object} images - 图片资源
 * @param {Object} characterConfig - 角色配置
 * @param {Object} jobConfig - 职业配置
 */
function drawStartScreen(ctx, game, images, characterConfig, jobConfig) {
  const { W, H } = game;
  const progress = game.progression || progressionSystem.getDefaultProgress();
  const hasPanelOpen = game.panelManager.isAnyOpen();

  if (images.bgMain && images.bgMain.width > 0) {
    const scale = Math.max(W / images.bgMain.width, H / images.bgMain.height);
    const imgW = images.bgMain.width * scale;
    const imgH = images.bgMain.height * scale;
    const imgX = (W - imgW) / 2;
    const imgY = (H - imgH) / 2;
    ctx.drawImage(images.bgMain, imgX, imgY, imgW, imgH);
  } else {
    drawBackground(ctx, W, H, game.cameraY, game.score, game.bgStars);
  }

  drawSceneBackdrop(ctx, W, H);
  drawCoinBadge(ctx, game, images);

  if (!hasPanelOpen) {
    const heroLayout = drawHeroSection(ctx, game, progress, W, H);
    game.startBtnArea = heroLayout.buttonArea;
    drawCurrentCharacter(ctx, game, characterConfig, jobConfig, heroLayout.contentBottom + 14);
  } else {
    game.startBtnArea = null;
  }

  drawBottomDock(ctx, game, W, H);

  if (game.showCharacterPanel) {
    drawCharacterSelect(ctx, game, characterConfig);
  } else if (game.showShopPanel) {
    drawShopPanel(ctx, game, images, W, H);
  } else if (game.showAchievementPanel) {
    drawAchievementPanel(ctx, game, W, H);
  } else if (game.gameMode.showModeSelect) {
    drawModeSelect(ctx, game, W, H);
  } else if (game.gameMode.showTimeSelect) {
    drawTimeSelect(ctx, game, W, H);
  } else if (game.gameMode.showLandmarkSelect) {
    drawLandmarkSelect(ctx, game, W, H);
  } else if (game.showLeaderboardPanel) {
    drawLeaderboardPanel(ctx, game, W, H);
  }
}

function drawCoinBadge(ctx, game, images) {
  const balance = game.progression ? game.progression.coins : 0;
  const x = 18;
  const y = 18;

  ctx.save();
  ctx.font = font(18, '700');
  const w = Math.max(128, Math.ceil(ctx.measureText(String(balance)).width + 86));
  const h = 42;

  game.coinBadgeArea = {
    x: x,
    y: y,
    w: w,
    h: h
  };

  drawGlassPanel(ctx, x, y, w, h, {
    radius: 21,
    shadowBlur: 14,
    glow: 'rgba(255, 209, 102, 0.18)',
    stroke: 'rgba(255, 214, 143, 0.24)',
    stops: [
      [0, 'rgba(38, 34, 20, 0.86)'],
      [1, 'rgba(24, 19, 11, 0.8)']
    ]
  });

  if (images.iconCoin && images.iconCoin.width > 0) {
    ctx.drawImage(images.iconCoin, x + 11, y + 10, 20, 20);
  } else {
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(x + 21, y + 21, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(255, 231, 179, 0.72)';
  ctx.font = font(10, '600');
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('COINS', x + 38, y + 9);

  ctx.fillStyle = '#fff3bf';
  ctx.font = font(18, '700');
  ctx.fillText(String(balance), x + 38, y + 19);
  ctx.restore();
}

function getActionPalette(color) {
  if (color === '#d63031' || color === 'rgba(214, 48, 49, 0.9)') {
    return {
      stops: [[0, '#ff8b8b'], [1, '#d83b49']],
      stroke: 'rgba(255, 204, 204, 0.22)',
      shadow: 'rgba(216, 59, 73, 0.18)'
    };
  }

  if (color === '#0984e3') {
    return {
      stops: [[0, '#7ac9ff'], [1, '#2d7fff']],
      stroke: 'rgba(190, 231, 255, 0.22)',
      shadow: 'rgba(45, 127, 255, 0.18)'
    };
  }

  if (color === '#636e72') {
    return {
      stops: [[0, '#7f8b93'], [1, '#5b646b']],
      stroke: 'rgba(255, 255, 255, 0.12)',
      shadow: 'rgba(0, 0, 0, 0.1)'
    };
  }

  return {
    stops: [[0, '#6ef1cb'], [1, '#1cb79e']],
    stroke: 'rgba(216, 255, 244, 0.2)',
    shadow: 'rgba(28, 183, 158, 0.16)'
  };
}

function drawShopPanel(ctx, game, images, W, H) {
  const panelW = Math.min(W - 24, 396);
  const panelH = Math.min(H - 70, 562);
  const panelX = (W - panelW) / 2;
  const panelY = 38;
  const contentX = panelX + 16;
  const contentW = panelW - 32;
  const progress = game.progression || progressionSystem.getDefaultProgress();
  const tabs = progressionSystem.getShopTabs();
  const activeTab = game.shopTab || 'upgrades';
  const entries = progressionSystem.getShopCatalogByTab(progress, activeTab);

  game.shopItemAreas = [];
  game.shopCloseBtnArea = null;
  game.shopTabAreas = [];
  game.shopResetBtnArea = null;

  drawModalScrim(ctx, W, H);
  drawGlassPanel(ctx, panelX, panelY, panelW, panelH, {
    radius: 30,
    innerStroke: 'rgba(255, 255, 255, 0.06)',
    shadowBlur: 22,
    glow: 'rgba(255, 207, 119, 0.1)',
    stroke: 'rgba(255, 228, 178, 0.18)',
    stops: [
      [0, 'rgba(24, 29, 47, 0.94)'],
      [1, 'rgba(10, 14, 25, 0.94)']
    ]
  });

  if (images.bgShop && images.bgShop.width > 0) {
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.drawImage(images.bgShop, panelX + 6, panelY + 6, panelW - 12, panelH - 12);
    ctx.restore();
  }

  drawBadge(ctx, contentX, panelY + 18, 'GROWTH LAB', {
    dotColor: '#ffd166',
    color: '#fff4d8'
  });
  drawBadge(ctx, panelX + panelW - 128, panelY + 18, String(progress.coins) + ' 金币', {
    width: 108,
    color: '#ffd166',
    stroke: 'rgba(255, 209, 102, 0.22)'
  });

  const closeSize = 30;
  const closeX = panelX + panelW - closeSize - 16;
  const closeY = panelY + 58;
  drawCloseButton(ctx, closeX, closeY, closeSize);
  game.shopCloseBtnArea = { x: closeX, y: closeY, w: closeSize, h: closeSize };

  const resetBtnW = 90;
  const resetBtnH = 30;
  const resetBtnX = contentX;
  const resetBtnY = panelY + 58;
  drawShopButton(ctx, resetBtnX, resetBtnY, resetBtnW, resetBtnH, '#d63031', '清空存档');
  game.shopResetBtnArea = { x: resetBtnX, y: resetBtnY, w: resetBtnW, h: resetBtnH };

  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#ffffff';
  ctx.font = font(28, '700');
  ctx.fillText('成长工坊', contentX, panelY + 96);

  ctx.fillStyle = 'rgba(214, 227, 245, 0.72)';
  ctx.font = font(13, '500');
  ctx.fillText('强化、技能、外观和道具都在这里配置。', contentX, panelY + 132);

  const toastVisible = game.shopMessage && Date.now() < game.shopMessageUntil;
  if (toastVisible) {
    ctx.fillStyle = game.shopMessageColor || '#7cf3c8';
    ctx.font = font(12, '600');
    ctx.fillText(game.shopMessage, contentX, panelY + 154);
  }
  ctx.restore();

  const tabY = panelY + 180;
  const tabGap = 8;
  const tabCols = 3;
  const tabW = Math.floor((contentW - tabGap * (tabCols - 1)) / tabCols);
  const tabH = 34;
  for (let index = 0; index < tabs.length; index++) {
    const tab = tabs[index];
    const row = Math.floor(index / tabCols);
    const col = index % tabCols;
    const x = contentX + col * (tabW + tabGap);
    const y = tabY + row * (tabH + tabGap);
    const isActive = tab.id === activeTab;

    drawGlassPanel(ctx, x, y, tabW, tabH, {
      radius: 17,
      shadowBlur: isActive ? 14 : 8,
      glow: isActive ? 'rgba(255, 209, 102, 0.16)' : 'rgba(0, 0, 0, 0.06)',
      stroke: isActive ? 'rgba(255, 209, 102, 0.28)' : 'rgba(255, 255, 255, 0.1)',
      stops: isActive ? [
        [0, 'rgba(88, 72, 24, 0.94)'],
        [1, 'rgba(50, 40, 12, 0.9)']
      ] : [
        [0, 'rgba(20, 29, 46, 0.8)'],
        [1, 'rgba(13, 19, 33, 0.82)']
      ]
    });

    ctx.save();
    ctx.fillStyle = isActive ? '#ffe4a3' : 'rgba(227, 236, 249, 0.82)';
    ctx.font = font(12, '600');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tab.name, x + tabW / 2, y + tabH / 2 + 1);
    ctx.restore();

    game.shopTabAreas.push({
      tabId: tab.id,
      x: x,
      y: y,
      w: tabW,
      h: tabH
    });
  }

  const listStartY = tabY + Math.ceil(tabs.length / tabCols) * (tabH + tabGap) + 10;
  const cardH = activeTab === 'trails' ? 78 : 74;
  const cardGap = 10;
  const maxCards = Math.min(entries.length, Math.floor((panelY + panelH - 20 - listStartY) / (cardH + cardGap)));

  for (let i = 0; i < maxCards; i++) {
    const entry = entries[i];
    const meta = getShopEntryMeta(entry);
    const y = listStartY + i * (cardH + cardGap);
    const buttonH = 30;
    const buttonGap = 8;
    const secondaryW = 66;
    const primaryW = meta.secondary ? 66 : 82;
    const secondaryX = panelX + panelW - secondaryW - 16;
    const primaryX = meta.secondary ? (secondaryX - primaryW - buttonGap) : (panelX + panelW - primaryW - 16);
    const buttonY = y + cardH - buttonH - 12;
    const textMaxW = primaryX - contentX - 36;

    drawGlassPanel(ctx, contentX, y, contentW, cardH, {
      radius: 20,
      shadowBlur: 10,
      glow: 'rgba(102, 170, 255, 0.08)',
      stroke: 'rgba(255, 255, 255, 0.1)',
      stops: [
        [0, 'rgba(18, 28, 44, 0.82)'],
        [1, 'rgba(10, 17, 28, 0.84)']
      ]
    });

    ctx.save();
    const palette = getActionPalette(meta.primary.color);
    ctx.fillStyle = createGradient(ctx, contentX + 12, y + 14, contentX + 16, y + cardH - 14, palette.stops);
    fillRoundRect(ctx, contentX + 12, y + 14, 4, cardH - 28, 2);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffffff';
    ctx.font = font(14, '700');
    ctx.fillText(fitText(ctx, meta.title, textMaxW), contentX + 24, y + 14);

    ctx.fillStyle = 'rgba(177, 209, 244, 0.78)';
    ctx.font = font(11, '500');
    ctx.fillText(fitText(ctx, meta.desc, textMaxW), contentX + 24, y + 36);

    if (meta.detail) {
      ctx.fillStyle = 'rgba(255, 225, 167, 0.84)';
      ctx.fillText(fitText(ctx, meta.detail, textMaxW), contentX + 24, y + 54);
    }
    ctx.restore();

    drawShopButton(ctx, primaryX, buttonY, primaryW, buttonH, meta.primary.color, meta.primary.label);
    game.shopItemAreas.push({
      action: meta.primary.action,
      itemId: meta.primary.itemId,
      x: primaryX,
      y: buttonY,
      w: primaryW,
      h: buttonH
    });

    if (meta.secondary) {
      drawShopButton(ctx, secondaryX, buttonY, secondaryW, buttonH, meta.secondary.color, meta.secondary.label);
      game.shopItemAreas.push({
        action: meta.secondary.action,
        itemId: meta.secondary.itemId,
        x: secondaryX,
        y: buttonY,
        w: secondaryW,
        h: buttonH
      });
    }
  }
}

function drawShopButton(ctx, x, y, w, h, color, text) {
  const palette = getActionPalette(color);
  ctx.save();
  ctx.shadowColor = palette.shadow;
  ctx.shadowBlur = 10;
  ctx.fillStyle = createGradient(ctx, x, y, x + w, y + h, palette.stops);
  fillRoundRect(ctx, x, y, w, h, 15);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = palette.stroke;
  ctx.lineWidth = 1;
  strokeRoundRect(ctx, x, y, w, h, 15);

  ctx.fillStyle = '#ffffff';
  ctx.font = font(11, '700');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2 + 1);
  ctx.restore();
}

function drawAchievementPanel(ctx, game, W, H) {
  const achievementSystem = require('../achievement/achievementSystem');
  const progress = game.progression || progressionSystem.getDefaultProgress();
  const stats = progress.achievementStats || {};
  const achievements = achievementSystem.getAllAchievements();
  const unlockedCount = getAchievementCount(progress);
  const currentTitle = achievementSystem.getCurrentTitle(progress);

  const panelW = Math.min(W - 24, 404);
  const panelH = Math.min(H - 70, 562);
  const panelX = (W - panelW) / 2;
  const panelY = 38;
  const contentX = panelX + 16;
  const contentW = panelW - 32;

  game.achievementPanelArea = { x: panelX, y: panelY, w: panelW, h: panelH };

  drawModalScrim(ctx, W, H);
  drawGlassPanel(ctx, panelX, panelY, panelW, panelH, {
    radius: 30,
    innerStroke: 'rgba(255, 255, 255, 0.06)',
    shadowBlur: 22,
    glow: 'rgba(255, 203, 110, 0.12)',
    stroke: 'rgba(255, 222, 163, 0.18)',
    stops: [
      [0, 'rgba(24, 29, 47, 0.94)'],
      [1, 'rgba(10, 14, 25, 0.94)']
    ]
  });

  drawBadge(ctx, contentX, panelY + 18, 'ACHIEVEMENTS', {
    dotColor: '#ffd166',
    color: '#fff4d8'
  });

  const closeSize = 30;
  const closeX = panelX + panelW - closeSize - 16;
  const closeY = panelY + 18;
  drawCloseButton(ctx, closeX, closeY, closeSize);
  game.achievementCloseBtnArea = { x: closeX, y: closeY, w: closeSize, h: closeSize };

  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#ffffff';
  ctx.font = font(28, '700');
  ctx.fillText('成就档案', contentX, panelY + 62);

  ctx.fillStyle = currentTitle ? '#ffe7a8' : 'rgba(214, 227, 245, 0.68)';
  ctx.font = font(13, '500');
  ctx.fillText(currentTitle ? ('当前称号: ' + currentTitle.Name) : '继续挑战以解锁第一个称号', contentX, panelY + 98);
  ctx.restore();

  const metricY = panelY + 128;
  const metricGap = 10;
  const metricW = (contentW - metricGap) / 2;
  drawMetricCard(ctx, contentX, metricY, metricW, 62, '已解锁', unlockedCount + ' / ' + achievements.length, {
    valueColor: '#ffffff'
  });
  drawMetricCard(ctx, contentX + metricW + metricGap, metricY, metricW, 62, '最高连跳', String(stats.highestCombo || 0), {
    valueColor: '#ffd88a'
  });

  const startY = metricY + 78;
  const cardH = 62;
  const gap = 8;
  const scrollOffset = game.achievementScrollOffset || 0;
  const visibleCount = Math.floor((panelY + panelH - 18 - startY) / (cardH + gap));
  const maxScroll = Math.max(0, achievements.length - visibleCount);
  game.achievementMaxScroll = maxScroll;

  for (let i = 0; i < achievements.length; i++) {
    if (i < scrollOffset || i >= scrollOffset + visibleCount) continue;
    const ach = achievements[i];
    const unlocked = progress.achievements && progress.achievements[ach.Key];
    const y = startY + (i - scrollOffset) * (cardH + gap);
    const glow = unlocked ? 'rgba(255, 209, 102, 0.16)' : 'rgba(102, 170, 255, 0.06)';

    drawGlassPanel(ctx, contentX, y, contentW, cardH, {
      radius: 20,
      shadowBlur: 10,
      glow: glow,
      stroke: unlocked ? 'rgba(255, 209, 102, 0.18)' : 'rgba(255, 255, 255, 0.09)',
      stops: unlocked ? [
        [0, 'rgba(59, 44, 17, 0.84)'],
        [1, 'rgba(28, 21, 10, 0.84)']
      ] : [
        [0, 'rgba(18, 28, 44, 0.82)'],
        [1, 'rgba(10, 17, 28, 0.84)']
      ]
    });

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = unlocked ? '#ffd166' : 'rgba(255, 255, 255, 0.24)';
    ctx.font = font(18, '700');
    ctx.fillText(unlocked ? '★' : '☆', contentX + 16, y + cardH / 2);

    ctx.textBaseline = 'top';
    ctx.fillStyle = unlocked ? '#fff2c7' : '#e0e8f5';
    ctx.font = font(14, '700');
    ctx.fillText(fitText(ctx, ach.Name, contentW - 130), contentX + 38, y + 12);

    ctx.fillStyle = unlocked ? 'rgba(239, 228, 208, 0.78)' : 'rgba(194, 209, 228, 0.66)';
    ctx.font = font(11, '500');
    ctx.fillText(fitText(ctx, ach.Desc, contentW - 130), contentX + 38, y + 34);

    if (ach.RewardCoins > 0) {
      drawBadge(ctx, panelX + panelW - 92, y + 12, '+' + ach.RewardCoins + ' 金', {
        width: 62,
        height: 24,
        paddingX: 10,
        color: '#ffd166',
        glow: 'rgba(255, 209, 102, 0.12)'
      });
    }

    if (ach.TitleId) {
      const title = achievementSystem.getTitleById(ach.TitleId);
      if (title) {
        ctx.fillStyle = unlocked ? '#ffbf93' : 'rgba(194, 209, 228, 0.44)';
        ctx.font = font(10, '600');
        ctx.textAlign = 'right';
        ctx.fillText(title.Name, panelX + panelW - 18, y + 38);
      }
    }
    ctx.restore();
  }
}

function getShopEntryMeta(entry) {
  if (entry.kind === 'upgrade') {
    return {
      title: entry.name + ' Lv.' + entry.level + '/' + entry.maxLevel,
      desc: progressionSystem.formatUpgradeEffect(entry.id, entry.currentEffect),
      detail: entry.isMaxLevel ? entry.desc : ('下一档 ' + progressionSystem.formatUpgradeEffect(entry.id, entry.nextEffect)),
      primary: {
        label: entry.isMaxLevel ? '满级' : (entry.cost + '金'),
        color: entry.isMaxLevel ? '#636e72' : (entry.affordable ? '#00b894' : '#d63031'),
        action: 'buy-upgrade',
        itemId: entry.id
      }
    };
  }

  if (entry.kind === 'skill') {
    return {
      title: entry.name,
      desc: entry.desc,
      detail: entry.unlocked ? (entry.enabled ? '已购买，当前启用' : '已购买，当前关闭') : ('价格 ' + entry.price + ' 金币'),
      primary: {
        label: entry.unlocked ? (entry.enabled ? '关闭' : '启用') : '购买',
        color: entry.unlocked ? (entry.enabled ? '#636e72' : '#0984e3') : (entry.affordable ? '#00b894' : '#d63031'),
        action: entry.unlocked ? 'toggle-skill' : 'buy-skill',
        itemId: entry.capabilityId
      }
    };
  }

  if (entry.kind === 'character') {
    return {
      title: entry.name,
      desc: entry.desc,
      detail: entry.selected ? '当前角色' : (entry.unlocked ? '已解锁，可切换' : ('价格 ' + entry.price + ' 金币')),
      primary: {
        label: entry.selected ? '使用中' : (entry.unlocked ? '装备' : ('解锁')),
        color: entry.selected ? '#636e72' : ((entry.unlocked || entry.affordable) ? '#00b894' : '#d63031'),
        action: entry.unlocked ? 'equip-character' : 'buy-character',
        itemId: entry.id
      }
    };
  }

  if (entry.kind === 'pet') {
    return {
      title: entry.name,
      desc: entry.desc,
      detail: entry.selected ? '当前出战' : (entry.unlocked ? '已拥有，可切换/收起' : ('价格 ' + entry.price + ' 金币')),
      primary: {
        label: entry.selected ? '收起' : (entry.unlocked ? '装备' : '购买'),
        color: entry.selected ? '#636e72' : ((entry.unlocked || entry.affordable) ? '#00b894' : '#d63031'),
        action: entry.unlocked ? 'equip-pet' : 'buy-pet',
        itemId: entry.id
      }
    };
  }

  if (entry.kind === 'tailTrail' || entry.kind === 'headTrail') {
    const isHead = entry.kind === 'headTrail';
    return {
      title: entry.name,
      desc: entry.desc,
      detail: entry.selected ? '当前展示' : (entry.unlocked ? '已解锁，可装备' : ('价格 ' + entry.price + ' 金币')),
      primary: {
        label: entry.selected ? '卸下' : (entry.unlocked ? '装备' : '解锁'),
        color: entry.selected ? '#636e72' : ((entry.unlocked || entry.affordable) ? '#00b894' : '#d63031'),
        action: entry.selected
          ? (isHead ? 'unequip-head-trail' : 'unequip-tail-trail')
          : (entry.unlocked
          ? (isHead ? 'equip-head-trail' : 'equip-tail-trail')
          : (isHead ? 'buy-head-trail' : 'buy-tail-trail')),
        itemId: entry.id
      }
    };
  }

  if (entry.kind === 'trailLength') {
    return {
      title: entry.name + ' Lv.' + entry.level + '/' + entry.maxLevel,
      desc: '当前倍率 x' + entry.currentEffect.toFixed(2),
      detail: entry.isMaxLevel ? '已达到最大长度' : ('下一档 x' + entry.nextEffect.toFixed(2)),
      primary: {
        label: entry.isMaxLevel ? '满级' : (entry.cost + '金'),
        color: entry.isMaxLevel ? '#636e72' : (entry.affordable ? '#00b894' : '#d63031'),
        action: 'buy-trail-length',
        itemId: entry.id
      }
    };
  }

  if (entry.kind === 'item') {
    return {
      title: entry.name,
      desc: entry.desc,
      detail: '库存 ' + entry.count + (entry.selected ? ' / 本局已装备' : ''),
      primary: {
        label: entry.price + '金',
        color: entry.affordable ? '#00b894' : '#d63031',
        action: 'buy-item',
        itemId: entry.id
      },
      secondary: {
        label: entry.selected ? '取消' : '装备',
        color: entry.count > 0 ? (entry.selected ? '#636e72' : '#0984e3') : '#636e72',
        action: 'equip-item',
        itemId: entry.id
      }
    };
  }

  return {
    title: entry.name || '未命名',
    desc: entry.desc || '',
    detail: '',
    primary: {
      label: '查看',
      color: '#636e72',
      action: '',
      itemId: entry.id
    }
  };
}

/**
 * 绘制当前选中的角色和职业
 */
function drawCurrentCharacter(ctx, game, characterConfig, jobConfig, minY) {
  const { W, H, playerJob } = game;
  const progress = game.progression || progressionSystem.getDefaultProgress();
  const stats = progress.achievementStats || {};
  const modeMeta = getModeMeta(game);
  const charName = characterConfig.current;
  const charDisplayName = characterConfig.names[charName] || charName;
  const frames = characterConfig.frames[charName];

  const sectionW = Math.min(W - 28, 404);
  const sectionX = (W - sectionW) / 2;
  const dockTop = H - 118;
  const availableHeight = dockTop - minY - 18;

  if (availableHeight < 74) {
    return;
  }

  if (availableHeight < 118) {
    const compactH = Math.max(74, availableHeight);
    const compactY = dockTop - compactH - 18;

    drawGlassPanel(ctx, sectionX, compactY, sectionW, compactH, {
      radius: 24,
      shadowBlur: 12,
      glow: 'rgba(124, 231, 255, 0.1)',
      stroke: 'rgba(255, 255, 255, 0.12)',
      stops: [
        [0, 'rgba(19, 34, 57, 0.84)'],
        [1, 'rgba(10, 19, 32, 0.82)']
      ]
    });

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = font(17, '700');
    ctx.fillText(charDisplayName, sectionX + 18, compactY + 26);

    ctx.fillStyle = 'rgba(202, 221, 243, 0.68)';
    ctx.font = font(11, '500');
    ctx.fillText(playerJob + ' · ' + modeMeta.label, sectionX + 18, compactY + 50);

    ctx.textAlign = 'right';
    ctx.fillStyle = modeMeta.accent;
    ctx.font = font(12, '700');
    ctx.fillText(modeMeta.detail, sectionX + sectionW - 18, compactY + 26);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.font = font(11, '600');
    ctx.fillText((stats.highestScore || 0) + ' m', sectionX + sectionW - 18, compactY + 50);
    ctx.restore();
    return;
  }

  const cardGap = 12;
  const cardW = (sectionW - cardGap) / 2;
  const cardH = Math.min(154, availableHeight);
  const sectionY = minY + Math.max(0, Math.min(12, (availableHeight - cardH) / 2));

  drawGlassPanel(ctx, sectionX, sectionY, cardW, cardH, {
    radius: 26,
    shadowBlur: 16,
    glow: 'rgba(124, 231, 255, 0.12)',
    stroke: 'rgba(124, 231, 255, 0.16)',
    stops: [
      [0, 'rgba(19, 34, 57, 0.86)'],
      [1, 'rgba(10, 19, 32, 0.84)']
    ]
  });

  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(201, 224, 255, 0.72)';
  ctx.font = font(11, '600');
  ctx.fillText('CURRENT HERO', sectionX + 18, sectionY + 16);

  if (frames && frames[0] && frames[0].width > 0) {
    const avatarSize = Math.min(72, cardH - 58);
    ctx.drawImage(frames[0], sectionX + 16, sectionY + 42, avatarSize, avatarSize);
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = font(20, '700');
  ctx.fillText(charDisplayName, sectionX + 100, sectionY + 46);

  ctx.fillStyle = 'rgba(202, 221, 243, 0.68)';
  ctx.font = font(12, '500');
  ctx.fillText('最高高度 ' + (stats.highestScore || 0) + ' m', sectionX + 100, sectionY + 82);
  ctx.fillText('累计开局 ' + (stats.totalRuns || 0) + ' 次', sectionX + 100, sectionY + Math.min(cardH - 24, 104));
  ctx.restore();

  const jobX = sectionX + cardW + cardGap;
  drawGlassPanel(ctx, jobX, sectionY, cardW, cardH, {
    radius: 26,
    shadowBlur: 16,
    glow: 'rgba(255, 186, 124, 0.12)',
    stroke: 'rgba(255, 211, 170, 0.16)',
    stops: [
      [0, 'rgba(35, 30, 47, 0.86)'],
      [1, 'rgba(15, 14, 25, 0.84)']
    ]
  });

  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(255, 231, 195, 0.72)';
  ctx.font = font(11, '600');
  ctx.fillText('STYLE PROFILE', jobX + 18, sectionY + 16);

  ctx.fillStyle = jobConfig.colors[playerJob] || '#ff9f6e';
  ctx.beginPath();
  ctx.arc(jobX + 34, sectionY + 62, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = font(20, '700');
  ctx.fillText(playerJob, jobX + 60, sectionY + 46);

  ctx.fillStyle = 'rgba(202, 221, 243, 0.68)';
  ctx.font = font(12, '500');
  ctx.fillText('当前玩法', jobX + 18, sectionY + 98);

  ctx.fillStyle = modeMeta.accent;
  ctx.font = font(15, '700');
  ctx.fillText(modeMeta.label, jobX + 18, sectionY + Math.min(cardH - 38, 116));

  ctx.fillStyle = 'rgba(202, 221, 243, 0.68)';
  ctx.font = font(11, '500');
  ctx.fillText(modeMeta.detail, jobX + 18, sectionY + Math.min(cardH - 18, 136));
  ctx.restore();
}

module.exports = {
  drawStartScreen,
  drawCurrentCharacter
};
