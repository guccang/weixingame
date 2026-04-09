/**
 * 开始界面绘制模块
 * 使用JSON布局配置驱动UI渲染
 */

const { roundRect } = require('./helper');
const { drawBackground } = require('./background');
const { drawCharacterSelect } = require('./characterSelect');
const { drawModeSelect, drawTimeSelect, drawLandmarkSelect } = require('./modeSelect');
const { drawLeaderboardPanel } = require('./leaderboard');
const progressionSystem = require('../progression/progression');

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

  // 解析布局（使用布局引擎）
  game.layout = game.layoutLoader.resolve('startScreen', W, H);
  const layout = game.layout;

  // 绘制主界面背景图
  if (images.bgMain && images.bgMain.width > 0) {
    const scale = Math.max(W / images.bgMain.width, H / images.bgMain.height);
    const imgW = images.bgMain.width * scale;
    const imgH = images.bgMain.height * scale;
    const imgX = (W - imgW) / 2;
    const imgY = (H - imgH) / 2;
    ctx.drawImage(images.bgMain, imgX, imgY, imgW, imgH);
  } else {
    drawBackground(ctx, W, H, game.cameraY, game.score, game.bgStars);
    ctx.fillStyle = 'rgba(10,10,46,0.95)';
    ctx.fillRect(0, 0, W, H);
  }

  // 如果角色面板显示中，隐藏主页面UI
  // 只有当没有显示任何面板时，才绘制开始按钮和标题
  if (!game.panelManager.isAnyOpen()) {
    // 使用布局引擎绘制标题
    const titleEl = layout.elements.title;
    if (titleEl) {
      ctx.fillStyle = titleEl.style.color;
      ctx.font = `bold ${titleEl.style.fontSize}px sans-serif`;
      ctx.textAlign = titleEl.style.textAlign || 'center';
      if (titleEl.style.shadow) {
        ctx.shadowColor = titleEl.style.shadow.color;
        ctx.shadowBlur = titleEl.style.shadow.blur;
      }
      ctx.fillText('秀彬跳一跳', titleEl.bounds.x + titleEl.bounds.width / 2, titleEl.bounds.y);
      ctx.shadowBlur = 0;
    }

    // 副标题
    const subtitleEl = layout.elements.subtitle;
    if (subtitleEl) {
      ctx.fillStyle = subtitleEl.style.color;
      ctx.font = `${subtitleEl.style.fontSize}px sans-serif`;
      ctx.fillText('💪 健身大佬的极限跳跃 💪', subtitleEl.bounds.x + subtitleEl.bounds.width / 2, subtitleEl.bounds.y);
    }

    // 提示文字
    const hintEl = layout.elements.hint;
    if (hintEl) {
      ctx.fillStyle = hintEl.style.color;
      ctx.font = `${hintEl.style.fontSize}px sans-serif`;
      ctx.fillText('看谁跳得高！全程为你疯狂打call！', hintEl.bounds.x + hintEl.bounds.width / 2, hintEl.bounds.y);
    }

    // 开始按钮（使用布局引擎）
    const btnEl = layout.elements.startBtn;
    if (btnEl) {
      const btn = btnEl.bounds;
      ctx.fillStyle = btnEl.style.bgColor;
      ctx.shadowColor = btnEl.style.shadow.color;
      ctx.shadowBlur = btnEl.style.shadow.blur;
      roundRect(ctx, btn.x, btn.y, btn.width, btn.height, btnEl.style.borderRadius);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = btnEl.style.textColor;
      ctx.font = `bold ${btnEl.style.fontSize}px sans-serif`;
      ctx.fillText('开始游戏', btn.x + btn.width / 2, btn.y + 32);

      game.startBtnArea = { x: btn.x, y: btn.y, w: btn.width, h: btn.height };
    }
  } else {
    // 有面板显示时，清空开始按钮区域
    game.startBtnArea = null;
  }

  drawCoinBadge(ctx, game, images);

  // 底部图标按钮区域（使用布局引擎的Flex布局）
  const bottomBarEl = layout.elements.bottomBar;
  if (bottomBarEl && bottomBarEl.children) {
    const iconY = H - 100;
    const iconSize = 50;
    const icons = [
      { key: 'shop', color: '#fd79a8', text: '强化', img: images.iconShop, highlight: game.showShopPanel },
      { key: 'character', color: '#74b9ff', text: '角色', img: images.iconCharacter },
      { key: 'mode', color: '#ffdd57', text: '玩法', img: null, highlight: game.gameMode.showModeSelect },
      { key: 'achievement', color: '#fdcb6e', text: '成就', img: null, highlight: game.showAchievementPanel },
      { key: 'leaderboard', color: '#55efc4', text: '排行', img: images.iconLeaderboard }
    ];

    game.bottomBtnArea = {};
    bottomBarEl.children.forEach((child, i) => {
      const icon = icons[i];
      if (!icon || !child.bounds) return;

      const x = child.bounds.x;
      game.bottomBtnArea[icon.key] = { x, y: iconY, w: iconSize, h: iconSize };

      // 高亮背景
      if (icon.highlight) {
        ctx.fillStyle = 'rgba(255, 221, 87, 0.5)';
        ctx.fillRect(x - 5, iconY - 5, iconSize + 10, iconSize + 10);
      }

      // 图标
      if (icon.img && icon.img.width > 0) {
        ctx.drawImage(icon.img, x, iconY, iconSize, iconSize);
      } else {
        ctx.fillStyle = icon.color;
        ctx.fillRect(x, iconY, iconSize, iconSize);
      }

      // 文字
      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(icon.text, x + iconSize / 2, iconY + iconSize + 18);
    });
    ctx.textAlign = 'left';
  }

  // 根据状态显示面板
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
  } else {
    drawCurrentCharacter(ctx, game, characterConfig, jobConfig);
  }
}

