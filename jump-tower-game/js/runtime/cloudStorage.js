/**
 * 微信云存储模块 - 使用云数据库存储游戏成绩数据
 */

const DB_NAME = 'jumpdatabase'; // 云数据库名称
const COLLECTION_NAME = 'game_records'; // 集合名称

let db = null;

// 初始化云数据库
function initCloudDB() {
  if (!db && wx.cloud) {
    wx.cloud.init({
      env: 'jumpdatabase' // 指定环境ID
    });
    db = wx.cloud.database();
  }
  return db;
}

// 检查云数据库API是否可用
function isCloudDBAvailable() {
  return wx && wx.cloud && typeof wx.cloud.database === 'function';
}

/**
 * 保存游戏成绩到云数据库
 * @param {Object} gameData - 游戏数据
 * @param {string} gameData.openId - 用户openId
 * @param {string} gameData.gameMode - 游戏模式
 * @param {number} gameData.score - 本次高度
 * @param {number} gameData.time - 本次用时(毫秒)
 * @param {number} gameData.combo - 本次最大连跳
 * @param {string} gameData.nickname - 用户昵称
 * @param {string} gameData.avatarUrl - 用户头像
 * @param {Function} callback - 回调函数 (success, data)
 */
function saveGameRecord(gameData, callback) {
  // 检查API是否可用
  if (!isCloudDBAvailable()) {
    console.log('云数据库API不可用，跳过保存');
    if (callback) callback(false, null);
    return;
  }

  initCloudDB();
  const { openId, gameMode, score, time, combo, nickname, avatarUrl } = gameData;

  if (!openId) {
    console.log('缺少openId，无法保存记录');
    if (callback) callback(false, null);
    return;
  }

  const collection = db.collection(COLLECTION_NAME);

  // 先查询是否已有该用户的记录
  collection.where({
    _openid: openId
  }).get().then(res => {
    const now = Date.now();

    if (res.data && res.data.length > 0) {
      // 更新现有记录
      const existingRecord = res.data[0];
      const updateData = {
        gameMode: gameMode,
        score: Math.max(score, existingRecord.score || 0),
        totalTime: (existingRecord.totalTime || 0) + (time || 0),
        maxCombo: Math.max(combo || 0, existingRecord.maxCombo || 0),
        playCount: (existingRecord.playCount || 0) + 1,
        updateTime: now
      };

      // 根据模式更新最佳记录
      if (gameMode === 'endless' || gameMode === 'challenge') {
        updateData.bestScore = Math.max(score, existingRecord.bestScore || 0);
        updateData.bestChallenge = Math.max(updateData.bestScore, existingRecord.bestChallenge || 0);
      } else if (gameMode === 'timeAttack') {
        updateData.bestScore = Math.max(score, existingRecord.bestScore || 0);
        updateData.bestTimeAttack = Math.max(updateData.bestScore, existingRecord.bestTimeAttack || 0);
      }

      collection.doc(existingRecord._id).update({
        data: updateData
      }).then(updateRes => {
        console.log('云数据库更新成功', updateRes);
        if (callback) callback(true, updateData);
      }).catch(err => {
        console.error('云数据库更新失败', err);
        if (callback) callback(false, null);
      });
    } else {
      // 新增记录
      const newRecord = {
        _openid: openId,
        gameMode: gameMode,
        score: score || 0,
        bestScore: score || 0,
        bestChallenge: gameMode === 'challenge' ? score : 0,
        bestTimeAttack: gameMode === 'timeAttack' ? score : 0,
        totalTime: time || 0,
        maxCombo: combo || 0,
        playCount: 1,
        nickname: nickname || '匿名用户',
        avatarUrl: avatarUrl || '',
        createTime: now,
        updateTime: now
      };

      collection.add({
        data: newRecord
      }).then(addRes => {
        console.log('云数据库新增成功', addRes);
        if (callback) callback(true, newRecord);
      }).catch(err => {
        console.error('云数据库新增失败', err);
        if (callback) callback(false, null);
      });
    }
  }).catch(err => {
    console.error('云数据库查询失败', err);
    if (callback) callback(false, null);
  });
}

/**
 * 获取用户个人记录
 * @param {string} openId - 用户openId
 * @param {Function} callback - 回调函数 (success, data)
 */
