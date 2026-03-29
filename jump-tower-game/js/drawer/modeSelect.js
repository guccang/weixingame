/**
 * 模式选择面板绘制
 */

const { roundRect } = require('./helper');
const { GAME_MODES, TIME_ATTACK_OPTIONS } = require('../game/constants');
const { landmarks } = require('../game/landmarks');

/**
 * 绘制模式选择面板
 */
function drawModeSelect(ctx, game, W, H) {
  // 半透明遮罩
  ctx.fillStyle = 'rgba(10,10,46,0.92)';
  ctx.fillRect(0, 0, W, H);

  // 标题
  ctx.fillStyle = '#ffdd57';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(255,221,87,0.6)';
  ctx.shadowBlur = 15;
  ctx.fillText('选择模式', W / 2, H / 2 - 180);
  ctx.shadowBlur = 0;

  // 模式按钮配置
  const modes = [
    { name: GAME_MODES.ENDLESS, label: '无尽模式', desc: '无尽攀爬，挑战极限', color: '#00d084' },
    { name: GAME_MODES.CHALLENGE, label: '闯关模式', desc: '名胜古迹，逐一征服', color: '#ff6b6b' },
    { name: GAME_MODES.TIME_ATTACK, label: '竞速模式', desc: '限时挑战，高度为王', color: '#74b9ff' }
  ];

  const btnWidth = 260;
  const btnHeight = 70;
  const spacing = 90;
  const startX = W / 2 - btnWidth / 2;
  const startY = H / 2 - 100;

  game.modeBtnArea = {};

  modes.forEach((mode, i) => {
    const y = startY + i * spacing;

    // 按钮背景
    ctx.fillStyle = mode.color;
    roundRect(ctx, startX, y, btnWidth, btnHeight, 15);
    ctx.fill();

    // 按钮文字
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(mode.label, W / 2, y + 28);
    ctx.font = '14px sans-serif';
    ctx.fillText(mode.desc, W / 2, y + 50);

    // 记录按钮区域
    game.modeBtnArea[mode.name] = { x: startX, y, w: btnWidth, h: btnHeight };
  });

  // 绘制关闭按钮
  const closeBtnSize = 44;
  const closeX = W / 2 - closeBtnSize / 2;
  const closeY = H / 2 + 180;
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  roundRect(ctx, closeX, closeY, closeBtnSize, closeBtnSize, 10);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '24px sans-serif';
  ctx.fillText('×', W / 2, closeY + 32);
  game.closeModeSelect = { x: closeX, y: closeY, w: closeBtnSize, h: closeBtnSize };
}

/**
 * 绘制时间选择面板
 */
function drawTimeSelect(ctx, game, W, H) {
  ctx.fillStyle = 'rgba(10,10,46,0.92)';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#ffdd57';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(255,221,87,0.6)';
  ctx.shadowBlur = 15;
  ctx.fillText('选择时间', W / 2, H / 2 - 160);
  ctx.shadowBlur = 0;

  const btnWidth = 200;
  const btnHeight = 55;
  const spacing = 68;
  const startX = W / 2 - btnWidth / 2;
  const startY = H / 2 - 100;

  game.timeBtnArea = [];

  TIME_ATTACK_OPTIONS.forEach((option, i) => {
    const y = startY + i * spacing;

    ctx.fillStyle = '#74b9ff';
    roundRect(ctx, startX, y, btnWidth, btnHeight, 12);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(option.label, W / 2, y + 35);

    game.timeBtnArea.push({ x: startX, y, w: btnWidth, h: btnHeight, value: option.value });
  });

  // 返回按钮
  const backBtnSize = 44;
  const backX = W / 2 - backBtnSize / 2;
  const backY = H / 2 + 200;
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  roundRect(ctx, backX, backY, backBtnSize, backBtnSize, 10);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '20px sans-serif';
  ctx.fillText('←', W / 2, backY + 30);
  game.backToModeSelect = { x: backX, y: backY, w: backBtnSize, h: backBtnSize };
}

/**
 * 绘制地标选择面板
 */
function drawLandmarkSelect(ctx, game, W, H) {
  ctx.fillStyle = 'rgba(10,10,46,0.92)';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#ffdd57';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(255,221,87,0.6)';
  ctx.shadowBlur = 15;
  ctx.fillText('选择目的地', W / 2, 100);
  ctx.shadowBlur = 0;

  const cols = 2;
  const cardWidth = 150;
  const cardHeight = 180;
  const gap = 20;
  const totalWidth = cols * cardWidth + (cols - 1) * gap;
  const startX = (W - totalWidth) / 2;
  const startY = 150;

  game.landmarkBtnArea = [];

  landmarks.forEach((landmark, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (cardWidth + gap);
    const y = startY + row * (cardHeight + gap);

    // 卡片背景
    const themeColor = landmark.theme.accentColor;
    ctx.fillStyle = themeColor;
    roundRect(ctx, x, y, cardWidth, cardHeight, 15);
    ctx.fill();

    // 地标名称
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(landmark.name, x + cardWidth / 2, y + 50);

    // 目标高度
    ctx.font = '16px sans-serif';
    ctx.fillText('目标: ' + landmark.targetHeight + 'm', x + cardWidth / 2, y + 90);

    // 描述
    ctx.font = '12px sans-serif';
    ctx.fillText(landmark.desc, x + cardWidth / 2, y + 130);

    // 难度指示
    const difficulty = Math.floor(landmark.targetHeight / 500);
    ctx.font = '14px sans-serif';
    ctx.fillText('难度: ' + '★'.repeat(difficulty), x + cardWidth / 2, y + 160);

    game.landmarkBtnArea.push({ x, y, w: cardWidth, h: cardHeight, landmark });
  });

  // 返回按钮
  const backBtnSize = 44;
  const backX = W / 2 - backBtnSize / 2;
  const backY = H - 100;
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  roundRect(ctx, backX, backY, backBtnSize, backBtnSize, 10);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '20px sans-serif';
  ctx.fillText('←', W / 2, backY + 30);
  game.backToModeSelect = { x: backX, y: backY, w: backBtnSize, h: backBtnSize };
}

module.exports = {
  drawModeSelect,
  drawTimeSelect,
  drawLandmarkSelect
};
