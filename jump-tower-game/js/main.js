/**
 * 跳跳楼游戏 - 微信小游戏入口
 * 从Go版本移植
 */

// 引入render.js初始化canvas
require('./render');

// 使用全局canvas
const canvas = GameGlobal.canvas;
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

// 图片资源
const images = require('./resource/images');

// ==================== 角色序列帧配置 ====================
const { characterConfig, loadCharacter, switchCharacter } = require('./character/character');

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
const { platform: platformPhysics, particle: particlePhysics } = physics;

// 玩家系统
const player = require('./player/player');

// 游戏模式系统
const { GameMode } = require('./game/index');

// 绘制系统
const drawer = require('./drawer/drawer');

// 关卡生成系统
const LevelGenerator = require('./level/level');

// 技能系统
const SkillSystem = require('./skill/skill');

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
    this.maxCombo = 0;
    this.chargeCount = 0;
    this.chargeFull = false;
    this.chargeDashing = false;
    this.chargeDashEndTime = 0;
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
    this.showLeaderboardPanel = false; // 是否显示排行榜面板
    this.rankList = []; // 排行榜数据
    this.rankLoading = false; // 排行榜加载状态
    this.wxUserInfo = null; // 微信用户信息
    this.hasWxLogin = false; // 是否已获取微信登录

    this.controls = new Controls(this); // 控制系统
    this.mainUI = new MainUI(this); // 主界面UI
    this.audio = new Audio(); // 音效管理
    this.levelGenerator = new LevelGenerator(); // 关卡生成器
    this.gameMode = new GameMode(); // 游戏模式管理
    this.skillSystem = new SkillSystem(this); // 技能系统
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
    this.player = player.createPlayer(this.W, this.H);
    this.particles = [];
    this.barrage.clear(); // 清空弹幕
    this.score = 0;
    this.maxHeight = 0;
    this.cameraY = this.H - 100 - this.H * 0.4;
    this.lastPraiseTime = 0;
    this.lastMilestone = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.shakeTimer = 0;
    this.chargeCount = 0;
    this.chargeFull = false;
    this.chargeDashing = false;
    this.controls.reset(); // 重置控制系统状态

    // 初始化游戏模式特定状态
    this.gameMode.initForGame(this);

    // 重置技能系统
    this.skillSystem.reset();

    // 使用关卡生成器初始化
    this.platforms = this.levelGenerator.initLevel(this.W, this.H, characterConfig);
  }

  spawnParticles(x, y, color, count) {
    const newParticles = particlePhysics.spawnParticles(x, y, color, count);
    this.particles.push(...newParticles);
  }

  // 更新玩家动画状态
  updatePlayerState() {
    player.updatePlayerState(this.player);
  }

  generatePlatforms() {
    this.levelGenerator.generatePlatforms(this.W, this.cameraY, this.H);
    this.platforms = this.levelGenerator.getPlatforms();
  }

  update() {
    if (this.state !== 'playing' || !this.player) return;

    // 竞速模式计时器
    if (this.gameMode.update(this, 16.67)) {
      return; // 游戏结束
    }

    player.updateHorizontalMovement(this.player, this.controls);
    player.applyGravity(this.player);
    player.updatePosition(this.player, this.W);

    if (this.player.x > this.W) this.player.x = -this.player.w;
    if (this.player.x + this.player.w < 0) this.player.x = this.W;

    // 更新玩家动画状态
    this.updatePlayerState();

    player.handlePlatformCollisions(this.player, this.platforms, this, Date.now());

    player.updateCamera(this.player, this);

    player.updateScore(this.player, this);

    this.generatePlatforms();

    // 更新被撞飞平台的物理
    for (const p of this.platforms) {
      platformPhysics.updatePlatform(p);
    }

    // 更新技能系统
    this.skillSystem.update(16.67);

    if (player.checkGameOver(this.player, this)) {
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
    // 初始化游戏结束按钮区域，确保在渲染前就存在
    this.gameOverBtnArea = {
      restartX: this.W / 2 - 80,
      restartY: this.H / 2 + 155,
      restartW: 70,
      restartH: 35,
      homeX: this.W / 2 + 10,
      homeY: this.H / 2 + 155,
      homeW: 70,
      homeH: 35
    };
    this.gameMode.onGameOver(this);

    // 保存游戏数据到微信云存储
    this.saveToCloudStorage();
  }

  // 保存游戏数据到云数据库
  saveToCloudStorage() {
    const cloudStorage = require('./runtime/cloudStorage');
    const gameData = {
      openId: this.wxUserInfo ? this.wxUserInfo.openId : '',
      nickname: this.wxUserInfo ? this.wxUserInfo.nickName : this.playerName,
      avatarUrl: this.wxUserInfo ? this.wxUserInfo.avatarUrl : '',
      gameMode: this.gameMode.gameMode,
      score: this.score,
      time: this.finalElapsedTime || 0,
      combo: this.maxCombo
    };
    cloudStorage.saveGameRecord(gameData, function(success, data) {
      if (success) {
        console.log('游戏数据已保存到云端', data);
      } else {
        console.log('游戏数据云端保存失败');
      }
    });
  }

  // 获取排行榜数据
  fetchRankList() {
    const cloudStorage = require('./runtime/cloudStorage');
    const _this = this;
    this.rankLoading = true;
    this.rankList = [];

    // 使用云数据库获取排行榜
    cloudStorage.getAllRankList(function(success, list) {
      _this.rankLoading = false;
      if (success && list) {
        _this.rankList = list.map((item, index) => ({
          rank: index + 1,
          nickname: item.nickname || '匿名用户',
          avatarUrl: item.avatarUrl || '',
          score: item.bestScore || item.score || 0
        }));
      } else {
        console.log('获取排行榜失败');
      }
    });
  }
        _this.rankList = list;
      } else {
        console.log('获取排行榜失败');
      }
    });
  }

  goToHome() {
    this.state = 'start';
    this.combo = 0;
    this.chargeCount = 0;
    this.chargeFull = false;
    this.chargeDashing = false;
    this.gameOverBtnArea = null;
    this.showCharacterPanel = false;
    this.showJobPanel = false;
    this.showLeaderboardPanel = false;
    this.gameMode.reset();
    this.skillSystem.reset();
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
