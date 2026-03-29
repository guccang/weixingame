/**
 * 跳跳楼游戏 - 微信小游戏入口
 * 从Go版本移植
 */

// 引入render.js初始化canvas
require('./drawer/render');

// 使用全局canvas
const canvas = GameGlobal.canvas;
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

// 图片资源
const images = require('./resource/images');

// ==================== 角色序列帧配置 ====================
const { characterConfig, loadCharacter, getCharacterFrame, switchCharacter, STATE_TO_FRAME_INDEX } = require('./character/character');

// 职业配置
const { jobConfig, jobPraiseMap } = require('./runtime/jobconfig');

// 夸夸词系统
const PraiseSystem = require('./praise/praise');

// 弹幕系统
const Barrage = require('./barrage/barrage');

// 主界面UI
const MainUI = require('./ui/mainUI');

// 控制系统
const Controls = require('./controls/controls');

// 音效管理
const Audio = require('./audio/audio');

// 物理系统
const physics = require('./physics/physics');
const { platform: platformPhysics, player: playerPhysics, particle: particlePhysics } = physics;

// 绘制系统
const drawer = require('./drawer/drawer');

// 关卡生成系统
const LevelGenerator = require('./level/level');

// ==================== 游戏类 ====================
class Game {
  constructor() {
    this.W = W;
    this.H = H;
    this.ctx = ctx;
    this.state = 'start';
    this.playerName = '秀彬';
    this.playerJob = jobConfig.current; // 从职业配置获取

    // 物理常量
    this.GRAVITY = physics.constants.GRAVITY;
    this.PLAYER_SPEED = physics.constants.PLAYER_SPEED;
    this.JUMP_FORCE = physics.constants.JUMP_FORCE;
    this.BOOST_JUMP_FORCE = physics.constants.BOOST_JUMP_FORCE;
    this.DOUBLE_JUMP_FORCE = physics.constants.DOUBLE_JUMP_FORCE;
    this.SLIDE_FALL_FORCE = physics.constants.SLIDE_FALL_FORCE;

    this.score = 0;
    this.maxHeight = 0;
    this.combo = 0;
    this.cameraY = 0;
    this.lastPraiseTime = 0;
    this.lastMilestone = 0;
    this.shakeTimer = 0;
    this.praiseSystem = new PraiseSystem(); // 夸夸词系统
    this.barrage = new Barrage(); // 弹幕系统
    this.particles = [];
    this.bgStars = [];
    this.platforms = [];
    this.player = null;
    this.showCharacterPanel = false; // 是否显示角色选择面板
    this.showJobPanel = false; // 是否显示职业选择面板
    this.wxUserInfo = null; // 微信用户信息
    this.hasWxLogin = false; // 是否已获取微信登录

    this.controls = new Controls(this); // 控制系统
    this.mainUI = new MainUI(this); // 主界面UI
    this.audio = new Audio(); // 音效管理
    this.levelGenerator = new LevelGenerator(); // 关卡生成器
    this.initStars();
    this.initWxLogin(); // 微信登录获取用户信息
  }

  // 初始化微信登录
  initWxLogin() {
    var _this = this;
    var wxlogin = require('./runtime/wxlogin');
    wxlogin.wxLogin(function(success, userInfo) {
      if (success && userInfo) {
        _this.wxUserInfo = userInfo;
        _this.hasWxLogin = true;
        if (userInfo.nickName) {
          _this.playerName = userInfo.nickName;
          _this.generatePraises();
        }
      }
    });
  }

  initStars() {
    this.bgStars = [];
    for (let i = 0; i < 150; i++) {
      this.bgStars.push({
        x: Math.random() * this.W,
        y: Math.random() * this.H * 10,
        r: Math.random() * 2 + 0.5,
        twinkle: Math.random() * Math.PI * 2
      });
    }
  }

  generatePraises() {
    this.praiseSystem.generate(this.playerName, this.playerJob, jobPraiseMap);
  }

