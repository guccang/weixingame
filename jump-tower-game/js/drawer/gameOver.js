/**
 * 游戏结束界面绘制模块
 */

const { drawBackground } = require('./background');
const { GAME_MODES } = require('../game/constants');

/**
 * 绘制游戏结束界面
 * @param {CanvasRenderingContext2D} ctx - canvas上下文
 * @param {Object} game - 游戏实例
 */
function drawGameOverScreen(ctx, game) {
  const { W, H, score, playerName, playerJob } = game;
  const gameMode = game.gameMode;

  drawBackground(ctx, W, H, game.cameraY, game.score, game.bgStars);
  ctx.fillStyle = 'rgba(10,10,46,0.95)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffdd57';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#ffaa00';
  ctx.shadowBlur = 20;

  let title = '挑战结束！';
  let scoreText = '🏆 最终高度: ' + score + 'm';

  // 竞速模式显示时间信息
  if (gameMode.gameMode === GAME_MODES.TIME_ATTACK) {
    title = '时间到！';
    const elapsed = game.finalElapsedTime || 0;
    const mins = Math.floor(elapsed / 60000);
    const secs = Math.floor((elapsed % 60000) / 1000);
    scoreText = '🏆 高度: ' + score + 'm | 用时: ' + mins + '分' + secs + '秒';
  }

  // 闯关模式显示目标信息
  if (gameMode.gameMode === GAME_MODES.CHALLENGE && gameMode.selectedLandmark) {
    const target = gameMode.selectedLandmark.targetHeight;
    const achieved = score >= target;
    title = achieved ? '🎉 挑战成功！' : '挑战失败';
    scoreText = '🏆 ' + gameMode.selectedLandmark.name + ': ' + score + 'm / ' + target + 'm';
  }

  ctx.fillText(title, W / 2, H / 2 - 100);
  ctx.shadowBlur = 0;
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(scoreText, W / 2, H / 2 - 50);

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
    finalMsg = "逆天了！！！" + playerName + "的传说！！！\n" + playerJob + "界的神话！无人能敌！💪💪💪";
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
  if (game.runRewardSummary) {
    const reward = game.runRewardSummary;
    ctx.fillStyle = '#ffeaa7';
    ctx.font = '16px sans-serif';
    ctx.fillText(
      '金币 +' + reward.totalCoins +
      '  (基础' + reward.baseCoins +
      ' / 高度' + reward.heightCoins +
      ' / 连跳' + reward.comboCoins +
      (reward.challengeBonus > 0 ? ' / 闯关' + reward.challengeBonus : '') +
      (reward.pickupCoins > 0 ? ' / 拾取' + reward.pickupCoins : '') +
      (reward.bossCoins > 0 ? ' / Boss' + reward.bossCoins : '') + ')',
      W / 2,
      H / 2 + 104
    );
    ctx.fillStyle = '#55efc4';
    ctx.fillText('当前金币: ' + reward.balance, W / 2, H / 2 + 130);
  } else {
    ctx.fillStyle = '#ffdd57';
    ctx.font = '18px sans-serif';
    ctx.fillText('点击下方按钮选择操作', W / 2, H / 2 + 130);
  }

  // 绘制重新开始按钮
  ctx.fillStyle = '#00d084';
  ctx.fillRect(W / 2 - 80, H / 2 + 155, 70, 35);
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px sans-serif';
  ctx.fillText('重新开始', W / 2 - 45, H / 2 + 178);

  // 绘制分享按钮
  ctx.fillStyle = '#ff6b6b';
  ctx.fillRect(W / 2 + 10, H / 2 + 155, 70, 35);
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px sans-serif';
  ctx.fillText('转发', W / 2 + 45, H / 2 + 178);

  // 绘制返回主页按钮
  ctx.fillStyle = '#74b9ff';
  ctx.fillRect(W / 2 + 100, H / 2 + 155, 70, 35);
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px sans-serif';
  ctx.fillText('返回主页', W / 2 + 135, H / 2 + 178);

  game.gameOverBtnArea = {
    restartX: W / 2 - 80,
    restartY: H / 2 + 155,
    restartW: 70,
    restartH: 35,
    shareX: W / 2 + 10,
    shareY: H / 2 + 155,
    shareW: 70,
    shareH: 35,
    homeX: W / 2 + 100,
    homeY: H / 2 + 155,
    homeW: 70,
    homeH: 35
  };
}

module.exports = {
  drawGameOverScreen
};
