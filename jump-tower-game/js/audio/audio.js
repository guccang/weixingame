// 音效管理器

let instance;

class Audio {
  constructor() {
    if (instance) return instance;

    instance = this;

    // 背景音乐
    this.bgmAudio = wx.createInnerAudioContext();
    this.bgmAudio.loop = true;
    this.bgmAudio.volume = 1.0;
    this.bgmAudio.src = 'audio/background_music.mp3';

    // 跳跃音效
    this.jumpAudio = wx.createInnerAudioContext();
    this.jumpAudio.src = 'audio/jump.mp3';

    // 点击音效
    this.clickAudio = wx.createInnerAudioContext();
    this.clickAudio.src = 'audio/click.mp3';

    this.bgmPlaying = false;
  }

  // 播放背景音乐
  playBGM() {
    if (this.bgmPlaying) return;
    try {
      this.bgmAudio.play();
      this.bgmPlaying = true;
    } catch (e) {
      console.log('BGM play failed:', e);
    }
  }

  // 停止背景音乐
  stopBGM() {
    if (!this.bgmPlaying) return;
    try {
      this.bgmAudio.stop();
      this.bgmPlaying = false;
    } catch (e) {
      console.log('BGM stop failed:', e);
    }
  }

  // 播放跳跃音效
  playJump() {
    try {
      this.jumpAudio.currentTime = 0;
      this.jumpAudio.play();
    } catch (e) {
      console.log('Jump sound play failed:', e);
    }
  }

  // 播放点击音效
  playClick() {
    try {
      this.clickAudio.currentTime = 0;
      this.clickAudio.play();
    } catch (e) {
      console.log('Click sound play failed:', e);
    }
  }
}

module.exports = Audio;
