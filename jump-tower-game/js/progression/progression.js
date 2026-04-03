/**
 * 经济与成长系统
 */

const tableManager = require('../tables/tableManager');
const { GAME_MODES } = require('../game/constants');
const trailEffects = require('../effects/trail');
const petSystem = require('../pet/pet');
const physics = require('../physics/physics');

const STORAGE_KEY = 'jump_tower_progress_v1';
const PROGRESS_VERSION = 1;

const baseTrailConfig = trailEffects.getTrailConfig();
const basePetConfig = petSystem.getPetConfig();

function getDefaultProgress() {
  return {
    version: PROGRESS_VERSION,
    coins: 0,
    lifetimeCoinsEarned: 0,
    bossKills: 0,
    upgrades: {}
  };
}

function loadProgress() {
  const progress = getDefaultProgress();
  if (typeof wx === 'undefined' || typeof wx.getStorageSync !== 'function') {
    return normalizeProgress(progress);
  }

  try {
    const stored = wx.getStorageSync(STORAGE_KEY);
    if (!stored) {
      return normalizeProgress(progress);
    }

    const parsed = typeof stored === 'string' ? JSON.parse(stored) : stored;
    return normalizeProgress(Object.assign(progress, parsed || {}));
  } catch (err) {
    console.warn('[Progression] 读取存档失败，使用默认存档', err);
    return normalizeProgress(progress);
  }
}

function saveProgress(progress) {
  const normalized = normalizeProgress(progress);
  if (typeof wx === 'undefined' || typeof wx.setStorageSync !== 'function') {
    return normalized;
  }

  try {
    wx.setStorageSync(STORAGE_KEY, normalized);
  } catch (err) {
    console.warn('[Progression] 保存存档失败', err);
  }

  return normalized;
}

function normalizeProgress(progress) {
  const next = Object.assign(getDefaultProgress(), progress || {});
  next.coins = Math.max(0, Math.floor(next.coins || 0));
  next.lifetimeCoinsEarned = Math.max(0, Math.floor(next.lifetimeCoinsEarned || 0));
  next.bossKills = Math.max(0, Math.floor(next.bossKills || 0));
  next.upgrades = next.upgrades || {};

  const upgrades = getUpgradeRows();
  for (let i = 0; i < upgrades.length; i++) {
    const row = upgrades[i];
    const currentLevel = Math.max(0, Math.floor(next.upgrades[row.UpgradeId] || 0));
    next.upgrades[row.UpgradeId] = Math.min(currentLevel, row.MaxLevel);
  }

  next.version = PROGRESS_VERSION;
  return next;
}

function getEconomyRows() {
  return tableManager.getAll('EconomyConfig');
}

function getUpgradeRows() {
  return tableManager.getAll('Upgrades');
}

function getEconomyValue(key, defaultValue) {
  const rows = getEconomyRows();
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].Key === key) {
      return rows[i].Value;
    }
  }
  return defaultValue;
}

function getUpgradeRow(upgradeId) {
  const rows = getUpgradeRows();
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].UpgradeId === upgradeId) {
      return rows[i];
    }
  }
  return null;
}

function getUpgradeLevel(progress, upgradeId) {
  const upgrades = progress && progress.upgrades ? progress.upgrades : {};
  return Math.max(0, Math.floor(upgrades[upgradeId] || 0));
}

function getUpgradeEffect(row, level) {
  if (!row) return 0;
  return row.EffectBase + row.EffectPerLevel * level;
}

function getNextUpgradeCost(row, level) {
  if (!row || level >= row.MaxLevel) return 0;
  return Math.floor(row.BaseCost * Math.pow(row.CostGrowth, level));
}

function getUpgradeCatalog(progress) {
  const normalized = normalizeProgress(progress);
  return getUpgradeRows().map(function(row) {
    const level = getUpgradeLevel(normalized, row.UpgradeId);
    const currentEffect = getUpgradeEffect(row, level);
    const nextEffect = level < row.MaxLevel ? getUpgradeEffect(row, level + 1) : currentEffect;
    const cost = getNextUpgradeCost(row, level);
    return {
      id: row.UpgradeId,
      name: row.Name,
      desc: row.Desc,
      category: row.Category,
      maxLevel: row.MaxLevel,
      level: level,
      cost: cost,
      currentEffect: currentEffect,
      nextEffect: nextEffect,
      affordable: cost > 0 && normalized.coins >= cost,
      isMaxLevel: level >= row.MaxLevel
    };
  });
}

