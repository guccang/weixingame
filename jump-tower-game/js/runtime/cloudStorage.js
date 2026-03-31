/**
 * 微信云存储模块 - 存储游戏成绩数据
 */

// 云存储键名
const STORAGE_KEYS = {
  GAME_MODE: 'gameMode',      // 玩法: endless/challenge/timeAttack
  BEST_SCORE: 'bestScore',    // 最高高度
  TOTAL_TIME: 'totalTime',    // 累计用时(毫秒)
  MAX_COMBO: 'maxCombo',      // 最大连跳数
  PLAY_COUNT: 'playCount',   // 游玩次数
  BEST_CHALLENGE: 'bestChallenge', // 闯关模式最高记录
  BEST_TIME_ATTACK: 'bestTimeAttack' // 竞速模式最高记录(高度)
};

// 检查云存储API是否可用
function isCloudStorageAvailable() {
  return wx && typeof wx.getUserCloudStorage === 'function' && typeof wx.setUserCloudStorage === 'function';
}

/**
 * 保存游戏成绩到微信云存储
 * @param {Object} gameData - 游戏数据
 * @param {string} gameData.gameMode - 游戏模式
 * @param {number} gameData.score - 本次高度
 * @param {number} gameData.time - 本次用时(毫秒)
 * @param {number} gameData.combo - 本次最大连跳
 * @param {Function} callback - 回调函数 (success, data)
 */
function saveGameRecord(gameData, callback) {
  // 检查API是否可用
  if (!isCloudStorageAvailable()) {
    console.log('云存储API不可用，跳过保存');
    if (callback) callback(false, null);
    return;
  }

  const { gameMode, score, time, combo } = gameData;

  // 先获取现有数据进行比较
  getGameRecord(function(success, existingData) {
    if (!success) {
      existingData = {
        bestScore: 0,
        totalTime: 0,
        maxCombo: 0,
        playCount: 0,
        bestChallenge: 0,
        bestTimeAttack: 0
      };
    }

    // 更新数据
    existingData.playCount = (existingData.playCount || 0) + 1;
    existingData.totalTime = (existingData.totalTime || 0) + (time || 0);
    existingData.maxCombo = Math.max(existingData.maxCombo || 0, combo || 0);

    let bestScore = score || 0;
    let bestChallenge = existingData.bestChallenge || 0;
    let bestTimeAttack = existingData.bestTimeAttack || 0;

    // 根据模式更新最佳记录
    if (gameMode === 'endless' || gameMode === 'challenge') {
      bestScore = Math.max(bestScore, existingData.bestScore || 0);
      bestChallenge = Math.max(bestChallenge, bestScore);
    } else if (gameMode === 'timeAttack') {
      // 竞速模式按高度计
      bestScore = Math.max(bestScore, existingData.bestScore || 0);
      bestTimeAttack = Math.max(bestTimeAttack, bestScore);
    }

    // 构建KV数据列表
    const kvDataList = [
      { key: STORAGE_KEYS.GAME_MODE, value: String(gameMode) },
      { key: STORAGE_KEYS.BEST_SCORE, value: String(bestScore) },
      { key: STORAGE_KEYS.TOTAL_TIME, value: String(existingData.totalTime) },
      { key: STORAGE_KEYS.MAX_COMBO, value: String(existingData.maxCombo) },
      { key: STORAGE_KEYS.PLAY_COUNT, value: String(existingData.playCount) },
      { key: STORAGE_KEYS.BEST_CHALLENGE, value: String(bestChallenge) },
      { key: STORAGE_KEYS.BEST_TIME_ATTACK, value: String(bestTimeAttack) }
    ];

    // 保存到微信云存储
    wx.setUserCloudStorage({
      KVDataList: kvDataList,
      success: function(res) {
        console.log('云存储保存成功', res);
        if (callback) callback(true, existingData);
      },
      fail: function(res) {
        console.error('云存储保存失败', res);
        if (callback) callback(false, null);
      }
    });
  });
}

/**
 * 获取游戏记录
 * @param {Function} callback - 回调函数 (success, data)
 */
function getGameRecord(callback) {
  // 检查API是否可用
  if (!isCloudStorageAvailable()) {
    console.log('云存储API不可用，跳过获取');
    if (callback) callback(false, null);
    return;
  }

  wx.getUserCloudStorage({
    keys: Object.values(STORAGE_KEYS),
    success: function(res) {
      const data = {};
      if (res.KVDataList) {
        for (const item of res.KVDataList) {
          // 尝试解析为数字
          const numValue = Number(item.value);
          data[item.key] = isNaN(numValue) ? item.value : numValue;
        }
      }
      if (callback) callback(true, data);
    },
    fail: function(res) {
      console.error('云存储获取失败', res);
      if (callback) callback(false, null);
    }
  });
}

/**
 * 获取好友排行榜数据
 * @param {Function} callback - 回调函数 (success, list)
 */
function getFriendRankList(callback) {
  // 检查API是否可用
  if (!isCloudStorageAvailable()) {
    console.log('云存储API不可用，跳过获取排行榜');
    if (callback) callback(false, []);
    return;
  }

  wx.getFriendCloudStorage({
    keyList: [STORAGE_KEYS.BEST_SCORE],
    success: function(res) {
      const list = [];
      if (res.data) {
        for (const item of res.data) {
          if (item.KVDataList) {
            const scoreItem = item.KVDataList.find(kv => kv.key === STORAGE_KEYS.BEST_SCORE);
            list.push({
              nickname: item.nickname,
              avatarUrl: item.avatarUrl,
              score: scoreItem ? Number(scoreItem.value) : 0
            });
          }
        }
      }
      // 按分数降序排列
      list.sort((a, b) => b.score - a.score);
      if (callback) callback(true, list);
    },
    fail: function(res) {
      console.error('获取好友排行失败', res);
      if (callback) callback(false, []);
    }
  });
}

module.exports = {
  STORAGE_KEYS,
  isCloudStorageAvailable,
  saveGameRecord,
  getGameRecord,
  getFriendRankList
};
