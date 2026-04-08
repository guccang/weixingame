/**
 * 模式选择面板绘制
 */

const { fillRoundRect } = require('./helper');
const { GAME_MODES, TIME_ATTACK_OPTIONS } = require('../game/constants');
const { landmarks } = require('../game/landmarks');
const {
  font,
  createGradient,
  drawGlassPanel,
  drawBadge,
  drawModalScrim,
  drawCloseButton
} = require('./menuTheme');

function fitText(ctx, text, maxWidth) {
  if (!text) return '';
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }

  let next = text;
  while (next.length > 1 && ctx.measureText(next + '…').width > maxWidth) {
    next = next.slice(0, -1);
  }
  return next + '…';
}

function drawPanelShell(ctx, W, H, badgeText, title, desc, options) {
  const opts = options || {};
  const panelW = Math.min(W - 24, opts.maxWidth || 396);
  const panelH = Math.min(H - 70, opts.maxHeight || 540);
  const panelX = (W - panelW) / 2;
  const panelY = Math.max(34, (H - panelH) / 2);
  const contentX = panelX + 16;
  const contentW = panelW - 32;

  drawModalScrim(ctx, W, H);
  drawGlassPanel(ctx, panelX, panelY, panelW, panelH, {
    radius: 30,
    innerStroke: 'rgba(255, 255, 255, 0.06)',
    shadowBlur: 22,
    glow: opts.glow || 'rgba(122, 201, 255, 0.12)',
    stroke: opts.stroke || 'rgba(207, 230, 255, 0.18)',
    stops: opts.stops || [
      [0, 'rgba(24, 29, 47, 0.94)'],
      [1, 'rgba(10, 14, 25, 0.94)']
    ]
  });

  drawBadge(ctx, contentX, panelY + 18, badgeText, {
    dotColor: opts.badgeDot || '#7ce7ff',
    color: '#f5fbff'
  });

  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#ffffff';
  ctx.font = font(28, '700');
  ctx.fillText(title, contentX, panelY + 60);

  ctx.fillStyle = 'rgba(214, 227, 245, 0.72)';
  ctx.font = font(13, '500');
  ctx.fillText(desc, contentX, panelY + 96);
  ctx.restore();

  return {
    panelX: panelX,
    panelY: panelY,
    panelW: panelW,
    panelH: panelH,
    contentX: contentX,
    contentW: contentW
  };
}

function drawBackButton(ctx, x, y, size) {
  drawGlassPanel(ctx, x, y, size, size, {
    radius: Math.floor(size / 2),
    shadowBlur: 10,
    glow: 'rgba(124, 231, 255, 0.12)',
    stroke: 'rgba(255, 255, 255, 0.12)',
    stops: [
      [0, 'rgba(32, 44, 66, 0.92)'],
      [1, 'rgba(17, 24, 38, 0.88)']
    ]
  });

  ctx.save();
  ctx.fillStyle = '#f3f7ff';
  ctx.font = font(18, '700');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('←', x + size / 2, y + size / 2 + 1);
  ctx.restore();
}

/**
 * 绘制模式选择面板
 */
