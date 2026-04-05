/**
 * 跳跳楼游戏 - 微信小游戏入口
 * 从Go版本移植
 */

// 引入render.js初始化canvas
require('./render');

// 使用全局canvas
const canvas = GameGlobal.canvas;
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

// 图片资源
const images = require('./resource/images');

// ==================== 角色序列帧配置 ====================
const { characterConfig, loadCharacter, switchCharacter } = require('./character/character');

// 职业配置
const { jobConfig, jobPraiseMap } = require('./runtime/jobconfig');

// 夸夸词系统
const PraiseSystem = require('./praise/praise');

// 弹幕系统
const Barrage = require('./barrage/barrage');

// 主界面UI
const MainUI = require('./ui/mainUI');
const UIPanelManager = require('./ui/panelManager');

// 控制系统
const Controls = require('./controls/controls');

// 音效管理
const Audio = require('./audio/audio');

// 物理系统
const physics = require('./physics/physics');
const { platform: platformPhysics, particle: particlePhysics } = physics;

// 平台配置（表格驱动）
const platformConfig = require('./platform/platformConfig');

// 玩家系统
const player = require('./player/player');

// 游戏模式系统
const { GameMode } = require('./game/index');

// 绘制系统
const drawer = require('./drawer/drawer');

// 关卡生成系统
const LevelGenerator = require('./level/level');

// 技能系统
const SkillSystem = require('./skill/skill');

// 游戏操作模块
const GameOperations = require('./game/gameOperations');

// Boss/怪物系统
const BossSystem = require('./monster/boss');
const trailEffects = require('./effects/trail');
const petSystem = require('./pet/pet');
const progressionSystem = require('./progression/progression');

// ==================== 游戏类 ====================
class Game {
  constructor() {
    this.W = W;
    this.H = H;
    this.ctx = ctx;
    this.state = 'start';
    this.playerName = '秀彬';
    this.playerJob = jobConfig.current; // 从职业配置获取

    // 物理常量
    this.GRAVITY = physics.constants.GRAVITY;
    this.PLAYER_SPEED = physics.constants.PLAYER_SPEED;
    this.JUMP_FORCE = physics.constants.JUMP_FORCE;
    this.BOOST_JUMP_FORCE = physics.constants.BOOST_JUMP_FORCE;
    this.DOUBLE_JUMP_FORCE = physics.constants.DOUBLE_JUMP_FORCE;
    this.SLIDE_FALL_FORCE = physics.constants.SLIDE_FALL_FORCE;

    this.score = 0;
    this.maxHeight = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.chargeCount = 0;
    this.chargeFull = false;
    this.chargeDashing = false;
    this.chargeDashEndTime = 0;
    this.lastLandedPlatform = null; // 上次着陆的平台（用于蓄力判断）
    this.cameraY = 0;
    this.lastPraiseTime = 0;
    this.lastMilestone = 0;
    this.shakeTimer = 0;
    this.bossSpawnHeight = 500;
    this.bossSpawnHintShown = false;
    this.controlLockedUntil = 0;
    this.bossKnockbackUntil = 0;
    this.pendingBossLaunch = null;
    this.growthActive = false;
    this.growthScale = 1.55;
    this.growthLaunchScale = 1;
    this.baseStats = {
      PLAYER_SPEED: physics.constants.PLAYER_SPEED,
      JUMP_FORCE: physics.constants.JUMP_FORCE,
      BOOST_JUMP_FORCE: physics.constants.BOOST_JUMP_FORCE,
      DOUBLE_JUMP_FORCE: physics.constants.DOUBLE_JUMP_FORCE,
      CHARGE_MAX: 6,
      growthScale: 1.55
    };
    this.chargeMax = this.baseStats.CHARGE_MAX;
    this.praiseSystem = new PraiseSystem(); // 夸夸词系统
    this.barrage = new Barrage(); // 弹幕系统
    this.particles = [];
    this.trailEffects = [];
    this.coins = [];
    this.pet = null;
    this.bgStars = [];
    this.platforms = [];
    this.player = null;
    this.showCharacterPanel = false; // 是否显示角色选择面板
    this.showShopPanel = false; // 是否显示强化面板
    this.showLeaderboardPanel = false; // 是否显示排行榜面板
    this.rankList = []; // 排行榜数据
    this.rankLoading = false; // 排行榜加载状态
    this.wxUserInfo = null; // 微信用户信息
    this.hasWxLogin = false; // 是否已获取微信登录
    this.progression = progressionSystem.loadProgress();
    this.runRewardSummary = null;
    this.sessionBossCoins = 0;
    this.sessionPickupCoins = 0;
    this.runItemEffects = {};
    this.pendingRunItemEffects = {};
    this.growthExpiresAt = 0;
    this.playerCoinPickupBonus = 0;
    this.petCoinPickupBonus = 0;
    this.petSeekRadiusBonus = 0;
    this.growthDurationMs = progressionSystem.BASE_GROWTH_DURATION_MS;
    this.doubleJumpUnlocked = false;
    this.skillAvailability = {
      doubleJump: false,
      slideFall: false,
      chargeDash: false
    };
    this.shopMessage = '';
    this.shopMessageColor = '#55efc4';
    this.shopMessageUntil = 0;
    this.shopTab = 'upgrades';
    this.coinBadgeArea = null;
    this.debugCoinGrantAmount = 1000;

    this.controls = new Controls(this); // 控制系统
    this.mainUI = new MainUI(this); // 主界面UI
    this.audio = new Audio(); // 音效管理
    this.levelGenerator = new LevelGenerator(); // 关卡生成器
    this.gameMode = new GameMode(); // 游戏模式管理
    this.panelManager = new UIPanelManager(this); // UI面板管理器
    this.skillSystem = new SkillSystem(this); // 技能系统
    this.gameOps = new GameOperations(this); // 游戏操作（分享等）
    this.bossSystem = new BossSystem(this); // Boss系统
    this.animationId = null; // 动画帧ID，用于取消动画循环
    progressionSystem.applyUpgradesToGame(this, this.progression);
    this.syncCharacterSelection();
    this.initStars();
    this.initWxLogin(); // 微信登录获取用户信息
  }

