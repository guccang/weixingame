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
    this.lastSlideTime = 0;
    this.skipTouchEndSkill = false;
    this.startUiTouchHandled = false;

    this.initInput();
  }

  initInput() {
    var _this = this;

    // 触摸开始 - 使用微信小游戏 API
    wx.onTouchStart(function(e) {
      _this.startUiTouchHandled = false;
      var touches = e.touches;
      if (touches && touches.length > 0) {
        _this.touchStartX = touches[0].clientX;
        _this.touchStartY = touches[0].clientY;
        var touchX = touches[0].clientX;
        var touchY = touches[0].clientY;

        if (_this.game.state === 'playing' && _this.game.runDirector && _this.game.runDirector.isBuffOfferOpen()) {
          _this.skipTouchEndSkill = true;
          _this.game.handleRunOfferTouch(touchX, touchY);
          return;
        }

        // 蓄力冲刺期间只记录触摸位置，不处理其他逻辑
        if (_this.game.chargeDashing) return;
        if (_this.game.isControlLocked()) return;

        // 在主界面检测按钮和角色选择点击
        if (_this.game.state === 'start') {
          if (_this.game.panelManager && _this.game.panelManager.isOpen('showDebugPanel')) {
            return;
          }
          if (_this.game.mainUI.handleTouch(touchX, touchY)) {
            _this.startUiTouchHandled = true;
            return;
          }
        }

        // 游戏结束时检测按钮点击
        if (_this.game.state === 'gameover') {
          if (_this.game.mainUI.handleGameOverTouch(touchX, touchY)) {
            _this.startUiTouchHandled = true;
            return;
          }
        }

      }
      // 开始或重新开始游戏
      if (_this.game.state === 'start' || _this.game.state === 'gameover') {
        // 不在这里自动开始游戏，由mainUI处理开始按钮点击
      } else if (_this.game.state === 'playing' && !_this.game.isControlLocked() && _this.game.doubleJumpUnlocked && _this.canDoubleJump && !_this.hasDoubleJumped) {
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
        if (_this.game.state === 'playing' && _this.game.runDirector && _this.game.runDirector.isBuffOfferOpen()) {
          _this.keys['ArrowLeft'] = false;
          _this.keys['ArrowRight'] = false;
          return;
        }

        if (_this.game.isControlLocked()) {
          _this.keys['ArrowLeft'] = false;
          _this.keys['ArrowRight'] = false;
          return;
        }

        var touchX = touches[0].clientX;
        var touchY = touches[0].clientY;

        // 开始界面：处理面板滚动和面板守卫
        if (_this.game.state === 'start') {
          if (_this.startUiTouchHandled) {
            return;
          }
          var touchDx = touchX - _this.touchStartX;
          var touchDy = touchY - _this.touchStartY;

          // 更新delta
          _this.lastDeltaX = touchDx;
          _this.lastDeltaY = touchDy;

          if (_this.game.panelManager.isOpen('showDebugPanel')) {
            var debugVerticalDrag = Math.abs(touchDy) > 10;

            if (_this.game.isDraggingDebugPanel) {
              _this.game.handleDebugPanelScroll(touchY);
              return;
            }

            if (debugVerticalDrag && _this.game.startDebugPanelDrag && _this.game.startDebugPanelDrag(touchX, touchY)) {
              _this.game.handleDebugPanelScroll(touchY);
              return;
            }

            return;
          }

          // 使用 ScrollHandler 处理面板滚动
          if (_this.game.scrollHandler && _this.game.scrollHandler.handleMove(touchX, touchY, _this.touchStartX, _this.touchStartY)) {
            return;
          }

          // 角色面板内容拖动
          if (_this.game.panelManager.isOpen('showCharacterPanel')) {
            var touchDy = touchY - _this.touchStartY;
            var isVerticalDrag = Math.abs(touchDy) > 10;

            // 如果已开始拖动，更新拖动位置
            if (_this.game.isDraggingCharacterList) {
              _this.game.handleCharacterScroll(touchX, touchY);
              return;
            }

            // 如果检测到垂直移动超过阈值，开始拖动
            if (isVerticalDrag) {
              if (_this.game.startCharacterDrag && _this.game.startCharacterDrag(touchX, touchY)) {
                return;
              }
            }
          }

          // 面板打开时，onTouchMove不处理点击（避免面板关闭后误触发开始按钮）
          if (_this.game.panelManager.isAnyOpen()) {
            return;
          }
          return;
        }

        var currentX = touches[0].clientX;
        var currentY = touches[0].clientY;
        var deltaX = currentX - _this.touchStartX;
        var deltaY = currentY - _this.touchStartY;

        // 保存滑动距离
        _this.lastDeltaX = deltaX;
        _this.lastDeltaY = deltaY;

        // 滑动下落（非冲刺期间）- 添加200ms冷却时间防止iOS卡死
        var now = Date.now();
        if (!_this.game.chargeDashing && _this.game.state === 'playing' && deltaY > 30 && !_this.keys['ArrowLeft'] && !_this.keys['ArrowRight'] && !_this.isSlidingDown && (now - _this.lastSlideTime > 200)) {
          if (_this.game.player) {
            // 使用技能系统触发下滑
            var triggeredSkill = _this.game.skillSystem.onGesture(0, deltaY);
            if (triggeredSkill === 'slide' || triggeredSkill === 'chargeFull') {
              _this.isSlidingDown = true;
              _this.lastSlideTime = now;
            }
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
      if (_this.game.state === 'start' && _this.startUiTouchHandled) {
        _this.touchStartX = null;
        _this.touchStartY = null;
        _this.lastDeltaX = 0;
        _this.lastDeltaY = 0;
        _this.isSlidingDown = false;
        _this.skipTouchEndSkill = false;
        _this.startUiTouchHandled = false;
        return;
      }

      if (_this.game.state === 'playing' && _this.game.runDirector && _this.game.runDirector.isBuffOfferOpen()) {
        _this.keys['ArrowLeft'] = false;
        _this.keys['ArrowRight'] = false;
        _this.touchStartX = null;
        _this.touchStartY = null;
        _this.lastDeltaX = 0;
        _this.lastDeltaY = 0;
        _this.isSlidingDown = false;
        _this.skipTouchEndSkill = false;
        _this.startUiTouchHandled = false;
        return;
      }

      if (_this.game.state === 'start' && _this.game.panelManager.isOpen('showDebugPanel')) {
        if (_this.game.isDraggingDebugPanel) {
          _this.game.stopDebugPanelDrag();
        } else if (_this.touchStartX !== null && _this.touchStartY !== null) {
          _this.game.mainUI.handleTouch(_this.touchStartX, _this.touchStartY);
        }
        _this.touchStartX = null;
        _this.touchStartY = null;
        _this.lastDeltaX = 0;
        _this.lastDeltaY = 0;
        _this.isSlidingDown = false;
        _this.skipTouchEndSkill = false;
        return;
      }

      // 角色面板：如果没有拖动，视为点击
      if (_this.game.panelManager.isOpen('showCharacterPanel') && !_this.game.isDraggingCharacterList) {
        // 使用touchStart坐标处理点击
        if (_this.game.checkCharacterSelectClick && _this.game.checkCharacterSelectClick(_this.touchStartX, _this.touchStartY)) {
          // 点击了角色，不关闭面板
        }
      }

      // 停止角色列表拖动
      if (_this.game.isDraggingCharacterList) {
        _this.game.stopCharacterDrag();
      }
      // 处理手势结束时的技能触发（蓄力冲刺期间不处理滑动）
      if (_this.touchStartX !== null && _this.touchStartY !== null && _this.game.state === 'playing' && !_this.game.chargeDashing) {
        // 计算最终滑动方向并触发技能
        if (!_this.skipTouchEndSkill && !_this.isSlidingDown && !_this.game.isControlLocked()) {
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
      _this.skipTouchEndSkill = false;
      _this.startUiTouchHandled = false;
    });
  }

  doDoubleJump() {
    if (!this.game.player || this.game.isControlLocked() || !this.game.doubleJumpUnlocked || !this.canDoubleJump || this.hasDoubleJumped) return;
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
    this.startUiTouchHandled = false;
  }
}

module.exports = Controls;