function drawModeSelect(ctx, game, W, H) {
  const frame = drawPanelShell(ctx, W, H, 'MODE SELECT', '选择玩法', '不同规则会影响开局流程和挑战节奏。', {
    glow: 'rgba(124, 231, 255, 0.12)',
    badgeDot: '#7cf3c8'
  });

  const closeSize = 30;
  const closeX = frame.panelX + frame.panelW - closeSize - 16;
  const closeY = frame.panelY + 18;
  drawCloseButton(ctx, closeX, closeY, closeSize);
  game.closeModeSelect = { x: closeX, y: closeY, w: closeSize, h: closeSize };

  const modes = [
    {
      name: GAME_MODES.ENDLESS,
      label: '无尽模式',
      desc: '连续攀爬，适合刷纪录和熟悉手感。',
      accent: '#6ef1cb',
      tag: '长线挑战'
    },
    {
      name: GAME_MODES.CHALLENGE,
      label: '闯关模式',
      desc: '按地标逐个攻克，路线和难度更明确。',
      accent: '#ffb680',
      tag: '目标导向'
    },
    {
      name: GAME_MODES.TIME_ATTACK,
      label: '竞速模式',
      desc: '倒计时内冲更高，适合短局高压挑战。',
      accent: '#7ce7ff',
      tag: '快节奏'
    }
  ];

  const startY = frame.panelY + 134;
  const cardH = 78;
  const gap = 12;
  game.modeBtnArea = {};

  for (let i = 0; i < modes.length; i++) {
    const mode = modes[i];
    const x = frame.contentX;
    const y = startY + i * (cardH + gap);
    const isActive = game.gameMode.gameMode === mode.name;

    drawGlassPanel(ctx, x, y, frame.contentW, cardH, {
      radius: 22,
      shadowBlur: 12,
      glow: 'rgba(124, 231, 255, 0.08)',
      stroke: isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
      stops: [
        [0, 'rgba(18, 28, 44, 0.86)'],
        [1, 'rgba(10, 17, 28, 0.86)']
      ]
    });

    ctx.save();
    ctx.fillStyle = createGradient(ctx, x + 14, y + 16, x + 18, y + cardH - 16, [
      [0, mode.accent],
      [1, 'rgba(255,255,255,0.2)']
    ]);
    fillRoundRect(ctx, x + 14, y + 16, 4, cardH - 32, 2);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffffff';
    ctx.font = font(17, '700');
    ctx.fillText(mode.label, x + 28, y + 16);

    ctx.fillStyle = 'rgba(199, 214, 235, 0.72)';
    ctx.font = font(12, '500');
    ctx.fillText(mode.desc, x + 28, y + 42);

    drawBadge(ctx, x + frame.contentW - 92, y + 16, mode.tag, {
      width: 68,
      height: 24,
      paddingX: 8,
      color: mode.accent,
      glow: 'rgba(255,255,255,0.04)',
      stroke: 'rgba(255, 255, 255, 0.08)',
      stops: [
        [0, 'rgba(35, 47, 70, 0.82)'],
        [1, 'rgba(18, 26, 41, 0.78)']
      ]
    });
    ctx.restore();

    game.modeBtnArea[mode.name] = { x: x, y: y, w: frame.contentW, h: cardH };
  }
}

/**
 * 绘制时间选择面板
 */
function drawTimeSelect(ctx, game, W, H) {
  const frame = drawPanelShell(ctx, W, H, 'TIME ATTACK', '选择时间', '更短更爆发，更长更适合稳定运营。', {
    glow: 'rgba(124, 231, 255, 0.12)',
    badgeDot: '#7ce7ff',
    maxHeight: 562
  });

  const backSize = 30;
  const backX = frame.panelX + frame.panelW - backSize - 16;
  const backY = frame.panelY + 18;
  drawBackButton(ctx, backX, backY, backSize);
  game.backToModeSelect = { x: backX, y: backY, w: backSize, h: backSize };

  const notes = {
    60000: '极限冲刺',
    300000: '推荐',
    600000: '稳定发育',
    900000: '长局规划',
    1800000: '深度刷分'
  };

  const startY = frame.panelY + 132;
  const cardH = 56;
  const gap = 10;
  game.timeBtnArea = [];

  for (let i = 0; i < TIME_ATTACK_OPTIONS.length; i++) {
    const option = TIME_ATTACK_OPTIONS[i];
    const x = frame.contentX;
    const y = startY + i * (cardH + gap);
    const isSelected = game.gameMode.selectedTimeLimit === option.value;

    drawGlassPanel(ctx, x, y, frame.contentW, cardH, {
      radius: 20,
      shadowBlur: 10,
      glow: isSelected ? 'rgba(124, 231, 255, 0.18)' : 'rgba(0, 0, 0, 0.06)',
      stroke: isSelected ? 'rgba(124, 231, 255, 0.26)' : 'rgba(255, 255, 255, 0.1)',
      stops: isSelected ? [
        [0, 'rgba(24, 57, 82, 0.9)'],
        [1, 'rgba(14, 28, 44, 0.88)']
      ] : [
        [0, 'rgba(18, 28, 44, 0.86)'],
        [1, 'rgba(10, 17, 28, 0.86)']
      ]
    });

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = font(17, '700');
    ctx.fillText(option.label, x + 20, y + cardH / 2);

    ctx.fillStyle = isSelected ? '#7ce7ff' : 'rgba(199, 214, 235, 0.7)';
    ctx.font = font(11, '600');
    ctx.textAlign = 'right';
    ctx.fillText(notes[option.value] || '挑战', x + frame.contentW - 18, y + cardH / 2);
    ctx.restore();

    game.timeBtnArea.push({ x: x, y: y, w: frame.contentW, h: cardH, value: option.value });
  }
}