  // 初始化微信登录
  initWxLogin() {
    var _this = this;
    var wxlogin = require('./runtime/wxlogin');
    wxlogin.wxLogin(function(success, userInfo) {
      if (success && userInfo) {
        _this.wxUserInfo = userInfo;
        _this.hasWxLogin = true;
        if (userInfo.nickName) {
          _this.playerName = userInfo.nickName;
          _this.generatePraises();
        }
      }
    });
  }

  initStars() {
    this.bgStars = [];
    for (let i = 0; i < 150; i++) {
      this.bgStars.push({
        x: Math.random() * this.W,
        y: Math.random() * this.H * 10,
        r: Math.random() * 2 + 0.5,
        twinkle: Math.random() * Math.PI * 2
      });
    }
  }

  generatePraises() {
    this.praiseSystem.generate(this.playerName, this.playerJob, jobPraiseMap);
  }

  initGame() {
    progressionSystem.applyUpgradesToGame(this, this.progression);
    this.syncCharacterSelection();
    this.player = player.createPlayer(this.W, this.H);
    this.player.character = progressionSystem.getSelectedCharacterId(this.progression);
    this.particles = [];
    this.trailEffects = [];
    this.coins = [];
    this.pet = null;
    this.barrage.clear(); // 清空弹幕
    this.score = 0;
    this.maxHeight = 0;
    this.cameraY = this.H - 100 - this.H * 0.4;
    this.lastPraiseTime = 0;
    this.lastMilestone = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.shakeTimer = 0;
    this.chargeCount = 0;
    this.chargeFull = false;
    this.chargeDashing = false;
    this.chargeDashEndTime = 0;
    this.lastLandedPlatform = null;
    this.bossSpawnHintShown = false;
    this.controlLockedUntil = 0;
    this.bossKnockbackUntil = 0;
    this.pendingBossLaunch = null;
    this.growthActive = false;
    this.growthExpiresAt = 0;
    this.runRewardSummary = null;
    this.sessionBossCoins = 0;
    this.sessionPickupCoins = 0;
    this.bossSpawnHeight = this.rollBossSpawnHeight();
    this.controls.reset(); // 重置控制系统状态

    // 初始化游戏模式特定状态
    this.gameMode.initForGame(this);

    // 重置技能系统
    this.skillSystem.reset();

    // 重置Boss系统
    this.bossSystem.reset();

    // 使用关卡生成器初始化
    this.platforms = this.levelGenerator.initLevel(this.W, this.H, characterConfig);
    this.coins = this.levelGenerator.getCoins();
    this.pet = progressionSystem.getSelectedPetId(this.progression) ? petSystem.createPet(this.player) : null;
  }

