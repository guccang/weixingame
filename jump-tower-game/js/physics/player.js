/**
 * 玩家物理系统
 */

const physics = require('./constants');

/**
 * 创建玩家物理对象
 * @param {number} x - x坐标
 * @param {number} y - y坐标
 * @param {number} w - 宽度
 * @param {number} h - 高度
 * @returns {Object} 玩家物理对象
 */
function createPlayer(x, y, w, h) {
  return {
    x,
    y,
    w,
    h,
    vx: 0,
    vy: 0,
    facing: 1
  };
}

/**
 * 更新玩家水平移动
 * @param {Object} player - 玩家对象
 * @param {Object} controls - 控制系统
 */
function updateHorizontalMovement(player, controls) {
  if (controls.keys['ArrowLeft'] || controls.keys['a']) {
    player.vx = -physics.PLAYER_SPEED;
    player.facing = -1;
  } else if (controls.keys['ArrowRight'] || controls.keys['d']) {
    player.vx = physics.PLAYER_SPEED;
    player.facing = 1;
  } else {
    player.vx *= physics.FRICTION;
  }
}

/**
 * 应用重力到玩家
 * @param {Object} player - 玩家对象
 */
function applyGravity(player) {
  player.vy += physics.GRAVITY;
  // 限制最大下落速度
  if (player.vy > physics.MAX_FALL_SPEED) {
    player.vy = physics.MAX_FALL_SPEED;
  }
}

/**
 * 更新玩家位置
 * @param {Object} player - 玩家对象
 * @param {number} screenWidth - 屏幕宽度
 */
function updatePosition(player, screenWidth) {
  player.x += player.vx;
  player.y += player.vy;

  // 屏幕边界循环
  if (player.x > screenWidth) {
    player.x = -player.w;
  }
  if (player.x + player.w < 0) {
    player.x = screenWidth;
  }
}

/**
 * 根据速度判断玩家状态
 * @param {Object} player - 玩家对象
 */
function updatePlayerState(player) {
  if (!player) return;
  const prevState = player.state;

  // 根据速度判断状态
  if (player.vy < -5) {
    // 快速上升 - 起跳或上升
    if (prevState === 'idle' || prevState === 'charge') {
      player.state = 'jump';
      player.stateTimer = 5;
    } else if (player.stateTimer <= 0) {
      player.state = 'rise';
    }
  } else if (player.vy < 0) {
    // 缓慢上升 - 上升
    player.state = 'rise';
  } else if (player.vy > 2) {
    // 下落
    player.state = 'fall';
  } else {
    // 接近静止 - 站立或落地
    if (prevState === 'fall') {
      player.state = 'land';
      player.stateTimer = 8;
    } else if (player.stateTimer <= 0) {
      player.state = 'idle';
    }
  }

  // 更新状态计时器
  if (player.stateTimer > 0) {
    player.stateTimer--;
  }
}

/**
 * 玩家是否在下落
 * @param {Object} player - 玩家对象
 * @returns {boolean}
 */
function isFalling(player) {
  return player.vy > 0;
}

module.exports = {
  createPlayer,
  updateHorizontalMovement,
  applyGravity,
  updatePosition,
  updatePlayerState,
  isFalling,
  physics
};
