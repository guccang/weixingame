/**
 * 技能系统
 * 管理技能触发、序列帧播放、音效播放、特效粒子
 */

const skillData = require('./skillData');
const { characterConfig, STATE_TO_FRAME_INDEX } = require('../character/character');

/**
 * 活跃技能实例
 */
class ActiveSkill {
  constructor(skillId, config, player) {
    this.id = skillId + '_' + Date.now();
    this.skillId = skillId;
    this.config = config;
    this.player = player;
    this.frameIndex = 0;
    this.isPlaying = true;
    this.timer = 0;
    this.interval = 100;
    this.particles = [];
    this.hasPlayedParticle = false;
    this.hasPlayedSound = false;
    this.hasAppliedPhysics = false;
    this.callbacks = {
      onComplete: null,
      onFrameChange: null
    };
  }

  /**
   * 更新技能状态
   * @param {number} dt - 时间增量(ms)
   */
  update(dt) {
    if (!this.isPlaying) return;

    this.timer += dt;

    // 播放音效（仅第一次更新）
    if (!this.hasPlayedSound && this.config.sound) {
      this.playSound();
      this.hasPlayedSound = true;
    }

    // 应用物理效果（仅第一次更新）
    if (!this.hasAppliedPhysics && this.config.physics) {
      this.applyPhysics();
      this.hasAppliedPhysics = true;
    }

    // 播放粒子效果（仅第一次更新）
    if (!this.hasPlayedParticle && this.config.particle) {
      this.spawnParticle();
      this.hasPlayedParticle = true;
    }

    // 帧动画逻辑
    if (this.timer >= this.interval) {
      this.timer = 0;
      this.frameIndex++;

      if (this.callbacks.onFrameChange) {
        this.callbacks.onFrameChange(this.frameIndex);
      }

      if (this.frameIndex >= 1) {
        this.stop();
      }
    }
  }

  /**
   * 播放音效
   */
  playSound() {
    if (this.config.sound && this.audio) {
      try {
        const audio = wx.createInnerAudioContext();
        audio.src = this.config.sound;
        audio.play();
      } catch (e) {
        console.log('Skill sound play failed:', e);
      }
    }
  }

  /**
   * 应用物理效果
   */
  applyPhysics() {
    const physics = this.config.physics;
    if (!physics || !this.player) return;

    switch (physics.type) {
      case 'jump':
        this.player.vy = physics.force;
        this.player.state = 'rise';
        break;
      case 'doubleJump':
        this.player.vy = physics.force;
        this.player.state = 'rise';
        break;
      case 'slide':
        this.player.vy = physics.force;
        this.player.state = 'fall';
        break;
      case 'horizontal':
        this.player.vx = physics.direction * physics.speed;
        break;
      case 'boost':
        this.player.vy = physics.force;
        this.player.state = 'rise';
        break;
      case 'chargeFull':
        this.player.vy = physics.force;
        this.player.state = 'rise';
        break;
    }
  }

  /**
   * 生成粒子效果
   */
  spawnParticle() {
    if (!this.config.particle || !this.player) return;

    const p = this.config.particle;
    const player = this.player;
    const particles = [];

    for (let i = 0; i < p.count; i++) {
      particles.push({
        x: player.x + player.w / 2,
        y: player.y + player.h,
        vx: (Math.random() - 0.5) * p.speed,
        vy: (Math.random() - 0.5) * p.speed - 2,
        life: 1,
        color: p.color,
        r: Math.random() * 4 + 2
      });
    }

    this.particles = particles;
  }

  /**
   * 更新粒子
   * @param {number} dt - 时间增量
   */
  updateParticles(dt) {
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.life -= 0.025;
      return p.life > 0;
    });
  }

  /**
   * 停止技能
   */
  stop() {
    this.isPlaying = false;
    if (this.callbacks.onComplete) {
      this.callbacks.onComplete(this);
    }
  }

  /**
   * 设置完成回调
   * @param {Function} callback
   */
  onComplete(callback) {
    this.callbacks.onComplete = callback;
  }

  /**
   * 设置帧变化回调
   * @param {Function} callback
   */
  onFrameChange(callback) {
    this.callbacks.onFrameChange = callback;
  }
}

/**
 * 技能系统主类
 */
class SkillSystem {
  constructor(game) {
    this.game = game;
    this.activeSkills = new Map();
    this.gestureThreshold = 30;
    this.gestureMap = {};
    this.skillConfigs = {};
    this.chargeMax = 10;
    this.lastGesture = null;
    this.slideDownSkill = null;

    this.init();
  }

  /**
   * 初始化技能系统
   */
  init() {
    const config = skillData.getEmbeddedConfig();
    this.gestureThreshold = config.gestureThreshold;
    this.gestureMap = config.gestures;
    this.skillConfigs = config.skills;
    this.chargeMax = config.chargeMax || 10;
  }

