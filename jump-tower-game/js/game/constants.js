// 游戏常量配置
// 数据从表格加载：GameConfig.txt, Praises.txt, Milestones.txt

const tableManager = require('../tables/tableManager');
const debugRuntime = require('./debugRuntime');

const GAME_MODES = {
  ENDLESS: 'endless',
  CHALLENGE: 'challenge',
  TIME_ATTACK: 'timeAttack'
};

const TIME_ATTACK_OPTIONS = [
  { label: '1分钟', value: 60000 },
  { label: '5分钟', value: 300000 },
  { label: '10分钟', value: 600000 },
  { label: '15分钟', value: 900000 },
  { label: '30分钟', value: 1800000 }
];

/**
 * 从表格获取游戏配置值
 */
function getConfigValue(key, defaultValue) {
  const configs = tableManager.getAll('GameConfig');
  const config = configs.find(c => c.Key === key);
  return config ? config.Value : defaultValue;
}

/**
 * 从表格获取夸夸词列表
 */
function getPraiseTemplates() {
  const praises = tableManager.getAll('Praises');
  return praises.map(p => p.Template);
}

/**
 * 从表格获取里程碑列表
 */
function getMilestones() {
  return tableManager.getAll('Milestones').map(m => ({
    h: m.Height,
    msg: m.Message
  }));
}

function getDifficultyConfig() {
  return {
    scoreRampStart: getConfigValue('DIFFICULTY_SCORE_RAMP_START', 0),
    scoreRampEnd: getConfigValue('DIFFICULTY_SCORE_RAMP_END', 5000),
    stageHeight: getConfigValue('DIFFICULTY_STAGE_HEIGHT', 200),
    platformGapMin: {
      base: getConfigValue('DIFFICULTY_PLATFORM_GAP_MIN_BASE', 80),
      maxMultiplier: getConfigValue('DIFFICULTY_PLATFORM_GAP_MIN_MAX_MULTIPLIER', 2.5)
    },
    platformGapMax: {
      base: getConfigValue('DIFFICULTY_PLATFORM_GAP_MAX_BASE', 140),
      maxMultiplier: getConfigValue('DIFFICULTY_PLATFORM_GAP_MAX_MAX_MULTIPLIER', 2.5)
    },
    playerSpeedMultiplier: {
      base: getConfigValue('DIFFICULTY_PLAYER_SPEED_MULTIPLIER_BASE', 1),
      max: getConfigValue('DIFFICULTY_PLAYER_SPEED_MULTIPLIER_MAX', 1.35)
    },
    maxFallSpeedMultiplier: {
      base: getConfigValue('DIFFICULTY_MAX_FALL_SPEED_MULTIPLIER_BASE', 1),
      max: getConfigValue('DIFFICULTY_MAX_FALL_SPEED_MULTIPLIER_MAX', 1.6)
    },
    movingPlatformSpeedMultiplier: {
      base: getConfigValue('DIFFICULTY_MOVING_PLATFORM_SPEED_MULTIPLIER_BASE', 1),
      max: getConfigValue('DIFFICULTY_MOVING_PLATFORM_SPEED_MULTIPLIER_MAX', 2.2)
    }
  };
}

function getDebugConfig() {
  return debugRuntime.normalizeDebugConfig(tableManager.getAll('DebugConfig'));
}

