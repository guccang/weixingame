/**
 * 表格初始数据 - 自动生成
 * 首次启动时会复制到用户目录
 * 生成时间: 2026-03-31 13:45:37
 */

const CharacterData = [
  {Id: 1, Name: '钢铁侠', JumpFolder: 'ironman'},
  {Id: 2, Name: '教练', JumpFolder: 'coach'},
];

const PlatformsData = [
  {Id: 1, Name: '普通台子', ResPath: 'images/platforms/platform_normal.png', Type: 'normal', BounceForce: 1.0, MoveSpeed: 0.0, MoveRange: 0.0},
  {Id: 2, Name: '冰块台子', ResPath: 'images/platforms/platform_ice.png', Type: 'normal', BounceForce: 1.0, MoveSpeed: 0.0, MoveRange: 0.0},
  {Id: 3, Name: '岩石台子', ResPath: 'images/platforms/platform_rock.png', Type: 'crumble', BounceForce: 0.8, MoveSpeed: 0.0, MoveRange: 0.0},
  {Id: 4, Name: '移动台子', ResPath: 'images/platforms/platform_moving.png', Type: 'moving', BounceForce: 1.0, MoveSpeed: 3.0, MoveRange: 100.0},
  {Id: 5, Name: '弹跳台子', ResPath: 'images/platforms/platform_moving.png', Type: 'boost', BounceForce: 1.5, MoveSpeed: 0.0, MoveRange: 0.0},
];

module.exports = {
  CharacterData,
  PlatformsData,
};