/**
 * 游戏操作模块 - 分享、截图等功能
 */

class GameOperations {
  constructor(game) {
    this.game = game;
    this.initShare();
  }

  /**
   * 初始化分享
   */
  initShare() {
    const _this = this;
    wx.showShareMenu({ withShareTicket: true });

    wx.onShareAppMessage(function() {
      return _this.getShareConfig();
    });
  }

  /**
   * 获取分享配置
   */
  getShareConfig() {
    const score = this.game.score || 0;
    const title = `我在跳跳楼跳了${score}米！你能超过我吗？`;

    return {
      title: title,
      imageUrl: this.captureGameScreen()
    };
  }

  /**
   * 截取游戏画面
   */
  captureGameScreen() {
    try {
      const canvas = GameGlobal.canvas;
      return canvas.toTempFilePathSync({
        destWidth: 500,
        destHeight: 400
      });
    } catch (e) {
      console.error('[Share] 截图失败:', e);
      return '';
    }
  }

  /**
   * 主动分享（点击按钮触发）
   */
  shareToFriend() {
    wx.shareAppMessage(this.getShareConfig());
  }
}

module.exports = GameOperations;

