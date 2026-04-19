/**
 * 微信云存储模块 - 使用云数据库存储游戏成绩数据
 */

const { getConfig } = require('../resource/envConfig');

const DB_NAME = 'jumpdatabase'; // 云数据库名称
const COLLECTION_NAME = 'jumpdatabase'; // 集合名称
const USER_KEY_STORAGE = 'jump_tower_cloud_user_key_v1';

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
  return typeof wx !== 'undefined' && wx.cloud && typeof wx.cloud.database === 'function';
}

function getStorageSyncSafe(key) {
  if (typeof wx === 'undefined' || typeof wx.getStorageSync !== 'function') {
    return '';
  }

  try {
    return wx.getStorageSync(key);
  } catch (err) {
    console.warn('[cloudStorage] 读取本地存储失败', err);
    return '';
  }
}

function setStorageSyncSafe(key, value) {
  if (typeof wx === 'undefined' || typeof wx.setStorageSync !== 'function') {
    return;
  }

  try {
    wx.setStorageSync(key, value);
  } catch (err) {
    console.warn('[cloudStorage] 写入本地存储失败', err);
  }
}

function createLocalUserKey() {
  const timestamp = Date.now().toString(36);
  const random = Math.floor(Math.random() * 0xffffff).toString(36);
  return 'local_' + timestamp + '_' + random;
}

function getOrCreateUserKey() {
  const cached = getStorageSyncSafe(USER_KEY_STORAGE);
  if (cached) {
    return String(cached);
  }

  const created = createLocalUserKey();
  setStorageSyncSafe(USER_KEY_STORAGE, created);
  return created;
}

function normalizeNickname(nickname, userKey) {
  const trimmed = nickname ? String(nickname).trim() : '';
  if (trimmed && trimmed !== '匿名用户' && trimmed !== '秀彬') {
    return trimmed;
  }

  const suffix = String(userKey || '').slice(-6) || 'guest';
  return '玩家' + suffix;
}

function buildRecordPayload(gameData) {
  const userKey = getOrCreateUserKey();
  return {
    userKey: userKey,
    nickname: normalizeNickname(gameData.nickname, userKey),
    avatarUrl: gameData.avatarUrl || '',
    gameMode: gameData.gameMode,
    score: gameData.score || 0,
    time: gameData.time || 0,
    combo: gameData.combo || 0
  };
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

  initCloudDB();

  var recordPayload = buildRecordPayload(gameData || {});
  var userKey = recordPayload.userKey;
  var nickname = recordPayload.nickname;
  var gameMode = recordPayload.gameMode;
  var score = recordPayload.score;
  var time = recordPayload.time;
  var combo = recordPayload.combo;
  var avatarUrl = recordPayload.avatarUrl;
  var now = Date.now();

  var collection = db.collection(COLLECTION_NAME);

  function updateExistingRecord(existing) {
    var updateData = {
      userKey: userKey,
      nickname: nickname,
      gameMode: gameMode,
      score: score,
      totalTime: (existing.totalTime || 0) + time,
      maxCombo: Math.max(combo, existing.maxCombo || 0),
      playCount: (existing.playCount || 0) + 1,
      updateTime: now,
      avatarUrl: avatarUrl
    };

    updateData.bestScore = score > (existing.bestScore || 0)
      ? score
      : (existing.bestScore || 0);

    updateData.bestChallenge = gameMode === 'challenge' && score > (existing.bestChallenge || 0)
      ? score
      : (existing.bestChallenge || 0);

    updateData.bestTimeAttack = gameMode === 'timeAttack' && score > (existing.bestTimeAttack || 0)
      ? score
      : (existing.bestTimeAttack || 0);

    collection.doc(existing._id).update({
      data: updateData
    }).then(function(updateRes) {
      console.log('云数据库更新成功', updateRes);
      if (callback) callback(true, updateData);
    }).catch(function(err) {
      console.error('云数据库更新失败', err);
      if (callback) callback(false, null);
    });
  }

  function addNewRecord() {
    var newRecord = {
      userKey: userKey,
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

  function queryLegacyRecord() {
    collection.where({
      nickname: nickname
    }).get().then(function(res) {
      if (res.data && res.data.length > 0) {
        updateExistingRecord(res.data[0]);
        return;
      }
      addNewRecord();
    }).catch(function(err) {
      console.error('云数据库旧记录查询失败', err);
      addNewRecord();
    });
  }

  collection.where({
    userKey: userKey
  }).get().then(function(res) {
    if (res.data && res.data.length > 0) {
      updateExistingRecord(res.data[0]);
      return;
    }
    queryLegacyRecord();
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