  /**
   * 处理滑动手势
   * @param {number} deltaX - X轴变化量
   * @param {number} deltaY - Y轴变化量
   * @returns {string|null} 触发的技能ID
   */
  onGesture(deltaX, deltaY) {
    let direction = null;

    if (deltaY < -this.gestureThreshold) {
      direction = 'up';
    } else if (deltaY > this.gestureThreshold) {
      direction = 'down';
    } else if (deltaX < -this.gestureThreshold) {
      direction = 'left';
    } else if (deltaX > this.gestureThreshold) {
      direction = 'right';
    }

    if (direction) {
      console.log('onGesture: direction=' + direction + ', chargeFull=' + this.game.chargeFull);
      // 如果是下滑且蓄力已满，触发满蓄力释放
      if (direction === 'down' && this.game.chargeFull) {
        this.triggerChargeFull();
        this.lastGesture = direction;
        return 'chargeFull';
      }

      // 如果是下滑但蓄力未满，执行普通下滑（不消耗蓄力）
      if (direction === 'down') {
        this.triggerSkill('slide');
        this.lastGesture = direction;
        return 'slide';
      }

      const skillId = this.gestureMap[direction];
      if (skillId) {
        this.triggerSkill(skillId);
        this.lastGesture = direction;
        return skillId;
      }
    }

    return null;
  }

  /**
   * 触发蓄力跳跃（平台碰撞后调用，增加蓄力层数）
   * @param {Object} platform - 平台
   */
  onJumpLand(platform = null) {
    // boost平台不增加蓄力
    if (platform && platform.type === 'boost') {
      return;
    }

    // 增加蓄力层数
    this.game.chargeCount++;
    if (this.game.chargeCount >= this.chargeMax) {
      this.game.chargeCount = this.chargeMax;
      this.game.chargeFull = true;
    }

    // 触发跳跃技能
    this.triggerJumpSkill(platform);
  }

  /**
   * 触发满蓄力释放
   */
  triggerChargeFull() {
    console.log('triggerChargeFull 被调用！');
    // 先设置冲刺状态，防止碰撞时还未设置
    this.game.chargeDashing = true;
    this.game.chargeDashEndTime = Date.now() + 2000;
    console.log('设置 chargeDashing=true, EndTime=' + this.game.chargeDashEndTime + ', 当前时间=' + Date.now());

    const skillId = 'chargeFull';
    const config = this.skillConfigs[skillId];
    if (!config) return null;

    const player = this.game.player;
    if (!player) return null;

    const skill = new ActiveSkill(skillId, config, player);
    skill.audio = this.game.audio;

    // 粒子由 ActiveSkill 管理，完成后添加到游戏粒子系统
    skill.onComplete(() => {
      if (skill.particles.length > 0) {
        this.game.particles.push(...skill.particles);
      }
    });

    // 满蓄力特效
    this.game.shakeTimer = config.shake || 20;
    if (this.game.barrage) {
      this.game.barrage.show(
        player.x,
        player.y - this.game.cameraY - 40,
        config.barrage || '满蓄力发射！！',
        '#ff00ff'
      );
    }

    // 应用物理
    if (config.physics) {
      player.vy = config.physics.force;
      player.state = 'rise';
    }

    // 重置蓄力
    this.game.chargeCount = 0;
    this.game.chargeFull = false;

    this.activeSkills.set(skill.id, skill);
    return skill;
  }

  /**
   * 触发技能
   * @param {string} skillId - 技能ID
   * @param {Object} options - 额外选项
   * @returns {ActiveSkill|null}
   */
  triggerSkill(skillId, options = {}) {
    const config = this.skillConfigs[skillId];
    if (!config) {
      console.warn('Skill not found:', skillId);
      return null;
    }

    const player = this.game.player;
    if (!player) return null;

    // 如果是蓄力释放技能且蓄力已满，重置蓄力
    if (config.chargeRelease && this.game.chargeFull) {
      this.game.chargeCount = 0;
      this.game.chargeFull = false;
    }

    // 创建活跃技能实例
    const skill = new ActiveSkill(skillId, config, player);
    skill.audio = this.game.audio;

    // 设置粒子回调，添加到游戏粒子系统
    skill.onComplete(() => {
      if (skill.particles.length > 0) {
        this.game.particles.push(...skill.particles);
      }
    });

    // 特殊处理：下滑技能
    if (skillId === 'slide' && this.slideDownSkill) {
      this.activeSkills.delete(this.slideDownSkill.id);
    }

    // 特殊处理：移动技能完成后清除速度
    if (config.physics && config.physics.type === 'horizontal') {
      skill.onComplete(() => {
        if (this.game.player) {
          this.game.player.vx = 0;
        }
      });
    }

    // 特殊处理：boost技能
    if (skillId === 'boost') {
      skill.onComplete(() => {
        if (this.game.particles.length > 0) {
          this.game.particles.push(...skill.particles);
        }
      });
    }

    this.activeSkills.set(skill.id, skill);

    // 如果是下滑技能，保存引用用于重复触发
    if (skillId === 'slide') {
      this.slideDownSkill = skill;
    }

    return skill;
  }

