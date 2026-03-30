/**
 * 角色选择绘制模块
 */

const { roundRect } = require('./helper');

/**
 * 绘制角色选择区域
 */
function drawCharacterSelect(ctx, game, characterConfig) {
  const { W, H } = game;
  const list = characterConfig.list;
  const listCount = list.length;
  const time = Date.now();

  // 呼吸效果
  const breathe = Math.sin(time * 0.003) * 0.5 + 0.5;

  // 计算布局 - 屏幕中间
  const selectWidth = 120;
  const selectHeight = 140;
  const spacing = 20;
  const totalWidth = listCount * selectWidth + (listCount - 1) * spacing;
  const startX = (W - totalWidth) / 2;
  const selectY = H * 0.35;

  // 绘制标题 "角色列表"
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('角色列表', W / 2, selectY - 40);

  // 绘制角色卡片
  for (let i = 0; i < listCount; i++) {
    const charName = list[i];
    const x = startX + i * (selectWidth + spacing);
    const y = selectY;
    const isSelected = characterConfig.current === charName;

    // 卡片背景（统一深色背景）
    ctx.fillStyle = 'rgba(30, 30, 60, 0.9)';
    roundRect(ctx, x, y, selectWidth, selectHeight, 8);

    // 选中状态：只加黄色边缘 + 呼吸发光
    if (isSelected) {
      ctx.save();
      ctx.shadowColor = '#ffdd57';
      ctx.shadowBlur = 10 + breathe * 15;
      ctx.strokeStyle = '#ffdd57';
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

    // 角色图片
    const frames = characterConfig.frames[charName];
    if (frames && frames[0] && frames[0].width > 0) {
      ctx.drawImage(frames[0], x + 28, y + 15, 64, 64);
    }

    // 角色名字（居中）
    ctx.fillStyle = isSelected ? '#ffdd57' : '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(characterConfig.names[charName] || charName, x + selectWidth / 2, y + selectHeight - 20);
  }

  // 绘制关闭按钮 (X) - 在底部导航上方
  const closeBtnSize = 40;
  const closeBtnX = W / 2 - closeBtnSize / 2;
  const closeBtnY = H - 160; // 底部导航在 H - 100，关闭按钮在其上方

  // 保存关闭按钮区域
  game.closeCharacterPanel = { x: closeBtnX, y: closeBtnY, w: closeBtnSize, h: closeBtnSize };

  // 绘制圆形背景
  ctx.fillStyle = 'rgba(255, 107, 107, 0.8)';
  ctx.beginPath();
  ctx.arc(closeBtnX + closeBtnSize / 2, closeBtnY + closeBtnSize / 2, closeBtnSize / 2, 0, Math.PI * 2);
  ctx.fill();

  // 绘制 X
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  const padding = 12;
  ctx.beginPath();
  ctx.moveTo(closeBtnX + padding, closeBtnY + padding);
  ctx.lineTo(closeBtnX + closeBtnSize - padding, closeBtnY + closeBtnSize - padding);
  ctx.moveTo(closeBtnX + closeBtnSize - padding, closeBtnY + padding);
  ctx.lineTo(closeBtnX + padding, closeBtnY + closeBtnSize - padding);
  ctx.stroke();
  ctx.lineCap = 'butt';

  ctx.textAlign = 'left';
}

module.exports = {
  drawCharacterSelect
};
