/**
 * 游戏结束界面绘制模块
 */

const { drawBackground } = require('./background');

/**
 * 绘制游戏结束界面
 * @param {CanvasRenderingContext2D} ctx - canvas上下文
 * @param {Object} game - 游戏实例
 */
function drawGameOverScreen(ctx, game) {
  const { W, H, score, playerName, playerJob } = game;

  drawBackground(ctx, W, H, game.cameraY, game.score, game.bgStars);
  ctx.fillStyle = 'rgba(10,10,46,0.95)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffdd57';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#ffaa00';
  ctx.shadowBlur = 20;
  ctx.fillText('挑战结束！', W / 2, H / 2 - 100);
  ctx.shadowBlur = 0;
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('🏆 最终高度: ' + score + 'm', W / 2, H / 2 - 50);

  let finalMsg = "";
  if (score < 50) {
    finalMsg = playerName + "说：这才刚热身呢！💪\n再来一次，你可以的！";
  } else if (score < 200) {
    finalMsg = "不错不错！" + playerName + "的" + playerJob + "实力已经开始燃烧了！🔥\n继续加油，" + playerJob + "永不止步！";
  } else if (score < 500) {
    finalMsg = "厉害了！" + playerName + "的弹跳力令人叹为观止！💪💪\n这就是每天" + playerJob + "的成果！牛逼！";
  } else if (score < 1000) {
    finalMsg = "太强了！！！" + playerName + "已经是跳跃王者！！🏆\n" + playerJob + "牛逼牛逼牛逼！！！";
  } else if (score < 2000) {
    finalMsg = "逆天了！！！" + playerName + "の传说！！！\n" + playerJob + "界的神话！无人能敌！💪💪💪";
  } else {
    finalMsg = "不可思议！！！" + playerName + "突破了人类极限！！！\n你就是宇宙最强" + playerJob + "之王！！！🏆💪";
  }

  ctx.fillStyle = '#74b9ff';
  ctx.font = '16px sans-serif';
  const lines = finalMsg.split('\n');
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], W / 2, H / 2 + i * 28);
  }
  ctx.fillStyle = '#ffdd57';
  ctx.font = '18px sans-serif';
  ctx.fillText('点击下方按钮选择操作', W / 2, H / 2 + 130);

  // 绘制重新开始按钮
  ctx.fillStyle = '#00d084';
  ctx.fillRect(W / 2 - 80, H / 2 + 155, 70, 35);
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px sans-serif';
  ctx.fillText('重新开始', W / 2 - 45, H / 2 + 178);

  // 绘制返回主页按钮
  ctx.fillStyle = '#74b9ff';
  ctx.fillRect(W / 2 + 10, H / 2 + 155, 70, 35);
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px sans-serif';
  ctx.fillText('返回主页', W / 2 + 45, H / 2 + 178);

  game.gameOverBtnArea = {
    restartX: W / 2 - 80,
    restartY: H / 2 + 155,
    restartW: 70,
    restartH: 35,
    homeX: W / 2 + 10,
    homeY: H / 2 + 155,
    homeW: 70,
    homeH: 35
  };
}

module.exports = {
  drawGameOverScreen
};
