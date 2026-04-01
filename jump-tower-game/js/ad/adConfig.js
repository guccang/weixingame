/**
 * 广告配置
 */

// 基础配额表
const BASE_QUOTA = {
  explorer: 6,   // 探索型: 5-8次
  grinder: 10,   // 数值型: 8-12次
  social: 15,    // 社交型: 12-18次
  whale: 20      // 鲸鱼型: 15-25次
};

// 广告类型-用户类型价值矩阵 (0-1分数)
const AD_VALUE_MATRIX = {
  revive: { explorer: 1.0, grinder: 1.0, social: 0.8, whale: 0.6 },
  boost: { explorer: 0.4, grinder: 0.8, social: 0.6, whale: 0.8 },
  boss_power: { explorer: 0.6, grinder: 0.8, social: 1.0, whale: 1.0 },
  boss_revive: { explorer: 0.6, grinder: 0.6, social: 1.0, whale: 0.8 },
  free_draw: { explorer: 1.0, grinder: 0.8, social: 0.6, whale: 0.6 },
  gear_boost: { explorer: 0.4, grinder: 1.0, social: 0.6, whale: 0.8 }
};

// 配额用尽提示文案
const EXHAUSTED_MESSAGES = {
  explorer: '今天的免费福利领完啦！明天还有更多，记得来哦~ 🌟',
  grinder: '今日强化加速已用完，明天继续变强！💪',
  social: '今日助战次数已用完，明天再来帮队友打Boss！🎮',
  whale: '广告次数已用完，永久去广告卡了解一下？✨',
  default: '今日广告次数已用完，明天再来吧~'
};

module.exports = {
  getBaseQuota(userType) {
    return BASE_QUOTA[userType] || BASE_QUOTA.explorer;
  },

  getAdValueScore(adType, userType) {
    const adTypeScores = AD_VALUE_MATRIX[adType];
    return adTypeScores ? adTypeScores[userType] || 0.5 : 0.5;
  },

  getExhaustedMessages() {
    return EXHAUSTED_MESSAGES;
  },

  getAdUnitId(adType) {
    // 微信广告位ID（需要替换为实际ID）
    return 'adunit-xxxxxxxxxxxxxxxx';
  }
};
