/**
 * Boss/怪物系统
 * 支持跳扑型和上方投掷型Boss
 */

const { getById, find } = require('../tables/tableManager');
const assetManager = require('../resource/assetManager');
const gameConstants = require('../game/constants');
const debugRuntime = require('../game/debugRuntime');

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

class Boss {
  constructor(game) {
    this.game = game;
    this.monsters = [];
    this.tableLoaded = false;
    this.imageCache = {};
    this.renderSize = 320;
    this.warningRenderSize = 340;
    this.throwerRenderSize = 168;
    this.warningDuration = 900;
    this.attackRange = 120;
    this.contactRadius = 70;
    this.spawnSpeed = 14;
    this.chaseSpeed = 18;
    this.exitSpeed = 12;
  }

  init() {
    if (!this.tableLoaded) {
      this.tableLoaded = true;
    }
  }

  getMonsterConfig(monsterId) {
    return getById('Monsters', monsterId);
  }

  getAllBossConfigs() {
    return find('Monsters', function(row) {
      return row.IsBoss === true || row.IsBoss === 'true';
    });
  }

  hasActiveBoss() {
    return this.monsters.length > 0;
  }

  getActiveBoss() {
    return this.monsters.length > 0 ? this.monsters[0] : null;
  }

  resolveBehaviorType(monsterId, behaviorType) {
    if (behaviorType) return behaviorType;
    return monsterId === gameConstants.bossConfig.throwerMonsterId ? 'thrower' : 'leaper';
  }

  buildSpawnDescriptor(spawnArg) {
    if (typeof spawnArg === 'number') {
      return {
        monsterId: spawnArg,
        behaviorType: this.resolveBehaviorType(spawnArg)
      };
    }

    const descriptor = Object.assign({}, spawnArg || {});
    descriptor.monsterId = descriptor.monsterId || descriptor.id || gameConstants.bossConfig.monsterId;
    descriptor.behaviorType = this.resolveBehaviorType(descriptor.monsterId, descriptor.behaviorType);
    return descriptor;
  }

  spawn(spawnArg) {
    const descriptor = this.buildSpawnDescriptor(spawnArg);
    if (!debugRuntime.allowsBossBehavior(this.game ? this.game.debugProfile : null, descriptor.behaviorType)) {
      return null;
    }
    const config = this.getMonsterConfig(descriptor.monsterId);
    if (!config) {
      console.warn('[Boss] 未找到怪物配置:', descriptor.monsterId);
      return null;
    }

    this.clear();

    const monster = descriptor.behaviorType === 'thrower'
      ? this.createThrowerMonster(config, descriptor)
      : this.createLeaperMonster(config, descriptor);

    this._loadFrames(monster);
    this.monsters.push(monster);
    console.log('[Boss] 生成怪物:', monster.name, monster.behaviorType);
    if (this.game.barrage) {
      this.game.barrage.show(
        this.game.W / 2 - 70,
        150,
        monster.name + '出现了！',
        monster.behaviorType === 'thrower' ? '#ffb36b' : '#ff0066'
      );
    }
    return monster;
  }

  createBaseMonster(config, descriptor, spawnX, spawnY) {
    return {
      id: descriptor.monsterId,
      name: config.Name,
      hp: config.Hp,
      attack: config.Attack,
      speed: config.Speed,
      dropReward: config.DropReward,
      isBoss: config.IsBoss === true || config.IsBoss === 'true',
      chasePath: config.ChasePath,
      behaviorType: descriptor.behaviorType,
      x: spawnX,
      y: spawnY,
      targetX: 0,
      targetY: 0,
      animFrame: 0,
      animTimer: 0,
      frames: [],
      framesLoaded: false,
      vx: 0,
      vy: 0,
      rotation: 0,
      rotationSpeed: 0,
      rewardGranted: false
    };
  }

