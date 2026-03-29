GameGlobal.canvas = wx.createCanvas();

const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();

GameGlobal.canvas.width = windowInfo.screenWidth;
GameGlobal.canvas.height = windowInfo.screenHeight;

GameGlobal.SCREEN_WIDTH = windowInfo.screenWidth;
GameGlobal.SCREEN_HEIGHT = windowInfo.screenHeight;
