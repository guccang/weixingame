/**
 * 经济与成长系统
 */

const tableManager = require('../tables/tableManager');
const { GAME_MODES } = require('../game/constants');
const trailEffects = require('../effects/trail');
const petSystem = require('../pet/pet');
const physics = require('../physics/physics');

const STORAGE_KEY = 'jump_tower_progress_v3';
const LEGACY_STORAGE_KEY_V2 = 'jump_tower_progress_v2';
const LEGACY_STORAGE_KEY_V1 = 'jump_tower_progress_v1';
const PROGRESS_VERSION = 3;
const BASE_GROWTH_DURATION_MS = 6500;

const baseTrailConfig = trailEffects.getTrailConfig();
const basePetConfig = petSystem.getPetConfig();

const SHOP_TABS = [
  { id: 'upgrades', name: '强化' },
  { id: 'skills', name: '技能' },
  { id: 'characters', name: '角色' },
  { id: 'trails', name: '拖尾' },
  { id: 'pets', name: '宠物' },
  { id: 'items', name: '道具' }
];

const CAPABILITY_TYPES = {
  CHARACTER: 'character',
  SKILL: 'skill',
  TRAIL_HEAD: 'trail_head',
  TRAIL_TAIL: 'trail_tail',
  PET: 'pet',
  ITEM: 'item'
};

const EQUIP_SLOTS = {
  character: CAPABILITY_TYPES.CHARACTER,
  trail_head: CAPABILITY_TYPES.TRAIL_HEAD,
  trail_tail: CAPABILITY_TYPES.TRAIL_TAIL,
  pet: CAPABILITY_TYPES.PET,
  item: CAPABILITY_TYPES.ITEM
};

const CHARACTER_META = {
  coach: {
    price: 0,
    desc: '均衡角色，适合稳定冲层。',
    bonuses: {
      chargeMax: 0,
      moveSpeed: 0.15,
      playerCoinPickup: 0
    }
  },
  ironman: {
    price: 180,
    desc: '偏向冲刺与横移，适合吃空中金币。',
    bonuses: {
      chargeMax: 1,
      moveSpeed: 0.3,
      playerCoinPickup: 6
    }
  }
};

const PET_CATALOG = [
  {
    id: 'orb',
    name: '拾光球',
    price: 240,
    desc: '基础宠物，会主动追踪附近金币。',
    style: {
      coreColor: '#d8fff1',
      midColor: '#6df0b0',
      outerColor: '#1ea868',
      trailHeadColor: 'rgba(216, 255, 241, 0.38)',
      trailMidColor: 'rgba(109, 240, 176, 0.22)',
      trailTailColor: 'rgba(30, 168, 104, 0)'
    },
    bonuses: {
      seekRadius: 0,
      pickupRadius: 0,
      radiusScale: 1,
      glowScale: 1
    }
  },
  {
    id: 'nova',
    name: '星尘核',
    price: 420,
    desc: '高阶宠物，拾币范围更远。',
    style: {
      coreColor: '#e7f0ff',
      midColor: '#88b8ff',
      outerColor: '#4670f5',
      trailHeadColor: 'rgba(231, 240, 255, 0.42)',
      trailMidColor: 'rgba(136, 184, 255, 0.25)',
      trailTailColor: 'rgba(70, 112, 245, 0)'
    },
    bonuses: {
      seekRadius: 24,
      pickupRadius: 8,
      radiusScale: 1.1,
      glowScale: 1.18
    }
  }
];

const TAIL_TRAIL_CATALOG = [
  {
    id: 'ember',
    name: '余烬尾焰',
    price: 90,
    desc: '暖色尾焰，速度感更强。',
    colors: [
      { stop: 0, color: { r: 232, g: 120, b: 54, a: 0.56 } },
      { stop: 0.35, color: { r: 198, g: 62, b: 28, a: 0.42 } },
      { stop: 0.75, color: { r: 136, g: 34, b: 18, a: 0.26 } },
      { stop: 1, color: { r: 88, g: 18, b: 12, a: 0 } }
    ],
    shadowColor: { r: 220, g: 86, b: 46, a: 0.26 },
    ionColor: { r: 255, g: 184, b: 92, a: 0.45 }
  },
  {
    id: 'aurora',
    name: '极光尾流',
    price: 160,
    desc: '冷色尾流，更适合高空路线。',
    colors: [
      { stop: 0, color: { r: 88, g: 233, b: 255, a: 0.54 } },
      { stop: 0.35, color: { r: 44, g: 190, b: 220, a: 0.4 } },
      { stop: 0.75, color: { r: 24, g: 120, b: 162, a: 0.24 } },
      { stop: 1, color: { r: 12, g: 70, b: 104, a: 0 } }
    ],
    shadowColor: { r: 66, g: 208, b: 234, a: 0.24 },
    ionColor: { r: 160, g: 248, b: 255, a: 0.42 }
  }
];

const HEAD_TRAIL_CATALOG = [
  {
    id: 'mint',
    name: '薄荷头带',
    price: 80,
    desc: '清晰的前向拖影，强化冲刺反馈。',
    colors: [
      { stop: 0, color: { r: 86, g: 240, b: 154, a: 0.42 } },
      { stop: 0.4, color: { r: 44, g: 192, b: 118, a: 0.32 } },
      { stop: 1, color: { r: 20, g: 120, b: 74, a: 0 } }
    ],
    shadowColor: { r: 52, g: 220, b: 132, a: 0.22 },
    ionColor: { r: 92, g: 255, b: 172, a: 0.36 }
  },
  {
    id: 'nova',
    name: '电弧头环',
    price: 150,
    desc: '电弧效果更明显，便于读懂加速状态。',
    colors: [
      { stop: 0, color: { r: 230, g: 240, b: 255, a: 0.48 } },
      { stop: 0.4, color: { r: 148, g: 182, b: 255, a: 0.34 } },
      { stop: 1, color: { r: 72, g: 112, b: 255, a: 0 } }
    ],
    shadowColor: { r: 108, g: 150, b: 255, a: 0.22 },
    ionColor: { r: 188, g: 214, b: 255, a: 0.38 }
  }
];

const ITEM_CATALOG = [
  {
    id: 'coin_magnet',
    name: '吸币磁铁',
    price: 28,
    desc: '本局玩家拾币范围额外 +22。',
    runEffects: {
      playerCoinPickupRadius: 22
    }
  },
  {
    id: 'growth_tonic',
    name: '蘑菇增效剂',
    price: 32,
    desc: '本局蘑菇变大时长额外 +2500ms。',
    runEffects: {
      growthDurationMs: 2500
    }
  }
];