function drawCoinBadge(ctx, game, images) {
  const balance = game.progression ? game.progression.coins : 0;
  const x = 24;
  const y = 90; // 向下移动，避免与文字重叠
  const w = 102;
  const h = 34;

  game.coinBadgeArea = {
    x: x,
    y: y,
    w: w,
    h: h
  };

  ctx.save();
  ctx.fillStyle = 'rgba(18, 18, 36, 0.72)';
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.8)';
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 17);
  ctx.fill();
  ctx.stroke();

  if (images.iconCoin && images.iconCoin.width > 0) {
    ctx.drawImage(images.iconCoin, x + 8, y + 7, 20, 20);
  } else {
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(x + 18, y + 17, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#fff3bf';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(String(balance), x + 34, y + 22);
  ctx.restore();
}

function drawShopPanel(ctx, game, images, W, H) {
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

  game.shopItemAreas = [];
  game.shopCloseBtnArea = null;
  game.shopTabAreas = [];
  game.shopResetBtnArea = null;

  ctx.save();
  if (images.bgShop && images.bgShop.width > 0) {
    ctx.globalAlpha = 0.92;
    ctx.drawImage(images.bgShop, panelX, panelY, panelW, panelH);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = 'rgba(12, 12, 28, 0.92)';
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.85)';
  ctx.lineWidth = 2;
  roundRect(ctx, panelX, panelY, panelW, panelH, 22);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffeaa7';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('成长工坊', W / 2, panelY + 34);

  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('当前金币: ' + progress.coins, W / 2, panelY + 60);

  const toastVisible = game.shopMessage && Date.now() < game.shopMessageUntil;
  if (toastVisible) {
    ctx.fillStyle = game.shopMessageColor || '#55efc4';
    ctx.font = '14px sans-serif';
    ctx.fillText(game.shopMessage, W / 2, panelY + 82);
  }

  const closeX = panelX + panelW - 38;
  const closeY = panelY + 14;
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  roundRect(ctx, closeX, closeY, 24, 24, 12);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('X', closeX + 12, closeY + 17);
  game.shopCloseBtnArea = { x: closeX, y: closeY, w: 24, h: 24 };

  const tabY = panelY + 76;
  const tabGap = 6;
  const tabW = Math.floor((contentW - tabGap * (tabs.length - 1)) / tabs.length);
  const tabH = 28;
  tabs.forEach(function(tab, index) {
    const x = contentX + index * (tabW + tabGap);
    const isActive = tab.id === activeTab;
    ctx.fillStyle = isActive ? '#ffd166' : 'rgba(255,255,255,0.1)';
    roundRect(ctx, x, tabY, tabW, tabH, 14);
    ctx.fill();
    ctx.fillStyle = isActive ? '#2d3436' : '#dfe6e9';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(tab.name, x + tabW / 2, tabY + 19);
    game.shopTabAreas.push({
      tabId: tab.id,
      x: x,
      y: tabY,
      w: tabW,
      h: tabH
    });
  });

  const resetBtnW = 76;
  const resetBtnH = 24;
  const resetBtnX = panelX + 16;
  const resetBtnY = panelY + 14;
  ctx.fillStyle = 'rgba(214, 48, 49, 0.9)';
  roundRect(ctx, resetBtnX, resetBtnY, resetBtnW, resetBtnH, 12);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('清空存档', resetBtnX + resetBtnW / 2, resetBtnY + 16);
  game.shopResetBtnArea = { x: resetBtnX, y: resetBtnY, w: resetBtnW, h: resetBtnH };

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

    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    roundRect(ctx, contentX, y, contentW, cardH, 14);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(meta.title, contentX + 12, y + 18);

    ctx.fillStyle = '#a5f3fc';
    ctx.font = '12px sans-serif';
    ctx.fillText(meta.desc, contentX + 12, y + 35);

    if (meta.detail) {
      ctx.fillStyle = '#ffeaa7';
      ctx.fillText(meta.detail, contentX + 12, y + 50);
    }

    drawShopButton(ctx, primaryX, buttonY, primaryW, 24, meta.primary.color, meta.primary.label);
    game.shopItemAreas.push({
      action: meta.primary.action,
      itemId: meta.primary.itemId,
      x: primaryX,
      y: buttonY,
      w: primaryW,
      h: 24
    });

    if (meta.secondary) {
      drawShopButton(ctx, secondaryX, buttonY, secondaryW, 24, meta.secondary.color, meta.secondary.label);
      game.shopItemAreas.push({
        action: meta.secondary.action,
        itemId: meta.secondary.itemId,
        x: secondaryX,
        y: buttonY,
        w: secondaryW,
        h: 24
      });
    }
  }

  ctx.restore();
}

