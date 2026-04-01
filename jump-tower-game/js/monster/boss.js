/**
 * Boss/怪物系统
 * 从屏幕下方出现，追踪玩家
 */

const { getById, find } = require('../tables/tableManager');

class Boss {
  constructor(game) {
    this.game = game;
    this.monsters = []; // 活跃的怪物列表
    this.tableLoaded = false;
    this.imageCache = {}; // 图片缓存
  }

  /**
   * 初始化，加载怪物表格
   */
  init() {
    if (!this.tableLoaded) {
      // 表格管理器会自动初始化
      this.tableLoaded = true;
    }
  }

  /**
   * 获取怪物配置
   */
  getMonsterConfig(monsterId) {
    return getById('Monsters', monsterId);
  }

  /**
   * 获取所有Boss配置
   */
  getAllBossConfigs() {
    return find('Monsters', function(row) {
      return row.IsBoss === true || row.IsBoss === 'true';
    });
  }

  /**
   * 生成怪物
   */
  spawn(monsterId) {
    const config = this.getMonsterConfig(monsterId);
    if (!config) {
      console.warn('[Boss] 未找到怪物配置:', monsterId);
      return null;
    }

    const monster = {
      id: monsterId,
      name: config.Name,
      hp: config.Hp,
      attack: config.Attack,
      speed: config.Speed,
      isBoss: config.IsBoss === true || config.IsBoss === 'true',
      chasePath: config.ChasePath,

      // 位置和状态
      x: this.game.W / 2,
      y: this.game.cameraY + this.game.H + 100, // 从当前视口下方开始
      targetX: 0,
      targetY: 0,

      // 动画状态
      animFrame: 0,
      animTimer: 0,
      state: 'spawning', // spawning, chasing, attacking, dying

      // 序列帧图片
      frames: [],
      framesLoaded: false
    };

    // 加载序列帧图片
    this._loadFrames(monster);

    this.monsters.push(monster);
    console.log('[Boss] 生成怪物:', monster.name);
    return monster;
  }

  /**
   * 加载怪物序列帧图片
   */
  _loadFrames(monster) {
    const chasePath = monster.chasePath;
    if (!chasePath) {
      console.warn('[Boss] 未配置追击动作路径:', monster.name);
      return;
    }

    // 加载 chase_01.png ~ chase_04.png
    const framePaths = [
      `${chasePath}/chase_01.png`,
      `${chasePath}/chase_02.png`,
      `${chasePath}/chase_03.png`,
      `${chasePath}/chase_04.png`
    ];

    monster.frames = framePaths;
    monster.framesLoaded = true;

    // 预加载所有帧图片
    for (const path of framePaths) {
      this._getImage(path);
    }
    console.log('[Boss] 预加载序列帧:', chasePath);
  }

  /**
   * 根据条件生成Boss
   */
  spawnByCondition(condition) {
    const configs = this.getAllBossConfigs();
    for (const config of configs) {
      if (config.SpawnCond === condition) {
        return this.spawn(config.Id);
      }
    }
    return null;
  }

  /**
   * 更新所有怪物
   */
  update(dt) {
    const player = this.game.player;
    if (!player) return;

    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const monster = this.monsters[i];
      this._updateMonster(monster, player, dt);
    }
  }

  /**
   * 更新单个怪物
   */
  _updateMonster(monster, player, dt) {
    // 更新目标位置（追踪玩家）
    monster.targetX = player.x;
    monster.targetY = player.y;

    // 状态机
    switch (monster.state) {
      case 'spawning':
        // 从屏幕下方升起
        const spawnSpeed = monster.speed * 0.5;
        monster.y -= spawnSpeed * (dt / 1000) * 60;

        // 到达屏幕内后开始追踪
        if (monster.y < this.game.cameraY + this.game.H - 50) {
          monster.state = 'chasing';
        }
        break;

      case 'chasing':
        // 追踪玩家
        const dx = monster.targetX - monster.x;
        const dy = monster.targetY - monster.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 10) {
          const moveSpeed = monster.speed * (dt / 1000) * 60;
          monster.x += (dx / dist) * moveSpeed;
          monster.y += (dy / dist) * moveSpeed;
        }

        // 更新动画帧
        monster.animTimer += dt;
        if (monster.animTimer > 150) { // 每帧150ms
          monster.animFrame = (monster.animFrame + 1) % 4;
          monster.animTimer = 0;
        }
        break;

      case 'dying':
        // 死亡动画（可扩展）
        monster.y += 5; // 下落
        if (monster.y > this.game.H + 200) {
          // 移除怪物
          const idx = this.monsters.indexOf(monster);
          if (idx > -1) {
            this.monsters.splice(idx, 1);
          }
        }
        break;
    }

    if (this._shouldDespawn(monster)) {
      this.remove(monster);
    }
  }

  /**
   * 渲染所有怪物
   */
  render(ctx) {
    for (const monster of this.monsters) {
      this._renderMonster(ctx, monster);
    }
  }

  /**
   * 渲染单个怪物
   */
  _renderMonster(ctx, monster) {
    if (!monster.framesLoaded) return;

    const framePath = monster.frames[monster.animFrame];
    const img = this._getImage(framePath);

    if (img) {
      const size = 512; // Boss尺寸
      ctx.drawImage(
        img,
        monster.x - size / 2,
        monster.y - size / 2 - this.game.cameraY,
        size,
        size
      );
    } else {
      // 图片未加载时绘制占位符
      ctx.fillStyle = monster.isBoss ? '#ff0066' : '#ff6600';
      ctx.fillRect(monster.x - 32, monster.y - 32 - this.game.cameraY, 64, 64);
    }
  }

  /**
   * 获取图片资源（带缓存）
   */
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
      img.src = path;
      this.imageCache[path] = img;
      return img;
    } catch (e) {
      console.error('[Boss] 创建图片失败:', e);
      return null;
    }
  }

  /**
   * 检测与玩家的碰撞
   */
  checkCollision(player) {
    for (const monster of this.monsters) {
      if (monster.state !== 'chasing') continue;

      const dx = player.x - monster.x;
      const dy = player.y - monster.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // 碰撞半径
      if (dist < 64) {
        return monster;
      }
    }
    return null;
  }

  /**
   * 检测怪物是否离开活动区域，避免看不见的实例长期残留
   */
  _shouldDespawn(monster) {
    const topBound = this.game.cameraY - 300;
    const bottomBound = this.game.cameraY + this.game.H + 300;
    const leftBound = -300;
    const rightBound = this.game.W + 300;

    return monster.x < leftBound ||
      monster.x > rightBound ||
      monster.y < topBound ||
      monster.y > bottomBound;
  }

  /**
   * 移除怪物
   */
  remove(monster) {
    const idx = this.monsters.indexOf(monster);
    if (idx > -1) {
      this.monsters.splice(idx, 1);
    }
  }

  /**
   * 清空所有怪物
   */
  clear() {
    this.monsters = [];
  }

  /**
   * 重置系统
   */
  reset() {
    this.clear();
  }
}

module.exports = Boss;
