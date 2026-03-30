const Sprite = require('../base/sprite');
const { SCREEN_WIDTH, SCREEN_HEIGHT } = require('../render');

const BACKGROUND_IMAGE_SRC = 'images/bg.jpg';
const BACKGROUND_WIDTH = 512;
const BACKGROUND_HEIGHT = 512;
const BACKGROUND_SPEED = 2;

class BackGround extends Sprite {
  constructor() {
    super(BACKGROUND_IMAGE_SRC, BACKGROUND_WIDTH, BACKGROUND_HEIGHT);
    this.top = 0;
  }

  update() {
    if (GameGlobal.databus.isGameOver) return;
    this.top += BACKGROUND_SPEED;
    if (this.top >= SCREEN_HEIGHT) {
      this.top = 0;
    }
  }

  render(ctx) {
    ctx.drawImage(
      this.img, 0, 0, this.width, this.height,
      0, -SCREEN_HEIGHT + this.top, SCREEN_WIDTH, SCREEN_HEIGHT
    );
    ctx.drawImage(
      this.img, 0, 0, this.width, this.height,
      0, this.top, SCREEN_WIDTH, SCREEN_HEIGHT
    );
  }
}

module.exports = BackGround;
