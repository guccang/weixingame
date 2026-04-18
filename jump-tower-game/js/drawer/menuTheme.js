const { fillRoundRect, strokeRoundRect } = require('./helper');

const FONT_STACK = "'PingFang SC', 'Microsoft YaHei', sans-serif";

function font(size, weight) {
  return (weight || '400') + ' ' + size + 'px ' + FONT_STACK;
}

function createGradient(ctx, x1, y1, x2, y2, stops) {
  const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
  for (let i = 0; i < stops.length; i++) {
    gradient.addColorStop(stops[i][0], stops[i][1]);
  }
  return gradient;
}

function drawGlowOrb(ctx, x, y, radius, colors) {
  if (!radius || radius <= 0) return;
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(0.45, colors[1]);
  gradient.addColorStop(1, colors[2]);
  ctx.save();
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSceneBackdrop(ctx, W, H) {
  ctx.save();
  ctx.fillStyle = createGradient(ctx, 0, 0, W, H, [
    [0, 'rgba(11, 17, 22, 0.92)'],
    [0.48, 'rgba(18, 28, 34, 0.90)'],
    [1, 'rgba(8, 11, 14, 0.96)']
  ]);
  ctx.fillRect(0, 0, W, H);

  drawGlowOrb(ctx, W * 0.82, H * 0.14, Math.max(W, H) * 0.28, [
    'rgba(176, 215, 206, 0.18)',
    'rgba(130, 169, 160, 0.08)',
    'rgba(130, 169, 160, 0)'
  ]);
  drawGlowOrb(ctx, W * 0.18, H * 0.28, Math.max(W, H) * 0.24, [
    'rgba(224, 206, 183, 0.16)',
    'rgba(224, 206, 183, 0.07)',
    'rgba(224, 206, 183, 0)'
  ]);
  drawGlowOrb(ctx, W * 0.56, H * 0.76, Math.max(W, H) * 0.22, [
    'rgba(169, 189, 155, 0.12)',
    'rgba(169, 189, 155, 0.05)',
    'rgba(169, 189, 155, 0)'
  ]);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.045)';
  ctx.lineWidth = 1;
  const grid = Math.max(36, Math.floor(Math.min(W, H) / 10));
  for (let x = -grid; x <= W + grid; x += grid) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + H * 0.15, H);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += grid) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  ctx.fillStyle = createGradient(ctx, 0, 0, 0, H, [
    [0, 'rgba(255, 255, 255, 0.05)'],
    [0.18, 'rgba(255, 255, 255, 0.015)'],
    [1, 'rgba(0, 0, 0, 0.3)']
  ]);
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function drawGlassPanel(ctx, x, y, w, h, options) {
  const opts = options || {};
  const radius = opts.radius || 24;
  const stroke = opts.stroke || 'rgba(232, 240, 236, 0.18)';
  const glow = opts.glow || 'rgba(168, 191, 183, 0.10)';
  const stops = opts.stops || [
    [0, 'rgba(22, 30, 36, 0.78)'],
    [1, 'rgba(12, 17, 21, 0.64)']
  ];

  ctx.save();
  ctx.shadowColor = glow;
  ctx.shadowBlur = opts.shadowBlur || 18;
  ctx.fillStyle = createGradient(ctx, x, y, x, y + h, stops);
  fillRoundRect(ctx, x, y, w, h, radius);
  ctx.shadowBlur = 0;

  const sheenHeight = Math.max(22, h * 0.42);
  ctx.fillStyle = createGradient(ctx, x, y, x + w, y + sheenHeight, [
    [0, 'rgba(255, 255, 255, 0.08)'],
    [0.45, 'rgba(255, 255, 255, 0.03)'],
    [1, 'rgba(255, 255, 255, 0.01)']
  ]);
  fillRoundRect(ctx, x + 1, y + 1, w - 2, sheenHeight, Math.max(14, radius - 2));

  ctx.strokeStyle = stroke;
  ctx.lineWidth = opts.lineWidth || 1.5;
  strokeRoundRect(ctx, x, y, w, h, radius);

  if (opts.innerStroke) {
    ctx.strokeStyle = opts.innerStroke;
    ctx.lineWidth = 1;
    strokeRoundRect(ctx, x + 6, y + 6, w - 12, h - 12, Math.max(10, radius - 6));
  }
  ctx.restore();
}

function drawBadge(ctx, x, y, text, options) {
  const opts = options || {};
  ctx.save();
  ctx.font = opts.font || font(12, '600');
  const paddingX = opts.paddingX || 14;
  const width = opts.width || Math.ceil(ctx.measureText(text).width + paddingX * 2 + (opts.dotColor ? 16 : 0));
  const height = opts.height || 30;

  drawGlassPanel(ctx, x, y, width, height, {
    radius: height / 2,
    shadowBlur: 10,
    glow: opts.glow || 'rgba(167, 194, 184, 0.10)',
    stops: opts.stops || [
      [0, 'rgba(24, 34, 40, 0.66)'],
      [1, 'rgba(14, 19, 23, 0.58)']
    ],
    stroke: opts.stroke || 'rgba(232, 240, 236, 0.14)'
  });

  let textX = x + width / 2;  // 居中
  if (opts.dotColor) {
    ctx.fillStyle = opts.dotColor;
    ctx.beginPath();
    ctx.arc(x + paddingX, y + height / 2, 4, 0, Math.PI * 2);
    ctx.fill();
    textX = x + paddingX + 12;  // 如果有圆点，文字在圆点后面
  }

  ctx.fillStyle = opts.color || '#edf6f7';
  ctx.textAlign = opts.dotColor ? 'left' : 'center';  // 有圆点时左对齐，否则居中
  ctx.textBaseline = 'middle';
  ctx.fillText(text, textX, y + height / 2 + 1);
  ctx.restore();

  return { x: x, y: y, w: width, h: height };
}

