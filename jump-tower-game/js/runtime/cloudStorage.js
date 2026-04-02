/**
 * 微信云存储模块 - 使用云数据库存储游戏成绩数据
 */

const { getConfig } = require('../resource/envConfig');

const DB_NAME = 'jumpdatabase'; // 云数据库名称
const COLLECTION_NAME = 'jumpdatabase'; // 集合名称

let db = null;

// 初始化云数据库
function initCloudDB() {
  if (!db && wx.cloud) {
    wx.cloud.init({
      env: getConfig().envId
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

  // 未登录玩家跳过存储
  var nickname = gameData.nickname;
  if (!nickname || nickname === '匿名用户' || nickname === '秀彬') {
    console.log('未登录玩家，跳过存储');
    if (callback) callback(false, null);
    return;
  }

  initCloudDB();

  var gameMode = gameData.gameMode;
  var score = gameData.score || 0;
  var time = gameData.time || 0;
  var combo = gameData.combo || 0;
  var avatarUrl = gameData.avatarUrl || '';
  var now = Date.now();

  var collection = db.collection(COLLECTION_NAME);

  // 使用昵称作为唯一标识查询
  collection.where({
    nickname: nickname
  }).get().then(function(res) {
    if (res.data && res.data.length > 0) {
      // 更新现有记录
      var existing = res.data[0];
      var updateData = {
        gameMode: gameMode,
        score: score,
        totalTime: (existing.totalTime || 0) + time,
        maxCombo: Math.max(combo, existing.maxCombo || 0),
        playCount: (existing.playCount || 0) + 1,
        updateTime: now,
        avatarUrl: avatarUrl
      };

      // 更新最佳成绩
      if (score > (existing.bestScore || 0)) {
        updateData.bestScore = score;
      } else {
        updateData.bestScore = existing.bestScore;
      }

      if (gameMode === 'challenge' && score > (existing.bestChallenge || 0)) {
        updateData.bestChallenge = score;
      } else {
        updateData.bestChallenge = existing.bestChallenge || 0;
      }

      if (gameMode === 'timeAttack' && score > (existing.bestTimeAttack || 0)) {
        updateData.bestTimeAttack = score;
      } else {
        updateData.bestTimeAttack = existing.bestTimeAttack || 0;
      }

      collection.doc(existing._id).update({
        data: updateData
      }).then(function(updateRes) {
        console.log('云数据库更新成功', updateRes);
        if (callback) callback(true, updateData);
      }).catch(function(err) {
        console.error('云数据库更新失败', err);
        if (callback) callback(false, null);
      });
    } else {
      // 新增记录
      var newRecord = {
        nickname: nickname,
        gameMode: gameMode,
        score: score,
        bestScore: score,
        bestChallenge: gameMode === 'challenge' ? score : 0,
        bestTimeAttack: gameMode === 'timeAttack' ? score : 0,
        totalTime: time,
        maxCombo: combo,
        playCount: 1,
        avatarUrl: avatarUrl,
        createTime: now,
        updateTime: now
      };

      collection.add({
        data: newRecord
      }).then(function(addRes) {
        console.log('云数据库新增成功', addRes);
        if (callback) callback(true, newRecord);
      }).catch(function(err) {
        console.error('云数据库新增失败', err);
        if (callback) callback(false, null);
      });
    }
  }).catch(function(err) {
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
  }).get().then(function(res) {
    if (res.data && res.data.length > 0) {
      if (callback) callback(true, res.data[0]);
    } else {
      if (callback) callback(false, null);
    }
  }).catch(function(err) {
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
    }).get().then(function(res) {
      if (res.data) {
        for (var i = 0; i < res.data.length; i++) {
          list.push(res.data[i]);
        }
      }
      pending -= batch.length;
      if (pending <= 0) {
        // 按分数降序排列
        list.sort(function(a, b) {
          return (b.bestScore || 0) - (a.bestScore || 0);
        });
        if (callback) callback(true, list);
      }
    }).catch(function(err) {
      console.error('查询好友排行失败', err);
      pending -= batch.length;
      if (pending <= 0) {
        if (callback) callback(false, []);
      }
    });
  }

  // 分批查询
  for (var i = 0; i < openIdList.length; i += batchSize) {
    var batch = openIdList.slice(i, i + batchSize);
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
    .then(function(res) {
      var list = res.data || [];
      list.sort(function(a, b) {
        return (b.bestScore || 0) - (a.bestScore || 0);
      });
      if (callback) callback(true, list);
    })
    .catch(function(err) {
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
      var list = [];
      if (res.data) {
        for (var i = 0; i < res.data.length; i++) {
          var item = res.data[i];
          var scoreItem = null;
          if (item.KVDataList) {
            for (var j = 0; j < item.KVDataList.length; j++) {
              if (item.KVDataList[j].key === 'bestScore') {
                scoreItem = item.KVDataList[j];
                break;
              }
            }
          }
          list.push({
            nickname: item.nickname,
            avatarUrl: item.avatarUrl,
            bestScore: scoreItem ? Number(scoreItem.value) : 0
          });
        }
      }
      list.sort(function(a, b) {
        return b.bestScore - a.bestScore;
      });
      if (callback) callback(true, list);
    },
    fail: function(res) {
      console.error('获取好友排行失败', res);
      if (callback) callback(false, []);
    }
  });
}

module.exports = {
  DB_NAME: DB_NAME,
  isCloudDBAvailable: isCloudDBAvailable,
  saveGameRecord: saveGameRecord,
  getUserRecord: getUserRecord,
  getFriendRankList: getFriendRankList,
  getAllRankList: getAllRankList,
  getFriendRankListViaOpenData: getFriendRankListViaOpenData
};
