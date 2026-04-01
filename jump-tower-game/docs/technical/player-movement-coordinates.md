# 角色移动与屏幕坐标系统

> 文档版本: 1.0.0
> 创建时间: 2026-04-02
> 最后更新: 2026-04-02

---

## 1. 坐标系概述

### 1.1 游戏坐标系

跳跳楼游戏采用标准屏幕坐标系：

| 特性 | 值 |
|------|---|
| 原点 | 左上角 (0, 0) |
| X轴 | 向右递增 |
| Y轴 | **向下**递增 |
| 单位 | 像素（pixel） |

```
(0,0) ──────→ X+
  │
  │    ┌─────────┐
  │    │ 玩家    │  ← y 向下增长
  │    └─────────┘
  │         ↓
  ↓        Y+
```

### 1.2 世界坐标与屏幕坐标

游戏采用 **垂直滚动世界** 模式，相机只上下移动：

```
世界坐标系：玩家实际 Y 位置（随游戏高度增长）
屏幕坐标系：Canvas 渲染 Y = worldY - cameraY
```

**关键公式**：
```javascript
screenY = worldY - cameraY
```

**代码位置**: `js/drawer/player.js:15-18`
```javascript
const py = player.y - cameraY;  // 世界坐标转屏幕坐标
const px = player.x;           // X坐标不变（相机只上下移动）
```

### 1.3 触控坐标系

微信小游戏触控事件返回的坐标同样是屏幕坐标系：

```javascript
wx.onTouchStart((res) => {
  res.touches[0].clientX  // 相对于屏幕左边缘
  res.touches[0].clientY  // 相对于屏幕上边缘
})
```

---

## 2. 玩家对象数据结构

**文件**: `js/player/player.js:16-30`

```javascript
function createPlayer(W, H) {
  return {
    x: W / 2 - 32,      // 世界坐标 X（屏幕中心为基准）
    y: H - 100,         // 世界坐标 Y（底部上方100像素）
    w: 64, h: 64,        // 宽度、高度
    vx: 0,               // 水平速度
    vy: 0,               // 垂直速度
    facing: 1,            // 朝向：1=右，-1=左
    state: 'idle',        // 状态：idle/jump/rise/fall/land
    prevState: 'idle',   // 之前的状态
    stateTimer: 0,       // 状态计时器
    character: characterConfig.current  // 当前角色名
  };
}
```

---

## 3. 移动逻辑详解

### 3.1 水平移动

**文件**: `js/physics/player.js:32-42`

```javascript
function updateHorizontalMovement(player, controls) {
  if (controls.keys['ArrowLeft'] || controls.keys['a']) {
    player.vx = -physics.PLAYER_SPEED;  // 负值 = 向左
    player.facing = -1;
  } else if (controls.keys['ArrowRight'] || controls.keys['d']) {
    player.vx = physics.PLAYER_SPEED;   // 正值 = 向右
    player.facing = 1;
  } else {
    player.vx *= physics.FRICTION;       // 无输入时应用摩擦力减速
  }
}
```

**特点**：
- 速度固定为 `PLAYER_SPEED`（6像素/帧）
- 无输入时摩擦系数 `FRICTION`（0.85）平滑减速
- `facing` 属性控制角色朝向，影响渲染翻转

### 3.2 重力系统

**文件**: `js/physics/player.js:48-54`

```javascript
function applyGravity(player) {
  player.vy += physics.GRAVITY;        // 每帧添加重力加速度

  // 限制最大下落速度，防止速度过快
  if (player.vy > physics.MAX_FALL_SPEED) {
    player.vy = physics.MAX_FALL_SPEED;
  }
}
```

### 3.3 位置更新

**文件**: `js/physics/player.js:61-72`

```javascript
function updatePosition(player, screenWidth) {
  player.x += player.vx;
  player.y += player.vy;

  // 屏幕边界循环（无尽跑酷模式特色）
  if (player.x > screenWidth) {
    player.x = -player.w;              // 从左边出去，右边出现
  }
  if (player.x + player.w < 0) {
    player.x = screenWidth;            // 从左边出去，右边出现
  }
}
```

