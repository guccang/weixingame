/**
 * 表格配置 - 自动生成
 * 生成时间: 2026-03-31 17:51:04
 */

const FieldType = {
  INT: 'INT',
  STRING: 'STRING',
  FLOAT: 'FLOAT',
  BOOL: 'BOOL',
};

const AudioConfig = {
  name: 'Audio',
  file: 'Audio.txt',
  fields: [
    { name: 'Id', type: 'INT', comment: '序号' },
    { name: 'Name', type: 'STRING', comment: '音效名称' },
    { name: 'ResPath', type: 'STRING', comment: '资源路径' },
    { name: 'Type', type: 'STRING', comment: '类型' },
    { name: 'Volume', type: 'FLOAT', comment: '音量' },
    { name: 'Loop', type: 'BOOL', comment: '循环' },
    { name: 'Desc', type: 'STRING', comment: '说明' },
  ],
};

const CharacterConfig = {
  name: 'Character',
  file: 'Character.txt',
  fields: [
    { name: 'Id', type: 'INT', comment: '序号' },
    { name: 'Name', type: 'STRING', comment: '角色名字' },
    { name: 'JumpFolder', type: 'STRING', comment: '跳跃序列帧文件夹' },
  ],
};

const GameConfigConfig = {
  name: 'GameConfig',
  file: 'GameConfig.txt',
  fields: [
    { name: 'Id', type: 'INT', comment: '序号' },
    { name: 'Key', type: 'STRING', comment: '配置键' },
    { name: 'Name', type: 'STRING', comment: '配置名' },
    { name: 'Value', type: 'FLOAT', comment: '数值' },
    { name: 'Desc', type: 'STRING', comment: '说明' },
  ],
};

const MilestonesConfig = {
  name: 'Milestones',
  file: 'Milestones.txt',
  fields: [
    { name: 'Id', type: 'INT', comment: '序号' },
    { name: 'Height', type: 'INT', comment: '高度' },
    { name: 'Message', type: 'STRING', comment: '消息模板' },
  ],
};

const PlatformsConfig = {
  name: 'Platforms',
  file: 'Platforms.txt',
  fields: [
    { name: 'Id', type: 'INT', comment: '序号' },
    { name: 'Name', type: 'STRING', comment: '平台名称' },
    { name: 'ResPath', type: 'STRING', comment: '资源路径' },
    { name: 'Type', type: 'STRING', comment: '类型' },
    { name: 'BounceForce', type: 'FLOAT', comment: '弹跳力' },
    { name: 'MoveSpeed', type: 'FLOAT', comment: '移动速度' },
    { name: 'MoveRange', type: 'FLOAT', comment: '移动范围' },
    { name: 'Scale', type: 'FLOAT', comment: '缩放系数' },
  ],
};

const PraisesConfig = {
  name: 'Praises',
  file: 'Praises.txt',
  fields: [
    { name: 'Id', type: 'INT', comment: '序号' },
    { name: 'Template', type: 'STRING', comment: '模板文本' },
    { name: 'Weight', type: 'INT', comment: '权重' },
  ],
};

const UITextConfig = {
  name: 'UIText',
  file: 'UIText.txt',
  fields: [
    { name: 'Id', type: 'INT', comment: '序号' },
    { name: 'Key', type: 'STRING', comment: '文本键' },
    { name: 'Text', type: 'STRING', comment: '中文内容' },
    { name: 'Scene', type: 'STRING', comment: '场景' },
    { name: 'Desc', type: 'STRING', comment: '说明' },
  ],
};

const TableConfigs = {
  Audio: AudioConfig,
  Character: CharacterConfig,
  GameConfig: GameConfigConfig,
  Milestones: MilestonesConfig,
  Platforms: PlatformsConfig,
  Praises: PraisesConfig,
  UIText: UITextConfig,
};

module.exports = { FieldType, TableConfigs };