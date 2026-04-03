/**
 * 场景金币绘制
 */

function drawCoins(ctx, coins, cameraY, levelGenerator, now) {
  if (!coins || !levelGenerator) return;

  for (let i = 0; i < coins.length; i++) {
    const coin = coins[i];
    if (!coin || coin.collected) continue;

    const pos = levelGenerator.getCoinPosition(coin, now);
    const sy = pos.y - cameraY;
    if (sy < -30 || sy > ctx.canvas.height + 30) continue;

    drawCoin(ctx, pos.x, sy, coin.radius || 10, coin.value || 1, now, coin.floatPhase || 0);
  }
}

function drawCoin(ctx, x, y, radius, value, now, phase) {
  const spin = 0.72 + Math.sin(now * 0.008 + phase) * 0.18;
  const rx = radius * spin;
  const glowRadius = radius * 1.8;

  ctx.save();
  const glow = ctx.createRadialGradient(x, y, radius * 0.2, x, y, glowRadius);
  glow.addColorStop(0, 'rgba(255, 244, 184, 0.9)');
  glow.addColorStop(0.55, 'rgba(255, 207, 84, 0.36)');
  glow.addColorStop(1, 'rgba(255, 207, 84, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowColor = 'rgba(255, 207, 84, 0.45)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#ffda6a';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, radius, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#f59f00';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, radius, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#fff8db';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(value > 1 ? String(value) : '$', x, y + 4);
  ctx.restore();
}

module.exports = {
  drawCoins
};