function getUserRecord(openId, callback) {
  if (!isCloudDBAvailable()) {
    console.log('云数据库API不可用');
    if (callback) callback(false, null);
    return;
  }

  initCloudDB();

  if (!openId) {
    if (callback) callback(false, null);
    return;
  }

  const collection = db.collection(COLLECTION_NAME);
  collection.where({
    _openid: openId
  }).get().then(res => {
    if (res.data && res.data.length > 0) {
      if (callback) callback(true, res.data[0]);
    } else {
      if (callback) callback(false, null);
    }
  }).catch(err => {
    console.error('获取用户记录失败', err);
    if (callback) callback(false, null);
  });
}

/**
 * 获取好友排行榜数据
 * @param {Array} openIdList - 好友openId列表
 * @param {Function} callback - 回调函数 (success, list)
 */
function getFriendRankList(openIdList, callback) {
  if (!isCloudDBAvailable()) {
    console.log('云数据库API不可用');
    if (callback) callback(false, []);
    return;
  }

  initCloudDB();

  if (!openIdList || openIdList.length === 0) {
    // 如果没有好友列表，返回所有记录（调试用）
    getAllRankList(callback);
    return;
  }

  const collection = db.collection(COLLECTION_NAME);

  // 查询好友列表中的用户记录
  // 注意：云数据库where使用in查询有限制，这里分批查询
  const list = [];
  let pending = openIdList.length;
  const batchSize = 20; // 每次最多查20个

  function queryBatch(batch) {
    collection.where({
      _openid: db.command.in(batch)
    }).field({
      _openid: true,
      nickname: true,
      avatarUrl: true,
      bestScore: true
    }).get().then(res => {
      if (res.data) {
        list.push(...res.data);
      }
      pending -= batch.length;
      if (pending <= 0) {
        // 按分数降序排列
        list.sort((a, b) => (b.bestScore || 0) - (a.bestScore || 0));
        if (callback) callback(true, list);
      }
    }).catch(err => {
      console.error('查询好友排行失败', err);
      pending -= batch.length;
      if (pending <= 0) {
        if (callback) callback(false, []);
      }
    });
  }

  // 分批查询
  for (let i = 0; i < openIdList.length; i += batchSize) {
    const batch = openIdList.slice(i, i + batchSize);
    queryBatch(batch);
  }
}

/**
 * 获取所有记录排行榜（用于调试或公开排行榜）
 * @param {Function} callback - 回调函数 (success, list)
 */
function getAllRankList(callback) {
  if (!isCloudDBAvailable()) {
    console.log('云数据库API不可用');
    if (callback) callback(false, []);
    return;
  }

  initCloudDB();
  const collection = db.collection(COLLECTION_NAME);

  collection.orderBy('bestScore', 'desc').limit(100).get()
    .then(res => {
      const list = res.data || [];
      list.sort((a, b) => (b.bestScore || 0) - (a.bestScore || 0));
      if (callback) callback(true, list);
    })
    .catch(err => {
      console.error('获取排行榜失败', err);
      if (callback) callback(false, []);
    });
}

/**
 * 获取好友排行（使用微信开放数据域）
 * @param {Function} callback - 回调函数 (success, list)
 */
function getFriendRankListViaOpenData(callback) {
  if (!wx.getFriendCloudStorage) {
    console.log('getFriendCloudStorage不可用');
    if (callback) callback(false, []);
    return;
  }

  wx.getFriendCloudStorage({
    keyList: ['bestScore'],
    success: function(res) {
      const list = [];
      if (res.data) {
        for (const item of res.data) {
          if (item.KVDataList) {
            const scoreItem = item.KVDataList.find(kv => kv.key === 'bestScore');
            list.push({
              nickname: item.nickname,
              avatarUrl: item.avatarUrl,
              bestScore: scoreItem ? Number(scoreItem.value) : 0
            });
          }
        }
      }
      list.sort((a, b) => b.bestScore - a.bestScore);
      if (callback) callback(true, list);
    },
    fail: function(res) {
      console.error('获取好友排行失败', res);
      if (callback) callback(false, []);
    }
  });
}

module.exports = {
  DB_NAME,
  isCloudDBAvailable,
  saveGameRecord,
  getUserRecord,
  getFriendRankList,
  getAllRankList,
  getFriendRankListViaOpenData
};