function getBossConfig() {
  const leaperMonsterId = getConfigValue('BOSS_MONSTER_ID', 2);
  const throwerMonsterId = getConfigValue('BOSS_THROWER_MONSTER_ID', 3);
  const pool = [
    {
      monsterId: leaperMonsterId,
      behaviorType: 'leaper',
      weight: getConfigValue('BOSS_LEAPER_WEIGHT', 1),
      warningText: '前方检测到Boss动静！'
    },
    {
      monsterId: throwerMonsterId,
      behaviorType: 'thrower',
      weight: getConfigValue('BOSS_THROWER_WEIGHT', 1),
      warningText: '上方检测到空投干扰！'
    }
  ].filter(function(entry) {
    return typeof entry.monsterId === 'number' && entry.monsterId > 0 && entry.weight > 0;
  });

  return {
    monsterId: leaperMonsterId,
    leaperMonsterId,
    throwerMonsterId,
    warningLeadHeight: getConfigValue('BOSS_WARNING_LEAD_HEIGHT', 50),
    spawnHeights: [
      getConfigValue('BOSS_SPAWN_HEIGHT_1', 500),
      getConfigValue('BOSS_SPAWN_HEIGHT_2', 1000),
      getConfigValue('BOSS_SPAWN_HEIGHT_3', 2000)
    ].filter(function(height) {
      return typeof height === 'number' && height > 0;
    }).sort(function(a, b) {
      return a - b;
    }),
    repeatInterval: getConfigValue('BOSS_SPAWN_REPEAT_INTERVAL', 2000),
    pool,
    thrower: {
      topOffset: getConfigValue('BOSS_THROWER_TOP_OFFSET', 96),
      horizontalPadding: getConfigValue('BOSS_THROWER_HORIZONTAL_PADDING', 92),
      patrolSpeed: getConfigValue('BOSS_THROWER_PATROL_SPEED', 5.8),
      repositionSpeed: getConfigValue('BOSS_THROWER_REPOSITION_SPEED', 8),
      eventDurationMs: getConfigValue('BOSS_THROWER_EVENT_DURATION_MS', 18000),
      maxThrows: getConfigValue('BOSS_THROWER_MAX_THROWS', 11),
      throwIntervalMin: getConfigValue('BOSS_THROWER_THROW_INTERVAL_MIN', 850),
      throwIntervalMax: getConfigValue('BOSS_THROWER_THROW_INTERVAL_MAX', 1350),
      throwPauseMs: getConfigValue('BOSS_THROWER_THROW_PAUSE_MS', 210),
      projectileFallSpeed: getConfigValue('BOSS_THROWER_PROJECTILE_FALL_SPEED', 0.98),
      projectileDriftX: getConfigValue('BOSS_THROWER_PROJECTILE_DRIFT_X', 0.18),
      projectileSwayAmplitude: getConfigValue('BOSS_THROWER_PROJECTILE_SWAY_AMPLITUDE', 14),
      projectileSwaySpeed: getConfigValue('BOSS_THROWER_PROJECTILE_SWAY_SPEED', 0.0045),
      positiveWeight: getConfigValue('BOSS_THROWER_POSITIVE_WEIGHT', 0.65),
      negativeWeight: getConfigValue('BOSS_THROWER_NEGATIVE_WEIGHT', 0.35),
      multiThrowChance: getConfigValue('BOSS_THROWER_MULTI_THROW_CHANCE', 0.62),
      multiThrowCount: getConfigValue('BOSS_THROWER_MULTI_THROW_COUNT', 3),
      projectileRadiusScale: getConfigValue('BOSS_THROWER_PROJECTILE_RADIUS_SCALE', 1.55),
      renderSize: getConfigValue('BOSS_THROWER_RENDER_SIZE', 196)
    }
  };
}

function getRunEventConfig() {
  return {
    buffOfferStartHeight: getConfigValue('RUN_BUFF_OFFER_START_HEIGHT', 600),
    buffOfferInterval: getConfigValue('RUN_BUFF_OFFER_INTERVAL', 900),
    goalRewardCoins: getConfigValue('RUN_GOAL_REWARD_COINS', 28),
    goalTargets: {
      coins: getConfigValue('RUN_GOAL_COIN_TARGET', 12),
      movingLandings: getConfigValue('RUN_GOAL_MOVING_TARGET', 4),
      chargeDashes: getConfigValue('RUN_GOAL_CHARGE_TARGET', 2),
      specialLandings: getConfigValue('RUN_GOAL_SPECIAL_TARGET', 3)
    },
    themeEvent: {
      durationHeight: getConfigValue('THEME_EVENT_DURATION_HEIGHT', 450),
      repeatInterval: getConfigValue('THEME_EVENT_REPEAT_INTERVAL', 1800)
    },
    platformSpecial: {
      chargeChance: getConfigValue('PLATFORM_SPECIAL_CHARGE_CHANCE', 0.12),
      resonanceChance: getConfigValue('PLATFORM_SPECIAL_RESONANCE_CHANCE', 0.14),
      riskChance: getConfigValue('PLATFORM_SPECIAL_RISK_CHANCE', 0.1),
      oneWayChance: getConfigValue('PLATFORM_SPECIAL_ONE_WAY_CHANCE', 0.08),
      chargeSinkChance: getConfigValue('PLATFORM_SPECIAL_CHARGE_SINK_CHANCE', 0.06),
      riskWidthScale: getConfigValue('PLATFORM_SPECIAL_RISK_WIDTH_SCALE', 0.72),
      riskRewardCoins: getConfigValue('PLATFORM_SPECIAL_RISK_REWARD_COINS', 5),
      chargeBonus: getConfigValue('PLATFORM_SPECIAL_CHARGE_BONUS', 1),
      chargeSinkCost: getConfigValue('PLATFORM_SPECIAL_CHARGE_SINK_COST', 1),
      chargeSinkBoostScale: getConfigValue('PLATFORM_SPECIAL_CHARGE_SINK_BOOST_SCALE', 1.24),
      resonanceStreakRequirement: getConfigValue('PLATFORM_RESONANCE_STREAK_REQUIREMENT', 3),
      resonanceBonusForce: getConfigValue('PLATFORM_RESONANCE_BONUS_FORCE', 4.5)
    },
    bossChargeDash: {
      interruptRadius: getConfigValue('BOSS_CHARGE_DASH_INTERRUPT_RADIUS', 125),
      rewardCoins: getConfigValue('BOSS_CHARGE_DASH_REWARD_COINS', 32)
    },
    buffs: {
      magnetRadiusBonus: getConfigValue('RUN_BUFF_MAGNET_RADIUS_BONUS', 28),
      movingSlowScale: getConfigValue('RUN_BUFF_MOVING_SLOW_SCALE', 0.72),
      dashSegmentBonus: getConfigValue('RUN_BUFF_DASH_SEGMENT_BONUS', 1),
      comboThreshold: getConfigValue('RUN_BUFF_COMBO_THRESHOLD', 6),
      comboCoinBonus: getConfigValue('RUN_BUFF_COMBO_COIN_BONUS', 8),
      bossRewardBonus: getConfigValue('RUN_BUFF_BOSS_REWARD_BONUS', 24)
    }
  };
}

