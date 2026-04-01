/**
 * 表格数据结构定义 - 自动生成
 * 生成时间: 2026-04-01 13:38:03
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
 * Audio 表数据行
 * @property {number} Id - 序号
 * @property {string} Name - 音效名称
 * @property {string} ResPath - 资源路径
 * @property {string} Type - 类型
 * @property {number} Volume - 音量
 * @property {boolean} Loop - 循环
 * @property {string} Desc - 说明
 */
class AudioRow extends BaseTableRow {
  constructor() {
    super();
    this.Id = 0;
    this.Name = '';
    this.ResPath = '';
    this.Type = '';
    this.Volume = 0;
    this.Loop = false;
    this.Desc = '';
  }

  static create(obj, fields, types) {
    const row = new AudioRow();
    row.initFromObject(obj, fields, types);
    return row;
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
 * GameConfig 表数据行
 * @property {number} Id - 序号
 * @property {string} Key - 配置键
 * @property {string} Name - 配置名
 * @property {number} Value - 数值
 * @property {string} Desc - 说明
 */
class GameConfigRow extends BaseTableRow {
  constructor() {
    super();
    this.Id = 0;
    this.Key = '';
    this.Name = '';
    this.Value = 0;
    this.Desc = '';
  }

  static create(obj, fields, types) {
    const row = new GameConfigRow();
    row.initFromObject(obj, fields, types);
    return row;
  }
}

/**
 * Milestones 表数据行
 * @property {number} Id - 序号
 * @property {number} Height - 高度
 * @property {string} Message - 消息模板
 */
class MilestonesRow extends BaseTableRow {
  constructor() {
    super();
    this.Id = 0;
    this.Height = 0;
    this.Message = '';
  }

  static create(obj, fields, types) {
    const row = new MilestonesRow();
    row.initFromObject(obj, fields, types);
    return row;
  }
}

/**
 * Monsters 表数据行
 * @property {number} Id - 序号
 * @property {string} Name - 怪物名称
 * @property {number} Hp - 生命值
 * @property {number} Attack - 攻击力
 * @property {number} Speed - 移动速度
 * @property {string} ChasePath - 追击动作路径
 * @property {boolean} IsBoss - 是否Boss
 * @property {string} SpawnCond - 出现条件
 * @property {string} DropReward - 掉落奖励
 */
class MonstersRow extends BaseTableRow {
  constructor() {
    super();
    this.Id = 0;
    this.Name = '';
    this.Hp = 0;
    this.Attack = 0;
    this.Speed = 0;
    this.ChasePath = '';
    this.IsBoss = false;
    this.SpawnCond = '';
    this.DropReward = '';
  }

  static create(obj, fields, types) {
    const row = new MonstersRow();
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
 * @property {number} Scale - 缩放系数
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
    this.Scale = 0;
  }

  static create(obj, fields, types) {
    const row = new PlatformsRow();
    row.initFromObject(obj, fields, types);
    return row;
  }
}

/**
 * Praises 表数据行
 * @property {number} Id - 序号
 * @property {string} Template - 模板文本
 * @property {number} Weight - 权重
 */
class PraisesRow extends BaseTableRow {
  constructor() {
    super();
    this.Id = 0;
    this.Template = '';
    this.Weight = 0;
  }

  static create(obj, fields, types) {
    const row = new PraisesRow();
    row.initFromObject(obj, fields, types);
    return row;
  }
}

/**
 * UIText 表数据行
 * @property {number} Id - 序号
 * @property {string} Key - 文本键
 * @property {string} Text - 中文内容
 * @property {string} Scene - 场景
 * @property {string} Desc - 说明
 */
class UITextRow extends BaseTableRow {
  constructor() {
    super();
    this.Id = 0;
    this.Key = '';
    this.Text = '';
    this.Scene = '';
    this.Desc = '';
  }

  static create(obj, fields, types) {
    const row = new UITextRow();
    row.initFromObject(obj, fields, types);
    return row;
  }
}

module.exports = {
  BaseTableRow,
  AudioRow,
  CharacterRow,
  GameConfigRow,
  MilestonesRow,
  MonstersRow,
  PlatformsRow,
  PraisesRow,
  UITextRow,
};