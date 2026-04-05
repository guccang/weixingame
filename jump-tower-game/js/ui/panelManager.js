/**
 * UI面板管理器
 * 集中管理所有面板的开启/关闭/查询，彻底解决面板互斥和"关闭后触发开始按钮"类bug
 */

class UIPanelManager {
  constructor(game) {
    this.game = game;
  }

  // 所有面板状态字段（game顶层）
  _topLevelPanels() {
    return [
      'showCharacterPanel',
      'showShopPanel',
      'showAchievementPanel',
      'showLeaderboardPanel'
    ];
  }

  // gameMode下的面板状态字段
  _gameModePanels() {
    return [
      'showModeSelect',
      'showTimeSelect',
      'showLandmarkSelect'
    ];
  }

  // 判断是否有任意面板打开
  isAnyOpen() {
    const g = this.game;
    for (const key of this._topLevelPanels()) {
      if (g[key]) return true;
    }
    for (const key of this._gameModePanels()) {
      if (g.gameMode[key]) return true;
    }
    return false;
  }

  // 关闭所有面板
  closeAll() {
    const g = this.game;
    for (const key of this._topLevelPanels()) {
      g[key] = false;
    }
    for (const key of this._gameModePanels()) {
      g.gameMode[key] = false;
    }
  }

  // 打开指定面板（同时关闭其他所有面板）
  open(panelKey) {
    this.closeAll();
    if (this._topLevelPanels().includes(panelKey)) {
      this.game[panelKey] = true;
    } else if (this._gameModePanels().includes(panelKey)) {
      this.game.gameMode[panelKey] = true;
    }
  }

  // 关闭指定面板
  close(panelKey) {
    if (this._topLevelPanels().includes(panelKey)) {
      this.game[panelKey] = false;
    } else if (this._gameModePanels().includes(panelKey)) {
      this.game.gameMode[panelKey] = false;
    }
  }

  // 打开底部图标对应的面板（关闭其他面板）
  openFromIcon(iconKey) {
    const iconToPanel = {
      character: 'showCharacterPanel',
      shop: 'showShopPanel',
      leaderboard: 'showLeaderboardPanel',
      achievement: 'showAchievementPanel',
      mode: 'showModeSelect'
    };
    const panelKey = iconToPanel[iconKey];
    if (panelKey) {
      this.open(panelKey);
    }
  }
}

module.exports = UIPanelManager;
