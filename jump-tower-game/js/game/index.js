/**
 * 游戏模式管理模块
 */

const { GAME_MODES, TIME_ATTACK_OPTIONS } = require('./constants');
const { landmarks } = require('./landmarks');

class GameMode {
  constructor() {
    this.gameMode = GAME_MODES.ENDLESS;
    this.selectedTimeLimit = TIME_ATTACK_OPTIONS[1].value; // 默认5分钟
    this.selectedLandmark = null;
    this.timeRemaining = 0;
    this.challengeCompleted = false;
  }

  selectMode(mode) {
    this.gameMode = mode;
  }

  selectTimeLimit(ms) {
    this.selectedTimeLimit = ms;
  }

  selectLandmark(landmark) {
    this.selectedLandmark = landmark;
  }

  initForGame(game) {
    // 初始化游戏特定状态
    if (this.gameMode === GAME_MODES.TIME_ATTACK) {
      this.timeRemaining = this.selectedTimeLimit;
      this.challengeCompleted = false;
    } else if (this.gameMode === GAME_MODES.CHALLENGE) {
      this.timeRemaining = 0;
      this.challengeCompleted = false;
    } else {
      this.timeRemaining = 0;
      this.challengeCompleted = false;
    }
  }

  update(game, deltaTime) {
    // 竞速模式计时器倒计时
    if (this.gameMode === GAME_MODES.TIME_ATTACK) {
      this.timeRemaining -= deltaTime;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        game.gameOver();
        return true; // 返回true表示游戏结束
      }
    }
    return false;
  }

  onGameOver(game) {
    // 存储最终状态
    if (this.gameMode === GAME_MODES.TIME_ATTACK) {
      game.finalTimeRemaining = this.timeRemaining;
      game.finalElapsedTime = this.selectedTimeLimit - this.timeRemaining;
    }
  }

  getModeName() {
    switch (this.gameMode) {
      case GAME_MODES.CHALLENGE:
        return '闯关模式';
      case GAME_MODES.TIME_ATTACK:
        return '竞速模式';
      default:
        return '无尽模式';
    }
  }

  reset() {
    this.gameMode = GAME_MODES.ENDLESS;
    this.selectedTimeLimit = TIME_ATTACK_OPTIONS[1].value;
    this.selectedLandmark = null;
    this.timeRemaining = 0;
    this.challengeCompleted = false;
  }
}

module.exports = {
  GameMode,
  GAME_MODES,
  TIME_ATTACK_OPTIONS,
  landmarks
};