**特点**：玩家可以在屏幕左右边缘循环穿越，形成无尽跑酷效果。

### 3.4 跳跃触发

**文件**: `js/player/player.js:82-133`

```javascript
function handlePlatformCollisions(player, platforms, game, now) {
  if (!isFalling(player)) return;

  for (let p of platforms) {
    if (platformPhysics.checkCollision(player, p, now, false)) {
      // 碰撞后重置位置到平台顶部
      player.y = p.y - player.h;

      // 施加跳跃力
      let jumpForce = platformPhysics.handlePlatformJump(player, p, physics.constants);
      player.vy = jumpForce;  // 负值 = 向上

      // 允许二段跳
      game.controls.canDoubleJump = true;
    }
  }
}
```

---

## 4. 相机跟随系统

### 4.1 相机更新逻辑

**文件**: `js/player/player.js:140-149`

```javascript
function updateCamera(player, game) {
  // 目标相机位置：玩家位于屏幕40%高度处
  const targetCam = player.y - game.H * 0.4;

  // 向上跟随（玩家上升时相机跟上）
  if (targetCam < game.cameraY) {
    game.cameraY += (targetCam - game.cameraY) * 0.25;  // 平滑插值
  }

  // 安全区检测：玩家在屏幕上太往上时，强制移动相机
  const playerScreenY = player.y - game.cameraY;
  if (playerScreenY < 50) {
    game.cameraY = player.y - 50;
  }
}
```

### 4.2 相机特性

| 特性 | 说明 |
|------|------|
| 向上跟随 | 玩家上升时相机跟随，下落时不跟随 |
| 平滑插值 | 系数 0.25，渐变过渡避免抖动 |
| 安全区 | 玩家屏幕 Y < 50 时强制跟随 |
| 目标位置 | 玩家位于屏幕 40% 高度处 |

### 4.3 相机坐标系转换

```
┌─────────────────────────────────┐
│                                 │
│         屏幕区域                 │
│                                 │
│    玩家屏幕Y = worldY - cameraY │
│                                 │
│                                 │
│─────────────────────────────────│  ← cameraY = worldY - H*0.4
│                                 │
│         世界区域                 │
│    (玩家实际位置)               │
└─────────────────────────────────┘
```

---

## 5. 触控输入处理

### 5.1 触摸事件处理

**文件**: `js/controls/controls.js:25-77`

```javascript
// 触摸开始
wx.onTouchStart(function(e) {
  var touches = e.touches;
  if (touches && touches.length > 0) {
    _this.touchStartX = touches[0].clientX;  // 屏幕坐标
    _this.touchStartY = touches[0].clientY;  // 屏幕坐标
    // ...
  }
});

// 触摸移动 - 滑动手势识别
wx.onTouchMove(function(e) {
  var touches = e.touches;
  if (touches && touches.length > 0 && _this.touchStartX !== null) {
    var currentX = touches[0].clientX;
    var currentY = touches[0].clientY;
    var deltaX = currentX - _this.touchStartX;
    var deltaY = currentY - _this.touchStartY;

    // 水平滑动超过30像素触发左右移动
    if (deltaX < -30) {
      _this.keys['ArrowLeft'] = true;
    } else if (deltaX > 30) {
      _this.keys['ArrowRight'] = true;
    }

    // 下滑触发快速下落
    if (deltaY > 30 && !_this.keys['ArrowLeft'] && !_this.keys['ArrowRight']) {
      _this.game.skillSystem.onGesture(0, deltaY);
    }
  }
});
```

### 5.2 手势识别阈值

| 手势 | 阈值 | 触发动作 |
|------|------|---------|
| 左滑 | deltaX < -30 | 向左移动 |
| 右滑 | deltaX > 30 | 向右移动 |
| 下滑 | deltaY > 30 | 快速下落/滑铲技能 |

