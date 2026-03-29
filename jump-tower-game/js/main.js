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

// ==================== 图片资源加载 ====================
const images = {
  bgMain: null,
  bgShop: null,
  iconCharacter: null,
  iconCoin: null,
  iconLeaderboard: null,
  iconShop: null,
  loaded: false,
  loadCount: 0,
  totalCount: 6
};

// ==================== 角色序列帧配置 ====================
// 状态到帧索引的映射
const STATE_TO_FRAME_INDEX = {
  'idle': 0,   // 站立
  'charge': 1, // 蓄力
  'jump': 2,   // 起跳
  'rise': 3,   // 上升
  'fall': 4,   // 下落
  'land': 5    // 落地
};

// 角色配置
const characterConfig = {
  // 当前选中的角色
  current: 'coach',
  // 角色列表
  list: ['coach', 'ironman'],
  // 角色中文名称
  names: {
    'coach': '健身教练',
    'ironman': '钢铁侠'
  },
  // 序列帧总数
  frameCount: 6,
  // 已加载的角色资源
  frames: {},
  // 加载状态
  loadedCharacters: {}
};

// 加载指定角色的序列帧
function loadCharacter(characterName) {
  if (characterConfig.frames[characterName]) {
    return; // 已加载
  }

  characterConfig.frames[characterName] = [];
  let loadCount = 0;

  for (let i = 0; i < characterConfig.frameCount; i++) {
    const img = wx.createImage();
    img.onload = function() {
      loadCount++;
      if (loadCount >= characterConfig.frameCount) {
        characterConfig.loadedCharacters[characterName] = true;
      }
    };
    img.src = `images/characters/${characterName}/jump_${i}.png`;
    characterConfig.frames[characterName].push(img);
  }
}

// 获取角色当前状态对应的帧图片
function getCharacterFrame(characterName, state) {
  if (!characterConfig.loadedCharacters[characterName]) {
    return null;
  }
  const frameIndex = STATE_TO_FRAME_INDEX[state];
  return characterConfig.frames[characterName][frameIndex] || null;
}

// 切换角色
function switchCharacter(characterName) {
  if (characterConfig.list.includes(characterName)) {
    characterConfig.current = characterName;
    loadCharacter(characterName);
  }
}

function loadImage(name, src) {
  const img = wx.createImage();
  img.onload = function() {
    images[name] = img;
    images.loadCount++;
    if (images.loadCount >= images.totalCount) {
      images.loaded = true;
    }
  };
  img.src = src;
}

loadImage('bgMain', 'images/bg_main.png');
loadImage('bgShop', 'images/bg_shop.png');
loadImage('iconCharacter', 'images/icon_character.png');
loadImage('iconCoin', 'images/icon_coin.png');
loadImage('iconLeaderboard', 'images/icon_leaderboard.png');
loadImage('iconShop', 'images/icon_shop.png');

// 预加载所有角色
loadCharacter('coach');
loadCharacter('ironman');

// ==================== 游戏常量 ====================
const GRAVITY = 0.45;
const PLAYER_SPEED = 6;
const JUMP_FORCE = -15;
const BOOST_JUMP_FORCE = -22;
const DOUBLE_JUMP_FORCE = -18;

// ==================== 夸奖系统 ====================
const praiseTemplates = [
  "{n}太强了！", "{n}yyds！", "{n}无敌！", "{n}！{n}！{n}！",
  "这弹跳力逆天了！", "全场最佳！MVP！", "无敌是多么寂寞！",
  "跳得比楼还高！", "{n}一跳破纪录！", "这就是自律的力量！",
  "{n}的力量永不疲惫！", "{n}是真的猛！", "这爆发力！绝绝子！",
  "力量与美的结合！", "{n}天下第一！",
];

const jobPraiseMap = {
  '健身': ["肌肉爆炸！！！", "{j}牛逼牛逼牛逼！", "这腿部力量绝了！", "蛋白粉都不够吃！", "卧推300斤！", "硬拉王者！！！", "体脂率3%！", "肌肉猛男！", "深蹲暴击！", "腹肌八块！"],
  '编程': ["代码之神降临！", "bug都被你跳没了！", "写代码比跳楼还快！", "满屏都是AC！", "算法天才！", "GitHub全绿！"],
  '游戏': ["王者荣耀上王者！", "吃鸡局局第一！", "操作如神！", "这走位太秀了！", "反应速度逆天！", "MVP拿到手软！"],
  '学习': ["学霸本霸！", "考试全满分！", "智商爆表！", "清北随便选！", "教授都被你问懵了！", "学神降临！"],
};

// ==================== 游戏类 ====================
class Game {
  constructor() {
    this.W = W;
    this.H = H;
    this.ctx = ctx;
    this.state = 'start';
    this.playerName = '秀彬';
    this.playerJob = '健身';
    this.score = 0;
    this.maxHeight = 0;
    this.combo = 0;
    this.cameraY = 0;
    this.lastPraiseTime = 0;
    this.lastMilestone = 0;
    this.shakeTimer = 0;
    this.touchStartX = null;
    this.canDoubleJump = false;
    this.hasDoubleJumped = false;
    this.tapCount = 0;
    this.lastTapTime = 0;
    this.keys = {};
    this.praises = [];
    this.milestones = [];
    this.floatingTexts = [];
    this.particles = [];
    this.bgStars = [];
    this.platforms = [];
    this.player = null;
    this.showCharacterPanel = false; // 是否显示角色选择面板

    this.initInput();
    this.initStars();
  }