  initGame() {
    // 玩家状态: idle(站立), charge(蓄力), jump(起跳), rise(上升), fall(下落), land(落地)
    this.player = {
      x: this.W / 2 - 32,
      y: this.H - 100,
      w: 64,
      h: 64,
      vx: 0,
      vy: 0,
      facing: 1,
      state: 'idle',
      prevState: 'idle',
      stateTimer: 0,
      character: characterConfig.current  // 使用当前选中的角色
    };
    this.particles = [];
    this.barrage.clear(); // 清空弹幕
    this.score = 0;
    this.maxHeight = 0;
    this.cameraY = this.H - 100 - this.H * 0.4;
    this.lastPraiseTime = 0;
    this.lastMilestone = 0;
    this.combo = 0;
    this.shakeTimer = 0;
    this.controls.reset(); // 重置控制系统状态

    // 使用关卡生成器初始化
    this.platforms = this.levelGenerator.initLevel(this.W, this.H, characterConfig);
  }

  spawnParticles(x, y, color, count) {
    const newParticles = particlePhysics.spawnParticles(x, y, color, count);
    this.particles.push(...newParticles);
  }

  // 更新玩家动画状态
  updatePlayerState() {
    playerPhysics.updatePlayerState(this.player);
  }

  // 获取当前角色帧图片
  getPlayerFrame() {
    if (!this.player) return null;
    const characterName = this.player.character || characterConfig.current;
    const state = this.player.state || 'idle';
    return getCharacterFrame(characterName, state);
  }

  generatePlatforms() {
    this.levelGenerator.generatePlatforms(this.W, this.cameraY, this.H);
    this.platforms = this.levelGenerator.getPlatforms();
  }

  update() {
    if (this.state !== 'playing' || !this.player) return;
    const player = this.player;

    playerPhysics.updateHorizontalMovement(player, this.controls);
    playerPhysics.applyGravity(player);
    playerPhysics.updatePosition(player, this.W);

    if (player.x > this.W) player.x = -player.w;
    if (player.x + player.w < 0) player.x = this.W;

    // 更新玩家动画状态
    this.updatePlayerState();

    if (playerPhysics.isFalling(player)) {
      for (let p of this.platforms) {
        if (platformPhysics.checkCollision(player, p, Date.now())) {

          if (p.type === 'crumble' && !p.crumbling) {
            p.crumbling = true;
            const _this = this;
            setTimeout(function() { p.dead = true; }, 300);
          }

          if (!p.dead) {
            player.y = p.y - player.h;
            let jumpForce = platformPhysics.handlePlatformJump(player, p, physics.constants);

            if (p.type === 'boost') {
              this.spawnParticles(player.x + player.w / 2, player.y + player.h, '#ffdd57', 20);
              this.shakeTimer = 10;
              this.barrage.show(player.x, player.y - this.cameraY - 40, "火箭弹射！" + this.playerName + "起飞！！！", '#ffdd57');
            }

            player.vy = jumpForce;
            this.combo++;
            this.controls.canDoubleJump = true;
            this.controls.hasDoubleJumped = false;
            this.spawnParticles(player.x + player.w / 2, player.y + player.h, '#74b9ff', 8);
            this.audio.playJump();

            const now = Date.now();
            if (now - this.lastPraiseTime > 800) {
              this.lastPraiseTime = now;
              if (this.combo > 5) {
                this.barrage.show(player.x, player.y - this.cameraY - 30, this.combo + "连跳！" + this.playerName + "太强了！", '#ff6b6b');
              } else {
                const praise = this.praiseSystem.getRandomPraise();
                const colors = ['#ffdd57', '#ff6b6b', '#74b9ff', '#55efc4', '#fd79a8', '#ffeaa7'];
                this.barrage.show(player.x, player.y - this.cameraY - 30, praise, colors[Math.floor(Math.random() * colors.length)]);
              }
            }
          }
        }
      }
    }

    const targetCam = player.y - this.H * 0.4;
    if (targetCam < this.cameraY) {
      this.cameraY += (targetCam - this.cameraY) * 0.25;
    }
    const playerScreenY = player.y - this.cameraY;
    if (playerScreenY < 50) {
      this.cameraY = player.y - 50;
    }

    const currentHeight = Math.floor((-player.y + this.H - 100) / 10);
    if (currentHeight > this.maxHeight) {
      this.maxHeight = currentHeight;
      this.score = this.maxHeight;

      const milestone = this.praiseSystem.checkMilestone(this.score, this.lastMilestone);
      if (milestone) {
        this.lastMilestone = milestone.h;
        this.barrage.show(this.W / 2 - 100, this.H / 2 - this.cameraY, milestone.msg, '#ff6b6b');
        this.shakeTimer = 15;
        this.spawnParticles(this.W / 2, this.H / 2, '#ff6b6b', 30);
      }
    }

    this.generatePlatforms();

    if (player.y > this.cameraY + this.H + 100) {
      this.gameOver();
      return;
    }

    this.particles = particlePhysics.updateParticles(this.particles);

    this.barrage.update();

    if (this.shakeTimer > 0) this.shakeTimer--;
  }