  spawnParticles(x, y, color, count) {
    const newParticles = particlePhysics.spawnParticles(x, y, color, count);
    this.particles.push(...newParticles);
  }

  isControlLocked() {
    return Date.now() < this.controlLockedUntil;
  }

  isImpactDashing() {
    return this.chargeDashing || Date.now() < this.bossKnockbackUntil;
  }

  updatePendingBossLaunch() {
    if (!this.pendingBossLaunch || !this.player) return;

    if (Date.now() < this.pendingBossLaunch.triggerAt) {
      return;
    }

    this.player.vx = this.pendingBossLaunch.vx;
    this.player.vy = this.pendingBossLaunch.vy;
    this.player.state = 'rise';
    this.pendingBossLaunch = null;
  }

  refreshProgressionEffects() {
    progressionSystem.applyUpgradesToGame(this, this.progression);
    this.syncCharacterSelection();
  }

  syncCharacterSelection() {
    const selectedCharacterId = progressionSystem.getSelectedCharacterId(this.progression);
    if (selectedCharacterId && characterConfig.current !== selectedCharacterId) {
      switchCharacter(selectedCharacterId);
    }
    if (this.player) {
      this.player.character = selectedCharacterId || characterConfig.current;
    }
  }

  setShopTab(tabId) {
    this.shopTab = tabId || 'upgrades';
  }

  showShopToast(text, color) {
    this.shopMessage = text;
    this.shopMessageColor = color || '#55efc4';
    this.shopMessageUntil = Date.now() + 1800;
  }

  grantDebugCoins() {
    const reward = progressionSystem.grantCoins(this.progression, this.debugCoinGrantAmount);
    this.progression = reward.progress;
    this.refreshProgressionEffects();
    this.showShopToast('测试金币 +' + reward.coins, '#ffeaa7');
    return reward;
  }

  buyUpgrade(upgradeId) {
    const result = progressionSystem.purchaseUpgrade(this.progression, upgradeId);
    if (!result.success) {
      this.showShopToast(result.message || '购买失败', '#ff7675');
      return result;
    }

    this.progression = result.progress;
    this.refreshProgressionEffects();
    this.showShopToast(result.message, '#55efc4');
    return result;
  }

  performShopAction(action, itemId) {
    let result = null;
    switch (action) {
      case 'buy-upgrade':
        return this.buyUpgrade(itemId);
      case 'buy-character':
        result = progressionSystem.purchaseCharacter(this.progression, itemId);
        break;
      case 'equip-character':
        result = progressionSystem.equipCharacter(this.progression, itemId);
        break;
      case 'buy-skill':
        result = progressionSystem.purchaseCapability(this.progression, itemId);
        break;
      case 'toggle-skill':
        result = progressionSystem.toggleCapability(this.progression, itemId);
        break;
      case 'buy-tail-trail':
        result = progressionSystem.purchaseTrail(this.progression, 'tail', itemId);
        break;
      case 'equip-tail-trail':
        result = progressionSystem.equipTrail(this.progression, 'tail', itemId);
        break;
      case 'unequip-tail-trail':
        result = progressionSystem.unequipCapability(this.progression, 'trail_tail');
        break;
      case 'buy-head-trail':
        result = progressionSystem.purchaseTrail(this.progression, 'head', itemId);
        break;
      case 'equip-head-trail':
        result = progressionSystem.equipTrail(this.progression, 'head', itemId);
        break;
      case 'unequip-head-trail':
        result = progressionSystem.unequipCapability(this.progression, 'trail_head');
        break;
      case 'buy-trail-length':
        result = progressionSystem.purchaseTrailLength(this.progression);
        break;
      case 'buy-pet':
        result = progressionSystem.purchasePet(this.progression, itemId);
        break;
      case 'equip-pet':
        result = progressionSystem.equipPet(this.progression, itemId);
        break;
      case 'buy-item':
        result = progressionSystem.purchaseItem(this.progression, itemId);
        break;
      case 'equip-item':
        result = progressionSystem.equipItem(this.progression, itemId);
        break;
      case 'reset-progress':
        this.progression = progressionSystem.resetProgress();
        this.runItemEffects = {};
        this.pendingRunItemEffects = {};
        this.growthActive = false;
        this.growthExpiresAt = 0;
        this.refreshProgressionEffects();
        if (this.pet && !progressionSystem.getSelectedPetId(this.progression)) {
          this.pet = null;
        }
        this.showShopToast('玩家数值已清空', '#ffeaa7');
        return { success: true, progress: this.progression, message: '玩家数值已清空' };
      default:
        result = { success: false, message: '未知操作' };
        break;
    }

    if (!result.success) {
      this.showShopToast(result.message || '购买失败', '#ff7675');
      return result;
    }

    this.progression = result.progress;
    this.refreshProgressionEffects();
    this.showShopToast(result.message || '操作成功', '#55efc4');
    return result;
  }

