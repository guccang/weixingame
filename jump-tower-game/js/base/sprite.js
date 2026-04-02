const Emitter = require('../libs/tinyemitter');
const assetManager = require('../resource/assetManager');

/**
 * 游戏基础的精灵类
 */
class Sprite extends Emitter {
  constructor(imgSrc = '', width = 0, height = 0, x = 0, y = 0) {
    super();

    this.visible = true;
    this.isActive = true;

    this.img = wx.createImage();
    this.img.src = assetManager.getImagePath(imgSrc);

    this.width = width;
    this.height = height;

    this.x = x;
    this.y = y;
  }

  /**
   * 将精灵图绘制在canvas上
   */
  render(ctx) {
    if (!this.visible) return;
    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
  }

  /**
   * 简单的碰撞检测
   */
  isCollideWith(sp) {
    const spX = sp.x + sp.width / 2;
    const spY = sp.y + sp.height / 2;

    if (!this.visible || !sp.visible) return false;
    if (!this.isActive || !sp.isActive) return false;

    return !!(
      spX >= this.x &&
      spX <= this.x + this.width &&
      spY >= this.y &&
      spY <= this.y + this.height
    );
  }
}

module.exports = Sprite;