const TRAIL_LENGTH_CONFIG = {
  maxLevel: 8,
  baseCost: 26,
  growth: 1.52,
  effectPerLevel: 0.12
};

function getCapabilityCatalog() {
  const capabilities = [];
  const defaultCharacterId = getDefaultCharacterId();

  getCharacterRows().forEach(function(row) {
    const meta = CHARACTER_META[row.JumpFolder] || {};
    capabilities.push({
      id: getCapabilityId(CAPABILITY_TYPES.CHARACTER, row.JumpFolder),
      entityId: row.JumpFolder,
      type: CAPABILITY_TYPES.CHARACTER,
      name: row.Name,
      price: meta.price || 0,
      unlockMode: 'permanent',
      equipMode: 'single',
      defaultOwned: row.JumpFolder === defaultCharacterId,
      defaultEquipped: row.JumpFolder === defaultCharacterId,
      desc: meta.desc || '可切换的角色外观与轻差异体验。',
      effects: Object.assign({
        chargeMax: 0,
        moveSpeed: 0,
        playerCoinPickup: 0
      }, meta.bonuses || {})
    });
  });

  capabilities.push({
    id: getCapabilityId(CAPABILITY_TYPES.SKILL, 'double_jump'),
    entityId: 'double_jump',
    type: CAPABILITY_TYPES.SKILL,
    name: '二段跳',
    price: 140,
    unlockMode: 'permanent',
    equipMode: 'toggle',
    defaultOwned: false,
    defaultEquipped: false,
    desc: '购买后可在空中双击触发二段跳。',
    effects: {
      allowsDoubleJump: true
    }
  });
  capabilities.push({
    id: getCapabilityId(CAPABILITY_TYPES.SKILL, 'charge_on_jump'),
    entityId: 'charge_on_jump',
    type: CAPABILITY_TYPES.SKILL,
    name: '跳跃蓄力',
    price: 200,
    unlockMode: 'permanent',
    equipMode: 'toggle',
    defaultOwned: false,
    defaultEquipped: false,
    desc: '购买后每次跳跃都增加蓄力（不受平台限制）。',
    effects: {
      allowsChargeOnJump: true
    }
  });
  capabilities.push({
    id: getCapabilityId(CAPABILITY_TYPES.SKILL, 'slide_fall'),
    entityId: 'slide_fall',
    type: CAPABILITY_TYPES.SKILL,
    name: '下滑落下',
    price: 120,
    unlockMode: 'permanent',
    equipMode: 'toggle',
    defaultOwned: false,
    defaultEquipped: false,
    desc: '购买后可下滑快速坠落。',
    effects: {
      allowsSlideFall: true
    }
  });
  capabilities.push({
    id: getCapabilityId(CAPABILITY_TYPES.SKILL, 'charge_dash'),
    entityId: 'charge_dash',
    type: CAPABILITY_TYPES.SKILL,
    name: '蓄力冲刺',
    price: 180,
    unlockMode: 'permanent',
    equipMode: 'toggle',
    defaultOwned: false,
    defaultEquipped: false,
    desc: '购买后满蓄力时可下滑触发冲刺。',
    effects: {
      allowsChargeDash: true
    }
  });

  HEAD_TRAIL_CATALOG.forEach(function(item) {
    capabilities.push({
      id: getCapabilityId(CAPABILITY_TYPES.TRAIL_HEAD, item.id),
      entityId: item.id,
      type: CAPABILITY_TYPES.TRAIL_HEAD,
      name: item.name,
      price: item.price,
      unlockMode: 'permanent',
      equipMode: 'single',
      defaultOwned: false,
      defaultEquipped: false,
      desc: item.desc,
      effects: item
    });
  });

  TAIL_TRAIL_CATALOG.forEach(function(item) {
    capabilities.push({
      id: getCapabilityId(CAPABILITY_TYPES.TRAIL_TAIL, item.id),
      entityId: item.id,
      type: CAPABILITY_TYPES.TRAIL_TAIL,
      name: item.name,
      price: item.price,
      unlockMode: 'permanent',
      equipMode: 'single',
      defaultOwned: false,
      defaultEquipped: false,
      desc: item.desc,
      effects: item
    });
  });

  PET_CATALOG.forEach(function(item) {
    capabilities.push({
      id: getCapabilityId(CAPABILITY_TYPES.PET, item.id),
      entityId: item.id,
      type: CAPABILITY_TYPES.PET,
      name: item.name,
      price: item.price,
      unlockMode: 'permanent',
      equipMode: 'single',
      defaultOwned: false,
      defaultEquipped: false,
      desc: item.desc,
      effects: item
    });
  });

  ITEM_CATALOG.forEach(function(item) {
    capabilities.push({
      id: getCapabilityId(CAPABILITY_TYPES.ITEM, item.id),
      entityId: item.id,
      type: CAPABILITY_TYPES.ITEM,
      name: item.name,
      price: item.price,
      unlockMode: 'consumable',
      equipMode: 'single',
      defaultOwned: false,
      defaultEquipped: false,
      desc: item.desc,
      effects: item.runEffects
    });
  });

  return capabilities;
}

function getCapabilityById(capabilityId) {
  const list = getCapabilityCatalog();
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === capabilityId) return list[i];
  }
  return null;
}

function getCapabilitiesByType(type) {
  return getCapabilityCatalog().filter(function(capability) {
    return capability.type === type;
  });
}

function getEquippedCapabilityId(progress, type) {
  const normalized = progress && progress.equippedCapabilities ? progress : normalizeProgress(progress);
  return normalized.equippedCapabilities[type] || null;
}

function getEquippedCapabilityEntityId(progress, type) {
  const capabilityId = getEquippedCapabilityId(progress, type);
  const capability = getCapabilityById(capabilityId);
  return capability ? capability.entityId : null;
}

function isCapabilityOwned(progress, capabilityId) {
  const normalized = progress && progress.ownedCapabilities ? progress : normalizeProgress(progress);
  const capability = getCapabilityById(capabilityId);
  if (!capability) return false;
  if (capability.unlockMode === 'consumable') {
    return toCapabilityCount(normalized.ownedCapabilities[capabilityId]) > 0;
  }
  return !!normalized.ownedCapabilities[capabilityId];
}

function isCapabilityEquipped(progress, capabilityId) {
  const capability = getCapabilityById(capabilityId);
  if (!capability) return false;
  const normalized = progress && progress.equippedCapabilities ? progress : normalizeProgress(progress);
  return normalized.equippedCapabilities[capability.type] === capabilityId;
}

