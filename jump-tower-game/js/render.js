GameGlobal.canvas = wx.createCanvas();

const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();

GameGlobal.canvas.width = windowInfo.screenWidth;
GameGlobal.canvas.height = windowInfo.screenHeight;

const SCREEN_WIDTH = windowInfo.screenWidth;
const SCREEN_HEIGHT = windowInfo.screenHeight;

GameGlobal.SCREEN_WIDTH = SCREEN_WIDTH;
GameGlobal.SCREEN_HEIGHT = SCREEN_HEIGHT;

module.exports = {
  SCREEN_WIDTH,
  SCREEN_HEIGHT
};
