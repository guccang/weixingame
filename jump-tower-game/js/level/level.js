/**
 * 关卡生成器
 * 使用表格配置的平台数据
 */

const { platform: platformPhysics } = require('../physics/physics');
const progressionSystem = require('../progression/progression');

class LevelGenerator {
  constructor() {
    this.platforms = [];
    this.coins = [];
    this.nextDynamicCoinY = 0;
    this.difficultyManager = null;
  }

  setDifficultyManager(difficultyManager) {
    this.difficultyManager = difficultyManager || null;
  }

  getDifficultyProfile(scoreHeight) {
    if (!this.difficultyManager) return null;
    return this.difficultyManager.getProfile(scoreHeight);
  }

  getPlatformGap(scoreHeight) {
    const profile = this.getDifficultyProfile(scoreHeight);
    if (!profile) {
      return 80 + Math.random() * 60;
    }
    return profile.platformGapMin + Math.random() * (profile.platformGapMax - profile.platformGapMin);
  }

  applyPlatformDifficulty(platform, scoreHeight) {
    if (!platform || !this.difficultyManager) return platform;
    return this.difficultyManager.applyPlatformModifiers(platform, scoreHeight);
  }

  attachRandomMushroom(platform, height) {
    if (!platform || platform.type === 'ground') return platform;

    // 降低蘑菇生成概率30%
    const spawnChance = height > 800 ? 0.112 : 0.07;
    if (Math.random() >= spawnChance) {
      platform.mushroom = null;
      return platform;
    }

    const mushroomW = 26;
    const mushroomH = 24;
    platform.mushroom = {
      type: 'growth',
      collected: false,
      w: mushroomW,
      h: mushroomH,
      xOffset: (platform.w - mushroomW) / 2,
      yOffset: -mushroomH + 2
    };
    return platform;
  }

  attachRandomCoin(platform, height) {
    if (!platform || platform.type === 'ground') return;

    const spawnChance = height > 1200
      ? progressionSystem.getEconomyValue('PLATFORM_COIN_CHANCE_HIGH', 0.28)
      : (height > 400
        ? progressionSystem.getEconomyValue('PLATFORM_COIN_CHANCE_MID', 0.22)
        : progressionSystem.getEconomyValue('PLATFORM_COIN_CHANCE_LOW', 0.16));
    if (Math.random() >= spawnChance) {
      platform.coin = null;
      return;
    }

    const patternType = this.pickPlatformCoinPattern();
    const patternCoins = this.buildPlatformCoinPattern(platform, patternType);
    if (patternCoins.length === 0) {
      platform.coin = null;
      return;
    }

    platform.coin = patternCoins[0];
    this.coins.push(...patternCoins);
  }

  pickPlatformCoinPattern() {
    const roll = Math.random();
    if (roll < 0.62) return 'single';
    if (roll < 0.9) return 'vertical';
    return 'shortColumn';
  }

  buildPlatformCoinPattern(platform, type) {
    const coins = [];
    const usableWidth = Math.max(36, platform.w - 26);
    const leftPadding = Math.max(12, (platform.w - usableWidth) / 2);

    if (type === 'single') {
      coins.push(this.createCoin({
        platform: platform,
        xOffset: leftPadding + Math.random() * usableWidth,
        yOffset: -22,
        floatPhase: Math.random() * Math.PI * 2,
        value: Math.random() < 0.12 ? 2 : 1,
        source: 'platform'
      }));
      return coins;
    }

    if (type === 'vertical') {
      const count = 3;
      const columnX = leftPadding + usableWidth * (0.3 + Math.random() * 0.4);
      for (let i = 0; i < count; i++) {
        coins.push(this.createCoin({
          platform: platform,
          xOffset: columnX,
          yOffset: -18 - i * 20,
          floatPhase: Math.random() * Math.PI * 2,
          value: i === count - 1 ? 2 : 1,
          source: 'platform'
        }));
      }
      return coins;
    }

    const count = 4;
    const columnX = leftPadding + usableWidth * (0.25 + Math.random() * 0.5);
    for (let i = 0; i < count; i++) {
      coins.push(this.createCoin({
        platform: platform,
        xOffset: columnX + (i % 2 === 0 ? -6 : 6),
        yOffset: -20 - i * 18,
        floatPhase: Math.random() * Math.PI * 2,
        value: i === count - 1 ? 2 : 1,
        source: 'platform'
      }));
    }
    return coins;
  }

