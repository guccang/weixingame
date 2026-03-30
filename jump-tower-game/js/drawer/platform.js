/**
 * 平台绘制模块
 */

const { roundRect } = require('./helper');
const { platform: platformPhysics } = require('../physics/physics');

/**
 * 绘制平台
 * @param {CanvasRenderingContext2D} ctx - canvas上下文
 * @param {Array} platforms - 平台数组
 * @param {number} cameraY - 相机Y偏移
 */
function drawPlatforms(ctx, platforms, cameraY) {
  for (let p of platforms) {
    const px = platformPhysics.getMovingPlatformX(p, Date.now());
    const sy = p.y - cameraY;
    if (sy < -20 || sy > ctx.canvas.height + 20) continue;

    // 被撞飞的平台应用旋转
    if (p.falling && p.va) {
      ctx.save();
      ctx.translate(px + p.w / 2, sy + p.h / 2);
      ctx.rotate(p.angle);
      ctx.translate(-(px + p.w / 2), -(sy + p.h / 2));
    }

    if (p.crumbling) {
      ctx.globalAlpha = 0.5;
    }

    if (p.type === 'ground') {
      const g = ctx.createLinearGradient(px, sy, px, sy + p.h);
      g.addColorStop(0, '#55efc4');
      g.addColorStop(1, '#00b894');
      ctx.fillStyle = g;
      ctx.shadowColor = '#55efc4';
      ctx.shadowBlur = 10;
      roundRect(ctx, px, sy, p.w, p.h, 4);
    } else if (p.type === 'boost') {
      const g = ctx.createLinearGradient(px, sy, px, sy + p.h);
      g.addColorStop(0, '#ffdd57');
      g.addColorStop(1, '#ffa502');
      ctx.fillStyle = g;
      ctx.shadowColor = '#ffdd57';
      ctx.shadowBlur = 15;
      roundRect(ctx, px, sy, p.w, p.h, 4);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('↑↑', px + p.w / 2 - 10, sy + 11);
    } else if (p.type === 'crumble') {
      ctx.fillStyle = '#b2bec3';
      ctx.shadowColor = '#636e72';
      ctx.shadowBlur = 5;
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(px + i * 30, sy + (i % 2) * 3, 25, p.h - (i % 2) * 3);
      }
    } else if (p.type === 'moving') {
      const g = ctx.createLinearGradient(px, sy, px, sy + p.h);
      g.addColorStop(0, '#a29bfe');
      g.addColorStop(1, '#6c5ce7');
      ctx.fillStyle = g;
      ctx.shadowColor = '#a29bfe';
      ctx.shadowBlur = 10;
      roundRect(ctx, px, sy, p.w, p.h, 4);
    } else {
      const g = ctx.createLinearGradient(px, sy, px, sy + p.h);
      g.addColorStop(0, '#74b9ff');
      g.addColorStop(1, '#0984e3');
      ctx.fillStyle = g;
      ctx.shadowColor = '#74b9ff';
      ctx.shadowBlur = 8;
      roundRect(ctx, px, sy, p.w, p.h, 4);
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    if (p.falling && p.va) {
      ctx.restore();
    }
  }
}

module.exports = {
  drawPlatforms
};