  createLeaperMonster(config, descriptor) {
    const player = this.game.player;
    const playerCenterX = player ? player.x + player.w / 2 : this.game.W / 2;
    const spawnOffsetX = playerCenterX < this.game.W / 2 ? 180 : -180;
    const spawnX = Math.max(140, Math.min(this.game.W - 140, playerCenterX + spawnOffsetX));
    const monster = this.createBaseMonster(
      config,
      descriptor,
      spawnX,
      this.game.cameraY + this.game.H - 80
    );

    return Object.assign(monster, {
      state: 'spawning',
      stateTimer: 0,
      approachDelay: 600,
      hitCooldownUntil: 0,
      attackCount: 0,
      maxAttackCount: 3 + Math.floor(Math.random() * 3),
      warningShown: false,
      attackResolved: false,
      leapElapsed: 0,
      leapDuration: 700,
      leapArcHeight: 220,
      leapStartX: 0,
      leapStartY: 0,
      leapTargetX: 0,
      leapTargetY: 0
    });
  }

  createThrowerMonster(config, descriptor) {
    const throwerConfig = gameConstants.bossConfig.thrower;
    const player = this.game.player;
    const padding = Math.max(56, throwerConfig.horizontalPadding || 92);
    const playerCenterX = player ? player.x + player.w / 2 : this.game.W / 2;
    const spawnX = clamp(
      playerCenterX + randomBetween(-120, 120),
      padding,
      this.game.W - padding
    );
    const now = Date.now();
    const monster = this.createBaseMonster(
      config,
      descriptor,
      spawnX,
      this.game.cameraY - 140
    );

    return Object.assign(monster, {
      state: 'spawning',
      stateTimer: 0,
      hitCooldownUntil: 0,
      throwCount: 0,
      maxThrowCount: Math.max(1, Math.round(throwerConfig.maxThrows || 6)),
      nextThrowAt: now + 850,
      eventEndsAt: now + Math.max(3000, throwerConfig.eventDurationMs || 18000),
      targetPatrolX: spawnX,
      driftDirection: Math.random() < 0.5 ? -1 : 1,
      hoverPhase: Math.random() * Math.PI * 2,
      throwPrepared: false,
      exitAnnounced: false
    });
  }

  _loadFrames(monster) {
    const chasePath = monster.chasePath;
    if (!chasePath) {
      return;
    }

    const framePaths = [];
    for (let i = 0; i < 32; i++) {
      const key = `monster.boss.chase.${i}`;
      if (!assetManager.getAsset(key)) {
        break;
      }
      framePaths.push(`${chasePath}/frame_${String(i).padStart(4, '0')}.png`);
    }

    if (framePaths.length === 0) {
      for (let i = 0; i < 16; i++) {
        framePaths.push(`${chasePath}/frame_${String(i).padStart(4, '0')}.png`);
      }
    }

    monster.frames = framePaths;
    monster.framesLoaded = framePaths.length > 0;

    for (let i = 0; i < framePaths.length; i++) {
      this._getImage(framePaths[i]);
    }
  }

  spawnByCondition(condition) {
    const configs = this.getAllBossConfigs();
    for (let i = 0; i < configs.length; i++) {
      if (configs[i].SpawnCond === condition) {
        return this.spawn(configs[i].Id);
      }
    }
    return null;
  }

  update(dt) {
    const player = this.game.player;
    if (!player) return;

    for (let i = this.monsters.length - 1; i >= 0; i--) {
      this._updateMonster(this.monsters[i], player, dt);
    }
  }

  _updateMonster(monster, player, dt) {
    if (monster.behaviorType === 'leaper') {
      if (this._tryResolveChargeDashCollision(monster, player)) {
        return;
      }

      if (this._tryResolveGrowthCollision(monster, player)) {
        return;
      }

      this._updateLeaperMonster(monster, player, dt);
    } else {
      this._updateThrowerMonster(monster, player, dt);
    }

    if (monster.frames.length > 0) {
      monster.animTimer += dt;
      if (monster.animTimer > 120) {
        monster.animFrame = (monster.animFrame + 1) % monster.frames.length;
        monster.animTimer = 0;
      }
    }

    if (this._shouldDespawn(monster)) {
      this.remove(monster);
    }
  }

