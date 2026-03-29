/**
 * 玩家模块
 * 整合玩家对象创建、状态管理和物理更新
 */

const physics = require('../physics/physics');
const { player: playerPhysics, platform: platformPhysics, particle: particlePhysics } = physics;
const { characterConfig, getCharacterFrame } = require('../character/character');

/**
 * 创建玩家对象
 * @param {number} W - 屏幕宽度
 * @param {number} H - 屏幕高度
 * @returns {Object} 玩家对象
 */
function createPlayer(W, H) {
  return {
    x: W / 2 - 32,
    y: H - 100,
    w: 64,
    h: 64,
    vx: 0,
    vy: 0,
    facing: 1,
    state: 'idle',
    prevState: 'idle',
    stateTimer: 0,
    character: characterConfig.current
  };
}

/**
 * 更新玩家状态
 * @param {Object} player - 玩家对象
 */
function updatePlayerState(player) {
  playerPhysics.updatePlayerState(player);
}

/**
 * 更新玩家水平移动
 * @param {Object} player - 玩家对象
 * @param {Object} controls - 控制系统
 */
function updateHorizontalMovement(player, controls) {
  playerPhysics.updateHorizontalMovement(player, controls);
}

/**
 * 应用重力
 * @param {Object} player - 玩家对象
 */
function applyGravity(player) {
  playerPhysics.applyGravity(player);
}

/**
 * 更新玩家位置
 * @param {Object} player - 玩家对象
 * @param {number} screenWidth - 屏幕宽度
 */
function updatePosition(player, screenWidth) {
  playerPhysics.updatePosition(player, screenWidth);
}

/**
 * 判断玩家是否在下落
 * @param {Object} player - 玩家对象
 * @returns {boolean}
 */
function isFalling(player) {
  return playerPhysics.isFalling(player);
}

/**
 * 获取玩家当前帧图片
 * @param {Object} player - 玩家对象
 * @returns {Image|null}
 */
function getPlayerFrame(player) {
  if (!player) return null;
  const characterName = player.character || characterConfig.current;
  const state = player.state || 'idle';
  return getCharacterFrame(characterName, state);
}

/**
 * 处理玩家与平台的碰撞
 * @param {Object} player - 玩家对象
 * @param {Array} platforms - 平台数组
 * @param {Object} game - 游戏实例
 * @param {number} now - 当前时间戳
 */
function handlePlatformCollisions(player, platforms, game, now) {
  if (!isFalling(player)) return;

  for (let p of platforms) {
    if (platformPhysics.checkCollision(player, p, now)) {
      if (p.type === 'crumble' && !p.crumbling) {
        p.crumbling = true;
        setTimeout(function() { p.dead = true; }, 300);
      }

      if (!p.dead) {
        player.y = p.y - player.h;
        let jumpForce = platformPhysics.handlePlatformJump(player, p, physics.constants);

        if (p.type === 'boost') {
          game.spawnParticles(player.x + player.w / 2, player.y + player.h, '#ffdd57', 20);
          game.shakeTimer = 10;
          game.barrage.show(player.x, player.y - game.cameraY - 40, "火箭弹射！" + game.playerName + "起飞！！！", '#ffdd57');
        }

        player.vy = jumpForce;
        game.combo++;
        game.controls.canDoubleJump = true;
        game.controls.hasDoubleJumped = false;
        game.spawnParticles(player.x + player.w / 2, player.y + player.h, '#74b9ff', 8);
        game.audio.playJump();

        if (now - game.lastPraiseTime > 800) {
          game.lastPraiseTime = now;
          if (game.combo > 5) {
            game.barrage.show(player.x, player.y - game.cameraY - 30, game.combo + "连跳！" + game.playerName + "太强了！", '#ff6b6b');
          } else {
            const praise = game.praiseSystem.getRandomPraise();
            const colors = ['#ffdd57', '#ff6b6b', '#74b9ff', '#55efc4', '#fd79a8', '#ffeaa7'];
            game.barrage.show(player.x, player.y - game.cameraY - 30, praise, colors[Math.floor(Math.random() * colors.length)]);
          }
        }
      }
    }
  }
}

/**
 * 更新相机
 * @param {Object} player - 玩家对象
 * @param {Object} game - 游戏实例
 */
function updateCamera(player, game) {
  const targetCam = player.y - game.H * 0.4;
  if (targetCam < game.cameraY) {
    game.cameraY += (targetCam - game.cameraY) * 0.25;
  }
  const playerScreenY = player.y - game.cameraY;
  if (playerScreenY < 50) {
    game.cameraY = player.y - 50;
  }
}

/**
 * 更新分数
 * @param {Object} player - 玩家对象
 * @param {Object} game - 游戏实例
 */
function updateScore(player, game) {
  const currentHeight = Math.floor((-player.y + game.H - 100) / 10);
  if (currentHeight > game.maxHeight) {
    game.maxHeight = currentHeight;
    game.score = game.maxHeight;

    const milestone = game.praiseSystem.checkMilestone(game.score, game.lastMilestone);
    if (milestone) {
      game.lastMilestone = milestone.h;
      game.barrage.show(game.W / 2 - 100, game.H / 2 - game.cameraY, milestone.msg, '#ff6b6b');
      game.shakeTimer = 15;
      game.spawnParticles(game.W / 2, game.H / 2, '#ff6b6b', 30);
    }
  }
}

/**
 * 检查游戏结束
 * @param {Object} player - 玩家对象
 * @param {Object} game - 游戏实例
 */
function checkGameOver(player, game) {
  if (player.y > game.cameraY + game.H + 100) {
    game.gameOver();
    return true;
  }
  return false;
}

module.exports = {
  createPlayer,
  updatePlayerState,
  updateHorizontalMovement,
  applyGravity,
  updatePosition,
  isFalling,
  getPlayerFrame,
  handlePlatformCollisions,
  updateCamera,
  updateScore,
  checkGameOver
};
