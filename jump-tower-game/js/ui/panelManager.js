/**
 * UI面板管理器
 * 集中管理所有面板的开启/关闭/查询，彻底解决面板互斥和"关闭后触发开始按钮"类bug
 * 支持面板生命周期钩子，用于埋点、音效等副作用
 * 统一管理所有面板状态，逐步迁移至内部存储
 * 支持面板历史栈，实现返回导航功能
 */

class UIPanelManager {
  constructor(game) {
    this.game = game;
    // 内部面板状态（单一数据源）
    this.panels = {
      showCharacterPanel: false,
      showDebugPanel: false,
      showShopPanel: false,
      showAchievementPanel: false,
      showLeaderboardPanel: false,
      showModeSelect: false,
      showTimeSelect: false,
      showLandmarkSelect: false
    };
    // 钩子系统
    this.hooks = {
      beforeOpen: {},
      afterOpen: {},
      beforeClose: {},
      afterClose: {}
    };
    // 历史栈（用于返回导航）
    this.history = [];
    this.maxHistorySize = 10;
  }

  // 注册钩子函数
  on(event, panelKey, fn) {
    if (!this.hooks[event]) {
      this.hooks[event] = {};
    }
    if (!this.hooks[event][panelKey]) {
      this.hooks[event][panelKey] = [];
    }
    this.hooks[event][panelKey].push(fn);
  }

  // 移除钩子函数
  off(event, panelKey, fn) {
    const eventHooks = this.hooks[event];
    if (!eventHooks) return;
    const hooks = eventHooks[panelKey];
    if (!hooks) return;
    const index = hooks.indexOf(fn);
    if (index !== -1) {
      hooks.splice(index, 1);
    }
  }

  // 执行钩子
  _runHooks(event, panelKey) {
    const eventHooks = this.hooks[event];
    const hooks = (eventHooks && eventHooks[panelKey]) || [];
    for (var i = 0; i < hooks.length; i++) {
      try {
        hooks[i](this.game);
      } catch (e) {
        console.error('[UIPanelManager] Hook error:', event, panelKey, e);
      }
    }
  }

  // 同步内部状态到外部（兼容旧代码，逐步迁移）
  _syncToExternal(panelKey) {
    const value = this.panels[panelKey];
    // gameMode 下的面板
    if (['showModeSelect', 'showTimeSelect', 'showLandmarkSelect'].includes(panelKey)) {
      this.game.gameMode[panelKey] = value;
    } else {
      // game 顶层面板
      this.game[panelKey] = value;
    }
  }

  // 从外部状态同步到内部（初始化时使用）
  _syncFromExternal() {
    const g = this.game;
    this.panels.showCharacterPanel = !!g.showCharacterPanel;
    this.panels.showDebugPanel = !!g.showDebugPanel;
    this.panels.showShopPanel = !!g.showShopPanel;
    this.panels.showAchievementPanel = !!g.showAchievementPanel;
    this.panels.showLeaderboardPanel = !!g.showLeaderboardPanel;
    this.panels.showModeSelect = !!g.gameMode.showModeSelect;
    this.panels.showTimeSelect = !!g.gameMode.showTimeSelect;
    this.panels.showLandmarkSelect = !!g.gameMode.showLandmarkSelect;
  }

  // 获取面板状态（推荐使用此方法访问面板状态）
  isOpen(panelKey) {
    return this.panels[panelKey] || false;
  }

  // 判断是否有任意面板打开
  isAnyOpen() {
    return Object.values(this.panels).some(v => v);
  }

  // 获取当前打开的面板key
  getActivePanel() {
    for (const key in this.panels) {
      if (this.panels[key]) return key;
    }
    return null;
  }

  // 关闭所有面板
  closeAll() {
    // 先收集所有打开的面板（为了触发钩子）
    const openPanels = [];
    for (const key in this.panels) {
      if (this.panels[key]) openPanels.push(key);
    }
    // 触发关闭前钩子
    for (const key of openPanels) {
      this._runHooks('beforeClose', key);
    }
    // 关闭所有面板
    for (const key in this.panels) {
      this.panels[key] = false;
      this._syncToExternal(key);
    }
    // 触发关闭后钩子
    for (const key of openPanels) {
      this._runHooks('afterClose', key);
    }
    // 清空历史栈
    this.history = [];
  }

  // 打开指定面板（同时关闭其他所有面板）
  open(panelKey, saveHistory = true) {
    // 触发打开前钩子
    this._runHooks('beforeOpen', panelKey);

    this.closeAll();
    this.panels[panelKey] = true;
    this._syncToExternal(panelKey);

    // 记录历史
    if (saveHistory) {
      this.history.push(panelKey);
      // 限制历史栈大小
      if (this.history.length > this.maxHistorySize) {
        this.history.shift();
      }
    }

    // 触发打开后钩子
    this._runHooks('afterOpen', panelKey);
  }

  // 关闭指定面板
  close(panelKey) {
    if (!this.panels[panelKey]) return;

    // 触发关闭前钩子
    this._runHooks('beforeClose', panelKey);

    this.panels[panelKey] = false;
    this._syncToExternal(panelKey);

    // 从历史栈中移除
    const index = this.history.indexOf(panelKey);
    if (index !== -1) {
      this.history.splice(index, 1);
    }

    // 触发关闭后钩子
    this._runHooks('afterClose', panelKey);
  }

  // 切换面板（如果打开则关闭，如果关闭则打开）
  toggle(panelKey) {
    if (this.panels[panelKey]) {
      this.close(panelKey);
    } else {
      this.open(panelKey);
    }
  }

  /**
   * 返回上一个面板（用于导航）
   * @returns {string|null} 返回到的面板key，如果没有历史则返回null
   */
  back() {
    // 移除当前面板
    const current = this.history.pop();

    if (this.history.length === 0) {
      // 没有历史了，关闭所有面板
      this.closeAll();
      return null;
    }

    // 获取上一个面板
    const prev = this.history[this.history.length - 1];
    if (prev) {
      this.open(prev, false); // 不重复记录历史
    }
    return prev;
  }

  /**
   * 获取历史栈深度
   */
  getHistoryDepth() {
    return this.history.length;
  }

  /**
   * 清空历史栈但保持当前面板状态
   */
  clearHistory() {
    const current = this.getActivePanel();
    this.history = current ? [current] : [];
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

  // 重置所有面板状态
  reset() {
    this.closeAll();
  }
}

module.exports = UIPanelManager;