  _updateLeaperMonster(monster, player, dt) {
    monster.targetX = player.x;
    monster.targetY = player.y;

    switch (monster.state) {
      case 'spawning':
        monster.y -= Math.max(monster.speed * 2.5, this.spawnSpeed) * (dt / 1000) * 60;
        if (monster.y <= this.game.cameraY + this.game.H - 240) {
          monster.state = 'approaching';
        }
        break;

      case 'approaching':
        this._moveTowards(monster, player.x, player.y + 120, Math.max(monster.speed * 3.5, this.chaseSpeed), dt);
        monster.approachDelay -= dt;
        if (monster.approachDelay <= 0 &&
            Date.now() >= monster.hitCooldownUntil &&
            this._distance(monster.x, monster.y, player.x, player.y) <= this.attackRange) {
          monster.state = 'warning';
          monster.stateTimer = this.warningDuration;
          monster.attackResolved = false;
          monster.warningShown = false;
        }
        break;

      case 'warning':
        monster.stateTimer -= dt;
        if (!monster.warningShown) {
          monster.warningShown = true;
          if (this.game.barrage) {
            this.game.barrage.show(monster.x - 60, monster.y - this.game.cameraY - 150, 'Boss起跳预警！', '#ff9966');
          }
        }
        if (monster.stateTimer <= 0) {
          this._startLeap(monster, player);
        }
        break;

      case 'leaping':
        this._updateLeap(monster, player, dt);
        break;

      case 'exit':
        monster.y += Math.max(monster.speed * 2.5, this.exitSpeed) * (dt / 1000) * 60;
        monster.x += monster.speed * 0.8 * (dt / 1000) * 60;
        break;

      case 'launched':
        monster.x += monster.vx * (dt / 1000) * 60;
        monster.y += monster.vy * (dt / 1000) * 60;
        monster.vy += 0.32 * (dt / 16.67);
        monster.rotation += monster.rotationSpeed * (dt / 1000) * 60;
        break;
    }
  }

  _updateThrowerMonster(monster, player, dt) {
    const now = Date.now();
    const config = gameConstants.bossConfig.thrower;
    const bandY = this.game.cameraY + (config.topOffset || 96);

    switch (monster.state) {
      case 'spawning':
        this._moveTowards(monster, monster.targetPatrolX, bandY, Math.max(monster.speed * 1.8, config.repositionSpeed || 8), dt);
        if (Math.abs(monster.y - bandY) < 10) {
          monster.state = 'patrolling';
          monster.nextThrowAt = now + 900;
        }
        break;

      case 'patrolling':
        if (now >= monster.eventEndsAt || monster.throwCount >= monster.maxThrowCount) {
          this._enterThrowerExit(monster);
          break;
        }
        if (!monster.targetPatrolX || Math.abs(monster.x - monster.targetPatrolX) < 18) {
          monster.targetPatrolX = this._resolveThrowerPatrolX(player, false);
        }
        this._moveTowards(monster, monster.targetPatrolX, bandY, Math.max(monster.speed, config.patrolSpeed || 5.8), dt);
        if (now >= monster.nextThrowAt) {
          monster.state = 'throwing';
          monster.stateTimer = Math.max(120, config.throwPauseMs || 260);
          monster.throwPrepared = false;
          if (this.game.barrage) {
            this.game.barrage.show(monster.x - 44, bandY - this.game.cameraY + 36, '小心空投！', '#ffb36b');
          }
        }
        break;

      case 'throwing':
        monster.stateTimer -= dt;
        this._moveTowards(monster, monster.x, bandY, Math.max(monster.speed * 0.75, (config.patrolSpeed || 5.8) * 0.7), dt);
        if (!monster.throwPrepared && monster.stateTimer <= Math.max(50, (config.throwPauseMs || 260) * 0.45)) {
          monster.throwPrepared = true;
          this._throwProjectiles(monster, now);
        }
        if (monster.stateTimer <= 0) {
          if (now >= monster.eventEndsAt || monster.throwCount >= monster.maxThrowCount) {
            this._enterThrowerExit(monster);
          } else {
            monster.state = 'reposition';
            monster.stateTimer = 700;
            monster.targetPatrolX = this._resolveThrowerPatrolX(player, true);
          }
        }
        break;

      case 'reposition':
        monster.stateTimer -= dt;
        if (now >= monster.eventEndsAt || monster.throwCount >= monster.maxThrowCount) {
          this._enterThrowerExit(monster);
          break;
        }
        this._moveTowards(monster, monster.targetPatrolX, bandY, Math.max(monster.speed * 1.4, config.repositionSpeed || 8), dt);
        if (Math.abs(monster.x - monster.targetPatrolX) < 20 || monster.stateTimer <= 0) {
          monster.state = 'patrolling';
          monster.nextThrowAt = now + this._getThrowInterval();
        }
        break;

      case 'exit':
        monster.y -= Math.max(monster.speed * 2.1, config.repositionSpeed || 8) * (dt / 1000) * 60;
        monster.x += monster.driftDirection * Math.max(monster.speed * 0.7, (config.patrolSpeed || 5.8) * 0.55) * (dt / 1000) * 60;
        break;
    }
  }

