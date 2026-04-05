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
  buildAsset('ui.bgMain', 'image', 'images/ui_main/bg_main.png'),
  buildAsset('ui.bgShop', 'image', 'images/ui_main/bg_shop.png'),
  buildAsset('ui.iconCharacter', 'image', 'images/ui_main/icon_character.png'),
  buildAsset('ui.iconCoin', 'image', 'images/ui_main/icon_coin.png'),
  buildAsset('ui.iconLeaderboard', 'image', 'images/ui_main/icon_leaderboard.png'),
  buildAsset('ui.iconShop', 'image', 'images/ui_main/icon_shop.png'),

  buildAsset('platform.normal', 'image', 'images/platforms/platform_normal.png'),
  buildAsset('platform.ice', 'image', 'images/platforms/platform_ice.png'),
  buildAsset('platform.rock', 'image', 'images/platforms/platform_rock.png'),
  buildAsset('platform.moving', 'image', 'images/platforms/platform_moving.png'),

  buildAsset('character.ironman.jump.0', 'image', 'images/characters/ironman/jump_0.png'),
  buildAsset('character.ironman.jump.1', 'image', 'images/characters/ironman/jump_1.png'),
  buildAsset('character.ironman.jump.2', 'image', 'images/characters/ironman/jump_2.png'),
  buildAsset('character.ironman.jump.3', 'image', 'images/characters/ironman/jump_3.png'),
  buildAsset('character.ironman.jump.4', 'image', 'images/characters/ironman/jump_4.png'),
  buildAsset('character.ironman.jump.5', 'image', 'images/characters/ironman/jump_5.png'),

  buildAsset('character.coach.jump.0', 'image', 'images/characters/coach/jump_0.png'),
  buildAsset('character.coach.jump.1', 'image', 'images/characters/coach/jump_1.png'),
  buildAsset('character.coach.jump.2', 'image', 'images/characters/coach/jump_2.png'),
  buildAsset('character.coach.jump.3', 'image', 'images/characters/coach/jump_3.png'),
  buildAsset('character.coach.jump.4', 'image', 'images/characters/coach/jump_4.png'),
  buildAsset('character.coach.jump.5', 'image', 'images/characters/coach/jump_5.png'),

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
