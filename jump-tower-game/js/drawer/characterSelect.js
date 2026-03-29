/**
 * 角色选择绘制模块
 */

const { roundRect } = require('./helper');

/**
 * 绘制角色选择区域
 * @param {CanvasRenderingContext2D} ctx - canvas上下文
 * @param {Object} game - 游戏实例
 * @param {Object} characterConfig - 角色配置
 */
function drawCharacterSelect(ctx, game, characterConfig) {
  const { W, H } = game;
  const selectY = H / 2 + 80;
  const selectWidth = 120;
  const selectHeight = 140;
  const spacing = 140;
  const startX = W / 2 - spacing - selectWidth / 2;

  ctx.fillStyle = '#fff';
  ctx.font = '14px sans-serif';
  ctx.fillText('选择角色', W / 2, selectY - 20);

  for (let i = 0; i < characterConfig.list.length; i++) {
    const charName = characterConfig.list[i];
    const x = startX + i * spacing;
    const y = selectY;
    const isSelected = characterConfig.current === charName;

    if (isSelected) {
      ctx.fillStyle = 'rgba(255, 221, 87, 0.3)';
      ctx.strokeStyle = '#ffdd57';
      ctx.lineWidth = 3;
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
    }
    ctx.fillRect(x, y, selectWidth, selectHeight);
    ctx.strokeRect(x, y, selectWidth, selectHeight);

    const frames = characterConfig.frames[charName];
    if (frames && frames[0] && frames[0].width > 0) {
      ctx.drawImage(frames[0], x + 28, y + 10, 64, 64);
    }

    ctx.fillStyle = isSelected ? '#ffdd57' : '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(characterConfig.names[charName] || charName, x + selectWidth / 2, y + selectHeight - 20);
  }
}

module.exports = {
  drawCharacterSelect
};
