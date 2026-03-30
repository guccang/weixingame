/**
 * 表格初始数据 - 自动生成
 * 首次启动时会复制到用户目录
 * 生成时间: 2026-03-31 02:18:07
 */

const CharacterData = [
  {Id: 1, Name: '钢铁侠', JumpFolder: 'ironman'},
  {Id: 2, Name: '教练', JumpFolder: 'coach'},
];

const PlatformsData = [
  {Id: 1, Name: '糖果平台', ResPath: 'images/platforms/candy_platform.png', Type: 'normal', BounceForce: 1.0, MoveSpeed: 0.0, MoveRange: 0.0},
  {Id: 2, Name: '云朵平台', ResPath: 'images/platforms/cloud_platform.png', Type: 'boost', BounceForce: 1.5, MoveSpeed: 0.0, MoveRange: 0.0},
  {Id: 3, Name: '草地平台', ResPath: 'images/platforms/grass_platform.png', Type: 'normal', BounceForce: 1.0, MoveSpeed: 0.0, MoveRange: 0.0},
  {Id: 4, Name: '冰面平台', ResPath: 'images/platforms/ice_platform.png', Type: 'slippery', BounceForce: 1.0, MoveSpeed: 0.0, MoveRange: 0.0},
  {Id: 5, Name: '金属平台', ResPath: 'images/platforms/metal_platform.png', Type: 'normal', BounceForce: 1.0, MoveSpeed: 0.0, MoveRange: 0.0},
  {Id: 6, Name: '岩石平台', ResPath: 'images/platforms/rock_platform.png', Type: 'crumble', BounceForce: 0.8, MoveSpeed: 0.0, MoveRange: 0.0},
  {Id: 7, Name: '沙地平台', ResPath: 'images/platforms/sand_platform.png', Type: 'normal', BounceForce: 0.9, MoveSpeed: 0.0, MoveRange: 0.0},
  {Id: 8, Name: '木质平台', ResPath: 'images/platforms/wood_platform.png', Type: 'moving', BounceForce: 1.0, MoveSpeed: 3.0, MoveRange: 100.0},
];

module.exports = {
  CharacterData,
  PlatformsData,
};