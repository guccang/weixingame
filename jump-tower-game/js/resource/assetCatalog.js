/**
 * 本地内置资源清单。
 * key 用于新代码访问；localPath 用于兼容旧代码中的相对路径。
 */

function buildAsset(key, type, localPath) {
  return {
    key: key,
    type: type,
    localPath: localPath,
    cloudPath: 'assets/' + localPath
  };
}

const assets = [
  // UI
  buildAsset('ui.bgMain', 'image', 'images/ui_main/bg_main.png'),
  buildAsset('ui.bgShop', 'image', 'images/ui_main/bg_shop.png'),
  buildAsset('ui.bgMainTemp', 'image', 'images/ui_main/bg_main_temp.png'),
  buildAsset('ui.bg0101', 'image', 'images/ui_main/Bg01_01.png'),
  buildAsset('ui.bg0102', 'image', 'images/ui_main/Bg01_02.png'),
  buildAsset('ui.iconCharacter', 'image', 'images/ui_main/icon_character.png'),
  buildAsset('ui.iconCoin', 'image', 'images/ui_main/icon_coin.png'),
  buildAsset('ui.iconLeaderboard', 'image', 'images/ui_main/icon_leaderboard.png'),
  buildAsset('ui.iconShop', 'image', 'images/ui_main/icon_shop.png'),
  buildAsset('ui.iconMode', 'image', 'images/ui_main/icon_mode.png'),
  buildAsset('ui.iconAchievement', 'image', 'images/ui_main/icon_achievement.png'),
  buildAsset('ui.iconPet', 'image', 'images/ui_main/icon_pet.png'),
  buildAsset('ui.iconBackpack', 'image', 'images/ui_main/icon_backpack.png'),
  buildAsset('ui.iconExtra06', 'image', 'images/ui_main/icon_extra_06.png'),
  buildAsset('ui.iconExtra07', 'image', 'images/ui_main/icon_extra_07.png'),
  buildAsset('ui.iconExtra08', 'image', 'images/ui_main/icon_extra_08.png'),

  // 平台
  buildAsset('platform.normal', 'image', 'images/platforms/platform_normal.png'),
  buildAsset('platform.ice', 'image', 'images/platforms/platform_ice.png'),
  buildAsset('platform.rock', 'image', 'images/platforms/platform_rock.png'),
  buildAsset('platform.moving', 'image', 'images/platforms/platform_moving.png'),
  buildAsset('platform.candy', 'image', 'images/platforms/candy_platform.png'),
  buildAsset('platform.cloud', 'image', 'images/platforms/cloud_platform.png'),
  buildAsset('platform.grass', 'image', 'images/platforms/grass_platform.png'),
  buildAsset('platform.metal', 'image', 'images/platforms/metal_platform.png'),
  buildAsset('platform.wood', 'image', 'images/platforms/wood_platform.png'),
  buildAsset('platform.sand', 'image', 'images/platforms/sand_platform.png'),

  // 角色 - ironman
  buildAsset('character.ironman.jump.0', 'image', 'images/characters/ironman/jump_0.png'),
  buildAsset('character.ironman.jump.1', 'image', 'images/characters/ironman/jump_1.png'),
  buildAsset('character.ironman.jump.2', 'image', 'images/characters/ironman/jump_2.png'),
  buildAsset('character.ironman.jump.3', 'image', 'images/characters/ironman/jump_3.png'),
  buildAsset('character.ironman.jump.4', 'image', 'images/characters/ironman/jump_4.png'),
  buildAsset('character.ironman.jump.5', 'image', 'images/characters/ironman/jump_5.png'),

  // 角色 - coach
  buildAsset('character.coach.jump.0', 'image', 'images/characters/coach/jump_0.png'),
  buildAsset('character.coach.jump.1', 'image', 'images/characters/coach/jump_1.png'),
  buildAsset('character.coach.jump.2', 'image', 'images/characters/coach/jump_2.png'),
  buildAsset('character.coach.jump.3', 'image', 'images/characters/coach/jump_3.png'),
  buildAsset('character.coach.jump.4', 'image', 'images/characters/coach/jump_4.png'),
  buildAsset('character.coach.jump.5', 'image', 'images/characters/coach/jump_5.png'),

  // 角色 - batman
  buildAsset('character.batman.jump.0', 'image', 'images/characters/batman/jump_0.png'),
  buildAsset('character.batman.jump.1', 'image', 'images/characters/batman/jump_1.png'),
  buildAsset('character.batman.jump.2', 'image', 'images/characters/batman/jump_2.png'),
  buildAsset('character.batman.jump.3', 'image', 'images/characters/batman/jump_3.png'),
  buildAsset('character.batman.jump.4', 'image', 'images/characters/batman/jump_4.png'),
  buildAsset('character.batman.jump.5', 'image', 'images/characters/batman/jump_5.png'),

  // 角色 - chengxu
  buildAsset('character.chengxu.jump.0', 'image', 'images/characters/chengxu/jump_0.png'),
  buildAsset('character.chengxu.jump.1', 'image', 'images/characters/chengxu/jump_1.png'),
  buildAsset('character.chengxu.jump.2', 'image', 'images/characters/chengxu/jump_2.png'),
  buildAsset('character.chengxu.jump.3', 'image', 'images/characters/chengxu/jump_3.png'),
  buildAsset('character.chengxu.jump.4', 'image', 'images/characters/chengxu/jump_4.png'),
  buildAsset('character.chengxu.jump.5', 'image', 'images/characters/chengxu/jump_5.png'),

  // 角色 - coach_fitness
  buildAsset('character.coach_fitness.jump.0', 'image', 'images/characters/coach_fitness/jump_0.png'),
  buildAsset('character.coach_fitness.jump.1', 'image', 'images/characters/coach_fitness/jump_1.png'),
  buildAsset('character.coach_fitness.jump.2', 'image', 'images/characters/coach_fitness/jump_2.png'),
  buildAsset('character.coach_fitness.jump.3', 'image', 'images/characters/coach_fitness/jump_3.png'),
  buildAsset('character.coach_fitness.jump.4', 'image', 'images/characters/coach_fitness/jump_4.png'),
  buildAsset('character.coach_fitness.jump.5', 'image', 'images/characters/coach_fitness/jump_5.png'),

  // 角色 - daodundog
  buildAsset('character.daodundog.jump.0', 'image', 'images/characters/daodundog/jump_0.png'),
  buildAsset('character.daodundog.jump.1', 'image', 'images/characters/daodundog/jump_1.png'),
  buildAsset('character.daodundog.jump.2', 'image', 'images/characters/daodundog/jump_2.png'),
  buildAsset('character.daodundog.jump.3', 'image', 'images/characters/daodundog/jump_3.png'),
  buildAsset('character.daodundog.jump.4', 'image', 'images/characters/daodundog/jump_4.png'),
  buildAsset('character.daodundog.jump.5', 'image', 'images/characters/daodundog/jump_5.png'),

  // 角色 - green_giant
  buildAsset('character.green_giant.jump.0', 'image', 'images/characters/green_giant/jump_0.png'),
  buildAsset('character.green_giant.jump.1', 'image', 'images/characters/green_giant/jump_1.png'),
  buildAsset('character.green_giant.jump.2', 'image', 'images/characters/green_giant/jump_2.png'),
  buildAsset('character.green_giant.jump.3', 'image', 'images/characters/green_giant/jump_3.png'),
  buildAsset('character.green_giant.jump.4', 'image', 'images/characters/green_giant/jump_4.png'),
  buildAsset('character.green_giant.jump.5', 'image', 'images/characters/green_giant/jump_5.png'),

  // 角色 - hushi
  buildAsset('character.hushi.jump.0', 'image', 'images/characters/hushi/jump_0.png'),
  buildAsset('character.hushi.jump.1', 'image', 'images/characters/hushi/jump_1.png'),
  buildAsset('character.hushi.jump.2', 'image', 'images/characters/hushi/jump_2.png'),
  buildAsset('character.hushi.jump.3', 'image', 'images/characters/hushi/jump_3.png'),
  buildAsset('character.hushi.jump.4', 'image', 'images/characters/hushi/jump_4.png'),

  // 角色 - superman
  buildAsset('character.superman.jump.0', 'image', 'images/characters/superman/jump_0.png'),
  buildAsset('character.superman.jump.1', 'image', 'images/characters/superman/jump_1.png'),
  buildAsset('character.superman.jump.2', 'image', 'images/characters/superman/jump_2.png'),
  buildAsset('character.superman.jump.3', 'image', 'images/characters/superman/jump_3.png'),
  buildAsset('character.superman.jump.4', 'image', 'images/characters/superman/jump_4.png'),
  buildAsset('character.superman.jump.5', 'image', 'images/characters/superman/jump_5.png'),

  // 怪物 - boss
  buildAsset('monster.boss.chase.0', 'image', 'images/monsters/boss/chase/frame_0000.png'),
  buildAsset('monster.boss.chase.1', 'image', 'images/monsters/boss/chase/frame_0001.png'),
  buildAsset('monster.boss.chase.2', 'image', 'images/monsters/boss/chase/frame_0002.png'),
  buildAsset('monster.boss.chase.3', 'image', 'images/monsters/boss/chase/frame_0003.png'),
  buildAsset('monster.boss.chase.4', 'image', 'images/monsters/boss/chase/frame_0004.png'),
  buildAsset('monster.boss.chase.5', 'image', 'images/monsters/boss/chase/frame_0005.png'),
  buildAsset('monster.boss.chase.6', 'image', 'images/monsters/boss/chase/frame_0006.png'),
  buildAsset('monster.boss.chase.7', 'image', 'images/monsters/boss/chase/frame_0007.png'),
  buildAsset('monster.boss.chase.8', 'image', 'images/monsters/boss/chase/frame_0008.png'),
  buildAsset('monster.boss.chase.9', 'image', 'images/monsters/boss/chase/frame_0009.png'),
  buildAsset('monster.boss.chase.10', 'image', 'images/monsters/boss/chase/frame_0010.png'),
  buildAsset('monster.boss.chase.11', 'image', 'images/monsters/boss/chase/frame_0011.png'),
  buildAsset('monster.boss.chase.12', 'image', 'images/monsters/boss/chase/frame_0012.png'),
  buildAsset('monster.boss.chase.13', 'image', 'images/monsters/boss/chase/frame_0013.png'),
  buildAsset('monster.boss.chase.14', 'image', 'images/monsters/boss/chase/frame_0014.png'),
  buildAsset('monster.boss.chase.15', 'image', 'images/monsters/boss/chase/frame_0015.png'),

  // 怪物 - boss2
  buildAsset('monster.boss2.chase.0', 'image', 'images/monsters/boss2/chase/frame_0000.png'),
  buildAsset('monster.boss2.chase.1', 'image', 'images/monsters/boss2/chase/frame_0001.png'),
  buildAsset('monster.boss2.chase.2', 'image', 'images/monsters/boss2/chase/frame_0002.png'),
  buildAsset('monster.boss2.chase.3', 'image', 'images/monsters/boss2/chase/frame_0003.png'),
  buildAsset('monster.boss2.chase.4', 'image', 'images/monsters/boss2/chase/frame_0004.png'),
  buildAsset('monster.boss2.chase.5', 'image', 'images/monsters/boss2/chase/frame_0005.png'),

  // 音频
  buildAsset('audio.bgm', 'audio', 'audio/background_music.mp3'),
  buildAsset('audio.click', 'audio', 'audio/click.mp3'),
  buildAsset('audio.jump', 'audio', 'audio/jump.mp3')
];

const localManifest = {
  version: 'local-dev',
  assets: assets
};

module.exports = {
  assets: assets,
  localManifest: localManifest
};
