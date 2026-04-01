/**
 * 用户画像模块
 */

class UserProfile {
  constructor() {
    this.cache = {};
  }

  /**
   * 获取用户数据
   */
  getUserData(userId) {
    if (this.cache[userId]) return this.cache[userId];

    // 从本地存储加载
    const data = wx.getStorageSync(`user_profile_${userId}`) || {};

    return {
      type: data.type || this.identifyUserType(data),
      todayAdCount: data.todayAdCount || 0,
      adHistory: data.adHistory || [],
      totalPaid: data.totalPaid || 0,
      loginDays7d: data.loginDays7d || 1,
      lastLoginDate: data.lastLoginDate || Date.now()
    };
  }

  /**
   * 识别用户类型
   */
  identifyUserType(userData) {
    if (userData.totalPaid > 100) return 'whale';

    const avgDailyAds = userData.avgDailyAds || 0;
    const gearLevel = userData.gearLevel || 0;

    if (avgDailyAds < 3) return 'explorer';
    if (gearLevel > 10 && avgDailyAds > 8) return 'grinder';
    if (userData.shareCount > 3) return 'social';

    return 'explorer';
  }

  /**
   * 获取昨日广告观看次数
   */
  getYesterdayAdCount(userId) {
    const data = this.getUserData(userId);
    return data.yesterdayAdCount || 0;
  }

  /**
   * 获取总付费金额
   */
  getTotalPaid(userId) {
    const data = this.getUserData(userId);
    return data.totalPaid || 0;
  }

  /**
   * 保存广告记录
   */
  saveAdRecord(userId, adType) {
    const data = this.getUserData(userId);
    data.todayAdCount = (data.todayAdCount || 0) + 1;
    data.adHistory = data.adHistory || [];
    data.adHistory.push({ type: adType, time: Date.now() });

    wx.setStorageSync(`user_profile_${userId}`, data);
    this.cache[userId] = data;
  }
}

module.exports = new UserProfile();

