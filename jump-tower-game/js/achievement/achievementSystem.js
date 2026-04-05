/**
 * 成就系统
 */

const tableManager = require('../tables/tableManager');

// 成就类型
const ACHIEVEMENT_TYPES = {
  HEIGHT: 'height',
  BOSS_KILLS: 'boss_kills',
  COMBO: 'combo',
  COINS_COLLECTED: 'coins_collected',
  RUNS: 'runs',
  SCORE: 'score',
  PERFECT_LANDINGS: 'perfect_landings',
  DAILY: 'daily'
};

// 获取所有成就定义
function getAllAchievements() {
  return tableManager.getAll('Achievements');
}

// 获取称号
function getTitleById(titleId) {
  if (!titleId) return null;
  return tableManager.getById('Titles', titleId);
}

// 获取成就的当前值（从progress.achievementStats中）
function getAchievementValue(progress, type) {
  const stats = progress.achievementStats || {};
  switch (type) {
    case ACHIEVEMENT_TYPES.HEIGHT:
    case ACHIEVEMENT_TYPES.SCORE:
      // height和score都使用highestScore
      return stats.highestScore || 0;
    case ACHIEVEMENT_TYPES.BOSS_KILLS:
      return progress.bossKills || 0;
    case ACHIEVEMENT_TYPES.COMBO:
      return stats.highestCombo || 0;
    case ACHIEVEMENT_TYPES.COINS_COLLECTED:
      return stats.totalCoinsCollected || 0;
    case ACHIEVEMENT_TYPES.RUNS:
      return stats.totalRuns || 0;
    case ACHIEVEMENT_TYPES.PERFECT_LANDINGS:
      return stats.perfectPlatforms || 0;
    case ACHIEVEMENT_TYPES.DAILY:
      return stats.consecutiveDays || 0;
    default:
      return 0;
  }
}

// 检查单个成就是否达成
function checkAchievement(achievement, progress) {
  // 已解锁则不再检查
  if (progress.achievements && progress.achievements[achievement.Key]) {
    return false;
  }

  const currentValue = getAchievementValue(progress, achievement.Type);
  return currentValue >= achievement.Target;
}

// 检查并解锁所有达成的成就
// 返回达成的成就列表
function checkAndUnlockAchievements(progress, triggerTypes) {
  const unlocks = [];
  const achievements = getAllAchievements();

  for (const achievement of achievements) {
    // 如果指定了triggerTypes，只检查匹配的类型
    if (triggerTypes && triggerTypes.length > 0) {
      if (!triggerTypes.includes(achievement.Type)) {
        continue;
      }
    }

    // 已解锁则跳过
    if (progress.achievements && progress.achievements[achievement.Key]) {
      continue;
    }

    if (checkAchievement(achievement, progress)) {
      unlocks.push(achievement);
    }
  }

  return unlocks;
}

// 获取当前拥有的最高称号
function getCurrentTitle(progress) {
  if (!progress.achievements) return null;

  let highestTitleId = 0;
  for (const key in progress.achievements) {
    const entry = progress.achievements[key];
    if (entry && entry.titleId && entry.titleId > highestTitleId) {
      highestTitleId = entry.titleId;
    }
  }

  if (highestTitleId === 0) return null;
  return getTitleById(highestTitleId);
}

// 格式化成就解锁通知文本
function formatUnlockMessage(achievement, title) {
  let msg = '★ ' + achievement.Name + ' ★';
  if (achievement.RewardCoins > 0) {
    msg += ' +' + achievement.RewardCoins + '金币';
  }
  if (title) {
    msg += ' 称号: ' + title.Name;
  }
  return msg;
}

// 检查连续登录天数
function checkDailyLogin(progress) {
  const stats = progress.achievementStats || {};
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const lastPlay = stats.lastPlayDate;

  if (!lastPlay) {
    // 第一次游戏
    return 1;
  }

  if (lastPlay === today) {
    // 今天已玩，不变
    return stats.consecutiveDays || 0;
  }

  const lastDate = new Date(lastPlay);
  const todayDate = new Date(today);
  const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    // 连续第二天
    return (stats.consecutiveDays || 0) + 1;
  } else if (diffDays === 0) {
    return stats.consecutiveDays || 0;
  } else {
    // 断了，从1重新开始
    return 1;
  }
}

module.exports = {
  ACHIEVEMENT_TYPES,
  getAllAchievements,
  getTitleById,
  getAchievementValue,
  checkAchievement,
  checkAndUnlockAchievements,
  getCurrentTitle,
  formatUnlockMessage,
  checkDailyLogin
};
