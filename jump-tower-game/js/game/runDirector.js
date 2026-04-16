const gameConstants = require('./constants');
const debugRuntime = require('./debugRuntime');
const { landmarks } = require('./landmarks');
const PickupSystem = require('./run/pickupSystem');
const worldview = require('../worldview/index');

const RESONANCE_COLORS = ['#55efc4', '#ffd166', '#74b9ff'];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function shuffle(list) {
  const result = list.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = result[i];
    result[i] = result[j];
    result[j] = tmp;
  }
  return result;
}

class RunDirector {
  constructor(game) {
    this.game = game;
    this.pickupSystem = new PickupSystem(game);
    this.reset();
  }

  getConfig() {
    return gameConstants.runEventConfig;
  }

  getDebugProfile() {
    return this.game ? this.game.debugProfile : null;
  }

  isFeatureEnabled(feature) {
    return debugRuntime.allowsRunDirectorFeature(this.getDebugProfile(), feature);
  }

  reset() {
    this.buffOffer = null;
    this.activeBuffs = [];
    this.effects = {};
    this.game.runBuffEffects = {};
    this.goal = null;
    this.lastGoalId = '';
    this.nextBuffHeight = this.getConfig().buffOfferStartHeight;
    this.themeIndex = 0;
    this.activeThemeEvent = null;
    this.banner = null;
    this.resonanceStreak = 0;
    this.lastResonanceColor = '';
    this.comboRewardTier = 0;
    this.pickupSystem.reset();
    if (this.isFeatureEnabled('goals')) {
      this.pickNextGoal();
    }
  }

  update(now) {
    const score = Math.max(0, this.game.score || 0);
    this.pickupSystem.update(now || Date.now());
    if (this.isFeatureEnabled('themes')) {
      this.updateThemeEvent(score);
    } else {
      this.activeThemeEvent = null;
    }

    if (this.isFeatureEnabled('buffs') &&
        !this.buffOffer &&
        this.getAvailableBuffDefinitions().length >= 3 &&
        score >= Math.max(0, this.nextBuffHeight || 0)) {
      this.openBuffOffer(score);
      this.nextBuffHeight += Math.max(1, this.getConfig().buffOfferInterval);
    }
  }

  isBuffOfferOpen() {
    return !!this.buffOffer;
  }

  getActiveBuffs() {
    return this.activeBuffs;
  }

  getCurrentGoal() {
    return this.isFeatureEnabled('goals') ? this.goal : null;
  }

  getActiveTheme() {
    if (!this.isFeatureEnabled('themes')) return null;
    if (!this.activeThemeEvent) return null;
    const score = Math.max(0, this.game.score || 0);
    if (score > this.activeThemeEvent.endHeight) {
      return null;
    }
    return this.activeThemeEvent;
  }

  getSpawnProfile(heightScore) {
    const themeEvent = this.getActiveTheme();
    if (!themeEvent) return null;
    const score = Math.max(0, heightScore || 0);
    if (score < themeEvent.startHeight || score > themeEvent.endHeight) {
      return null;
    }
    return themeEvent;
  }

  getBanner() {
    if (!this.banner) return null;
    if (Date.now() >= this.banner.until) return null;
    return this.banner;
  }

  getMovingPlatformSpeedScale() {
    const pickupConfig = gameConstants.pickupConfig;
    const scale = this.game && typeof this.game.getRunEffectValue === 'function'
      ? this.game.getRunEffectValue('movingPlatformSpeedScale')
      : (this.effects.movingPlatformSpeedScale || 1);
    return clamp(
      scale,
      pickupConfig.movingPlatformSpeedScale.min,
      pickupConfig.movingPlatformSpeedScale.max
    );
  }

  getPickupHudEntries(now) {
    return this.pickupSystem.getHudEntries(now || Date.now());
  }

  getFloatingPickups() {
    return this.pickupSystem.getFloatingPickups();
  }

  getOfferLayout() {
    const W = this.game.W;
    const H = this.game.H;
    const panelW = Math.min(W - 36, 360);
    const cardH = 92;
    const gap = 12;
    const totalH = cardH * 3 + gap * 2 + 86;
    const panelX = (W - panelW) / 2;
    const panelY = (H - totalH) / 2;
    const cards = [];

    for (let i = 0; i < 3; i++) {
      cards.push({
        x: panelX + 14,
        y: panelY + 62 + i * (cardH + gap),
        w: panelW - 28,
        h: cardH
      });
    }

    return {
      panelX,
      panelY,
      panelW,
      panelH: totalH,
      cards
    };
  }