function drawMetricCard(ctx, x, y, w, h, label, value, options) {
  const opts = options || {};
  drawGlassPanel(ctx, x, y, w, h, {
    radius: opts.radius || 18,
    shadowBlur: 10,
    glow: opts.glow || 'rgba(167, 194, 184, 0.08)',
    stops: opts.stops || [
      [0, 'rgba(22, 30, 35, 0.72)'],
      [1, 'rgba(12, 17, 20, 0.60)']
    ],
    stroke: opts.stroke || 'rgba(232, 240, 236, 0.12)'
  });

  ctx.save();
  ctx.fillStyle = opts.labelColor || 'rgba(228, 236, 232, 0.70)';
  ctx.font = opts.labelFont || font(11, '500');
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(label, x + 14, y + 12);

  ctx.fillStyle = opts.valueColor || '#f8fbfa';
  ctx.font = opts.valueFont || font(20, '700');
  ctx.fillText(value, x + 14, y + 30);
  ctx.restore();
}

function drawActionButton(ctx, x, y, w, h, label, options) {
  const opts = options || {};
  const radius = opts.radius || Math.floor(h / 2);

  ctx.save();
  ctx.shadowColor = opts.shadowColor || 'rgba(190, 207, 198, 0.16)';
  ctx.shadowBlur = opts.shadowBlur || 14;
  ctx.fillStyle = createGradient(ctx, x, y, x + w, y + h, opts.stops || [
    [0, '#dde9e1'],
    [0.55, '#bed4ca'],
    [1, '#9eb5ad']
  ]);
  fillRoundRect(ctx, x, y, w, h, radius);
  ctx.shadowBlur = 0;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  fillRoundRect(ctx, x + 2, y + 2, w - 4, Math.max(14, h * 0.48), Math.max(10, radius - 4));

  ctx.fillStyle = opts.textColor || '#172126';
  ctx.font = opts.font || font(18, '700');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2 + 1);
  ctx.restore();
}

function drawIconTile(ctx, x, y, w, h, iconText, label, options) {
  const opts = options || {};
  const active = !!opts.active;
  drawGlassPanel(ctx, x, y, w, h, {
    radius: opts.radius || 24,
    shadowBlur: active ? 14 : 8,
    glow: active ? (opts.activeGlow || 'rgba(178, 203, 193, 0.12)') : 'rgba(0, 0, 0, 0.04)',
    stops: active ? [
      [0, 'rgba(34, 45, 44, 0.74)'],
      [1, 'rgba(19, 24, 24, 0.64)']
    ] : [
      [0, 'rgba(24, 30, 33, 0.56)'],
      [1, 'rgba(14, 18, 20, 0.48)']
    ],
    stroke: active ? 'rgba(221, 235, 228, 0.24)' : 'rgba(255, 255, 255, 0.08)'
  });

  ctx.save();
  ctx.fillStyle = active ? (opts.activeAccent || '#dcefe8') : (opts.iconColor || '#d6e3e5');
  ctx.font = font(opts.iconSize || 24, '700');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(iconText, x + w / 2, y + h / 2 - 10);

  ctx.fillStyle = active ? '#f8fbfa' : 'rgba(223, 232, 232, 0.82)';
  ctx.font = font(opts.labelSize || 11, '600');
  ctx.fillText(label, x + w / 2, y + h - 16);
  ctx.restore();
}

function drawModalScrim(ctx, W, H) {
  ctx.save();
  ctx.fillStyle = 'rgba(3, 8, 18, 0.62)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = createGradient(ctx, 0, 0, 0, H, [
    [0, 'rgba(0, 0, 0, 0.08)'],
    [0.5, 'rgba(7, 14, 30, 0.22)'],
    [1, 'rgba(0, 0, 0, 0.3)']
  ]);
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function drawCloseButton(ctx, x, y, size, options) {
  const opts = options || {};
  drawGlassPanel(ctx, x, y, size, size, {
    radius: Math.floor(size / 2),
    shadowBlur: 10,
    glow: opts.glow || 'rgba(255, 127, 127, 0.12)',
    stops: opts.stops || [
      [0, 'rgba(36, 47, 67, 0.92)'],
      [1, 'rgba(17, 24, 38, 0.88)']
    ],
    stroke: opts.stroke || 'rgba(255, 255, 255, 0.12)'
  });

  ctx.save();
  ctx.strokeStyle = opts.color || '#f3f7ff';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  const padding = size * 0.33;
  ctx.beginPath();
  ctx.moveTo(x + padding, y + padding);
  ctx.lineTo(x + size - padding, y + size - padding);
  ctx.moveTo(x + size - padding, y + padding);
  ctx.lineTo(x + padding, y + size - padding);
  ctx.stroke();
  ctx.restore();
}

module.exports = {
  FONT_STACK,
  font,
  createGradient,
  drawGlowOrb,
  drawSceneBackdrop,
  drawGlassPanel,
  drawBadge,
  drawMetricCard,
  drawActionButton,
  drawIconTile,
  drawModalScrim,
  drawCloseButton
};
