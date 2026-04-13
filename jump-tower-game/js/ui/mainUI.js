// 主界面UI控制

class MainUI {
  constructor(game) {
    this.game = game;
  }

  // 检测点是否在矩形区域内
  _hitRect(area, x, y) {
    return area && x >= area.x && x <= area.x + area.w &&
           y >= area.y && y <= area.y + area.h;
  }

  // 检测点是否在按钮区域内（别名方法，语义更清晰）
  _hitBtn(btn, x, y) {
    return this._hitRect(btn, x, y);
  }

  // 处理返回按钮点击（通用方法）
  _handleBackButton(btnAreaKey, touchX, touchY) {
    const btn = this.game[btnAreaKey];
    if (!btn) return false;
    if (this._hitBtn(btn, touchX, touchY)) {
      this.game.audio.playClick();
      // 使用历史栈返回，如果没有历史则关闭所有面板
      const prevPanel = this.game.panelManager.back();
      if (prevPanel === null) {
        // 没有历史，已关闭所有面板
      }
      return true;
    }
    return false;
  }

  // 处理按钮数组点击（通用方法）
  _handleButtonArray(btnAreaKey, callback, touchX, touchY) {
    const btns = this.game[btnAreaKey];
    if (!btns) return false;
    for (var i = 0; i < btns.length; i++) {
      if (this._hitBtn(btns[i], touchX, touchY)) {
        this.game.audio.playClick();
        return callback(btns[i], i) || true;
      }
    }
    return false;
  }

  // 处理按钮对象点击（通用方法，用于字典形式的按钮）
  _handleButtonDict(btnAreaKey, callback, touchX, touchY) {
    const btns = this.game[btnAreaKey];
    if (!btns) return false;
    for (var key in btns) {
      if (this._hitBtn(btns[key], touchX, touchY)) {
        this.game.audio.playClick();
        return callback(key, btns[key]) || true;
      }
    }
    return false;
  }

