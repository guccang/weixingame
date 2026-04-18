/**
 * 开始界面绘制模块
 * 使用JSON布局配置驱动UI渲染
 */

const { roundRect } = require('./helper');
const { drawStartBackground } = require('./background');
const { drawCharacterSelect } = require('./characterSelect');
const { drawDebugPanel } = require('./debugPanel');
const { drawModeSelect, drawTimeSelect, drawLandmarkSelect } = require('./modeSelect');
const { drawLeaderboardPanel } = require('./leaderboard');
const {
  createGradient,
  drawActionButton,
  drawBadge,
  drawGlassPanel,
  drawIconTile,
  drawCloseButton,
  font
} = require('./menuTheme');
const progressionSystem = require('../progression/progression');
const { getText } = require('../ui/text');
const worldview = require('../worldview/index');
const uiTheme = require('../ui/theme');

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
  const registry = game.uiRegistry;
  const pm = game.panelManager;

  // 解析布局（使用布局引擎）
  game.layout = game.layoutLoader.resolve('startScreen', W, H);
  const layout = game.layout;

  // 绘制主界面背景图（优先使用 Bg01 滚屏背景）
  drawStartBackground(ctx, W, H, images);
  const homeNarrative = worldview.getHomeNarrative(game.progression, {
    selectedLandmark: game.gameMode ? game.gameMode.selectedLandmark : null
  });

  if (!pm.isAnyOpen()) {
    drawHomeHero(ctx, game, characterConfig, jobConfig, registry, homeNarrative);

    const debugBtnW = 94;
    const debugBtnH = 34;
    const settingsBtnW = 94;
    const debugBtnX = W - debugBtnW - 22;
    const debugBtnY = 28;
    const settingsBtnX = debugBtnX - settingsBtnW - 10;
    const theme = uiTheme.getThemeFromGame(game);

    drawActionButton(ctx, settingsBtnX, debugBtnY, settingsBtnW, debugBtnH, 'Setting', {
      font: font(14, '700'),
      textColor: theme.buttonText,
      shadowColor: theme.buttonShadow,
      stops: theme.buttonPrimaryStops
    });
    registry.register('start.home.settingsEntry', { x: settingsBtnX, y: debugBtnY, w: settingsBtnW, h: debugBtnH }, {
      action: { type: 'open-panel', panel: 'showSettingsPanel' }
    });

    drawActionButton(ctx, debugBtnX, debugBtnY, debugBtnW, debugBtnH, 'Debug', {
      font: font(14, '700'),
      textColor: '#271d16',
      shadowColor: 'rgba(219, 175, 138, 0.18)',
      stops: [
        [0, '#efdbc7'],
        [0.55, '#ddbc99'],
        [1, '#c79b7f']
      ]
    });
    registry.register('start.home.debugEntry', { x: debugBtnX, y: debugBtnY, w: debugBtnW, h: debugBtnH }, {
      action: { type: 'open-debug-panel' }
    });
  }

  drawCoinBadge(ctx, game, images, registry);
  drawHomeNav(ctx, game, images, registry, pm, layout);

  // 根据状态显示面板
  if (pm.isOpen('showCharacterPanel')) {
    drawCharacterSelect(ctx, game, characterConfig);
  } else if (pm.isOpen('showPetPanel')) {
    drawPetPanel(ctx, game, images, W, H);
  } else if (pm.isOpen('showDebugPanel')) {
    drawDebugPanel(ctx, game, W, H);
  } else if (pm.isOpen('showShopPanel')) {
    drawShopPanel(ctx, game, images, W, H);
  } else if (pm.isOpen('showAchievementPanel')) {
    drawAchievementPanel(ctx, game, W, H);
  } else if (pm.isOpen('showModeSelect')) {
    drawModeSelect(ctx, game, W, H);
  } else if (pm.isOpen('showTimeSelect')) {
    drawTimeSelect(ctx, game, W, H);
  } else if (pm.isOpen('showLandmarkSelect')) {
    drawLandmarkSelect(ctx, game, W, H);
  } else if (pm.isOpen('showLeaderboardPanel')) {
    drawLeaderboardPanel(ctx, game, W, H);
  } else if (pm.isOpen('showSettingsPanel')) {
    drawSettingsPanel(ctx, game, W, H);
  }
}

