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
  loadImage('bgMain', 'images/bg_main.png');
  loadImage('bgShop', 'images/bg_shop.png');
  loadImage('iconCharacter', 'images/icon_character.png');
  loadImage('iconCoin', 'images/icon_coin.png');
  loadImage('iconLeaderboard', 'images/icon_leaderboard.png');
  loadImage('iconShop', 'images/icon_shop.png');
}

// 立即加载所有图片
loadAllImages();

module.exports = images;