  handleOfferTouch(x, y) {
    if (!this.buffOffer) return false;
    const layout = this.getOfferLayout();
    for (let i = 0; i < layout.cards.length; i++) {
      const card = layout.cards[i];
      if (x >= card.x && x <= card.x + card.w &&
          y >= card.y && y <= card.y + card.h) {
        this.selectBuff(i);
        return true;
      }
    }
    return true;
  }

  onCoinCollected(amount) {
    if (!this.isFeatureEnabled('goals')) return;
    this.advanceGoal('coinsCollected', amount || 1);
  }

  onChargeDashTriggered() {
    if (!this.isFeatureEnabled('goals')) return;
    this.advanceGoal('chargeDashes', 1);
  }

  onPlatformGenerated(platform, scoreHeight) {
    return this.pickupSystem.decoratePlatform(platform, scoreHeight);
  }

  handlePickupCollisions(now) {
    this.pickupSystem.handlePlayerCollision(now || Date.now());
  }

  spawnBossProjectilePickup(spawnX, spawnY, options) {
    return this.pickupSystem.spawnBossProjectilePickup(spawnX, spawnY, options || {});
  }

  onBossInterrupted(monster) {
    this.showBanner(worldview.getBossInterruptText(monster), '#ff9f1a');
  }

  onBossDefeated(monster, context = {}) {
    this.showBanner(worldview.getBossDefeatText(monster, context), '#ffd166');
    if (context.viaChargeDash) {
      this.game.grantRunCoins(this.getConfig().bossChargeDash.rewardCoins, {
        bucket: 'event',
        text: '打断Boss +' + this.getConfig().bossChargeDash.rewardCoins + ' 金币',
        color: '#ff9f1a'
      });
    }

    const bossBonus = Math.max(0, Math.round(this.effects.bossRewardCoins || 0));
    if (bossBonus > 0) {
      this.game.grantRunCoins(bossBonus, {
        bucket: 'event',
        text: '赏金增益 +' + bossBonus + ' 金币',
        color: '#ffeaa7'
      });
    }
  }

  onPlatformLanded(platform) {
    if (!platform) return;

    if (platform.type === 'moving') {
      this.advanceGoal('movingLandings', 1);
    }
    if (platform.specialType) {
      this.advanceGoal('specialLandings', 1);
    }

    this.applyPlatformSpecial(platform);
    this.applyComboBuffReward();
  }

  getBuffDefinitions() {
    const buffConfig = this.getConfig().buffs;
    return [
      {
        id: 'coin_magnet_plus',
        name: '磁吸核心',
        shortName: '磁吸',
        color: '#55efc4',
        desc: '拾币范围扩大，路线更自由',
        effects: {
          playerCoinPickupRadius: Math.round(buffConfig.magnetRadiusBonus)
        }
      },
      {
        id: 'moving_slow_field',
        name: '缓速力场',
        shortName: '缓速',
        color: '#74b9ff',
        desc: '移动平台速度下降，落点更稳',
        effects: {
          movingPlatformSpeedScale: clamp(buffConfig.movingSlowScale, 0.1, 1)
        }
      },
      {
        id: 'dash_overdrive',
        name: '冲刺推进器',
        shortName: '冲刺',
        color: '#fd79a8',
        desc: '蓄力冲刺额外追加一段推进',
        effects: {
          chargeDashSegmentBonus: Math.max(0, Math.round(buffConfig.dashSegmentBonus))
        }
      },
      {
        id: 'combo_dividend',
        name: '连跳分红',
        shortName: '连跳',
        color: '#ffd166',
        desc: '每到达一个连跳阈值就发金币',
        effects: {
          comboCoinBonus: Math.max(0, Math.round(buffConfig.comboCoinBonus)),
          comboThreshold: Math.max(1, Math.round(buffConfig.comboThreshold))
        }
      },
      {
        id: 'boss_bounty',
        name: 'Boss赏金',
        shortName: '赏金',
        color: '#ff9f1a',
        desc: '击退或击败Boss会拿到额外赏金',
        effects: {
          bossRewardCoins: Math.max(0, Math.round(buffConfig.bossRewardBonus))
        }
      }
    ];
  }

  getAvailableBuffDefinitions() {
    if (!this.isFeatureEnabled('buffs')) return [];
    const owned = {};
    for (let i = 0; i < this.activeBuffs.length; i++) {
      owned[this.activeBuffs[i].id] = true;
    }
    return this.getBuffDefinitions().filter(function(buff) {
      return !owned[buff.id];
    });
  }