function isCapabilityEnabled(progress, capabilityId) {
  const capability = getCapabilityById(capabilityId);
  if (!capability) return false;
  const normalized = progress && progress.enabledCapabilities ? progress : normalizeProgress(progress);
  if (capability.equipMode === 'toggle') {
    return !!normalized.enabledCapabilities[capabilityId];
  }
  return isCapabilityEquipped(normalized, capabilityId);
}

function canUseCapability(progress, capabilityId) {
  const capability = getCapabilityById(capabilityId);
  if (!capability) return false;
  if (!isCapabilityOwned(progress, capabilityId)) return false;
  if (capability.equipMode === 'toggle') {
    return isCapabilityEnabled(progress, capabilityId);
  }
  if (capability.type === CAPABILITY_TYPES.ITEM) {
    return isCapabilityEquipped(progress, capabilityId);
  }
  return true;
}

function purchaseCapability(progress, capabilityId) {
  const normalized = normalizeProgress(progress);
  const capability = getCapabilityById(capabilityId);
  if (!capability) {
    return { success: false, reason: 'missing', message: '未找到内容' };
  }
  if (capability.unlockMode !== 'consumable' && isCapabilityOwned(normalized, capabilityId)) {
    return { success: false, reason: 'owned', message: '已拥有' + capability.name };
  }
  if (normalized.coins < capability.price) {
    return { success: false, reason: 'coins', message: '金币不足' };
  }

  normalized.coins -= capability.price;
  if (capability.unlockMode === 'consumable') {
    normalized.ownedCapabilities[capabilityId] = toCapabilityCount(normalized.ownedCapabilities[capabilityId]) + 1;
  } else {
    normalized.ownedCapabilities[capabilityId] = true;
    if (capability.equipMode === 'single' && capability.type !== CAPABILITY_TYPES.ITEM) {
      normalized.equippedCapabilities[capability.type] = capabilityId;
    }
    if (capability.equipMode === 'toggle') {
      normalized.enabledCapabilities[capabilityId] = true;
    }
  }
  syncLegacyCapabilityFields(normalized);
  saveProgress(normalized);
  return {
    success: true,
    progress: normalized,
    capability: capability,
    message: capability.unlockMode === 'consumable' ? (capability.name + ' +1') : ('解锁' + capability.name)
  };
}

function equipCapability(progress, capabilityId) {
  const normalized = normalizeProgress(progress);
  const capability = getCapabilityById(capabilityId);
  if (!capability) {
    return { success: false, reason: 'missing', message: '未找到内容' };
  }
  if (capability.equipMode !== 'single') {
    return { success: false, reason: 'mode', message: '该内容不可装备' };
  }
  if (!isCapabilityOwned(normalized, capabilityId)) {
    return { success: false, reason: 'locked', message: capability.name + '未解锁' };
  }
  normalized.equippedCapabilities[capability.type] = capabilityId;
  syncLegacyCapabilityFields(normalized);
  saveProgress(normalized);
  return {
    success: true,
    progress: normalized,
    capability: capability,
    message: capability.type === CAPABILITY_TYPES.ITEM ? ('已装备' + capability.name) : ('已装备' + capability.name)
  };
}

function unequipCapability(progress, type) {
  const normalized = normalizeProgress(progress);
  if (type === CAPABILITY_TYPES.CHARACTER) {
    return { success: false, reason: 'required', message: '角色不可卸下' };
  }
  const equippedId = normalized.equippedCapabilities[type];
  if (!equippedId) {
    return { success: false, reason: 'empty', message: '当前未装备' };
  }
  const capability = getCapabilityById(equippedId);
  normalized.equippedCapabilities[type] = null;
  syncLegacyCapabilityFields(normalized);
  saveProgress(normalized);
  return {
    success: true,
    progress: normalized,
    capability: capability,
    message: capability ? ('已卸下' + capability.name) : '已卸下'
  };
}

function toggleCapability(progress, capabilityId) {
  const normalized = normalizeProgress(progress);
  const capability = getCapabilityById(capabilityId);
  if (!capability) {
    return { success: false, reason: 'missing', message: '未找到内容' };
  }
  if (capability.equipMode !== 'toggle') {
    return { success: false, reason: 'mode', message: '该内容不可开关' };
  }
  if (!isCapabilityOwned(normalized, capabilityId)) {
    return { success: false, reason: 'locked', message: capability.name + '未解锁' };
  }
  normalized.enabledCapabilities[capabilityId] = !normalized.enabledCapabilities[capabilityId];
  syncLegacyCapabilityFields(normalized);
  saveProgress(normalized);
  return {
    success: true,
    progress: normalized,
    capability: capability,
    message: normalized.enabledCapabilities[capabilityId] ? ('已启用' + capability.name) : ('已关闭' + capability.name)
  };
}

function getDefaultProgress() {
  return {
    version: PROGRESS_VERSION,
    coins: 0,
    lifetimeCoinsEarned: 0,
    bossKills: 0,
    upgrades: {},
    ownedCapabilities: {},
    equippedCapabilities: {},
    enabledCapabilities: {},
    unlockedCharacters: [],
    selectedCharacterId: null,
    unlockedPets: [],
    selectedPetId: null,
    unlockedHeadTrails: [],
    unlockedTailTrails: [],
    selectedHeadTrailId: null,
    selectedTailTrailId: null,
    trailLengthLevel: 0,
    itemInventory: {},
    equippedItemId: null,
    achievements: {},
    achievementStats: {
      totalRuns: 0,
      totalPlayTime: 0,
      highestCombo: 0,
      highestScore: 0,
      totalCoinsCollected: 0,
      perfectPlatforms: 0,
      consecutiveDays: 0,
      lastPlayDate: null
    }
  };
}