  _resolveThrowerPatrolX(player, biasToPlayer) {
    const config = gameConstants.bossConfig.thrower;
    const padding = Math.max(56, config.horizontalPadding || 92);
    const minX = padding;
    const maxX = this.game.W - padding;
    const playerCenterX = player ? player.x + player.w / 2 : this.game.W / 2;
    const focusRange = biasToPlayer ? 90 : 160;
    const biasedTarget = clamp(playerCenterX + randomBetween(-focusRange, focusRange), minX, maxX);

    if (biasToPlayer || Math.random() < 0.58) {
      return biasedTarget;
    }

    return randomBetween(minX, maxX);
  }

  _getThrowInterval() {
    const config = gameConstants.bossConfig.thrower;
    const minInterval = Math.max(300, config.throwIntervalMin || 850);
    const maxInterval = Math.max(minInterval, config.throwIntervalMax || minInterval);
    return randomBetween(minInterval, maxInterval);
  }

  _throwProjectiles(monster, now) {
    if (!this.game.runDirector || typeof this.game.runDirector.spawnBossProjectilePickup !== 'function') {
      return;
    }

    const config = gameConstants.bossConfig.thrower;
    const multiThrow = Math.random() < (config.multiThrowChance || 0);
    const count = multiThrow ? Math.max(2, Math.round(config.multiThrowCount || 3)) : 1;
    const centerIndex = (count - 1) / 2;
    const spread = 30 + Math.max(0, (config.projectileRadiusScale || 1.55) - 1) * 12;

    for (let i = 0; i < count; i++) {
      const offsetX = (i - centerIndex) * spread;
      this.game.runDirector.spawnBossProjectilePickup(monster.x + offsetX, monster.y + 36, {
        now: now,
        driftDirection: offsetX === 0 ? monster.driftDirection : (offsetX < 0 ? -1 : 1),
        driftScale: 0.75 + Math.abs(i - centerIndex) * 0.18
      });
    }

    monster.throwCount += 1;
    monster.nextThrowAt = now + this._getThrowInterval();
  }

  _enterThrowerExit(monster) {
    if (monster.state === 'exit') return;
    monster.state = 'exit';
    if (!monster.exitAnnounced && this.game.barrage) {
      this.game.barrage.show(monster.x - 56, monster.y - this.game.cameraY - 70, '上方空投结束', '#74b9ff');
    }
    monster.exitAnnounced = true;
  }