  openBuffOffer(score) {
    if (!this.isFeatureEnabled('buffs')) return;
    const options = shuffle(this.getAvailableBuffDefinitions()).slice(0, 3);
    if (options.length < 3) return;

    this.buffOffer = {
      height: score,
      options
    };
    this.showBanner('跃迁补给到达，选择一项增益', '#55efc4');
    if (this.game.barrage) {
      this.game.barrage.show(this.game.W / 2 - 110, 180, '三选一增益已出现', '#55efc4');
    }
  }

  selectBuff(index) {
    if (!this.isFeatureEnabled('buffs')) return false;
    if (!this.buffOffer || !this.buffOffer.options[index]) return false;
    const buff = this.buffOffer.options[index];
    this.activeBuffs.push(buff);
    this.buffOffer = null;
    this.rebuildEffects();
    this.game.refreshPlatformRuntimeEffects();
    this.showBanner('获得增益：' + buff.name, buff.color);
    if (this.game.barrage && this.game.player) {
      this.game.barrage.show(
        this.game.player.x - 40,
        this.game.player.y - this.game.cameraY - 100,
        buff.name + ' 生效',
        buff.color
      );
    }
    return true;
  }

  rebuildEffects() {
    const effects = {};
    for (let i = 0; i < this.activeBuffs.length; i++) {
      const buff = this.activeBuffs[i];
      const keys = Object.keys(buff.effects || {});
      for (let j = 0; j < keys.length; j++) {
        const key = keys[j];
        const value = buff.effects[key];
        if (key.indexOf('Scale') !== -1 || key.indexOf('Multiplier') !== -1) {
          effects[key] = typeof effects[key] === 'number' ? effects[key] * value : value;
        } else {
          effects[key] = (effects[key] || 0) + value;
        }
      }
    }
    this.effects = effects;
    this.game.runBuffEffects = Object.assign({}, effects);
  }

  pickNextGoal() {
    if (!this.isFeatureEnabled('goals')) {
      this.goal = null;
      return;
    }
    const config = this.getConfig();
    const options = [
      {
        id: 'collect_coins',
        title: '空中收税',
        desc: '收集金币',
        metric: 'coinsCollected',
        target: Math.max(1, Math.round(config.goalTargets.coins)),
        rewardCoins: Math.max(1, Math.round(config.goalRewardCoins))
      },
      {
        id: 'moving_platforms',
        title: '走位练习',
        desc: '踩中移动平台',
        metric: 'movingLandings',
        target: Math.max(1, Math.round(config.goalTargets.movingLandings)),
        rewardCoins: Math.max(1, Math.round(config.goalRewardCoins))
      },
      {
        id: 'special_platforms',
        title: '异常采样',
        desc: '踩中特殊平台',
        metric: 'specialLandings',
        target: Math.max(1, Math.round(config.goalTargets.specialLandings)),
        rewardCoins: Math.max(1, Math.round(config.goalRewardCoins + 6))
      }
    ];

    if (this.game.skillAvailability && this.game.skillAvailability.chargeDash) {
      options.push({
        id: 'charge_dash',
        title: '推进试验',
        desc: '释放蓄力冲刺',
        metric: 'chargeDashes',
        target: Math.max(1, Math.round(config.goalTargets.chargeDashes)),
        rewardCoins: Math.max(1, Math.round(config.goalRewardCoins + 8))
      });
    }

    const filtered = options.filter((goal) => goal.id !== this.lastGoalId);
    const list = filtered.length > 0 ? filtered : options;
    const picked = list[Math.floor(Math.random() * list.length)];
    this.lastGoalId = picked.id;
    this.goal = Object.assign({ progress: 0 }, picked);
  }

  advanceGoal(metric, amount) {
    if (!this.isFeatureEnabled('goals')) return;
    if (!this.goal || this.goal.metric !== metric) return;

    this.goal.progress = Math.min(
      this.goal.target,
      this.goal.progress + Math.max(0, Math.round(amount || 1))
    );
    if (this.goal.progress >= this.goal.target) {
      this.completeGoal();
    }
  }

  completeGoal() {
    if (!this.isFeatureEnabled('goals')) return;
    if (!this.goal) return;
    const rewardCoins = Math.max(1, Math.round(this.goal.rewardCoins || 0));
    this.game.grantRunCoins(rewardCoins, {
      bucket: 'event',
      text: this.goal.title + ' 完成 +' + rewardCoins + ' 金币',
      color: '#55efc4'
    });
    this.showBanner(this.goal.title + ' 达成', '#55efc4');
    this.pickNextGoal();
  }

