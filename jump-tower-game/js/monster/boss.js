/**
 * Boss/怪物系统
 * 单次Boss事件：出现、追近、预警、跳扑、退场
 */

const { getById, find } = require('../tables/tableManager');
const assetManager = require('../resource/assetManager');

class Boss {
  constructor(game) {
    this.game = game;
    this.monsters = [];
    this.tableLoaded = false;
    this.imageCache = {};
    this.renderSize = 320;
    this.warningRenderSize = 340;
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

  spawn(monsterId) {
    const config = this.getMonsterConfig(monsterId);
    if (!config) {
      console.warn('[Boss] 未找到怪物配置:', monsterId);
      return null;
    }

    this.clear();

    const player = this.game.player;
    const playerCenterX = player ? player.x + player.w / 2 : this.game.W / 2;
    const spawnOffsetX = playerCenterX < this.game.W / 2 ? 180 : -180;
    const spawnX = Math.max(140, Math.min(this.game.W - 140, playerCenterX + spawnOffsetX));
    const monster = {
      id: monsterId,
      name: config.Name,
      hp: config.Hp,
      attack: config.Attack,
      speed: config.Speed,
      dropReward: config.DropReward,
      isBoss: config.IsBoss === true || config.IsBoss === 'true',
      chasePath: config.ChasePath,
      x: spawnX,
      y: this.game.cameraY + this.game.H - 80,
      targetX: 0,
      targetY: 0,
      animFrame: 0,
      animTimer: 0,
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
      leapTargetY: 0,
      frames: [],
      framesLoaded: false,
      vx: 0,
      vy: 0,
      rotation: 0,
      rotationSpeed: 0,
      rewardGranted: false
    };

    this._loadFrames(monster);
    this.monsters.push(monster);
    console.log('[Boss] 生成怪物:', monster.name);
    if (this.game.barrage) {
      this.game.barrage.show(
        this.game.W / 2 - 70,
        150,
        monster.name + '出现了！',
        '#ff0066'
      );
    }
    return monster;
  }

  _loadFrames(monster) {
    const chasePath = monster.chasePath;
    if (!chasePath) {
      console.warn('[Boss] 未配置追击动作路径:', monster.name);
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
      // fallback: 最多尝试16帧
      for (let i = 0; i < 16; i++) {
        framePaths.push(`${chasePath}/frame_${String(i).padStart(4, '0')}.png`);
      }
    }

    monster.frames = framePaths;
    monster.framesLoaded = true;

    for (const path of framePaths) {
      this._getImage(path);
    }
  }

  spawnByCondition(condition) {
    const configs = this.getAllBossConfigs();
    for (const config of configs) {
      if (config.SpawnCond === condition) {
        return this.spawn(config.Id);
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
    if (this._tryResolveGrowthCollision(monster, player)) {
      return;
    }

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

    monster.animTimer += dt;
    if (monster.animTimer > 120) {
      monster.animFrame = (monster.animFrame + 1) % monster.frames.length;
      monster.animTimer = 0;
    }

    if (this._shouldDespawn(monster)) {
      this.remove(monster);
    }
  }

  _tryResolveGrowthCollision(monster, player) {
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

    // Boss击飞时偷取玩家100金币（从当前对局金币扣除）
    const stolenCoins = Math.min(100, this.game.sessionPickupCoins || 0);
    if (stolenCoins > 0) {
      this.game.sessionPickupCoins -= stolenCoins;
      if (this.game.barrage) {
        this.game.barrage.show(player.x - 40, player.y - this.game.cameraY - 40, monster.name + '偷走' + stolenCoins + '金币！', '#ff9966');
      }
    }
  }

  render(ctx) {
    for (const monster of this.monsters) {
      this._renderMonster(ctx, monster);
    }
  }

  _renderMonster(ctx, monster) {
    const drawX = monster.x;
    const drawY = monster.y - this.game.cameraY;
    const size = monster.state === 'warning' ? this.warningRenderSize : this.renderSize;

    if (!monster.framesLoaded) return;

    if (monster.state === 'warning') {
      ctx.save();
      ctx.strokeStyle = '#ff9966';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(drawX, drawY, 110, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    const framePath = monster.frames[monster.animFrame];
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
    for (const monster of this.monsters) {
      if (monster.state !== 'leaping') continue;
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
