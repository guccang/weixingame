/**
 * 玩家绘制模块
 */

const { characterConfig, STATE_TO_FRAME_INDEX } = require('../character/character');

/**
 * 绘制玩家
 * @param {CanvasRenderingContext2D} ctx - canvas上下文
 * @param {Object} player - 玩家对象
 * @param {number} cameraY - 相机Y偏移
 * @param {Object} characterConfig - 角色配置
 * @param {Object} skillSystem - 技能系统（可选）
 */
function drawPlayer(ctx, player, cameraY, characterConfig, skillSystem) {
  if (!player) return;
  const py = player.y - cameraY;
  const px = player.x;
  const f = player.facing;

  // 尝试使用序列帧图片绘制
  const characterName = player.character || characterConfig.current;

  // 优先使用技能系统的帧索引，否则使用状态映射
  let frameIndex;
  if (skillSystem) {
    frameIndex = skillSystem.getCurrentFrameIndex();
  } else {
    const state = player.state || 'idle';
    frameIndex = STATE_TO_FRAME_INDEX[state] || 0;
  }

  const frame = characterConfig.frames[characterName]
    ? characterConfig.frames[characterName][frameIndex]
    : null;

  if (frame && frame.width > 0) {
    // 使用序列帧图片
    ctx.save();
    ctx.translate(px + player.w / 2, py + player.h / 2);

    // 根据朝向翻转
    if (f < 0) {
      ctx.scale(-1, 1);
    }

    // 绘制发光效果
    const glow = ctx.createRadialGradient(0, 0, 5, 0, 0, 35);
    glow.addColorStop(0, 'rgba(255,221,87,0.3)');
    glow.addColorStop(1, 'rgba(255,221,87,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-35, -35, 70, 70);

    // 绘制角色图片
    ctx.drawImage(frame, -player.w / 2, -player.h / 2, player.w, player.h);
    ctx.restore();
    return;
  }

  // 回退到代码绘制（图片未加载时）
  ctx.save();
  ctx.translate(px + player.w / 2, py + player.h / 2);

  const glow = ctx.createRadialGradient(0, 0, 5, 0, 0, 35);
  glow.addColorStop(0, 'rgba(255,221,87,0.3)');
  glow.addColorStop(1, 'rgba(255,221,87,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(-35, -35, 70, 70);

  const legAnim = Math.sin(Date.now() * 0.01) * 5;
  ctx.fillStyle = '#2d3436';
  ctx.fillRect(-10, 12, 8, 16 + legAnim);
  ctx.fillRect(2, 12, 8, 16 - legAnim);

  ctx.fillStyle = '#e17055';
  ctx.fillRect(-12, 26 + legAnim, 12, 5);
  ctx.fillRect(0, 26 - legAnim, 12, 5);

  ctx.fillStyle = '#ff6b6b';
  ctx.beginPath();
  ctx.moveTo(-14, -8);
  ctx.lineTo(14, -8);
  ctx.lineTo(12, 14);
  ctx.lineTo(-12, 14);
  ctx.closePath();
  ctx.fill();

  const armAnim = Math.sin(Date.now() * 0.008) * 8;
  ctx.fillStyle = '#fdcb6e';
  ctx.save();
  ctx.translate(-14, -2);
  ctx.rotate((-30 + armAnim) * Math.PI / 180);
  ctx.fillRect(-4, 0, 8, 18);
  ctx.beginPath();
  ctx.arc(0, 6, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(14, -2);
  ctx.rotate((30 - armAnim) * Math.PI / 180);
  ctx.fillRect(-4, 0, 8, 18);
  ctx.beginPath();
  ctx.arc(0, 6, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#fdcb6e';
  ctx.beginPath();
  ctx.arc(0, -16, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2d3436';
  ctx.beginPath();
  ctx.arc(0, -20, 11, Math.PI, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2d3436';
  ctx.beginPath();
  ctx.arc(-4 * f, -17, 2, 0, Math.PI * 2);
  ctx.arc(4 * f, -17, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#2d3436';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, -14, 5, 0.1, Math.PI - 0.1);
  ctx.stroke();

  ctx.strokeStyle = '#ff6b6b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, -18, 12, Math.PI * 0.8, Math.PI * 0.2);
  ctx.stroke();

  ctx.restore();
}

module.exports = {
  drawPlayer
};