---

## 6. 物理常量

**文件**: `js/physics/constants.js`

| 常量 | 值 | 说明 |
|------|-----|------|
| GRAVITY | 0.45 | 重力加速度（每帧添加） |
| PLAYER_SPEED | 6 | 水平移动速度（像素/帧） |
| JUMP_FORCE | -15 | 跳跃力度（负值=向上） |
| BOOST_JUMP_FORCE | -22 | 火箭平台跳跃力度 |
| DOUBLE_JUMP_FORCE | -18 | 二段跳力度 |
| SLIDE_FALL_FORCE | 20 | 下滑快速下落力度 |
| MAX_FALL_SPEED | 20 | 最大下落速度限制 |
| FRICTION | 0.85 | 摩擦系数（无输入时速度衰减） |
| PARTICLE_GRAVITY | 0.15 | 粒子重力 |

---

## 7. 玩家状态机

**文件**: `js/physics/player.js:78-111`

```javascript
function updatePlayerState(player) {
  if (!player) return;
  const prevState = player.state;

  // 根据 vy（垂直速度）判断状态
  if (player.vy < -5) {
    // 快速上升 - 起跳或上升
    if (prevState === 'idle' || prevState === 'charge') {
      player.state = 'jump';
      player.stateTimer = 5;
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
      player.stateTimer = 8;
    } else if (player.stateTimer <= 0) {
      player.state = 'idle';
    }
  }
}
```

**状态流转**：

```
idle ←──────────┐
  │             │
  │ (起跳)       │
  ↓             │
jump ─────────→ rise ─────────→ fall
  │             │             │
  │             │ (落地)       │
  │             ↓             │
  │           land ─────────→ idle
  │             │
  └─────────────┘
```

---

## 8. 游戏主循环中的角色更新

**文件**: `js/main.js:203-256`

```javascript
update() {
  if (this.state !== 'playing' || !this.player) return;

  // 1. 更新水平移动
  player.updateHorizontalMovement(this.player, this.controls);

  // 2. 应用重力
  player.applyGravity(this.player);

  // 3. 更新位置
  player.updatePosition(this.player, this.W);

  // 4. 更新玩家动画状态
  this.updatePlayerState();

  // 5. 处理平台碰撞（触发跳跃）
  player.handlePlatformCollisions(this.player, this.platforms, this, Date.now());

  // 6. 更新相机跟随
  player.updateCamera(this.player, this);

  // 7. 更新分数
  player.updateScore(this.player, this);

  // 8. 生成新平台
  this.generatePlatforms();

  // 9. 更新技能系统
  this.skillSystem.update(16.67);

  // 10. 检测游戏结束
  if (player.checkGameOver(this.player, this)) {
    return;
  }
}
```

---

## 9. 渲染坐标链

```
┌─────────────────────────────────────────────────────┐
│                  游戏循环 update()                    │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│ player.updateHorizontalMovement()                    │
│   ← 读取 controls.keys (触控/按键状态)              │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│ player.applyGravity()                               │
│   ← vy += GRAVITY                                   │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│ player.updatePosition()                             │
│   ← x += vx, y += vy                               │
│   ← 屏幕边界循环处理                                 │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│ handlePlatformCollisions()                          │
│   ← 碰撞检测，触发跳跃、重置位置                     │
│   ← 重置 canDoubleJump                              │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│ player.updateCamera()                               │
│   ← 更新 cameraY                                    │
│   ← 玩家屏幕Y < 50 时强制跟随                        │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                  渲染循环 render()                   │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│ drawPlayer(ctx, player, cameraY)                    │
│   ← 世界坐标 - cameraY = 屏幕坐标                    │
│   ← 根据 facing 翻转渲染                             │
│   ← 根据 state 选择动画帧                            │
└─────────────────────────────────────────────────────┘
```

---

## 10. 关键文件索引

