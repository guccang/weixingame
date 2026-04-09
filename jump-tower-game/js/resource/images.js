/**
 * 图片资源加载模块
 */

const assetManager = require('./assetManager');

const images = {
  bgMain: null,
  bgShop: null,
  iconCharacter: null,
  iconCoin: null,
  iconLeaderboard: null,
  iconShop: null,
  iconMode: null,
  iconAchievement: null,
  loaded: false,
  loadCount: 0,
  totalCount: 8
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
  loadImage('bgMain', assetManager.getImagePath('ui.bgMain'));
  loadImage('bgShop', assetManager.getImagePath('ui.bgShop'));
  loadImage('iconCharacter', assetManager.getImagePath('ui.iconCharacter'));
  loadImage('iconCoin', assetManager.getImagePath('ui.iconCoin'));
  loadImage('iconLeaderboard', assetManager.getImagePath('ui.iconLeaderboard'));
  loadImage('iconShop', assetManager.getImagePath('ui.iconShop'));
  loadImage('iconMode', assetManager.getImagePath('ui.iconMode'));
  loadImage('iconAchievement', assetManager.getImagePath('ui.iconAchievement'));
}

loadAllImages();

module.exports = images;