  /**
   * 触发落地技能
   * @param {Object} platform - 落地平台
   */
  triggerLandSkill(platform = null) {
    const skillId = 'land';
    const config = this.skillConfigs[skillId];
    if (!config) return null;

    const player = this.game.player;
    if (!player) return null;

    const skill = new ActiveSkill(skillId, config, player);
    skill.audio = this.game.audio;

    // 粒子由 ActiveSkill 管理，完成后添加到游戏粒子系统
    skill.onComplete(() => {
      if (skill.particles.length > 0) {
        this.game.particles.push(...skill.particles);
      }
    });

    player.state = 'land';
    player.stateTimer = 0;

    this.activeSkills.set(skill.id, skill);
    return skill;
  }

  /**
   * 触发跳跃技能（平台碰撞时）
   * @param {Object} platform - 平台
   */
  triggerJumpSkill(platform = null) {
    let skillId = 'jump';
    let config = this.skillConfigs[skillId];

    // boost平台特殊处理
    if (platform && platform.type === 'boost') {
      skillId = 'boost';
      config = this.skillConfigs[skillId];

      // boost特殊效果
      this.game.shakeTimer = 10;
      if (this.game.barrage) {
        this.game.barrage.show(
          this.game.player.x,
          this.game.player.y - this.game.cameraY - 40,
          "火箭弹射！" + this.game.playerName + "起飞！！！",
          '#ffdd57'
        );
      }
    }

    if (!config) return null;

    const player = this.game.player;
    if (!player) return null;

    const skill = new ActiveSkill(skillId, config, player);
    skill.audio = this.game.audio;

    // 粒子由 ActiveSkill 管理，完成后添加到游戏粒子系统
    skill.onComplete(() => {
      if (skill.particles.length > 0) {
        this.game.particles.push(...skill.particles);
      }
    });

    // 应用物理
    if (config.physics) {
      const physics = config.physics;
      switch (physics.type) {
        case 'jump':
          player.vy = physics.force;
          player.state = 'rise';
          break;
        case 'boost':
          player.vy = physics.force;
          player.state = 'rise';
          break;
      }
    }

    this.activeSkills.set(skill.id, skill);
    return skill;
  }

  /**
   * 触发二段跳技能
   */
  triggerDoubleJump() {
    const skillId = 'doubleJump';
    const config = this.skillConfigs[skillId];
    if (!config) return null;

    const player = this.game.player;
    if (!player) return null;

    const skill = new ActiveSkill(skillId, config, player);
    skill.audio = this.game.audio;

    // 粒子由 ActiveSkill 管理，完成后添加到游戏粒子系统
    skill.onComplete(() => {
      if (skill.particles.length > 0) {
        this.game.particles.push(...skill.particles);
      }
    });

    // 应用物理
    player.vy = config.physics.force;
    player.state = 'rise';

    // 显示弹幕
    if (this.game.barrage) {
      this.game.barrage.show(
        player.x,
        player.y - this.game.cameraY - 30,
        "二段跳！"
      );
    }

    this.activeSkills.set(skill.id, skill);
    return skill;
  }

  /**
   * 更新所有活跃技能
   * @param {number} dt - 时间增量(ms)
   */
  update(dt) {
    for (const [id, skill] of this.activeSkills) {
      skill.update(dt);
      skill.updateParticles(dt);

      if (!skill.isPlaying) {
        this.activeSkills.delete(id);
      }
    }

    // 检查蓄力冲刺是否结束
    if (this.game.chargeDashing && Date.now() >= this.game.chargeDashEndTime) {
      this.game.chargeDashing = false;
    }

    // 清理已结束的下滑技能引用
    if (this.slideDownSkill && !this.activeSkills.has(this.slideDownSkill.id)) {
      this.slideDownSkill = null;
    }
  }

  /**
   * 获取玩家当前应该显示的帧索引
   * @returns {number} 帧索引
   */
  getCurrentFrameIndex() {
    const player = this.game.player;
    if (!player) return 0;

    // 优先使用活跃技能的帧
    for (const [id, skill] of this.activeSkills) {
      if (skill.config.frameIndex !== undefined) {
        return skill.config.frameIndex;
      }
    }

    // 否则使用玩家当前状态
    const state = player.state || 'idle';
    return STATE_TO_FRAME_INDEX[state] || 0;
  }

  /**
   * 重置技能系统
   */
  reset() {
    this.activeSkills.clear();
    this.lastGesture = null;
    this.slideDownSkill = null;
  }
}

module.exports = SkillSystem;
