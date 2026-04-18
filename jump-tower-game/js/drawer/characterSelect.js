/**
 * 角色选择绘制模块
 */

const progressionSystem = require('../progression/progression');
const { roundRect } = require('./helper');
const {
  font,
  drawGlassPanel,
  drawBadge,
  drawCloseButton,
  drawActionButton
} = require('./menuTheme');

function ensureCharacterFocus(game, list, currentCharacter) {
  if (game.characterProfileFocus && list.indexOf(game.characterProfileFocus) >= 0) {
    return game.characterProfileFocus;
  }
  if (game.characterPendingSelect && list.indexOf(game.characterPendingSelect) >= 0) {
    game.characterProfileFocus = game.characterPendingSelect;
    return game.characterProfileFocus;
  }
  game.characterProfileFocus = currentCharacter;
  return game.characterProfileFocus;
}

function drawCharacterSelect(ctx, game, characterConfig) {
  const { W, H } = game;
  const registry = game.uiRegistry;
  const list = characterConfig.list.slice();
  const currentCharacter = characterConfig.current;
  const focusId = ensureCharacterFocus(game, list, currentCharacter);
  const focusedProfile = progressionSystem.getCharacterProfile(game.progression, focusId);

  const panelX = 16;
  const panelY = Math.max(22, H * 0.07);
  const panelW = W - panelX * 2;
  const panelH = Math.max(420, H - panelY - 134);
  const closeBtnSize = 36;
  const listW = Math.min(142, Math.floor(panelW * 0.36));
  const gap = 12;
  const detailX = panelX + 18 + listW + gap;
  const detailW = panelX + panelW - detailX - 18;
  const titleY = panelY + 18;
  const listTop = panelY + 76;
  const listBottom = panelY + panelH - 22;
  const listH = listBottom - listTop;
  const cardH = 108;
  const cardGap = 12;
  const totalContentHeight = list.length * (cardH + cardGap) - cardGap;
  const maxScroll = Math.max(0, totalContentHeight - listH);

  if (typeof game.characterScrollY !== 'number') {
    game.characterScrollY = 0;
  }
  game.characterScrollY = Math.max(0, Math.min(game.characterScrollY, maxScroll));

  game.characterScroll = {
    startX: panelX + 18,
    scrollAreaTop: listTop,
    scrollAreaBottom: listBottom,
    scrollAreaHeight: listH,
    selectWidth: listW,
    selectHeight: cardH,
    spacing: cardGap,
    colCount: 1,
    rowSpacing: cardH + cardGap,
    maxScroll: maxScroll,
    listCount: list.length,
    list: list
  };

  ctx.save();
  ctx.fillStyle = 'rgba(6, 10, 18, 0.60)';
  ctx.fillRect(0, 0, W, H);
  drawGlassPanel(ctx, panelX, panelY, panelW, panelH, {
    radius: 28,
    shadowBlur: 26,
    glow: 'rgba(116, 247, 208, 0.12)',
    stroke: 'rgba(220, 237, 255, 0.18)',
    stops: [
      [0, 'rgba(17, 24, 38, 0.96)'],
      [0.48, 'rgba(10, 18, 30, 0.94)'],
      [1, 'rgba(8, 13, 24, 0.96)']
    ]
  });
  ctx.restore();

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = font(26, '700');
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('角色档案', panelX + 18, titleY);
  ctx.fillStyle = 'rgba(214, 227, 245, 0.72)';
  ctx.font = font(12, '500');
  ctx.fillText('按高度与关键成就逐步解锁人物与传记', panelX + 18, titleY + 34);
  ctx.restore();

  const closeBtnX = panelX + panelW - closeBtnSize - 14;
  const closeBtnY = panelY + 14;
  drawCloseButton(ctx, closeBtnX, closeBtnY, closeBtnSize, {
    glow: 'rgba(255, 127, 127, 0.12)'
  });

  drawGlassPanel(ctx, panelX + 14, listTop - 8, listW + 8, listH + 16, {
    radius: 22,
    shadowBlur: 12,
    glow: 'rgba(82, 199, 255, 0.08)',
    stroke: 'rgba(255,255,255,0.08)',
    stops: [
      [0, 'rgba(13, 22, 38, 0.76)'],
      [1, 'rgba(9, 15, 27, 0.82)']
    ]
  });

  ctx.save();
  ctx.beginPath();
  ctx.rect(panelX + 18, listTop, listW, listH);
  ctx.clip();

  list.forEach(function(charId, index) {
    const y = listTop + index * (cardH + cardGap) - game.characterScrollY;
    const isSelected = currentCharacter === charId;
    const isFocused = focusId === charId;
    const isPending = game.characterPendingSelect === charId;
    const unlockStatus = progressionSystem.getCharacterUnlockStatus(game.progression, charId);
    const profile = progressionSystem.getCharacterProfile(game.progression, charId);
    if (y + cardH < listTop || y > listBottom) {
      return;
    }

    drawGlassPanel(ctx, panelX + 18, y, listW, cardH, {
      radius: 18,
      shadowBlur: isFocused ? 18 : 8,
      glow: isFocused ? 'rgba(116, 247, 208, 0.18)' : 'rgba(0, 0, 0, 0.08)',
      stroke: isFocused ? 'rgba(116, 247, 208, 0.34)' : 'rgba(255,255,255,0.10)',
      stops: [
        [0, isFocused ? 'rgba(20, 42, 58, 0.92)' : 'rgba(17, 28, 45, 0.88)'],
        [1, 'rgba(10, 18, 29, 0.88)']
      ]
    });

    const frames = characterConfig.frames[charId];
    if (frames && frames[0] && frames[0].width > 0) {
      ctx.drawImage(frames[0], panelX + 18 + 10, y + 18, 52, 52);
    }

    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = font(14, '700');
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(characterConfig.names[charId] || charId, panelX + 84, y + 16);

    ctx.fillStyle = 'rgba(214, 227, 245, 0.76)';
    ctx.font = font(10, '500');
    wrapText(ctx, profile.role + ' · ' + profile.skillLabel, panelX + 84, y + 40, listW - 92, 14, 2);
    ctx.restore();

    if (isSelected) {
      drawBadge(ctx, panelX + 26, y + 78, '使用中', {
        width: 58,
        height: 22,
        paddingX: 8,
        color: '#ffe39a',
        glow: 'rgba(255, 221, 120, 0.12)',
        stroke: 'rgba(255, 221, 120, 0.18)',
        stops: [
          [0, 'rgba(67, 56, 19, 0.84)'],
          [1, 'rgba(38, 31, 10, 0.82)']
        ]
      });
    } else if (isPending) {
      drawBadge(ctx, panelX + 26, y + 78, '待上阵', {
        width: 58,
        height: 22,
        paddingX: 8,
        color: '#74f7d0',
        glow: 'rgba(116, 247, 208, 0.12)',
        stroke: 'rgba(116, 247, 208, 0.18)',
        stops: [
          [0, 'rgba(19, 67, 56, 0.84)'],
          [1, 'rgba(10, 38, 31, 0.82)']
        ]
      });
    }

    if (!unlockStatus.unlocked) {
      ctx.save();
      ctx.fillStyle = 'rgba(5, 8, 16, 0.54)';
      roundRect(ctx, panelX + 24, y + 72, listW - 12, 28, 14);
      ctx.fill();
      ctx.fillStyle = '#ffcf99';
      ctx.font = font(10, '600');
      ctx.textAlign = 'center';
      ctx.fillText(fitText(ctx, unlockStatus.label, listW - 26), panelX + 18 + listW / 2, y + 90);
      ctx.restore();
    }
  });
  ctx.restore();

  if (maxScroll > 0) {
    const trackX = panelX + 18 + listW - 4;
    const trackY = listTop + 4;
    const trackH = listH - 8;
    const thumbH = Math.max(46, (listH / totalContentHeight) * trackH);
    const thumbY = trackY + (game.characterScrollY / maxScroll) * (trackH - thumbH);
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    roundRect(ctx, trackX, trackY, 4, trackH, 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.42)';
    roundRect(ctx, trackX, thumbY, 4, thumbH, 2);
    ctx.fill();
    ctx.restore();
  }

  drawCharacterDetail(ctx, game, characterConfig, detailX, listTop, detailW, listH, focusedProfile);

  registry.register('start.character.panel', { x: panelX, y: panelY, w: panelW, h: panelH }, {
    consume: true,
    passThrough: true
  });
  registry.register('start.character.close', { x: closeBtnX, y: closeBtnY, w: closeBtnSize, h: closeBtnSize }, {
    action: { type: 'close-character-panel' }
  });
}

