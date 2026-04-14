const debugRuntime = require('../game/debugRuntime');
const {
  font,
  drawGlassPanel,
  drawBadge,
  drawActionButton,
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

function isVisible(y, h, top, bottom) {
  return y + h >= top && y <= bottom;
}

function drawDebugPanel(ctx, game, W, H) {
  const debugConfig = game.getDebugConfig ? game.getDebugConfig() : null;
  const presets = debugConfig && debugConfig.presets ? debugConfig.presets : [];
  const draft = game.debugDraft || {};
  const profile = typeof game.getDebugDraftProfile === 'function' ? game.getDebugDraftProfile() : null;

  const panelW = Math.min(W - 24, 408);
  const panelH = Math.min(H - 48, 612);
  const panelX = (W - panelW) / 2;
  const panelY = Math.max(24, (H - panelH) / 2);
  const contentX = panelX + 16;
  const contentW = panelW - 32;

  game.debugPresetAreas = [];
  game.debugOptionAreas = [];
  game.debugPanelPresetIds = Array.isArray(draft.presetIds) ? draft.presetIds.slice() : [];
  game.debugResetBtnArea = null;
  game.debugLaunchBtnArea = null;
  game.closeDebugPanel = null;
  game.debugPanelScrollArea = null;

  drawModalScrim(ctx, W, H);
  drawGlassPanel(ctx, panelX, panelY, panelW, panelH, {
    radius: 32,
    innerStroke: 'rgba(255, 255, 255, 0.06)',
    shadowBlur: 24,
    glow: 'rgba(124, 231, 255, 0.12)',
    stroke: 'rgba(212, 231, 255, 0.16)',
    stops: [
      [0, 'rgba(21, 34, 56, 0.95)'],
      [1, 'rgba(9, 15, 27, 0.94)']
    ]
  });

  drawBadge(ctx, contentX, panelY + 18, 'DEBUG SANDBOX', {
    dotColor: '#ffcf70',
    color: '#f5fbff'
  });

  const closeSize = 30;
  const closeX = panelX + panelW - closeSize - 16;
  const closeY = panelY + 18;
  drawCloseButton(ctx, closeX, closeY, closeSize);
  game.closeDebugPanel = { x: closeX, y: closeY, w: closeSize, h: closeSize };

  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#ffffff';
  ctx.font = font(28, '700');
  ctx.fillText('Debug 关卡', contentX, panelY + 58);

  ctx.fillStyle = 'rgba(214, 227, 245, 0.72)';
  ctx.font = font(13, '500');
  ctx.fillText('预设场景支持多选，后选中的预设会覆盖前面的同项配置。', contentX, panelY + 96);
  ctx.restore();

  const presetCols = 3;
  const presetGap = 8;
  const presetCardW = (contentW - presetGap * (presetCols - 1)) / presetCols;
  const presetCardH = 46;
  const optionRowH = 32;
  const optionGap = 4;
  const buttonY = panelY + panelH - 60;
  const scrollViewportY = panelY + 126;
  const scrollViewportH = buttonY - scrollViewportY - 10;
  let contentHeight = 0;

  const presetLabelY = 0;
  const presetStartY = presetLabelY + 20;
  const presetRows = Math.ceil(presets.length / presetCols);
  const presetSectionBottom = presetStartY + presetRows * presetCardH + Math.max(0, presetRows - 1) * presetGap;
  const optionLabelY = presetSectionBottom + 10;
  const optionStartY = optionLabelY + 20;
  const optionsBottom = optionStartY + debugRuntime.OPTION_KEYS.length * optionRowH + Math.max(0, debugRuntime.OPTION_KEYS.length - 1) * optionGap;
  const summaryY = optionsBottom + 8;
  contentHeight = summaryY + 34;

  const maxScroll = Math.max(0, contentHeight - scrollViewportH);
  game.debugPanelMaxScroll = maxScroll;
  game.debugPanelScrollY = Math.max(0, Math.min(maxScroll, game.debugPanelScrollY || 0));
  game.debugPanelScrollArea = {
    x: contentX,
    y: scrollViewportY,
    w: contentW,
    h: scrollViewportH
  };

  ctx.save();
  ctx.beginPath();
  ctx.rect(contentX, scrollViewportY, contentW, scrollViewportH);
  ctx.clip();
  ctx.translate(0, scrollViewportY - game.debugPanelScrollY);

  ctx.save();
  ctx.fillStyle = 'rgba(214, 227, 245, 0.72)';
  ctx.font = font(11, '700');
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('预设场景', contentX, presetLabelY);
  ctx.restore();

  const visibleTop = scrollViewportY;
  const visibleBottom = scrollViewportY + scrollViewportH;

  for (let i = 0; i < presets.length; i++) {
    const preset = presets[i];
    const row = Math.floor(i / presetCols);
    const col = i % presetCols;
    const x = contentX + col * (presetCardW + presetGap);
    const y = scrollViewportY - game.debugPanelScrollY + presetStartY + row * (presetCardH + presetGap);
    const active = Array.isArray(draft.presetIds) && draft.presetIds.indexOf(preset.id) !== -1;

    if (!isVisible(y, presetCardH, visibleTop, visibleBottom)) {
      continue;
    }

    drawGlassPanel(ctx, x, presetStartY + row * (presetCardH + presetGap), presetCardW, presetCardH, {
      radius: 18,
      shadowBlur: active ? 18 : 10,
      glow: active ? 'rgba(124, 231, 255, 0.18)' : 'rgba(0, 0, 0, 0.08)',
      stroke: active ? 'rgba(124, 231, 255, 0.32)' : 'rgba(255, 255, 255, 0.1)',
      stops: active ? [
        [0, 'rgba(28, 58, 92, 0.94)'],
        [1, 'rgba(16, 29, 50, 0.9)']
      ] : [
        [0, 'rgba(18, 28, 44, 0.86)'],
        [1, 'rgba(10, 17, 28, 0.86)']
      ]
    });

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffffff';
    ctx.font = font(12, '700');
    ctx.fillText(fitText(ctx, preset.name, presetCardW - 18), x + 10, presetStartY + row * (presetCardH + presetGap) + 10);
    ctx.fillStyle = active ? '#7ce7ff' : 'rgba(199, 214, 235, 0.72)';
    ctx.font = font(10, '500');
    ctx.fillText(fitText(ctx, preset.notes || preset.description, presetCardW - 18), x + 10, presetStartY + row * (presetCardH + presetGap) + 27);
    ctx.restore();

    game.debugPresetAreas.push({
      presetId: preset.id,
      x: x,
      y: y,
      w: presetCardW,
      h: presetCardH
    });
  }

  ctx.save();
  ctx.fillStyle = 'rgba(214, 227, 245, 0.72)';
  ctx.font = font(11, '700');
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('自定义开关', contentX, optionLabelY);
  ctx.restore();

  for (let i = 0; i < debugRuntime.OPTION_KEYS.length; i++) {
    const key = debugRuntime.OPTION_KEYS[i];
    const meta = debugRuntime.getOptionDefinition(key);
    const value = profile ? profile[key] : meta.values[0];
    const valueText = debugRuntime.getOptionLabel(key, value);
    const localY = optionStartY + i * (optionRowH + optionGap);
    const screenY = scrollViewportY - game.debugPanelScrollY + localY;

    if (!isVisible(screenY, optionRowH, visibleTop, visibleBottom)) {
      continue;
    }

    drawGlassPanel(ctx, contentX, localY, contentW, optionRowH, {
      radius: 18,
      shadowBlur: 10,
      glow: 'rgba(124, 231, 255, 0.08)',
      stroke: 'rgba(255, 255, 255, 0.1)',
      stops: [
        [0, 'rgba(18, 28, 44, 0.86)'],
        [1, 'rgba(10, 17, 28, 0.86)']
      ]
    });

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = font(12, '700');
    ctx.fillText(meta.label, contentX + 14, localY + optionRowH / 2);

    ctx.fillStyle = '#7ce7ff';
    ctx.font = font(10, '700');
    ctx.textAlign = 'right';
    ctx.fillText(valueText, contentX + contentW - 34, localY + optionRowH / 2);
    ctx.fillStyle = 'rgba(214, 227, 245, 0.54)';
    ctx.font = font(10, '600');
    ctx.fillText('点击切换', contentX + contentW - 14, localY + optionRowH / 2);
    ctx.restore();

    game.debugOptionAreas.push({
      key: key,
      x: contentX,
      y: screenY,
      w: contentW,
      h: optionRowH
    });
  }

  if (isVisible(scrollViewportY - game.debugPanelScrollY + summaryY, 34, visibleTop, visibleBottom)) {
    drawGlassPanel(ctx, contentX, summaryY, contentW, 34, {
      radius: 18,
      shadowBlur: 8,
      glow: 'rgba(255, 209, 102, 0.08)',
      stroke: 'rgba(255, 255, 255, 0.1)',
      stops: [
        [0, 'rgba(34, 30, 19, 0.82)'],
        [1, 'rgba(17, 14, 10, 0.82)']
      ]
    });

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffe4a3';
    ctx.font = font(11, '700');
    ctx.fillText(profile && profile.isCustom ? '当前配置：预设基础上已自定义' : '当前配置：按所选预设运行', contentX + 14, summaryY + 8);
    ctx.fillStyle = 'rgba(255, 244, 222, 0.72)';
    ctx.font = font(9, '500');
    ctx.fillText((profile && profile.presetNames && profile.presetNames.length > 0
      ? fitText(ctx, profile.presetNames.join(' + '), contentW - 28)
      : '选择一个或多个预设后开始 Debug 局。'), contentX + 14, summaryY + 20);
    ctx.restore();
  }

  ctx.restore();

  if (maxScroll > 0) {
    ctx.save();
    ctx.fillStyle = 'rgba(9, 15, 27, 0.68)';
    ctx.fillRect(contentX, scrollViewportY, contentW, 12);
    ctx.fillRect(contentX, scrollViewportY + scrollViewportH - 12, contentW, 12);
    ctx.fillStyle = 'rgba(255, 244, 222, 0.52)';
    ctx.font = font(10, '600');
    ctx.textAlign = 'center';
    ctx.fillText('上下滑动查看更多', panelX + panelW / 2, scrollViewportY + scrollViewportH - 2);
    ctx.restore();
  }

  const gap = 10;
  const resetW = 116;
  const launchW = contentW - resetW - gap;
  drawActionButton(ctx, contentX, buttonY, resetW, 42, '恢复默认', {
    font: font(14, '700'),
    textColor: '#ffffff',
    shadowColor: 'rgba(74, 144, 255, 0.2)',
    stops: [
      [0, '#7ab8ff'],
      [0.55, '#4f8fff'],
      [1, '#3158e8']
    ]
  });
  drawActionButton(ctx, contentX + resetW + gap, buttonY, launchW, 42, '开始 Debug', {
    font: font(15, '700'),
    textColor: '#03121f',
    shadowColor: 'rgba(66, 214, 242, 0.24)'
  });

  game.debugResetBtnArea = { x: contentX, y: buttonY, w: resetW, h: 42 };
  game.debugLaunchBtnArea = { x: contentX + resetW + gap, y: buttonY, w: launchW, h: 42 };
}

module.exports = {
  drawDebugPanel
};