function getPickupConfig() {
  return {
    spawnStartHeight: getConfigValue('PICKUP_SPAWN_START_HEIGHT', 300),
    negativeStartHeight: getConfigValue('PICKUP_NEGATIVE_START_HEIGHT', 1200),
    positiveChanceLow: getConfigValue('PICKUP_POSITIVE_CHANCE_LOW', 0.12),
    positiveChanceHigh: getConfigValue('PICKUP_POSITIVE_CHANCE_HIGH', 0.16),
    negativeChanceHigh: getConfigValue('PICKUP_NEGATIVE_CHANCE_HIGH', 0.08),
    platformBonuses: {
      moving: getConfigValue('PICKUP_PLATFORM_BONUS_MOVING', 0.05),
      risk: getConfigValue('PICKUP_PLATFORM_BONUS_RISK', 0.08)
    },
    platformPenalties: {
      charge: getConfigValue('PICKUP_PLATFORM_PENALTY_CHARGE', 0.03),
      resonance: getConfigValue('PICKUP_PLATFORM_PENALTY_RESONANCE', 0.02)
    },
    playerSpeedMultiplier: {
      min: getConfigValue('PICKUP_PLAYER_SPEED_MULTIPLIER_MIN', 0.65),
      max: getConfigValue('PICKUP_PLAYER_SPEED_MULTIPLIER_MAX', 1.5)
    },
    maxFallSpeedMultiplier: {
      min: getConfigValue('PICKUP_MAX_FALL_SPEED_MULTIPLIER_MIN', 0.75),
      max: getConfigValue('PICKUP_MAX_FALL_SPEED_MULTIPLIER_MAX', 1.6)
    },
    movingPlatformSpeedScale: {
      min: getConfigValue('PICKUP_MOVING_PLATFORM_SPEED_SCALE_MIN', 0.65),
      max: getConfigValue('PICKUP_MOVING_PLATFORM_SPEED_SCALE_MAX', 1.6)
    },
    durations: {
      swiftWind: getConfigValue('PICKUP_DURATION_SWIFT_WIND', 7000),
      featherFall: getConfigValue('PICKUP_DURATION_FEATHER_FALL', 6500),
      dashFuel: getConfigValue('PICKUP_DURATION_DASH_FUEL', 8000),
      goldenTouch: getConfigValue('PICKUP_DURATION_GOLDEN_TOUCH', 9000),
      stickyBoots: getConfigValue('PICKUP_DURATION_STICKY_BOOTS', 6000),
      heavyCore: getConfigValue('PICKUP_DURATION_HEAVY_CORE', 5500),
      slowField: getConfigValue('PICKUP_DURATION_SLOW_FIELD', 7000),
      shortFuse: getConfigValue('PICKUP_DURATION_SHORT_FUSE', 6000)
    },
    effects: {
      swiftWind: {
        playerSpeedMultiplier: getConfigValue('PICKUP_SWIFT_WIND_PLAYER_SPEED_MULTIPLIER', 1.2)
      },
      featherFall: {
        maxFallSpeedMultiplier: getConfigValue('PICKUP_FEATHER_FALL_MAX_FALL_SPEED_MULTIPLIER', 0.82)
      },
      dashFuel: {
        chargeDashSegmentBonus: getConfigValue('PICKUP_DASH_FUEL_SEGMENT_BONUS', 1)
      },
      goldenTouch: {
        playerCoinPickupRadius: getConfigValue('PICKUP_GOLDEN_TOUCH_RADIUS_BONUS', 26)
      },
      stickyBoots: {
        playerSpeedMultiplier: getConfigValue('PICKUP_STICKY_BOOTS_PLAYER_SPEED_MULTIPLIER', 0.82)
      },
      heavyCore: {
        maxFallSpeedMultiplier: getConfigValue('PICKUP_HEAVY_CORE_MAX_FALL_SPEED_MULTIPLIER', 1.22)
      },
      slowField: {
        movingPlatformSpeedScale: getConfigValue('PICKUP_SLOW_FIELD_MOVING_PLATFORM_SPEED_SCALE', 1.35)
      },
      shortFuse: {
        chargeDashSegmentBonus: getConfigValue('PICKUP_SHORT_FUSE_SEGMENT_BONUS', -1)
      }
    }
  };
}