  maybeSpawnFloatingCoin(W, topY, bottomY, fromPlatform, toPlatform) {
    if (Math.random() >= progressionSystem.getEconomyValue('AIR_COIN_CHANCE', 0.08)) return;

    const minY = Math.min(topY, bottomY) + 18;
    const maxY = Math.max(topY, bottomY) - 18;
    if (maxY - minY < 36) return;

    const patternCoins = this.buildFloatingCoinPattern(W, minY, maxY, fromPlatform, toPlatform);
    if (patternCoins.length > 0) {
      this.coins.push(...patternCoins);
    }
  }

  buildFloatingCoinPattern(W, minY, maxY, fromPlatform, toPlatform) {
    const coins = [];
    const fromX = fromPlatform ? fromPlatform.x + fromPlatform.w / 2 : Math.random() * (W - 80) + 40;
    const toX = toPlatform ? toPlatform.x + toPlatform.w / 2 : Math.random() * (W - 80) + 40;
    const centerX = (fromX + toX) / 2;
    const verticalSpan = Math.max(40, maxY - minY);
    const patternType = Math.random() < 0.65 ? 'single' : (Math.random() < 0.85 ? 'vertical' : 'shortDiagonal');

    if (patternType === 'single') {
      coins.push(this.createCoin({
        x: Math.max(28, Math.min(W - 28, centerX)),
        y: maxY - verticalSpan * (0.25 + Math.random() * 0.35),
        floatPhase: Math.random() * Math.PI * 2,
        value: Math.random() < 0.16 ? 2 : 1,
        source: 'air'
      }));
      return coins;
    }

    if (patternType === 'shortDiagonal') {
      const count = 3;
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0 : i / (count - 1);
        coins.push(this.createCoin({
          x: centerX + (fromX < toX ? 1 : -1) * i * 12,
          y: maxY - verticalSpan * 0.2 - t * Math.min(40, verticalSpan * 0.45),
          floatPhase: Math.random() * Math.PI * 2,
          value: i === count - 1 ? 2 : 1,
          source: 'air'
        }));
      }
      return coins;
    }

    const count = 3;
    for (let i = 0; i < count; i++) {
      coins.push(this.createCoin({
        x: Math.max(28, Math.min(W - 28, centerX + (i % 2 === 0 ? -4 : 4))),
        y: Math.max(minY + 6, maxY - 18 - i * 20),
        floatPhase: Math.random() * Math.PI * 2,
        value: i === count - 1 ? 2 : 1,
        source: 'air'
      }));
    }

