// 主界面UI控制

class MainUI {
  constructor(game) {
    this.game = game;
  }

  // 处理主界面触摸点击
  handleTouch(touchX, touchY) {
    // 如果角色面板显示中，优先处理角色选择
    if (this.game.showCharacterPanel) {
      var selected = this.game.checkCharacterSelectClick(touchX, touchY);
      if (selected) {
        this.game.showCharacterPanel = false;
        return true;
      }
      // 检测是否点击了关闭角色面板（点击其他区域）
      if (this.game.bottomBtnArea) {
        var charBtn = this.game.bottomBtnArea.character;
        if (touchX >= charBtn.x && touchX <= charBtn.x + charBtn.w &&
            touchY >= charBtn.y && touchY <= charBtn.y + charBtn.h) {
          return true;
        }
      }
      this.game.showCharacterPanel = false;
      return true;
    }

    // 如果职业面板显示中，优先处理职业选择
    if (this.game.showJobPanel) {
      var selectedJob = this.game.checkJobSelectClick(touchX, touchY);
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
      this.game.showJobPanel = false;
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
      // 点击了排行榜按钮（暂未实现）
      if (touchX >= btn.leaderboard.x && touchX <= btn.leaderboard.x + btn.leaderboard.w &&
          touchY >= btn.leaderboard.y && touchY <= btn.leaderboard.y + btn.leaderboard.h) {
        return true;
      }
    }

    // 检测是否点击了开始按钮
    if (this.game.startBtnArea) {
      var sBtn = this.game.startBtnArea;
      if (touchX >= sBtn.x && touchX <= sBtn.x + sBtn.w &&
          touchY >= sBtn.y && touchY <= sBtn.y + sBtn.h) {
        this.game.audio.playClick();
        this.game.startGame();
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
    return false;
  }
}

module.exports = MainUI;
