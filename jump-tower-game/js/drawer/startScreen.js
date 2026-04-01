/**
 * 开始界面绘制模块
 */

const { roundRect } = require('./helper');
const { drawBackground } = require('./background');
const { drawCharacterSelect } = require('./characterSelect');
const { drawJobSelect } = require('./jobSelect');
const { drawModeSelect, drawTimeSelect, drawLandmarkSelect } = require('./modeSelect');
const { drawLeaderboardPanel } = require('./leaderboard');

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
  if (!game.showCharacterPanel && !game.showJobPanel && !game.gameMode.showModeSelect && !game.gameMode.showTimeSelect && !game.gameMode.showLandmarkSelect) {
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

    // 【临时测试】Boss测试按钮
    const testBtnWidth = 80;
    const testBtnHeight = 35;
    const testBtnX = W - testBtnWidth - 20;
    const testBtnY = 20;

    ctx.fillStyle = '#ff0066';
    ctx.shadowColor = '#ff0066';
    ctx.shadowBlur = 10;
    roundRect(ctx, testBtnX, testBtnY, testBtnWidth, testBtnHeight, 8);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('测试Boss', testBtnX + testBtnWidth / 2, testBtnY + 23);

    game.testBossBtnArea = {
      x: testBtnX,
      y: testBtnY,
      w: testBtnWidth,
      h: testBtnHeight
    };

    // 【临时测试】游戏中生成Boss按钮（在游戏进行中显示）
    game.testSpawnBossBtnArea = {
      x: W - 100,
      y: 80,
      w: 80,
      h: 35
    };
  } else {
    // 有面板显示时，清空开始按钮区域
    game.startBtnArea = null;
  }

  // 底部图标按钮区域
  const iconSize = 50;
  const iconY = H - 100;
  const icons = [
    { key: 'shop', color: '#fd79a8', text: '商店', img: images.iconShop },
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
