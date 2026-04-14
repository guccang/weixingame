const OPTION_DEFINITIONS = {
  bossMode: {
    label: 'Boss',
    values: ['normal', 'off', 'top_only', 'bottom_only'],
    labels: {
      normal: '正常',
      off: '关闭',
      top_only: '仅上方Boss',
      bottom_only: '仅下方Boss'
    }
  },
  pickupMode: {
    label: '道具',
    values: ['normal', 'off', 'positive_only', 'negative_only', 'boss_only', 'platform_only'],
    labels: {
      normal: '正常',
      off: '关闭',
      positive_only: '仅正面',
      negative_only: '仅负面',
      boss_only: '仅Boss投放',
      platform_only: '仅平台挂载'
    }
  },
  runDirectorMode: {
    label: '事件',
    values: ['normal', 'off', 'buffs_only', 'goals_only', 'themes_only'],
    labels: {
      normal: '全部',
      off: '关闭',
      buffs_only: '仅增益',
      goals_only: '仅目标',
      themes_only: '仅主题'
    }
  },
  platformMode: {
    label: '平台',
    values: ['normal', 'off', 'charge_only', 'resonance_only', 'risk_only', 'moving_only'],
    labels: {
      normal: '正常',
      off: '基础平台',
      charge_only: '仅充能',
      resonance_only: '仅共鸣',
      risk_only: '仅风险',
      moving_only: '仅移动'
    }
  },
  difficultyMode: {
    label: '难度',
    values: ['normal', 'frozen'],
    labels: {
      normal: '正常',
      frozen: '冻结'
    }
  },
  startHeight: {
    label: '起始高度',
    values: [0, 300, 600, 1000, 1500, 3000, 5000],
    labels: {
      0: '0m',
      300: '300m',
      600: '600m',
      1000: '1000m',
      1500: '1500m',
      3000: '3000m',
      5000: '5000m'
    }
  },
  initialChargeMode: {
    label: '初始蓄力',
    values: ['empty', 'half', 'full'],
    labels: {
      empty: '空',
      half: '半格',
      full: '满格'
    }
  },
  bossSpawnMode: {
    label: 'Boss刷新',
    values: ['normal', 'immediate'],
    labels: {
      normal: '按高度',
      immediate: '立即'
    }
  }
};

const OPTION_KEYS = Object.keys(OPTION_DEFINITIONS);

function sanitizeOptionValue(key, value) {
  const definition = OPTION_DEFINITIONS[key];
  if (!definition) return value;
  const fallback = definition.values[0];
  return definition.values.indexOf(value) !== -1 ? value : fallback;
}

function normalizePresetRow(row) {
  return {
    id: String(row.PresetId || row.Name || row.Id || ''),
    name: String(row.Name || 'Debug预设'),
    description: String(row.Description || ''),
    notes: String(row.Notes || ''),
    bossMode: sanitizeOptionValue('bossMode', row.BossMode),
    pickupMode: sanitizeOptionValue('pickupMode', row.PickupMode),
    runDirectorMode: sanitizeOptionValue('runDirectorMode', row.RunDirectorMode),
    platformMode: sanitizeOptionValue('platformMode', row.PlatformMode),
    difficultyMode: sanitizeOptionValue('difficultyMode', row.DifficultyMode),
    startHeight: sanitizeOptionValue('startHeight', row.StartHeight),
    initialChargeMode: sanitizeOptionValue('initialChargeMode', row.InitialChargeMode),
    bossSpawnMode: sanitizeOptionValue('bossSpawnMode', row.BossSpawnMode)
  };
}

function normalizeDebugConfig(rows) {
  const presets = (rows || []).map(normalizePresetRow).filter(function(preset) {
    return !!preset.id;
  });
  return {
    presets: presets,
    defaultPresetId: presets.length > 0 ? presets[0].id : ''
  };
}

function getOptionDefinition(key) {
  return OPTION_DEFINITIONS[key] || null;
}

function getOptionLabel(key, value) {
  const definition = getOptionDefinition(key);
  if (!definition) return String(value || '');
  return definition.labels[value] || String(value || '');
}

function getPresetById(config, presetId) {
  if (!config || !config.presets || config.presets.length === 0) return null;
  const matched = config.presets.find(function(preset) {
    return preset.id === presetId;
  });
  return matched || config.presets[0];
}

function getPresetList(config, presetIds) {
  if (!config || !Array.isArray(config.presets) || config.presets.length === 0) return [];

  if (Array.isArray(presetIds)) {
    const normalizedIds = presetIds.filter(function(presetId) { return !!presetId; });
    if (normalizedIds.length === 0) {
      return [];
    }

    const resolved = [];
    for (let i = 0; i < normalizedIds.length; i++) {
      const preset = getPresetById(config, normalizedIds[i]);
      if (preset && resolved.indexOf(preset) === -1) {
        resolved.push(preset);
      }
    }
    return resolved;
  }

  const normalizedIds = presetIds ? [presetIds] : [];
  const resolved = [];

  for (let i = 0; i < normalizedIds.length; i++) {
    const preset = getPresetById(config, normalizedIds[i]);
    if (preset && resolved.indexOf(preset) === -1) {
      resolved.push(preset);
    }
  }

  if (resolved.length > 0) {
    return resolved;
  }

  return config.presets[0] ? [config.presets[0]] : [];
}

