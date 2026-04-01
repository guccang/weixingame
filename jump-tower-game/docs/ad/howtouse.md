#广告系统

## 路径 js/ad/*

## 用法
 广告系统已创建完成。包含三个核心模块： 
                                                                                      
  1. adManager.js - 广告管理器
    - 用户分层（探索型/数值型/社交型/鲸鱼型）
    - 动态配额计算（基础配额 × 活跃系数 × 疲劳系数 × 付费系数）                          
    - 场景优先级决策
    - 广告展示控制                                                                       
  2. adConfig.js - 广告配置                                       
    - 基础配额表
    - 广告价值矩阵
    - 配额用尽提示文案
  3. userProfile.js - 用户画像
    - 用户类型识别
    - 数据持久化
    - 广告记录追踪

  使用示例：
  const AdManager = require('./ad/adManager');
  const adManager = new AdManager();
  adManager.init('user_123');

  // 展示复活广告
  adManager.showAd('revive',
    () => { console.log('广告完成'); },
    (err) => { console.log('广告失败:', err); }
  );