function drawCoinBadge(ctx, game, images, registry) {
  const theme = uiTheme.getThemeFromGame(game);
  const balance = game.progression ? game.progression.coins : 0;
  const x = 24;
  const y = 72;
  const w = 126;
  const h = 40;

  ctx.save();
  drawGlassPanel(ctx, x, y, w, h, {
    radius: 20,
    shadowBlur: 8,
    glow: theme.panelGlow,
    stroke: theme.panelStroke,
    stops: theme.panelMutedStops
  });

  if (images.iconCoin && images.iconCoin.width > 0) {
    ctx.drawImage(images.iconCoin, x + 12, y + 10, 20, 20);
  } else {
    ctx.fillStyle = theme.accent;
    ctx.beginPath();
    ctx.arc(x + 22, y + 20, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = theme.chipLabel;
  ctx.font = font(10, '600');
  ctx.textAlign = 'left';
  ctx.fillText('能量币', x + 40, y + 15);
  ctx.fillStyle = theme.cardLabel;
  ctx.font = font(18, '700');
  ctx.fillText(String(balance), x + 40, y + 30);
  ctx.restore();

  registry.register('start.home.coinBadge', { x: x, y: y, w: w, h: h }, {
    action: { type: 'grant-debug-coins' }
  });
}

function drawHomeHero(ctx, game, characterConfig, jobConfig, registry, homeNarrative) {
  const { W, H } = game;
  const theme = uiTheme.getThemeFromGame(game);
  const titleEl = game.layout.elements.title;
  const subtitleEl = game.layout.elements.subtitle;
  const hintEl = game.layout.elements.hint;
  const btnEl = game.layout.elements.startBtn;
  const heroW = Math.min(W - 32, 372);
  const heroH = Math.min(292, Math.max(248, H * 0.34));
  const heroX = (W - heroW) / 2;
  const heroY = Math.max(96, H * 0.23);
  const accent = homeNarrative && homeNarrative.selectedLandmark && homeNarrative.selectedLandmark.theme
    ? homeNarrative.selectedLandmark.theme.accentColor
    : theme.heroAccent;

  ctx.save();
  ctx.fillStyle = createGradient(ctx, 0, 0, 0, H, [
    theme.overlayStops[0],
    theme.overlayStops[1],
    theme.overlayStops[2]
  ]);
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  drawBadge(ctx, heroX, 28, homeNarrative.badgeLine || '热身完成', {
    color: theme.badgeText,
    dotColor: accent,
    glow: theme.panelGlow,
    stops: theme.badgeStops,
    stroke: theme.panelStroke
  });

  if (titleEl) {
    ctx.save();
    ctx.fillStyle = theme.titleColor || titleEl.style.color;
    ctx.font = font(34, '700');
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(255,255,255,0.08)';
    ctx.shadowBlur = 14;
    ctx.fillText(homeNarrative.title || getText(titleEl.textKey || 'GAME_TITLE'), W / 2, 88);
    ctx.restore();
  }

  if (subtitleEl) {
    ctx.save();
    ctx.fillStyle = theme.subtitleColor;
    ctx.font = font(16, '600');
    ctx.textAlign = 'center';
    ctx.fillText(homeNarrative.subtitle || getText(subtitleEl.textKey || 'SUBTITLE'), W / 2, 116);
    ctx.restore();
  }

  drawGlassPanel(ctx, heroX, heroY, heroW, heroH, {
    radius: 30,
    glow: theme.panelGlow,
    shadowBlur: 14,
    stroke: theme.panelStroke,
    innerStroke: theme.panelInnerStroke,
    stops: theme.panelStrongStops
  });

  ctx.save();
  ctx.fillStyle = theme.cardFill;
  roundRect(ctx, heroX + 18, heroY + 20, heroW - 36, heroH - 40, 24);
  ctx.restore();

  drawCurrentCharacter(ctx, game, characterConfig, jobConfig, registry, homeNarrative, {
    x: heroX,
    y: heroY,
    width: heroW,
    height: heroH,
    accent: accent
  });

  if (hintEl) {
    ctx.save();
    ctx.fillStyle = theme.cardSubtle;
    ctx.font = font(13);
    ctx.textAlign = 'center';
    ctx.fillText(homeNarrative.hint || getText(hintEl.textKey || 'HINT'), W / 2, heroY + heroH + 26);
    ctx.restore();
  }

  if (btnEl) {
    const btnW = Math.min(220, heroW - 44);
    const btnH = 56;
    const btnX = W / 2 - btnW / 2;
    const navTop = H - 114;
    const btnY = Math.min(heroY + heroH - btnH / 2, navTop - btnH - 18);
    drawActionButton(ctx, btnX, btnY, btnW, btnH, getText(btnEl.textKey || 'START_BUTTON'), {
      radius: 28,
      shadowBlur: 14,
      font: font(20, '700'),
      textColor: theme.buttonText,
      shadowColor: theme.buttonShadow,
      stops: theme.buttonPrimaryStops
    });
    registry.register('start.home.startButton', { x: btnX, y: btnY, w: btnW, h: btnH }, {
      action: btnEl.action || { type: 'start-game', mode: 'endless' }
    });
  }
}

function drawHomeNav(ctx, game, images, registry, pm, layout) {
  const { W, H } = game;
  const theme = uiTheme.getThemeFromGame(game);
  const bottomBarEl = layout.elements.bottomBar;
  if (!bottomBarEl || !bottomBarEl.children) return;

  const items = bottomBarEl.children.filter(function(child) {
    return child && child.id !== 'backpack';
  });
  const cardW = Math.min(68, Math.floor((W - 44) / items.length) - 4);
  const cardH = 78;
  const gap = 6;
  const totalW = items.length * cardW + (items.length - 1) * gap;
  const startX = (W - totalW) / 2;
  const cardY = H - 102;
  const panelY = cardY - 12;
  const panelH = cardH + 24;

  drawGlassPanel(ctx, 12, panelY, W - 24, panelH, {
    radius: 26,
    glow: theme.panelGlow,
    shadowBlur: 8,
    stroke: theme.panelStroke,
    stops: theme.navPanelStops
  });

  items.forEach(function(child, index) {
    const x = startX + index * (cardW + gap);
    const action = child.action || {};
    const panelKey = action.panel;
    const isActive = panelKey === 'showModeSelect'
      ? (pm.isOpen('showModeSelect') || pm.isOpen('showTimeSelect') || pm.isOpen('showLandmarkSelect'))
      : (panelKey ? pm.isOpen(panelKey) : false);

    drawIconTile(ctx, x, cardY, cardW, cardH, '', getText(child.textKey), {
      active: isActive,
      labelSize: 10,
      activeAccent: theme.accentSoft,
      iconColor: theme.chipLabel,
      activeGlow: theme.panelGlow
    });

    const iconImage = images[child.imageKey];
    const iconSize = 30;
    const iconX = x + (cardW - iconSize) / 2;
    const iconY = cardY + 14;
    if (iconImage && iconImage.width > 0) {
      ctx.save();
      if (!isActive) {
        ctx.globalAlpha = 0.92;
      }
      ctx.drawImage(iconImage, iconX, iconY, iconSize, iconSize);
      ctx.restore();
    } else {
      ctx.fillStyle = getFallbackColor(child.id);
      roundRect(ctx, iconX, iconY, iconSize, iconSize, 10);
    }

    registry.register('start.nav.' + child.id, { x: x, y: cardY, w: cardW, h: cardH }, {
      action: action
    });
  });
}

function drawShopPanel(ctx, game, images, W, H) {
  const theme = uiTheme.getThemeFromGame(game);
  const panelW = Math.min(W - 48, 360);
  const panelH = Math.min(H - 110, 520);
  const panelX = (W - panelW) / 2;
  const panelY = 76;
  const contentX = panelX + 18;
  const contentW = panelW - 36;
  const progress = game.progression || progressionSystem.getDefaultProgress();
  const tabs = progressionSystem.getShopTabs();
  const activeTab = game.shopTab || 'upgrades';
  const entries = progressionSystem.getShopCatalogByTab(progress, activeTab);

  const registry = game.uiRegistry;

  ctx.save();
  drawGlassPanel(ctx, panelX, panelY, panelW, panelH, {
    radius: 22,
    glow: theme.panelGlow,
    shadowBlur: 12,
    stroke: theme.panelStroke,
    innerStroke: theme.panelInnerStroke,
    stops: theme.panelStrongStops
  });

  ctx.fillStyle = theme.cardLabel;
  ctx.font = font(24, '700');
  ctx.textAlign = 'center';
  ctx.fillText('成长工坊', W / 2, panelY + 34);

  ctx.fillStyle = theme.cardMeta;
  ctx.font = font(16, '700');
  ctx.fillText('当前金币: ' + progress.coins, W / 2, panelY + 60);

  const toastVisible = game.shopMessage && Date.now() < game.shopMessageUntil;
  if (toastVisible) {
    ctx.fillStyle = game.shopMessageColor || '#55efc4';
    ctx.font = '14px sans-serif';
    ctx.fillText(game.shopMessage, W / 2, panelY + 82);
  }

  const closeX = panelX + panelW - 40;
  const closeY = panelY + 12;
  drawCloseButton(ctx, closeX, closeY, 26, {
    glow: theme.panelGlow,
    stroke: theme.panelStroke
  });
  registry.register('start.shop.panel', { x: panelX, y: panelY, w: panelW, h: panelH }, {
    consume: true
  });
  registry.register('start.shop.close', { x: closeX, y: closeY, w: 26, h: 26 }, {
    action: { type: 'close-panel', panel: 'showShopPanel' }
  });

  const tabY = panelY + 76;
  const tabGap = 6;
  const tabW = Math.floor((contentW - tabGap * (tabs.length - 1)) / tabs.length);
  const tabH = 28;
  tabs.forEach(function(tab, index) {
    const x = contentX + index * (tabW + tabGap);
    const isActive = tab.id === activeTab;
    ctx.fillStyle = isActive ? theme.accentSoft : theme.chipFill;
    roundRect(ctx, x, tabY, tabW, tabH, 14);
    ctx.fill();
    ctx.fillStyle = isActive ? theme.buttonText : theme.cardSubtle;
    ctx.font = font(12, '700');
    ctx.textAlign = 'center';
    ctx.fillText(tab.name, x + tabW / 2, tabY + 19);
    registry.register('start.shop.tab.' + tab.id, {
      x: x,
      y: tabY,
      w: tabW,
      h: tabH
    }, {
      action: { type: 'shop-tab', tabId: tab.id }
    });
  });

  const resetBtnW = 76;
  const resetBtnH = 24;
  const resetBtnX = panelX + 16;
  const resetBtnY = panelY + 14;
  ctx.fillStyle = theme.buttonDanger;
  roundRect(ctx, resetBtnX, resetBtnY, resetBtnW, resetBtnH, 12);
  ctx.fill();
  ctx.fillStyle = '#fffaf7';
  ctx.font = font(11, '700');
  ctx.textAlign = 'center';
  ctx.fillText('清空存档', resetBtnX + resetBtnW / 2, resetBtnY + 16);
  registry.register('start.shop.reset', { x: resetBtnX, y: resetBtnY, w: resetBtnW, h: resetBtnH }, {
    action: { type: 'shop-action', actionName: 'reset-progress' }
  });

  const startY = panelY + 116;
  const cardH = activeTab === 'trails' ? 58 : 52;
  const gap = 8;
  const maxCards = Math.min(entries.length, Math.floor((panelH - 142) / (cardH + gap)));

  for (let i = 0; i < maxCards; i++) {
    const entry = entries[i];
    const meta = getShopEntryMeta(entry);
    const y = startY + i * (cardH + gap);
    const primaryW = meta.secondary ? 64 : 82;
    const secondaryW = 64;
    const buttonGap = 8;
    const secondaryX = panelX + panelW - secondaryW - 16;
    const primaryX = meta.secondary ? (secondaryX - primaryW - buttonGap) : (panelX + panelW - primaryW - 16);
    const buttonY = y + cardH - 34;

    ctx.fillStyle = theme.cardFill;
    roundRect(ctx, contentX, y, contentW, cardH, 14);
    ctx.fill();

    ctx.fillStyle = theme.cardLabel;
    ctx.font = font(14, '700');
    ctx.textAlign = 'left';
    ctx.fillText(meta.title, contentX + 12, y + 18);

    ctx.fillStyle = theme.cardSubtle;
    ctx.font = font(12);
    ctx.fillText(meta.desc, contentX + 12, y + 35);

    if (meta.detail) {
      ctx.fillStyle = theme.cardMeta;
      ctx.fillText(meta.detail, contentX + 12, y + 50);
    }

    drawShopButton(ctx, theme, primaryX, buttonY, primaryW, 24, meta.primary.color, meta.primary.label);
    registry.register('start.shop.item.' + i + '.primary', {
      x: primaryX,
      y: buttonY,
      w: primaryW,
      h: 24
    }, {
      action: {
        type: 'shop-action',
        actionName: meta.primary.action,
        itemId: meta.primary.itemId
      }
    });

    if (meta.secondary) {
      drawShopButton(ctx, theme, secondaryX, buttonY, secondaryW, 24, meta.secondary.color, meta.secondary.label);
      registry.register('start.shop.item.' + i + '.secondary', {
        x: secondaryX,
        y: buttonY,
        w: secondaryW,
        h: 24
      }, {
        action: {
          type: 'shop-action',
          actionName: meta.secondary.action,
          itemId: meta.secondary.itemId
        }
      });
    }
  }

  ctx.restore();
}

function drawShopButton(ctx, theme, x, y, w, h, color, text) {
  ctx.fillStyle = color;
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = font(11, '700');
  ctx.textAlign = 'center';
  ctx.fillText(text, x + w / 2, y + 16);
}

function drawPetPanel(ctx, game, images, W, H) {
  const theme = uiTheme.getThemeFromGame(game);
  const panelW = Math.min(W - 48, 360);
  const panelH = Math.min(H - 110, 520);
  const panelX = (W - panelW) / 2;
  const panelY = 76;
  const contentX = panelX + 18;
  const contentW = panelW - 36;
  const progress = game.progression || progressionSystem.getDefaultProgress();
  const entries = progressionSystem.getPetCatalog(progress);
  const registry = game.uiRegistry;

  ctx.save();
  drawGlassPanel(ctx, panelX, panelY, panelW, panelH, {
    radius: 22,
    glow: theme.panelGlow,
    shadowBlur: 12,
    stroke: theme.panelStroke,
    innerStroke: theme.panelInnerStroke,
    stops: theme.panelStrongStops
  });

  ctx.fillStyle = theme.cardLabel;
  ctx.font = font(24, '700');
  ctx.textAlign = 'center';
  ctx.fillText('宠物舱', W / 2, panelY + 34);

  ctx.fillStyle = theme.cardSubtle;
  ctx.font = font(13);
  ctx.fillText('当前金币: ' + progress.coins, W / 2, panelY + 58);

  const selectedPetId = progressionSystem.getSelectedPetId(progress);
  ctx.fillStyle = theme.cardMeta;
  ctx.font = font(12);
  ctx.fillText(selectedPetId ? ('当前出战: ' + selectedPetId) : '当前出战: 无', W / 2, panelY + 78);

  const closeX = panelX + panelW - 40;
  const closeY = panelY + 12;
  drawCloseButton(ctx, closeX, closeY, 26, {
    glow: theme.panelGlow,
    stroke: theme.panelStroke
  });
  registry.register('start.pet.panel', { x: panelX, y: panelY, w: panelW, h: panelH }, {
    consume: true
  });
  registry.register('start.pet.close', { x: closeX, y: closeY, w: 26, h: 26 }, {
    action: { type: 'close-panel', panel: 'showPetPanel' }
  });

  const startY = panelY + 96;
  const cardH = 58;
  const gap = 8;
  const maxCards = Math.min(entries.length, Math.floor((panelH - 122) / (cardH + gap)));

  for (let i = 0; i < maxCards; i++) {
    const entry = entries[i];
    const meta = getShopEntryMeta(entry);
    const y = startY + i * (cardH + gap);
    const primaryW = 82;
    const primaryX = panelX + panelW - primaryW - 16;
    const buttonY = y + cardH - 34;

    ctx.fillStyle = theme.cardFill;
    roundRect(ctx, contentX, y, contentW, cardH, 14);
    ctx.fill();

    ctx.fillStyle = theme.cardLabel;
    ctx.font = font(14, '700');
    ctx.textAlign = 'left';
    ctx.fillText(meta.title, contentX + 12, y + 18);

    ctx.fillStyle = theme.cardSubtle;
    ctx.font = font(12);
    ctx.fillText(meta.desc, contentX + 12, y + 35);

    if (meta.detail) {
      ctx.fillStyle = theme.cardMeta;
      ctx.fillText(meta.detail, contentX + 12, y + 50);
    }

    drawShopButton(ctx, theme, primaryX, buttonY, primaryW, 24, meta.primary.color, meta.primary.label);
    registry.register('start.pet.item.' + i + '.primary', {
      x: primaryX,
      y: buttonY,
      w: primaryW,
      h: 24
    }, {
      action: {
        type: 'shop-action',
        actionName: meta.primary.action,
        itemId: meta.primary.itemId
      }
    });
  }

  ctx.restore();
}

function drawAchievementPanel(ctx, game, W, H) {
  const achievementSystem = require('../achievement/achievementSystem');
  const theme = uiTheme.getThemeFromGame(game);

  const panelW = Math.min(W - 48, 380);
  const panelH = Math.min(H - 110, 520);
  const panelX = (W - panelW) / 2;
  const panelY = 76;
  const contentX = panelX + 18;
  const contentW = panelW - 36;
  const progress = game.progression || progressionSystem.getDefaultProgress();

  const registry = game.uiRegistry;

  ctx.save();
  drawGlassPanel(ctx, panelX, panelY, panelW, panelH, {
    radius: 22,
    glow: theme.panelGlow,
    shadowBlur: 12,
    stroke: theme.panelStroke,
    innerStroke: theme.panelInnerStroke,
    stops: theme.panelStrongStops
  });

  // 标题
  ctx.fillStyle = theme.cardLabel;
  ctx.font = font(24, '700');
  ctx.textAlign = 'center';
  ctx.fillText('成就', W / 2, panelY + 34);

  // 当前称号
  const currentTitle = achievementSystem.getCurrentTitle(progress);
  if (currentTitle) {
    ctx.fillStyle = theme.cardMeta;
    ctx.font = font(14);
    ctx.fillText('当前称号: ' + currentTitle.Name, W / 2, panelY + 58);
  } else {
    ctx.fillStyle = theme.cardSubtle;
    ctx.font = font(14);
    ctx.fillText('尚未获得称号', W / 2, panelY + 58);
  }

  // 关闭按钮
  const closeX = panelX + panelW - 40;
  const closeY = panelY + 12;
  drawCloseButton(ctx, closeX, closeY, 26, {
    glow: theme.panelGlow,
    stroke: theme.panelStroke
  });
  const startY = panelY + 96;
  const viewportBottom = panelY + panelH - 18;
  const viewportHeight = viewportBottom - startY;
  registry.register('start.achievement.panel', { x: panelX, y: panelY, w: panelW, h: panelH }, {
    consume: true,
    passThrough: true
  });
  registry.register('start.achievement.close', { x: closeX, y: closeY, w: 26, h: 26 }, {
    action: { type: 'close-panel', panel: 'showAchievementPanel' }
  });
  registry.register('start.achievement.scrollViewport', { x: contentX, y: startY, w: contentW, h: viewportHeight }, {
    consume: true,
    passThrough: true,
    scrollable: true
  });

  // 已解锁/总成就数
  const achievements = achievementSystem.getAllAchievements();
  const unlockedCount = Object.keys(progress.achievements || {}).length;
  ctx.fillStyle = theme.cardSubtle;
  ctx.font = font(12);
  ctx.textAlign = 'center';
  ctx.fillText('已解锁: ' + unlockedCount + ' / ' + achievements.length, W / 2, panelY + 82);

  // 成就列表（支持滚动）
  const cardH = 46;
  const gap = 6;
  const rowHeight = cardH + gap;
  const totalContentHeight = Math.max(0, achievements.length * rowHeight - gap);
  const maxScroll = Math.max(0, totalContentHeight - viewportHeight);
  if (typeof game.achievementScrollY !== 'number') {
    game.achievementScrollY = 0;
  }
  game.achievementScrollY = Math.max(0, Math.min(game.achievementScrollY, maxScroll));
  game.achievementMaxScroll = maxScroll;
  game.achievementScrollArea = {
    x: contentX,
    y: startY,
    w: contentW,
    h: viewportHeight
  };

  ctx.save();
  ctx.beginPath();
  ctx.rect(contentX, startY, contentW, viewportHeight);
  ctx.clip();

  for (let i = 0; i < achievements.length; i++) {
    const ach = achievements[i];
    const unlocked = progress.achievements && progress.achievements[ach.Key];
    const y = startY + i * rowHeight - game.achievementScrollY;
    if (y + cardH < startY || y > viewportBottom) continue;

    ctx.fillStyle = unlocked ? 'rgba(255,255,255,0.10)' : theme.cardFill;
    roundRect(ctx, contentX, y, contentW, cardH, 14);
    ctx.fill();

    // 状态图标
    const iconX = contentX + 10;
    const iconY = y + cardH / 2;
    if (unlocked) {
      ctx.fillStyle = theme.accentSoft;
      ctx.font = font(18, '700');
      ctx.textAlign = 'center';
      ctx.fillText('★', iconX, iconY + 6);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = font(18, '700');
      ctx.textAlign = 'center';
      ctx.fillText('☆', iconX, iconY + 6);
    }

    // 名称
    ctx.fillStyle = unlocked ? theme.cardLabel : theme.cardSubtle;
    ctx.font = font(14, '700');
    ctx.textAlign = 'left';
    ctx.fillText(ach.Name, contentX + 34, y + 18);

    // 描述
    ctx.fillStyle = unlocked ? theme.cardSubtle : 'rgba(188, 199, 185, 0.52)';
    ctx.font = font(11);
    ctx.fillText(ach.Desc, contentX + 34, y + 34);

    // 奖励
    if (ach.RewardCoins > 0) {
      ctx.fillStyle = theme.cardMeta;
      ctx.font = font(10);
      ctx.textAlign = 'right';
      ctx.fillText('+' + ach.RewardCoins + '金', panelX + panelW - 16, y + 18);
    }

    // 称号
    if (ach.TitleId) {
      const title = achievementSystem.getTitleById(ach.TitleId);
      if (title) {
        ctx.fillStyle = unlocked ? theme.accent : theme.cardSubtle;
        ctx.font = font(10);
        ctx.textAlign = 'right';
        ctx.fillText('称号: ' + title.Name, panelX + panelW - 16, y + 34);
      }
    }
  }

  ctx.restore();

  ctx.restore();
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
      detail: entry.selected ? '当前角色' : (entry.unlocked ? '已解锁，可切换' : entry.unlockLabel),
      primary: {
        label: entry.selected ? '使用中' : (entry.unlocked ? '装备' : '条件'),
        color: entry.selected ? '#636e72' : (entry.unlocked ? '#00b894' : '#d63031'),
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
 * 绘制当前选中的角色（序列帧动画）
 */
function drawCurrentCharacter(ctx, game, characterConfig, jobConfig, registry, homeNarrative, heroBounds) {
  const { W } = game;
  const theme = uiTheme.getThemeFromGame(game);
  const charName = characterConfig.current;
  const charDisplayName = characterConfig.names[charName] || charName;
  const bounds = heroBounds || {
    x: W / 2 - 160,
    y: 160,
    width: 320,
    height: 260,
    accent: '#74f7d0'
  };
  const stageSize = Math.min(bounds.width * 0.44, bounds.height - 84);
  const charBoxWidth = stageSize;
  const charBoxHeight = stageSize + 18;
  const charBoxX = bounds.x + 22;
  const charBoxY = bounds.y + 26;
  const detailsX = charBoxX + charBoxWidth + 18;
  const detailsW = bounds.x + bounds.width - detailsX - 18;
  const accent = bounds.accent || '#74f7d0';

  ctx.save();
  ctx.fillStyle = createGradient(ctx, charBoxX, charBoxY, charBoxX, charBoxY + charBoxHeight, [
    [0, 'rgba(255,255,255,0.12)'],
    [1, 'rgba(255,255,255,0.03)']
  ]);
  roundRect(ctx, charBoxX, charBoxY, charBoxWidth, charBoxHeight, 24);
  ctx.restore();

  // 序列帧动画 - 使用idle状态
  const frame = characterConfig.frames[charName];
  if (frame && frame.length > 0) {
    // 简单的帧动画切换
    const frameIndex = Math.floor(Date.now() / 150) % frame.length;
    const currentFrame = frame[frameIndex];
    if (currentFrame && currentFrame.width > 0) {
      const imgSize = Math.min(charBoxWidth - 28, charBoxHeight - 42);
      ctx.drawImage(
        currentFrame,
        charBoxX + (charBoxWidth - imgSize) / 2,
        charBoxY + 16,
        imgSize,
        imgSize
      );
    }
  }

  ctx.save();
  ctx.fillStyle = accent;
  ctx.font = "700 12px 'PingFang SC', 'Microsoft YaHei', sans-serif";
  ctx.textAlign = 'left';
  ctx.fillText('当前主角', detailsX, charBoxY + 18);

  ctx.fillStyle = '#ffffff';
  ctx.font = "700 24px 'PingFang SC', 'Microsoft YaHei', sans-serif";
  ctx.fillText(charDisplayName, detailsX, charBoxY + 48);

  if (homeNarrative) {
    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.font = "13px 'PingFang SC', 'Microsoft YaHei', sans-serif";
    wrapText(ctx, homeNarrative.statusLine || '', detailsX, charBoxY + 74, detailsW, 18, 2);

    drawNarrativeMetric(ctx, theme, detailsX, charBoxY + 124, detailsW, '状态', homeNarrative.unlockLine || '继续强化你的跳跃配置');
    drawNarrativeMetric(ctx, theme, detailsX, charBoxY + 164, detailsW, '档案', homeNarrative.dossierLine || '');
    drawNarrativeMetric(ctx, theme, detailsX, charBoxY + 204, detailsW, '收藏', homeNarrative.collectionLine || '');
  }
  ctx.restore();

  if (registry) {
    registry.register('start.home.characterPreview', {
      x: charBoxX,
      y: charBoxY,
      w: charBoxWidth,
      h: charBoxHeight
    }, {
      action: { type: 'open-panel', panel: 'showCharacterPanel' }
    });
  }
}

function drawNarrativeMetric(ctx, theme, x, y, width, label, text) {
  ctx.save();
  ctx.fillStyle = theme.cardFill;
  roundRect(ctx, x, y, width, 32, 14);
  ctx.fillStyle = theme.chipLabel;
  ctx.font = font(10, '600');
  ctx.textAlign = 'left';
  ctx.fillText(label, x + 10, y + 12);
  ctx.fillStyle = theme.cardLabel;
  ctx.font = font(11, '600');
  ctx.fillText(fitText(ctx, text, width - 20), x + 10, y + 25);
  ctx.restore();
}

function drawSettingsPanel(ctx, game, W, H) {
  const theme = uiTheme.getThemeFromGame(game);
  const themes = uiTheme.getAvailableThemes();
  const registry = game.uiRegistry;
  const panelW = Math.min(W - 44, 372);
  const panelH = Math.min(H - 120, 432);
  const panelX = (W - panelW) / 2;
  const panelY = Math.max(70, (H - panelH) / 2);
  const contentX = panelX + 18;
  const cardW = panelW - 36;
  const cardH = 88;
  const gap = 12;

  drawGlassPanel(ctx, panelX, panelY, panelW, panelH, {
    radius: 26,
    glow: theme.panelGlow,
    shadowBlur: 14,
    stroke: theme.panelStroke,
    innerStroke: theme.panelInnerStroke,
    stops: theme.panelStrongStops
  });

  ctx.save();
  ctx.fillStyle = theme.cardLabel;
  ctx.font = font(24, '700');
  ctx.textAlign = 'center';
  ctx.fillText('界面设置', W / 2, panelY + 34);
  ctx.fillStyle = theme.cardSubtle;
  ctx.font = font(13);
  ctx.fillText('切换整体 UI 质感和配色，立即生效。', W / 2, panelY + 58);
  ctx.restore();

  const closeX = panelX + panelW - 40;
  const closeY = panelY + 12;
  drawCloseButton(ctx, closeX, closeY, 26, {
    glow: theme.panelGlow,
    stroke: theme.panelStroke
  });
  registry.register('start.settings.panel', { x: panelX, y: panelY, w: panelW, h: panelH }, {
    consume: true
  });
  registry.register('start.settings.close', { x: closeX, y: closeY, w: 26, h: 26 }, {
    action: { type: 'close-panel', panel: 'showSettingsPanel' }
  });

  for (let i = 0; i < themes.length; i++) {
    const item = themes[i];
    const y = panelY + 86 + i * (cardH + gap);
    const active = item.id === (game.progression && game.progression.uiThemeId);

    drawGlassPanel(ctx, contentX, y, cardW, cardH, {
      radius: 18,
      glow: active ? item.panelGlow : 'rgba(255,255,255,0.03)',
      shadowBlur: active ? 12 : 6,
      stroke: active ? item.panelStroke : 'rgba(255,255,255,0.08)',
      stops: item.panelMutedStops
    });

    ctx.save();
    ctx.fillStyle = item.cardLabel;
    ctx.font = font(17, '700');
    ctx.textAlign = 'left';
    ctx.fillText(item.name, contentX + 16, y + 24);
    ctx.fillStyle = item.cardSubtle;
    ctx.font = font(12);
    ctx.fillText(item.description, contentX + 16, y + 46);

    const swatchY = y + 58;
    [item.accentSoft, item.accent, item.buttonPrimaryStops[2][1]].forEach(function(color, index) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(contentX + 22 + index * 18, swatchY, 6, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    drawActionButton(ctx, panelX + panelW - 110, y + 24, 74, 34, active ? '当前' : '应用', {
      radius: 17,
      font: font(14, '700'),
      textColor: item.buttonText,
      shadowColor: item.buttonShadow,
      stops: item.buttonPrimaryStops
    });
    registry.register('start.settings.theme.' + item.id, {
      x: panelX + panelW - 110,
      y: y + 24,
      w: 74,
      h: 34
    }, {
      action: active ? { type: 'close-panel', panel: 'showSettingsPanel' } : { type: 'set-ui-theme', themeId: item.id }
    });
  }
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  if (!text) return;
  const content = String(text);
  let line = '';
  let row = 0;
  for (let i = 0; i < content.length; i++) {
    const testLine = line + content[i];
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y + row * lineHeight);
      row += 1;
      if (row >= maxLines) return;
      line = content[i];
    } else {
      line = testLine;
    }
  }
  if (line && row < maxLines) {
    ctx.fillText(line, x, y + row * lineHeight);
  }
}

function fitText(ctx, text, maxWidth) {
  const content = String(text || '');
  if (!content) return '';
  if (ctx.measureText(content).width <= maxWidth) return content;

  let trimmed = content;
  while (trimmed.length > 1 && ctx.measureText(trimmed + '...').width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return trimmed + '...';
}

function getFallbackColor(key) {
  const colors = {
    shop: '#fd79a8',
    character: '#74b9ff',
    mode: '#ffdd57',
    achievement: '#fdcb6e',
    leaderboard: '#55efc4'
  };
  return colors[key] || '#ffffff';
}

module.exports = {
  drawStartScreen,
  drawCurrentCharacter
};
