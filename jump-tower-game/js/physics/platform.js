/**
 * 平台物理系统
 */

/**
 * 创建平台
 * @param {number} x - x坐标
 * @param {number} y - y坐标
 * @param {string} type - 平台类型: normal, boost, moving, crumble, ground
 * @returns {Object} 平台对象
 */
function createPlatform(x, y, type) {
  return {
    x,
    y,
    w: 85,
    h: 14,
    type: type || 'normal',
    bounced: false,
    crumbling: false,
    dead: false,
    vx: 0,
    vy: 0,
    falling: false,
    angle: 0,  // 旋转角度
    va: 0      // 角速度
  };
}

/**
 * 获取移动平台当前x坐标
 * @param {Object} platform - 平台对象
 * @param {number} time - 当前时间戳
 * @returns {number} 当前x坐标
 */
function getMovingPlatformX(platform, time) {
  if (platform.type === 'moving' && !platform.falling) {
    return platform.x + Math.sin(time * 0.003 + platform.y) * 60;
  }
  return platform.x;
}

/**
 * 更新平台物理（被撞飞后的运动）
 * @param {Object} platform - 平台对象
 */
function updatePlatform(platform) {
  if (!platform.falling) return;
  platform.x += platform.vx;
  platform.y += platform.vy;
  platform.vy += 0.5; // 重力
  platform.angle += platform.va;
}

/**
 * 检测玩家与平台的碰撞
 * @param {Object} player - 玩家对象
 * @param {Object} platform - 平台对象
 * @param {number} time - 当前时间戳
 * @param {boolean} isChargingDash - 是否在蓄力冲刺中
 * @returns {boolean} 是否碰撞
 */
function checkCollision(player, platform, time, isChargingDash) {
  const px = getMovingPlatformX(platform, time);
  // 蓄力冲刺时扩大垂直容差，避免快速移动穿透平台
  const vyTolerance = isChargingDash ? Math.abs(player.vy) + 50 : player.vy + 5;
  return (
    player.x + player.w > px &&
    player.x < px + platform.w &&
    player.y + player.h >= platform.y &&
    player.y + player.h <= platform.y + platform.h + vyTolerance
  );
}

/**
 * 处理平台跳跃
 * @param {Object} player - 玩家对象
 * @param {Object} platform - 平台对象
 * @param {Object} physics - 物理常量
 * @returns {number} 跳跃力度
 */
function handlePlatformJump(player, platform, physics) {
  let jumpForce = physics.JUMP_FORCE;

  if (platform.type === 'boost') {
    jumpForce = physics.BOOST_JUMP_FORCE;
  }

  return jumpForce;
}

module.exports = {
  createPlatform,
  getMovingPlatformX,
  checkCollision,
  handlePlatformJump,
  updatePlatform
};
