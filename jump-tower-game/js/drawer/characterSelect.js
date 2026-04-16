/**
 * 角色选择绘制模块
 */

const progressionSystem = require('../progression/progression');
const {
  font,
  drawGlassPanel,
  drawBadge,
  drawCloseButton,
  drawActionButton
} = require('./menuTheme');

/**
 * 绘制角色选择区域
 */
function drawCharacterSelect(ctx, game, characterConfig) {
  const { W, H } = game;
  const registry = game.uiRegistry;
  const list = characterConfig.list;
  const listCount = list.length;
  const time = Date.now();
  const breathe = Math.sin(time * 0.003) * 0.5 + 0.5;

  const selectWidth = 140;
  const selectHeight = 150;
  const spacing = 16;
  const colCount = 2;
  const rowCount = Math.ceil(listCount / colCount);
  const gridWidth = colCount * selectWidth + (colCount - 1) * spacing;
  const startX = (W - gridWidth) / 2;

  // 布局区域划分：保留下方导航栏点击区域
  const safeTop = H * 0.10;
  const bottomNavReserve = 126;
  const panelX = 18;
  const panelY = Math.max(20, safeTop - 14);
  const panelW = W - panelX * 2;
  const panelBottom = H - bottomNavReserve;
  const panelH = Math.max(320, panelBottom - panelY);
  const titleTop = panelY + 16;
  const titleEndY = titleTop + 62;
  const cbH = 48;
  const cbY = panelY + panelH - cbH - 18;
  const scrollAreaTop = titleEndY + 8;
  const scrollAreaBottom = cbY - 14;
  const scrollAreaHeight = scrollAreaBottom - scrollAreaTop;
  const rowSpacing = selectHeight + spacing;
  const totalContentHeight = rowCount * rowSpacing;

  // 初始化滚动偏移量
  if (typeof game.characterScrollY !== 'number') {
    game.characterScrollY = 0;
  }

  // 计算最大滚动量
  const maxScroll = Math.max(0, totalContentHeight - scrollAreaHeight);

  // 确保滚动值在有效范围内
  game.characterScrollY = Math.max(0, Math.min(game.characterScrollY, maxScroll));

  // 保存滚动信息供点击检测使用
  game.characterScroll = {
    startX: startX,
    scrollAreaTop: scrollAreaTop,
    scrollAreaBottom: scrollAreaBottom,
    scrollAreaHeight: scrollAreaHeight,
    selectWidth: selectWidth,
    selectHeight: selectHeight,
    spacing: spacing,
    colCount: colCount,
    rowSpacing: rowSpacing,
    maxScroll: maxScroll,
    listCount: listCount,
    list: list
  };

  // 绘制半透明背景，让下方主页面按钮保持可见
  ctx.save();
  ctx.fillStyle = 'rgba(8, 14, 26, 0.54)';
  ctx.fillRect(0, 0, W, H);
  drawGlassPanel(ctx, panelX, panelY, panelW, panelH, {
    radius: 28,
    shadowBlur: 24,
    glow: 'rgba(124, 231, 255, 0.10)',
    stroke: 'rgba(207, 230, 255, 0.18)',
    stops: [
      [0, 'rgba(19, 28, 45, 0.94)'],
      [1, 'rgba(10, 16, 29, 0.92)']
    ]
  });
  ctx.restore();

  // 标题区域（固定不滚动）
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = font(28, '700');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('角色列表', W / 2, titleTop + 10);

  ctx.fillStyle = 'rgba(214, 227, 245, 0.72)';
  ctx.font = font(13, '500');
  ctx.fillText('选择当前出战角色', W / 2, titleTop + 48);
  ctx.restore();

  // 绘制滚动条（如果需要滚动）
  if (maxScroll > 0) {
    const scrollBarWidth = 6;
    const scrollBarHeight = Math.max(40, (scrollAreaHeight / totalContentHeight) * scrollAreaHeight);
    const scrollBarX = W - 20;
    const scrollBarY = scrollAreaTop + (game.characterScrollY / maxScroll) * (scrollAreaHeight - scrollBarHeight);
    const scrollBarTotalHeight = scrollAreaHeight;

    // 保存滚动条区域供拖动使用
    game.characterScrollBar = {
      x: scrollBarX,
      y: scrollAreaTop,
      width: scrollBarWidth,
      height: scrollBarTotalHeight,
      thumbY: scrollBarY,
      thumbHeight: scrollBarHeight,
      maxScroll: maxScroll
    };

    ctx.save();
    // 滚动条轨道
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(scrollBarX, scrollAreaTop, scrollBarWidth, scrollBarTotalHeight);
    // 可拖动滑块
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fillRect(scrollBarX, scrollBarY, scrollBarWidth, scrollBarHeight);
    // 滑块高亮效果
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(scrollBarX + 1, scrollBarY + 2, scrollBarWidth - 2, 6);
    ctx.restore();
  } else {
    game.characterScrollBar = null;
  }

  // 内容区域裁剪（只显示可见范围）
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, scrollAreaTop, W, scrollAreaHeight);
  ctx.clip();

  // 应用滚动偏移
  const scrollOffset = game.characterScrollY;

  for (let i = 0; i < listCount; i++) {
    const row = Math.floor(i / colCount);
    const col = i % colCount;
    const charName = list[i];
    const x = startX + col * (selectWidth + spacing);
    const y = scrollAreaTop + row * rowSpacing - scrollOffset;
    const isSelected = characterConfig.current === charName;
    const isPending = game.characterPendingSelect === charName;
    const isUnlocked = progressionSystem.isCharacterUnlocked(game.progression, charName);

    // 只绘制可见区域内的卡片
    if (y + selectHeight < scrollAreaTop || y > scrollAreaBottom) {
      continue;
    }

    drawGlassPanel(ctx, x, y, selectWidth, selectHeight, {
      radius: 18,
      shadowBlur: isSelected || isPending ? 18 : 10,
      glow: isSelected || isPending ? 'rgba(255, 221, 120, 0.2)' : 'rgba(0, 0, 0, 0.08)',
      stroke: isSelected || isPending ? 'rgba(255, 221, 120, ' + (0.28 + breathe * 0.18) + ')' : 'rgba(255, 255, 255, 0.12)',
      stops: [
        [0, 'rgba(19, 34, 57, 0.88)'],
        [1, 'rgba(10, 18, 31, 0.84)']
      ]
    });

    const frames = characterConfig.frames[charName];
    if (frames && frames[0] && frames[0].width > 0) {
      ctx.drawImage(frames[0], x + 38, y + 18, 64, 64);
    }

    ctx.save();
    ctx.fillStyle = isSelected || isPending ? '#ffe39a' : '#ffffff';
    ctx.font = font(14, '700');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(characterConfig.names[charName] || charName, x + selectWidth / 2, y + 94);
    ctx.restore();

    if (isSelected) {
      drawBadge(ctx, x + 34, y + 116, '使用中', {
        width: 72,
        height: 24,
        paddingX: 10,
        color: '#ffe39a',
        glow: 'rgba(255, 221, 120, 0.12)',
        stroke: 'rgba(255, 221, 120, 0.18)',
        stops: [
          [0, 'rgba(67, 56, 19, 0.84)'],
          [1, 'rgba(38, 31, 10, 0.82)']
        ]
      });
    } else if (isPending) {
      drawBadge(ctx, x + 34, y + 116, '待确认', {
        width: 72,
        height: 24,
        paddingX: 10,
        color: '#74f7d0',
        glow: 'rgba(116, 247, 208, 0.12)',
        stroke: 'rgba(116, 247, 208, 0.18)',
        stops: [
          [0, 'rgba(19, 67, 56, 0.84)'],
          [1, 'rgba(10, 38, 31, 0.82)']
        ]
      });
    }

    if (!isUnlocked) {
      ctx.save();
      ctx.fillStyle = 'rgba(7, 12, 21, 0.72)';
      ctx.fillRect(x + 8, y + 8, selectWidth - 16, selectHeight - 16);
      ctx.restore();

      ctx.save();
      ctx.fillStyle = '#ffb4b4';
      ctx.font = font(14, '700');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('未解锁', x + selectWidth / 2, y + 56);
      const catalog = progressionSystem.getCharacterCatalog(game.progression);
      const item = catalog.find(function(entry) { return entry.id === charName; });
      if (item) {
        ctx.fillStyle = '#ffe3a1';
        ctx.font = font(12, '600');
        ctx.fillText(item.price + ' 金币', x + selectWidth / 2, y + 82);
      }
      ctx.restore();
    }
  }

  ctx.restore();  // 恢复裁剪区域

  const closeBtnSize = 36;
  const closeBtnX = panelX + 14;
  const closeBtnY = panelY + 12;
  drawCloseButton(ctx, closeBtnX, closeBtnY, closeBtnSize, {
    glow: 'rgba(255, 127, 127, 0.12)'
  });
  registry.register('start.character.panel', { x: panelX, y: panelY, w: panelW, h: panelH }, {
    consume: true,
    passThrough: true
  });
  registry.register('start.character.close', { x: closeBtnX, y: closeBtnY, w: closeBtnSize, h: closeBtnSize }, {
    action: { type: 'close-character-panel' }
  });

  // 底部确认按钮
  const confirmBtnW = 200;
  const confirmBtnH = cbH;
  const confirmBtnX = (W - confirmBtnW) / 2;
  const confirmBtnY = cbY;
  const hasPending = game.characterPendingSelect != null;

  drawActionButton(ctx, confirmBtnX, confirmBtnY, confirmBtnW, confirmBtnH, hasPending ? '确认选择' : '选择一个角色', {
    shadowColor: hasPending ? 'rgba(116, 247, 208, 0.35)' : 'rgba(150, 150, 150, 0.2)',
    shadowBlur: 16,
    stops: hasPending ? [
      [0, '#74f7d0'],
      [0.55, '#42d6f2'],
      [1, '#2f83ff']
    ] : [
      [0, 'rgba(100, 100, 120, 0.6)'],
      [1, 'rgba(60, 60, 80, 0.5)']
    ],
    textColor: hasPending ? '#051120' : '#888888'
  });
  registry.register('start.character.confirm', { x: confirmBtnX, y: confirmBtnY, w: confirmBtnW, h: confirmBtnH }, {
    action: { type: 'confirm-character-select' }
  });
}

module.exports = {
  drawCharacterSelect
};
