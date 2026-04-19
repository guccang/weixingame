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
const ScrollHandler = require('./ui/scrollHandler');
const UIRegistry = require('./ui/registry');

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
const DifficultyManager = require('./game/difficultyManager');
const gameConstants = require('./game/constants');
const debugRuntime = require('./game/debugRuntime');
const RunDirector = require('./game/runDirector');

// 绘制系统
const drawer = require('./drawer/drawer');

// 关卡生成系统
const LevelGenerator = require('./level/level');

// 技能系统
const SkillSystem = require('./skill/skill');

// 布局系统
const { getLayoutLoader } = require('./layout/layoutLoader');

// 游戏操作模块
const GameOperations = require('./game/gameOperations');

// Boss/怪物系统
const BossSystem = require('./monster/boss');
const trailEffects = require('./effects/trail');
const petSystem = require('./pet/pet');
const progressionSystem = require('./progression/progression');
const worldview = require('./worldview/index');

const MAX_PARTICLES = 260;

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
    this.MAX_FALL_SPEED = physics.constants.MAX_FALL_SPEED;
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
    this.nextBossSpawnPlan = null;
    this.bossSpawnHintShown = false;
    this.controlLockedUntil = 0;
    this.bossKnockbackUntil = 0;
    this.pendingBossLaunch = null;
    this.growthActive = false;
    this.growthScale = 1.55;
    this.growthLaunchScale = 1;
    this.chargeDashGrowthRatio = 0;
    this.baseStats = {
      GRAVITY: physics.constants.GRAVITY,
      PLAYER_SPEED: physics.constants.PLAYER_SPEED,
      JUMP_FORCE: physics.constants.JUMP_FORCE,
      BOOST_JUMP_FORCE: physics.constants.BOOST_JUMP_FORCE,
      DOUBLE_JUMP_FORCE: physics.constants.DOUBLE_JUMP_FORCE,
      MAX_FALL_SPEED: physics.constants.MAX_FALL_SPEED,
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
    this.rankList = []; // 排行榜数据
    this.rankLoading = false; // 排行榜加载状态
    this.wxUserInfo = null; // 微信用户信息
    this.hasWxLogin = false; // 是否已获取微信登录
    this.progression = progressionSystem.loadProgress();
    this.runRewardSummary = null;
    this.sessionBossCoins = 0;
    this.sessionPickupCoins = 0;
    this.sessionEventCoins = 0;
    this.runItemEffects = {};
    this.pendingRunItemEffects = {};
    this.runBuffEffects = {};
    this.runPickupEffects = {};
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
    this.debugCoinGrantAmount = 1000;
    this.debugProfile = null;
    this.runEncounteredBossTypes = {};
    this.worldviewLastRunUnlocks = [];
    this.debugDraft = {
      presetIds: [],
      overrides: {}
    };
    this.debugPanelScrollArea = null;
    this.debugPanelScrollY = 0;
    this.debugPanelMaxScroll = 0;
    this.isDraggingDebugPanel = false;
    this.debugPanelDragStartY = 0;
    this.debugPanelDragStartScrollY = 0;
    this.achievementScrollArea = null;
    this.achievementScrollY = 0;
    this.achievementMaxScroll = 0;
    this.isDraggingAchievementList = false;
    this.achievementDragStartY = 0;
    this.achievementDragStartScrollY = 0;

    this.controls = new Controls(this); // 控制系统
    this.mainUI = new MainUI(this); // 主界面UI
    this.uiRegistry = new UIRegistry(); // 统一UI热区注册
    this.audio = new Audio(); // 音效管理
    this.levelGenerator = new LevelGenerator(); // 关卡生成器
    this.difficultyManager = new DifficultyManager(); // 动态难度管理
    this.gameMode = new GameMode(); // 游戏模式管理
    this.panelManager = new UIPanelManager(this); // UI面板管理器
    this.scrollHandler = new ScrollHandler(this); // 滚动处理器
    this.skillSystem = new SkillSystem(this); // 技能系统
    this.gameOps = new GameOperations(this); // 游戏操作（分享等）
    this.bossSystem = new BossSystem(this); // Boss系统
    this.runDirector = new RunDirector(this); // 单局事件管理
    this.animationId = null; // 动画帧ID，用于取消动画循环
    this.pendingTimeouts = [];

    // 初始化布局系统
    this.layoutLoader = getLayoutLoader();
    this.layoutLoader.loadLayoutFile('startScreen', 'startScreen.json');
    this.layout = null; // 当前解析的布局缓存

    this.levelGenerator.setDifficultyManager(this.difficultyManager);
    this.levelGenerator.setRunDirector(this.runDirector);
    this.initializeDebugDraft();
    progressionSystem.applyUpgradesToGame(this, this.progression);
    this.syncDifficulty(true);
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

  getDebugConfig() {
    return gameConstants.debugConfig;
  }

  initializeDebugDraft() {
    const debugConfig = this.getDebugConfig();
    this.debugDraft = {
      presetIds: debugConfig.defaultPresetId ? [debugConfig.defaultPresetId] : [],
      overrides: {}
    };
  }

  getDebugDraftProfile() {
    const draft = this.debugDraft || { presetIds: [], overrides: {} };
    return debugRuntime.buildDebugProfile(
      this.getDebugConfig(),
      draft.presetIds,
      draft.overrides
    );
  }

  selectDebugPreset(presetId) {
    const preset = debugRuntime.getPresetById(this.getDebugConfig(), presetId);
    if (!preset) return null;

    const currentPresetIds = this.debugDraft && Array.isArray(this.debugDraft.presetIds)
      ? this.debugDraft.presetIds.slice()
      : [];
    const existingIndex = currentPresetIds.indexOf(preset.id);

    if (existingIndex >= 0) {
      currentPresetIds.splice(existingIndex, 1);
    } else {
      currentPresetIds.push(preset.id);
    }

    this.debugDraft = {
      presetIds: currentPresetIds,
      overrides: {}
    };
    return this.getDebugDraftProfile();
  }

  cycleDebugOption(key) {
    const definition = debugRuntime.getOptionDefinition(key);
    if (!definition) return null;

    const draftProfile = this.getDebugDraftProfile();
    const currentValue = draftProfile ? draftProfile[key] : definition.values[0];
    const currentIndex = Math.max(0, definition.values.indexOf(currentValue));
    const nextValue = definition.values[(currentIndex + 1) % definition.values.length];
    const presets = debugRuntime.getPresetList(this.getDebugConfig(), this.debugDraft.presetIds);
    const baseValue = presets.length > 0
      ? presets[presets.length - 1][key]
      : definition.values[0];
    const nextOverrides = Object.assign({}, this.debugDraft.overrides || {});

    if (baseValue === nextValue) {
      delete nextOverrides[key];
    } else {
      nextOverrides[key] = nextValue;
    }

    this.debugDraft = {
      presetIds: Array.isArray(this.debugDraft.presetIds) ? this.debugDraft.presetIds.slice() : [],
      overrides: nextOverrides
    };
    return this.getDebugDraftProfile();
  }

  resetDebugDraft() {
    this.initializeDebugDraft();
    return this.getDebugDraftProfile();
  }

  resetDebugPanelScroll() {
    this.debugPanelScrollY = 0;
    this.debugPanelMaxScroll = 0;
    this.debugPanelScrollArea = null;
    this.isDraggingDebugPanel = false;
    this.debugPanelDragStartY = 0;
    this.debugPanelDragStartScrollY = 0;
  }

  startDebugPanelDrag(touchX, touchY) {
    const areaEntry = this.uiRegistry ? this.uiRegistry.get('start.debug.scrollViewport') : null;
    const area = areaEntry ? areaEntry.rect : this.debugPanelScrollArea;
    if (!area) return false;
    if (touchX < area.x || touchX > area.x + area.w || touchY < area.y || touchY > area.y + area.h) {
      return false;
    }
    if (this.debugPanelMaxScroll <= 0) {
      return false;
    }

    this.isDraggingDebugPanel = true;
    this.debugPanelDragStartY = touchY;
    this.debugPanelDragStartScrollY = this.debugPanelScrollY || 0;
    return true;
  }

  handleDebugPanelScroll(touchY) {
    if (!this.isDraggingDebugPanel) return false;
    const deltaY = touchY - this.debugPanelDragStartY;
    const nextScroll = this.debugPanelDragStartScrollY - deltaY;
    this.debugPanelScrollY = Math.max(0, Math.min(this.debugPanelMaxScroll || 0, nextScroll));
    return true;
  }

  stopDebugPanelDrag() {
    this.isDraggingDebugPanel = false;
    this.debugPanelDragStartY = 0;
    this.debugPanelDragStartScrollY = 0;
  }

  setDebugProfile(profile) {
    this.debugProfile = profile ? debugRuntime.cloneProfile(profile) : null;
    if (this.difficultyManager && typeof this.difficultyManager.setDebugProfile === 'function') {
      this.difficultyManager.setDebugProfile(this.debugProfile);
    }
  }

  isDebugRun() {
    return debugRuntime.isDebugProfileEnabled(this.debugProfile);
  }

  getDebugRunLabel() {
    if (!this.isDebugRun()) return '';
    const names = this.debugProfile && Array.isArray(this.debugProfile.presetNames)
      ? this.debugProfile.presetNames.filter(function(name) { return !!name; })
      : [];
    const name = names.length > 0 ? names.join(' + ') : '自定义';
    return 'DEBUG · ' + name;
  }

  applyDebugStartProfile() {
    if (!this.isDebugRun() || !this.player) return;

    const profile = this.debugProfile || {};
    const startHeight = Math.max(0, Math.round(profile.startHeight || 0));
    const initialCharge = debugRuntime.resolveInitialChargeCount(profile, this.chargeMax);
    const bossMode = profile.bossSpawnMode || 'normal';

    this.chargeCount = Math.max(0, Math.min(this.chargeMax, initialCharge));
    this.chargeFull = this.chargeCount >= this.chargeMax;

    if (startHeight > 0) {
      const targetY = this.H - 100 - startHeight * 10;
      const anchorX = Math.max(16, Math.min(this.W - 136, this.W / 2 - 60));
      const anchorY = targetY + this.player.h + 8;
      const anchorPlatform = platformPhysics.createPlatformWithSkin(anchorX, anchorY, 'normal');
      anchorPlatform.debugAnchor = true;
      anchorPlatform.pickup = null;
      anchorPlatform.mushroom = null;
      anchorPlatform.coin = null;
      anchorPlatform.runtimeMoveSpeedScale = 1;

      this.player.x = this.W / 2 - this.player.w / 2;
      this.player.y = targetY;
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.state = 'idle';

      this.cameraY = targetY - this.H * 0.4;
      this.score = startHeight;
      this.maxHeight = startHeight;
      this.lastMilestone = startHeight;

      if (this.levelGenerator && Array.isArray(this.levelGenerator.platforms)) {
        this.levelGenerator.platforms.push(anchorPlatform);
      }
      if (this.platforms) {
        this.platforms.push(anchorPlatform);
      }

      this.generatePlatforms();
      this.refreshPlatformRuntimeEffects();
    }

    if (profile.bossMode === 'off') {
      this.bossSpawnHeight = Infinity;
      this.nextBossSpawnPlan = null;
      this.bossSpawnHintShown = true;
      return;
    }

    if (bossMode === 'immediate') {
      this.bossSpawnHeight = Math.max(0, this.score);
      this.nextBossSpawnPlan = this.createBossSpawnPlan(this.bossSpawnHeight);
      this.bossSpawnHintShown = true;
      return;
    }

    this.bossSpawnHeight = this.getNextBossSpawnHeight(this.score);
    this.nextBossSpawnPlan = this.createBossSpawnPlan(this.bossSpawnHeight);
    this.bossSpawnHintShown = false;
  }

  startDebugGame() {
    const profile = this.getDebugDraftProfile();
    if (!profile) return;
    this.gameMode.selectMode('endless');
    this.panelManager.close('showDebugPanel');
    this.startGame({ debugProfile: profile });
  }

  restartCurrentRun() {
    if (this.isDebugRun()) {
      this.startGame({ debugProfile: this.debugProfile });
      return;
    }
    this.startGame();
  }

  initGame() {
    this.clearPendingTimeouts();
    progressionSystem.applyUpgradesToGame(this, this.progression);
    this.syncDifficulty(true);
    this.syncCharacterSelection();
    this.resetDebugPanelScroll();
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
    this.sessionEventCoins = 0;
    this.runBuffEffects = {};
    this.runPickupEffects = {};
    this.bossSpawnHeight = this.rollBossSpawnHeight();
    this.nextBossSpawnPlan = this.createBossSpawnPlan(this.bossSpawnHeight);
    this.controls.reset(); // 重置控制系统状态

    // 初始化游戏模式特定状态
    this.gameMode.initForGame(this);

    // 重置技能系统
    this.skillSystem.reset();

    // 重置Boss系统
    this.bossSystem.reset();

    this.runDirector.reset();

    // 使用关卡生成器初始化
    this.platforms = this.levelGenerator.initLevel(this.W, this.H, characterConfig);
    this.coins = this.levelGenerator.getCoins();
    this.pet = progressionSystem.getSelectedPetId(this.progression) ? petSystem.createPet(this.player) : null;
    this.refreshPlatformRuntimeEffects();
  }

  spawnParticles(x, y, color, count) {
    const newParticles = particlePhysics.spawnParticles(x, y, color, count);
    this.particles.push(...newParticles);
    if (this.particles.length > MAX_PARTICLES) {
      this.particles.splice(0, this.particles.length - MAX_PARTICLES);
    }
  }

  scheduleTimeout(callback, delay) {
    const timerId = setTimeout(() => {
      const index = this.pendingTimeouts.indexOf(timerId);
      if (index !== -1) {
        this.pendingTimeouts.splice(index, 1);
      }
      callback();
    }, delay);
    this.pendingTimeouts.push(timerId);
    return timerId;
  }

  clearPendingTimeouts() {
    if (!this.pendingTimeouts || this.pendingTimeouts.length === 0) return;
    for (let i = 0; i < this.pendingTimeouts.length; i++) {
      clearTimeout(this.pendingTimeouts[i]);
    }
    this.pendingTimeouts = [];
  }

  isControlLocked() {
    return Date.now() < this.controlLockedUntil;
  }

  isImpactDashing() {
    return Date.now() < this.bossKnockbackUntil;
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
    this.syncDifficulty(this.state !== 'playing');
    this.syncCharacterSelection();
  }

  syncDifficulty(resetToStart) {
    if (!this.difficultyManager) return null;

    this.difficultyManager.syncBasePhysics(this);
    if (resetToStart) {
      this.difficultyManager.reset();
    } else if (this.isDebugRun() && debugRuntime.isDifficultyFrozen(this.debugProfile)) {
      this.difficultyManager.applyToGame(this);
    } else {
      this.difficultyManager.update(this.score);
    }

    const profile = this.difficultyManager.applyToGame(this);
    this.applyRuntimeEffectModifiers();
    return profile;
  }

  updateDifficulty() {
    if (!this.difficultyManager) return null;
    if (this.isDebugRun() && debugRuntime.isDifficultyFrozen(this.debugProfile)) {
      this.difficultyManager.applyToGame(this);
    } else {
      this.difficultyManager.update(this.score);
    }
    const profile = this.difficultyManager.applyToGame(this);
    this.applyRuntimeEffectModifiers();
    return profile;
  }

  applyRuntimeEffectModifiers() {
    const difficultyProfile = this.currentDifficulty || { playerSpeedMultiplier: 1, maxFallSpeedMultiplier: 1 };
    const difficultyBase = this.difficultyManager && this.difficultyManager.basePhysics
      ? this.difficultyManager.basePhysics
      : this.baseStats;
    const pickupConfig = gameConstants.pickupConfig;
    const playerSpeedScale = Math.max(
      pickupConfig.playerSpeedMultiplier.min,
      Math.min(pickupConfig.playerSpeedMultiplier.max, this.getRunEffectValue('playerSpeedMultiplier'))
    );
    const maxFallSpeedScale = Math.max(
      pickupConfig.maxFallSpeedMultiplier.min,
      Math.min(pickupConfig.maxFallSpeedMultiplier.max, this.getRunEffectValue('maxFallSpeedMultiplier'))
    );
    const roundTo = function(value) {
      return Math.round(value * 1000) / 1000;
    };
    const basePlayerSpeed = (difficultyBase.PLAYER_SPEED || this.baseStats.PLAYER_SPEED || physics.constants.PLAYER_SPEED) *
      (difficultyProfile.playerSpeedMultiplier || 1);
    const baseMaxFallSpeed = (difficultyBase.MAX_FALL_SPEED || this.baseStats.MAX_FALL_SPEED || physics.constants.MAX_FALL_SPEED) *
      (difficultyProfile.maxFallSpeedMultiplier || 1);

    physics.constants.PLAYER_SPEED = roundTo(basePlayerSpeed * playerSpeedScale);
    physics.constants.MAX_FALL_SPEED = roundTo(baseMaxFallSpeed * maxFallSpeedScale);
    this.PLAYER_SPEED = physics.constants.PLAYER_SPEED;
    this.MAX_FALL_SPEED = physics.constants.MAX_FALL_SPEED;
    if (this.player && this.player.vy > this.MAX_FALL_SPEED) {
      this.player.vy = this.MAX_FALL_SPEED;
    }
  }

  getRunEffectValue(key) {
    const isScaleKey = key.indexOf('Scale') !== -1 || key.indexOf('Multiplier') !== -1;
    const itemValue = this.runItemEffects && typeof this.runItemEffects[key] === 'number'
      ? this.runItemEffects[key]
      : null;
    const buffValue = this.runBuffEffects && typeof this.runBuffEffects[key] === 'number'
      ? this.runBuffEffects[key]
      : null;
    const pickupValue = this.runPickupEffects && typeof this.runPickupEffects[key] === 'number'
      ? this.runPickupEffects[key]
      : null;

    if (isScaleKey) {
      let value = 1;
      if (itemValue !== null) value *= itemValue;
      if (buffValue !== null) value *= buffValue;
      if (pickupValue !== null) value *= pickupValue;
      return value;
    }

    return (itemValue || 0) + (buffValue || 0) + (pickupValue || 0);
  }

  getDisplayedRunCoins() {
    return (this.sessionPickupCoins || 0) + (this.sessionBossCoins || 0) + (this.sessionEventCoins || 0);
  }

  refreshPlatformRuntimeEffects() {
    if (!this.platforms || this.platforms.length === 0) return;
    const movingScale = this.runDirector ? this.runDirector.getMovingPlatformSpeedScale() : this.getRunEffectValue('movingPlatformSpeedScale');
    for (let i = 0; i < this.platforms.length; i++) {
      this.platforms[i].runtimeMoveSpeedScale = movingScale;
    }
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

  setUITheme(themeId) {
    this.progression = progressionSystem.setUITheme(this.progression, themeId);
    this.showShopToast('界面主题已切换', '#dcefe8');
    return this.progression;
  }

  showShopToast(text, color) {
    this.shopMessage = text;
    this.shopMessageColor = color || '#55efc4';
    this.shopMessageUntil = Date.now() + 1800;
  }

  recordBossEncounter(behaviorType) {
    if (!behaviorType) return;
    this.runEncounteredBossTypes[behaviorType] = true;
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
        this.runBuffEffects = {};
        this.runPickupEffects = {};
        this.growthActive = false;
        this.growthExpiresAt = 0;
        this.runDirector.reset();
        this.nextBossSpawnPlan = null;
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

  onBossDefeated(monster, context = {}) {
    if (!monster || monster.rewardGranted) return;

    let reward;
    if (this.isDebugRun()) {
      const rewardText = monster.dropReward || '';
      const match = String(rewardText).match(/coin_(\d+)/i);
      reward = {
        progress: this.progression,
        coins: match ? (parseInt(match[1], 10) || 0) : 10
      };
    } else {
      reward = progressionSystem.awardBossDrop(this.progression, monster.dropReward);
      this.progression = reward.progress;
    }
    monster.rewardGranted = true;
    this.sessionBossCoins += reward.coins;

    if (this.barrage && this.player) {
      this.barrage.show(
        this.player.x - 40,
        this.player.y - this.cameraY - 120,
        'Boss掉落 +' + reward.coins + ' 金币',
        '#ffd166'
      );
    }

    if (this.runDirector) {
      this.runDirector.onBossDefeated(monster, context);
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
    if (this.isDebugRun() && this.debugProfile.bossMode === 'off') {
      return Infinity;
    }
    const bossConfig = gameConstants.bossConfig;
    return bossConfig.spawnHeights.length > 0 ? bossConfig.spawnHeights[0] : 500;
  }

  pickWeightedBossEntry(entries) {
    if (!entries || entries.length === 0) {
      return {
        monsterId: gameConstants.bossConfig.monsterId,
        behaviorType: 'leaper',
        warningText: '前方检测到Boss动静！'
      };
    }

    let totalWeight = 0;
    for (let i = 0; i < entries.length; i++) {
      totalWeight += Math.max(0, entries[i].weight || 0);
    }

    if (totalWeight <= 0) {
      return entries[0];
    }

    let roll = Math.random() * totalWeight;
    for (let i = 0; i < entries.length; i++) {
      roll -= Math.max(0, entries[i].weight || 0);
      if (roll <= 0) {
        return entries[i];
      }
    }

    return entries[entries.length - 1];
  }

  createBossSpawnPlan(height) {
    let pool = debugRuntime.filterBossPool(gameConstants.bossConfig.pool, this.debugProfile);
    if (!pool || pool.length === 0) {
      return null;
    }

    const themeProfile = this.runDirector ? this.runDirector.getSpawnProfile(height) : null;
    const bossWeights = themeProfile && themeProfile.platformConfig
      ? themeProfile.platformConfig.bossWeights
      : null;
    if (bossWeights) {
      pool = pool.map(function(entry) {
        const overrideWeight = bossWeights[entry.behaviorType];
        return Object.assign({}, entry, {
          weight: typeof overrideWeight === 'number' ? overrideWeight : entry.weight
        });
      });
    }

    const picked = this.pickWeightedBossEntry(pool);
    return {
      height: height,
      monsterId: picked.monsterId,
      behaviorType: picked.behaviorType || 'leaper',
      warningText: picked.warningText || worldview.getBossWarningText(picked.behaviorType)
    };
  }

  getNextBossSpawnHeight(currentHeight) {
    const bossConfig = gameConstants.bossConfig;
    const spawnHeights = bossConfig.spawnHeights;

    for (let i = 0; i < spawnHeights.length; i++) {
      if (currentHeight < spawnHeights[i]) {
        return spawnHeights[i];
      }
    }

    const fallbackBase = spawnHeights.length > 0 ? spawnHeights[spawnHeights.length - 1] : 2000;
    const repeatInterval = Math.max(1, bossConfig.repeatInterval || 2000);
    return Math.max(fallbackBase, currentHeight) + repeatInterval;
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

  grantRunCoins(amount, options = {}) {
    const safeCoins = Math.max(0, Math.floor(amount || 0));
    const reward = this.isDebugRun()
      ? { progress: this.progression, coins: safeCoins }
      : progressionSystem.grantCoins(this.progression, safeCoins);
    if (reward.coins <= 0) return reward;

    if (!this.isDebugRun()) {
      this.progression = reward.progress;
    }
    const bucket = options.bucket || 'event';
    if (bucket === 'boss') {
      this.sessionBossCoins += reward.coins;
    } else if (bucket === 'pickup') {
      this.sessionPickupCoins += reward.coins;
    } else {
      this.sessionEventCoins += reward.coins;
    }

    if (options.emitStats) {
      if (!this.isDebugRun()) {
        this.progression = progressionSystem.addCoinsCollected(this.progression, reward.coins);
      }
    }

    if (options.x !== undefined && options.y !== undefined) {
      this.spawnParticles(options.x, options.y, options.color || '#ffd166', 10);
    }

    if (this.barrage && this.player && options.text) {
      this.barrage.show(
        (options.x !== undefined ? options.x : this.player.x) - 20,
        (options.y !== undefined ? options.y : this.player.y) - this.cameraY - 60,
        options.text,
        options.color || '#ffd166'
      );
    }

    return reward;
  }

  addCharge(amount, sourceLabel) {
    const chargeGain = Math.max(0, Math.round(amount || 0));
    if (chargeGain <= 0) return;

    this.chargeCount = Math.min(this.chargeMax, this.chargeCount + chargeGain);
    this.chargeFull = this.chargeCount >= this.chargeMax;

    if (this.barrage && this.player) {
      this.barrage.show(
        this.player.x - 20,
        this.player.y - this.cameraY - 70,
        (sourceLabel || '蓄力') + ' +' + chargeGain,
        '#55efc4'
      );
    }
  }

  handleRunOfferTouch(touchX, touchY) {
    if (!this.runDirector) return false;
    return this.runDirector.handleOfferTouch(touchX, touchY);
  }

  onPlatformLanded(platform) {
    if (this.gameMode && typeof this.gameMode.recordPlatformLanding === 'function') {
      this.gameMode.recordPlatformLanding(this, platform);
    }
    if (!this.runDirector) return;
    this.runDirector.onPlatformLanded(platform);
  }

  onChargeDashTriggered() {
    if (!this.runDirector) return;
    this.runDirector.onChargeDashTriggered();
  }

  onBossInterrupted(monster) {
    if (!this.runDirector) return;
    this.runDirector.onBossInterrupted(monster);
  }

  collectSceneCoin(coin, collector) {
    if (!coin || coin.collected) return;

    const reward = this.grantRunCoins(coin.value || 1, {
      bucket: 'pickup',
      emitStats: true
    });
    coin.collected = true;

    const now = Date.now();
    const pos = this.levelGenerator.getCoinPosition(coin, now);
    this.spawnParticles(pos.x, pos.y, '#ffd166', 8);

    if (this.runDirector) {
      this.runDirector.onCoinCollected(reward.coins);
    }

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
      this.getRunEffectValue('playerCoinPickupRadius');
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

    if (this.runDirector && this.runDirector.isBuffOfferOpen()) {
      this.runDirector.update(Date.now());
      this.controls.keys['ArrowLeft'] = false;
      this.controls.keys['ArrowRight'] = false;
      this.barrage.update();
      return;
    }

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

    const now = Date.now();

    // 更新玩家动画状态
    this.updatePlayerState();

    if (this.growthActive && this.growthExpiresAt > 0 && now >= this.growthExpiresAt) {
      this.consumeGrowthMushroom();
    }

    player.handlePlatformCollisions(this.player, this.platforms, this, now);
    if (this.runDirector) {
      this.runDirector.handlePickupCollisions(now);
    }

    player.updateCamera(this.player, this);

    player.updateScore(this.player, this);
    if (this.runDirector) {
      this.runDirector.update(now);
    }
    this.updateDifficulty();

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

    const bossConfig = gameConstants.bossConfig;
    const bossWarningText = this.nextBossSpawnPlan && this.nextBossSpawnPlan.warningText
      ? this.nextBossSpawnPlan.warningText
      : '前方检测到Boss动静！';

    if (this.nextBossSpawnPlan &&
        !this.bossSpawnHintShown &&
        this.score >= Math.max(0, this.bossSpawnHeight - bossConfig.warningLeadHeight)) {
      this.bossSpawnHintShown = true;
      this.barrage.show(this.W / 2 - 90, 120, bossWarningText, '#ff6b6b');
    }

    if (this.nextBossSpawnPlan &&
        this.score >= this.bossSpawnHeight &&
        !this.bossSystem.hasActiveBoss()) {
      this.bossSystem.spawn(this.nextBossSpawnPlan || {
        monsterId: bossConfig.monsterId,
        behaviorType: 'leaper'
      });
      this.bossSpawnHeight = this.getNextBossSpawnHeight(this.bossSpawnHeight);
      this.nextBossSpawnPlan = this.createBossSpawnPlan(this.bossSpawnHeight);
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

  // 处理角色列表滚动（仅在touchMove中调用，返回是否处理了滚动）
  handleCharacterScroll(touchX, touchY) {
    const scroll = this.characterScroll;
    if (!scroll) return false;

    const { scrollAreaTop, scrollAreaBottom, maxScroll } = scroll;

    // 优先检测是否在拖动滑动条
    const scrollBar = this.characterScrollBar;
    if (scrollBar && maxScroll > 0) {
      // 检测是否在滑动条区域（扩展触摸区域便于拖动）
      const barHitArea = {
        x: scrollBar.x - 10,
        y: scrollBar.y,
        w: scrollBar.width + 20,
        h: scrollBar.height
      };
      if (touchX >= barHitArea.x && touchX <= barHitArea.x + barHitArea.w &&
          touchY >= barHitArea.y && touchY <= barHitArea.y + barHitArea.h) {
        // 根据触摸位置计算滚动值
        const relativeY = touchY - scrollBar.y;
        const scrollRatio = relativeY / scrollBar.height;
        this.characterScrollY = Math.max(0, Math.min(maxScroll, scrollRatio * maxScroll));
        return true;
      }
    }

    // 内容区拖动中：跟随手指移动
    if (this.isDraggingCharacterList) {
      const deltaY = touchY - this.characterDragStartY;
      // 手指向上移动(deltaY < 0)时，内容向上滚动(scrollY减少)
      const newScrollY = this.characterDragStartScrollY - deltaY;
      this.characterScrollY = Math.max(0, Math.min(maxScroll, newScrollY));
      return true;
    }
    return false;
  }

  // 开始角色列表拖动（仅在检测到移动后调用）
  startCharacterDrag(touchX, touchY) {
    const scroll = this.characterScroll;
    if (!scroll) return false;
    const { scrollAreaTop, scrollAreaBottom, maxScroll } = scroll;
    if (maxScroll <= 0) return false;
    if (touchY >= scrollAreaTop && touchY <= scrollAreaBottom) {
      this.isDraggingCharacterList = true;
      this.characterDragStartY = touchY;
      this.characterDragStartScrollY = this.characterScrollY;
      return true;
    }
    return false;
  }

  // 停止角色列表拖动
  stopCharacterDrag() {
    this.isDraggingCharacterList = false;
    this.characterDragStartY = 0;
    this.characterDragStartScrollY = 0;
  }

  isTouchInCharacterScrollArea(touchX, touchY) {
    const scroll = this.characterScroll;
    if (!scroll) return false;
    return touchY >= scroll.scrollAreaTop && touchY <= scroll.scrollAreaBottom;
  }

  handleAchievementScroll(touchY) {
    const area = this.achievementScrollArea;
    if (!area || !this.isDraggingAchievementList) return false;
    const deltaY = touchY - this.achievementDragStartY;
    const newScrollY = this.achievementDragStartScrollY - deltaY;
    this.achievementScrollY = Math.max(0, Math.min(this.achievementMaxScroll || 0, newScrollY));
    return true;
  }

  startAchievementDrag(touchX, touchY) {
    const area = this.achievementScrollArea;
    if (!area || (this.achievementMaxScroll || 0) <= 0) return false;
    if (touchX >= area.x && touchX <= area.x + area.w &&
        touchY >= area.y && touchY <= area.y + area.h) {
      this.isDraggingAchievementList = true;
      this.achievementDragStartY = touchY;
      this.achievementDragStartScrollY = this.achievementScrollY || 0;
      return true;
    }
    return false;
  }

  stopAchievementDrag() {
    this.isDraggingAchievementList = false;
    this.achievementDragStartY = 0;
    this.achievementDragStartScrollY = 0;
  }

  isTouchInAchievementScrollArea(touchX, touchY) {
    const area = this.achievementScrollArea;
    if (!area) return false;
    return touchX >= area.x && touchX <= area.x + area.w &&
      touchY >= area.y && touchY <= area.y + area.h;
  }

  // 检测角色选择点击
  checkCharacterSelectClick(touchX, touchY) {
    const scroll = this.characterScroll;
    if (!scroll) return false;

    const { startX, scrollAreaTop, selectWidth, selectHeight, spacing, colCount, rowSpacing, listCount, list } = scroll;

    // 计算滚动偏移
    const scrollOffset = this.characterScrollY;

    for (let i = 0; i < listCount; i++) {
      const row = Math.floor(i / colCount);
      const col = i % colCount;
      const charName = list[i];
      const x = startX + col * (selectWidth + spacing);
      const y = scrollAreaTop + row * rowSpacing - scrollOffset;

      // 检查是否在卡片范围内
      if (touchX >= x && touchX <= x + selectWidth &&
          touchY >= y && touchY <= y + selectHeight) {
        this.characterProfileFocus = charName;
        if (!progressionSystem.isCharacterUnlocked(this.progression, charName)) {
          this.characterPendingSelect = null;
          const unlockStatus = progressionSystem.getCharacterUnlockStatus(this.progression, charName);
          this.showShopToast(unlockStatus.label + '，' + unlockStatus.progressText, '#ffb37a');
          return true;
        }
        // 只标记待确认选择，不真正切换
        this.characterPendingSelect = charName;
        this.audio.playClick();
        return true;
      }
    }
    return false;
  }

  // 确认角色选择
  confirmCharacterSelect() {
    const pending = this.characterPendingSelect || this.characterProfileFocus;
    if (!pending) {
      this.showShopToast('请先选择一个角色', '#ff7675');
      return false;
    }
    if (!progressionSystem.isCharacterUnlocked(this.progression, pending)) {
      this.showShopToast('该角色未解锁', '#ff7675');
      return false;
    }
    const result = progressionSystem.equipCharacter(this.progression, pending);
    if (result && result.success) {
      this.progression = result.progress;
      this.refreshProgressionEffects();
      loadCharacter(pending);
      switchCharacter(pending);
      this.showShopToast(result.message, '#55efc4');
      this.characterPendingSelect = null;  // 清除待确认状态
      return true;
    }
    return false;
  }

  startGame(options = {}) {
    this.clearPendingTimeouts();
    this.generatePraises();
    if (this.panelManager) {
      this.panelManager.closeAll();
    }
    const debugProfile = options && options.debugProfile
      ? debugRuntime.cloneProfile(options.debugProfile)
      : null;
    this.setDebugProfile(debugProfile);

    const itemResult = this.isDebugRun()
      ? { progress: this.progression, itemName: '', effects: {} }
      : progressionSystem.consumeEquippedItem(this.progression);
    if (!this.isDebugRun()) {
      this.progression = itemResult.progress;
    }
    this.pendingRunItemEffects = itemResult.effects || {};
    this.initGame();
    this.applyDebugStartProfile();
    this.runItemEffects = Object.assign({}, this.pendingRunItemEffects);
    this.pendingRunItemEffects = {};
    this.runEncounteredBossTypes = {};
    this.worldviewLastRunUnlocks = [];
    this.updateDifficulty();
    this.refreshPlatformRuntimeEffects();
    this.state = 'playing';
    this.audio.playBGM();
    const intro = worldview.getRunStartNarrative(this);
    const _this = this;
    this.scheduleTimeout(function() {
      if (_this.state === 'playing') {
        _this.barrage.show(_this.W / 2 - 96, _this.H / 2, intro.headline, '#7ce7ff');
      }
    }, 500);
    this.scheduleTimeout(function() {
      if (_this.state === 'playing') {
        _this.barrage.show(_this.W / 2 - 132, _this.H / 2 - 60, intro.subline, '#ffd166');
      }
    }, 1200);
    if (itemResult.itemName) {
      this.scheduleTimeout(function() {
        if (_this.state === 'playing') {
          _this.barrage.show(_this.W / 2 - 70, _this.H / 2 + 50, '本局使用：' + itemResult.itemName, '#55efc4');
        }
      }, 1600);
    }
  }

  gameOver() {
    this.clearPendingTimeouts();
    this.gameMode.onGameOver(this);
    if (this.isDebugRun()) {
      this.runRewardSummary = null;
    } else {
      const rewardResult = progressionSystem.awardRunCoins(this.progression, {
        mode: this.gameMode.gameMode,
        score: this.score,
        combo: this.maxCombo,
        time: this.finalElapsedTime || 0,
        challengeCompleted: this.gameMode.gameMode === 'challenge' &&
          typeof this.gameMode.isChallengeCompleted === 'function' &&
          this.gameMode.isChallengeCompleted()
      });
      this.progression = rewardResult.progress;

      const achievementResult = progressionSystem.updateRunStats(this.progression, {
        score: this.score,
        combo: this.maxCombo,
        coinsCollected: this.sessionPickupCoins
      });
      this.progression = achievementResult.progress;

      const worldviewResult = worldview.resolveWorldviewProgress(this.progression, {
        score: this.score,
        mode: this.gameMode.gameMode,
        selectedLandmark: this.gameMode.selectedLandmark,
        bossProfilesEncountered: Object.keys(this.runEncounteredBossTypes || {})
      });
      this.progression.worldview = worldviewResult.state;
      this.progression = progressionSystem.saveProgress(this.progression);
      this.worldviewLastRunUnlocks = worldviewResult.unlocks || [];

      let delay = 2000;
      if (achievementResult.unlocks && achievementResult.unlocks.length > 0 && this.barrage) {
        for (const unlock of achievementResult.unlocks) {
          this.scheduleTimeout(() => {
            if (this.barrage && this.state === 'gameover') {
              this.barrage.show(this.W / 2 - 100, this.H / 2 - 80, unlock.message, '#ffd700');
            }
          }, delay);
          delay += 1200;
        }
      }

      if (this.worldviewLastRunUnlocks.length > 0 && this.barrage) {
        for (const unlock of this.worldviewLastRunUnlocks) {
          this.scheduleTimeout(() => {
            if (this.barrage && this.state === 'gameover') {
              this.barrage.show(this.W / 2 - 118, this.H / 2 - 30, unlock.message, '#7ce7ff');
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
        eventCoins: this.sessionEventCoins,
        totalCoins: rewardResult.totalCoins + this.sessionBossCoins + this.sessionPickupCoins + this.sessionEventCoins,
        balance: rewardResult.progress.coins
      };
    }

    this.state = 'gameover';
    this.growthActive = false;
    this.growthExpiresAt = 0;
    this.runPickupEffects = {};
    this.setPlayerScale(1);
    this.trailEffects = [];
    this.pet = null;
    this.combo = 0;
    this.shakeTimer = 0;
    if (!this.isDebugRun()) {
      this.saveToCloudStorage();
    }
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
    const selfEntry = this.getCurrentUserRankEntry();
    this.rankLoading = true;
    this.rankList = selfEntry ? [selfEntry] : [];

    // 使用云数据库获取排行榜
    cloudStorage.getAllRankList(function(success, rankData) {
      _this.rankLoading = false;
      if (success && rankData) {
        _this.rankList = _this.mergeRankListWithCurrentUser(rankData);
      } else {
        console.log('获取排行榜失败');
        _this.rankList = selfEntry ? [selfEntry] : [];
      }
    });
  }

  getCurrentUserRankEntry() {
    const stats = ((this.progression || {}).achievementStats || {});
    const bestScore = Math.max(
      0,
      Math.floor(Math.max(stats.highestScore || 0, this.score || 0))
    );
    const wxUserInfo = this.wxUserInfo || {};
    const nickname = wxUserInfo.nickName || this.playerName || '匿名用户';
    const avatarUrl = wxUserInfo.avatarUrl || '';
    const identity = avatarUrl || nickname;

    if (!identity && bestScore <= 0) {
      return null;
    }

    return {
      rank: 0,
      nickname: nickname,
      avatarUrl: avatarUrl,
      score: bestScore,
      isSelf: true,
      identity: identity
    };
  }

  mergeRankListWithCurrentUser(rankData) {
    const formattedList = [];
    const selfEntry = this.getCurrentUserRankEntry();
    const selfIdentity = selfEntry ? selfEntry.identity : '';
    let hasSelf = false;

    for (var i = 0; i < rankData.length; i++) {
      var item = rankData[i] || {};
      var nickname = item.nickname || '匿名用户';
      var avatarUrl = item.avatarUrl || '';
      var score = item.bestScore || item.score || 0;
      var identity = avatarUrl || nickname;
      var isSelf = !!selfEntry && !!identity && identity === selfIdentity;

      if (isSelf) {
        hasSelf = true;
      }

      formattedList.push({
        nickname: nickname,
        avatarUrl: avatarUrl,
        score: score,
        isSelf: isSelf,
        identity: identity
      });
    }

    if (selfEntry && !hasSelf) {
      formattedList.push({
        nickname: selfEntry.nickname,
        avatarUrl: selfEntry.avatarUrl,
        score: selfEntry.score,
        isSelf: true,
        identity: selfEntry.identity
      });
    }

    formattedList.sort(function(a, b) {
      return (b.score || 0) - (a.score || 0);
    });

    for (var j = 0; j < formattedList.length; j++) {
      formattedList[j].rank = j + 1;
    }

    return formattedList;
  }

  goToHome() {
    this.clearPendingTimeouts();
    this.state = 'start';
    this.combo = 0;
    this.chargeCount = 0;
    this.chargeFull = false;
    this.chargeDashing = false;
    this.lastLandedPlatform = null;
    this.controlLockedUntil = 0;
    this.bossKnockbackUntil = 0;
    this.pendingBossLaunch = null;
    this.nextBossSpawnPlan = null;
    this.runRewardSummary = null;
    this.sessionBossCoins = 0;
    this.sessionPickupCoins = 0;
    this.sessionEventCoins = 0;
    this.runItemEffects = {};
    this.pendingRunItemEffects = {};
    this.runBuffEffects = {};
    this.runPickupEffects = {};
    this.growthExpiresAt = 0;
    this.setDebugProfile(null);
    this.resetDebugPanelScroll();
    if (this.panelManager) {
      this.panelManager.closeAll();
    }
    this.gameMode.reset();
    this.skillSystem.reset();
    this.bossSystem.reset();
    this.runDirector.reset();
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