/**
 * 绘制地标选择面板
 */
function drawLandmarkSelect(ctx, game, W, H) {
  const frame = drawPanelShell(ctx, W, H, 'LANDMARK RUN', '选择目的地', '每个地标都有自己的目标高度和节奏。', {
    glow: 'rgba(255, 191, 134, 0.12)',
    badgeDot: '#ffbf86',
    maxHeight: 572
  });

  const backSize = 30;
  const backX = frame.panelX + frame.panelW - backSize - 16;
  const backY = frame.panelY + 18;
  drawBackButton(ctx, backX, backY, backSize);
  game.backToModeSelect = { x: backX, y: backY, w: backSize, h: backSize };

  const cols = 2;
  const gap = 10;
  const cardW = Math.floor((frame.contentW - gap) / cols);
  const cardH = 142;
  const startY = frame.panelY + 132;
  game.landmarkBtnArea = [];

  for (let i = 0; i < landmarks.length; i++) {
    const landmark = landmarks[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = frame.contentX + col * (cardW + gap);
    const y = startY + row * (cardH + gap);
    const accent = landmark.theme.accentColor;

    drawGlassPanel(ctx, x, y, cardW, cardH, {
      radius: 22,
      shadowBlur: 12,
      glow: 'rgba(255,255,255,0.06)',
      stroke: 'rgba(255, 255, 255, 0.12)',
      stops: [
        [0, landmark.theme.bgGradient[0] || 'rgba(21, 33, 54, 0.86)'],
        [1, landmark.theme.bgGradient[1] || 'rgba(10, 18, 33, 0.84)']
      ]
    });

    ctx.save();
    ctx.fillStyle = createGradient(ctx, x + 16, y + 16, x + cardW - 16, y + 16, [
      [0, accent],
      [1, 'rgba(255,255,255,0.16)']
    ]);
    fillRoundRect(ctx, x + 16, y + 16, cardW - 32, 3, 2);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffffff';
    ctx.font = font(18, '700');
    ctx.fillText(landmark.name, x + 16, y + 30);

    ctx.fillStyle = accent;
    ctx.font = font(13, '700');
    ctx.fillText('目标 ' + landmark.targetHeight + 'm', x + 16, y + 58);

    ctx.fillStyle = 'rgba(224, 233, 245, 0.74)';
    ctx.font = font(11, '500');
    ctx.fillText(fitText(ctx, landmark.desc, cardW - 32), x + 16, y + 84);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = font(11, '600');
    ctx.fillText('难度', x + 16, y + 112);

    ctx.fillStyle = '#ffd166';
    ctx.font = font(12, '700');
    ctx.fillText('★'.repeat(Math.max(1, Math.floor(landmark.targetHeight / 500))), x + 52, y + 110);
    ctx.restore();

    game.landmarkBtnArea.push({ x: x, y: y, w: cardW, h: cardH, landmark: landmark });
  }
}

module.exports = {
  drawModeSelect,
  drawTimeSelect,
  drawLandmarkSelect
};
