/**
 * 表格配置 - 自动生成
 * 生成时间: 2026-04-01 13:38:03
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

const EconomyConfigConfig = {
  name: 'EconomyConfig',
  file: 'EconomyConfig.txt',
  fields: [
    { name: 'Id', type: 'INT', comment: '序号' },
    { name: 'Key', type: 'STRING', comment: '配置键' },
    { name: 'Name', type: 'STRING', comment: '配置名' },
    { name: 'Value', type: 'FLOAT', comment: '数值' },
    { name: 'Desc', type: 'STRING', comment: '说明' },
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

const MonstersConfig = {
  name: 'Monsters',
  file: 'Monsters.txt',
  fields: [
    { name: 'Id', type: 'INT', comment: '序号' },
    { name: 'Name', type: 'STRING', comment: '怪物名称' },
    { name: 'Hp', type: 'INT', comment: '生命值' },
    { name: 'Attack', type: 'INT', comment: '攻击力' },
    { name: 'Speed', type: 'INT', comment: '移动速度' },
    { name: 'ChasePath', type: 'STRING', comment: '追击动作路径' },
    { name: 'IsBoss', type: 'BOOL', comment: '是否Boss' },
    { name: 'SpawnCond', type: 'STRING', comment: '出现条件' },
    { name: 'DropReward', type: 'STRING', comment: '掉落奖励' },
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

const UpgradesConfig = {
  name: 'Upgrades',
  file: 'Upgrades.txt',
  fields: [
    { name: 'Id', type: 'INT', comment: '序号' },
    { name: 'UpgradeId', type: 'STRING', comment: '强化键' },
    { name: 'Name', type: 'STRING', comment: '强化名' },
    { name: 'Category', type: 'STRING', comment: '分类' },
    { name: 'MaxLevel', type: 'INT', comment: '最大等级' },
    { name: 'BaseCost', type: 'INT', comment: '基础价格' },
    { name: 'CostGrowth', type: 'FLOAT', comment: '成长系数' },
    { name: 'EffectBase', type: 'FLOAT', comment: '基础效果' },
    { name: 'EffectPerLevel', type: 'FLOAT', comment: '每级效果' },
    { name: 'Desc', type: 'STRING', comment: '说明' },
  ],
};

const TableConfigs = {
  Audio: AudioConfig,
  Character: CharacterConfig,
  EconomyConfig: EconomyConfigConfig,
  GameConfig: GameConfigConfig,
  Milestones: MilestonesConfig,
  Monsters: MonstersConfig,
  Platforms: PlatformsConfig,
  Praises: PraisesConfig,
  Upgrades: UpgradesConfig,
  UIText: UITextConfig,
};

module.exports = { FieldType, TableConfigs };