  // 处理主界面触摸点击
  handleTouch(touchX, touchY) {
    var pm = this.game.panelManager;

    // Debug 金币徽章
    if (!pm.isAnyOpen() && this._hitBtn(this.game.coinBadgeArea, touchX, touchY)) {
      this.game.audio.playClick();
      this.game.grantDebugCoins();
      return true;
    }

    // Debug 面板
    if (this.game.panelManager.isOpen('showDebugPanel')) {
      if (this._hitBtn(this.game.closeDebugPanel, touchX, touchY)) {
        this.game.audio.playClick();
        this.game.panelManager.close('showDebugPanel');
        return true;
      }
      if (this._handleButtonArray('debugPresetAreas', (btn) => {
        this.game.selectDebugPreset(btn.presetId);
      }, touchX, touchY)) {
        return true;
      }
      if (this._handleButtonArray('debugOptionAreas', (btn) => {
        this.game.cycleDebugOption(btn.key);
      }, touchX, touchY)) {
        return true;
      }
      if (this._hitBtn(this.game.debugResetBtnArea, touchX, touchY)) {
        this.game.audio.playClick();
        this.game.resetDebugDraft();
        return true;
      }
      if (this._hitBtn(this.game.debugLaunchBtnArea, touchX, touchY)) {
        this.game.audio.playClick();
        this.game.startDebugGame();
        return true;
      }
      return true;
    }

    // 模式选择面板
    if (this.game.panelManager.isOpen('showModeSelect')) {
      if (this._handleBackButton('closeModeSelect', touchX, touchY)) {
        return true;
      }
      if (this._handleButtonDict('modeBtnArea', (modeName) => {
        this.game.gameMode.selectMode(modeName);
        if (modeName === 'endless') {
          this.game.startGame();
        }
      }, touchX, touchY)) {
        return true;
      }
      return true;
    }

    // 时间选择面板
    if (this.game.panelManager.isOpen('showTimeSelect')) {
      if (this._handleBackButton('backToModeSelect', touchX, touchY)) {
        return true;
      }
      if (this._handleButtonArray('timeBtnArea', (btn) => {
        this.game.gameMode.selectTimeLimit(btn.value);
        this.game.startGame();
      }, touchX, touchY)) {
        return true;
      }
      return true;
    }

    // 地标选择面板
    if (this.game.panelManager.isOpen('showLandmarkSelect')) {
      if (this._handleBackButton('backToModeSelect', touchX, touchY)) {
        return true;
      }
      if (this._handleButtonArray('landmarkBtnArea', (btn) => {
        this.game.gameMode.selectLandmark(btn.landmark);
        this.game.startGame();
      }, touchX, touchY)) {
        return true;
      }
      return true;
    }

    // 角色选择面板
    if (this.game.panelManager.isOpen('showCharacterPanel')) {
      // 处理关闭按钮
      if (this._hitBtn(this.game.closeCharacterPanel, touchX, touchY)) {
        this.game.audio.playClick();
        this.game.characterPendingSelect = null;  // 清除待确认状态
        this.game.panelManager.close('showCharacterPanel');
        return true;
      }
      // 处理滚动（不关闭面板）
      if (this.game.handleCharacterScroll(touchX, touchY)) {
        return true;
      }
      // 处理确认按钮
      if (this._hitBtn(this.game.characterConfirmBtn, touchX, touchY)) {
        if (this.game.confirmCharacterSelect()) {
          this.game.panelManager.close('showCharacterPanel');
        }
        return true;
      }
      // 处理角色选择（只标记待确认，不关闭面板）
      if (this.game.checkCharacterSelectClick(touchX, touchY)) {
        return true;
      }
      // 点击底部按钮区域不关闭面板
      if (this.game.bottomBtnArea) {
        var charBtn = this.game.bottomBtnArea.character;
        if (charBtn && this._hitBtn(charBtn, touchX, touchY)) {
          return true;
        }
      }
      // 点击其他区域不关闭面板（只消费事件）
      return true;
    }

    // 强化面板
    if (this.game.panelManager.isOpen('showShopPanel')) {
      if (this._hitBtn(this.game.shopResetBtnArea, touchX, touchY)) {
        this.game.audio.playClick();
        this.game.performShopAction('reset-progress');
        return true;
      }
      if (this._hitBtn(this.game.shopCloseBtnArea, touchX, touchY)) {
        this.game.audio.playClick();
        this.game.panelManager.close('showShopPanel');
        return true;
      }
      if (this._handleButtonArray('shopTabAreas', (btn) => {
        this.game.setShopTab(btn.tabId);
      }, touchX, touchY)) {
        return true;
      }
      if (this._handleButtonArray('shopItemAreas', (btn) => {
        this.game.performShopAction(btn.action, btn.itemId);
      }, touchX, touchY)) {
        return true;
      }
      this.game.panelManager.close('showShopPanel');
      return true;
    }

    // 排行榜面板
    if (this.game.panelManager.isOpen('showLeaderboardPanel')) {
      if (this._hitBtn(this.game.closeLeaderboardBtn, touchX, touchY)) {
        this.game.audio.playClick();
        this.game.panelManager.close('showLeaderboardPanel');
        return true;
      }
      this.game.panelManager.close('showLeaderboardPanel');
      return true;
    }

    // 成就面板
    if (this.game.panelManager.isOpen('showAchievementPanel')) {
      if (this._hitRect(this.game.achievementPanelArea, touchX, touchY)) {
        if (this._hitBtn(this.game.achievementCloseBtnArea, touchX, touchY)) {
          this.game.audio.playClick();
          this.game.panelManager.close('showAchievementPanel');
        }
        return true;
      }
      if (this.game.bottomBtnArea) {
        var achBtn = this.game.bottomBtnArea.achievement;
        if (achBtn && this._hitBtn(achBtn, touchX, touchY)) {
          return true;
        }
      }
      this.game.panelManager.close('showAchievementPanel');
      return true;
    }

    // 底部图标按钮
    if (this.game.bottomBtnArea) {
      const btn = this.game.bottomBtnArea;
      if (this._hitBtn(btn.character, touchX, touchY)) {
        this.game.audio.playClick();
        pm.open('showCharacterPanel');
        return true;
      }
      if (this._hitBtn(btn.mode, touchX, touchY)) {
        this.game.audio.playClick();
        pm.open('showModeSelect');
        return true;
      }
      if (this._hitBtn(btn.shop, touchX, touchY)) {
        this.game.audio.playClick();
        pm.open('showShopPanel');
        this.game.setShopTab(this.game.shopTab || 'upgrades');
        return true;
      }
      if (this._hitBtn(btn.leaderboard, touchX, touchY)) {
        this.game.audio.playClick();
        pm.open('showLeaderboardPanel');
        this.game.fetchRankList();
        return true;
      }
      if (this._hitBtn(btn.achievement, touchX, touchY)) {
        this.game.audio.playClick();
        pm.open('showAchievementPanel');
        return true;
      }
    }

    // 开始按钮
    // 主界面无面板打开时
    if (!pm.isAnyOpen()) {
      // 点击角色预览区域，打开角色选择面板
      if (this._hitBtn(this.game.characterPreviewArea, touchX, touchY)) {
        this.game.audio.playClick();
        pm.open('showCharacterPanel');
        return true;
      }
      if (this._hitBtn(this.game.debugEntryArea, touchX, touchY)) {
        this.game.audio.playClick();
        if (typeof this.game.resetDebugPanelScroll === 'function') {
          this.game.resetDebugPanelScroll();
        }
        pm.open('showDebugPanel');
        return true;
      }
      // 点击开始按钮
      if (this._hitBtn(this.game.startBtnArea, touchX, touchY)) {
        this.game.audio.playClick();
        this.game.gameMode.selectMode('endless');
        this.game.startGame();
        return true;
      }
      return false;
    }

    return false;
  }

  // 处理游戏结束界面触摸点击
  handleGameOverTouch(touchX, touchY) {
    var btn = this.game.gameOverBtnArea;
    if (!btn) return false;

    if (touchX >= btn.restartX && touchX <= btn.restartX + btn.restartW &&
        touchY >= btn.restartY && touchY <= btn.restartY + btn.restartH) {
      this.game.audio.playClick();
      if (typeof this.game.restartCurrentRun === 'function') {
        this.game.restartCurrentRun();
      } else {
        this.game.startGame();
      }
      return true;
    }
    if (touchX >= btn.shareX && touchX <= btn.shareX + btn.shareW &&
        touchY >= btn.shareY && touchY <= btn.shareY + btn.shareH) {
      this.game.audio.playClick();
      if (this.game.gameOps) {
        this.game.gameOps.shareToFriend();
      }
      return true;
    }
    if (touchX >= btn.homeX && touchX <= btn.homeX + btn.homeW &&
        touchY >= btn.homeY && touchY <= btn.homeY + btn.homeH) {
      this.game.audio.playClick();
      this.game.goToHome();
      return true;
    }
    return true;
  }
}

module.exports = MainUI;
