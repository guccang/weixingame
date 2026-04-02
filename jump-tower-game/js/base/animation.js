const Sprite = require('./sprite');
const assetManager = require('../resource/assetManager');

const __ = {
  timer: Symbol('timer'),
};

/**
 * 简易的帧动画类实现
 */
class Animation extends Sprite {
  constructor(imgSrc, width, height) {
    super(imgSrc, width, height);

    this.isPlaying = false;
    this.loop = false;
    this.interval = 1000 / 60;
    this[__.timer] = null;
    this.index = -1;
    this.count = 0;
    this.imgList = [];
  }

  /**
   * 初始化帧动画的所有帧
   */
  initFrames(imgList) {
    this.imgList = imgList.map((src) => {
      const img = wx.createImage();
      img.src = assetManager.getImagePath(src);
      return img;
    });

    this.count = imgList.length;
    GameGlobal.databus.animations.push(this);
  }

  aniRender(ctx) {
    if (this.index >= 0 && this.index < this.count) {
      ctx.drawImage(
        this.imgList[this.index],
        this.x,
        this.y,
        this.width * 1.2,
        this.height * 1.2
      );
    }
  }

  playAnimation(index = 0, loop = false) {
    this.visible = false;
    this.isPlaying = true;
    this.loop = loop;
    this.index = index;

    if (this.interval > 0 && this.count) {
      this[__.timer] = setInterval(this.frameLoop.bind(this), this.interval);
    }
  }

  stopAnimation() {
    this.isPlaying = false;
    this.index = -1;
    if (this[__.timer]) {
      clearInterval(this[__.timer]);
      this[__.timer] = null;
      this.emit('stopAnimation');
    }
  }

  frameLoop() {
    this.index++;
    if (this.index >= this.count) {
      if (this.loop) {
        this.index = 0;
      } else {
        this.index = this.count - 1;
        this.stopAnimation();
      }
    }
  }
}

module.exports = Animation;
