// 控制系统

class Controls {
  constructor(game) {
    this.game = game;
    this.touchStartX = null;
    this.touchStartY = null;
    this.lastDeltaX = 0;
    this.lastDeltaY = 0;
    this.keys = {};
    this.canDoubleJump = false;
    this.hasDoubleJumped = false;
    this.tapCount = 0;
    this.lastTapTime = 0;
    this.isSlidingDown = false;

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

        // 蓄力冲刺期间只记录触摸位置，不处理其他逻辑
        if (_this.game.chargeDashing) return;

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

        // 保存滑动距离
        _this.lastDeltaX = deltaX;
        _this.lastDeltaY = deltaY;

        // 滑动下落（非冲刺期间）
        if (!_this.game.chargeDashing && _this.game.state === 'playing' && deltaY > 30 && !_this.keys['ArrowLeft'] && !_this.keys['ArrowRight'] && !_this.isSlidingDown) {
          if (_this.game.player) {
            // 使用技能系统触发下滑
            _this.game.skillSystem.onGesture(0, deltaY);
            _this.isSlidingDown = true;
          }
        }

        // 左右移动（冲刺期间也允许）
        if (deltaX < -30) {
          _this.keys['ArrowLeft'] = true;
          _this.keys['ArrowRight'] = false;
        } else if (deltaX > 30) {
          _this.keys['ArrowLeft'] = false;
          _this.keys['ArrowRight'] = true;
        } else if (!_this.game.chargeDashing) {
          _this.keys['ArrowLeft'] = false;
          _this.keys['ArrowRight'] = false;
        }
      }
    });

    // 触摸结束
    wx.onTouchEnd(function(e) {
      // 处理手势结束时的技能触发
      if (_this.touchStartX !== null && _this.touchStartY !== null && _this.game.state === 'playing') {
        // 计算最终滑动方向并触发技能
        if (!_this.isSlidingDown) {
          _this.game.skillSystem.onGesture(_this.lastDeltaX, _this.lastDeltaY);
        }
      }
      _this.keys['ArrowLeft'] = false;
      _this.keys['ArrowRight'] = false;
      _this.touchStartX = null;
      _this.touchStartY = null;
      _this.lastDeltaX = 0;
      _this.lastDeltaY = 0;
      _this.isSlidingDown = false;
    });
  }

  doDoubleJump() {
    if (!this.game.player || !this.canDoubleJump || this.hasDoubleJumped) return;
    this.hasDoubleJumped = true;
    // 使用技能系统触发二段跳
    this.game.skillSystem.triggerDoubleJump();
  }

  reset() {
    this.canDoubleJump = false;
    this.hasDoubleJumped = false;
    this.tapCount = 0;
    this.lastTapTime = 0;
    this.lastDeltaX = 0;
    this.lastDeltaY = 0;
  }
}

module.exports = Controls;
