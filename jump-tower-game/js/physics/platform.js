/**
 * 平台物理系统
 * 使用表格配置的平台属性
 */

const platformConfig = require('../platform/platformConfig');

/**
 * 创建平台
 * @param {number} x - x坐标
 * @param {number} y - y坐标
 * @param {string} type - 平台类型: normal, boost, moving, crumble, ground
 * @param {Object} skinConfig - 可选的皮肤配置（从表格获取）
 * @returns {Object} 平台对象
 */
function createPlatform(x, y, type, skinConfig) {
  // 如果没有提供皮肤配置，随机获取一个
  if (!skinConfig) {
    skinConfig = platformConfig.getRandomByType(type);
  }

  return {
    x,
    y,
    w: 100,
    h: 25,
    type: type || 'normal',
    // 皮肤配置（从表格）
    skinId: skinConfig ? skinConfig.Id : 0,
    skinName: skinConfig ? skinConfig.Name : '',
    bounceForce: skinConfig ? skinConfig.BounceForce : 1.0,
    moveSpeed: skinConfig ? skinConfig.MoveSpeed : 0,
    moveRange: skinConfig ? skinConfig.MoveRange : 0,
    // 状态
    bounced: false,
    crumbling: false,
    dead: false,
    vx: 0,
    vy: 0,
    falling: false,
    angle: 0,
    va: 0
  };
}

/**
 * 获取移动平台当前x坐标
 * @param {Object} platform - 平台对象
 * @param {number} time - 当前时间戳
 * @returns {number} 当前x坐标
 */
function getMovingPlatformX(platform, time) {
  if (platform.type === 'moving' && !platform.falling && platform.moveRange > 0) {
    // 使用表格配置的移动速度和范围
    const speed = platform.moveSpeed || 3.0;
    const range = platform.moveRange || 60;
    return platform.x + Math.sin(time * 0.001 * speed + platform.y) * range;
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
  platform.vy += 0.5;
  platform.angle += platform.va;
}

/**
 * 检测玩家与平台的碰撞
 */
function checkCollision(player, platform, time, isChargingDash) {
  const px = getMovingPlatformX(platform, time);
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
  // 使用表格配置的弹跳力
  const bounceMultiplier = platform.bounceForce || 1.0;
  return physics.JUMP_FORCE * bounceMultiplier;
}

/**
 * 根据类型随机创建平台（带皮肤）
 * @param {number} x - x坐标
 * @param {number} y - y坐标
 * @param {string} type - 平台类型
 * @returns {Object} 平台对象
 */
function createPlatformWithSkin(x, y, type) {
  const skinConfig = platformConfig.getRandomByType(type);
  return createPlatform(x, y, type, skinConfig);
}

module.exports = {
  createPlatform,
  createPlatformWithSkin,
  getMovingPlatformX,
  checkCollision,
  handlePlatformJump,
  updatePlatform
};
