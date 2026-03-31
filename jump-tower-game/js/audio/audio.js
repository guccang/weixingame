// 音效管理器
// 数据从表格加载：Audio.txt

const tableManager = require('../tables/tableManager');

let instance;

class Audio {
  constructor() {
    if (instance) return instance;

    instance = this;

    // 音效缓存
    this.sounds = {};

    // 从表格加载音效配置
    this._loadFromTable();

    this.bgmPlaying = false;
  }

  /**
   * 从表格加载音效配置
   */
  _loadFromTable() {
    const audioConfigs = tableManager.getAll('Audio');

    for (const config of audioConfigs) {
      const audio = wx.createInnerAudioContext();
      audio.src = config.ResPath;
      audio.volume = config.Volume !== undefined ? config.Volume : 1.0;
      audio.loop = config.Loop === true || config.Loop === 'true';

      this.sounds[config.Type] = {
        audio,
        name: config.Name,
        type: config.Type
      };

      // 兼容旧接口
      if (config.Type === 'bgm') {
        this.bgmAudio = audio;
      } else if (config.Type === 'click') {
        this.clickAudio = audio;
      }
    }

    console.log('[Audio] 加载音效配置:', Object.keys(this.sounds).length, '个');
  }

  /**
   * 播放指定类型的音效
   * @param {string} type - 音效类型: bgm, click, jump, land, boost, dash
   */
  play(type) {
    const sound = this.sounds[type];
    if (!sound) {
      console.warn('[Audio] 未找到音效:', type);
      return;
    }

    try {
      if (type === 'bgm') {
        if (this.bgmPlaying) return;
        sound.audio.play();
        this.bgmPlaying = true;
      } else {
        sound.audio.currentTime = 0;
        sound.audio.play();
      }
    } catch (e) {
      console.log('[Audio] 播放失败:', type, e);
    }
  }

  // 播放背景音乐
  playBGM() {
    this.play('bgm');
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

  // 播放点击音效
  playClick() {
    this.play('click');
  }

  // 播放跳跃音效
  playJump() {
    this.play('jump');
  }

  // 播放落地音效
  playLand() {
    this.play('land');
  }

  // 播放弹跳音效
  playBoost() {
    this.play('boost');
  }

  // 播放蓄力冲刺音效
  playDash() {
    this.play('dash');
  }
}

module.exports = Audio;
