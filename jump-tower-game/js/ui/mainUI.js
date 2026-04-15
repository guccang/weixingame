// 主界面UI控制

const { GAME_MODES, landmarks } = require('../game/index');

class MainUI {
  constructor(game) {
    this.game = game;
  }

  handleTouch(touchX, touchY) {
    const target = this._hit(touchX, touchY);
    if (target && this._dispatch(target)) {
      return true;
    }

    return this._handleFallbackTouch(touchX, touchY);
  }

  handleGameOverTouch(touchX, touchY) {
    const target = this._hit(touchX, touchY, function(entry) {
      return entry.id.indexOf('gameover.') === 0;
    });

    if (target && this._dispatch(target)) {
      return true;
    }

    return !!this._hit(touchX, touchY, function(entry) {
      return entry.id === 'gameover.panel';
    });
  }

  _hit(x, y, predicate) {
    const registry = this.game.uiRegistry;
    return registry ? registry.hitTest(x, y, predicate) : null;
  }

  _dispatch(entry) {
    const meta = entry && entry.meta ? entry.meta : {};
    const action = meta.action;
    if (!action) {
      return !!meta.consume;
    }

    this.game.audio.playClick();
    return this._runAction(action, entry);
  }

  _runAction(action, entry) {
    const pm = this.game.panelManager;
    const type = typeof action === 'string' ? action : action.type;

    switch (type) {
      case 'grant-debug-coins':
        this.game.grantDebugCoins();
        return true;
      case 'open-debug-panel':
        if (typeof this.game.resetDebugPanelScroll === 'function') {
          this.game.resetDebugPanelScroll();
        }
        pm.open('showDebugPanel');
        return true;
      case 'open-panel':
        pm.open(action.panel);
        if (action.panel === 'showShopPanel') {
          this.game.setShopTab(this.game.shopTab || 'upgrades');
        }
        if (action.panel === 'showLeaderboardPanel') {
          this.game.fetchRankList();
        }
        return true;
      case 'close-panel':
        pm.close(action.panel);
        return true;
      case 'close-character-panel':
        this.game.characterPendingSelect = null;
        pm.close('showCharacterPanel');
        return true;
      case 'panel-back':
        pm.back();
        return true;
      case 'shop-tab':
        this.game.setShopTab(action.tabId);
        return true;
      case 'shop-action':
        this.game.performShopAction(action.actionName, action.itemId);
        return true;
      case 'mode-select':
        this.game.gameMode.selectMode(action.modeName);
        if (action.modeName === GAME_MODES.ENDLESS) {
          this.game.startGame();
        } else if (action.modeName === GAME_MODES.TIME_ATTACK) {
          pm.open('showTimeSelect');
        } else if (action.modeName === GAME_MODES.CHALLENGE) {
          pm.open('showLandmarkSelect');
        }
        return true;
      case 'time-select':
        this.game.gameMode.selectTimeLimit(action.value);
        this.game.startGame();
        return true;
      case 'landmark-select':
        if (typeof action.landmarkIndex === 'number' && landmarks[action.landmarkIndex]) {
          this.game.gameMode.selectLandmark(landmarks[action.landmarkIndex]);
          this.game.startGame();
          return true;
        }
        return false;
      case 'debug-preset-toggle':
        this.game.selectDebugPreset(action.presetId);
        return true;
      case 'debug-option-cycle':
        this.game.cycleDebugOption(action.key);
        return true;
      case 'debug-reset':
        this.game.resetDebugDraft();
        return true;
      case 'debug-launch':
        this.game.startDebugGame();
        return true;
      case 'confirm-character-select':
        if (this.game.confirmCharacterSelect()) {
          pm.close('showCharacterPanel');
        }
        return true;
      case 'start-game':
        if (action.mode) {
          this.game.gameMode.selectMode(action.mode);
        }
        this.game.startGame();
        return true;
      case 'game-restart':
        if (typeof this.game.restartCurrentRun === 'function') {
          this.game.restartCurrentRun();
        } else {
          this.game.startGame();
        }
        return true;
      case 'game-share':
        if (this.game.gameOps) {
          this.game.gameOps.shareToFriend();
        }
        return true;
      case 'game-home':
        this.game.goToHome();
        return true;
      default:
        return false;
    }
  }

  _handleFallbackTouch(touchX, touchY) {
    const pm = this.game.panelManager;

    if (pm.isOpen('showCharacterPanel')) {
      if (this.game.handleCharacterScroll(touchX, touchY)) {
        return true;
      }
      if (this.game.checkCharacterSelectClick(touchX, touchY)) {
        return true;
      }
      return true;
    }

    if (pm.isOpen('showShopPanel')) {
      pm.close('showShopPanel');
      return true;
    }

    if (pm.isOpen('showLeaderboardPanel')) {
      pm.close('showLeaderboardPanel');
      return true;
    }

    if (pm.isOpen('showAchievementPanel')) {
      pm.close('showAchievementPanel');
      return true;
    }

    if (pm.isOpen('showDebugPanel') || pm.isOpen('showModeSelect') ||
        pm.isOpen('showTimeSelect') || pm.isOpen('showLandmarkSelect')) {
      return true;
    }

    return false;
  }
}

module.exports = MainUI;
