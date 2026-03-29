/**
 * 职业选择绘制模块
 */

const { roundRect } = require('./helper');

/**
 * 绘制职业选择面板
 * @param {CanvasRenderingContext2D} ctx - canvas上下文
 * @param {Object} game - 游戏实例
 * @param {Object} jobConfig - 职业配置
 */
function drawJobSelect(ctx, game, jobConfig) {
  const { W, H } = game;
  const selectY = H / 2 + 80;
  const selectWidth = 100;
  const selectHeight = 80;
  const spacing = 120;
  const startX = W / 2 - (jobConfig.list.length * spacing) / 2;

  ctx.fillStyle = '#fff';
  ctx.font = '14px sans-serif';
  ctx.fillText('选择职业', W / 2, selectY - 20);

  for (let i = 0; i < jobConfig.list.length; i++) {
    const jobName = jobConfig.list[i];
    const x = startX + i * spacing;
    const y = selectY;
    const isSelected = jobConfig.current === jobName;

    if (isSelected) {
      ctx.fillStyle = 'rgba(255, 107, 107, 0.3)';
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 3;
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
    }
    roundRect(ctx, x, y, selectWidth, selectHeight, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = jobConfig.colors[jobName] || '#ff6b6b';
    ctx.beginPath();
    ctx.arc(x + selectWidth / 2, y + 25, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isSelected ? '#ffdd57' : '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(jobName, x + selectWidth / 2, y + selectHeight - 15);
  }
}

module.exports = {
  drawJobSelect
};
