/**
 * 平台绘制模块
 * 使用表格配置的平台图片皮肤
 */

const { roundRect } = require('./helper');
const { platform: platformPhysics } = require('../physics/physics');
const platformConfig = require('../platform/platformConfig');

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

    // 尝试使用图片绘制
    const img = platformConfig.getImage(p.skinId);
    if (img && img.complete && img.width > 0) {
      // 使用图片绘制
      ctx.drawImage(img, px, sy, p.w, p.h);

      // boost 类型添加中心方块发光特效（呼吸感）
      if (p.type === 'boost') {
        const time = Date.now() * 0.005;
        const breathe = 0.5 + 0.5 * Math.sin(time); // 0~1 呼吸效果
        const glowIntensity = 15 + breathe * 20; // 15~35
        const alpha = 0.15 + breathe * 0.15; // 0.15~0.3

        // 中心发光方块（比原图小一些，位置中央偏上）
        const margin = p.w * 0.15; // 缩小15%
        const innerX = px + margin;
        const innerY = sy + p.h * 0.1; // 靠上位置
        const innerW = p.w - margin * 2;
        const innerH = p.h * 0.5;

        ctx.shadowColor = '#ffdd57';
        ctx.shadowBlur = glowIntensity;
        ctx.fillStyle = `rgba(255, 221, 87, ${alpha})`;
        ctx.fillRect(innerX, innerY, innerW, innerH);
        ctx.shadowBlur = 0;
      }
    } else {
      // 回退到颜色绘制
      drawWithGradient(ctx, p, px, sy);
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    drawPlatformDecorators(ctx, p, px, sy);

    if (p.falling && p.va) {
      ctx.restore();
    }

    if (p.mushroom && !p.mushroom.collected && !p.dead) {
      drawMushroom(ctx, p, px, sy);
    }
  }
}

function drawPlatformDecorators(ctx, platform, px, sy) {
  if (platform.themeColor) {
    ctx.fillStyle = withAlpha(platform.themeColor, 0.18);
    ctx.fillRect(px, sy + platform.h - 4, platform.w, 4);
  }

  if (platform.specialType === 'charge') {
    ctx.save();
    ctx.shadowColor = '#55efc4';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#55efc4';
    ctx.beginPath();
    ctx.arc(px + platform.w / 2, sy + platform.h * 0.38, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (platform.specialType === 'resonance') {
    const color = platform.resonanceColor || '#ffd166';
    ctx.save();
    ctx.fillStyle = color;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(px + platform.w / 2 - 14 + i * 14, sy + 7, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  if (platform.specialType === 'risk') {
    ctx.save();
    ctx.fillStyle = '#ff7675';
    ctx.beginPath();
    ctx.moveTo(px + 10, sy + 4);
    ctx.lineTo(px + 18, sy + 16);
    ctx.lineTo(px + 2, sy + 16);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawMushroom(ctx, platform, px, sy) {
  const mushroomX = px + platform.mushroom.xOffset;
  const mushroomY = sy + platform.mushroom.yOffset;
  const capW = platform.mushroom.w;
  const capH = platform.mushroom.h * 0.6;
  const stemW = capW * 0.35;
  const stemH = platform.mushroom.h * 0.55;

  ctx.save();
  ctx.shadowColor = 'rgba(255, 77, 79, 0.5)';
  ctx.shadowBlur = 12;

  ctx.fillStyle = '#fff5e6';
  ctx.fillRect(
    mushroomX + (capW - stemW) / 2,
    mushroomY + capH - 2,
    stemW,
    stemH
  );

  ctx.fillStyle = '#ff4d4f';
  ctx.beginPath();
  ctx.ellipse(mushroomX + capW / 2, mushroomY + capH, capW / 2, capH, 0, Math.PI, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(mushroomX + capW * 0.35, mushroomY + capH * 0.9, 3, 0, Math.PI * 2);
  ctx.arc(mushroomX + capW * 0.6, mushroomY + capH * 0.7, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * 使用颜色渐变绘制平台（回退方案）
 */
function drawWithGradient(ctx, p, px, sy) {
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
    // normal 和其他类型
    const g = ctx.createLinearGradient(px, sy, px, sy + p.h);
    g.addColorStop(0, '#74b9ff');
    g.addColorStop(1, '#0984e3');
    ctx.fillStyle = g;
    ctx.shadowColor = '#74b9ff';
    ctx.shadowBlur = 8;
    roundRect(ctx, px, sy, p.w, p.h, 4);
  }
}

function withAlpha(hexColor, alpha) {
  const normalized = (hexColor || '').replace('#', '');
  if (normalized.length !== 6) {
    return `rgba(255,255,255,${alpha})`;
  }
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

module.exports = {
  drawPlatforms
};