| 功能 | 文件路径 |
|------|---------|
| 玩家创建/碰撞/相机 | `js/player/player.js` |
| 物理/移动逻辑/状态机 | `js/physics/player.js` |
| 物理常量 | `js/physics/constants.js` |
| 触控输入处理 | `js/controls/controls.js` |
| 技能系统/手势识别 | `js/skill/skill.js` |
| 角色绘制 | `js/drawer/player.js` |
| 平台绘制 | `js/drawer/platform.js` |
| 游戏主循环 | `js/main.js` |
| 平台物理/碰撞 | `js/physics/platform.js` |
| 屏幕适配 | `js/render.js` |

---

## 11. 坐标系转换汇总

### 渲染时的坐标转换

```javascript
// 世界坐标 → 屏幕坐标
screenX = worldX;
screenY = worldY - cameraY;

// 屏幕坐标 → 世界坐标
worldX = screenX;
worldY = screenY + cameraY;
```

### 触控坐标到游戏坐标

```javascript
// 微信返回的触控坐标（已是屏幕坐标）
touchX = touches[0].clientX;
touchY = touches[0].clientY;

// 计算滑动距离
deltaX = currentX - touchStartX;
deltaY = currentY - touchStartY;

// 手势识别后设置按键状态
if (deltaX < -30) keys['ArrowLeft'] = true;
if (deltaX > 30) keys['ArrowRight'] = true;
```

---

## 12. 平台碰撞系统

### 12.1 AABB碰撞检测算法

**文件**: `js/physics/platform.js:85-94`

游戏采用 **AABB（Axis-Aligned Bounding Box）** 矩形碰撞检测：

```javascript
function checkCollision(player, platform, time, isChargingDash) {
  const px = getMovingPlatformX(platform, time);  // 移动平台实时X坐标
  const vyTolerance = isChargingDash ? Math.abs(player.vy) + 50 : player.vy + 5;

  return (
    player.x + player.w > px &&                    // 玩家右边界 > 平台左边界
    player.x < px + platform.w &&                  // 玩家左边界 < 平台右边界
    player.y + player.h >= platform.y &&           // 玩家底部 >= 平台顶部
    player.y + player.h <= platform.y + platform.h + vyTolerance  // 玩家底部 <= 平台底部+容差
  );
}
```

**碰撞检测示意图**：

```
玩家 (x, y, w, h)
┌────────────┐
│            │         ┌─────────────────┐
│            │         │                 │
└────────────┘         └─────────────────┘
    │                        │
    └────────────────────────┘
         player.x + player.w > px  (右边界检测)
         player.x < px + platform.w  (左边界检测)
```

**vyTolerance容差机制**：
| 状态 | 容差值 | 说明 |
|------|--------|------|
| 普通下落 | `player.vy + 5` | 允许一定速度穿透 |
| 蓄力冲刺 | `Math.abs(player.vy) + 50` | 更宽松的碰撞检测 |

### 12.2 碰撞判定条件

**下落状态判断** (`js/physics/player.js:118-120`)：

```javascript
function isFalling(player) {
  return player.vy > 0;  // 只有下落时才能触发碰撞
}
```

**调用位置** (`js/player/player.js:96`)：

```javascript
if (!isFalling(player)) return;  // 上升或静止时跳过碰撞检测
```

**Y轴碰撞边界**：
```
         平台
  ┌──────────────────┐
  │ platform.y       │ ← 平台顶部 (碰撞触发线)
  │                  │
  │ platform.y +     │
  │ platform.h       │ ← 平台底部
  └──────────────────┘

  玩家底部必须满足:
  player.y + player.h >= platform.y  (接触到平台)
  player.y + player.h <= platform.y + platform.h + vyTolerance  (不穿过平台底部)
```

### 12.3 碰撞响应处理

**文件**: `js/player/player.js:82-133`

#### 蓄力冲刺状态（撞飞平台）