  onBossDefeated(monster) {
    if (!monster || monster.rewardGranted) return;

    const reward = progressionSystem.awardBossDrop(this.progression, monster.dropReward);
    monster.rewardGranted = true;
    this.progression = reward.progress;
    this.sessionBossCoins += reward.coins;

    if (this.barrage && this.player) {
      this.barrage.show(
        this.player.x - 40,
        this.player.y - this.cameraY - 120,
        'Boss掉落 +' + reward.coins + ' 金币',
        '#ffd166'
      );
    }
  }

  setPlayerScale(scale) {
    if (!this.player) return;

    const baseW = this.player.baseW || this.player.w || 64;
    const baseH = this.player.baseH || this.player.h || 64;
    const feetY = this.player.y + this.player.h;
    const centerX = this.player.x + this.player.w / 2;

    this.player.scale = scale;
    this.player.w = baseW * scale;
    this.player.h = baseH * scale;
    this.player.x = centerX - this.player.w / 2;
    this.player.y = feetY - this.player.h;
  }

  activateGrowthMushroom() {
    if (!this.player) return;

    this.growthActive = true;
    this.growthExpiresAt = Date.now() + Math.max(1000, this.growthDurationMs + (this.runItemEffects.growthDurationMs || 0));
    this.setPlayerScale(this.growthScale);
    this.spawnParticles(
      this.player.x + this.player.w / 2,
      this.player.y + this.player.h / 2,
      '#ff4d4f',
      18
    );
    if (this.barrage) {
      this.barrage.show(this.player.x - 20, this.player.y - this.cameraY - 70, '吃到蘑菇，变大了！', '#ff4d4f');
    }
  }

  consumeGrowthMushroom() {
    if (!this.player || !this.growthActive) return;

    this.growthActive = false;
    this.growthExpiresAt = 0;
    this.setPlayerScale(1);
    this.spawnParticles(
      this.player.x + this.player.w / 2,
      this.player.y + this.player.h / 2,
      '#ffd666',
      12
    );
  }

  rollBossSpawnHeight() {
    return 500;
  }

  getNextBossSpawnHeight(currentHeight) {
    if (currentHeight < 500) return 500;
    if (currentHeight < 1000) return 1000;
    if (currentHeight < 2000) return 2000;
    return currentHeight + 2000;
  }

  // 更新玩家动画状态
  updatePlayerState() {
    player.updatePlayerState(this.player);
  }

  generatePlatforms() {
    this.levelGenerator.generatePlatforms(this.W, this.cameraY, this.H);
    this.platforms = this.levelGenerator.getPlatforms();
    this.coins = this.levelGenerator.getCoins();
  }

  collectSceneCoin(coin, collector) {
    if (!coin || coin.collected) return;

    const reward = progressionSystem.grantCoins(this.progression, coin.value || 1);
    coin.collected = true;
    this.progression = reward.progress;
    this.sessionPickupCoins += reward.coins;

    // 成就统计：累计拾取金币
    progressionSystem.addCoinsCollected(this.progression, reward.coins);

    const now = Date.now();
    const pos = this.levelGenerator.getCoinPosition(coin, now);
    this.spawnParticles(pos.x, pos.y, '#ffd166', 8);

    if (this.barrage && this.player) {
      const hintX = collector && collector.x !== undefined ? collector.x : this.player.x;
      const hintY = collector && collector.y !== undefined ? collector.y : this.player.y;
      this.barrage.show(
        hintX - 20,
        hintY - this.cameraY - 60,
        '+' + reward.coins + ' 金币',
        '#ffd166'
      );
    }
  }

