/**
 * 表格配置 - 自动生成
 * 生成时间: 2026-03-31 13:45:37
 */

const FieldType = {
  INT: 'INT',
  STRING: 'STRING',
  FLOAT: 'FLOAT',
  BOOL: 'BOOL',
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
  ],
};

const TableConfigs = {
  Character: CharacterConfig,
  Platforms: PlatformsConfig,
};

module.exports = { FieldType, TableConfigs };