  updateThemeEvent(score) {
    if (this.activeThemeEvent && score > this.activeThemeEvent.endHeight) {
      this.activeThemeEvent = null;
    }

    while (score >= this.getThemeStartHeight(this.themeIndex)) {
      const definition = this.getThemeDefinition(this.themeIndex);
      const startHeight = this.getThemeStartHeight(this.themeIndex);
      const durationHeight = Math.max(120, this.getConfig().themeEvent.durationHeight);
      this.activeThemeEvent = {
        id: definition.id,
        name: definition.name,
        desc: definition.desc,
        leagueTitle: definition.leagueTitle,
        eventLabel: definition.eventLabel,
        startHeight,
        endHeight: startHeight + durationHeight,
        theme: definition.theme,
        platformConfig: definition.platformConfig
      };
      this.themeIndex++;
      const themeNarrative = worldview.getThemeNarrative(definition);
      this.showBanner(themeNarrative.bannerText, definition.theme.accentColor);
      if (this.game.barrage) {
        this.game.barrage.show(this.game.W / 2 - 110, 150, themeNarrative.barrageText, definition.theme.accentColor);
      }
    }
  }

  getThemeDefinition(index) {
    return landmarks[index % landmarks.length];
  }

  getThemeStartHeight(index) {
    if (index < landmarks.length) {
      return landmarks[index].targetHeight;
    }
    const lastBaseHeight = landmarks[landmarks.length - 1].targetHeight;
    const loopIndex = index - landmarks.length + 1;
    return lastBaseHeight + loopIndex * Math.max(300, this.getConfig().themeEvent.repeatInterval);
  }

  showBanner(text, color) {
    this.banner = {
      text,
      color: color || '#ffffff',
      until: Date.now() + 2200
    };
  }

  applyPlatformSpecial(platform) {
    const specialConfig = this.getConfig().platformSpecial;
    if (platform.specialType !== 'resonance') {
      this.resonanceStreak = 0;
      this.lastResonanceColor = '';
    }

    if (platform.specialType === 'charge' && !platform.specialConsumed) {
      platform.specialConsumed = true;
      const bonusCharge = Math.max(1, Math.round(specialConfig.chargeBonus));
      this.game.addCharge(bonusCharge, '充能平台');
      this.game.spawnParticles(
        this.game.player.x + this.game.player.w / 2,
        this.game.player.y + this.game.player.h,
        '#55efc4',
        12
      );
      return;
    }

    if (platform.specialType === 'risk' && !platform.specialConsumed) {
      platform.specialConsumed = true;
      const rewardCoins = Math.max(1, Math.round(platform.riskRewardCoins || specialConfig.riskRewardCoins));
      this.game.grantRunCoins(rewardCoins, {
        bucket: 'event',
        text: '风险平台 +' + rewardCoins + ' 金币',
        color: '#ff7675'
      });
      return;
    }

    if (platform.specialType === 'resonance') {
      if (this.lastResonanceColor === platform.resonanceColor) {
        this.resonanceStreak += 1;
      } else {
        this.resonanceStreak = 1;
        this.lastResonanceColor = platform.resonanceColor;
      }

      if (this.resonanceStreak >= Math.max(2, Math.round(specialConfig.resonanceStreakRequirement))) {
        this.resonanceStreak = 0;
        this.lastResonanceColor = '';
        if (this.game.player) {
          this.game.player.vy -= Math.max(1, specialConfig.resonanceBonusForce);
        }
        this.game.spawnParticles(
          this.game.player.x + this.game.player.w / 2,
          this.game.player.y + this.game.player.h,
          platform.resonanceColor || RESONANCE_COLORS[0],
          18
        );
        if (this.game.barrage) {
          this.game.barrage.show(
            this.game.player.x - 40,
            this.game.player.y - this.game.cameraY - 90,
            '共鸣爆发！',
            platform.resonanceColor || RESONANCE_COLORS[0]
          );
        }
      }
      return;
    }
  }

  applyComboBuffReward() {
    const comboThreshold = Math.max(1, Math.round(this.effects.comboThreshold || 0));
    const comboReward = Math.max(0, Math.round(this.effects.comboCoinBonus || 0));
    if (comboThreshold <= 0 || comboReward <= 0) return;

    const currentTier = Math.floor((this.game.combo || 0) / comboThreshold);
    if (currentTier <= this.comboRewardTier) return;

    this.comboRewardTier = currentTier;
    this.game.grantRunCoins(comboReward, {
      bucket: 'event',
      text: '连跳分红 +' + comboReward + ' 金币',
      color: '#ffd166'
    });
  }
}

RunDirector.RESONANCE_COLORS = RESONANCE_COLORS;

module.exports = RunDirector;