module.exports = {
  GAME_MODES,
  TIME_ATTACK_OPTIONS,
  getConfigValue,

  // 物理常量（从表格读取，带默认值）
  get GRAVITY() { return getConfigValue('GRAVITY', 0.45); },
  get PLAYER_SPEED() { return getConfigValue('PLAYER_SPEED', 6); },
  get JUMP_FORCE() { return getConfigValue('JUMP_FORCE', -15); },
  get BOOST_JUMP_FORCE() { return getConfigValue('BOOST_JUMP_FORCE', -22); },
  get DOUBLE_JUMP_FORCE() { return getConfigValue('DOUBLE_JUMP_FORCE', -18); },

  // 夸夸词模板（从表格读取）
  get praiseTemplates() { return getPraiseTemplates(); },

  // 默认玩家名称
  DEFAULT_PLAYER_NAME: '秀彬',

  // 里程碑高度配置（从表格读取）
  get milestones() {
    const all = getMilestones();
    // 前7个是普通里程碑
    return all.slice(0, 7);
  },

  // 5000米后的循环里程碑
  get milestonesLoop() {
    const all = getMilestones();
    // 第8个开始是循环里程碑
    return all.slice(7);
  },

  // 弹幕颜色列表
  barrageColors: ['#ffdd57', '#ff6b6b', '#74b9ff', '#55efc4', '#fd79a8', '#ffeaa7'],

  // 星星数量（从表格读取）
  get STAR_COUNT() { return getConfigValue('STAR_COUNT', 150); },

  // 初始平台数量（从表格读取）
  get INITIAL_PLATFORM_COUNT() { return getConfigValue('INITIAL_PLATFORM_COUNT', 12); },

  // 夸奖显示间隔(ms)
  get PRAISE_INTERVAL() { return getConfigValue('PRAISE_INTERVAL', 800); },

  // 连跳夸夸阈值
  get COMBO_PRAISE_THRESHOLD() { return getConfigValue('COMBO_PRAISE_THRESHOLD', 5); },

  // 相机相关
  get CAMERA_SMOOTHING() { return getConfigValue('CAMERA_SMOOTHING', 0.25); },
  get PLAYER_SAFE_ZONE() { return getConfigValue('PLAYER_SAFE_ZONE', 50); },

  // 下滑快速下落力度
  get SLIDE_FALL_FORCE() { return getConfigValue('SLIDE_FALL_FORCE', 20); },

  // 蓄力最大值
  get CHARGE_MAX() { return getConfigValue('CHARGE_MAX', 6); },
  get CHARGE_DASH_DISTANCE_PER_SEGMENT() { return getConfigValue('CHARGE_DASH_DISTANCE_PER_SEGMENT', 50); },
  get CHARGE_DASH_HEIGHT_RATIO_MAX() { return getConfigValue('CHARGE_DASH_HEIGHT_RATIO_MAX', 0.5); },

  // UI顶部安全区
  get UI_SAFE_TOP() { return getConfigValue('UI_SAFE_TOP', 60); },

  // 动态难度配置
  get difficultyConfig() { return getDifficultyConfig(); },

  // Debug预设配置
  get debugConfig() { return getDebugConfig(); },

  // Boss出现配置
  get bossConfig() { return getBossConfig(); },

  // 单局事件配置
  get runEventConfig() { return getRunEventConfig(); },

  // 单局拾取道具配置
  get pickupConfig() { return getPickupConfig(); },
};
