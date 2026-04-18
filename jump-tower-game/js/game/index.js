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
    this.challengeGoal = null;
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
      this.challengeGoal = null;
    } else if (this.gameMode === GAME_MODES.CHALLENGE) {
      this.timeRemaining = 0;
      this.challengeCompleted = false;
      this.challengeGoal = this.createChallengeGoal(this.selectedLandmark);
    } else {
      this.timeRemaining = 0;
      this.challengeCompleted = false;
      this.challengeGoal = null;
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

  createChallengeGoal(landmark) {
    if (!landmark || !landmark.challengeObjective) return null;
    const objective = landmark.challengeObjective;
    return {
      metric: objective.metric,
      target: Math.max(1, Math.round(objective.target || 1)),
      progress: 0,
      title: objective.title || '赛区目标',
      desc: objective.desc || '完成赛区考核',
      summaryLabel: objective.summaryLabel || objective.title || '目标',
      preview: objective.preview || objective.desc || objective.title || '赛区考核'
    };
  }

  getChallengeGoal() {
    if (this.gameMode !== GAME_MODES.CHALLENGE) return null;
    return this.challengeGoal;
  }

  isChallengeCompleted() {
    return this.gameMode === GAME_MODES.CHALLENGE && !!this.challengeCompleted;
  }

  recordProgress(game, metric, amount) {
    if (this.gameMode !== GAME_MODES.CHALLENGE) return false;
    if (!this.challengeGoal || this.challengeCompleted) return false;
    if (this.challengeGoal.metric !== metric) return false;

    const delta = Math.max(0, Math.round(amount || 1));
    if (delta <= 0) return false;

    this.challengeGoal.progress = Math.min(
      this.challengeGoal.target,
      this.challengeGoal.progress + delta
    );

    if (this.challengeGoal.progress >= this.challengeGoal.target) {
      this.completeChallenge(game);
    }
    return true;
  }

  recordPlatformLanding(game, platform) {
    if (this.gameMode !== GAME_MODES.CHALLENGE || !platform) return;
    if (platform.type === 'moving') {
      this.recordProgress(game, 'movingLandings', 1);
    }
    if (platform.specialType === 'risk') {
      this.recordProgress(game, 'riskLandings', 1);
    }
    if (platform.specialType === 'one_way') {
      this.recordProgress(game, 'oneWayLandings', 1);
    }
    if (platform.specialType === 'charge_sink' && platform.lastChargeSinkTriggered) {
      this.recordProgress(game, 'chargeSinkLaunches', 1);
    }
  }

  completeChallenge(game) {
    if (this.challengeCompleted) return;
    this.challengeCompleted = true;
    if (game && game.barrage) {
      game.barrage.show(game.W / 2 - 96, game.H / 2 - 40, this.challengeGoal.title + ' 达成', '#7cf3c8');
    }
    if (game && typeof game.scheduleTimeout === 'function') {
      game.scheduleTimeout(function() {
        if (game.state === 'playing') {
          game.gameOver();
        }
      }, 900);
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
    this.challengeGoal = null;
  }
}

module.exports = {
  GameMode,
  GAME_MODES,
  TIME_ATTACK_OPTIONS,
  landmarks
};
