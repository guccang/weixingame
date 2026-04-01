/**
 * 广告管理器
 * 基于用户分层的智能广告投放系统
 */

const adConfig = require('./adConfig');
const userProfile = require('./userProfile');

class AdManager {
  constructor() {
    this.userId = null;
    this.userType = 'explorer'; // explorer/grinder/social/whale
    this.dailyQuota = 0; // 当日广告总配额
    this.quotaUsed = 0; // 已使用配额
    this.lastAdTime = 0; // 上次广告时间
    this.consecutiveAds = 0; // 连续广告次数
    this.sessionStartTime = Date.now();
    this.adHistory = []; // 广告历史记录
  }

  /**
   * 初始化广告系统
   */
  init(userId) {
    this.userId = userId;
    this.loadUserData();
    this.calculateDailyQuota();
  }

  /**
   * 加载用户数据
   */
  loadUserData() {
    const userData = userProfile.getUserData(this.userId);
    this.userType = userData.type;
    this.quotaUsed = userData.todayAdCount || 0;
    this.adHistory = userData.adHistory || [];
  }

  /**
   * 计算当日广告配额
   * 公式: 基础配额 × 活跃系数 × 疲劳系数 × 付费系数
   */
  calculateDailyQuota() {
    const baseQuota = adConfig.getBaseQuota(this.userType);
    const activeCoef = this.getActiveCoefficient();
    const fatigueCoef = this.getFatigueCoefficient();
    const payCoef = this.getPayCoefficient();

    this.dailyQuota = Math.floor(baseQuota * activeCoef * fatigueCoef * payCoef);
  }

  /**
   * 活跃系数（基于当日游戏时长）
   */
  getActiveCoefficient() {
    const sessionMin = (Date.now() - this.sessionStartTime) / 60000;
    if (sessionMin < 5) return 0.5;
    if (sessionMin < 15) return 0.8;
    if (sessionMin < 30) return 1.0;
    if (sessionMin < 60) return 1.2;
    return 1.3;
  }

  /**
   * 疲劳系数（基于昨日广告观看）
   */
  getFatigueCoefficient() {
    const yesterdayCount = userProfile.getYesterdayAdCount(this.userId);
    if (yesterdayCount <= 5) return 1.2;
    if (yesterdayCount <= 10) return 1.0;
    if (yesterdayCount <= 15) return 0.8;
    if (yesterdayCount <= 20) return 0.6;
    return 0.4;
  }

  /**
   * 付费系数
   */
  getPayCoefficient() {
    const totalPaid = userProfile.getTotalPaid(this.userId);
    if (totalPaid === 0) return 1.0;
    if (totalPaid < 50) return 1.1;
    if (totalPaid < 200) return 1.2;
    return 1.3;
  }

  /**
   * 判断是否可以展示广告
   * @param {string} adType - 广告类型: revive/boost/boss_power/free_draw等
   * @param {object} gameState - 游戏状态
   * @returns {boolean}
   */
  canShowAd(adType, gameState) {
    // 1. 配额检查
    if (this.quotaUsed >= this.dailyQuota) return false;

    // 2. 冷却检查（同类型广告间隔至少30秒）
    const now = Date.now();
    if (now - this.lastAdTime < 30000) return false;

    // 3. 连续广告限制（最多连续2次）
    if (this.consecutiveAds >= 2) return false;

    // 4. 场景优先级评分
    const priority = this.calculateScenePriority(adType, gameState);
    const threshold = this.getThreshold();

    return priority >= threshold;
  }

  /**
   * 计算场景优先级
   */
  calculateScenePriority(adType, gameState) {
    let priority = 0.5;

    // 濒死状态 - 复活广告优先级高
    if (gameState.isNearDeath && adType === 'revive') {
      priority += 0.4;
    }

    // Boss战关键时刻
    if (gameState.isInBossFight && gameState.bossHp < 0.3) {
      if (adType === 'boss_power') priority += 0.4;
      if (adType === 'boss_revive') priority += 0.3;
    }

    // 用户类型匹配
    const typeBonus = adConfig.getAdValueScore(adType, this.userType);
    priority += typeBonus * 0.2;

    return Math.min(priority, 1.0);
  }

  /**
   * 获取展示阈值
   */
  getThreshold() {
    const remaining = this.dailyQuota - this.quotaUsed;
    if (remaining > 5) return 0.6;
    if (remaining > 2) return 0.5;
    return 0.4;
  }

  /**
   * 展示广告
   * @param {string} adType - 广告类型
   * @param {function} onSuccess - 成功回调
   * @param {function} onFail - 失败回调
   */
  showAd(adType, onSuccess, onFail) {
    if (!this.canShowAd(adType, {})) {
      if (onFail) onFail('quota_exceeded');
      return;
    }

    // 调用微信广告API
    const videoAd = wx.createRewardedVideoAd({ adUnitId: adConfig.getAdUnitId(adType) });

    videoAd.onLoad(() => {
      videoAd.show();
    });

    videoAd.onClose((res) => {
      if (res && res.isEnded) {
        this.onAdComplete(adType);
        if (onSuccess) onSuccess();
      } else {
        if (onFail) onFail('user_cancel');
      }
    });

    videoAd.onError((err) => {
      console.error('[Ad] 广告加载失败:', err);
      if (onFail) onFail('load_error');
    });

    videoAd.load();
  }

  /**
   * 广告完成回调
   */
  onAdComplete(adType) {
    this.quotaUsed++;
    this.lastAdTime = Date.now();
    this.consecutiveAds++;
    this.adHistory.push({ type: adType, time: Date.now() });
    userProfile.saveAdRecord(this.userId, adType);

    // 重置连续计数（5分钟后）
    setTimeout(() => { this.consecutiveAds = 0; }, 300000);
  }

  /**
   * 获取剩余配额
   */
  getRemainingQuota() {
    return Math.max(0, this.dailyQuota - this.quotaUsed);
  }

  /**
   * 获取配额用尽提示
   */
  getQuotaExhaustedMessage() {
    const messages = adConfig.getExhaustedMessages();
    return messages[this.userType] || messages.default;
  }
}

module.exports = AdManager;
