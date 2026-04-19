var FONT_STACK = "'PingFang SC', 'Microsoft YaHei', sans-serif";

function editorFont(size, weight) {
  return (weight || '400') + ' ' + size + 'px ' + FONT_STACK;
}

function createGrad(ctx, x1, y1, x2, y2, stops) {
  var g = ctx.createLinearGradient(x1, y1, x2, y2);
  for (var i = 0; i < stops.length; i++) {
    g.addColorStop(stops[i][0], stops[i][1]);
  }
  return g;
}

function roundedRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function fillRoundRect(ctx, x, y, w, h, r) {
  roundedRectPath(ctx, x, y, w, h, r);
  ctx.fill();
}

function strokeRoundRect(ctx, x, y, w, h, r) {
  roundedRectPath(ctx, x, y, w, h, r);
  ctx.stroke();
}

function editorDrawGlassPanel(ctx, x, y, w, h, opts) {
  opts = opts || {};
  var radius = opts.radius || 24;
  var stroke = opts.stroke || 'rgba(232, 240, 236, 0.18)';
  var glow = opts.glow || 'rgba(168, 191, 183, 0.10)';
  var stops = opts.stops || [[0, 'rgba(22, 30, 36, 0.78)'], [1, 'rgba(12, 17, 21, 0.64)']];

  ctx.save();
  ctx.shadowColor = glow;
  ctx.shadowBlur = opts.shadowBlur || 18;
  ctx.fillStyle = createGrad(ctx, x, y, x, y + h, stops);
  fillRoundRect(ctx, x, y, w, h, radius);
  ctx.shadowBlur = 0;

  var sheenH = Math.max(22, h * 0.42);
  ctx.fillStyle = createGrad(ctx, x, y, x + w, y + sheenH, [
    [0, 'rgba(255,255,255,0.08)'], [0.45, 'rgba(255,255,255,0.03)'], [1, 'rgba(255,255,255,0.01)']
  ]);
  fillRoundRect(ctx, x + 1, y + 1, w - 2, sheenH, Math.max(14, radius - 2));

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

function editorDrawActionButton(ctx, x, y, w, h, label, opts) {
  opts = opts || {};
  var radius = opts.radius || Math.floor(h / 2);
  ctx.save();
  ctx.shadowColor = opts.shadowColor || 'rgba(190, 207, 198, 0.16)';
  ctx.shadowBlur = opts.shadowBlur || 14;
  ctx.fillStyle = createGrad(ctx, x, y, x + w, y + h, opts.stops || [
    [0, '#dde9e1'], [0.55, '#bed4ca'], [1, '#9eb5ad']
  ]);
  fillRoundRect(ctx, x, y, w, h, radius);
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  fillRoundRect(ctx, x + 2, y + 2, w - 4, Math.max(14, h * 0.48), Math.max(10, radius - 4));
  ctx.fillStyle = opts.textColor || '#172126';
  ctx.font = opts.font || editorFont(18, '700');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2 + 1);
  ctx.restore();
}

function editorDrawCloseButton(ctx, x, y, size, opts) {
  opts = opts || {};
  editorDrawGlassPanel(ctx, x, y, size, size, {
    radius: Math.floor(size / 2), shadowBlur: 10,
    glow: opts.glow || 'rgba(255,127,127,0.12)',
    stops: [[0, 'rgba(36,47,67,0.92)'], [1, 'rgba(17,24,38,0.88)']],
    stroke: opts.stroke || 'rgba(255,255,255,0.12)'
  });
  ctx.save();
  ctx.strokeStyle = '#f3f7ff';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  var p = size * 0.33;
  ctx.beginPath();
  ctx.moveTo(x + p, y + p); ctx.lineTo(x + size - p, y + size - p);
  ctx.moveTo(x + size - p, y + p); ctx.lineTo(x + p, y + size - p);
  ctx.stroke();
  ctx.restore();
}

function editorDrawBadge(ctx, x, y, text, opts) {
  opts = opts || {};
  ctx.save();
  ctx.font = opts.font || editorFont(12, '600');
  var pw = opts.paddingX || 14;
  var w = Math.ceil(ctx.measureText(text).width + pw * 2 + (opts.dotColor ? 16 : 0));
  var h = opts.height || 30;
  editorDrawGlassPanel(ctx, x, y, w, h, {
    radius: h / 2, shadowBlur: 10,
    glow: opts.glow, stops: opts.stops, stroke: opts.stroke
  });
  if (opts.dotColor) {
    ctx.fillStyle = opts.dotColor;
    ctx.beginPath(); ctx.arc(x + pw, y + h / 2, 4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = opts.color || '#edf6f7';
  ctx.textAlign = opts.dotColor ? 'left' : 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, opts.dotColor ? x + pw + 12 : x + w / 2, y + h / 2 + 1);
  ctx.restore();
  return { x: x, y: y, w: w, h: h };
}

function editorDrawIconTile(ctx, x, y, w, h, iconText, label, opts) {
  opts = opts || {};
  var active = !!opts.active;
  editorDrawGlassPanel(ctx, x, y, w, h, {
    radius: 24, shadowBlur: active ? 14 : 8,
    glow: active ? (opts.activeGlow || 'rgba(178,203,193,0.12)') : 'rgba(0,0,0,0.04)',
    stops: active ? [[0, 'rgba(34,45,44,0.74)'], [1, 'rgba(19,24,24,0.64)']]
      : [[0, 'rgba(24,30,33,0.56)'], [1, 'rgba(14,18,20,0.48)']],
    stroke: active ? 'rgba(221,235,228,0.24)' : 'rgba(255,255,255,0.08)'
  });
  ctx.save();
  ctx.fillStyle = active ? (opts.activeAccent || '#dcefe8') : (opts.iconColor || '#d6e3e5');
  ctx.font = editorFont(24, '700');
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(iconText, x + w / 2, y + h / 2 - 10);
  ctx.fillStyle = active ? '#f8fbfa' : 'rgba(223,232,232,0.82)';
  ctx.font = editorFont(opts.labelSize || 11, '600');
  ctx.fillText(label, x + w / 2, y + h - 16);
  ctx.restore();
}

function editorDrawMetricCard(ctx, x, y, w, h, label, value, opts) {
  opts = opts || {};
  editorDrawGlassPanel(ctx, x, y, w, h, {
    radius: opts.radius || 18, shadowBlur: 10,
    glow: opts.glow, stops: opts.stops, stroke: opts.stroke
  });
  ctx.save();
  ctx.fillStyle = opts.labelColor || 'rgba(228,236,232,0.70)';
  ctx.font = editorFont(11, '500');
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(label, x + 14, y + 12);
  ctx.fillStyle = opts.valueColor || '#f8fbfa';
  ctx.font = editorFont(20, '700');
  ctx.fillText(value, x + 14, y + 30);
  ctx.restore();
}

function resolveThemeColor(value, theme) {
  if (!value) return null;
  if (typeof value === 'string' && value.charAt(0) === '$') {
    return theme[value.slice(1)] || null;
  }
  return value;
}

function resolveThemeStops(value, theme) {
  if (!value) return null;
  if (typeof value === 'string' && value.charAt(0) === '$') {
    return theme[value.slice(1)] || null;
  }
  return value;
}