```javascript
if (game.chargeDashing) {
  for (let p of platforms) {
    if (!p.dead && platformPhysics.checkCollision(player, p, now, true)) {
      p.vy = -20;                              // 平台向上飞
      p.vx = (Math.random() - 0.5) * 15;      // 随机水平速度
      p.va = (Math.random() - 0.5) * 0.5;    // 随机角速度
      p.falling = true;                       // 标记为被撞飞状态
    }
  }
  return;  // 冲刺期间不处理普通跳跃
}
```

#### 普通平台碰撞响应

```javascript
for (let p of platforms) {
  if (platformPhysics.checkCollision(player, p, now, false)) {
    // 1. 重置玩家位置到平台顶部
    player.y = p.y - player.h;

    // 2. 根据平台类型施加跳跃力
    let jumpForce = platformPhysics.handlePlatformJump(player, p, physics.constants);
    player.vy = jumpForce;  // 负值 = 向上

    // 3. 允许二段跳
    game.controls.canDoubleJump = true;

    // 4. 特殊平台处理
    if (p.type === 'crumble' && !p.crumbling) {
      p.crumbling = true;
      p.crumbleTimer = setTimeout(() => { p.dead = true; }, 300, p);
    }
  }
}
```

### 12.4 平台类型与跳跃力度

**文件**: `js/platform/platformConfig.js:29-35` 和 `js/physics/platform.js:97-110`

| 平台类型 | 弹跳系数 | 跳跃力度 | 说明 |
|---------|---------|---------|------|
| normal | 1.0 | -15 | 普通台子 |
| boost | 1.5 | -22 | 弹跳台子（火箭台） |
| moving | 1.0 | -15 | 移动台子 |
| crumble | 0.8 | -12 | 岩石台子（踩后消失） |
| ground | 1.0 | -15 | 地面 |

**跳跃力计算** (`js/physics/platform.js:97-110`)：

```javascript
function handlePlatformJump(player, platform, constants) {
  const bounceForce = platform.bounceForce || 1.0;
  const baseForce = platform.type === 'boost'
    ? constants.BOOST_JUMP_FORCE    // 火箭台: -22
    : constants.JUMP_FORCE;         // 普通台: -15

  return baseForce * bounceForce;   // 乘以弹跳系数
}
```

### 12.5 移动平台坐标计算

**文件**: `js/physics/platform.js:60-68`

```javascript
function getMovingPlatformX(platform, time) {
  if (platform.type === 'moving' && !platform.falling && platform.moveRange > 0) {
    const speed = platform.moveSpeed || 3.0;
    const range = platform.moveRange || 60;
    // 简谐运动: x = baseX + sin(time * speed + y) * range
    return platform.x + Math.sin(time * 0.001 * speed + platform.y) * range;
  }
  return platform.x;
}
```

**特点**：
- 移动范围随 `y` 值变化（不同高度相位不同）
- 玩家可以在平台移动过程中跳到平台上

### 12.6 特殊平台碰撞

#### 火箭平台 (boost)

**触发技能** (`js/skill/skill.js:445-460`)：

```javascript
if (platform && platform.type === 'boost') {
  skillId = 'boost';
  this.game.shakeTimer = 10;  // 屏幕震动
  this.game.barrage.show("火箭弹射！" + this.game.playerName + "起飞！！！", '#ffdd57');
}
```

**技能配置** (`js/skill/skillData.js:117-131`)：

```javascript
'boost': {
  'name': '火箭弹射',
  'frameIndex': 2,
  'sound': 'audio/jump.mp3',
  'particle': { 'color': '#ffdd57', 'count': 20, 'speed': 8 },
  'barrage': '火箭弹射！',
  'shake': 10,
  'physics': { 'type': 'boost', 'force': -22 }
}
```

#### 岩石台子 (crumble)

**踩后消失** (`js/player/player.js:100-103`)：

```javascript
if (p.type === 'crumble' && !p.crumbling) {
  p.crumbling = true;
  p.crumbleTimer = setTimeout(() => { p.dead = true; }, 300);
}
```

**绘制效果** (`js/drawer/platform.js:30-32`)：半透明状态

#### 滑铲状态 (slide)

