let instance;

/**
 * 统一的音效管理器
 */
class Music {
  constructor() {
    if (instance) return instance;

    instance = this;

    this.bgmAudio = wx.createInnerAudioContext();
    this.jumpAudio = wx.createInnerAudioContext();

    this.bgmAudio.loop = true;
    this.bgmAudio.autoplay = false;
    this.bgmAudio.src = 'audio/bgm.mp3';
    this.jumpAudio.src = 'audio/jump.ogg';
  }

  playBGM() {
    try {
      this.bgmAudio.play();
    } catch (e) {
      console.log('BGM play failed:', e);
    }
  }

  playJump() {
    try {
      this.jumpAudio.currentTime = 0;
      this.jumpAudio.play();
    } catch (e) {
      console.log('Jump sound play failed:', e);
    }
  }
}

module.exports = Music;
