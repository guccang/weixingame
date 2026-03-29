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
    dead: false
  };
}

/**
 * 获取移动平台当前x坐标
 * @param {Object} platform - 平台对象
 * @param {number} time - 当前时间戳
 * @returns {number} 当前x坐标
 */
function getMovingPlatformX(platform, time) {
  if (platform.type === 'moving') {
    return platform.x + Math.sin(time * 0.003 + platform.y) * 60;
  }
  return platform.x;
}

/**
 * 检测玩家与平台的碰撞
 * @param {Object} player - 玩家对象
 * @param {Object} platform - 平台对象
 * @param {number} time - 当前时间戳
 * @returns {boolean} 是否碰撞
 */
function checkCollision(player, platform, time) {
  const px = getMovingPlatformX(platform, time);
  return (
    player.x + player.w > px &&
    player.x < px + platform.w &&
    player.y + player.h >= platform.y &&
    player.y + player.h <= platform.y + platform.h + player.vy + 5
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
  handlePlatformJump
};
