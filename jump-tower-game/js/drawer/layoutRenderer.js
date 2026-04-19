const {
  drawGlassPanel,
  drawActionButton,
  drawCloseButton,
  drawBadge,
  drawIconTile,
  drawMetricCard,
  font,
  createGradient
} = require('./menuTheme');
const { roundRect } = require('./helper');
const { getText } = require('../ui/text');
const uiTheme = require('../ui/theme');

function drawFromLayout(ctx, game, layoutId) {
  const layout = game.layoutLoader.resolve(layoutId, game.W, game.H);
  if (!layout || !layout.elementsList) return;

  const theme = uiTheme.getThemeFromGame(game);
  const registry = game.uiRegistry;

  for (var i = 0; i < layout.elementsList.length; i++) {
    renderElement(ctx, layout.elementsList[i], theme, registry, game);
  }
}

function renderElement(ctx, el, theme, registry, game) {
  if (!el || !el.bounds) return;
  if (el.visibleWhen === false) return;

  var b = el.bounds;
  var s = el.style || {};

  ctx.save();

  switch (el.type) {
    case 'glassPanel':
      drawGlassPanel(ctx, b.x, b.y, b.width, b.height, {
        radius: s.radius || 22,
        glow: resolveColor(s.glow, theme) || theme.panelGlow,
        shadowBlur: s.shadowBlur || 12,
        stroke: resolveColor(s.stroke, theme) || theme.panelStroke,
        innerStroke: resolveColor(s.innerStroke, theme) || theme.panelInnerStroke,
        stops: resolveStops(s.stops, theme) || theme.panelStrongStops
      });
      break;

    case 'text':
      ctx.fillStyle = resolveColor(s.color, theme) || theme.cardLabel;
      ctx.font = font(s.fontSize || 14, s.fontWeight || '400');
      ctx.textAlign = s.textAlign || 'left';
      var text = el.textKey ? getText(el.textKey) : (s.text || '');
      if (s.textAlign === 'center') {
        ctx.fillText(text, b.x + b.width / 2, b.y + (s.fontSize || 14));
      } else {
        ctx.fillText(text, b.x, b.y + (s.fontSize || 14));
      }
      break;

    case 'actionButton':
      drawActionButton(ctx, b.x, b.y, b.width, b.height,
        el.textKey ? getText(el.textKey) : (s.label || ''), {
          radius: s.radius,
          font: font(s.fontSize || 18, s.fontWeight || '700'),
          textColor: resolveColor(s.textColor, theme) || theme.buttonText,
          shadowColor: resolveColor(s.shadowColor, theme) || theme.buttonShadow,
          stops: resolveStops(s.stops, theme) || theme.buttonPrimaryStops
        });
      break;

    case 'closeButton':
      drawCloseButton(ctx, b.x, b.y, b.width || 26, {
        glow: resolveColor(s.glow, theme) || theme.panelGlow,
        stroke: resolveColor(s.stroke, theme) || theme.panelStroke
      });
      break;

    case 'badge':
      drawBadge(ctx, b.x, b.y,
        el.textKey ? getText(el.textKey) : (s.text || ''), {
          color: resolveColor(s.color, theme) || theme.badgeText,
          dotColor: resolveColor(s.dotColor, theme),
          glow: resolveColor(s.glow, theme) || theme.panelGlow,
          stops: resolveStops(s.stops, theme) || theme.badgeStops,
          stroke: resolveColor(s.stroke, theme) || theme.panelStroke
        });
      break;

    case 'iconTile':
      drawIconTile(ctx, b.x, b.y, b.width, b.height,
        s.iconText || '', el.textKey ? getText(el.textKey) : (s.label || ''), {
          active: !!s.active,
          labelSize: s.labelSize || 11,
          activeAccent: resolveColor(s.activeAccent, theme) || theme.accentSoft,
          iconColor: resolveColor(s.iconColor, theme) || theme.chipLabel,
          activeGlow: resolveColor(s.activeGlow, theme) || theme.panelGlow
        });
      break;

    case 'metricCard':
      drawMetricCard(ctx, b.x, b.y, b.width, b.height,
        el.textKey ? getText(el.textKey) : (s.label || ''),
        s.value || '', {
          radius: s.radius,
          labelColor: resolveColor(s.labelColor, theme),
          valueColor: resolveColor(s.valueColor, theme)
        });
      break;

    case 'roundRect':
      ctx.fillStyle = resolveColor(s.fill, theme) || theme.cardFill;
      roundRect(ctx, b.x, b.y, b.width, b.height, s.radius || 14);
      ctx.fill();
      break;

    case 'rect':
      ctx.fillStyle = resolveColor(s.fill, theme) || 'rgba(0,0,0,0.5)';
      ctx.fillRect(b.x, b.y, b.width, b.height);
      break;

    case 'flex':
      break;

    default:
      break;
  }

  ctx.restore();

  if (el.action && registry) {
    registry.register(el.id, {
      x: b.x, y: b.y, w: b.width, h: b.height
    }, {
      action: el.action,
      consume: !!s.consume,
      passThrough: !!s.passThrough
    });
  }

  if (el.children) {
    for (var j = 0; j < el.children.length; j++) {
      renderElement(ctx, el.children[j], theme, registry, game);
    }
  }
}

function resolveColor(value, theme) {
  if (!value) return null;
  if (typeof value === 'string' && value.charAt(0) === '$') {
    return theme[value.slice(1)] || null;
  }
  return value;
}

function resolveStops(value, theme) {
  if (!value) return null;
  if (typeof value === 'string' && value.charAt(0) === '$') {
    return theme[value.slice(1)] || null;
  }
  return value;
}

module.exports = { drawFromLayout, renderElement };
