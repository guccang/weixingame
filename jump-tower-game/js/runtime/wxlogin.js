// 微信登录模块
let loginCallback = null;

// 初始化云开发
function initCloud() {
  if (wx.cloud) {
    wx.cloud.init({
      env: 'jumpdatabase' // 指定云数据库环境
    });
    console.log('云开发初始化成功');
  }
}

// 绘制圆角矩形（兼容微信小游戏）
function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// 微信登录获取用户信息
function wxLogin(callback) {
  loginCallback = callback;

  // 先初始化云开发
  initCloud();

  wx.login({
    success: function(res) {
      if (res.code) {
        getWxUserInfo();
      } else {
        if (loginCallback) {
          loginCallback(false, '微信登录失败');
        }
      }
    },
    fail: function() {
      if (loginCallback) {
        loginCallback(false, '微信登录请求失败');
      }
    }
  });
}

// 获取微信用户信息
function getWxUserInfo() {
  wx.getUserInfo({
    withCredentials: false,
    lang: 'zh_CN',
    success: function(res) {
      if (loginCallback) {
        // 获取openId（通过云开发获取）
        const userInfo = res.userInfo;
        if (wx.cloud) {
          wx.cloud.getTempUserData({
            success: function(cloudRes) {
              userInfo.openId = cloudRes.openid;
              userInfo.unionId = cloudRes.unionid || '';
              loginCallback(true, userInfo);
            },
            fail: function() {
              // 如果云开发获取失败，使用wx.login获取
              wx.login({
                success: function(loginRes) {
                  userInfo.code = loginRes.code;
                  loginCallback(true, userInfo);
                }
              });
            }
          });
        } else {
          loginCallback(true, userInfo);
        }
      }
    },
    fail: function() {
      // 尝试显示用户授权按钮
      showAuthButton();
    }
  });
}

// 显示授权按钮（如果getUserInfo失败）
function showAuthButton() {
  const canvas = GameGlobal.canvas;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  // 创建授权按钮区域
  const btnWidth = 200;
  const btnHeight = 50;
  const btnX = W / 2 - btnWidth / 2;
  const btnY = H / 2 + 100;

  // 绘制半透明遮罩
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, W, H);

  // 绘制提示文字
  ctx.fillStyle = '#ffffff';
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('需要授权才能获取您的昵称', W / 2, H / 2 + 50);
  ctx.fillText('点击下方按钮进行授权', W / 2, H / 2 + 80);

  // 绘制授权按钮
  ctx.fillStyle = '#00d084';
  ctx.shadowColor = '#00d084';
  ctx.shadowBlur = 10;
  drawRoundRect(ctx, btnX, btnY, btnWidth, btnHeight, 10);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#ffffff';
  ctx.font = '16px sans-serif';
  ctx.fillText('微信授权', W / 2, btnY + 30);

  // 保存按钮区域
  GameGlobal.authBtnArea = {
    x: btnX,
    y: btnY,
    w: btnWidth,
    h: btnHeight
  };

  // 绑定点击事件
  wx.onTouchStart(function(e) {
    const touches = e.touches;
    if (touches && touches.length > 0) {
      const touchX = touches[0].clientX;
      const touchY = touches[0].clientY;
      const btn = GameGlobal.authBtnArea;

      if (btn && touchX >= btn.x && touchX <= btn.x + btn.w &&
          touchY >= btn.y && touchY <= btn.y + btn.h) {
        // 点击了授权按钮，尝试重新获取
        getWxUserInfo();
      }
    }
  });
}

// 导出模块
module.exports = {
  wxLogin: wxLogin
};
