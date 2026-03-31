/**
 * 排行榜面板绘制
 */

const { roundRect } = require('./helper');

/**
 * 绘制排行榜面板
 */
function drawLeaderboardPanel(ctx, game, W, H) {
  // 半透明遮罩
  ctx.fillStyle = 'rgba(10,10,46,0.95)';
  ctx.fillRect(0, 0, W, H);

  // 标题
  ctx.fillStyle = '#ffdd57';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(255,221,87,0.6)';
  ctx.shadowBlur = 15;
  ctx.fillText('好友排行榜', W / 2, H / 2 - 200);
  ctx.shadowBlur = 0;

  // 加载状态或排行榜数据
  const rankList = game.rankList || [];
  const isLoading = game.rankLoading;

  if (isLoading) {
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText('加载中...', W / 2, H / 2);
    return;
  }

  if (rankList.length === 0) {
    ctx.fillStyle = '#74b9ff';
    ctx.font = '18px sans-serif';
    ctx.fillText('暂无排行数据', W / 2, H / 2);
    ctx.fillStyle = '#aaa';
    ctx.font = '14px sans-serif';
    ctx.fillText('开始游戏后即可上榜', W / 2, H / 2 + 30);
  } else {
    // 绘制排行榜列表
    const listWidth = 300;
    const itemHeight = 60;
    const listX = W / 2 - listWidth / 2;
    const listY = H / 2 - 150;
    const maxShow = 8;
    const showCount = Math.min(rankList.length, maxShow);

    for (let i = 0; i < showCount; i++) {
      const item = rankList[i];
      const y = listY + i * itemHeight;

      // 排名背景色
      let bgColor = 'rgba(255,255,255,0.1)';
      if (i === 0) bgColor = 'rgba(255,215,0,0.3)'; // 金色
      else if (i === 1) bgColor = 'rgba(192,192,192,0.3)'; // 银色
      else if (i === 2) bgColor = 'rgba(205,127,50,0.3)'; // 铜色

      ctx.fillStyle = bgColor;
      roundRect(ctx, listX, y, listWidth, itemHeight - 5, 10);
      ctx.fill();

      // 排名
      ctx.fillStyle = i < 3 ? '#ffdd57' : '#fff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      const rankText = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
      ctx.fillText(rankText, listX + 30, y + 35);

      // 头像
      if (item.avatarUrl) {
        const img = new Image();
        img.src = item.avatarUrl;
        if (img.width > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(listX + 75, y + 22, 18, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, listX + 57, y + 4, 36, 36);
          ctx.restore();
        }
      } else {
        // 默认头像
        ctx.fillStyle = '#55efc4';
        ctx.beginPath();
        ctx.arc(listX + 75, y + 22, 18, 0, Math.PI * 2);
        ctx.fill();
      }

      // 昵称
      ctx.fillStyle = '#fff';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'left';
      const nickname = item.nickname || '匿名用户';
      ctx.fillText(nickname.length > 10 ? nickname.substring(0, 10) + '...' : nickname, listX + 100, y + 20);

      // 高度
      ctx.fillStyle = '#74b9ff';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(item.score + 'm', listX + 100, y + 40);
    }

    // 如果排名超过8人，显示提示
    if (rankList.length > maxShow) {
      ctx.fillStyle = '#aaa';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('还有 ' + (rankList.length - maxShow) + ' 位好友...', W / 2, listY + showCount * itemHeight + 10);
    }
  }

  // 绘制关闭按钮
  const closeBtnWidth = 120;
  const closeBtnHeight = 40;
  const closeBtnX = W / 2 - closeBtnWidth / 2;
  const closeBtnY = H / 2 + 200;

  ctx.fillStyle = '#ff6b6b';
  roundRect(ctx, closeBtnX, closeBtnY, closeBtnWidth, closeBtnHeight, 20);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('关闭', W / 2, closeBtnY + 25);

  // 记录关闭按钮区域
  game.closeLeaderboardBtn = { x: closeBtnX, y: closeBtnY, w: closeBtnWidth, h: closeBtnHeight };
  ctx.textAlign = 'left';
}

module.exports = {
  drawLeaderboardPanel
};