  _tryResolveChargeDashCollision(monster, player) {
    if (monster.behaviorType !== 'leaper') return false;
    if (!this.game.chargeDashing || !player) return false;
    if (monster.state !== 'warning' && monster.state !== 'leaping' && monster.state !== 'approaching') {
      return false;
    }

    const playerCenterX = player.x + player.w / 2;
    const playerCenterY = player.y + player.h / 2;
    const interruptRadius = Math.max(40, gameConstants.runEventConfig.bossChargeDash.interruptRadius || 125);
    if (this._distance(playerCenterX, playerCenterY, monster.x, monster.y) > interruptRadius) {
      return false;
    }

    monster.state = 'launched';
    monster.attackResolved = true;
    monster.hitCooldownUntil = Date.now() + 1200;
    monster.vx = monster.x < playerCenterX ? -13 : 13;
    monster.vy = -14;
    monster.rotation = 0;
    monster.rotationSpeed = monster.vx < 0 ? -0.16 : 0.16;

    if (typeof this.game.onBossInterrupted === 'function') {
      this.game.onBossInterrupted(monster);
    }
    if (typeof this.game.onBossDefeated === 'function') {
      this.game.onBossDefeated(monster, { viaChargeDash: true });
    }

    this.game.shakeTimer = Math.max(this.game.shakeTimer, 14);
    this.game.spawnParticles(playerCenterX, playerCenterY, '#ff9f1a', 22);
    if (this.game.barrage) {
      this.game.barrage.show(player.x - 40, player.y - this.game.cameraY - 90, '蓄力冲刺打断Boss！', '#ff9f1a');
    }
    return true;
  }

  _tryResolveGrowthCollision(monster, player) {
    if (monster.behaviorType !== 'leaper') return false;
    if (!this.game.growthActive) return false;

    const playerCenterX = player.x + player.w / 2;
    const playerCenterY = player.y + player.h / 2;
    const hitDistance = this.contactRadius + Math.max(player.w, player.h) * 0.35;
    if (this._distance(playerCenterX, playerCenterY, monster.x, monster.y) > hitDistance) {
      return false;
    }

    monster.state = 'exit';
    monster.attackResolved = true;
    monster.hitCooldownUntil = Date.now() + 1200;
    const launchScale = this.game.growthLaunchScale || 1;
    monster.vx = (monster.x < playerCenterX ? -11 : 11) * launchScale;
    monster.vy = -11 * launchScale;
    monster.rotation = 0;
    monster.rotationSpeed = monster.vx < 0 ? -0.14 * launchScale : 0.14 * launchScale;
    monster.state = 'launched';

    if (typeof this.game.onBossDefeated === 'function') {
      this.game.onBossDefeated(monster);
    }

    this.game.consumeGrowthMushroom();
    this.game.shakeTimer = Math.max(this.game.shakeTimer, 12);
    this.game.spawnParticles(playerCenterX, playerCenterY, '#ff9f1a', 24);
    if (this.game.barrage) {
      this.game.barrage.show(player.x - 40, player.y - this.game.cameraY - 90, 'Boss被顶飞了！', '#ff9f1a');
    }
    return true;
  }

  _moveTowards(monster, targetX, targetY, speed, dt) {
    const dx = targetX - monster.x;
    const dy = targetY - monster.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return;

    const moveSpeed = speed * (dt / 1000) * 60;
    monster.x += (dx / dist) * moveSpeed;
    monster.y += (dy / dist) * moveSpeed;
  }

  _startLeap(monster, player) {
    monster.state = 'leaping';
    monster.attackCount++;
    monster.leapElapsed = 0;
    monster.leapStartX = monster.x;
    monster.leapStartY = monster.y;
    monster.leapTargetX = player.x + player.w / 2;
    monster.leapTargetY = player.y + player.h / 2;
  }

