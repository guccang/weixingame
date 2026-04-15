/**
 * 布局加载器
 * 负责加载和管理JSON布局配置文件
 */

const LayoutEngine = require('./layoutEngine');
const startScreenLayout = require('./configs/startScreenLayout');

const LAYOUT_FILES = {
  startScreen: startScreenLayout,
  'startScreen.json': startScreenLayout,
  'startScreenLayout.js': startScreenLayout
};

class LayoutLoader {
  constructor() {
    this.engine = new LayoutEngine();
    this.loadedFiles = new Set();

    // 初始化时加载所有布局配置
    this._initLayouts();
  }

  /**
   * 初始化所有布局配置
   */
  _initLayouts() {
    this.loadLayoutFile('startScreen', 'startScreen.json');
    console.log('[LayoutLoader] Initialized layouts from JSON');
  }

  /**
   * 加载单个布局文件
   * @param {string} layoutId - 布局ID
   * @param {string} configPath - 配置文件路径（保留参数）
   */
  loadLayoutFile(layoutId, configPath) {
    const key = configPath || layoutId;
    const config = LAYOUT_FILES[key] || LAYOUT_FILES[layoutId];
    if (!config) {
      throw new Error('[LayoutLoader] Missing layout file: ' + key);
    }

    this.engine.loadLayout(layoutId, cloneConfig(config));
    this.loadedFiles.add(key);
    console.log('[LayoutLoader] Layout ready:', layoutId, 'from', key);
    return true;
  }

  /**
   * 直接加载布局配置对象
   * @param {string} layoutId - 布局ID
   * @param {Object} config - 布局配置
   */
  loadLayout(layoutId, config) {
    this.engine.loadLayout(layoutId, config);
    return this;
  }

  /**
   * 加载组件模板
   * @param {string} templateId - 模板ID
   * @param {Object} template - 模板配置
   */
  loadTemplate(templateId, template) {
    this.engine.loadTemplate(templateId, template);
    return this;
  }

  /**
   * 获取布局引擎实例
   * @returns {LayoutEngine}
   */
  getEngine() {
    return this.engine;
  }

  /**
   * 解析布局（便捷方法）
   * @param {string} layoutId - 布局ID
   * @param {number} W - 宽度
   * @param {number} H - 高度
   * @returns {Object} 解析后的布局
   */
  resolve(layoutId, W, H) {
    return this.engine.resolveLayout(layoutId, W, H);
  }

  /**
   * 获取元素bounds（便捷方法）
   * @param {Object} layout - 解析后的布局
   * @param {string} elementId - 元素ID
   * @returns {Object|null}
   */
  getBounds(layout, elementId) {
    return this.engine.getBounds(layout, elementId);
  }

  /**
   * 点击检测（便捷方法）
   * @param {Object} bounds - bounds对象
   * @param {number} x - 点击X
   * @param {number} y - 点击Y
   * @returns {boolean}
   */
  hitTest(bounds, x, y) {
    return this.engine.hitTest(bounds, x, y);
  }
}

// 创建单例
let instance = null;

function getLayoutLoader() {
  if (!instance) {
    instance = new LayoutLoader();
  }
  return instance;
}

function cloneConfig(config) {
  return JSON.parse(JSON.stringify(config));
}

module.exports = {
  LayoutLoader,
  getLayoutLoader
};
