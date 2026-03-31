/**
 * 表格数据管理器
 * 直接从 tables/*.txt 文件读取数据
 * 生成时间: 2026-03-31 17:30:13
 */

const { TableConfigs } = require('./tableConfig');

const { CharacterRow } = require('./tableStruct');
const { PlatformsRow } = require('./tableStruct');

class TableManager {
  constructor() {
    this.tables = {};
    this.maps = {};
    this.initialized = false;
  }

  /**
   * 初始化：直接从 .txt 文件加载所有表格
   */
  init() {
    if (this.initialized) return;

    // 加载所有表格
    for (const tableName in TableConfigs) {
      this._loadTableFromTxt(tableName);
    }

    this.initialized = true;
    console.log("[TableManager] 初始化完成:", Object.keys(this.tables));
  }

  /**
   * 从 .txt 文件加载表格
   */
  _loadTableFromTxt(tableName) {
    const config = TableConfigs[tableName];
    const txtPath = "tables/" + config.file;
    const RowClass = this._getRowClass(tableName);

    try {
      const fs = wx.getFileSystemManager();
      const content = fs.readFileSync(txtPath, "utf-8");

      // 解析 Tab 分隔的文本
      const lines = content.split("\n").filter(line => line.trim());

      if (lines.length < 4) {
        console.warn(`[TableManager] 表格 ${tableName} 数据为空`);
        this.tables[tableName] = [];
        this.maps[tableName] = {};
        return;
      }

      // 第1行：类型定义
      const types = lines[0].split("\t").map(t => t.trim());
      // 第2行：中文列名（跳过）
      // 第3行：英文列名
      const fields = lines[2].split("\t").map(f => f.replace(/^#/, "").trim());

      // 解析数据行（从第4行开始）
      const rows = [];
      for (let i = 3; i < lines.length; i++) {
        const values = lines[i].split("\t");
        const obj = {};

        for (let j = 0; j < fields.length; j++) {
          obj[fields[j]] = values[j] || "";
        }

        const row = RowClass.create(obj, fields, types);
        rows.push(row);
      }

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
      map[row.Id] = row;
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