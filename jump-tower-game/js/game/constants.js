// 游戏常量配置
// 数据从表格加载：GameConfig.txt, Praises.txt, Milestones.txt

const tableManager = require('../tables/tableManager');

const GAME_MODES = {
  ENDLESS: 'endless',
  CHALLENGE: 'challenge',
  TIME_ATTACK: 'timeAttack'
};

const TIME_ATTACK_OPTIONS = [
  { label: '1分钟', value: 60000 },
  { label: '5分钟', value: 300000 },
  { label: '10分钟', value: 600000 },
  { label: '15分钟', value: 900000 },
  { label: '30分钟', value: 1800000 }
];

/**
 * 从表格获取游戏配置值
 */
function getConfigValue(key, defaultValue) {
  const configs = tableManager.getAll('GameConfig');
  const config = configs.find(c => c.Key === key);
  return config ? config.Value : defaultValue;
}

/**
 * 从表格获取夸夸词列表
 */
function getPraiseTemplates() {
  const praises = tableManager.getAll('Praises');
  return praises.map(p => p.Template);
}

/**
 * 从表格获取里程碑列表
 */
function getMilestones() {
  return tableManager.getAll('Milestones').map(m => ({
    h: m.Height,
    msg: m.Message
  }));
}

module.exports = {
  GAME_MODES,
  TIME_ATTACK_OPTIONS,

  // 物理常量（从表格读取，带默认值）
  get GRAVITY() { return getConfigValue('GRAVITY', 0.45); },
  get PLAYER_SPEED() { return getConfigValue('PLAYER_SPEED', 6); },
  get JUMP_FORCE() { return getConfigValue('JUMP_FORCE', -15); },
  get BOOST_JUMP_FORCE() { return getConfigValue('BOOST_JUMP_FORCE', -22); },
  get DOUBLE_JUMP_FORCE() { return getConfigValue('DOUBLE_JUMP_FORCE', -18); },

  // 夸夸词模板（从表格读取）
  get praiseTemplates() { return getPraiseTemplates(); },

  // 默认玩家名称
  DEFAULT_PLAYER_NAME: '秀彬',

  // 里程碑高度配置（从表格读取）
  get milestones() {
    const all = getMilestones();
    // 前7个是普通里程碑
    return all.slice(0, 7);
  },

  // 5000米后的循环里程碑
  get milestonesLoop() {
    const all = getMilestones();
    // 第8个开始是循环里程碑
    return all.slice(7);
  },

  // 弹幕颜色列表
  barrageColors: ['#ffdd57', '#ff6b6b', '#74b9ff', '#55efc4', '#fd79a8', '#ffeaa7'],

  // 星星数量（从表格读取）
  get STAR_COUNT() { return getConfigValue('STAR_COUNT', 150); },

  // 初始平台数量（从表格读取）
  get INITIAL_PLATFORM_COUNT() { return getConfigValue('INITIAL_PLATFORM_COUNT', 12); },

  // 夸奖显示间隔(ms)
  get PRAISE_INTERVAL() { return getConfigValue('PRAISE_INTERVAL', 800); },

  // 连跳夸夸阈值
  get COMBO_PRAISE_THRESHOLD() { return getConfigValue('COMBO_PRAISE_THRESHOLD', 5); },

  // 相机相关
  get CAMERA_SMOOTHING() { return getConfigValue('CAMERA_SMOOTHING', 0.25); },
  get PLAYER_SAFE_ZONE() { return getConfigValue('PLAYER_SAFE_ZONE', 50); },

  // 下滑快速下落力度
  get SLIDE_FALL_FORCE() { return getConfigValue('SLIDE_FALL_FORCE', 20); },

  // 蓄力最大值
  get CHARGE_MAX() { return getConfigValue('CHARGE_MAX', 6); },

  // UI顶部安全区
  get UI_SAFE_TOP() { return getConfigValue('UI_SAFE_TOP', 60); },
};
