// 游戏常量配置

module.exports = {
  // 物理常量
  GRAVITY: 0.45,
  PLAYER_SPEED: 6,
  JUMP_FORCE: -15,
  BOOST_JUMP_FORCE: -22,
  DOUBLE_JUMP_FORCE: -18,

  // 夸夸词模板
  praiseTemplates: [
    "{n}太强了！", "{n}yyds！", "{n}无敌！", "{n}！{n}！{n}！",
    "这弹跳力逆天了！", "全场最佳！MVP！", "无敌是多么寂寞！",
    "跳得比楼还高！", "{n}一跳破纪录！", "这就是自律的力量！",
    "{n}的力量永不疲惫！", "{n}是真的猛！", "这爆发力！绝绝子！",
    "力量与美的结合！", "{n}天下第一！",
  ],

  // 默认玩家名称
  DEFAULT_PLAYER_NAME: '秀彬',

  // 里程碑高度配置
  milestones: [
    { h: 50, msg: "{n}热身完毕，真正的挑战开始！" },
    { h: 100, msg: "100米！{n}的{j}力量堪比火箭！" },
    { h: 200, msg: "200米！{n}已经超越了地球引力！" },
    { h: 500, msg: "500米！{j}大佬の极限还远远没到！" },
    { h: 1000, msg: "1000米！！！{n}已经是{j}之神了！！！" },
    { h: 2000, msg: "2000米！！宇宙级{j}王者！无人能敌！" },
    { h: 5000, msg: "5000米！！！{n} = {j}の神 + 跳跃の神！！！" },
  ],

  // 弹幕颜色列表
  barrageColors: ['#ffdd57', '#ff6b6b', '#74b9ff', '#55efc4', '#fd79a8', '#ffeaa7'],

  // 星星数量
  STAR_COUNT: 150,

  // 初始平台数量
  INITIAL_PLATFORM_COUNT: 12,

  // 夸奖显示间隔(ms)
  PRAISE_INTERVAL: 800,

  // 连跳夸夸阈值
  COMBO_PRAISE_THRESHOLD: 5,

  // 相机相关
  CAMERA_SMOOTHING: 0.25,
  PLAYER_SAFE_ZONE: 50,

  // 下滑快速下落力度
  SLIDE_FALL_FORCE: 20,
};