function loadProgress() {
  const progress = getDefaultProgress();
  if (typeof wx === 'undefined' || typeof wx.getStorageSync !== 'function') {
    return normalizeProgress(progress);
  }

  try {
    const stored = wx.getStorageSync(STORAGE_KEY) ||
      wx.getStorageSync(LEGACY_STORAGE_KEY_V2) ||
      wx.getStorageSync(LEGACY_STORAGE_KEY_V1);
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

function resetProgress() {
  const next = normalizeProgress(getDefaultProgress());
  if (typeof wx !== 'undefined' && typeof wx.removeStorageSync === 'function') {
    try {
      wx.removeStorageSync(STORAGE_KEY);
      wx.removeStorageSync(LEGACY_STORAGE_KEY_V2);
      wx.removeStorageSync(LEGACY_STORAGE_KEY_V1);
    } catch (err) {
      console.warn('[Progression] 清空存档失败，回退为覆盖默认值', err);
    }
  }
  return saveProgress(next);
}

function normalizeProgress(progress) {
  const next = Object.assign(getDefaultProgress(), progress || {});
  next.coins = Math.max(0, Math.floor(next.coins || 0));
  next.lifetimeCoinsEarned = Math.max(0, Math.floor(next.lifetimeCoinsEarned || 0));
  next.bossKills = Math.max(0, Math.floor(next.bossKills || 0));
  next.upgrades = next.upgrades || {};
  next.itemInventory = next.itemInventory || {};
  next.ownedCapabilities = next.ownedCapabilities || {};
  next.equippedCapabilities = next.equippedCapabilities || {};
  next.enabledCapabilities = next.enabledCapabilities || {};
  next.achievements = next.achievements || {};
  next.achievementStats = Object.assign(getDefaultProgress().achievementStats, next.achievementStats || {});

  // Normalize achievementStats fields
  const stats = next.achievementStats;
  stats.totalRuns = Math.max(0, Math.floor(stats.totalRuns || 0));
  stats.totalPlayTime = Math.max(0, Math.floor(stats.totalPlayTime || 0));
  stats.highestCombo = Math.max(0, Math.floor(stats.highestCombo || 0));
  stats.highestScore = Math.max(0, Math.floor(stats.highestScore || 0));
  stats.totalCoinsCollected = Math.max(0, Math.floor(stats.totalCoinsCollected || 0));
  stats.perfectPlatforms = Math.max(0, Math.floor(stats.perfectPlatforms || 0));
  stats.consecutiveDays = Math.max(0, Math.floor(stats.consecutiveDays || 0));

  // Check daily login
  const today = new Date().toISOString().split('T')[0];
  const lastPlay = stats.lastPlayDate;
  if (lastPlay && lastPlay !== today) {
    const lastDate = new Date(lastPlay);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      stats.consecutiveDays = (stats.consecutiveDays || 0) + 1;
    } else if (diffDays > 1) {
      stats.consecutiveDays = 1;
    }
  } else if (!lastPlay) {
    stats.consecutiveDays = 1;
  }
  stats.lastPlayDate = today;

  const defaultCharacterId = getDefaultCharacterId();
  next.unlockedCharacters = normalizeUnlockList(next.unlockedCharacters, [defaultCharacterId]);
  if (!next.selectedCharacterId || next.unlockedCharacters.indexOf(next.selectedCharacterId) === -1) {
    next.selectedCharacterId = next.unlockedCharacters[0] || defaultCharacterId;
  }

  next.unlockedPets = normalizeUnlockList(next.unlockedPets, []);
  next.selectedPetId = next.unlockedPets.indexOf(next.selectedPetId) >= 0 ? next.selectedPetId : null;

  next.unlockedHeadTrails = normalizeUnlockList(next.unlockedHeadTrails, []);
  next.unlockedTailTrails = normalizeUnlockList(next.unlockedTailTrails, []);
  next.selectedHeadTrailId = next.unlockedHeadTrails.indexOf(next.selectedHeadTrailId) >= 0 ? next.selectedHeadTrailId : null;
  next.selectedTailTrailId = next.unlockedTailTrails.indexOf(next.selectedTailTrailId) >= 0 ? next.selectedTailTrailId : null;
  next.trailLengthLevel = Math.max(0, Math.min(TRAIL_LENGTH_CONFIG.maxLevel, Math.floor(next.trailLengthLevel || 0)));

  const upgrades = getUpgradeRows();
  for (let i = 0; i < upgrades.length; i++) {
    const row = upgrades[i];
    const currentLevel = Math.max(0, Math.floor(next.upgrades[row.UpgradeId] || 0));
    next.upgrades[row.UpgradeId] = Math.min(currentLevel, row.MaxLevel);
  }

  ITEM_CATALOG.forEach(function(item) {
    next.itemInventory[item.id] = Math.max(0, Math.floor(next.itemInventory[item.id] || 0));
  });
  if (!getItemById(next.equippedItemId) || next.itemInventory[next.equippedItemId] <= 0) {
    next.equippedItemId = null;
  }

  migrateLegacyCapabilityState(next);
  normalizeCapabilityState(next);

  next.version = PROGRESS_VERSION;
  return next;
}

function normalizeUnlockList(value, defaults) {
  const next = Array.isArray(value) ? value.slice() : [];
  (defaults || []).forEach(function(id) {
    if (id && next.indexOf(id) === -1) {
      next.push(id);
    }
  });
  return next.filter(Boolean);
}

function migrateLegacyCapabilityState(progress) {
  const owned = progress.ownedCapabilities;
  const equipped = progress.equippedCapabilities;
  const enabled = progress.enabledCapabilities;

  progress.unlockedCharacters.forEach(function(characterId) {
    owned[getCapabilityId(CAPABILITY_TYPES.CHARACTER, characterId)] = true;
  });
  progress.unlockedPets.forEach(function(petId) {
    owned[getCapabilityId(CAPABILITY_TYPES.PET, petId)] = true;
  });
  progress.unlockedHeadTrails.forEach(function(trailId) {
    owned[getCapabilityId(CAPABILITY_TYPES.TRAIL_HEAD, trailId)] = true;
  });
  progress.unlockedTailTrails.forEach(function(trailId) {
    owned[getCapabilityId(CAPABILITY_TYPES.TRAIL_TAIL, trailId)] = true;
  });
  Object.keys(progress.itemInventory).forEach(function(itemId) {
    owned[getCapabilityId(CAPABILITY_TYPES.ITEM, itemId)] = Math.max(
      toCapabilityCount(owned[getCapabilityId(CAPABILITY_TYPES.ITEM, itemId)]),
      Math.max(0, Math.floor(progress.itemInventory[itemId] || 0))
    );
  });

  if (progress.selectedCharacterId) {
    equipped[EQUIP_SLOTS.character] = getCapabilityId(CAPABILITY_TYPES.CHARACTER, progress.selectedCharacterId);
  }
  if (progress.selectedPetId) {
    equipped[EQUIP_SLOTS.pet] = getCapabilityId(CAPABILITY_TYPES.PET, progress.selectedPetId);
  }
  if (progress.selectedHeadTrailId) {
    equipped[EQUIP_SLOTS.trail_head] = getCapabilityId(CAPABILITY_TYPES.TRAIL_HEAD, progress.selectedHeadTrailId);
  }
  if (progress.selectedTailTrailId) {
    equipped[EQUIP_SLOTS.trail_tail] = getCapabilityId(CAPABILITY_TYPES.TRAIL_TAIL, progress.selectedTailTrailId);
  }
  if (progress.equippedItemId) {
    equipped[EQUIP_SLOTS.item] = getCapabilityId(CAPABILITY_TYPES.ITEM, progress.equippedItemId);
  }

}

function normalizeCapabilityState(progress) {
  const owned = progress.ownedCapabilities;
  const equipped = progress.equippedCapabilities;
  const enabled = progress.enabledCapabilities;
  const all = getCapabilityCatalog();

  all.forEach(function(capability) {
    const capabilityId = capability.id;
    if (capability.unlockMode === 'consumable') {
      owned[capabilityId] = toCapabilityCount(owned[capabilityId]);
      if (capability.defaultOwned) {
        owned[capabilityId] = Math.max(1, owned[capabilityId]);
      }
    } else if (capability.defaultOwned) {
      owned[capabilityId] = true;
    } else {
      owned[capabilityId] = !!owned[capabilityId];
    }

    if (capability.equipMode === 'toggle') {
      if (capability.defaultOwned && owned[capabilityId] && typeof enabled[capabilityId] !== 'boolean') {
        enabled[capabilityId] = !!capability.defaultEquipped;
      } else if (!owned[capabilityId]) {
        enabled[capabilityId] = false;
      } else {
        enabled[capabilityId] = !!enabled[capabilityId];
      }
    }
  });

  Object.keys(EQUIP_SLOTS).forEach(function(slotKey) {
    const slotType = EQUIP_SLOTS[slotKey];
    const capabilityId = equipped[slotType] || null;
    if (!capabilityId || !isCapabilityOwned(progress, capabilityId)) {
      equipped[slotType] = null;
    }
  });

  const defaultCharacterCapabilityId = getCapabilityId(CAPABILITY_TYPES.CHARACTER, getDefaultCharacterId());
  if (!isCapabilityOwned(progress, defaultCharacterCapabilityId)) {
    owned[defaultCharacterCapabilityId] = true;
  }
  if (!equipped[EQUIP_SLOTS.character] || !isCapabilityOwned(progress, equipped[EQUIP_SLOTS.character])) {
    equipped[EQUIP_SLOTS.character] = defaultCharacterCapabilityId;
  }

  syncLegacyCapabilityFields(progress);
}

function syncLegacyCapabilityFields(progress) {
  progress.unlockedCharacters = getCapabilitiesByType(CAPABILITY_TYPES.CHARACTER)
    .filter(function(capability) { return isCapabilityOwned(progress, capability.id); })
    .map(function(capability) { return capability.entityId; });
  progress.selectedCharacterId = getEquippedCapabilityEntityId(progress, CAPABILITY_TYPES.CHARACTER);

  progress.unlockedPets = getCapabilitiesByType(CAPABILITY_TYPES.PET)
    .filter(function(capability) { return isCapabilityOwned(progress, capability.id); })
    .map(function(capability) { return capability.entityId; });
  progress.selectedPetId = getEquippedCapabilityEntityId(progress, CAPABILITY_TYPES.PET);

  progress.unlockedHeadTrails = getCapabilitiesByType(CAPABILITY_TYPES.TRAIL_HEAD)
    .filter(function(capability) { return isCapabilityOwned(progress, capability.id); })
    .map(function(capability) { return capability.entityId; });
  progress.selectedHeadTrailId = getEquippedCapabilityEntityId(progress, CAPABILITY_TYPES.TRAIL_HEAD);

  progress.unlockedTailTrails = getCapabilitiesByType(CAPABILITY_TYPES.TRAIL_TAIL)
    .filter(function(capability) { return isCapabilityOwned(progress, capability.id); })
    .map(function(capability) { return capability.entityId; });
  progress.selectedTailTrailId = getEquippedCapabilityEntityId(progress, CAPABILITY_TYPES.TRAIL_TAIL);

  progress.itemInventory = {};
  getCapabilitiesByType(CAPABILITY_TYPES.ITEM).forEach(function(capability) {
    progress.itemInventory[capability.entityId] = toCapabilityCount(progress.ownedCapabilities[capability.id]);
  });
  progress.equippedItemId = getEquippedCapabilityEntityId(progress, CAPABILITY_TYPES.ITEM);
}

function getCapabilityId(type, entityId) {
  return type + '_' + entityId;
}

function toCapabilityCount(value) {
  return Math.max(0, Math.floor(value || 0));
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
      kind: 'upgrade',
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

function getCharacterRows() {
  return tableManager.getAll('Character');
}

function getDefaultCharacterId() {
  const rows = getCharacterRows();
  return rows.length > 0 ? rows[0].JumpFolder : 'coach';
}

function getCharacterById(characterId) {
  const row = getCharacterRows().find(function(item) {
    return item.JumpFolder === characterId;
  });
  if (!row) return null;
  const meta = CHARACTER_META[characterId] || {};
  return {
    id: row.JumpFolder,
    name: row.Name,
    price: meta.price || 0,
    desc: meta.desc || '可切换的角色外观与轻差异体验。',
    bonuses: Object.assign({
      chargeMax: 0,
      moveSpeed: 0,
      playerCoinPickup: 0
    }, meta.bonuses || {})
  };
}

function getCharacterCatalog(progress) {
  const normalized = normalizeProgress(progress);
  return getCapabilitiesByType(CAPABILITY_TYPES.CHARACTER).map(function(capability) {
    const character = getCharacterById(capability.entityId);
    const unlocked = isCapabilityOwned(normalized, capability.id);
    const selected = isCapabilityEquipped(normalized, capability.id);
    return Object.assign({}, character, {
      kind: 'character',
      capabilityId: capability.id,
      unlocked: unlocked,
      selected: selected,
      affordable: !unlocked && normalized.coins >= character.price
    });
  });
}

function isCharacterUnlocked(progress, characterId) {
  return isCapabilityOwned(progress, getCapabilityId(CAPABILITY_TYPES.CHARACTER, characterId));
}

function purchaseCharacter(progress, characterId) {
  return purchaseCapability(progress, getCapabilityId(CAPABILITY_TYPES.CHARACTER, characterId));
}

function equipCharacter(progress, characterId) {
  return equipCapability(progress, getCapabilityId(CAPABILITY_TYPES.CHARACTER, characterId));
}

function getTrailById(type, trailId) {
  const list = type === 'head' ? HEAD_TRAIL_CATALOG : TAIL_TRAIL_CATALOG;
  return list.find(function(item) {
    return item.id === trailId;
  }) || null;
}

function getTrailCatalog(progress) {
  const normalized = normalizeProgress(progress);
  const entries = [];

  TAIL_TRAIL_CATALOG.forEach(function(item) {
    const capabilityId = getCapabilityId(CAPABILITY_TYPES.TRAIL_TAIL, item.id);
    entries.push({
      id: item.id,
      kind: 'tailTrail',
      capabilityId: capabilityId,
      name: item.name,
      desc: item.desc,
      price: item.price,
      unlocked: isCapabilityOwned(normalized, capabilityId),
      selected: isCapabilityEquipped(normalized, capabilityId),
      affordable: normalized.coins >= item.price
    });
  });

  HEAD_TRAIL_CATALOG.forEach(function(item) {
    const capabilityId = getCapabilityId(CAPABILITY_TYPES.TRAIL_HEAD, item.id);
    entries.push({
      id: item.id,
      kind: 'headTrail',
      capabilityId: capabilityId,
      name: item.name,
      desc: item.desc,
      price: item.price,
      unlocked: isCapabilityOwned(normalized, capabilityId),
      selected: isCapabilityEquipped(normalized, capabilityId),
      affordable: normalized.coins >= item.price
    });
  });

  const level = normalized.trailLengthLevel;
  const cost = getTrailLengthCost(level);
  entries.push({
    id: 'trail_length',
    kind: 'trailLength',
    name: '拖尾长度',
    desc: '提升拖尾长度与读图反馈。',
    level: level,
    maxLevel: TRAIL_LENGTH_CONFIG.maxLevel,
    cost: cost,
    affordable: cost > 0 && normalized.coins >= cost,
    currentEffect: getTrailLengthMultiplier(level),
    nextEffect: getTrailLengthMultiplier(level + 1),
    isMaxLevel: level >= TRAIL_LENGTH_CONFIG.maxLevel
  });

  return entries;
}

function purchaseTrail(progress, type, trailId) {
  const capabilityType = type === 'head' ? CAPABILITY_TYPES.TRAIL_HEAD : CAPABILITY_TYPES.TRAIL_TAIL;
  return purchaseCapability(progress, getCapabilityId(capabilityType, trailId));
}

function equipTrail(progress, type, trailId) {
  const capabilityType = type === 'head' ? CAPABILITY_TYPES.TRAIL_HEAD : CAPABILITY_TYPES.TRAIL_TAIL;
  return equipCapability(progress, getCapabilityId(capabilityType, trailId));
}

function getTrailLengthCost(level) {
  if (level >= TRAIL_LENGTH_CONFIG.maxLevel) return 0;
  return Math.floor(TRAIL_LENGTH_CONFIG.baseCost * Math.pow(TRAIL_LENGTH_CONFIG.growth, level));
}

function getTrailLengthMultiplier(level) {
  const safeLevel = Math.max(0, Math.min(TRAIL_LENGTH_CONFIG.maxLevel, level || 0));
  return 1 + safeLevel * TRAIL_LENGTH_CONFIG.effectPerLevel;
}

function purchaseTrailLength(progress) {
  const normalized = normalizeProgress(progress);
  if (normalized.trailLengthLevel >= TRAIL_LENGTH_CONFIG.maxLevel) {
    return { success: false, reason: 'max', message: '拖尾长度已满级' };
  }
  const cost = getTrailLengthCost(normalized.trailLengthLevel);
  if (normalized.coins < cost) {
    return { success: false, reason: 'coins', message: '金币不足' };
  }

  normalized.coins -= cost;
  normalized.trailLengthLevel += 1;
  saveProgress(normalized);
  return {
    success: true,
    progress: normalized,
    message: '拖尾长度提升到 Lv.' + normalized.trailLengthLevel
  };
}

function getPetById(petId) {
  return PET_CATALOG.find(function(item) {
    return item.id === petId;
  }) || null;
}

function getPetCatalog(progress) {
  const normalized = normalizeProgress(progress);
  return getCapabilitiesByType(CAPABILITY_TYPES.PET).map(function(capability) {
    const item = getPetById(capability.entityId);
    const unlocked = isCapabilityOwned(normalized, capability.id);
    const selected = isCapabilityEquipped(normalized, capability.id);
    return {
      id: item.id,
      kind: 'pet',
      capabilityId: capability.id,
      name: item.name,
      desc: item.desc,
      price: item.price,
      unlocked: unlocked,
      selected: selected,
      affordable: !unlocked && normalized.coins >= item.price
    };
  });
}

function purchasePet(progress, petId) {
  return purchaseCapability(progress, getCapabilityId(CAPABILITY_TYPES.PET, petId));
}

function equipPet(progress, petId) {
  const normalized = normalizeProgress(progress);
  const capabilityId = getCapabilityId(CAPABILITY_TYPES.PET, petId);
  if (isCapabilityEquipped(normalized, capabilityId)) {
    return unequipCapability(normalized, CAPABILITY_TYPES.PET);
  }
  return equipCapability(normalized, capabilityId);
}

function getItemById(itemId) {
  return ITEM_CATALOG.find(function(item) {
    return item.id === itemId;
  }) || null;
}

function getItemCatalog(progress) {
  const normalized = normalizeProgress(progress);
  return getCapabilitiesByType(CAPABILITY_TYPES.ITEM).map(function(capability) {
    const item = getItemById(capability.entityId);
    const count = toCapabilityCount(normalized.ownedCapabilities[capability.id]);
    return {
      id: item.id,
      kind: 'item',
      capabilityId: capability.id,
      name: item.name,
      desc: item.desc,
      price: item.price,
      count: count,
      selected: isCapabilityEquipped(normalized, capability.id),
      affordable: normalized.coins >= item.price
    };
  });
}

function purchaseItem(progress, itemId) {
  return purchaseCapability(progress, getCapabilityId(CAPABILITY_TYPES.ITEM, itemId));
}

function equipItem(progress, itemId) {
  const normalized = normalizeProgress(progress);
  const capabilityId = getCapabilityId(CAPABILITY_TYPES.ITEM, itemId);
  if (!isCapabilityOwned(normalized, capabilityId)) {
    return { success: false, reason: 'inventory', message: '道具库存不足' };
  }
  if (isCapabilityEquipped(normalized, capabilityId)) {
    return unequipCapability(normalized, CAPABILITY_TYPES.ITEM);
  }
  return equipCapability(normalized, capabilityId);
}

function consumeEquippedItem(progress) {
  const normalized = normalizeProgress(progress);
  const capabilityId = normalized.equippedCapabilities[CAPABILITY_TYPES.ITEM];
  const equippedCapability = getCapabilityById(capabilityId);
  const item = equippedCapability ? getItemById(equippedCapability.entityId) : null;
  if (!item) {
    return {
      progress: normalized,
      itemId: null,
      itemName: '',
      effects: {}
    };
  }

  const currentCount = toCapabilityCount(normalized.ownedCapabilities[capabilityId]);
  if (currentCount <= 0) {
    normalized.equippedCapabilities[CAPABILITY_TYPES.ITEM] = null;
    syncLegacyCapabilityFields(normalized);
    saveProgress(normalized);
    return {
      progress: normalized,
      itemId: null,
      itemName: '',
      effects: {}
    };
  }

  normalized.ownedCapabilities[capabilityId] = currentCount - 1;
  if (normalized.ownedCapabilities[capabilityId] <= 0) {
    normalized.equippedCapabilities[CAPABILITY_TYPES.ITEM] = null;
  }
  syncLegacyCapabilityFields(normalized);
  saveProgress(normalized);

  return {
    progress: normalized,
    itemId: item.id,
    itemName: item.name,
    effects: Object.assign({}, item.runEffects)
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

function getSkillCatalog(progress) {
  const normalized = normalizeProgress(progress);
  return getCapabilitiesByType(CAPABILITY_TYPES.SKILL).map(function(capability) {
    const owned = isCapabilityOwned(normalized, capability.id);
    const enabled = isCapabilityEnabled(normalized, capability.id);
    return {
      id: capability.entityId,
      capabilityId: capability.id,
      kind: 'skill',
      name: capability.name,
      desc: capability.desc,
      price: capability.price,
      unlocked: owned,
      enabled: enabled,
      affordable: !owned && normalized.coins >= capability.price
    };
  });
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

function applyCapabilitiesToGame(game, progress) {
  const normalized = normalizeProgress(progress);
  const character = getCharacterById(getEquippedCapabilityEntityId(normalized, CAPABILITY_TYPES.CHARACTER)) || getCharacterById(getDefaultCharacterId());
  const pet = getPetById(getEquippedCapabilityEntityId(normalized, CAPABILITY_TYPES.PET));
  const tailTrail = getTrailById('tail', getEquippedCapabilityEntityId(normalized, CAPABILITY_TYPES.TRAIL_TAIL));
  const headTrail = getTrailById('head', getEquippedCapabilityEntityId(normalized, CAPABILITY_TYPES.TRAIL_HEAD));
  const trailLengthMultiplier = getTrailLengthMultiplier(normalized.trailLengthLevel);

  game.skillAvailability = {
    doubleJump: canUseCapability(normalized, getCapabilityId(CAPABILITY_TYPES.SKILL, 'double_jump')),
    chargeOnJump: canUseCapability(normalized, getCapabilityId(CAPABILITY_TYPES.SKILL, 'charge_on_jump')),
    slideFall: canUseCapability(normalized, getCapabilityId(CAPABILITY_TYPES.SKILL, 'slide_fall')),
    chargeDash: canUseCapability(normalized, getCapabilityId(CAPABILITY_TYPES.SKILL, 'charge_dash'))
  };
  game.doubleJumpUnlocked = game.skillAvailability.doubleJump;

  const trailConfig = JSON.parse(JSON.stringify(baseTrailConfig));
  trailConfig.enabled = !!tailTrail;
  trailConfig.headRibbon.enabled = !!headTrail;
  trailConfig.width = baseTrailConfig.width * trailLengthMultiplier;
  trailConfig.baseSegmentLength = baseTrailConfig.baseSegmentLength * trailLengthMultiplier;
  trailConfig.minSegmentLength = baseTrailConfig.minSegmentLength * trailLengthMultiplier;
  trailConfig.maxSegmentLength = baseTrailConfig.maxSegmentLength * trailLengthMultiplier;
  trailConfig.shadowBlur = baseTrailConfig.shadowBlur * 1.05;
  if (!tailTrail) {
    trailConfig.width = 0;
    trailConfig.ionParticleCount = 0;
  }
  if (!headTrail) {
    trailConfig.headRibbon.width = 0;
    trailConfig.headRibbon.ionParticleCount = 0;
  }
  if (tailTrail) {
    trailConfig.bodyColors = tailTrail.colors;
    trailConfig.shadowColor = tailTrail.shadowColor;
    trailConfig.ionColor = tailTrail.ionColor;
  }
  if (headTrail) {
    trailConfig.headRibbon.bodyColors = headTrail.colors;
    trailConfig.headRibbon.shadowColor = headTrail.shadowColor;
    trailConfig.headRibbon.ionColor = headTrail.ionColor;
  }
  trailEffects.setTrailConfig(trailConfig);

  const petStyle = pet ? pet.style : {};
  petSystem.setPetConfig({
    radius: basePetConfig.radius * (pet && pet.bonuses ? pet.bonuses.radiusScale : 1),
    glowRadius: basePetConfig.glowRadius * (pet && pet.bonuses ? pet.bonuses.glowScale : 1),
    trailWidth: basePetConfig.trailWidth * (pet && pet.bonuses ? pet.bonuses.radiusScale : 1),
    shadowBlur: basePetConfig.shadowBlur * (pet && pet.bonuses ? pet.bonuses.glowScale : 1),
    coreColor: petStyle.coreColor || basePetConfig.coreColor,
    midColor: petStyle.midColor || basePetConfig.midColor,
    outerColor: petStyle.outerColor || basePetConfig.outerColor,
    trailHeadColor: petStyle.trailHeadColor || basePetConfig.trailHeadColor,
    trailMidColor: petStyle.trailMidColor || basePetConfig.trailMidColor,
    trailTailColor: petStyle.trailTailColor || basePetConfig.trailTailColor
  });

  return {
    character: character,
    pet: pet,
    tailTrail: tailTrail,
    headTrail: headTrail,
    trailLengthMultiplier: trailLengthMultiplier
  };
}

function applyUpgradesToGame(game, progress) {
  const normalized = normalizeProgress(progress);
  const bonuses = getAppliedBonuses(normalized);
  const appliedCapabilities = applyCapabilitiesToGame(game, normalized);
  const character = appliedCapabilities.character;
  const pet = appliedCapabilities.pet;

  game.progression = normalized;
  game.PLAYER_SPEED = game.baseStats.PLAYER_SPEED + bonuses.moveSpeed + (character.bonuses.moveSpeed || 0);
  game.JUMP_FORCE = game.baseStats.JUMP_FORCE - bonuses.jumpForce;
  game.BOOST_JUMP_FORCE = game.baseStats.BOOST_JUMP_FORCE - bonuses.jumpForce;
  game.DOUBLE_JUMP_FORCE = game.baseStats.DOUBLE_JUMP_FORCE - bonuses.jumpForce * 0.75;
  game.chargeMax = game.baseStats.CHARGE_MAX + bonuses.chargeMax + (character.bonuses.chargeMax || 0);
  game.growthScale = game.baseStats.growthScale + bonuses.growthScale;
  game.growthLaunchScale = bonuses.growthLaunchScale;
  game.playerCoinPickupBonus = bonuses.playerCoinPickup + (character.bonuses.playerCoinPickup || 0);
  game.petCoinPickupBonus = bonuses.petCoinPickup + (pet && pet.bonuses ? pet.bonuses.pickupRadius : 0);
  game.petSeekRadiusBonus = pet && pet.bonuses ? pet.bonuses.seekRadius : 0;
  game.growthDurationMs = BASE_GROWTH_DURATION_MS + bonuses.growthDuration;

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
    playerCoinPickup: Math.round(getUpgradeEffectById(normalized, 'player_coin_radius')),
    petCoinPickup: Math.round(getUpgradeEffectById(normalized, 'pet_coin_radius')),
    growthDuration: Math.round(getUpgradeEffectById(normalized, 'mushroom_duration'))
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
    case 'player_coin_radius':
      return '人物吸币 +' + Math.round(effectValue);
    case 'pet_coin_radius':
      return '宠物拾币 +' + Math.round(effectValue);
    case 'mushroom_duration':
      return '蘑菇时长 +' + Math.round(effectValue / 1000) + 's';
    default:
      return String(effectValue);
  }
}

function getShopTabs() {
  return SHOP_TABS.slice();
}

function getShopCatalogByTab(progress, tabId) {
  switch (tabId) {
    case 'skills':
      return getSkillCatalog(progress);
    case 'characters':
      return getCharacterCatalog(progress);
    case 'trails':
      return getTrailCatalog(progress);
    case 'pets':
      return getPetCatalog(progress);
    case 'items':
      return getItemCatalog(progress);
    case 'upgrades':
    default:
      return getUpgradeCatalog(progress);
  }
}

function getSelectedCharacterId(progress) {
  return normalizeProgress(progress).selectedCharacterId;
}

function getSelectedPetId(progress) {
  return normalizeProgress(progress).selectedPetId;
}

// ==================== 成就系统相关 ====================

const achievementSystem = require('../achievement/achievementSystem');

/**
 * 更新游戏结束时的统计信息并检查成就
 * @param {Object} progress - 当前进度
 * @param {Object} runSummary - 跑图总结 { score, combo, coinsCollected }
 * @returns {Object} { progress, unlocks }
 */
function updateRunStats(progress, runSummary) {
  const normalized = normalizeProgress(progress);
  const summary = runSummary || {};

  // 更新统计
  normalized.achievementStats.totalRuns += 1;
  if (summary.score && summary.score > normalized.achievementStats.highestScore) {
    normalized.achievementStats.highestScore = summary.score;
  }
  if (summary.combo && summary.combo > normalized.achievementStats.highestCombo) {
    normalized.achievementStats.highestCombo = summary.combo;
  }
  if (summary.coinsCollected) {
    normalized.achievementStats.totalCoinsCollected += summary.coinsCollected;
  }

  // 检查成就
  const unlocks = checkAndUnlockAchievementsInternal(normalized, ['height', 'combo', 'score', 'runs', 'coins_collected']);

  saveProgress(normalized);
  return { progress: normalized, unlocks };
}

/**
 * 累加收集的金币（不奖励，只统计）
 */
function addCoinsCollected(progress, amount) {
  const normalized = normalizeProgress(progress);
  const coins = Math.max(0, Math.floor(amount || 0));
  if (coins > 0) {
    normalized.achievementStats.totalCoinsCollected += coins;
    saveProgress(normalized);
  }
  return normalized;
}

/**
 * 记录完美落地
 */
function recordPerfectLanding(progress) {
  const normalized = normalizeProgress(progress);
  normalized.achievementStats.perfectPlatforms += 1;
  saveProgress(normalized);
  return { progress: normalized };
}

/**
 * 检查成就解锁（内部）
 */
function checkAndUnlockAchievementsInternal(progress, types) {
  const unlocks = [];
  const achievements = achievementSystem.getAllAchievements();

  for (const achievement of achievements) {
    if (progress.achievements && progress.achievements[achievement.Key]) {
      continue;
    }
    if (types && types.length > 0 && !types.includes(achievement.Type)) {
      continue;
    }

    if (achievementSystem.checkAchievement(achievement, progress)) {
      const title = achievementSystem.getTitleById(achievement.TitleId);
      progress.achievements[achievement.Key] = {
        unlocked: true,
        unlockedAt: Date.now(),
        titleId: achievement.TitleId
      };

      unlocks.push({
        achievement: achievement,
        title: title,
        message: achievementSystem.formatUnlockMessage(achievement, title)
      });
    }
  }

  return unlocks;
}

/**
 * 获取当前称号
 */
function getCurrentTitle(progress) {
  return achievementSystem.getCurrentTitle(progress);
}

module.exports = {
  STORAGE_KEY,
  BASE_GROWTH_DURATION_MS,
  getDefaultProgress,
  loadProgress,
  saveProgress,
  resetProgress,
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
  updateRunStats,
  addCoinsCollected,
  recordPerfectLanding,
  getCurrentTitle,
  applyUpgradesToGame,
  applyCapabilitiesToGame,
  getCapabilityCatalog,
  getCapabilityById,
  getCapabilitiesByType,
  isCapabilityOwned,
  isCapabilityEquipped,
  isCapabilityEnabled,
  canUseCapability,
  purchaseCapability,
  equipCapability,
  unequipCapability,
  toggleCapability,
  getShopTabs,
  getShopCatalogByTab,
  getSelectedCharacterId,
  getSelectedPetId,
  getSkillCatalog,
  getCharacterCatalog,
  isCharacterUnlocked,
  purchaseCharacter,
  equipCharacter,
  getTrailCatalog,
  purchaseTrail,
  equipTrail,
  purchaseTrailLength,
  getPetCatalog,
  purchasePet,
  equipPet,
  getItemCatalog,
  purchaseItem,
  equipItem,
  consumeEquippedItem
};
