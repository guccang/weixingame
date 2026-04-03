/**
 * 开始界面绘制模块
 */

const { roundRect } = require('./helper');
const { drawBackground } = require('./background');
const { drawCharacterSelect } = require('./characterSelect');
const { drawJobSelect } = require('./jobSelect');
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
  if (!game.showCharacterPanel && !game.showJobPanel && !game.showShopPanel && !game.gameMode.showModeSelect && !game.gameMode.showTimeSelect && !game.gameMode.showLandmarkSelect) {
    // 标题文字
    ctx.fillStyle = '#ffdd57';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 20;
    ctx.fillText('秀彬跳跳', W / 2, H / 2 - 120);
    ctx.shadowBlur = 0;

    // 副标题
    ctx.fillStyle = '#ff6b6b';
    ctx.font = '20px sans-serif';
    ctx.fillText('💪 健身大佬的极限跳跃 💪', W / 2, H / 2 - 80);
    ctx.fillStyle = '#74b9ff';
    ctx.font = '16px sans-serif';
    ctx.fillText('看谁跳得高！全程为你疯狂打call！', W / 2, H / 2 - 50);

    // 开始按钮
    const btnWidth = 140;
    const btnHeight = 50;
    const btnX = W / 2 - btnWidth / 2;
    const btnY = H / 2 + 200;

    ctx.fillStyle = '#00d084';
    ctx.shadowColor = '#00d084';
    ctx.shadowBlur = 15;
    roundRect(ctx, btnX, btnY, btnWidth, btnHeight, 25);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('开始游戏', W / 2, btnY + 32);

    game.startBtnArea = {
      x: btnX,
      y: btnY,
      w: btnWidth,
      h: btnHeight
    };

  } else {
    // 有面板显示时，清空开始按钮区域
    game.startBtnArea = null;
  }

  drawCoinBadge(ctx, game, images);

  // 底部图标按钮区域
  const iconSize = 50;
  const iconY = H - 100;
  const icons = [
    { key: 'shop', color: '#fd79a8', text: '强化', img: images.iconShop, highlight: game.showShopPanel },
    { key: 'character', color: '#74b9ff', text: '角色', img: images.iconCharacter },
    { key: 'mode', color: '#ffdd57', text: '玩法', img: null, highlight: game.gameMode.showModeSelect },
    { key: 'job', color: jobConfig.colors[game.playerJob] || '#ff6b6b', text: '职业', img: null, highlight: game.showJobPanel },
    { key: 'leaderboard', color: '#55efc4', text: '排行', img: images.iconLeaderboard }
  ];
  const btnCount = icons.length;
  const totalBtnWidth = btnCount * iconSize;
  const totalGap = W - totalBtnWidth;
  const gap = totalGap / (btnCount + 1);

  game.bottomBtnArea = {};
  icons.forEach((icon, i) => {
    const x = gap + i * (iconSize + gap);
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

  // 根据状态显示面板
  if (game.showCharacterPanel) {
    drawCharacterSelect(ctx, game, characterConfig);
  } else if (game.showJobPanel) {
    drawJobSelect(ctx, game, jobConfig);
  } else if (game.showShopPanel) {
    drawShopPanel(ctx, game, images, W, H);
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
  const x = game.W - 126;
  const y = 24;
  const w = 102;
  const h = 34;

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
  const panelH = Math.min(H - 120, 470);
  const panelX = (W - panelW) / 2;
  const panelY = 88;
  const contentX = panelX + 18;
  const contentW = panelW - 36;
  const progress = game.progression || progressionSystem.getDefaultProgress();
  const upgrades = progressionSystem.getUpgradeCatalog(progress);

  game.shopItemAreas = [];
  game.shopCloseBtnArea = null;

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
  ctx.fillText('强化工坊', W / 2, panelY + 34);

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

  const startY = panelY + 100;
  const cardH = 44;
  const gap = 8;
  const maxCards = Math.min(upgrades.length, Math.floor((panelH - 122) / (cardH + gap)));

  for (let i = 0; i < maxCards; i++) {
    const upgrade = upgrades[i];
    const y = startY + i * (cardH + gap);
    const buyW = 78;
    const buyH = 28;
    const buyX = panelX + panelW - buyW - 16;
    const buyY = y + 8;

    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    roundRect(ctx, contentX, y, contentW, cardH, 14);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(upgrade.name + ' Lv.' + upgrade.level + '/' + upgrade.maxLevel, contentX + 12, y + 18);

    ctx.fillStyle = '#a5f3fc';
    ctx.font = '12px sans-serif';
    ctx.fillText(progressionSystem.formatUpgradeEffect(upgrade.id, upgrade.currentEffect), contentX + 12, y + 34);

    const buttonColor = upgrade.isMaxLevel ? '#636e72' : (upgrade.affordable ? '#00b894' : '#d63031');
    ctx.fillStyle = buttonColor;
    roundRect(ctx, buyX, buyY, buyW, buyH, 14);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      upgrade.isMaxLevel ? '满级' : upgrade.cost + ' 金币',
      buyX + buyW / 2,
      buyY + 19
    );

    game.shopItemAreas.push({
      upgradeId: upgrade.id,
      x: buyX,
      y: buyY,
      w: buyW,
      h: buyH
    });
  }

  ctx.restore();
}

/**
 * 绘制当前选中的角色和职业
 */
function drawCurrentCharacter(ctx, game, characterConfig, jobConfig) {
  const { W, H, playerJob } = game;
  const charName = characterConfig.current;
  const charDisplayName = characterConfig.names[charName] || charName;
  const frames = characterConfig.frames[charName];

  // 角色显示区域
  const charBoxWidth = 120;
  const charBoxHeight = 140;
  const charBoxX = W / 2 - charBoxWidth - 10;
  const charBoxY = H / 2;

  // 职业显示区域
  const jobBoxWidth = 120;
  const jobBoxHeight = 140;
  const jobBoxX = W / 2 + 10;
  const jobBoxY = H / 2;

  // 绘制角色框背景
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.strokeStyle = 'rgba(255, 221, 87, 0.5)';
  ctx.lineWidth = 2;
  roundRect(ctx, charBoxX, charBoxY, charBoxWidth, charBoxHeight, 10);
  ctx.fill();
  ctx.stroke();

  // 绘制角色图片
  if (frames && frames[0] && frames[0].width > 0) {
    ctx.drawImage(frames[0], charBoxX + 28, charBoxY + 15, 64, 64);
  }

  // 绘制角色名称
  ctx.fillStyle = '#ffdd57';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(charDisplayName, charBoxX + charBoxWidth / 2, charBoxY + 100);

  // 绘制职业框背景
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.strokeStyle = 'rgba(255, 107, 107, 0.5)';
  ctx.lineWidth = 2;
  roundRect(ctx, jobBoxX, jobBoxY, jobBoxWidth, jobBoxHeight, 10);
  ctx.fill();
  ctx.stroke();

  // 绘制职业图标
  ctx.fillStyle = jobConfig.colors[playerJob] || '#ff6b6b';
  ctx.beginPath();
  ctx.arc(jobBoxX + jobBoxWidth / 2, jobBoxY + 40, 25, 0, Math.PI * 2);
  ctx.fill();

  // 绘制职业名称
  ctx.fillStyle = '#ffdd57';
  ctx.font = '16px sans-serif';
  ctx.fillText(playerJob, jobBoxX + jobBoxWidth / 2, jobBoxY + 100);
  ctx.textAlign = 'left';
}

module.exports = {
  drawStartScreen,
  drawCurrentCharacter
};
