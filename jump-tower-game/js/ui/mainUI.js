// 主界面UI控制

class MainUI {
  constructor(game) {
    this.game = game;
  }

  // 处理主界面触摸点击
  handleTouch(touchX, touchY) {
    if (this.game.state === 'start' && this.game.coinBadgeArea) {
      var coinBadge = this.game.coinBadgeArea;
      if (touchX >= coinBadge.x && touchX <= coinBadge.x + coinBadge.w &&
          touchY >= coinBadge.y && touchY <= coinBadge.y + coinBadge.h) {
        this.game.audio.playClick();
        this.game.grantDebugCoins();
        return true;
      }
    }

    // 如果模式选择面板显示中
    if (this.game.gameMode.showModeSelect) {
      // 检查关闭按钮
      if (this.game.closeModeSelect) {
        var closeBtn = this.game.closeModeSelect;
        if (touchX >= closeBtn.x && touchX <= closeBtn.x + closeBtn.w &&
            touchY >= closeBtn.y && touchY <= closeBtn.y + closeBtn.h) {
          this.game.audio.playClick();
          this.game.gameMode.showModeSelect = false;
          return true;
        }
      }
      // 检查模式按钮
      if (this.game.modeBtnArea) {
        for (var modeName in this.game.modeBtnArea) {
          var mBtn = this.game.modeBtnArea[modeName];
          if (touchX >= mBtn.x && touchX <= mBtn.x + mBtn.w &&
              touchY >= mBtn.y && touchY <= mBtn.y + mBtn.h) {
            this.game.audio.playClick();
            this.game.gameMode.selectMode(modeName);
            // 无尽模式直接开始
            if (modeName === 'endless') {
              this.game.startGame();
            }
            return true;
          }
        }
      }
      // 点击模式选择面板空白区域，不做任何处理
      return true;
    }

    // 如果时间选择面板显示中
    if (this.game.gameMode.showTimeSelect) {
      if (this.game.backToModeSelect) {
        var backBtn = this.game.backToModeSelect;
        if (touchX >= backBtn.x && touchX <= backBtn.x + backBtn.w &&
            touchY >= backBtn.y && touchY <= backBtn.y + backBtn.h) {
          this.game.audio.playClick();
          this.game.gameMode.showTimeSelect = false;
          this.game.gameMode.showModeSelect = true;
          return true;
        }
      }
      if (this.game.timeBtnArea) {
        for (var i = 0; i < this.game.timeBtnArea.length; i++) {
          var tBtn = this.game.timeBtnArea[i];
          if (touchX >= tBtn.x && touchX <= tBtn.x + tBtn.w &&
              touchY >= tBtn.y && touchY <= tBtn.y + tBtn.h) {
            this.game.audio.playClick();
            this.game.gameMode.selectTimeLimit(tBtn.value);
            this.game.startGame();
            return true;
          }
        }
      }
      return true;
    }

    // 如果地标选择面板显示中
    if (this.game.gameMode.showLandmarkSelect) {
      if (this.game.backToModeSelect) {
        var backBtn2 = this.game.backToModeSelect;
        if (touchX >= backBtn2.x && touchX <= backBtn2.x + backBtn2.w &&
            touchY >= backBtn2.y && touchY <= backBtn2.y + backBtn2.h) {
          this.game.audio.playClick();
          this.game.gameMode.showLandmarkSelect = false;
          this.game.gameMode.showModeSelect = true;
          return true;
        }
      }
      if (this.game.landmarkBtnArea) {
        for (var j = 0; j < this.game.landmarkBtnArea.length; j++) {
          var lBtn = this.game.landmarkBtnArea[j];
          if (touchX >= lBtn.x && touchX <= lBtn.x + lBtn.w &&
              touchY >= lBtn.y && touchY <= lBtn.y + lBtn.h) {
            this.game.audio.playClick();
            this.game.gameMode.selectLandmark(lBtn.landmark);
            this.game.startGame();
            return true;
          }
        }
      }
      return true;
    }

    // 如果角色面板显示中，优先处理角色选择
    if (this.game.showCharacterPanel) {
      var selected = this.game.checkCharacterSelectClick(touchX, touchY);
      if (selected) {
        this.game.showCharacterPanel = false;
        return true;
      }
      // 检测是否点击了角色按钮区域
      if (this.game.bottomBtnArea) {
        var charBtn = this.game.bottomBtnArea.character;
        if (touchX >= charBtn.x && touchX <= charBtn.x + charBtn.w &&
            touchY >= charBtn.y && touchY <= charBtn.y + charBtn.h) {
          return true;
        }
      }
      // 点击其他区域，关闭面板
      this.game.showCharacterPanel = false;
      return true;
    }

    // 如果强化面板显示中
    if (this.game.showShopPanel) {
      if (this.game.shopResetBtnArea) {
        var resetBtn = this.game.shopResetBtnArea;
        if (touchX >= resetBtn.x && touchX <= resetBtn.x + resetBtn.w &&
            touchY >= resetBtn.y && touchY <= resetBtn.y + resetBtn.h) {
          this.game.audio.playClick();
          this.game.performShopAction('reset-progress');
          return true;
        }
      }

      if (this.game.shopCloseBtnArea) {
        var closeShopBtn = this.game.shopCloseBtnArea;
        if (touchX >= closeShopBtn.x && touchX <= closeShopBtn.x + closeShopBtn.w &&
            touchY >= closeShopBtn.y && touchY <= closeShopBtn.y + closeShopBtn.h) {
          this.game.audio.playClick();
          this.game.showShopPanel = false;
          return true;
        }
      }

      if (this.game.shopTabAreas) {
        for (var t = 0; t < this.game.shopTabAreas.length; t++) {
          var tabBtn = this.game.shopTabAreas[t];
          if (touchX >= tabBtn.x && touchX <= tabBtn.x + tabBtn.w &&
              touchY >= tabBtn.y && touchY <= tabBtn.y + tabBtn.h) {
            this.game.audio.playClick();
            this.game.setShopTab(tabBtn.tabId);
            return true;
          }
        }
      }

      if (this.game.shopItemAreas) {
        for (var s = 0; s < this.game.shopItemAreas.length; s++) {
          var itemBtn = this.game.shopItemAreas[s];
          if (touchX >= itemBtn.x && touchX <= itemBtn.x + itemBtn.w &&
              touchY >= itemBtn.y && touchY <= itemBtn.y + itemBtn.h) {
            this.game.performShopAction(itemBtn.action, itemBtn.itemId);
            return true;
          }
        }
      }

      this.game.showShopPanel = false;
      return true;
    }

    // 如果排行榜面板显示中
    if (this.game.showLeaderboardPanel) {
      // 检测关闭按钮
      if (this.game.closeLeaderboardBtn &&
          touchX >= this.game.closeLeaderboardBtn.x &&
          touchX <= this.game.closeLeaderboardBtn.x + this.game.closeLeaderboardBtn.w &&
          touchY >= this.game.closeLeaderboardBtn.y &&
          touchY <= this.game.closeLeaderboardBtn.y + this.game.closeLeaderboardBtn.h) {
        this.game.audio.playClick();
        this.game.showLeaderboardPanel = false;
        return true;
      }
      // 点击其他区域，关闭面板
      this.game.showLeaderboardPanel = false;
      return true;
    }

    // 如果成就面板显示中
    if (this.game.showAchievementPanel) {
      var achPanel = this.game.achievementPanelArea;
      // 点击在面板区域内
      if (achPanel &&
          touchX >= achPanel.x && touchX <= achPanel.x + achPanel.w &&
          touchY >= achPanel.y && touchY <= achPanel.y + achPanel.h) {
        // 检测关闭按钮
        if (this.game.achievementCloseBtnArea &&
            touchX >= this.game.achievementCloseBtnArea.x &&
            touchX <= this.game.achievementCloseBtnArea.x + this.game.achievementCloseBtnArea.w &&
            touchY >= this.game.achievementCloseBtnArea.y &&
            touchY <= this.game.achievementCloseBtnArea.y + this.game.achievementCloseBtnArea.h) {
          this.game.audio.playClick();
          this.game.showAchievementPanel = false;
        }
        return true;
      }
      // 点击成就按钮区域，不关闭
      if (this.game.bottomBtnArea && this.game.bottomBtnArea.achievement) {
        var achBtn = this.game.bottomBtnArea.achievement;
        if (touchX >= achBtn.x && touchX <= achBtn.x + achBtn.w &&
            touchY >= achBtn.y && touchY <= achBtn.y + achBtn.h) {
          return true;
        }
      }
      // 点击面板外，关闭
      this.game.showAchievementPanel = false;
      return true;
    }

    // 检测是否点击了底部图标按钮
    if (this.game.bottomBtnArea) {
      var btn = this.game.bottomBtnArea;
      const pm = this.game.panelManager;
      // 点击了角色按钮
      if (touchX >= btn.character.x && touchX <= btn.character.x + btn.character.w &&
          touchY >= btn.character.y && touchY <= btn.character.y + btn.character.h) {
        this.game.audio.playClick();
        pm.open('showCharacterPanel');
        return true;
      }
      // 点击了玩法按钮
      if (touchX >= btn.mode.x && touchX <= btn.mode.x + btn.mode.w &&
          touchY >= btn.mode.y && touchY <= btn.mode.y + btn.mode.h) {
        this.game.audio.playClick();
        pm.open('showModeSelect');
        return true;
      }
      // 点击了商店按钮
      if (touchX >= btn.shop.x && touchX <= btn.shop.x + btn.shop.w &&
          touchY >= btn.shop.y && touchY <= btn.shop.y + btn.shop.h) {
        this.game.audio.playClick();
        pm.open('showShopPanel');
        this.game.setShopTab(this.game.shopTab || 'upgrades');
        return true;
      }
      // 点击了排行榜按钮
      if (touchX >= btn.leaderboard.x && touchX <= btn.leaderboard.x + btn.leaderboard.w &&
          touchY >= btn.leaderboard.y && touchY <= btn.leaderboard.y + btn.leaderboard.h) {
        this.game.audio.playClick();
        pm.open('showLeaderboardPanel');
        this.game.fetchRankList();
        return true;
      }
      // 点击了成就按钮
      if (touchX >= btn.achievement.x && touchX <= btn.achievement.x + btn.achievement.w &&
          touchY >= btn.achievement.y && touchY <= btn.achievement.y + btn.achievement.h) {
        this.game.audio.playClick();
        pm.open('showAchievementPanel');
        return true;
      }
    }

    // 检测是否点击了开始按钮（只有没有任何面板打开时才能触发）
    if (this.game.startBtnArea && !this.game.panelManager.isAnyOpen()) {
      var sBtn = this.game.startBtnArea;
      if (touchX >= sBtn.x && touchX <= sBtn.x + sBtn.w &&
          touchY >= sBtn.y && touchY <= sBtn.y + sBtn.h) {
        this.game.audio.playClick();
        // 直接开始无尽模式
        this.game.gameMode.selectMode('endless');
        this.game.startGame();
        return true;
      }
    }

    // 检测是否点击了玩法按钮（兜底逻辑，面板关闭时重新打开）
    if (this.game.bottomBtnArea && this.game.bottomBtnArea.mode) {
      var mBtn = this.game.bottomBtnArea.mode;
      if (touchX >= mBtn.x && touchX <= mBtn.x + mBtn.w &&
          touchY >= mBtn.y && touchY <= mBtn.y + mBtn.h) {
        this.game.audio.playClick();
        this.game.panelManager.open('showModeSelect');
        return true;
      }
    }
    return false;
  }

  // 处理游戏结束界面触摸点击
  handleGameOverTouch(touchX, touchY) {
    if (!this.game.gameOverBtnArea) return false;

    var btn = this.game.gameOverBtnArea;
    // 检查是否点击了重新开始按钮
    if (touchX >= btn.restartX && touchX <= btn.restartX + btn.restartW &&
        touchY >= btn.restartY && touchY <= btn.restartY + btn.restartH) {
      this.game.audio.playClick();
      this.game.startGame();
      return true;
    }
    // 检查是否点击了分享按钮
    if (touchX >= btn.shareX && touchX <= btn.shareX + btn.shareW &&
        touchY >= btn.shareY && touchY <= btn.shareY + btn.shareH) {
      this.game.audio.playClick();
      if (this.game.gameOps) {
        this.game.gameOps.shareToFriend();
      }
      return true;
    }
    // 检查是否点击了返回主页按钮
    if (touchX >= btn.homeX && touchX <= btn.homeX + btn.homeW &&
        touchY >= btn.homeY && touchY <= btn.homeY + btn.homeH) {
      this.game.audio.playClick();
      this.game.goToHome();
      return true;
    }
    // 点击游戏结束界面空白区域，不做任何处理
    return true;
  }
}

module.exports = MainUI;
