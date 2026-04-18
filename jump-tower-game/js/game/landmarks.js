/**
 * 闯关模式地标定义
 */

const landmarks = [
  {
    id: 'greatwall',
    name: '长城',
    targetHeight: 1000,
    desc: '世界七大奇迹之一',
    leagueTitle: '长城资格赛区',
    stageName: '资格徽章战',
    badgeName: '烽垣徽章',
    captainTitle: '城垣馆主 韩峤',
    arenaDesc: '城垣风带与短平台交替，是联赛新人的稳定性考场。',
    bossFactionHint: '近压守区者',
    eventLabel: '长城资格赛段',
    styleTags: ['短平台', '稳节奏', '近压试探'],
    theme: {
      bgGradient: ['#1a1a2e', '#16213e'],
      platformColor: '#8b4513',
      accentColor: '#cd853f'
    },
    platformConfig: {
      baseGap: 70,
      gapVariance: 60,
      horizontalPattern: 'lanes',
      laneCount: 3,
      horizontalJitter: 18,
      boostChance: 0.25,
      movingChance: 0.2,
      crumbleChance: 0.1,
      specialWeights: {
        oneWay: 0.2,
        chargeSink: 0.06,
        charge: 0.08,
        resonance: 0.08,
        risk: 0.04
      },
      bossWeights: {
        leaper: 2.4,
        thrower: 0.8
      }
    },
    challengeObjective: {
      metric: 'oneWayLandings',
      target: 4,
      title: '稳线试炼',
      desc: '踩中单向平台',
      summaryLabel: '单向平台',
      preview: '单向平台 x4'
    }
  },
  {
    id: 'eiffeltower',
    name: '埃菲尔铁塔',
    targetHeight: 1500,
    desc: '巴黎标志性建筑',
    leagueTitle: '巴黎外卡赛区',
    stageName: '外卡徽章战',
    badgeName: '铁穹徽章',
    captainTitle: '换线馆主 芙岚',
    arenaDesc: '纵向落差更大，要求选手在窄节奏里快速换线。',
    bossFactionHint: '空投干扰官',
    eventLabel: '巴黎外卡赛段',
    styleTags: ['高落差', '快换线', '空投压制'],
    theme: {
      bgGradient: ['#0f0c29', '#302b63'],
      platformColor: '#4a4a4a',
      accentColor: '#c0c0c0'
    },
    platformConfig: {
      baseGap: 65,
      gapVariance: 55,
      horizontalPattern: 'alternating',
      laneCount: 4,
      horizontalJitter: 24,
      boostChance: 0.3,
      movingChance: 0.25,
      crumbleChance: 0.12,
      specialWeights: {
        oneWay: 0.08,
        chargeSink: 0.06,
        charge: 0.08,
        resonance: 0.1,
        risk: 0.06
      },
      bossWeights: {
        leaper: 1,
        thrower: 2.4
      }
    },
    challengeObjective: {
      metric: 'movingLandings',
      target: 5,
      title: '换线考核',
      desc: '踩中移动平台',
      summaryLabel: '移动平台',
      preview: '移动平台 x5'
    }
  },
  {
    id: 'statueofliberty',
    name: '自由女神',
    targetHeight: 2000,
    desc: '美国的象征',
    leagueTitle: '海湾主赛区',
    stageName: '主赛区席位战',
    badgeName: '潮湾徽章',
    captainTitle: '乱流馆主 格岚',
    arenaDesc: '海风乱流更强，平台节奏与拾取路线都更考验判断。',
    bossFactionHint: '近压守区者',
    eventLabel: '海湾主赛段',
    styleTags: ['乱流', '路线判断', '高压追击'],
    theme: {
      bgGradient: ['#1a1a2e', '#1a3a4a'],
      platformColor: '#2d8a4e',
      accentColor: '#4ade80'
    },
    platformConfig: {
      baseGap: 60,
      gapVariance: 50,
      horizontalPattern: 'scatter',
      laneCount: 4,
      horizontalJitter: 36,
      boostChance: 0.32,
      movingChance: 0.28,
      crumbleChance: 0.15,
      specialWeights: {
        oneWay: 0.06,
        chargeSink: 0.08,
        charge: 0.08,
        resonance: 0.1,
        risk: 0.14
      },
      bossWeights: {
        leaper: 2,
        thrower: 1.2
      }
    },
    challengeObjective: {
      metric: 'riskLandings',
      target: 4,
      title: '乱流勘路',
      desc: '踩中风险平台',
      summaryLabel: '风险平台',
      preview: '风险平台 x4'
    }
  },
  {
    id: 'burjkhalifa',
    name: '迪拜塔',
    targetHeight: 3000,
    desc: '世界最高建筑',
    leagueTitle: '冠位高空赛区',
    stageName: '冠军杯资格战',
    badgeName: '冠穹徽章',
    captainTitle: '双线馆主 赛弗',
    arenaDesc: '高空区节奏极快，是联赛精英争夺冠位席次的最终舞台。',
    bossFactionHint: '双线干扰组',
    eventLabel: '冠位高空赛段',
    styleTags: ['高速切线', '双线干扰', '冠军席次'],
    theme: {
      bgGradient: ['#0a0a1a', '#1a1a3a'],
      platformColor: '#c9a227',
      accentColor: '#ffd700'
    },
    platformConfig: {
      baseGap: 55,
      gapVariance: 45,
      horizontalPattern: 'edgeBounce',
      laneCount: 5,
      horizontalJitter: 16,
      boostChance: 0.35,
      movingChance: 0.3,
      crumbleChance: 0.18,
      specialWeights: {
        oneWay: 0.08,
        chargeSink: 0.16,
        charge: 0.1,
        resonance: 0.06,
        risk: 0.12
      },
      bossWeights: {
        leaper: 1.2,
        thrower: 2.1
      }
    },
    challengeObjective: {
      metric: 'chargeSinkLaunches',
      target: 3,
      title: '冠空弹射',
      desc: '触发蓄力沉降台',
      summaryLabel: '沉降弹射',
      preview: '沉降弹射 x3'
    }
  }
];

module.exports = { landmarks };
