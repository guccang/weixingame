/**
 * 粒子绘制模块
 */

/**
 * 绘制粒子
 * @param {CanvasRenderingContext2D} ctx - canvas上下文
 * @param {Array} particles - 粒子数组
 * @param {number} cameraY - 相机Y偏移
 */
function drawParticles(ctx, particles, cameraY) {
  for (let p of particles) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y - cameraY, p.r * p.life, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

module.exports = {
  drawParticles
};