    return coins;
  }

  initializeDynamicCoinSpawner(H) {
    this.nextDynamicCoinY = 0;
  }

  spawnDynamicCoinBands(W, cameraY, H) {
    if (!this.nextDynamicCoinY) {
      this.nextDynamicCoinY = cameraY - H * 0.35;
    }

    const targetY = cameraY - H * 0.9;

    while (this.nextDynamicCoinY > targetY) {
      this.spawnDynamicCoinPatternAt(W, this.nextDynamicCoinY);
      this.nextDynamicCoinY -= 120 + Math.random() * 70;
    }
  }

  spawnDynamicCoinPatternAt(W, bandY) {
    if (Math.random() < 0.45) {
      return;
    }

    const centerX = Math.random() * (W - 120) + 60;
    const patternType = Math.random() < 0.6 ? 'single' : (Math.random() < 0.88 ? 'vertical' : 'shortColumn');
    const coins = [];

    if (patternType === 'single') {
      coins.push(this.createCoin({
        x: centerX,
        y: bandY,
        floatPhase: Math.random() * Math.PI * 2,
        value: Math.random() < 0.16 ? 2 : 1,
        source: 'dynamic'
      }));
    } else if (patternType === 'vertical') {
      for (let i = 0; i < 3; i++) {
        coins.push(this.createCoin({
          x: centerX,
          y: bandY - i * 20,
          floatPhase: Math.random() * Math.PI * 2,
          value: i === 2 ? 2 : 1,
          source: 'dynamic'
        }));
      }
    } else {
      for (let i = 0; i < 4; i++) {
        coins.push(this.createCoin({
          x: centerX + (i % 2 === 0 ? -5 : 5),
          y: bandY - i * 18,
          floatPhase: Math.random() * Math.PI * 2,
          value: i === 3 ? 2 : 1,
          source: 'dynamic'
        }));
      }
    }

    this.coins.push(...coins);
  }

  createCoin(options) {
    return {
      platform: options.platform || null,
      x: options.x || 0,
      y: options.y || 0,
      xOffset: options.xOffset || 0,
      yOffset: options.yOffset || 0,
      value: options.value || 1,
      floatPhase: options.floatPhase || 0,
      collected: false,
      source: options.source || 'platform',
      radius: options.value > 1 ? 12 : 10
    };
  }

  getCoinPosition(coin, now) {
    const floatOffset = Math.sin(now * 0.004 + coin.floatPhase) * 4;
    if (coin.platform) {
      return {
        x: platformPhysics.getMovingPlatformX(coin.platform, now) + coin.xOffset,
        y: coin.platform.y + coin.yOffset + floatOffset
      };
    }

    return {
      x: coin.x,
      y: coin.y + floatOffset
    };
  }

  cleanupCoins(cameraY, H) {
    this.coins = this.coins.filter((coin) => {
      if (!coin || coin.collected) return false;
      if (coin.platform && (coin.platform.dead || this.platforms.indexOf(coin.platform) === -1)) {
        return false;
      }

      const pos = this.getCoinPosition(coin, Date.now());
      return pos.y > cameraY - H * 1.2 && pos.y < cameraY + H + 220;
    });
  }

  /**
   * 初始化关卡 - 生成初始平台
   */
  initLevel(W, H, characterConfig) {
    const platforms = [];
    this.coins = [];

    // 地面平台
    const ground = platformPhysics.createPlatformWithSkin(W / 2 - 100, H - 40, 'ground');
    ground.w = 200;
    platforms.push(ground);

    // 初始平台 (12个)
    // normal类型：普通台子和冰块台子随机出现（表格配置）
    // crumble类型：岩石台子，踩中消失
    // moving类型：移动的台子
    // boost类型：弹跳台子（暂时用moving资源）
    for (let i = 0; i < 12; i++) {
      let px = Math.random() * (W - 100) + 10;
      let py = H - 100 - i * 70;
      let type = 'normal';
      if (i > 4 && Math.random() < 0.15) type = 'boost';
      if (i > 6 && Math.random() < 0.15) type = 'moving';
      if (i > 8 && Math.random() < 0.1) type = 'crumble';
      const heightScore = Math.max(0, -py / 10);
      const platform = this.applyPlatformDifficulty(
        platformPhysics.createPlatformWithSkin(px, py, type),
        heightScore
      );
      const prevPlatform = platforms.length > 0 ? platforms[platforms.length - 1] : null;
      this.attachRandomCoin(platform, -py);
      platforms.push(this.attachRandomMushroom(platform, -py));
      this.maybeSpawnFloatingCoin(W, py + 24, py + 78, prevPlatform, platform);
    }

    this.platforms = platforms;
    this.initializeDynamicCoinSpawner(H);
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
      const lastHeightScore = Math.max(0, -lastP.y / 10);
      let ny = lastP.y - this.getPlatformGap(lastHeightScore);
      let nx = Math.random() * (W - 100) + 10;
      let type = 'normal';
      const h = -ny;
      const heightScore = Math.max(0, h / 10);

      // 平台类型生成概率
      // normal：普通台子和冰块台子随机出现（表格配置）
      // boost：弹跳台子（暂时用moving资源）
      // moving：移动的台子
      // crumble：岩石台子，踩中消失
      if (h > 300 && Math.random() < 0.15) type = 'boost';
      if (h > 200 && Math.random() < 0.15) type = 'moving';
      if (h > 800 && Math.random() < 0.1) type = 'crumble';

      const platform = this.applyPlatformDifficulty(
        platformPhysics.createPlatformWithSkin(nx, ny, type),
        heightScore
      );
      const prevPlatform = lastP;
      this.attachRandomCoin(platform, h);
      this.platforms.push(this.attachRandomMushroom(platform, h));
      this.maybeSpawnFloatingCoin(W, ny, lastP.y, prevPlatform, platform);
    }

    this.spawnDynamicCoinBands(W, cameraY, H);

    // 清理屏幕下方不可见的平台
    const toRemove = this.platforms.filter(p => p.dead || p.y >= cameraY + H + 200);
    for (const p of toRemove) {
      const idx = this.platforms.indexOf(p);
      if (idx !== -1) this.platforms.splice(idx, 1);
    }

    this.cleanupCoins(cameraY, H);
  }

  getPlatforms() {
    return this.platforms;
  }

  getCoins() {
    return this.coins;
  }

  setPlatforms(platforms) {
    this.platforms = platforms;
  }

  reset() {
    this.platforms = [];
    this.coins = [];
    this.nextDynamicCoinY = 0;
  }
}

module.exports = LevelGenerator;
