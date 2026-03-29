/**
 * 背景绘制模块
 */

const { roundRect } = require('./helper');

/**
 * 绘制背景
 * @param {CanvasRenderingContext2D} ctx - canvas上下文
 * @param {number} W - 屏幕宽度
 * @param {number} H - 屏幕高度
 * @param {number} cameraY - 相机Y偏移
 * @param {number} score - 当前分数
 * @param {Array} bgStars - 背景星星数组
 */
function drawBackground(ctx, W, H, cameraY, score, bgStars) {
  const heightRatio = Math.min(score / 2000, 1);
  const grad = ctx.createLinearGradient(0, 0, 0, H);

  if (heightRatio < 0.3) {
    grad.addColorStop(0, '#0a0a2e');
    grad.addColorStop(1, '#1a1a4e');
  } else if (heightRatio < 0.6) {
    grad.addColorStop(0, '#0d0d3d');
    grad.addColorStop(1, '#2d1b69');
  } else {
    grad.addColorStop(0, '#000020');
    grad.addColorStop(1, '#1a0a3e');
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // 绘制星星
  for (let s of bgStars) {
    s.twinkle += 0.02;
    const sy = (s.y - cameraY * 0.3) % (H * 10);
    const alpha = 0.5 + Math.sin(s.twinkle) * 0.5;
    ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
    ctx.beginPath();
    ctx.arc(s.x, sy % H, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 绘制高度标尺
  const startH = Math.floor((-cameraY) / 200) * 200;
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.font = '12px sans-serif';
  for (let h = startH; h < startH + H + 400; h += 200) {
    const sy = h + cameraY;
    if (sy > 0 && sy < H) {
      const meters = Math.floor((-h + H - 100) / 10);
      if (meters > 0) {
        ctx.fillText(meters + 'm', W - 50, sy);
        ctx.fillRect(0, sy, W, 1);
      }
    }
  }
}

module.exports = {
  drawBackground
};
