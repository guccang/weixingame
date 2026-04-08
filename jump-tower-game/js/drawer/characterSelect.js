/**
 * 角色选择绘制模块
 */

const progressionSystem = require('../progression/progression');
const {
  font,
  drawGlassPanel,
  drawBadge,
  drawModalScrim,
  drawCloseButton
} = require('./menuTheme');

/**
 * 绘制角色选择区域
 */
function drawCharacterSelect(ctx, game, characterConfig) {
  const { W, H } = game;
  const list = characterConfig.list;
  const listCount = list.length;
  const time = Date.now();
  const breathe = Math.sin(time * 0.003) * 0.5 + 0.5;

  const selectWidth = 120;
  const selectHeight = 140;
  const spacing = 20;
  const totalWidth = listCount * selectWidth + (listCount - 1) * spacing;
  const startX = (W - totalWidth) / 2;
  const selectY = H * 0.35;

  drawModalScrim(ctx, W, H);
  drawBadge(ctx, startX, selectY - 64, 'CHARACTERS', {
    dotColor: '#7ce7ff',
    color: '#f5fbff'
  });

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = font(28, '700');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('角色列表', W / 2, selectY - 28);

  ctx.fillStyle = 'rgba(214, 227, 245, 0.72)';
  ctx.font = font(13, '500');
  ctx.fillText('选择当前出战角色，未解锁角色可在强化页购买。', W / 2, selectY + 8);
  ctx.restore();

  for (let i = 0; i < listCount; i++) {
    const charName = list[i];
    const x = startX + i * (selectWidth + spacing);
    const y = selectY;
    const isSelected = characterConfig.current === charName;
    const isUnlocked = progressionSystem.isCharacterUnlocked(game.progression, charName);

    drawGlassPanel(ctx, x, y, selectWidth, selectHeight, {
      radius: 18,
      shadowBlur: isSelected ? 18 : 10,
      glow: isSelected ? 'rgba(255, 221, 120, 0.2)' : 'rgba(0, 0, 0, 0.08)',
      stroke: isSelected ? 'rgba(255, 221, 120, ' + (0.28 + breathe * 0.18) + ')' : 'rgba(255, 255, 255, 0.12)',
      stops: [
        [0, 'rgba(19, 34, 57, 0.88)'],
        [1, 'rgba(10, 18, 31, 0.84)']
      ]
    });

    const frames = characterConfig.frames[charName];
    if (frames && frames[0] && frames[0].width > 0) {
      ctx.drawImage(frames[0], x + 28, y + 18, 64, 64);
    }

    ctx.save();
    ctx.fillStyle = isSelected ? '#ffe39a' : '#ffffff';
    ctx.font = font(14, '700');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(characterConfig.names[charName] || charName, x + selectWidth / 2, y + 94);
    ctx.restore();

    if (isSelected) {
      drawBadge(ctx, x + 24, y + 112, '使用中', {
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

  const closeBtnSize = 36;
  const closeBtnX = W - closeBtnSize - 18;
  const closeBtnY = 22;
  game.closeCharacterPanel = { x: closeBtnX, y: closeBtnY, w: closeBtnSize, h: closeBtnSize };
  drawCloseButton(ctx, closeBtnX, closeBtnY, closeBtnSize, {
    glow: 'rgba(255, 127, 127, 0.12)'
  });
}

module.exports = {
  drawCharacterSelect
};