function purchaseUpgrade(progress, upgradeId) {
  const normalized = normalizeProgress(progress);
  const row = getUpgradeRow(upgradeId);
  if (!row) {
    return { success: false, reason: 'missing', message: '未找到强化项' };
  }

  const level = getUpgradeLevel(normalized, upgradeId);
  if (level >= row.MaxLevel) {
    return { success: false, reason: 'max', message: '已满级' };
  }

  const cost = getNextUpgradeCost(row, level);
  if (normalized.coins < cost) {
    return { success: false, reason: 'coins', message: '金币不足' };
  }

  normalized.coins -= cost;
  normalized.upgrades[upgradeId] = level + 1;
  saveProgress(normalized);

  return {
    success: true,
    progress: normalized,
    row: row,
    cost: cost,
    newLevel: level + 1,
    message: row.Name + ' 升到 Lv.' + (level + 1)
  };
}

function parseRewardString(rewardText) {
  if (!rewardText) return { coins: 0 };
  const match = String(rewardText).match(/coin_(\d+)/i);
  if (!match) return { coins: 0 };
  return {
    coins: parseInt(match[1], 10) || 0
  };
}

function awardBossDrop(progress, rewardText) {
  const normalized = normalizeProgress(progress);
  const reward = parseRewardString(rewardText);
  const defaultCoin = Math.floor(getEconomyValue('BOSS_DEFAULT_COIN', 10));
  const coins = reward.coins > 0 ? reward.coins : defaultCoin;

  normalized.coins += coins;
  normalized.lifetimeCoinsEarned += coins;
  normalized.bossKills += 1;
  saveProgress(normalized);

  return {
    progress: normalized,
    coins: coins
  };
}

function grantCoins(progress, amount) {
  const normalized = normalizeProgress(progress);
  const coins = Math.max(0, Math.floor(amount || 0));
  if (coins <= 0) {
    return {
      progress: normalized,
      coins: 0
    };
  }

  normalized.coins += coins;
  normalized.lifetimeCoinsEarned += coins;
  saveProgress(normalized);

  return {
    progress: normalized,
    coins: coins
  };
}

function awardRunCoins(progress, runSummary) {
  const normalized = normalizeProgress(progress);
  const summary = runSummary || {};
  const baseCoins = Math.floor(getEconomyValue('RUN_BASE_COIN', 12));
  const scoreEvery = Math.max(1, Math.floor(getEconomyValue('SCORE_PER_COIN_EVERY', 40)));
  const scoreUnit = getEconomyValue('SCORE_COIN_UNIT', 1);
  const comboUnit = getEconomyValue('COMBO_COIN_UNIT', 0.5);

  const heightCoins = Math.floor((summary.score || 0) / scoreEvery) * scoreUnit;
  const comboCoins = Math.floor((summary.combo || 0) * comboUnit);
  const modeMultiplier = getModeMultiplier(summary.mode);
  const challengeBonus = summary.challengeCompleted
    ? Math.floor(getEconomyValue('CHALLENGE_CLEAR_BONUS', 18))
    : 0;

  const subtotal = baseCoins + heightCoins + comboCoins;
  const modeCoins = Math.floor(subtotal * modeMultiplier);
  const totalCoins = Math.max(0, modeCoins + challengeBonus);

  normalized.coins += totalCoins;
  normalized.lifetimeCoinsEarned += totalCoins;
  saveProgress(normalized);

  return {
    progress: normalized,
    baseCoins: baseCoins,
    heightCoins: heightCoins,
    comboCoins: comboCoins,
    modeMultiplier: modeMultiplier,
    challengeBonus: challengeBonus,
    totalCoins: totalCoins
  };
}

function getModeMultiplier(mode) {
  if (mode === GAME_MODES.TIME_ATTACK) {
    return getEconomyValue('TIME_ATTACK_REWARD_MULTIPLIER', 1.1);
  }
  if (mode === GAME_MODES.CHALLENGE) {
    return getEconomyValue('CHALLENGE_REWARD_MULTIPLIER', 1.2);
  }
  return getEconomyValue('ENDLESS_REWARD_MULTIPLIER', 1);
}

