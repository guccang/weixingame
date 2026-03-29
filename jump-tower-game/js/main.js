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
const { characterConfig, loadCharacter, getCharacterFrame, switchCharacter, STATE_TO_FRAME_INDEX } = require('./character/character');

// 职业配置
const { jobConfig, jobPraiseMap } = require('./runtime/jobconfig');

// 弹幕系统
const Barrage = require('./barrage/barrage');

// 主界面UI
const MainUI = require('./ui/mainUI');

// 控制系统
const Controls = require('./controls/controls');

// 游戏常量
const GAME_CONST = require('./game/constants');

// 音效管理
const Audio = require('./audio/audio');

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
    this.GRAVITY = 0.45;
    this.PLAYER_SPEED = 6;
    this.JUMP_FORCE = -15;
    this.BOOST_JUMP_FORCE = -22;
    this.DOUBLE_JUMP_FORCE = -18;

    this.score = 0;
    this.maxHeight = 0;
    this.combo = 0;
    this.cameraY = 0;
    this.lastPraiseTime = 0;
    this.lastMilestone = 0;
    this.shakeTimer = 0;
    this.praises = [];
    this.milestones = [];
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
    const n = this.playerName;
    const j = this.playerJob;
    this.praises = GAME_CONST.praiseTemplates.map(t => t.replace(/\{n\}/g, n).replace(/\{j\}/g, j));

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
    this.barrage.clear(); // 清空弹幕
    this.score = 0;
    this.maxHeight = 0;
    this.cameraY = this.H - 100 - this.H * 0.4;
    this.lastPraiseTime = 0;
    this.lastMilestone = 0;
    this.combo = 0;
    this.shakeTimer = 0;
    this.controls.reset(); // 重置控制系统状态

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

    if (this.controls.keys['ArrowLeft'] || this.controls.keys['a']) {
      player.vx = -this.PLAYER_SPEED;
      player.facing = -1;
    } else if (this.controls.keys['ArrowRight'] || this.controls.keys['d']) {
      player.vx = this.PLAYER_SPEED;
      player.facing = 1;
    } else {
      player.vx *= 0.85;
    }

    player.vy += this.GRAVITY;
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
            let jumpForce = this.JUMP_FORCE;

            if (p.type === 'boost') {
              jumpForce = this.BOOST_JUMP_FORCE;
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
                const praise = this.praises[Math.floor(Math.random() * this.praises.length)];
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

      for (let m of this.milestones) {
        if (this.score >= m.h && this.lastMilestone < m.h) {
          this.lastMilestone = m.h;
          this.barrage.show(this.W / 2 - 100, this.H / 2 - this.cameraY, m.msg, '#ff6b6b');
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

    this.barrage.update();

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
      this.ctx.fillText('万秀彬跳跳', this.W / 2, this.H / 2 - 120);
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
      job: { x: startX + spacing * 2, y: iconY, w: iconSize, h: iconSize },
      leaderboard: { x: startX + spacing * 3, y: iconY, w: iconSize, h: iconSize }
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

    // 职业图标（高亮显示当前选中）
    if (this.showJobPanel) {
      this.ctx.fillStyle = 'rgba(255, 107, 107, 0.5)';
      this.ctx.fillRect(startX + spacing * 2 - 5, iconY - 5, iconSize + 10, iconSize + 10);
    }
    this.ctx.fillStyle = jobConfig.colors[this.playerJob] || '#ff6b6b';
    this.ctx.fillRect(startX + spacing * 2, iconY, iconSize, iconSize);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px sans-serif';
    this.ctx.fillText('职业', startX + spacing * 2 + iconSize / 2, iconY + iconSize + 18);

    // 排行榜图标
    if (images.iconLeaderboard && images.iconLeaderboard.width > 0) {
      this.ctx.drawImage(images.iconLeaderboard, startX + spacing * 3, iconY, iconSize, iconSize);
    } else {
      this.ctx.fillStyle = '#55efc4';
      this.ctx.fillRect(startX + spacing * 3, iconY, iconSize, iconSize);
    }
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px sans-serif';
    this.ctx.fillText('排行', startX + spacing * 3 + iconSize / 2, iconY + iconSize + 18);

    // 根据状态显示面板
    if (this.showCharacterPanel) {
      this.drawCharacterSelect();
    } else if (this.showJobPanel) {
      this.drawJobSelect();
    } else {
      this.drawCurrentCharacter();
    }
  }

  // 绘制当前选中的角色和职业
  drawCurrentCharacter() {
    const charName = characterConfig.current;
    const charDisplayName = characterConfig.names[charName] || charName;
    const frames = characterConfig.frames[charName];

    // 角色显示区域
    const charBoxWidth = 120;
    const charBoxHeight = 140;
    const charBoxX = this.W / 2 - charBoxWidth - 10;
    const charBoxY = this.H / 2 + 100;

    // 职业显示区域
    const jobBoxWidth = 120;
    const jobBoxHeight = 140;
    const jobBoxX = this.W / 2 + 10;
    const jobBoxY = this.H / 2 + 100;

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
    this.ctx.fillText(charDisplayName, charBoxX + charBoxWidth / 2, charBoxY + 100);

    // 绘制职业框背景
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.strokeStyle = 'rgba(255, 107, 107, 0.5)';
    this.ctx.lineWidth = 2;
    this.roundRect(jobBoxX, jobBoxY, jobBoxWidth, jobBoxHeight, 10);
    this.ctx.fill();
    this.ctx.stroke();

    // 绘制职业图标
    this.ctx.fillStyle = jobConfig.colors[this.playerJob] || '#ff6b6b';
    this.ctx.beginPath();
    this.ctx.arc(jobBoxX + jobBoxWidth / 2, jobBoxY + 40, 25, 0, Math.PI * 2);
    this.ctx.fill();

    // 绘制职业名称
    this.ctx.fillStyle = '#ffdd57';
    this.ctx.font = '16px sans-serif';
    this.ctx.fillText(this.playerJob, jobBoxX + jobBoxWidth / 2, jobBoxY + 100);
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

  // 绘制职业选择面板
  drawJobSelect() {
    const selectY = this.H / 2 + 80;
    const selectWidth = 100;
    const selectHeight = 80;
    const spacing = 120;
    const startX = this.W / 2 - (jobConfig.list.length * spacing) / 2;

    this.ctx.fillStyle = '#fff';
    this.ctx.font = '14px sans-serif';
    this.ctx.fillText('选择职业', this.W / 2, selectY - 20);

    // 绘制每个职业选项
    for (let i = 0; i < jobConfig.list.length; i++) {
      const jobName = jobConfig.list[i];
      const x = startX + i * spacing;
      const y = selectY;
      const isSelected = jobConfig.current === jobName;

      // 绘制选择框背景
      if (isSelected) {
        this.ctx.fillStyle = 'rgba(255, 107, 107, 0.3)';
        this.ctx.strokeStyle = '#ff6b6b';
        this.ctx.lineWidth = 3;
      } else {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
      }
      this.roundRect(x, y, selectWidth, selectHeight, 10);
      this.ctx.fill();
      this.ctx.stroke();

      // 绘制职业图标
      this.ctx.fillStyle = jobConfig.colors[jobName] || '#ff6b6b';
      this.ctx.beginPath();
      this.ctx.arc(x + selectWidth / 2, y + 25, 18, 0, Math.PI * 2);
      this.ctx.fill();

      // 绘制职业名称
      this.ctx.fillStyle = isSelected ? '#ffdd57' : '#fff';
      this.ctx.font = 'bold 14px sans-serif';
      this.ctx.fillText(jobName, x + selectWidth / 2, y + selectHeight - 15);
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
      this.barrage.draw(this.ctx, this.W);
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