  initInput() {
    var _this = this;

    // 触摸开始 - 使用微信小游戏 API
    wx.onTouchStart(function(e) {
      var touches = e.touches;
      if (touches && touches.length > 0) {
        _this.touchStartX = touches[0].clientX;
        var touchX = touches[0].clientX;
        var touchY = touches[0].clientY;

        // 在主界面检测按钮和角色选择点击
        if (_this.state === 'start') {
          // 如果角色面板显示中，优先处理角色选择
          if (_this.showCharacterPanel) {
            var selected = _this.checkCharacterSelectClick(touchX, touchY);
            if (selected) {
              _this.showCharacterPanel = false; // 选择角色后关闭面板
              return; // 点击了角色选择区域
            }
            // 检测是否点击了关闭角色面板（点击其他区域）
            if (_this.bottomBtnArea) {
              var charBtn = _this.bottomBtnArea.character;
              // 如果点击的是角色按钮本身，不关闭面板
              if (touchX >= charBtn.x && touchX <= charBtn.x + charBtn.w &&
                  touchY >= charBtn.y && touchY <= charBtn.y + charBtn.h) {
                return; // 点击角色按钮，切换面板
              }
            }
            // 点击其他区域，关闭角色面板
            _this.showCharacterPanel = false;
            return;
          }

          // 检测是否点击了底部图标按钮
          if (_this.bottomBtnArea) {
            var btn = _this.bottomBtnArea;
            // 点击了角色按钮
            if (touchX >= btn.character.x && touchX <= btn.character.x + btn.character.w &&
                touchY >= btn.character.y && touchY <= btn.character.y + btn.character.h) {
              _this.showCharacterPanel = true;
              return;
            }
            // 点击了商店按钮（暂未实现）
            if (touchX >= btn.shop.x && touchX <= btn.shop.x + btn.shop.w &&
                touchY >= btn.shop.y && touchY <= btn.shop.y + btn.shop.h) {
              return; // 商店暂未开放
            }
            // 点击了排行榜按钮（暂未实现）
            if (touchX >= btn.leaderboard.x && touchX <= btn.leaderboard.x + btn.leaderboard.w &&
                touchY >= btn.leaderboard.y && touchY <= btn.leaderboard.y + btn.leaderboard.h) {
              return; // 排行榜暂未开放
            }
          }

          // 检测是否点击了开始按钮
          if (_this.startBtnArea) {
            var sBtn = _this.startBtnArea;
            if (touchX >= sBtn.x && touchX <= sBtn.x + sBtn.w &&
                touchY >= sBtn.y && touchY <= sBtn.y + sBtn.h) {
              _this.startGame();
              return;
            }
          }
          return; // 点击了其他区域不处理
        }

        // 游戏结束时检测按钮点击
        if (_this.state === 'gameover' && _this.gameOverBtnArea) {
          var btn = _this.gameOverBtnArea;
          // 检查是否点击了重新开始按钮
          if (touchX >= btn.restartX && touchX <= btn.restartX + btn.restartW &&
              touchY >= btn.restartY && touchY <= btn.restartY + btn.restartH) {
            _this.startGame();
            return;
          }
          // 检查是否点击了返回主页按钮
          if (touchX >= btn.homeX && touchX <= btn.homeX + btn.homeW &&
              touchY >= btn.homeY && touchY <= btn.homeY + btn.homeH) {
            _this.goToHome();
            return;
          }
          return; // 点击了其他区域不处理
        }
      }
      // 开始或重新开始游戏
      if (_this.state === 'start' || _this.state === 'gameover') {
        _this.startGame();
      } else if (_this.state === 'playing' && _this.canDoubleJump && !_this.hasDoubleJumped) {
        var now = Date.now();
        if (now - _this.lastTapTime < 300) {
          _this.tapCount++;
          if (_this.tapCount >= 2) {
            _this.doDoubleJump();
            _this.tapCount = 0;
          }
        } else {
          _this.tapCount = 1;
        }
        _this.lastTapTime = now;
      }
    });

    // 触摸移动 - 使用微信小游戏 API
    wx.onTouchMove(function(e) {
      var touches = e.touches;
      if (touches && touches.length > 0 && _this.touchStartX !== null) {
        var currentX = touches[0].clientX;
        var deltaX = currentX - _this.touchStartX;

        if (deltaX < -30) {
          _this.keys['ArrowLeft'] = true;
          _this.keys['ArrowRight'] = false;
        } else if (deltaX > 30) {
          _this.keys['ArrowLeft'] = false;
          _this.keys['ArrowRight'] = true;
        } else {
          _this.keys['ArrowLeft'] = false;
          _this.keys['ArrowRight'] = false;
        }
      }
    });

    // 触摸结束 - 使用微信小游戏 API
    wx.onTouchEnd(function(e) {
      _this.keys['ArrowLeft'] = false;
      _this.keys['ArrowRight'] = false;
      _this.touchStartX = null;
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
    const n = this.playerName;
    const j = this.playerJob;
    this.praises = praiseTemplates.map(t => t.replace(/\{n\}/g, n).replace(/\{j\}/g, j));

    let jobPraises = null;
    for (const [key, val] of Object.entries(jobPraiseMap)) {
      if (j.includes(key) || key.includes(j)) {
        jobPraises = val;
        break;
      }
    }

    if (!jobPraises) {
      jobPraises = [j + "牛逼牛逼牛逼！", j + "界的天花板！", j + "之王！", j + "做到了极致！", "这" + j + "水平逆天了！", j + "界的传奇！"];
    }

    const expanded = jobPraises.map(t => t.replace(/\{n\}/g, n).replace(/\{j\}/g, j));
    this.praises = this.praises.concat(expanded);

    this.milestones = [
      { h: 50, msg: n + "热身完毕，真正的挑战开始！" },
      { h: 100, msg: "100米！" + n + "的" + j + "力量堪比火箭！" },
      { h: 200, msg: "200米！" + n + "已经超越了地球引力！" },
      { h: 500, msg: "500米！" + j + "大佬の极限还远远没到！" },
      { h: 1000, msg: "1000米！！！" + n + "已经是" + j + "之神了！！！" },
      { h: 2000, msg: "2000米！！宇宙级" + j + "王者！无人能敌！" },
      { h: 5000, msg: "5000米！！！" + n + " = " + j + "の神 + 跳跃の神！！！" },
    ];
  }

  createPlatform(x, y, type) {
    return { x, y, w: 85, h: 14, type: type || 'normal', bounced: false, crumbling: false, dead: false };
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
    this.platforms = [];
    this.particles = [];
    this.floatingTexts = [];
    this.score = 0;
    this.maxHeight = 0;
    this.cameraY = this.H - 100 - this.H * 0.4;
    this.lastPraiseTime = 0;
    this.lastMilestone = 0;
    this.combo = 0;
    this.shakeTimer = 0;
    this.canDoubleJump = false;
    this.hasDoubleJumped = false;

    const ground = this.createPlatform(this.W / 2 - 100, this.H - 40, 'ground');
    ground.w = 200;
    this.platforms.push(ground);

    for (let i = 0; i < 12; i++) {
      let px = Math.random() * (this.W - 100) + 10;
      let py = this.H - 100 - i * 70;
      let type = 'normal';
      if (i > 4 && Math.random() < 0.2) type = 'boost';
      if (i > 6 && Math.random() < 0.15) type = 'moving';
      this.platforms.push(this.createPlatform(px, py, type));
    }
  }

  showFloatingText(x, y, text, color) {
    this.floatingTexts.push({ x, y, text, color: color || '#ffdd57', life: 1, scale: 1, vy: -2 });
  }

  spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 3,
        life: 1,
        color,
        r: Math.random() * 4 + 2
      });
    }
  }

  doDoubleJump() {
    if (!this.player || !this.canDoubleJump || this.hasDoubleJumped) return;
    this.hasDoubleJumped = true;
    this.player.vy = DOUBLE_JUMP_FORCE;
    this.spawnParticles(this.player.x + this.player.w / 2, this.player.y + this.player.h, '#fd79a8', 12);
    this.showFloatingText(this.player.x, this.player.y - this.cameraY - 30, "二段跳！");
  }

  // 更新玩家动画状态
  updatePlayerState() {
    if (!this.player) return;
    const player = this.player;
    const prevState = player.state;

    // 根据速度判断状态
    if (player.vy < -5) {
      // 快速上升 - 起跳或上升
      if (prevState === 'idle' || prevState === 'charge') {
        player.state = 'jump';
        player.stateTimer = 5; // 起跳帧持续5帧
      } else if (player.stateTimer <= 0) {
        player.state = 'rise';
      }
    } else if (player.vy < 0) {
      // 缓慢上升 - 上升
      player.state = 'rise';
    } else if (player.vy > 2) {
      // 下落
      player.state = 'fall';
    } else {
      // 接近静止 - 站立或落地
      if (prevState === 'fall') {
        player.state = 'land';
        player.stateTimer = 8; // 落地帧持续8帧
      } else if (player.stateTimer <= 0) {
        player.state = 'idle';
      }
    }

    // 更新状态计时器
    if (player.stateTimer > 0) {
      player.stateTimer--;
    }
  }

  // 获取当前角色帧图片
  getPlayerFrame() {
    if (!this.player) return null;
    const characterName = this.player.character || characterConfig.current;
    const state = this.player.state || 'idle';
    return getCharacterFrame(characterName, state);
  }

  generatePlatforms() {
    const topScreen = this.cameraY - 100;
    while (this.platforms.length === 0 || this.platforms[this.platforms.length - 1].y > topScreen - this.H) {
      const lastP = this.platforms[this.platforms.length - 1];
      let ny = lastP.y - (80 + Math.random() * 60);
      let nx = Math.random() * (this.W - 100) + 10;
      let type = 'normal';
      const h = -ny;
      if (h > 300 && Math.random() < 0.25) type = 'boost';
      if (h > 200 && Math.random() < 0.2) type = 'moving';
      if (h > 800 && Math.random() < 0.1) type = 'crumble';
      this.platforms.push(this.createPlatform(nx, ny, type));
    }
    this.platforms = this.platforms.filter(p => !p.dead && p.y < this.cameraY + this.H + 200);
  }

  update() {
    if (this.state !== 'playing' || !this.player) return;
    const player = this.player;

    if (this.keys['ArrowLeft'] || this.keys['a']) {
      player.vx = -PLAYER_SPEED;
      player.facing = -1;
    } else if (this.keys['ArrowRight'] || this.keys['d']) {
      player.vx = PLAYER_SPEED;
      player.facing = 1;
    } else {
      player.vx *= 0.85;
    }

    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;

    if (player.x > this.W) player.x = -player.w;
    if (player.x + player.w < 0) player.x = this.W;

    // 更新玩家动画状态
    this.updatePlayerState();

    if (player.vy > 0) {
      for (let p of this.platforms) {
        let px = p.x;
        if (p.type === 'moving') {
          px = p.x + Math.sin(Date.now() * 0.003 + p.y) * 60;
        }
        if (player.x + player.w > px && player.x < px + p.w &&
          player.y + player.h >= p.y && player.y + player.h <= p.y + p.h + player.vy + 5) {

          if (p.type === 'crumble' && !p.crumbling) {
            p.crumbling = true;
            const _this = this;
            setTimeout(function() { p.dead = true; }, 300);
          }

          if (!p.dead) {
            player.y = p.y - player.h;
            let jumpForce = JUMP_FORCE;

            if (p.type === 'boost') {
              jumpForce = BOOST_JUMP_FORCE;
              this.spawnParticles(player.x + player.w / 2, player.y + player.h, '#ffdd57', 20);
              this.shakeTimer = 10;
              this.showFloatingText(player.x, player.y - this.cameraY - 40, "火箭弹射！" + this.playerName + "起飞！！！", '#ffdd57');
            }

            player.vy = jumpForce;
            this.combo++;
            this.canDoubleJump = true;
            this.hasDoubleJumped = false;
            this.spawnParticles(player.x + player.w / 2, player.y + player.h, '#74b9ff', 8);

            const now = Date.now();
            if (now - this.lastPraiseTime > 800) {
              this.lastPraiseTime = now;
              if (this.combo > 5) {
                this.showFloatingText(player.x, player.y - this.cameraY - 30, this.combo + "连跳！" + this.playerName + "太强了！", '#ff6b6b');
              } else {
                const praise = this.praises[Math.floor(Math.random() * this.praises.length)];
                const colors = ['#ffdd57', '#ff6b6b', '#74b9ff', '#55efc4', '#fd79a8', '#ffeaa7'];
                this.showFloatingText(player.x, player.y - this.cameraY - 30, praise, colors[Math.floor(Math.random() * colors.length)]);
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

      for (let m of this.milestones) {
        if (this.score >= m.h && this.lastMilestone < m.h) {
          this.lastMilestone = m.h;
          this.showFloatingText(this.W / 2 - 100, this.H / 2 - this.cameraY, m.msg, '#ff6b6b');
          this.shakeTimer = 15;
          this.spawnParticles(this.W / 2, this.H / 2, '#ff6b6b', 30);
        }
      }
    }

    this.generatePlatforms();

    if (player.y > this.cameraY + this.H + 100) {
      this.gameOver();
      return;
    }

    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life -= 0.025;
      return p.life > 0;
    });

    this.floatingTexts = this.floatingTexts.filter(t => {
      t.y += t.vy;
      t.life -= 0.012;
      return t.life > 0;
    });

    if (this.shakeTimer > 0) this.shakeTimer--;
  }

  roundRect(x, y, w, h, r) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawBackground() {
    const heightRatio = Math.min(this.score / 2000, 1);
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.H);

    if (heightRatio < 0.3) {
      grad.addColorStop(0, '#0a0a2e');
      grad.addColorStop(1, '#1a1a4e');
    } else if (heightRatio < 0.6) {
      grad.addColorStop(0, '#0d0d3d');
      grad.addColorStop(1, '#2d1b69');
    } else {
      grad.addColorStop(0, '#000020');
      grad.addColorStop(1, '#1a0a3e');
    }

    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.W, this.H);

    for (let s of this.bgStars) {
      s.twinkle += 0.02;
      const sy = (s.y - this.cameraY * 0.3) % (this.H * 10);
      const alpha = 0.5 + Math.sin(s.twinkle) * 0.5;
      this.ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
      this.ctx.beginPath();
      this.ctx.arc(s.x, sy % this.H, s.r, 0, Math.PI * 2);
      this.ctx.fill();
    }

    const startH = Math.floor((-this.cameraY) / 200) * 200;
    this.ctx.fillStyle = 'rgba(255,255,255,0.15)';
    this.ctx.font = '12px sans-serif';
    for (let h = startH; h < startH + this.H + 400; h += 200) {
      const sy = h + this.cameraY;
      if (sy > 0 && sy < this.H) {
        const meters = Math.floor((-h + this.H - 100) / 10);
        if (meters > 0) {
          this.ctx.fillText(meters + 'm', this.W - 50, sy);
          this.ctx.fillRect(0, sy, this.W, 1);
        }
      }
    }
  }

  drawPlatforms() {
    for (let p of this.platforms) {
      let px = p.x;
      if (p.type === 'moving') {
        px = p.x + Math.sin(Date.now() * 0.003 + p.y) * 60;
      }
      const sy = p.y - this.cameraY;
      if (sy < -20 || sy > this.H + 20) continue;

      if (p.crumbling) {
        this.ctx.globalAlpha = 0.5;
      }

      if (p.type === 'ground') {
        const g = this.ctx.createLinearGradient(px, sy, px, sy + p.h);
        g.addColorStop(0, '#55efc4');
        g.addColorStop(1, '#00b894');
        this.ctx.fillStyle = g;
        this.ctx.shadowColor = '#55efc4';
        this.ctx.shadowBlur = 10;
        this.roundRect(px, sy, p.w, p.h, 4);
      } else if (p.type === 'boost') {
        const g = this.ctx.createLinearGradient(px, sy, px, sy + p.h);
        g.addColorStop(0, '#ffdd57');
        g.addColorStop(1, '#ffa502');
        this.ctx.fillStyle = g;
        this.ctx.shadowColor = '#ffdd57';
        this.ctx.shadowBlur = 15;
        this.roundRect(px, sy, p.w, p.h, 4);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 10px sans-serif';
        this.ctx.fillText('↑↑', px + p.w / 2 - 10, sy + 11);
      } else if (p.type === 'crumble') {
        this.ctx.fillStyle = '#b2bec3';
        this.ctx.shadowColor = '#636e72';
        this.ctx.shadowBlur = 5;
        for (let i = 0; i < 3; i++) {
          this.ctx.fillRect(px + i * 30, sy + (i % 2) * 3, 25, p.h - (i % 2) * 3);
        }
      } else if (p.type === 'moving') {
        const g = this.ctx.createLinearGradient(px, sy, px, sy + p.h);
        g.addColorStop(0, '#a29bfe');
        g.addColorStop(1, '#6c5ce7');
        this.ctx.fillStyle = g;
        this.ctx.shadowColor = '#a29bfe';
        this.ctx.shadowBlur = 10;
        this.roundRect(px, sy, p.w, p.h, 4);
      } else {
        const g = this.ctx.createLinearGradient(px, sy, px, sy + p.h);
        g.addColorStop(0, '#74b9ff');
        g.addColorStop(1, '#0984e3');
        this.ctx.fillStyle = g;
        this.ctx.shadowColor = '#74b9ff';
        this.ctx.shadowBlur = 8;
        this.roundRect(px, sy, p.w, p.h, 4);
      }

      this.ctx.shadowBlur = 0;
      this.ctx.globalAlpha = 1;
    }
  }

  drawPlayer() {
    if (!this.player) return;
    const player = this.player;
    const py = player.y - this.cameraY;
    const px = player.x;
    const f = player.facing;

    // 尝试使用序列帧图片绘制
    const frame = this.getPlayerFrame();
    if (frame && frame.width > 0) {
      // 使用序列帧图片
      this.ctx.save();
      this.ctx.translate(px + player.w / 2, py + player.h / 2);

      // 根据朝向翻转
      if (f < 0) {
        this.ctx.scale(-1, 1);
      }

      // 绘制发光效果
      const glow = this.ctx.createRadialGradient(0, 0, 5, 0, 0, 35);
      glow.addColorStop(0, 'rgba(255,221,87,0.3)');
      glow.addColorStop(1, 'rgba(255,221,87,0)');
      this.ctx.fillStyle = glow;
      this.ctx.fillRect(-35, -35, 70, 70);

      // 绘制角色图片
      this.ctx.drawImage(frame, -player.w / 2, -player.h / 2, player.w, player.h);
      this.ctx.restore();
      return;
    }

    // 回退到代码绘制（图片未加载时）
    this.ctx.save();
    this.ctx.translate(px + player.w / 2, py + player.h / 2);

    const glow = this.ctx.createRadialGradient(0, 0, 5, 0, 0, 35);
    glow.addColorStop(0, 'rgba(255,221,87,0.3)');
    glow.addColorStop(1, 'rgba(255,221,87,0)');
    this.ctx.fillStyle = glow;
    this.ctx.fillRect(-35, -35, 70, 70);

    const legAnim = Math.sin(Date.now() * 0.01) * 5;
    this.ctx.fillStyle = '#2d3436';
    this.ctx.fillRect(-10, 12, 8, 16 + legAnim);
    this.ctx.fillRect(2, 12, 8, 16 - legAnim);

    this.ctx.fillStyle = '#e17055';
    this.ctx.fillRect(-12, 26 + legAnim, 12, 5);
    this.ctx.fillRect(0, 26 - legAnim, 12, 5);

    this.ctx.fillStyle = '#ff6b6b';
    this.ctx.beginPath();
    this.ctx.moveTo(-14, -8);
    this.ctx.lineTo(14, -8);
    this.ctx.lineTo(12, 14);
    this.ctx.lineTo(-12, 14);
    this.ctx.closePath();
    this.ctx.fill();

    const armAnim = Math.sin(Date.now() * 0.008) * 8;
    this.ctx.fillStyle = '#fdcb6e';
    this.ctx.save();
    this.ctx.translate(-14, -2);
    this.ctx.rotate((-30 + armAnim) * Math.PI / 180);
    this.ctx.fillRect(-4, 0, 8, 18);
    this.ctx.beginPath();
    this.ctx.arc(0, 6, 6, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
    this.ctx.save();
    this.ctx.translate(14, -2);
    this.ctx.rotate((30 - armAnim) * Math.PI / 180);
    this.ctx.fillRect(-4, 0, 8, 18);
    this.ctx.beginPath();
    this.ctx.arc(0, 6, 6, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    this.ctx.fillStyle = '#fdcb6e';
    this.ctx.beginPath();
    this.ctx.arc(0, -16, 11, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#2d3436';
    this.ctx.beginPath();
    this.ctx.arc(0, -20, 11, Math.PI, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#2d3436';
    this.ctx.beginPath();
    this.ctx.arc(-4 * f, -17, 2, 0, Math.PI * 2);
    this.ctx.arc(4 * f, -17, 2, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = '#2d3436';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.arc(0, -14, 5, 0.1, Math.PI - 0.1);
    this.ctx.stroke();

    this.ctx.strokeStyle = '#ff6b6b';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(0, -18, 12, Math.PI * 0.8, Math.PI * 0.2);
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawParticles() {
    for (let p of this.particles) {
      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y - this.cameraY, p.r * p.life, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
  }

  drawFloatingTexts() {
    for (let t of this.floatingTexts) {
      this.ctx.globalAlpha = t.life;
      this.ctx.fillStyle = t.color;
      this.ctx.font = 'bold 22px sans-serif';
      this.ctx.textAlign = 'left';
      this.ctx.shadowColor = '#ff6600';
      this.ctx.shadowBlur = 10;
      this.ctx.fillText(t.text, Math.max(10, Math.min(this.W - 200, t.x)), t.y);
      this.ctx.shadowBlur = 0;
    }
    this.ctx.globalAlpha = 1;
  }

  drawUI() {
    if (this.state !== 'playing') return;
    this.ctx.fillStyle = '#ffdd57';
    this.ctx.font = 'bold 22px sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.shadowColor = 'rgba(255,221,87,0.8)';
    this.ctx.shadowBlur = 10;
    this.ctx.fillText('🏆 高度: ' + this.score + 'm', 15, 35);
    this.ctx.fillText('💪 连跳: ' + this.combo, 15, 65);
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
    this.ctx.font = '14px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('滑动屏幕左右移动 | 连点两次二段跳', this.W / 2, this.H - 20);
  }

  drawStartScreen() {
    // 绘制主界面背景图
    if (images.bgMain && images.bgMain.width > 0) {
      // 计算缩放比例以适配屏幕
      const scale = Math.max(this.W / images.bgMain.width, this.H / images.bgMain.height);
      const imgW = images.bgMain.width * scale;
      const imgH = images.bgMain.height * scale;
      const imgX = (this.W - imgW) / 2;
      const imgY = (this.H - imgH) / 2;
      this.ctx.drawImage(images.bgMain, imgX, imgY, imgW, imgH);
    } else {
      // 图片未加载时使用默认背景
      this.drawBackground();
      this.ctx.fillStyle = 'rgba(10,10,46,0.95)';
      this.ctx.fillRect(0, 0, this.W, this.H);
    }

    // 如果角色面板显示中，隐藏主页面UI
    if (!this.showCharacterPanel) {
      // 标题文字
      this.ctx.fillStyle = '#ffdd57';
      this.ctx.font = 'bold 36px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.shadowColor = '#ffaa00';
      this.ctx.shadowBlur = 20;
      this.ctx.fillText('万秀彬跳跳楼', this.W / 2, this.H / 2 - 120);
      this.ctx.shadowBlur = 0;

      // 副标题
      this.ctx.fillStyle = '#ff6b6b';
      this.ctx.font = '20px sans-serif';
      this.ctx.fillText('💪 健身大佬の极限跳跃 💪', this.W / 2, this.H / 2 - 80);
      this.ctx.fillStyle = '#74b9ff';
      this.ctx.font = '16px sans-serif';
      this.ctx.fillText('看谁跳得高！全程为你疯狂打call！', this.W / 2, this.H / 2 - 50);

      // 开始按钮（位于角色区域下方）
      const btnWidth = 140;
      const btnHeight = 50;
      const btnX = this.W / 2 - btnWidth / 2;
      const btnY = this.H / 2 + 260;

      // 绘制按钮背景
      this.ctx.fillStyle = '#00d084';
      this.ctx.shadowColor = '#00d084';
      this.ctx.shadowBlur = 15;
      this.roundRect(btnX, btnY, btnWidth, btnHeight, 25);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      // 绘制按钮文字
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 20px sans-serif';
      this.ctx.fillText('开始游戏', this.W / 2, btnY + 32);

      // 保存开始按钮区域供触摸检测
      this.startBtnArea = {
        x: btnX,
        y: btnY,
        w: btnWidth,
        h: btnHeight
      };
    }

    // 底部图标按钮区域
    const iconSize = 50;
    const iconY = this.H - 100;
    const spacing = 80;
    const startX = this.W / 2 - spacing * 1.5;

    // 保存底部按钮区域供触摸检测
    this.bottomBtnArea = {
      shop: { x: startX, y: iconY, w: iconSize, h: iconSize },
      character: { x: startX + spacing, y: iconY, w: iconSize, h: iconSize },
      leaderboard: { x: startX + spacing * 2, y: iconY, w: iconSize, h: iconSize }
    };

    // 商店图标
    if (images.iconShop && images.iconShop.width > 0) {
      this.ctx.drawImage(images.iconShop, startX, iconY, iconSize, iconSize);
    } else {
      this.ctx.fillStyle = '#fd79a8';
      this.ctx.fillRect(startX, iconY, iconSize, iconSize);
    }
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px sans-serif';
    this.ctx.fillText('商店', startX + iconSize / 2, iconY + iconSize + 18);

    // 角色图标（高亮显示当前选中）
    if (this.showCharacterPanel) {
      this.ctx.fillStyle = 'rgba(116, 185, 255, 0.5)';
      this.ctx.fillRect(startX + spacing - 5, iconY - 5, iconSize + 10, iconSize + 10);
    }
    if (images.iconCharacter && images.iconCharacter.width > 0) {
      this.ctx.drawImage(images.iconCharacter, startX + spacing, iconY, iconSize, iconSize);
    } else {
      this.ctx.fillStyle = '#74b9ff';
      this.ctx.fillRect(startX + spacing, iconY, iconSize, iconSize);
    }
    this.ctx.fillStyle = '#fff';
    this.ctx.fillText('角色', startX + spacing + iconSize / 2, iconY + iconSize + 18);

    // 排行榜图标
    if (images.iconLeaderboard && images.iconLeaderboard.width > 0) {
      this.ctx.drawImage(images.iconLeaderboard, startX + spacing * 2, iconY, iconSize, iconSize);
    } else {
      this.ctx.fillStyle = '#55efc4';
      this.ctx.fillRect(startX + spacing * 2, iconY, iconSize, iconSize);
    }
    this.ctx.fillStyle = '#fff';
    this.ctx.fillText('排行', startX + spacing * 2 + iconSize / 2, iconY + iconSize + 18);

    // 根据状态显示当前角色或角色选择面板
    if (this.showCharacterPanel) {
      // 显示角色选择面板
      this.drawCharacterSelect();
    } else {
      // 显示当前选中角色
      this.drawCurrentCharacter();
    }
  }

  // 绘制当前选中的角色
  drawCurrentCharacter() {
    const charName = characterConfig.current;
    const charDisplayName = characterConfig.names[charName] || charName;
    const frames = characterConfig.frames[charName];

    // 角色显示区域
    const charBoxWidth = 120;
    const charBoxHeight = 140;
    const charBoxX = this.W / 2 - charBoxWidth / 2;
    const charBoxY = this.H / 2 + 100;

    // 绘制角色框背景
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.strokeStyle = 'rgba(255, 221, 87, 0.5)';
    this.ctx.lineWidth = 2;
    this.roundRect(charBoxX, charBoxY, charBoxWidth, charBoxHeight, 10);
    this.ctx.fill();
    this.ctx.stroke();

    // 绘制角色图片
    if (frames && frames[0] && frames[0].width > 0) {
      this.ctx.drawImage(frames[0], charBoxX + 28, charBoxY + 15, 64, 64);
    }

    // 绘制角色名称
    this.ctx.fillStyle = '#ffdd57';
    this.ctx.font = '16px sans-serif';
    this.ctx.fillText(charDisplayName, this.W / 2, charBoxY + 100);

    // 提示点击角色按钮
    this.ctx.fillStyle = '#aaa';
    this.ctx.font = '12px sans-serif';
    this.ctx.fillText('点击下方角色按钮切换', this.W / 2, charBoxY + 125);
  }

  // 绘制角色选择区域
  drawCharacterSelect() {
    const selectY = this.H / 2 + 80;
    const selectWidth = 120;
    const selectHeight = 140;
    const spacing = 140;
    const startX = this.W / 2 - spacing - selectWidth / 2;

    this.ctx.fillStyle = '#fff';
    this.ctx.font = '14px sans-serif';
    this.ctx.fillText('选择角色', this.W / 2, selectY - 20);

    // 绘制每个角色选项
    for (let i = 0; i < characterConfig.list.length; i++) {
      const charName = characterConfig.list[i];
      const x = startX + i * spacing;
      const y = selectY;
      const isSelected = characterConfig.current === charName;

      // 绘制选择框背景
      if (isSelected) {
        this.ctx.fillStyle = 'rgba(255, 221, 87, 0.3)';
        this.ctx.strokeStyle = '#ffdd57';
        this.ctx.lineWidth = 3;
      } else {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
      }
      this.ctx.fillRect(x, y, selectWidth, selectHeight);
      this.ctx.strokeRect(x, y, selectWidth, selectHeight);

      // 绘制角色预览图
      const frames = characterConfig.frames[charName];
      if (frames && frames[0] && frames[0].width > 0) {
        this.ctx.drawImage(frames[0], x + 28, y + 10, 64, 64);
      }

      // 绘制角色名称
      this.ctx.fillStyle = isSelected ? '#ffdd57' : '#fff';
      this.ctx.font = 'bold 14px sans-serif';
      this.ctx.fillText(characterConfig.names[charName] || charName, x + selectWidth / 2, y + selectHeight - 20);
    }
  }

  drawGameOverScreen() {
    this.drawBackground();
    this.ctx.fillStyle = 'rgba(10,10,46,0.95)';
    this.ctx.fillRect(0, 0, this.W, this.H);
    this.ctx.fillStyle = '#ffdd57';
    this.ctx.font = 'bold 32px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = '#ffaa00';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText('挑战结束！', this.W / 2, this.H / 2 - 100);
    this.ctx.shadowBlur = 0;
    this.ctx.font = 'bold 28px sans-serif';
    this.ctx.fillText('🏆 最终高度: ' + this.score + 'm', this.W / 2, this.H / 2 - 50);

    let finalMsg = "";
    if (this.score < 50) {
      finalMsg = this.playerName + "说：这才刚热身呢！💪\n再来一次，你可以的！";
    } else if (this.score < 200) {
      finalMsg = "不错不错！" + this.playerName + "的" + this.playerJob + "实力已经开始燃烧了！🔥\n继续加油，" + this.playerJob + "永不止步！";
    } else if (this.score < 500) {
      finalMsg = "厉害了！" + this.playerName + "的弹跳力令人叹为观止！💪💪\n这就是每天" + this.playerJob + "的成果！牛逼！";
    } else if (this.score < 1000) {
      finalMsg = "太强了！！！" + this.playerName + "已经是跳跃王者！！🏆\n" + this.playerJob + "牛逼牛逼牛逼！！！";
    } else if (this.score < 2000) {
      finalMsg = "逆天了！！！" + this.playerName + "の传说！！！\n" + this.playerJob + "界的神话！无人能敌！💪💪💪";
    } else {
      finalMsg = "不可思议！！！" + this.playerName + "突破了人类极限！！！\n你就是宇宙最强" + this.playerJob + "之王！！！🏆💪";
    }

    this.ctx.fillStyle = '#74b9ff';
    this.ctx.font = '16px sans-serif';
    const lines = finalMsg.split('\n');
    for (let i = 0; i < lines.length; i++) {
      this.ctx.fillText(lines[i], this.W / 2, this.H / 2 + i * 28);
    }
    this.ctx.fillStyle = '#ffdd57';
    this.ctx.font = '18px sans-serif';
    this.ctx.fillText('点击下方按钮选择操作', this.W / 2, this.H / 2 + 130);

    // 绘制重新开始按钮
    this.ctx.fillStyle = '#00d084';
    this.ctx.fillRect(this.W / 2 - 80, this.H / 2 + 155, 70, 35);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '16px sans-serif';
    this.ctx.fillText('重新开始', this.W / 2 - 45, this.H / 2 + 178);

    // 绘制返回主页按钮
    this.ctx.fillStyle = '#74b9ff';
    this.ctx.fillRect(this.W / 2 + 10, this.H / 2 + 155, 70, 35);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '16px sans-serif';
    this.ctx.fillText('返回主页', this.W / 2 + 45, this.H / 2 + 178);

    // 保存按钮区域供触摸检测使用
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
  }

  render() {
    this.ctx.clearRect(0, 0, this.W, this.H);
    let shakeX = 0, shakeY = 0;
    if (this.shakeTimer > 0) {
      shakeX = (Math.random() - 0.5) * this.shakeTimer;
      shakeY = (Math.random() - 0.5) * this.shakeTimer;
    }
    this.ctx.save();
    this.ctx.translate(shakeX, shakeY);

    if (this.state === 'start') {
      this.drawStartScreen();
    } else if (this.state === 'playing') {
      this.drawBackground();
      this.drawPlatforms();
      this.drawPlayer();
      this.drawParticles();
      this.drawFloatingTexts();
      this.drawUI();
    } else if (this.state === 'gameover') {
      this.drawGameOverScreen();
    }

    this.ctx.restore();
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
        return true;
      }
    }
    return false;
  }

  startGame() {
    this.generatePraises();
    this.initGame();
    this.state = 'playing';
    const _this = this;
    setTimeout(function() {
      _this.showFloatingText(_this.W / 2 - 80, _this.H / 2, _this.playerName + "出发！冲冲冲！💪");
    }, 500);
    setTimeout(function() {
      _this.showFloatingText(_this.W / 2 - 60, _this.H / 2 - 60, _this.playerJob + "牛逼！！！");
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
