/**
 * 夸夸词系统
 */

const GAME_CONST = require('../game/constants');

class PraiseSystem {
  constructor() {
    this.praises = [];
    this.milestones = [];
  }

  /**
   * 生成夸夸词和里程碑
   * @param {string} playerName - 玩家名称
   * @param {string} playerJob - 玩家职业
   * @param {Object} jobPraiseMap - 职业专属夸夸词映射
   */
  generate(playerName, playerJob, jobPraiseMap) {
    const n = playerName;
    const j = playerJob;

    // 生成基础夸夸词
    this.praises = GAME_CONST.praiseTemplates.map(t => t.replace(/\{n\}/g, n).replace(/\{j\}/g, j));

    // 获取职业专属夸夸词
    let jobPraises = null;
    for (const [key, val] of Object.entries(jobPraiseMap)) {
      if (j.includes(key) || key.includes(j)) {
        jobPraises = val;
        break;
      }
    }

    // 默认职业夸夸词
    if (!jobPraises) {
      jobPraises = [
        j + "牛逼牛逼牛逼！",
        j + "界的天花板！",
        j + "之王！",
        j + "做到了极致！",
        "这" + j + "水平逆天了！",
        j + "界的传奇！"
      ];
    }

    // 扩展职业夸夸词
    const expanded = jobPraises.map(t => t.replace(/\{n\}/g, n).replace(/\{j\}/g, j));
    this.praises = this.praises.concat(expanded);

    // 生成里程碑
    this.milestones = GAME_CONST.milestones.map(m => ({
      h: m.h,
      msg: m.msg.replace(/\{n\}/g, n).replace(/\{j\}/g, j)
    }));

    // 生成循环里程碑
    this.milestonesLoop = GAME_CONST.milestonesLoop.map(m => ({
      h: m.h,
      msg: m.msg.replace(/\{n\}/g, n).replace(/\{j\}/g, j)
    }));
  }

  /**
   * 获取随机夸夸词
   * @returns {string}
   */
  getRandomPraise() {
    return this.praises[Math.floor(Math.random() * this.praises.length)];
  }

  /**
   * 检查并获取达成的里程碑
   * @param {number} score - 当前分数
   * @param {number} lastMilestone - 上次达成的里程碑高度
   * @returns {Object|null} 达成的里程碑或null
   */
  checkMilestone(score, lastMilestone) {
    // 5000之前：检查普通里程碑
    if (score < 5000) {
      for (let m of this.milestones) {
        if (score >= m.h && lastMilestone < m.h) {
          return m;
        }
      }
      return null;
    }

    // 5000之后：循环里程碑
    // 计算当前处于第几轮循环
    const maxH = this.milestonesLoop[this.milestonesLoop.length - 1].h;
    const cycle = Math.floor((score - 5000) / (maxH - 5000));
    const scoreInCycle = (score - 5000) % (maxH - 5000);
    const lastInCycle = lastMilestone < 5000 ? 0 : (lastMilestone - 5000) % (maxH - 5000);

    for (let m of this.milestonesLoop) {
      const hInCycle = m.h - 5000;
      if (scoreInCycle >= hInCycle && lastInCycle < hInCycle) {
        return m;
      }
    }
    return null;
  }
}

module.exports = PraiseSystem;
