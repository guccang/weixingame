/**
 * 图片资源加载模块
 */

const images = {
  bgMain: null,
  bgShop: null,
  iconCharacter: null,
  iconCoin: null,
  iconLeaderboard: null,
  iconShop: null,
  loaded: false,
  loadCount: 0,
  totalCount: 6
};

function loadImage(name, src) {
  const img = wx.createImage();
  img.onload = function() {
    images[name] = img;
    images.loadCount++;
    if (images.loadCount >= images.totalCount) {
      images.loaded = true;
    }
  };
  img.src = src;
}

function loadAllImages() {
  loadImage('bgMain', 'images/ui_main/bg_main.png');
  loadImage('bgShop', 'images/ui_main/bg_shop.png');
  loadImage('iconCharacter', 'images/ui_main/icon_character.png');
  loadImage('iconCoin', 'images/ui_main/icon_coin.png');
  loadImage('iconLeaderboard', 'images/ui_main/icon_leaderboard.png');
  loadImage('iconShop', 'images/ui_main/icon_shop.png');
}

loadAllImages();

module.exports = images;
