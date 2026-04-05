/**
 * 滚动处理器
 * 处理可滚动面板的触摸滚动逻辑
 */

class ScrollHandler {
  constructor(game) {
    this.game = game;
    // 配置可滚动的面板
    this.scrollables = {
      achievement: {
        scrollKey: 'achievementScrollOffset',
        maxKey: 'achievementMaxScroll',
        panelKey: 'showAchievementPanel',
        areaKey: 'achievementPanelArea',
        sensitivity: 20,
        axis: 'vertical'
      }
    };
  }

  /**
   * 处理触摸移动事件中的滚动
   * @param {number} touchX - 当前触摸X
   * @param {number} touchY - 当前触摸Y
   * @param {number} touchStartX - 起始触摸X
   * @param {number} touchStartY - 起始触摸Y
   * @returns {boolean} 是否处理了滚动
   */
  handleMove(touchX, touchY, touchStartX, touchStartY) {
    const deltaX = touchX - touchStartX;
    const deltaY = touchY - touchStartY;
    const isMoving = Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5;

    if (!isMoving) return false;

    for (const name in this.scrollables) {
      const config = this.scrollables[name];

      // 检查面板是否打开
      if (!this._isPanelOpen(config.panelKey)) continue;

      // 检查是否在滚动区域内
      if (!this._hitArea(config.areaKey, touchX, touchY)) continue;

      // 根据轴向判断滚动方向
      if (config.axis === 'vertical') {
        if (Math.abs(deltaY) > config.sensitivity) {
          this._scroll(name, deltaY, touchY);
          return true;
        }
      } else if (config.axis === 'horizontal') {
        if (Math.abs(deltaX) > config.sensitivity) {
          this._scroll(name, deltaX, touchX);
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 执行滚动
   */
  _scroll(name, delta, currentPos) {
    const config = this.scrollables[name];
    const scroll = this.game[config.scrollKey] || 0;
    const maxScroll = this.game[config.maxKey] || 0;

    let newScroll = scroll;
    if (delta < 0 && scroll < maxScroll) {
      // 向上滚动，增加偏移
      newScroll = scroll + 1;
    } else if (delta > 0 && scroll > 0) {
      // 向下滚动，减少偏移
      newScroll = scroll - 1;
    }

    if (newScroll !== scroll) {
      this.game[config.scrollKey] = newScroll;
      this.game.touchStartY = currentPos; // 更新起始位置，避免连续触发
    }
  }

  /**
   * 检查面板是否打开
   */
  _isPanelOpen(panelKey) {
    // 优先使用 panelManager 的内部状态
    if (this.game.panelManager && this.game.panelManager.isOpen) {
      return this.game.panelManager.isOpen(panelKey);
    }
    // 兼容旧代码
    if (panelKey.startsWith('show') && this.game[panelKey] !== undefined) {
      return this.game[panelKey];
    }
    if (this.game.gameMode && this.game.gameMode[panelKey] !== undefined) {
      return this.game.gameMode[panelKey];
    }
    return false;
  }

  /**
   * 检查点是否在区域内
   */
  _hitArea(areaKey, x, y) {
    const area = this.game[areaKey];
    return area && x >= area.x && x <= area.x + area.w &&
           y >= area.y && y <= area.y + area.h;
  }

  /**
   * 添加新的可滚动面板
   * @param {string} name - 面板名称
   * @param {Object} config - 配置对象
   */
  addScrollable(name, config) {
    this.scrollables[name] = {
      scrollKey: config.scrollKey,
      maxKey: config.maxKey || null,
      panelKey: config.panelKey,
      areaKey: config.areaKey,
      sensitivity: config.sensitivity || 20,
      axis: config.axis || 'vertical'
    };
  }

  /**
   * 移除可滚动面板
   */
  removeScrollable(name) {
    delete this.scrollables[name];
  }

  /**
   * 重置所有滚动状态
   */
  reset() {
    for (const name in this.scrollables) {
      const config = this.scrollables[name];
      if (config.scrollKey) {
        this.game[config.scrollKey] = 0;
      }
    }
  }
}

module.exports = ScrollHandler;
