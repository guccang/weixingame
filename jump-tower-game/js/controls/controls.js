// 控制系统

class Controls {
  constructor(game) {
    this.game = game;
    this.touchStartX = null;
    this.touchStartY = null;
    this.keys = {};
    this.canDoubleJump = false;
    this.hasDoubleJumped = false;
    this.tapCount = 0;
    this.lastTapTime = 0;

    this.initInput();
  }

  initInput() {
    var _this = this;

    // 触摸开始 - 使用微信小游戏 API
    wx.onTouchStart(function(e) {
      var touches = e.touches;
      if (touches && touches.length > 0) {
        _this.touchStartX = touches[0].clientX;
        _this.touchStartY = touches[0].clientY;
        var touchX = touches[0].clientX;
        var touchY = touches[0].clientY;

        // 在主界面检测按钮和角色选择点击
        if (_this.game.state === 'start') {
          if (_this.game.mainUI.handleTouch(touchX, touchY)) {
            return;
          }
        }

        // 游戏结束时检测按钮点击
        if (_this.game.state === 'gameover') {
          if (_this.game.mainUI.handleGameOverTouch(touchX, touchY)) {
            return;
          }
        }
      }
      // 开始或重新开始游戏
      if (_this.game.state === 'start' || _this.game.state === 'gameover') {
        // 不在这里自动开始游戏，由mainUI处理开始按钮点击
      } else if (_this.game.state === 'playing' && _this.canDoubleJump && !_this.hasDoubleJumped) {
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

    // 触摸移动
    wx.onTouchMove(function(e) {
      var touches = e.touches;
      if (touches && touches.length > 0 && _this.touchStartX !== null) {
        var currentX = touches[0].clientX;
        var currentY = touches[0].clientY;
        var deltaX = currentX - _this.touchStartX;
        var deltaY = currentY - _this.touchStartY;

        // 滑动下落
        if (_this.game.state === 'playing' && deltaY > 30 && !_this.keys['ArrowLeft'] && !_this.keys['ArrowRight']) {
          if (_this.game.player) {
            _this.game.player.vy = _this.game.SLIDE_FALL_FORCE;
          }
        }

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

    // 触摸结束
    wx.onTouchEnd(function(e) {
      _this.keys['ArrowLeft'] = false;
      _this.keys['ArrowRight'] = false;
      _this.touchStartX = null;
      _this.touchStartY = null;
    });
  }

  doDoubleJump() {
    if (!this.game.player || !this.canDoubleJump || this.hasDoubleJumped) return;
    this.hasDoubleJumped = true;
    this.game.player.vy = this.game.DOUBLE_JUMP_FORCE;
    this.game.spawnParticles(this.game.player.x + this.game.player.w / 2, this.game.player.y + this.game.player.h, '#fd79a8', 12);
    this.game.barrage.show(this.game.player.x, this.game.player.y - this.game.cameraY - 30, "二段跳！");
  }

  reset() {
    this.canDoubleJump = false;
    this.hasDoubleJumped = false;
    this.tapCount = 0;
    this.lastTapTime = 0;
  }
}

module.exports = Controls;