  updateSceneCoins(now) {
    if (!this.coins || !this.player) return;

    const playerCenterX = this.player.x + this.player.w / 2;
    const playerCenterY = this.player.y + this.player.h / 2;
    const playerPickupRadiusBonus = progressionSystem.getEconomyValue('PLAYER_COIN_PICKUP_RADIUS', 18) +
      (this.playerCoinPickupBonus || 0) +
      (this.runItemEffects.playerCoinPickupRadius || 0);
    const petPickupRadiusBonus = progressionSystem.getEconomyValue('PET_COIN_PICKUP_RADIUS', 26) +
      (this.petCoinPickupBonus || 0);

    for (let i = 0; i < this.coins.length; i++) {
      const coin = this.coins[i];
      if (!coin || coin.collected) continue;

      const pos = this.levelGenerator.getCoinPosition(coin, now);
      const playerDx = pos.x - playerCenterX;
      const playerDy = pos.y - playerCenterY;
      const playerRadius = (coin.radius || 10) + Math.max(this.player.w, this.player.h) * 0.28 + playerPickupRadiusBonus;
      if (playerDx * playerDx + playerDy * playerDy <= playerRadius * playerRadius) {
        this.collectSceneCoin(coin, this.player);
        continue;
      }

      if (this.pet && !this.pet.returningHome && now >= (this.pet.nextCoinCollectAt || 0)) {
        const petDx = pos.x - this.pet.x;
        const petDy = pos.y - this.pet.y;
        const petRadius = (coin.radius || 10) + petPickupRadiusBonus;
        if (petDx * petDx + petDy * petDy <= petRadius * petRadius) {
          this.collectSceneCoin(coin, this.pet);
          this.pet.returningHome = true;
          this.pet.nextCoinCollectAt = now + progressionSystem.getEconomyValue('PET_COIN_COLLECT_INTERVAL_MS', 1000);
          continue;
        }
      }
    }

    this.coins = this.levelGenerator.getCoins().filter(function(coin) {
      return coin && !coin.collected;
    });
    this.levelGenerator.coins = this.coins;
  }

  getNearestCoinForPet(now) {
    if (!this.pet || !this.coins || this.coins.length === 0) return null;

    const seekRadius = progressionSystem.getEconomyValue('PET_COIN_SEEK_RADIUS', 130) +
      (this.petSeekRadiusBonus || 0);
    const maxDistSq = seekRadius * seekRadius;
    let nearest = null;
    let nearestDistSq = maxDistSq;

    for (let i = 0; i < this.coins.length; i++) {
      const coin = this.coins[i];
      if (!coin || coin.collected) continue;
      const pos = this.levelGenerator.getCoinPosition(coin, now);
      const dx = pos.x - this.pet.x;
      const dy = pos.y - this.pet.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < nearestDistSq) {
        nearest = pos;
        nearestDistSq = distSq;
      }
    }

