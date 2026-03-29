/**
 * 粒子物理系统
 */

const physics = require('./constants');

/**
 * 创建粒子
 * @param {number} x - x坐标
 * @param {number} y - y坐标
 * @param {string} color - 颜色
 * @param {number} count - 数量
 * @returns {Array} 粒子数组
 */
function spawnParticles(x, y, color, count) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8 - 3,
      life: 1,
      color,
      r: Math.random() * 4 + 2
    });
  }
  return particles;
}

/**
 * 更新粒子物理
 * @param {Array} particles - 粒子数组
 * @returns {Array} 存活的粒子
 */
function updateParticles(particles) {
  return particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += physics.PARTICLE_GRAVITY;
    p.life -= 0.025;
    return p.life > 0;
  });
}

module.exports = {
  spawnParticles,
  updateParticles
};