  _updateLeap(monster, player, dt) {
    monster.leapElapsed += dt;
    const isFinalAttack = monster.attackCount >= monster.maxAttackCount;
    const progress = Math.min(1, monster.leapElapsed / monster.leapDuration);
    const arcOffset = Math.sin(progress * Math.PI) * monster.leapArcHeight;

    monster.x = monster.leapStartX + (monster.leapTargetX - monster.leapStartX) * progress;
    monster.y = monster.leapStartY + (monster.leapTargetY - monster.leapStartY) * progress - arcOffset;

    if (!monster.attackResolved && this._distance(monster.x, monster.y, player.x, player.y) <= this.contactRadius) {
      monster.attackResolved = true;
      this._hitPlayer(monster, player, isFinalAttack);
      if (isFinalAttack) {
        monster.state = 'exit';
      } else {
        monster.state = 'approaching';
        monster.approachDelay = 500;
        monster.hitCooldownUntil = Date.now() + 900;
        monster.y += 120;
      }
      return;
    }

    if (progress >= 1) {
      if (isFinalAttack) {
        monster.state = 'exit';
      } else {
        monster.state = 'approaching';
        monster.approachDelay = 350;
        monster.hitCooldownUntil = Date.now() + 700;
        monster.y += 80;
      }
      if (!monster.attackResolved && this.game.barrage) {
        this.game.barrage.show(monster.x - 50, monster.y - this.game.cameraY - 100, 'Boss扑空了！', '#74b9ff');
      }
    }
  }

  _hitPlayer(monster, player, isFinalAttack) {
    this.game.controlLockedUntil = Date.now() + 1000;
    this.game.controls.keys['ArrowLeft'] = false;
    this.game.controls.keys['ArrowRight'] = false;
    this.game.skillSystem.applyBossKnockback(monster.x, { isFinalHit: isFinalAttack });

    if (this.game.barrage) {
      const hitText = isFinalAttack ? monster.name + '终结命中！' : monster.name + '重击命中！';
      this.game.barrage.show(player.x - 40, player.y - this.game.cameraY - 80, hitText, '#ff0066');
    }

    const stolenCoins = Math.min(100, this.game.sessionPickupCoins || 0);
    if (stolenCoins > 0) {
      this.game.sessionPickupCoins -= stolenCoins;
      if (this.game.barrage) {
        this.game.barrage.show(player.x - 40, player.y - this.game.cameraY - 40, monster.name + '偷走' + stolenCoins + '金币！', '#ff9966');
      }
    }
  }

  render(ctx) {
    for (let i = 0; i < this.monsters.length; i++) {
      this._renderMonster(ctx, this.monsters[i]);
    }
  }