function buildDebugProfile(config, presetIds, overrides) {
  const presets = getPresetList(config, presetIds);
  if (presets.length === 0) return null;
  const basePreset = presets[presets.length - 1];

  const profile = {
    enabled: true,
    presetId: basePreset.id,
    presetIds: presets.map(function(preset) { return preset.id; }),
    presetName: basePreset.name,
    presetNames: presets.map(function(preset) { return preset.name; }),
    presetDescription: basePreset.description,
    presetDescriptions: presets.map(function(preset) { return preset.description; }).filter(function(text) {
      return !!text;
    }),
    overrides: {}
  };

  for (let i = 0; i < OPTION_KEYS.length; i++) {
    const key = OPTION_KEYS[i];
    const presetValue = basePreset[key];
    const overrideValue = overrides && overrides[key] !== undefined ? overrides[key] : presetValue;
    const finalValue = sanitizeOptionValue(key, overrideValue);
    profile[key] = finalValue;
    if (finalValue !== presetValue) {
      profile.overrides[key] = finalValue;
    }
  }

  profile.isCustom = Object.keys(profile.overrides).length > 0;
  return profile;
}

function cloneProfile(profile) {
  if (!profile) return null;
  return Object.assign({}, profile, {
    overrides: Object.assign({}, profile.overrides || {})
  });
}

function isDebugProfileEnabled(profile) {
  return !!(profile && profile.enabled);
}

function allowsBossBehavior(profile, behaviorType) {
  if (!isDebugProfileEnabled(profile)) return true;
  switch (profile.bossMode) {
    case 'off':
      return false;
    case 'top_only':
      return behaviorType === 'thrower';
    case 'bottom_only':
      return behaviorType === 'leaper';
    default:
      return true;
  }
}

function filterBossPool(pool, profile) {
  if (!Array.isArray(pool)) return [];
  return pool.filter(function(entry) {
    return allowsBossBehavior(profile, entry && entry.behaviorType ? entry.behaviorType : 'leaper');
  });
}

function allowsPickupSource(profile, sourceType) {
  if (!isDebugProfileEnabled(profile)) return true;
  switch (profile.pickupMode) {
    case 'off':
      return false;
    case 'boss_only':
      return sourceType === 'bossProjectile';
    case 'platform_only':
      return sourceType === 'platform';
    default:
      return true;
  }
}

function allowsPickupPolarity(profile, negative) {
  if (!isDebugProfileEnabled(profile)) return true;
  switch (profile.pickupMode) {
    case 'positive_only':
      return !negative;
    case 'negative_only':
      return !!negative;
    default:
      return true;
  }
}

function allowsPickup(profile, sourceType, negative) {
  return allowsPickupSource(profile, sourceType) && allowsPickupPolarity(profile, negative);
}

function allowsRunDirectorFeature(profile, feature) {
  if (!isDebugProfileEnabled(profile)) return true;

  switch (profile.runDirectorMode) {
    case 'off':
      return false;
    case 'buffs_only':
      return feature === 'buffs';
    case 'goals_only':
      return feature === 'goals';
    case 'themes_only':
      return feature === 'themes';
    default:
      return true;
  }
}

function resolvePlatformBaseType(profile, fallbackType) {
  if (!isDebugProfileEnabled(profile)) return fallbackType;

  switch (profile.platformMode) {
    case 'off':
      return 'normal';
    case 'moving_only':
      return 'moving';
    case 'charge_only':
    case 'resonance_only':
    case 'risk_only':
      return 'normal';
    default:
      return fallbackType;
  }
}

function allowsPlatformSpecial(profile, specialType) {
  if (!isDebugProfileEnabled(profile)) return true;

  switch (profile.platformMode) {
    case 'off':
    case 'moving_only':
      return false;
    case 'charge_only':
      return specialType === 'charge';
    case 'resonance_only':
      return specialType === 'resonance';
    case 'risk_only':
      return specialType === 'risk';
    default:
      return true;
  }
}

function isDifficultyFrozen(profile) {
  return isDebugProfileEnabled(profile) && profile.difficultyMode === 'frozen';
}

function resolveInitialChargeCount(profile, chargeMax) {
  const safeChargeMax = Math.max(1, Math.round(chargeMax || 1));
  const mode = profile && profile.initialChargeMode ? profile.initialChargeMode : 'empty';
  if (mode === 'full') {
    return safeChargeMax;
  }
  if (mode === 'half') {
    return Math.max(1, Math.floor(safeChargeMax / 2));
  }
  return 0;
}

module.exports = {
  OPTION_DEFINITIONS,
  OPTION_KEYS,
  normalizeDebugConfig,
  getOptionDefinition,
  getOptionLabel,
  getPresetById,
  getPresetList,
  buildDebugProfile,
  cloneProfile,
  isDebugProfileEnabled,
  allowsBossBehavior,
  filterBossPool,
  allowsPickupSource,
  allowsPickupPolarity,
  allowsPickup,
  allowsRunDirectorFeature,
  resolvePlatformBaseType,
  allowsPlatformSpecial,
  isDifficultyFrozen,
  resolveInitialChargeCount
};
