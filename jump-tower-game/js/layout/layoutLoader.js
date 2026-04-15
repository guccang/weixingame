/**
 * 布局加载器
 * 负责加载和管理JSON布局配置文件
 */

const LayoutEngine = require('./layoutEngine');

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
    // 开始界面布局配置
    const startScreenConfig = {
      id: "startScreen",
      vars: {
        iconSize: 50,
        bottomBarHeight: 100
      },
      elements: [
        {
          id: "title",
          type: "text",
          anchor: { x: "center", y: "top" },
          offset: { x: 0, y: 180 },
          size: { width: 200, height: 40 },
          style: {
            color: "#ffdd57",
            fontSize: 36,
            fontWeight: "bold",
            textAlign: "center",
            shadow: { color: "#ffaa00", blur: 20 }
          }
        },
        {
          id: "subtitle",
          type: "text",
          anchor: { x: "center", y: "top" },
          offset: { x: 0, y: 240 },
          size: { width: 300, height: 30 },
          style: {
            color: "#ff6b6b",
            fontSize: 20,
            textAlign: "center"
          }
        },
        {
          id: "hint",
          type: "text",
          anchor: { x: "center", y: "top" },
          offset: { x: 0, y: 280 },
          size: { width: 300, height: 24 },
          style: {
            color: "#74b9ff",
            fontSize: 16,
            textAlign: "center"
          }
        },
        {
          id: "startBtn",
          type: "button",
          anchor: { x: "center", y: "bottom" },
          offset: { x: 0, y: -170 },
          size: { width: 140, height: 50 },
          style: {
            bgColor: "#00d084",
            borderRadius: 25,
            textColor: "#ffffff",
            fontSize: 20,
            fontWeight: "bold",
            textAlign: "center",
            shadow: { color: "#00d084", blur: 15 }
          }
        },
        {
          id: "bottomBar",
          type: "flex",
          anchor: { x: "center", y: "bottom" },
          offset: { x: 0, y: -100 },
          flex: {
            direction: "row",
            gap: 0,
            justify: "space-between",
            align: "center"
          },
          size: { width: "100%", height: 50 },
          children: [
            { id: "shop", type: "iconButton", size: { width: 50, height: 50 } },
            { id: "character", type: "iconButton", size: { width: 50, height: 50 } },
            { id: "mode", type: "iconButton", size: { width: 50, height: 50 } },
            { id: "achievement", type: "iconButton", size: { width: 50, height: 50 } },
            { id: "leaderboard", type: "iconButton", size: { width: 50, height: 50 } },
            { id: "pet", type: "iconButton", size: { width: 50, height: 50 } },
            { id: "backpack", type: "iconButton", size: { width: 50, height: 50 } }
          ]
        }
      ]
    };

    // 加载配置到引擎
    this.engine.loadLayout('startScreen', startScreenConfig);
    console.log('[LayoutLoader] Initialized layouts: startScreen');
  }

  /**
   * 加载单个布局文件
   * @param {string} layoutId - 布局ID
   * @param {string} configPath - 配置文件路径（保留参数）
   */
  loadLayoutFile(layoutId, configPath) {
    // 布局已在构造函数中加载，这里只记录
    this.loadedFiles.add(configPath || layoutId);
    console.log(`[LayoutLoader] Layout ready: ${layoutId}`);
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

module.exports = {
  LayoutLoader,
  getLayoutLoader
};
