/**
 * 职业选择绘制模块
 */

const { roundRect } = require('./helper');
const { drawCloseButton } = require('./menuTheme');

/**
 * 绘制职业选择面板
 */
function drawJobSelect(ctx, game, jobConfig) {
  const { W, H } = game;
  const list = jobConfig.list;
  const listCount = list.length;
  const time = Date.now();

  // 呼吸效果
  const breathe = Math.sin(time * 0.003) * 0.5 + 0.5;

  // 布局参数
  const cols = 2;
  const selectWidth = 100;
  const selectHeight = 90;
  const spacingX = 30;
  const spacingY = 20;
  const totalWidth = cols * selectWidth + (cols - 1) * spacingX;
  const startX = (W - totalWidth) / 2;
  const selectY = H * 0.25;

  // 绘制标题 "职业列表"
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('职业列表', W / 2, selectY - 40);

  // 绘制职业卡片
  for (let i = 0; i < listCount; i++) {
    const jobName = list[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (selectWidth + spacingX);
    const y = selectY + row * (selectHeight + spacingY);
    const isSelected = game.playerJob === jobName;
    const jobColor = jobConfig.colors[jobName] || '#ff6b6b';

    // 卡片背景（统一深色）
    ctx.fillStyle = 'rgba(30, 30, 60, 0.9)';
    roundRect(ctx, x, y, selectWidth, selectHeight, 8);

    // 选中状态：只加边缘发光 + 呼吸效果
    if (isSelected) {
      ctx.save();
      ctx.shadowColor = jobColor;
      ctx.shadowBlur = 10 + breathe * 15;
      ctx.strokeStyle = jobColor;
      ctx.lineWidth = 3;
      roundRect(ctx, x, y, selectWidth, selectHeight, 8);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      roundRect(ctx, x, y, selectWidth, selectHeight, 8);
      ctx.stroke();
    }

    // 职业图标圆圈
    ctx.fillStyle = jobColor;
    ctx.beginPath();
    ctx.arc(x + selectWidth / 2, y + 30, 20, 0, Math.PI * 2);
    ctx.fill();

    // 职业名字（居中）
    ctx.fillStyle = isSelected ? jobColor : '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(jobName, x + selectWidth / 2, y + selectHeight - 15);
  }

  // 绘制关闭按钮 (X) - 统一放到右上角
  const closeBtnSize = 36;
  const closeBtnX = W - closeBtnSize - 18;
  const closeBtnY = 22;

  // 保存关闭按钮区域
  game.closeJobPanel = { x: closeBtnX, y: closeBtnY, w: closeBtnSize, h: closeBtnSize };
  drawCloseButton(ctx, closeBtnX, closeBtnY, closeBtnSize, {
    glow: 'rgba(255, 127, 127, 0.12)'
  });

  ctx.textAlign = 'left';
}

module.exports = {
  drawJobSelect
};