function drawShopButton(ctx, x, y, w, h, color, text) {
  ctx.fillStyle = color;
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, x + w / 2, y + 16);
}

function drawAchievementPanel(ctx, game, W, H) {
  const achievementSystem = require('../achievement/achievementSystem');

  const panelW = Math.min(W - 48, 380);
  const panelH = Math.min(H - 110, 520);
  const panelX = (W - panelW) / 2;
  const panelY = 76;
  const contentX = panelX + 18;
  const contentW = panelW - 36;
  const progress = game.progression || progressionSystem.getDefaultProgress();

  game.achievementCloseBtnArea = null;
  game.achievementPanelArea = { x: panelX, y: panelY, w: panelW, h: panelH };

  ctx.save();
  ctx.fillStyle = 'rgba(12, 12, 28, 0.95)';
  ctx.strokeStyle = 'rgba(253, 203, 110, 0.85)';
  ctx.lineWidth = 2;
  roundRect(ctx, panelX, panelY, panelW, panelH, 22);
  ctx.fill();
  ctx.stroke();

  // 标题
  ctx.fillStyle = '#fdcb6e';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('成就', W / 2, panelY + 34);

  // 当前称号
  const currentTitle = achievementSystem.getCurrentTitle(progress);
  if (currentTitle) {
    ctx.fillStyle = '#ffeaa7';
    ctx.font = '14px sans-serif';
    ctx.fillText('当前称号: ' + currentTitle.Name, W / 2, panelY + 58);
  } else {
    ctx.fillStyle = '#636e72';
    ctx.font = '14px sans-serif';
    ctx.fillText('尚未获得称号', W / 2, panelY + 58);
  }

  // 关闭按钮
  const closeX = panelX + panelW - 38;
  const closeY = panelY + 14;
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  roundRect(ctx, closeX, closeY, 24, 24, 12);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('X', closeX + 12, closeY + 17);
  game.achievementCloseBtnArea = { x: closeX, y: closeY, w: 24, h: 24 };

  // 已解锁/总成就数
  const achievements = achievementSystem.getAllAchievements();
  const unlockedCount = Object.keys(progress.achievements || {}).length;
  ctx.fillStyle = '#dfe6e9';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('已解锁: ' + unlockedCount + ' / ' + achievements.length, W / 2, panelY + 82);

  // 成就列表（支持滚动）
  const startY = panelY + 96;
  const cardH = 46;
  const gap = 6;
  const scrollOffset = game.achievementScrollOffset || 0;
  const visibleCount = Math.floor((panelH - 130) / (cardH + gap));
  const maxScroll = Math.max(0, achievements.length - visibleCount);
  game.achievementMaxScroll = maxScroll;

  for (let i = 0; i < achievements.length; i++) {
    if (i < scrollOffset || i >= scrollOffset + visibleCount) continue;
    const ach = achievements[i];
    const unlocked = progress.achievements && progress.achievements[ach.Key];
    const y = startY + (i - scrollOffset) * (cardH + gap);

    ctx.fillStyle = unlocked ? 'rgba(253, 203, 110, 0.15)' : 'rgba(255,255,255,0.06)';
    roundRect(ctx, contentX, y, contentW, cardH, 14);
    ctx.fill();

    // 状态图标
    const iconX = contentX + 10;
    const iconY = y + cardH / 2;
    if (unlocked) {
      ctx.fillStyle = '#fdcb6e';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★', iconX, iconY + 6);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('☆', iconX, iconY + 6);
    }

    // 名称
    ctx.fillStyle = unlocked ? '#ffeaa7' : '#dfe6e9';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(ach.Name, contentX + 34, y + 18);

    // 描述
    ctx.fillStyle = unlocked ? '#b2bec3' : '#636e72';
    ctx.font = '11px sans-serif';
    ctx.fillText(ach.Desc, contentX + 34, y + 34);

    // 奖励
    if (ach.RewardCoins > 0) {
      ctx.fillStyle = '#ffd166';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('+' + ach.RewardCoins + '金', panelX + panelW - 16, y + 18);
    }

    // 称号
    if (ach.TitleId) {
      const title = achievementSystem.getTitleById(ach.TitleId);
      if (title) {
        ctx.fillStyle = unlocked ? '#fd79a8' : '#636e72';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('称号: ' + title.Name, panelX + panelW - 16, y + 34);
      }
    }
  }

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
 * 绘制当前选中的角色（序列帧动画）
 */
function drawCurrentCharacter(ctx, game, characterConfig, jobConfig) {
  const { W, H } = game;
  const charName = characterConfig.current;
  const charDisplayName = characterConfig.names[charName] || charName;

  // 角色显示区域 - 居中上方
  const charBoxWidth = 140;
  const charBoxHeight = 160;
  const charBoxX = W / 2 - charBoxWidth / 2;
  const charBoxY = H / 2 - 100; // 上方位置

  // 保存角色预览点击区域
  game.characterPreviewArea = { x: charBoxX, y: charBoxY, w: charBoxWidth, h: charBoxHeight };

  // 绘制角色框背景
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.strokeStyle = 'rgba(255, 221, 87, 0.4)';
  ctx.lineWidth = 2;
  roundRect(ctx, charBoxX, charBoxY, charBoxWidth, charBoxHeight, 12);
  ctx.fill();
  ctx.stroke();

  // 序列帧动画 - 使用idle状态
  const frame = characterConfig.frames[charName];
  if (frame && frame.length > 0) {
    // 简单的帧动画切换
    const frameIndex = Math.floor(Date.now() / 150) % frame.length;
    const currentFrame = frame[frameIndex];
    if (currentFrame && currentFrame.width > 0) {
      const imgSize = 100;
      ctx.drawImage(
        currentFrame,
        charBoxX + (charBoxWidth - imgSize) / 2,
        charBoxY + 20,
        imgSize,
        imgSize
      );
    }
  }

  // 绘制角色名称
  ctx.fillStyle = '#ffdd57';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(charDisplayName, charBoxX + charBoxWidth / 2, charBoxY + 140);
  ctx.textAlign = 'left';
}

module.exports = {
  drawStartScreen,
  drawCurrentCharacter
};