  _renderMonster(ctx, monster) {
    if (monster.behaviorType === 'thrower') {
      this._renderThrowerMonster(ctx, monster);
      return;
    }

    const drawX = monster.x;
    const drawY = monster.y - this.game.cameraY;
    const size = monster.state === 'warning' ? this.warningRenderSize : this.renderSize;

    if (monster.state === 'warning') {
      ctx.save();
      ctx.strokeStyle = '#ff9966';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(drawX, drawY, 110, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (monster.framesLoaded && monster.frames.length > 0) {
      const framePath = monster.frames[monster.animFrame % monster.frames.length];
      const img = this._getImage(framePath);
      if (img && img.width > 0) {
        if (monster.state === 'launched') {
          ctx.save();
          ctx.translate(drawX, drawY);
          ctx.rotate(monster.rotation || 0);
          ctx.drawImage(img, -size / 2, -size / 2, size, size);
          ctx.restore();
        } else {
          ctx.drawImage(img, drawX - size / 2, drawY - size / 2, size, size);
        }
        return;
      }
    }

    ctx.fillStyle = monster.isBoss ? '#ff0066' : '#ff6600';
    if (monster.state === 'launched') {
      ctx.save();
      ctx.translate(drawX, drawY);
      ctx.rotate(monster.rotation || 0);
      ctx.fillRect(-32, -32, 64, 64);
      ctx.restore();
      return;
    }
    ctx.fillRect(drawX - 32, drawY - 32, 64, 64);
  }

  _renderThrowerMonster(ctx, monster) {
    const drawX = monster.x;
    const drawY = monster.y - this.game.cameraY + Math.sin(Date.now() * 0.004 + monster.hoverPhase) * 3;
    const renderSize = Math.max(140, gameConstants.bossConfig.thrower.renderSize || this.throwerRenderSize);
    const bodyW = renderSize * 0.7;
    const bodyH = renderSize * 0.22;
    const canopyW = bodyW * 0.42;
    const canopyH = bodyH * 0.72;

    ctx.save();

    if (monster.state === 'throwing') {
      ctx.strokeStyle = 'rgba(255, 179, 107, 0.42)';
      ctx.lineWidth = 2;
      if (ctx.setLineDash) {
        ctx.setLineDash([8, 6]);
      }
      ctx.beginPath();
      ctx.moveTo(drawX, drawY + 10);
      ctx.lineTo(drawX, drawY + 170);
      ctx.stroke();
      if (ctx.setLineDash) {
        ctx.setLineDash([]);
      }
    }

    ctx.shadowColor = 'rgba(255, 120, 64, 0.45)';
    ctx.shadowBlur = monster.state === 'throwing' ? 18 : 12;

    const hull = ctx.createLinearGradient(drawX - bodyW / 2, drawY, drawX + bodyW / 2, drawY);
    hull.addColorStop(0, '#ff6b57');
    hull.addColorStop(0.55, '#ff9f43');
    hull.addColorStop(1, '#ffd166');
    ctx.fillStyle = hull;
    ctx.beginPath();
    ctx.ellipse(drawX, drawY + 4, bodyW / 2, bodyH / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 232, 196, 0.82)';
    ctx.beginPath();
    ctx.ellipse(drawX, drawY - 8, canopyW / 2, canopyH / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#5ad1ff';
    ctx.beginPath();
    ctx.arc(drawX, drawY + 4, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff4d6';
    ctx.beginPath();
    ctx.arc(drawX - bodyW * 0.25, drawY + 5, 4.5, 0, Math.PI * 2);
    ctx.arc(drawX + bodyW * 0.25, drawY + 5, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffb36b';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DROP', drawX, drawY + 38);

    ctx.restore();
  }

  _getImage(path) {
    if (this.imageCache[path]) {
      return this.imageCache[path];
    }

    try {
      const img = wx.createImage();
      img.onload = function() {
        console.log('[Boss] 图片加载完成:', path);
      };
      img.onerror = function() {
        console.warn('[Boss] 图片加载失败:', path);
      };
      img.src = assetManager.getImagePath(path);
      this.imageCache[path] = img;
      return img;
    } catch (e) {
      console.error('[Boss] 创建图片失败:', e);
      return null;
    }
  }

  checkCollision(player) {
    for (let i = 0; i < this.monsters.length; i++) {
      const monster = this.monsters[i];
      if (monster.behaviorType !== 'leaper' || monster.state !== 'leaping') continue;
      if (this._distance(player.x, player.y, monster.x, monster.y) < this.contactRadius) {
        return monster;
      }
    }
    return null;
  }

  _distance(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  }

  _shouldDespawn(monster) {
    const topPadding = monster.state === 'exit' ? 500 : 1200;
    const bottomPadding = monster.state === 'exit' ? 1000 : 3200;
    const topBound = this.game.cameraY - topPadding;
    const bottomBound = this.game.cameraY + this.game.H + bottomPadding;
    const leftBound = -400;
    const rightBound = this.game.W + 400;

    return monster.x < leftBound ||
      monster.x > rightBound ||
      monster.y < topBound ||
      monster.y > bottomBound;
  }

  remove(monster) {
    const idx = this.monsters.indexOf(monster);
    if (idx > -1) {
      this.monsters.splice(idx, 1);
    }
  }

  clear() {
    this.monsters = [];
  }

  reset() {
    this.clear();
  }
}

module.exports = Boss;
