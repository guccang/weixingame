const { platform: platformPhysics } = require('../physics/physics');

function drawPickups(ctx, game, now) {
  if (!game) return;

  drawPlatformPickups(ctx, game.platforms || [], game.cameraY || 0, now);

  const floatingPickups = game.runDirector && typeof game.runDirector.getFloatingPickups === 'function'
    ? game.runDirector.getFloatingPickups()
    : [];
  drawFloatingPickups(ctx, floatingPickups, game.cameraY || 0, now);
}

function drawPlatformPickups(ctx, platforms, cameraY, now) {
  for (let i = 0; i < platforms.length; i++) {
    const platform = platforms[i];
    const pickup = platform && platform.pickup;
    if (!pickup || pickup.collected || !pickup.platform || pickup.platform.dead) continue;

    const px = platformPhysics.getMovingPlatformX(pickup.platform, now) + pickup.xOffset;
    const py = pickup.platform.y + pickup.yOffset + Math.sin(now * 0.004 + pickup.floatPhase) * 3;
    drawPickupEntity(ctx, pickup, px, py - cameraY, now);
  }
}

function drawFloatingPickups(ctx, floatingPickups, cameraY, now) {
  for (let i = 0; i < floatingPickups.length; i++) {
    const pickup = floatingPickups[i];
    if (!pickup || pickup.collected) continue;
    drawPickupEntity(ctx, pickup, pickup.x, pickup.y - cameraY, now);
  }
}

function drawPickupEntity(ctx, pickup, px, sy, now) {
  if (sy < -60 || sy > ctx.canvas.height + 60) return;

  const radius = pickup.radius * (0.95 + Math.sin(now * 0.006 + pickup.floatPhase) * 0.05);
  ctx.save();

  if (pickup.sourceType === 'bossProjectile') {
    ctx.strokeStyle = withAlpha(pickup.color, 0.34);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, sy - radius - 6);
    ctx.lineTo(px, sy - radius - 24);
    ctx.stroke();
  }

  ctx.shadowColor = pickup.color;
  ctx.shadowBlur = pickup.negative ? 12 : 16;

  if (pickup.negative) {
    drawDiamond(ctx, px, sy, radius, pickup.color, pickup.accentColor);
  } else {
    drawOrb(ctx, px, sy, radius, pickup.color, pickup.accentColor);
  }

  ctx.shadowBlur = 0;
  ctx.fillStyle = pickup.negative ? '#fff4ec' : '#ffffff';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(pickup.symbol || '?', px, sy + 4);
  ctx.restore();
}

function drawOrb(ctx, x, y, radius, color, accentColor) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = accentColor || '#ffffff';
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.arc(x - radius * 0.2, y - radius * 0.25, radius * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawDiamond(ctx, x, y, radius, color, accentColor) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - radius);
  ctx.lineTo(x + radius, y);
  ctx.lineTo(x, y + radius);
  ctx.lineTo(x - radius, y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = accentColor || '#ffffff';
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.moveTo(x, y - radius * 0.65);
  ctx.lineTo(x + radius * 0.45, y);
  ctx.lineTo(x, y + radius * 0.25);
  ctx.lineTo(x - radius * 0.45, y);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
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
  drawPickups
};