  render() {
    drawer.render(this, images, characterConfig, jobConfig);
  }

  // 检测角色选择点击
  checkCharacterSelectClick(touchX, touchY) {
    const selectY = this.H / 2 + 80;
    const selectWidth = 120;
    const selectHeight = 140;
    const spacing = 140;
    const startX = this.W / 2 - spacing - selectWidth / 2;

    for (let i = 0; i < characterConfig.list.length; i++) {
      const charName = characterConfig.list[i];
      const x = startX + i * spacing;
      const y = selectY;

      // 检测点击是否在角色选择框内
      if (touchX >= x && touchX <= x + selectWidth &&
          touchY >= y && touchY <= y + selectHeight) {
        // 切换角色
        characterConfig.current = charName;
        loadCharacter(charName);
        this.audio.playClick();
        return true;
      }
    }
    return false;
  }

  // 检测职业选择点击
  checkJobSelectClick(touchX, touchY) {
    const selectY = this.H / 2 + 80;
    const selectWidth = 100;
    const selectHeight = 80;
    const spacing = 120;
    const startX = this.W / 2 - (jobConfig.list.length * spacing) / 2;

    for (let i = 0; i < jobConfig.list.length; i++) {
      const jobName = jobConfig.list[i];
      const x = startX + i * spacing;
      const y = selectY;

      // 检测点击是否在职业选择框内
      if (touchX >= x && touchX <= x + selectWidth &&
          touchY >= y && touchY <= y + selectHeight) {
        // 切换职业
        jobConfig.current = jobName;
        this.playerJob = jobName;
        this.generatePraises(); // 刷新夸夸词
        this.audio.playClick();
        return true;
      }
    }
    return false;
  }

  startGame() {
    this.generatePraises();
    this.initGame();
    this.state = 'playing';
    this.audio.playBGM();
    const _this = this;
    setTimeout(function() {
      _this.barrage.show(_this.W / 2 - 80, _this.H / 2, _this.playerName + "出发！冲冲冲！💪");
    }, 500);
    setTimeout(function() {
      _this.barrage.show(_this.W / 2 - 60, _this.H / 2 - 60, _this.playerJob + "牛逼！！！");
    }, 1200);
  }

  gameOver() {
    this.state = 'gameover';
    this.combo = 0;
  }

  goToHome() {
    this.state = 'start';
    this.combo = 0;
    this.showCharacterPanel = false;
    this.showJobPanel = false;
    this.audio.stopBGM();
  }

  loop() {
    this.update();
    this.render();
    const _this = this;
    requestAnimationFrame(function() { _this.loop(); });
  }

  start() {
    this.loop();
  }
}

// 启动游戏
GameGlobal.game = new Game();
GameGlobal.game.start();