function drawCharacterDetail(ctx, game, characterConfig, x, y, width, height, profile) {
  const headerH = 118;
  const actionH = 48;
  const gap = 10;
  const chaptersTop = y + headerH + 10;
  const availableH = height - headerH - actionH - 26;
  const chapterH = Math.max(46, Math.floor((availableH - gap * 5) / 6));
  const actionY = y + height - actionH;
  const currentCharacter = characterConfig.current;
  const isFocusedCurrent = currentCharacter === profile.id;
  const isFocusedPending = game.characterPendingSelect === profile.id;

  drawGlassPanel(ctx, x, y, width, height, {
    radius: 24,
    shadowBlur: 14,
    glow: 'rgba(116, 247, 208, 0.10)',
    stroke: 'rgba(255,255,255,0.10)',
    stops: [
      [0, 'rgba(15, 24, 40, 0.82)'],
      [1, 'rgba(8, 14, 24, 0.88)']
    ]
  });

  ctx.save();
  ctx.fillStyle = '#8fe9ff';
  ctx.font = font(12, '700');
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(profile.role || '角色', x + 16, y + 16);

  ctx.fillStyle = '#ffffff';
  ctx.font = font(24, '700');
  ctx.fillText(profile.name || profile.id, x + 16, y + 34);

  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.font = font(12, '500');
  wrapText(ctx, profile.desc || '', x + 16, y + 64, width - 32, 16, 3);
  ctx.restore();

  drawBadge(ctx, x + 16, y + 92, profile.skillLabel || '均衡', {
    width: Math.min(108, width - 32),
    height: 22,
    paddingX: 10,
    color: '#dff7ff',
    glow: 'rgba(82, 199, 255, 0.10)',
    stroke: 'rgba(82, 199, 255, 0.16)',
    stops: [
      [0, 'rgba(18, 53, 72, 0.82)'],
      [1, 'rgba(10, 33, 48, 0.86)']
    ]
  });

  ctx.save();
  ctx.fillStyle = profile.unlockStatus.unlocked ? '#74f7d0' : '#ffcf99';
  ctx.font = font(11, '600');
  ctx.textAlign = 'right';
  ctx.fillText(fitText(ctx, profile.unlockStatus.label, width - 24), x + width - 16, y + 24);
  ctx.fillStyle = 'rgba(214, 227, 245, 0.72)';
  ctx.font = font(10, '500');
  ctx.fillText(fitText(ctx, profile.unlockStatus.progressText, width - 24), x + width - 16, y + 44);
  ctx.restore();

  profile.chapters.forEach(function(chapter, index) {
    const itemY = chaptersTop + index * (chapterH + gap);
    drawGlassPanel(ctx, x + 12, itemY, width - 24, chapterH, {
      radius: 16,
      shadowBlur: 8,
      glow: chapter.unlocked ? 'rgba(116, 247, 208, 0.06)' : 'rgba(255, 176, 121, 0.05)',
      stroke: chapter.unlocked ? 'rgba(255,255,255,0.08)' : 'rgba(255, 207, 153, 0.14)',
      stops: [
        [0, chapter.unlocked ? 'rgba(17, 29, 45, 0.82)' : 'rgba(28, 20, 20, 0.84)'],
        [1, 'rgba(9, 14, 24, 0.88)']
      ]
    });

    ctx.save();
    ctx.fillStyle = chapter.unlocked ? '#ffffff' : '#ffcf99';
    ctx.font = font(11, '700');
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText((index + 1) + '. ' + chapter.title, x + 24, itemY + 10);

    ctx.font = font(10, '500');
    ctx.fillStyle = chapter.unlocked ? 'rgba(228, 238, 247, 0.82)' : 'rgba(255, 224, 196, 0.78)';
    wrapText(
      ctx,
      chapter.unlocked ? chapter.text : ('解锁条件：' + chapter.requirementLabel + ' · ' + chapter.progressText),
      x + 24,
      itemY + 28,
      width - 48,
      13,
      2
    );
    ctx.restore();
  });

  const buttonLabel = !profile.unlockStatus.unlocked
    ? '未满足解锁条件'
    : (isFocusedCurrent ? '当前使用角色' : (isFocusedPending ? '点击确认上阵' : '设为出战角色'));
  drawActionButton(ctx, x + 12, actionY, width - 24, actionH, buttonLabel, {
    shadowColor: profile.unlockStatus.unlocked ? 'rgba(116, 247, 208, 0.28)' : 'rgba(255, 180, 180, 0.14)',
    shadowBlur: 16,
    stops: profile.unlockStatus.unlocked ? [
      [0, isFocusedCurrent ? 'rgba(102, 116, 134, 0.82)' : '#74f7d0'],
      [0.5, isFocusedCurrent ? 'rgba(82, 92, 108, 0.82)' : '#42d6f2'],
      [1, isFocusedCurrent ? 'rgba(66, 74, 88, 0.82)' : '#2f83ff']
    ] : [
      [0, 'rgba(112, 60, 60, 0.84)'],
      [1, 'rgba(78, 34, 34, 0.90)']
    ],
    textColor: profile.unlockStatus.unlocked ? (isFocusedCurrent ? '#dfe6ee' : '#051120') : '#ffd3d3'
  });

  if (profile.unlockStatus.unlocked && !isFocusedCurrent) {
    game.uiRegistry.register('start.character.confirm', {
      x: x + 12,
      y: actionY,
      w: width - 24,
      h: actionH
    }, {
      action: { type: 'confirm-character-select' }
    });
  }
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  if (!text) return;
  const content = String(text);
  let line = '';
  let row = 0;
  for (let i = 0; i < content.length; i++) {
    const testLine = line + content[i];
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y + row * lineHeight);
      row += 1;
      if (row >= maxLines) return;
      line = content[i];
    } else {
      line = testLine;
    }
  }
  if (line && row < maxLines) {
    ctx.fillText(line, x, y + row * lineHeight);
  }
}

function fitText(ctx, text, maxWidth) {
  const content = String(text || '');
  if (!content) return '';
  if (ctx.measureText(content).width <= maxWidth) return content;
  let trimmed = content;
  while (trimmed.length > 1 && ctx.measureText(trimmed + '...').width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return trimmed + '...';
}

module.exports = {
  drawCharacterSelect
};