**快速下落** (`js/skill/skill.js:76-89`)：

```javascript
'slide': {
  'name': '下滑',
  'frameIndex': 4,
  'particle': { 'color': '#88ccff', 'count': 10, 'speed': 6 },
  'physics': { 'type': 'slide', 'force': 20 },
  'chargeRelease': true
}
```

**触控检测** (`js/controls/controls.js:93-101`)：

```javascript
if (deltaY > 30 && !_this.keys['ArrowLeft'] && !_this.keys['ArrowRight'] &&
    !_this.isSlidingDown && (now - _this.lastSlideTime > 200)) {
  _this.game.skillSystem.onGesture(0, deltaY);
  _this.isSlidingDown = true;
}
```

### 12.7 碰撞优化

#### 可见性裁剪

**绘制优化** (`js/drawer/platform.js:20`)：

```javascript
const sy = p.y - cameraY;
if (sy < -20 || sy > ctx.canvas.height + 20) continue;  // 屏幕外平台跳过
```

#### 碰撞检测优化

| 优化策略 | 说明 |
|---------|------|
| 下落检测 | 只在 `vy > 0` 时检测 |
| 平台清理 | 平台 `y >= cameraY + H + 200` 时移除 |
| 蓄力冲刺 | 直接撞飞，简化判断 |

#### 平台清理

**文件**: `js/level/level.js:71-75`

```javascript
const toRemove = this.platforms.filter(p =>
  p.dead || p.y >= cameraY + H + 200
);
toRemove.forEach(p => { /* 移除平台 */ });
```

### 12.8 碰撞相关常量配置

**物理常量** (`js/physics/constants.js`)：

```javascript
module.exports = {
  GRAVITY: 0.45,           // 重力加速度
  PLAYER_SPEED: 6,          // 左右移动速度
  JUMP_FORCE: -15,         // 普通跳跃力度
  BOOST_JUMP_FORCE: -22,   // 弹跳平台力度
  DOUBLE_JUMP_FORCE: -18,   // 二段跳力度
  SLIDE_FALL_FORCE: 20,    // 下滑快速下落力度
  PARTICLE_GRAVITY: 0.15,  // 粒子重力
  MAX_FALL_SPEED: 20,      // 最大下落速度
  FRICTION: 0.85           // 摩擦系数
};
```

**平台表格配置** (`tables/Platforms.txt`)：

| Id | Name | Type | BounceForce | MoveSpeed | MoveRange |
|----|------|------|-------------|-----------|-----------|
| 1 | 普通台子 | normal | 1.0 | 0 | 0 |
| 2 | 冰块台子 | normal | 1.0 | 0 | 0 |
| 3 | 岩石台子 | crumble | 0.8 | 0 | 0 |
| 4 | 移动台子 | moving | 1.0 | 3.0 | 100 |
| 5 | 弹跳台子 | boost | 1.5 | 0 | 0 |

### 12.9 碰撞系统文件索引

| 文件路径 | 功能 |
|---------|------|
| `js/physics/platform.js` | AABB碰撞检测、平台跳跃处理、移动平台坐标计算 |
| `js/physics/player.js` | 玩家物理状态、重力应用、下落判断 |
| `js/player/player.js` | 碰撞响应调度、蓄力冲刺处理、平台类型响应 |
| `js/platform/platformConfig.js` | 平台配置加载、皮肤资源管理 |
| `js/skill/skill.js` | 技能系统：火箭弹射、滑铲、蓄力冲刺 |
| `js/skill/skillData.js` | 技能配置数据 |
| `js/drawer/platform.js` | 平台绘制、可见性裁剪 |
| `js/level/level.js` | 关卡生成、平台清理 |

---

## 更新记录

| 版本 | 日期 | 描述 |
|------|------|------|
| 1.0.0 | 2026-04-02 | 初始文档，包含角色移动与坐标系统完整解析 |
| 1.1.0 | 2026-04-02 | 新增平台碰撞系统详解章节（12节） |
