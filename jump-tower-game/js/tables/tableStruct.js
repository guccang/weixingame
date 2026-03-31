/**
 * 表格数据结构定义 - 自动生成
 * 生成时间: 2026-03-31 13:45:37
 */

const { FieldType } = require('./tableConfig');

/**
 * 表格行基类
 */
class BaseTableRow {
  constructor() { this._id = 0; }
  get id() { return this._id; }

  initFromObject(obj, fields, types) {
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      const type = types[i] || "STRING";
      this[field] = this._parseValue(obj[field], type);
    }
    if (this[fields[0]] !== undefined) {
      this._id = this[fields[0]];
    }
  }

  _parseValue(value, type) {
    switch (type) {
      case FieldType.INT: return parseInt(value) || 0;
      case FieldType.FLOAT: return parseFloat(value) || 0;
      case FieldType.BOOL: return value === true || value === "true" || value === "1";
      default: return String(value || "");
    }
  }
}

/**
 * Character 表数据行
 * @property {number} Id - 序号
 * @property {string} Name - 角色名字
 * @property {string} JumpFolder - 跳跃序列帧文件夹
 */
class CharacterRow extends BaseTableRow {
  constructor() {
    super();
    this.Id = 0;
    this.Name = '';
    this.JumpFolder = '';
  }

  static create(obj, fields, types) {
    const row = new CharacterRow();
    row.initFromObject(obj, fields, types);
    return row;
  }
}

/**
 * Platforms 表数据行
 * @property {number} Id - 序号
 * @property {string} Name - 平台名称
 * @property {string} ResPath - 资源路径
 * @property {string} Type - 类型
 * @property {number} BounceForce - 弹跳力
 * @property {number} MoveSpeed - 移动速度
 * @property {number} MoveRange - 移动范围
 */
class PlatformsRow extends BaseTableRow {
  constructor() {
    super();
    this.Id = 0;
    this.Name = '';
    this.ResPath = '';
    this.Type = '';
    this.BounceForce = 0;
    this.MoveSpeed = 0;
    this.MoveRange = 0;
  }

  static create(obj, fields, types) {
    const row = new PlatformsRow();
    row.initFromObject(obj, fields, types);
    return row;
  }
}

module.exports = {
  BaseTableRow,
  CharacterRow,
  PlatformsRow,
};