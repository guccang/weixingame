/**
 * 关卡生成器
 * 使用表格配置的平台数据
 */

const { platform: platformPhysics } = require('../physics/physics');

class LevelGenerator {
  constructor() {
    this.platforms = [];
  }

  /**
   * 初始化关卡 - 生成初始平台
   */
  initLevel(W, H, characterConfig) {
    const platforms = [];

    // 地面平台
    const ground = platformPhysics.createPlatformWithSkin(W / 2 - 100, H - 40, 'ground');
    ground.w = 200;
    platforms.push(ground);

    // 初始平台 (12个)
    for (let i = 0; i < 12; i++) {
      let px = Math.random() * (W - 100) + 10;
      let py = H - 100 - i * 70;
      let type = 'normal';
      if (i > 4 && Math.random() < 0.2) type = 'boost';
      if (i > 6 && Math.random() < 0.15) type = 'moving';
      platforms.push(platformPhysics.createPlatformWithSkin(px, py, type));
    }

    this.platforms = platforms;
    return platforms;
  }

  /**
   * 生成新平台 - 玩家上升时动态生成
   */
  generatePlatforms(W, cameraY, H) {
    const topScreen = cameraY - 100;
    while (
      this.platforms.length === 0 ||
      this.platforms[this.platforms.length - 1].y > topScreen - H
    ) {
      const lastP = this.platforms[this.platforms.length - 1];
      let ny = lastP.y - (80 + Math.random() * 60);
      let nx = Math.random() * (W - 100) + 10;
      let type = 'normal';
      const h = -ny;

      if (h > 300 && Math.random() < 0.25) type = 'boost';
      if (h > 200 && Math.random() < 0.2) type = 'moving';
      if (h > 800 && Math.random() < 0.1) type = 'crumble';

      this.platforms.push(platformPhysics.createPlatformWithSkin(nx, ny, type));
    }

    // 清理屏幕下方不可见的平台
    const toRemove = this.platforms.filter(p => p.dead || p.y >= cameraY + H + 200);
    for (const p of toRemove) {
      const idx = this.platforms.indexOf(p);
      if (idx !== -1) this.platforms.splice(idx, 1);
    }
  }

  getPlatforms() {
    return this.platforms;
  }

  setPlatforms(platforms) {
    this.platforms = platforms;
  }

  reset() {
    this.platforms = [];
  }
}

module.exports = LevelGenerator;
