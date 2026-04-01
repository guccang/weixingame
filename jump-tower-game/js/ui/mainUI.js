// 主界面UI控制

class MainUI {
  constructor(game) {
    this.game = game;
  }

  // 处理主界面触摸点击
  handleTouch(touchX, touchY) {
    // 【临时测试】检测Boss测试按钮点击
    if (this.game.testBossBtnArea) {
      var testBtn = this.game.testBossBtnArea;
      if (touchX >= testBtn.x && touchX <= testBtn.x + testBtn.w &&
          touchY >= testBtn.y && touchY <= testBtn.y + testBtn.h) {
        this.game.audio.playClick();
        console.log('[测试] 点击测试Boss按钮，开始游戏并生成Boss');
        this.game.startGame();
        // 延迟生成Boss
        setTimeout(function() {
          console.log('[测试] 生成Boss');
          this.game.bossSystem.spawn(1);
        }.bind(this), 1000);
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

    // 如果职业面板显示中，优先处理职业选择
    if (this.game.showJobPanel) {
      var selectedJob = this.checkJobSelectClick(touchX, touchY);
      if (selectedJob) {
        this.game.showJobPanel = false;
        return true;
      }
      if (this.game.bottomBtnArea) {
        var jobBtn = this.game.bottomBtnArea.job;
        if (touchX >= jobBtn.x && touchX <= jobBtn.x + jobBtn.w &&
            touchY >= jobBtn.y && touchY <= jobBtn.y + jobBtn.h) {
          return true;
        }
      }
      // 点击其他区域，关闭面板
      this.game.showJobPanel = false;
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

    // 检测是否点击了底部图标按钮
    if (this.game.bottomBtnArea) {
      var btn = this.game.bottomBtnArea;
      // 点击了角色按钮
      if (touchX >= btn.character.x && touchX <= btn.character.x + btn.character.w &&
          touchY >= btn.character.y && touchY <= btn.character.y + btn.character.h) {
        this.game.audio.playClick();
        this.game.showCharacterPanel = true;
        return true;
      }
      // 点击了玩法按钮
      if (touchX >= btn.mode.x && touchX <= btn.mode.x + btn.mode.w &&
          touchY >= btn.mode.y && touchY <= btn.mode.y + btn.mode.h) {
        this.game.audio.playClick();
        this.game.gameMode.showModeSelect = true;
        return true;
      }
      // 点击了职业按钮
      if (touchX >= btn.job.x && touchX <= btn.job.x + btn.job.w &&
          touchY >= btn.job.y && touchY <= btn.job.y + btn.job.h) {
        this.game.audio.playClick();
        this.game.showJobPanel = true;
        return true;
      }
      // 点击了商店按钮（暂未实现）
      if (touchX >= btn.shop.x && touchX <= btn.shop.x + btn.shop.w &&
          touchY >= btn.shop.y && touchY <= btn.shop.y + btn.shop.h) {
        return true;
      }
      // 点击了排行榜按钮
      if (touchX >= btn.leaderboard.x && touchX <= btn.leaderboard.x + btn.leaderboard.w &&
          touchY >= btn.leaderboard.y && touchY <= btn.leaderboard.y + btn.leaderboard.h) {
        this.game.audio.playClick();
        this.game.showLeaderboardPanel = true;
        this.game.fetchRankList();
        return true;
      }
    }

    // 检测是否点击了开始按钮
    if (this.game.startBtnArea) {
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

    // 检测是否点击了玩法按钮
    if (this.game.bottomBtnArea && this.game.bottomBtnArea.mode) {
      var mBtn = this.game.bottomBtnArea.mode;
      if (touchX >= mBtn.x && touchX <= mBtn.x + mBtn.w &&
          touchY >= mBtn.y && touchY <= mBtn.y + mBtn.h) {
        this.game.audio.playClick();
        this.game.gameMode.showModeSelect = true;
        return true;
      }
    }
    return false;
  }

  // 检测职业选择点击
  checkJobSelectClick(touchX, touchY) {
    const W = this.game.W;
    const H = this.game.H;
    const { jobConfig } = require('../runtime/jobconfig');

    const selectY = H / 2 + 80;
    const selectWidth = 100;
    const selectHeight = 80;
    const spacing = 120;
    const startX = W / 2 - (jobConfig.list.length * spacing) / 2;

    for (let i = 0; i < jobConfig.list.length; i++) {
      const jobName = jobConfig.list[i];
      const x = startX + i * spacing;
      const y = selectY;

      // 检测点击是否在职业选择框内
      if (touchX >= x && touchX <= x + selectWidth &&
          touchY >= y && touchY <= y + selectHeight) {
        // 切换职业
        jobConfig.current = jobName;
        this.game.playerJob = jobName;
        this.game.generatePraises(); // 刷新夸夸词
        this.game.audio.playClick();
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
