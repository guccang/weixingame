/**
 * 物理常量配置
 * 基础值较低，可通过升级系统提升
 */

module.exports = {
  GRAVITY: 0.45,
  PLAYER_SPEED: 4.5,          // 初始移动速度（可升级）
  JUMP_FORCE: -12,            // 初始跳跃力（可升级）
  BOOST_JUMP_FORCE: -18,      // 弹跳台跳跃力
  DOUBLE_JUMP_FORCE: -15,     // 二段跳跳跃力
  SLIDE_FALL_FORCE: 20,
  PARTICLE_GRAVITY: 0.15,
  MAX_FALL_SPEED: 20,
  FRICTION: 0.85
};
