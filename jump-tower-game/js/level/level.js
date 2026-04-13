/**
 * 关卡生成器
 * 使用表格配置的平台数据
 */

const { platform: platformPhysics } = require('../physics/physics');
const progressionSystem = require('../progression/progression');
const gameConstants = require('../game/constants');
const debugRuntime = require('../game/debugRuntime');

const RESONANCE_COLORS = ['#55efc4', '#ffd166', '#74b9ff'];

class LevelGenerator {
  constructor() {
    this.platforms = [];
    this.coins = [];
    this.nextDynamicCoinY = 0;
    this.difficultyManager = null;
    this.runDirector = null;
  }

  setDifficultyManager(difficultyManager) {
    this.difficultyManager = difficultyManager || null;
  }

  setRunDirector(runDirector) {
    this.runDirector = runDirector || null;
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

  getThemeSpawnProfile(scoreHeight) {
    if (!this.runDirector) return null;
    return this.runDirector.getSpawnProfile(scoreHeight);
  }

  getDebugProfile() {
    return this.runDirector && this.runDirector.game ? this.runDirector.game.debugProfile : null;
  }

  pickPlatformType(scoreHeight) {
    const themeProfile = this.getThemeSpawnProfile(scoreHeight);
    const themePlatformConfig = themeProfile ? themeProfile.platformConfig : null;
    const boostChance = themePlatformConfig ? Math.min(0.45, themePlatformConfig.boostChance || 0) : (scoreHeight > 30 ? 0.15 : 0);
    const movingChance = themePlatformConfig ? Math.min(0.45, themePlatformConfig.movingChance || 0) : (scoreHeight > 20 ? 0.15 : 0);
    const crumbleChance = themePlatformConfig ? Math.min(0.35, themePlatformConfig.crumbleChance || 0) : (scoreHeight > 80 ? 0.1 : 0);
    const roll = Math.random();

    let pickedType = 'normal';
    if (roll < boostChance) {
      pickedType = 'boost';
    } else if (roll < boostChance + movingChance) {
      pickedType = 'moving';
    } else if (roll < boostChance + movingChance + crumbleChance) {
      pickedType = 'crumble';
    }

    return debugRuntime.resolvePlatformBaseType(this.getDebugProfile(), pickedType);
  }

  applyPlatformSpecial(platform, W, scoreHeight, themeProfile) {
    if (!platform || platform.type === 'ground') return platform;

    const debugProfile = this.getDebugProfile();
    if (!debugRuntime.allowsPlatformSpecial(debugProfile, 'charge') &&
        !debugRuntime.allowsPlatformSpecial(debugProfile, 'resonance') &&
        !debugRuntime.allowsPlatformSpecial(debugProfile, 'risk')) {
      return platform;
    }

    const config = gameConstants.runEventConfig.platformSpecial;
    const themePlatformConfig = themeProfile ? themeProfile.platformConfig : null;
    const boostBias = themePlatformConfig ? (themePlatformConfig.boostChance || 0) * 0.08 : 0;
    const movingBias = themePlatformConfig ? (themePlatformConfig.movingChance || 0) * 0.08 : 0;
    const crumbleBias = themePlatformConfig ? (themePlatformConfig.crumbleChance || 0) * 0.12 : 0;
    const chargeChance = Math.max(0, config.chargeChance + boostBias);
    const resonanceChance = Math.max(0, config.resonanceChance + movingBias);
    const riskChance = Math.max(0, config.riskChance + crumbleBias);
    const roll = Math.random();

    const forcedMode = debugProfile ? debugProfile.platformMode : 'normal';

    if ((forcedMode === 'charge_only' || (roll < chargeChance && platform.type !== 'crumble')) &&
        platform.type !== 'crumble' &&
        debugRuntime.allowsPlatformSpecial(debugProfile, 'charge')) {
      platform.specialType = 'charge';
      platform.specialColor = '#55efc4';
      platform.specialConsumed = false;
      return platform;
    }

    if ((forcedMode === 'resonance_only' || (roll < chargeChance + resonanceChance && platform.type !== 'crumble')) &&
        platform.type !== 'crumble' &&
        debugRuntime.allowsPlatformSpecial(debugProfile, 'resonance')) {
      platform.specialType = 'resonance';
      platform.specialConsumed = false;
      platform.resonanceColor = RESONANCE_COLORS[Math.floor(Math.random() * RESONANCE_COLORS.length)];
      return platform;
    }

    if ((forcedMode === 'risk_only' || (roll < chargeChance + resonanceChance + riskChance && platform.type !== 'crumble' && platform.type !== 'ground')) &&
        platform.type !== 'crumble' &&
        platform.type !== 'ground' &&
        debugRuntime.allowsPlatformSpecial(debugProfile, 'risk')) {
      platform.specialType = 'risk';
      platform.specialColor = '#ff7675';
      platform.specialConsumed = false;
      platform.riskRewardCoins = Math.max(1, Math.round(config.riskRewardCoins));
      platform.w = Math.max(54, platform.w * Math.max(0.45, config.riskWidthScale));
      platform.x = Math.max(8, Math.min(W - platform.w - 8, platform.x));
      return platform;
    }

    return platform;
  }

  decorateGeneratedPlatform(platform, W, scoreHeight) {
    if (!platform) return platform;
    const themeProfile = this.getThemeSpawnProfile(scoreHeight);
    platform.runtimeMoveSpeedScale = this.runDirector ? this.runDirector.getMovingPlatformSpeedScale() : 1;
    if (themeProfile && themeProfile.theme && themeProfile.theme.accentColor) {
      platform.themeColor = themeProfile.theme.accentColor;
    }
    platform = this.applyPlatformSpecial(platform, W, scoreHeight, themeProfile);
    if (this.runDirector && typeof this.runDirector.onPlatformGenerated === 'function') {
      this.runDirector.onPlatformGenerated(platform, scoreHeight, W);
    }
    return platform;
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
      const heightScore = Math.max(0, -py / 10);
      let type = i < 3 ? 'normal' : this.pickPlatformType(heightScore);
      const platform = this.applyPlatformDifficulty(
        platformPhysics.createPlatformWithSkin(px, py, type),
        heightScore
      );
      this.decorateGeneratedPlatform(platform, W, heightScore);
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
      const h = -ny;
      const heightScore = Math.max(0, h / 10);
      const type = this.pickPlatformType(heightScore);

      const platform = this.applyPlatformDifficulty(
        platformPhysics.createPlatformWithSkin(nx, ny, type),
        heightScore
      );
      this.decorateGeneratedPlatform(platform, W, heightScore);
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
