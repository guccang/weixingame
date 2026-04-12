const gameConstants = require('../constants');
const { platform: platformPhysics } = require('../../physics/physics');

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function isScaleKey(key) {
  return key.indexOf('Scale') !== -1 || key.indexOf('Multiplier') !== -1;
}

function pickRandom(list) {
  if (!list || list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

class PickupSystem {
  constructor(game) {
    this.game = game;
    this.reset();
  }

  getConfig() {
    return gameConstants.pickupConfig;
  }

  getThrowerConfig() {
    return gameConstants.bossConfig.thrower || {};
  }

  reset() {
    this.activeEffects = {};
    this.floatingPickups = [];
    this.lastUpdateAt = 0;
    if (this.game) {
      this.game.runPickupEffects = {};
    }
  }

  getDefinitions() {
    const config = this.getConfig();
    return [
      {
        id: 'swift_wind',
        name: '顺风靴',
        shortName: '顺风',
        negative: false,
        color: '#55efc4',
        accentColor: '#dffaf2',
        symbol: '速',
        durationMs: config.durations.swiftWind,
        effects: Object.assign({}, config.effects.swiftWind)
      },
      {
        id: 'feather_fall',
        name: '轻羽披风',
        shortName: '轻羽',
        negative: false,
        color: '#74b9ff',
        accentColor: '#e5f3ff',
        symbol: '缓',
        durationMs: config.durations.featherFall,
        effects: Object.assign({}, config.effects.featherFall)
      },
      {
        id: 'dash_fuel',
        name: '冲刺燃料',
        shortName: '推进',
        negative: false,
        color: '#fd79a8',
        accentColor: '#ffe2ee',
        symbol: '冲',
        durationMs: config.durations.dashFuel,
        effects: Object.assign({}, config.effects.dashFuel)
      },
      {
        id: 'golden_touch',
        name: '聚财核心',
        shortName: '聚财',
        negative: false,
        color: '#ffd166',
        accentColor: '#fff4cf',
        symbol: '金',
        durationMs: config.durations.goldenTouch,
        effects: Object.assign({}, config.effects.goldenTouch)
      },
      {
        id: 'sticky_boots',
        name: '黏靴',
        shortName: '黏靴',
        negative: true,
        color: '#ff7675',
        accentColor: '#ffe3e2',
        symbol: '黏',
        durationMs: config.durations.stickyBoots,
        effects: Object.assign({}, config.effects.stickyBoots)
      },
      {
        id: 'heavy_core',
        name: '重压核',
        shortName: '重压',
        negative: true,
        color: '#ff9f1a',
        accentColor: '#ffe9c9',
        symbol: '沉',
        durationMs: config.durations.heavyCore,
        effects: Object.assign({}, config.effects.heavyCore)
      },
      {
        id: 'slow_field',
        name: '乱流场',
        shortName: '乱流',
        negative: true,
        color: '#ff6b6b',
        accentColor: '#ffe0e0',
        symbol: '乱',
        durationMs: config.durations.slowField,
        effects: Object.assign({}, config.effects.slowField)
      },
      {
        id: 'short_fuse',
        name: '短路芯片',
        shortName: '短路',
        negative: true,
        color: '#f08a5d',
        accentColor: '#ffe7dc',
        symbol: '断',
        durationMs: config.durations.shortFuse,
        effects: Object.assign({}, config.effects.shortFuse)
      }
    ];
  }

  getDefinitionById(id) {
    const definitions = this.getDefinitions();
    for (let i = 0; i < definitions.length; i++) {
      if (definitions[i].id === id) return definitions[i];
    }
    return null;
  }

  getDefinitionPool(negative) {
    return this.getDefinitions().filter(function(definition) {
      return !!definition.negative === !!negative;
    });
  }

  getFloatingPickups() {
    return this.floatingPickups;
  }

  decoratePlatform(platform, scoreHeight) {
    if (!platform || platform.type === 'ground' || platform.dead) return platform;

    platform.pickup = null;

    const definition = this.resolveSpawnDefinition(platform, scoreHeight);
    if (!definition) {
      return platform;
    }

    platform.pickup = this.createPlatformPickup(platform, definition);
    return platform;
  }

  resolveSpawnDefinition(platform, scoreHeight) {
    const config = this.getConfig();
    const score = Math.max(0, scoreHeight || 0);

    if (score < Math.max(0, config.spawnStartHeight || 0)) {
      return null;
    }

    let positiveChance = score >= config.negativeStartHeight
      ? config.positiveChanceHigh
      : config.positiveChanceLow;
    let negativeChance = score >= config.negativeStartHeight
      ? config.negativeChanceHigh
      : 0;

    let modifier = 0;
    if (platform.type === 'moving') {
      modifier += config.platformBonuses.moving;
    }
    if (platform.specialType === 'risk') {
      modifier += config.platformBonuses.risk;
    }
    if (platform.specialType === 'charge') {
      modifier -= config.platformPenalties.charge;
    }
    if (platform.specialType === 'resonance') {
      modifier -= config.platformPenalties.resonance;
    }

    positiveChance = clamp(positiveChance + modifier, 0, 0.8);
    negativeChance = clamp(negativeChance + modifier, 0, 0.45);

    const totalChance = clamp(positiveChance + negativeChance, 0, 0.9);
    if (totalChance <= 0 || Math.random() >= totalChance) {
      return null;
    }

    const negativeWeight = negativeChance > 0 ? negativeChance / Math.max(totalChance, 0.0001) : 0;
    const useNegative = negativeWeight > 0 && Math.random() < negativeWeight;
    return pickRandom(this.getDefinitionPool(useNegative));
  }

  resolveBossProjectileDefinition() {
    const throwerConfig = this.getThrowerConfig();
    const pickupConfig = this.getConfig();
    const score = Math.max(0, this.game && this.game.score || 0);
    const positiveWeight = Math.max(0, throwerConfig.positiveWeight || 0);
    const negativeWeight = score >= pickupConfig.negativeStartHeight
      ? Math.max(0, throwerConfig.negativeWeight || 0)
      : 0;
    const totalWeight = positiveWeight + negativeWeight;

    if (totalWeight <= 0) {
      return pickRandom(this.getDefinitionPool(false));
    }

    const useNegative = negativeWeight > 0 && Math.random() < negativeWeight / totalWeight;
    return pickRandom(this.getDefinitionPool(useNegative));
  }

  createBasePickup(definition) {
    return {
      id: definition.id + '_' + Math.floor(Math.random() * 1000000),
      definitionId: definition.id,
      name: definition.name,
      shortName: definition.shortName,
      negative: definition.negative,
      color: definition.color,
      accentColor: definition.accentColor,
      symbol: definition.symbol,
      durationMs: definition.durationMs,
      effects: Object.assign({}, definition.effects),
      radius: definition.negative ? 13 : 12,
      floatPhase: Math.random() * Math.PI * 2,
      collected: false
    };
  }

  createPlatformPickup(platform, definition) {
    const edgePadding = Math.min(20, Math.max(14, platform.w * 0.18));
    const usableWidth = Math.max(10, platform.w - edgePadding * 2);
    const xOffset = edgePadding + Math.random() * usableWidth;

    return Object.assign(this.createBasePickup(definition), {
      sourceType: 'platform',
      xOffset: xOffset,
      yOffset: -28 - Math.random() * 10,
      platform: platform
    });
  }

  createProjectilePickup(definition, spawnX, spawnY, options) {
    const throwerConfig = this.getThrowerConfig();
    const driftBase = throwerConfig.projectileDriftX || 0.18;
    const driftDirection = options && typeof options.driftDirection === 'number'
      ? options.driftDirection
      : (Math.random() < 0.5 ? -1 : 1);
    const driftScale = options && typeof options.driftScale === 'number'
      ? options.driftScale
      : (0.65 + Math.random() * 0.5);
    const fallSpeed = options && typeof options.fallSpeed === 'number'
      ? options.fallSpeed
      : (throwerConfig.projectileFallSpeed || 1.15);
    const swayAmplitude = options && typeof options.swayAmplitude === 'number'
      ? options.swayAmplitude
      : (throwerConfig.projectileSwayAmplitude || 12);
    const swaySpeed = options && typeof options.swaySpeed === 'number'
      ? options.swaySpeed
      : (throwerConfig.projectileSwaySpeed || 0.0045);
    const now = options && typeof options.now === 'number' ? options.now : Date.now();

    return Object.assign(this.createBasePickup(definition), {
      sourceType: 'bossProjectile',
      x: spawnX,
      y: spawnY,
      baseX: spawnX,
      vx: driftDirection * driftBase * driftScale,
      vy: fallSpeed * (0.88 + Math.random() * 0.24),
      swayAmplitude: swayAmplitude * (0.75 + Math.random() * 0.45),
      swaySpeed: swaySpeed * (0.85 + Math.random() * 0.3),
      spawnTime: now,
      maxLifetimeMs: 12000
    });
  }

  spawnBossProjectilePickup(spawnX, spawnY, options = {}) {
    const definition = options.definitionId
      ? this.getDefinitionById(options.definitionId)
      : this.resolveBossProjectileDefinition();
    if (!definition) return null;

    const pickup = this.createProjectilePickup(definition, spawnX, spawnY, options);
    this.floatingPickups.push(pickup);
    return pickup;
  }

  getPickupPosition(pickup, now) {
    if (pickup.sourceType === 'bossProjectile') {
      return {
        x: pickup.x,
        y: pickup.y
      };
    }

    return {
      x: platformPhysics.getMovingPlatformX(pickup.platform, now) + pickup.xOffset,
      y: pickup.platform.y + pickup.yOffset + Math.sin(now * 0.004 + pickup.floatPhase) * 3
    };
  }

  handlePlayerCollision(now) {
    if (!this.game || !this.game.player) return;

    const player = this.game.player;
    const playerCenterX = player.x + player.w / 2;
    const playerCenterY = player.y + player.h / 2;
    const playerRadius = Math.max(player.w, player.h) * 0.28;

    if (this.game.platforms) {
      for (let i = 0; i < this.game.platforms.length; i++) {
        const platform = this.game.platforms[i];
        const pickup = platform && platform.pickup;

        if (!pickup || pickup.collected || !pickup.platform || pickup.platform.dead) {
          continue;
        }

        if (this.tryCollectPickup(pickup, playerCenterX, playerCenterY, playerRadius, now)) {
          platform.pickup = null;
        }
      }
    }

    for (let i = this.floatingPickups.length - 1; i >= 0; i--) {
      const pickup = this.floatingPickups[i];
      if (!pickup || pickup.collected) continue;
      if (this.tryCollectPickup(pickup, playerCenterX, playerCenterY, playerRadius, now)) {
        this.floatingPickups.splice(i, 1);
      }
    }
  }

  tryCollectPickup(pickup, playerCenterX, playerCenterY, playerRadius, now) {
    const pos = this.getPickupPosition(pickup, now);
    const dx = pos.x - playerCenterX;
    const dy = pos.y - playerCenterY;
    const hitRadius = playerRadius + pickup.radius;
    if (dx * dx + dy * dy > hitRadius * hitRadius) {
      return false;
    }

    pickup.collected = true;
    this.activatePickup(pickup, now, pos);
    return true;
  }

  activatePickup(pickup, now, position) {
    const definition = this.getDefinitionById(pickup.definitionId);
    if (!definition) return;

    this.activeEffects[definition.id] = {
      id: definition.id,
      name: definition.name,
      shortName: definition.shortName,
      negative: definition.negative,
      color: definition.color,
      accentColor: definition.accentColor,
      symbol: definition.symbol,
      effects: Object.assign({}, definition.effects),
      durationMs: Math.max(500, definition.durationMs || 0),
      expiresAt: now + Math.max(500, definition.durationMs || 0)
    };

    this.rebuildEffects();
    this.showPickupFeedback(definition, position);
  }

  update(now) {
    const deltaMs = this.lastUpdateAt > 0 ? clamp(now - this.lastUpdateAt, 8, 40) : 16.67;
    this.lastUpdateAt = now;

    this.updateFloatingPickups(now, deltaMs);
    this.updateActiveEffects(now);
  }

  updateFloatingPickups(now, deltaMs) {
    if (!this.game || this.floatingPickups.length === 0) return;

    const dtFactor = deltaMs / 16.67;
    const cameraY = this.game.cameraY || 0;
    const H = this.game.H || 0;

    for (let i = this.floatingPickups.length - 1; i >= 0; i--) {
      const pickup = this.floatingPickups[i];
      if (!pickup || pickup.collected) {
        this.floatingPickups.splice(i, 1);
        continue;
      }

      pickup.baseX += pickup.vx * dtFactor;
      pickup.y += pickup.vy * dtFactor;
      pickup.x = pickup.baseX + Math.sin(now * pickup.swaySpeed + pickup.floatPhase) * pickup.swayAmplitude;

      if (pickup.y > cameraY + H + 160 ||
          pickup.y < cameraY - 240 ||
          now - pickup.spawnTime > pickup.maxLifetimeMs) {
        this.floatingPickups.splice(i, 1);
      }
    }
  }

  updateActiveEffects(now) {
    const ids = Object.keys(this.activeEffects);
    if (ids.length === 0) return;

    let changed = false;
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      if (now >= this.activeEffects[id].expiresAt) {
        delete this.activeEffects[id];
        changed = true;
      }
    }

    if (changed) {
      this.rebuildEffects();
    }
  }

  rebuildEffects() {
    const nextEffects = {};
    const ids = Object.keys(this.activeEffects);

    for (let i = 0; i < ids.length; i++) {
      const effectKeys = Object.keys(this.activeEffects[ids[i]].effects || {});
      for (let j = 0; j < effectKeys.length; j++) {
        const key = effectKeys[j];
        const value = this.activeEffects[ids[i]].effects[key];
        if (isScaleKey(key)) {
          nextEffects[key] = typeof nextEffects[key] === 'number' ? nextEffects[key] * value : value;
        } else {
          nextEffects[key] = (nextEffects[key] || 0) + value;
        }
      }
    }

    this.game.runPickupEffects = nextEffects;
    if (typeof this.game.refreshPlatformRuntimeEffects === 'function') {
      this.game.refreshPlatformRuntimeEffects();
    }
  }

  showPickupFeedback(definition, position) {
    if (!this.game) return;

    const durationSeconds = Math.max(1, Math.round((definition.durationMs || 0) / 1000));
    const prefix = definition.negative ? '踩到 ' : '获得 ';
    const text = prefix + definition.name + ' ' + durationSeconds + 's';

    if (typeof this.game.spawnParticles === 'function' && position) {
      this.game.spawnParticles(position.x, position.y, definition.color, definition.negative ? 10 : 12);
    }

    if (this.game.runDirector && typeof this.game.runDirector.showBanner === 'function') {
      this.game.runDirector.showBanner(text, definition.color);
    }

    if (this.game.barrage && this.game.player) {
      this.game.barrage.show(
        this.game.player.x - 24,
        this.game.player.y - this.game.cameraY - 80,
        text,
        definition.color
      );
    }
  }

  getHudEntries(now) {
    const entries = Object.keys(this.activeEffects).map((id) => {
      const item = this.activeEffects[id];
      return Object.assign({}, item, {
        secondsRemaining: Math.max(1, Math.ceil((item.expiresAt - now) / 1000))
      });
    });

    return entries
      .filter(function(entry) {
        return entry.secondsRemaining > 0;
      })
      .sort(function(a, b) {
        return a.expiresAt - b.expiresAt;
      });
  }
}

module.exports = PickupSystem;
