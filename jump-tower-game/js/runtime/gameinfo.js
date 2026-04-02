const Emitter = require('../libs/tinyemitter');
const { SCREEN_WIDTH, SCREEN_HEIGHT } = require('../render');
const assetManager = require('../resource/assetManager');

const atlas = wx.createImage();
atlas.src = assetManager.getImagePath('images/Common.png');

class GameInfo extends Emitter {
  constructor() {
    super();

    this.btnArea = {
      startX: SCREEN_WIDTH / 2 - 40,
      startY: SCREEN_HEIGHT / 2 - 100 + 180,
      endX: SCREEN_WIDTH / 2 + 50,
      endY: SCREEN_HEIGHT / 2 - 100 + 255,
    };

    this.homeBtnArea = {
      startX: SCREEN_WIDTH / 2 - 40,
      startY: SCREEN_HEIGHT / 2 - 100 + 255,
      endX: SCREEN_WIDTH / 2 + 50,
      endY: SCREEN_HEIGHT / 2 - 100 + 310,
    };

    wx.onTouchStart(this.touchEventHandler.bind(this));
  }

  setFont(ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
  }

  render(ctx) {
    this.renderGameScore(ctx, GameGlobal.databus.score);
    if (GameGlobal.databus.isGameOver) {
      this.renderGameOver(ctx, GameGlobal.databus.score);
    }
  }

  renderGameScore(ctx, score) {
    this.setFont(ctx);
    ctx.fillText(score, 10, 30);
  }

  renderGameOver(ctx, score) {
    this.drawGameOverImage(ctx);
    this.drawGameOverText(ctx, score);
    this.drawRestartButton(ctx);
    this.drawHomeButton(ctx);
  }

  drawGameOverImage(ctx) {
    ctx.drawImage(
      atlas,
      0, 0, 119, 108,
      SCREEN_WIDTH / 2 - 150,
      SCREEN_HEIGHT / 2 - 100,
      300, 300
    );
  }

  drawGameOverText(ctx, score) {
    this.setFont(ctx);
    ctx.fillText('游戏结束', SCREEN_WIDTH / 2 - 40, SCREEN_HEIGHT / 2 - 100 + 50);
    ctx.fillText('得分: ' + score, SCREEN_WIDTH / 2 - 40, SCREEN_HEIGHT / 2 - 100 + 130);
  }

  drawRestartButton(ctx) {
    ctx.drawImage(atlas, 120, 6, 39, 24, SCREEN_WIDTH / 2 - 60, SCREEN_HEIGHT / 2 - 100 + 180, 120, 40);
    ctx.fillText('重新开始', SCREEN_WIDTH / 2 - 40, SCREEN_HEIGHT / 2 - 100 + 205);
  }

  drawHomeButton(ctx) {
    ctx.drawImage(atlas, 120, 6, 39, 24, SCREEN_WIDTH / 2 - 60, SCREEN_HEIGHT / 2 - 100 + 255, 120, 40);
    ctx.fillText('返回主页', SCREEN_WIDTH / 2 - 40, SCREEN_HEIGHT / 2 - 100 + 280);
  }

  touchEventHandler(event) {
    const clientX = event.touches[0].clientX;
    const clientY = event.touches[0].clientY;

    if (GameGlobal.databus.isGameOver) {
      if (
        clientX >= this.btnArea.startX &&
        clientX <= this.btnArea.endX &&
        clientY >= this.btnArea.startY &&
        clientY <= this.btnArea.endY
      ) {
        this.emit('restart');
      }
      if (
        clientX >= this.homeBtnArea.startX &&
        clientX <= this.homeBtnArea.endX &&
        clientY >= this.homeBtnArea.startY &&
        clientY <= this.homeBtnArea.endY
      ) {
        this.emit('home');
      }
    }
  }
}

module.exports = GameInfo;