    return nearest;
  }

  update() {
    if (this.state !== 'playing' || !this.player) return;

    // 竞速模式计时器
    if (this.gameMode.update(this, 16.67)) {
      return; // 游戏结束
    }

    if (this.isControlLocked()) {
      this.controls.keys['ArrowLeft'] = false;
      this.controls.keys['ArrowRight'] = false;
    }

    this.updatePendingBossLaunch();

    player.updateHorizontalMovement(this.player, this.controls);
    player.applyGravity(this.player);
    player.updatePosition(this.player, this.W);

    if (this.player.x > this.W) this.player.x = -this.player.w;
    if (this.player.x + this.player.w < 0) this.player.x = this.W;

    // 更新玩家动画状态
    this.updatePlayerState();

    const now = Date.now();

    if (this.growthActive && this.growthExpiresAt > 0 && now >= this.growthExpiresAt) {
      this.consumeGrowthMushroom();
    }

    player.handlePlatformCollisions(this.player, this.platforms, this, now);

    player.updateCamera(this.player, this);

    player.updateScore(this.player, this);

    this.generatePlatforms();
    this.updateSceneCoins(now);

    // 更新被撞飞平台的物理
    for (const p of this.platforms) {
      platformPhysics.updatePlatform(p);
    }

    // 更新技能系统
    this.skillSystem.update(16.67);

    // 更新Boss系统
    this.bossSystem.update(16.67);

    if (!this.bossSpawnHintShown && this.score >= Math.max(0, this.bossSpawnHeight - 50)) {
      this.bossSpawnHintShown = true;
      this.barrage.show(this.W / 2 - 90, 120, '前方检测到Boss动静！', '#ff6b6b');
    }

    if (this.score >= this.bossSpawnHeight && !this.bossSystem.hasActiveBoss()) {
      this.bossSystem.spawn(1);
      this.bossSpawnHeight = this.getNextBossSpawnHeight(this.bossSpawnHeight);
      this.bossSpawnHintShown = false;
    }

    if (player.checkGameOver(this.player, this)) {
      return;
    }

    this.particles = particlePhysics.updateParticles(this.particles);
    this.trailEffects = trailEffects.updateTrails(this.trailEffects, this.player, 16.67, now);
    this.pet = petSystem.updatePet(
      this.pet,
      this.player,
      16.67,
      now,
      this.getNearestCoinForPet(now),
      progressionSystem.getEconomyValue('PET_RETURN_RESET_DISTANCE', 24)
    );

    this.barrage.update();

    if (this.shakeTimer > 0) this.shakeTimer--;
  }

  render() {
    drawer.render(this, images, characterConfig, jobConfig);
  }

  // 检测角色选择点击
  checkCharacterSelectClick(touchX, touchY) {
    const list = characterConfig.list;
    const listCount = list.length;
    const selectWidth = 120;
    const selectHeight = 140;
    const spacing = 20;
    const totalWidth = listCount * selectWidth + (listCount - 1) * spacing;
    const startX = (this.W - totalWidth) / 2;
    const selectY = this.H * 0.35;

    for (let i = 0; i < listCount; i++) {
      const charName = list[i];
      const x = startX + i * (selectWidth + spacing);
      const y = selectY;

      if (touchX >= x && touchX <= x + selectWidth &&
          touchY >= y && touchY <= y + selectHeight) {
        if (!progressionSystem.isCharacterUnlocked(this.progression, charName)) {
          this.showShopToast('先解锁该角色', '#ff7675');
          return true;
        }
        const result = progressionSystem.equipCharacter(this.progression, charName);
        if (result && result.success) {
          this.progression = result.progress;
          this.refreshProgressionEffects();
          loadCharacter(charName);
          this.showShopToast(result.message, '#55efc4');
          this.audio.playClick();
        }
        return true;
      }
    }
    return false;
  }

  startGame() {
    this.generatePraises();
    this.showShopPanel = false;
    const itemResult = progressionSystem.consumeEquippedItem(this.progression);
    this.progression = itemResult.progress;
    this.pendingRunItemEffects = itemResult.effects || {};
    this.initGame();
    this.runItemEffects = Object.assign({}, this.pendingRunItemEffects);
    this.pendingRunItemEffects = {};
    this.state = 'playing';
    this.audio.playBGM();
    const _this = this;
    setTimeout(function() {
      _this.barrage.show(_this.W / 2 - 80, _this.H / 2, _this.playerName + "出发！冲冲冲！💪");
    }, 500);
    setTimeout(function() {
      _this.barrage.show(_this.W / 2 - 60, _this.H / 2 - 60, _this.playerJob + "牛逼！！！");
    }, 1200);
    if (itemResult.itemName) {
      setTimeout(function() {
        _this.barrage.show(_this.W / 2 - 70, _this.H / 2 + 50, '本局使用：' + itemResult.itemName, '#55efc4');
      }, 1600);
    }
  }

  gameOver() {
    this.gameMode.onGameOver(this);
    const rewardResult = progressionSystem.awardRunCoins(this.progression, {
      mode: this.gameMode.gameMode,
      score: this.score,
      combo: this.maxCombo,
      time: this.finalElapsedTime || 0,
      challengeCompleted: this.gameMode.gameMode === 'challenge' &&
        !!this.gameMode.selectedLandmark &&
        this.score >= this.gameMode.selectedLandmark.targetHeight
    });
    this.progression = rewardResult.progress;

    // 成就统计：更新游戏统计并检查成就
    const achievementResult = progressionSystem.updateRunStats(this.progression, {
      score: this.score,
      combo: this.maxCombo,
      coinsCollected: this.sessionPickupCoins
    });
    this.progression = achievementResult.progress;

    // 显示成就解锁通知
    if (achievementResult.unlocks && achievementResult.unlocks.length > 0 && this.barrage) {
      let delay = 2000;
      for (const unlock of achievementResult.unlocks) {
        setTimeout(() => {
          if (this.barrage) {
            this.barrage.show(this.W / 2 - 100, this.H / 2 - 80, unlock.message, '#ffd700');
          }
        }, delay);
        delay += 1200;
      }
    }

    this.runRewardSummary = {
      baseCoins: rewardResult.baseCoins,
      heightCoins: rewardResult.heightCoins,
      comboCoins: rewardResult.comboCoins,
      challengeBonus: rewardResult.challengeBonus,
      modeMultiplier: rewardResult.modeMultiplier,
      bossCoins: this.sessionBossCoins,
      pickupCoins: this.sessionPickupCoins,
      totalCoins: rewardResult.totalCoins + this.sessionBossCoins + this.sessionPickupCoins,
      balance: rewardResult.progress.coins
    };

    this.state = 'gameover';
    this.growthActive = false;
    this.growthExpiresAt = 0;
    this.setPlayerScale(1);
    this.trailEffects = [];
    this.pet = null;
    this.combo = 0;
    this.shakeTimer = 0;
    // 初始化游戏结束按钮区域，确保在渲染前就存在
    this.gameOverBtnArea = {
      restartX: this.W / 2 - 80,
      restartY: this.H / 2 + 155,
      restartW: 70,
      restartH: 35,
      homeX: this.W / 2 + 10,
      homeY: this.H / 2 + 155,
      homeW: 70,
      homeH: 35
    };

    // 保存游戏数据到微信云存储
    this.saveToCloudStorage();
  }

  // 保存游戏数据到云数据库
  saveToCloudStorage() {
    const cloudStorage = require('./runtime/cloudStorage');
    const gameData = {
      nickname: this.wxUserInfo ? this.wxUserInfo.nickName : this.playerName,
      avatarUrl: this.wxUserInfo ? this.wxUserInfo.avatarUrl : '',
      gameMode: this.gameMode.gameMode,
      score: this.score,
      time: this.finalElapsedTime || 0,
      combo: this.maxCombo
    };
    cloudStorage.saveGameRecord(gameData, function(success, data) {
      if (success) {
        console.log('游戏数据已保存到云端', data);
      } else {
        console.log('游戏数据云端保存失败');
      }
    });
  }

  // 获取排行榜数据
  fetchRankList() {
    const cloudStorage = require('./runtime/cloudStorage');
    const _this = this;
    this.rankLoading = true;
    this.rankList = [];

    // 使用云数据库获取排行榜
    cloudStorage.getAllRankList(function(success, rankData) {
      _this.rankLoading = false;
      if (success && rankData) {
        var formattedList = [];
        for (var i = 0; i < rankData.length; i++) {
          var item = rankData[i];
          formattedList.push({
            rank: i + 1,
            nickname: item.nickname || '匿名用户',
            avatarUrl: item.avatarUrl || '',
            score: item.bestScore || item.score || 0
          });
        }
        _this.rankList = formattedList;
      } else {
        console.log('获取排行榜失败');
      }
    });
  }

  goToHome() {
    this.state = 'start';
    this.combo = 0;
    this.chargeCount = 0;
    this.chargeFull = false;
    this.chargeDashing = false;
    this.lastLandedPlatform = null;
    this.controlLockedUntil = 0;
    this.bossKnockbackUntil = 0;
    this.pendingBossLaunch = null;
    this.gameOverBtnArea = null;
    this.showCharacterPanel = false;
    this.showShopPanel = false;
    this.showLeaderboardPanel = false;
    this.runRewardSummary = null;
    this.sessionBossCoins = 0;
    this.sessionPickupCoins = 0;
    this.runItemEffects = {};
    this.pendingRunItemEffects = {};
    this.growthExpiresAt = 0;
    this.gameMode.reset();
    this.skillSystem.reset();
    this.refreshProgressionEffects();
    this.audio.stopBGM();
  }

  loop() {
    this.update();
    this.render();
    const _this = this;
    this.animationId = requestAnimationFrame(function() { _this.loop(); });
  }

  stopLoop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  start() {
    // 防止重复启动动画循环
    if (this.animationId) return;
    this.loop();
  }
}

// 启动游戏
GameGlobal.game = new Game();
GameGlobal.game.start();
