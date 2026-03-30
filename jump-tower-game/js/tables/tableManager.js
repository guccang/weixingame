/**
 * 表格数据管理器
 * 首次启动时将数据复制到用户目录，之后从用户目录加载
 */

const { TableConfigs } = require('./tableConfig');
const initialData = require('./tableData');

const { CharacterRow } = require('./tableStruct');
const { PlatformsRow } = require('./tableStruct');

class TableManager {
  constructor() {
    this.tables = {};
    this.maps = {};
    this.initialized = false;
    this.userDataPath = wx.env.USER_DATA_PATH;
    this.tableDir = this.userDataPath + "/game_tables";
  }

  /**
   * 初始化：确保用户目录有数据，然后加载
   */
  init() {
    if (this.initialized) return;

    // 确保表格目录存在
    this._ensureTableDir();

    // 检查并复制初始数据
    this._checkAndCopyData();

    // 加载所有表格
    for (const tableName in TableConfigs) {
      this._loadTable(tableName);
    }

    this.initialized = true;
    console.log("[TableManager] 初始化完成:", Object.keys(this.tables));
  }

  /**
   * 确保表格目录存在
   */
  _ensureTableDir() {
    const fs = wx.getFileSystemManager();
    try {
      fs.accessSync(this.tableDir);
    } catch (e) {
      fs.mkdirSync(this.tableDir, true);
      console.log("[TableManager] 创建表格目录:", this.tableDir);
    }
  }

  /**
   * 检查并复制初始数据到用户目录
   */
  _checkAndCopyData() {
    const fs = wx.getFileSystemManager();
    const versionFile = this.tableDir + "/.version";
    const currentVersion = "20260331021807";

    let needCopy = false;
    try {
      const savedVersion = fs.readFileSync(versionFile, "utf-8");
      if (savedVersion !== currentVersion) {
        needCopy = true;
      }
    } catch (e) {
      needCopy = true;
    }

    if (needCopy) {
      console.log("[TableManager] 复制初始数据到用户目录...");
      for (const tableName in TableConfigs) {
        const config = TableConfigs[tableName];
        const filePath = this.tableDir + "/" + config.file;
        const data = initialData[tableName + "Data"];
        fs.writeFileSync(filePath, JSON.stringify(data), "utf-8");
        console.log("[TableManager] 写入:", filePath);
      }
      fs.writeFileSync(versionFile, currentVersion, "utf-8");
      console.log("[TableManager] 数据复制完成");
    }
  }

  /**
   * 从用户目录加载表格
   */
  _loadTable(tableName) {
    const config = TableConfigs[tableName];
    const filePath = this.tableDir + "/" + config.file;
    const RowClass = this._getRowClass(tableName);

    try {
      const fs = wx.getFileSystemManager();
      const content = fs.readFileSync(filePath, "utf-8");
      const dataArray = JSON.parse(content);

      const fields = config.fields.map(f => f.name);
      const types = config.fields.map(f => f.type);

      const rows = dataArray.map(obj => RowClass.create(obj, fields, types));
      this.tables[tableName] = rows;
      this.maps[tableName] = this._buildMap(rows);

      console.log(`[TableManager] 加载 ${tableName}: ${rows.length} 行`);
    } catch (e) {
      console.error(`[TableManager] 加载失败 ${tableName}:`, e);
      this.tables[tableName] = [];
      this.maps[tableName] = {};
    }
  }

  _getRowClass(tableName) {
    const classMap = {
      Character: CharacterRow,
      Platforms: PlatformsRow,
    };
    return classMap[tableName];
  }

  _buildMap(rows) {
    const map = {};
    for (const row of rows) {
      map[row.id] = row;
    }
    return map;
  }

  // ==================== 查询接口 ====================

  getAll(tableName) {
    this._checkInit();
    return this.tables[tableName] || [];
  }

  getById(tableName, id) {
    this._checkInit();
    return this.maps[tableName] ? this.maps[tableName][id] : null;
  }

  find(tableName, predicate) {
    return this.getAll(tableName).filter(predicate);
  }

  findOne(tableName, predicate) {
    return this.getAll(tableName).find(predicate) || null;
  }

  _checkInit() {
    if (!this.initialized) this.init();
  }
}

// 单例
const tableManager = new TableManager();

module.exports = {
  tableManager,
  getAll: (name) => tableManager.getAll(name),
  getById: (name, id) => tableManager.getById(name, id),
  find: (name, fn) => tableManager.find(name, fn),
  findOne: (name, fn) => tableManager.findOne(name, fn),
};