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
  }

  attachRandomMushroom(platform, height) {
    if (!platform || platform.type === 'ground') return platform;

    const spawnChance = height > 800 ? 0.16 : 0.1;
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
    if (roll < 0.45) return 'line';
    if (roll < 0.75) return 'zigzag';
    return 'arc';
  }

  buildPlatformCoinPattern(platform, type) {
    const coins = [];
    const usableWidth = Math.max(36, platform.w - 26);
    const leftPadding = Math.max(12, (platform.w - usableWidth) / 2);

    if (type === 'line') {
      const count = platform.w > 90 ? 4 : 3;
      for (let i = 0; i < count; i++) {
        coins.push(this.createCoin({
          platform: platform,
          xOffset: leftPadding + (usableWidth * (i + 0.5)) / count,
          yOffset: -22,
          floatPhase: Math.random() * Math.PI * 2,
          value: 1,
          source: 'platform'
        }));
      }
      return coins;
    }

    if (type === 'zigzag') {
      const count = 4;
      for (let i = 0; i < count; i++) {
        coins.push(this.createCoin({
          platform: platform,
          xOffset: leftPadding + (usableWidth * (i + 0.5)) / count,
          yOffset: -18 - (i % 2 === 0 ? 0 : 12),
          floatPhase: Math.random() * Math.PI * 2,
          value: 1,
          source: 'platform'
        }));
      }
      return coins;
    }

    const count = 5;
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0 : i / (count - 1);
      const arcLift = Math.sin(t * Math.PI) * 20;
      coins.push(this.createCoin({
        platform: platform,
        xOffset: leftPadding + usableWidth * t,
        yOffset: -18 - arcLift,
        floatPhase: Math.random() * Math.PI * 2,
        value: i === 2 ? 2 : 1,
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
    const patternType = Math.random() < 0.55 ? 'bridge' : 'diagonal';

    if (patternType === 'diagonal') {
      const count = 4;
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0 : i / (count - 1);
        coins.push(this.createCoin({
          x: fromX + (toX - fromX) * t,
          y: maxY - verticalSpan * 0.15 - t * Math.min(42, verticalSpan * 0.5),
          floatPhase: Math.random() * Math.PI * 2,
          value: i === count - 1 ? 2 : 1,
          source: 'air'
        }));
      }
      return coins;
    }

    const count = 5;
    const spanX = Math.max(70, Math.min(160, Math.abs(toX - fromX) + 40));
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0 : i / (count - 1);
      const x = centerX - spanX / 2 + spanX * t;
      const y = maxY - 20 - Math.sin(t * Math.PI) * Math.min(52, verticalSpan * 0.7);
      coins.push(this.createCoin({
        x: Math.max(28, Math.min(W - 28, x)),
        y: Math.max(minY + 6, y),
        floatPhase: Math.random() * Math.PI * 2,
        value: i === 2 ? 2 : 1,
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
    const centerX = Math.random() * (W - 120) + 60;
    const patternType = Math.random() < 0.5 ? 'sweep' : 'snake';
    const coins = [];

    if (patternType === 'sweep') {
      const count = 6;
      const direction = Math.random() < 0.5 ? -1 : 1;
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0 : i / (count - 1);
        const x = centerX + direction * (t - 0.5) * 150;
        const y = bandY - Math.sin(t * Math.PI) * 36;
        coins.push(this.createCoin({
          x: Math.max(28, Math.min(W - 28, x)),
          y: y,
          floatPhase: Math.random() * Math.PI * 2,
          value: i === Math.floor(count / 2) ? 2 : 1,
          source: 'dynamic'
        }));
      }
    } else {
      const count = 7;
      const step = 24;
      for (let i = 0; i < count; i++) {
        const x = centerX + (i - (count - 1) / 2) * step;
        const y = bandY - Math.sin(i * 0.9) * 26;
        coins.push(this.createCoin({
          x: Math.max(28, Math.min(W - 28, x)),
          y: y,
          floatPhase: Math.random() * Math.PI * 2,
          value: i === count - 1 ? 2 : 1,
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
      const platform = platformPhysics.createPlatformWithSkin(px, py, type);
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
      let ny = lastP.y - (80 + Math.random() * 60);
      let nx = Math.random() * (W - 100) + 10;
      let type = 'normal';
      const h = -ny;

      // 平台类型生成概率
      // normal：普通台子和冰块台子随机出现（表格配置）
      // boost：弹跳台子（暂时用moving资源）
      // moving：移动的台子
      // crumble：岩石台子，踩中消失
      if (h > 300 && Math.random() < 0.15) type = 'boost';
      if (h > 200 && Math.random() < 0.15) type = 'moving';
      if (h > 800 && Math.random() < 0.1) type = 'crumble';

      const platform = platformPhysics.createPlatformWithSkin(nx, ny, type);
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