function applyUpgradesToGame(game, progress) {
  const normalized = normalizeProgress(progress);
  const bonuses = getAppliedBonuses(normalized);

  game.progression = normalized;
  game.PLAYER_SPEED = game.baseStats.PLAYER_SPEED + bonuses.moveSpeed;
  game.JUMP_FORCE = game.baseStats.JUMP_FORCE - bonuses.jumpForce;
  game.BOOST_JUMP_FORCE = game.baseStats.BOOST_JUMP_FORCE - bonuses.jumpForce;
  game.DOUBLE_JUMP_FORCE = game.baseStats.DOUBLE_JUMP_FORCE - bonuses.jumpForce * 0.75;
  game.chargeMax = game.baseStats.CHARGE_MAX + bonuses.chargeMax;
  game.growthScale = game.baseStats.growthScale + bonuses.growthScale;
  game.growthLaunchScale = bonuses.growthLaunchScale;

  physics.constants.PLAYER_SPEED = game.PLAYER_SPEED;
  physics.constants.JUMP_FORCE = game.JUMP_FORCE;
  physics.constants.BOOST_JUMP_FORCE = game.BOOST_JUMP_FORCE;
  physics.constants.DOUBLE_JUMP_FORCE = game.DOUBLE_JUMP_FORCE;

  if (game.skillSystem) {
    game.skillSystem.chargeMax = game.chargeMax;
  }
  if (typeof game.chargeCount === 'number') {
    game.chargeCount = Math.min(game.chargeCount, game.chargeMax);
    game.chargeFull = game.chargeCount >= game.chargeMax;
  }

  const trailConfig = JSON.parse(JSON.stringify(baseTrailConfig));
  trailConfig.width = baseTrailConfig.width * bonuses.mainTrailScale;
  trailConfig.shadowBlur = baseTrailConfig.shadowBlur * (1 + (bonuses.mainTrailScale - 1) * 0.6);
  trailConfig.ionParticleCount = Math.round(baseTrailConfig.ionParticleCount * (1 + (bonuses.mainTrailScale - 1) * 0.8));
  trailConfig.headRibbon.width = baseTrailConfig.headRibbon.width * bonuses.headRibbonScale;
  trailConfig.headRibbon.shadowBlur = baseTrailConfig.headRibbon.shadowBlur * (1 + (bonuses.headRibbonScale - 1) * 0.6);
  trailConfig.headRibbon.maxSegmentLength = baseTrailConfig.headRibbon.maxSegmentLength * bonuses.headRibbonScale;
  trailConfig.headRibbon.ionParticleCount = Math.round(baseTrailConfig.headRibbon.ionParticleCount * (1 + (bonuses.headRibbonScale - 1) * 0.8));
  trailEffects.setTrailConfig(trailConfig);

  petSystem.setPetConfig({
    radius: basePetConfig.radius * bonuses.petScale,
    glowRadius: basePetConfig.glowRadius * bonuses.petScale,
    trailWidth: basePetConfig.trailWidth * bonuses.petScale,
    shadowBlur: basePetConfig.shadowBlur * (1 + (bonuses.petScale - 1) * 0.6)
  });

  return bonuses;
}

function getAppliedBonuses(progress) {
  const normalized = normalizeProgress(progress);
  return {
    jumpForce: getUpgradeEffectById(normalized, 'jump_force'),
    moveSpeed: getUpgradeEffectById(normalized, 'move_speed'),
    chargeMax: Math.round(getUpgradeEffectById(normalized, 'charge_max')),
    growthScale: getUpgradeEffectById(normalized, 'growth_scale'),
    growthLaunchScale: getUpgradeEffectById(normalized, 'growth_launch'),
    mainTrailScale: getUpgradeEffectById(normalized, 'main_trail'),
    headRibbonScale: getUpgradeEffectById(normalized, 'head_ribbon'),
    petScale: getUpgradeEffectById(normalized, 'pet_aura')
  };
}

function getUpgradeEffectById(progress, upgradeId) {
  const row = getUpgradeRow(upgradeId);
  return getUpgradeEffect(row, getUpgradeLevel(progress, upgradeId));
}

function formatUpgradeEffect(upgradeId, effectValue) {
  switch (upgradeId) {
    case 'jump_force':
      return '跳跃力 +' + effectValue.toFixed(1);
    case 'move_speed':
      return '移速 +' + effectValue.toFixed(2);
    case 'charge_max':
      return '蓄力上限 +' + Math.round(effectValue);
    case 'growth_scale':
      return '变大倍率 +' + effectValue.toFixed(2);
    case 'growth_launch':
      return '撞飞倍率 x' + effectValue.toFixed(2);
    case 'main_trail':
      return '主飘带强度 x' + effectValue.toFixed(2);
    case 'head_ribbon':
      return '头带强度 x' + effectValue.toFixed(2);
    case 'pet_aura':
      return '宠物强度 x' + effectValue.toFixed(2);
    default:
      return String(effectValue);
  }
}

module.exports = {
  STORAGE_KEY,
  getDefaultProgress,
  loadProgress,
  saveProgress,
  normalizeProgress,
  getUpgradeCatalog,
  getUpgradeLevel,
  getUpgradeEffect,
  getNextUpgradeCost,
  formatUpgradeEffect,
  purchaseUpgrade,
  getEconomyValue,
  grantCoins,
  awardBossDrop,
  awardRunCoins,
  applyUpgradesToGame
};
