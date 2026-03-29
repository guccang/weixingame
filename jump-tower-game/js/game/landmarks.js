/**
 * 闯关模式地标定义
 */

const landmarks = [
  {
    id: 'greatwall',
    name: '长城',
    targetHeight: 1000,
    desc: '世界七大奇迹之一',
    theme: {
      bgGradient: ['#1a1a2e', '#16213e'],
      platformColor: '#8b4513',
      accentColor: '#cd853f'
    },
    platformConfig: {
      baseGap: 70,
      gapVariance: 60,
      boostChance: 0.25,
      movingChance: 0.2,
      crumbleChance: 0.1
    }
  },
  {
    id: 'eiffeltower',
    name: '埃菲尔铁塔',
    targetHeight: 1500,
    desc: '巴黎标志性建筑',
    theme: {
      bgGradient: ['#0f0c29', '#302b63'],
      platformColor: '#4a4a4a',
      accentColor: '#c0c0c0'
    },
    platformConfig: {
      baseGap: 65,
      gapVariance: 55,
      boostChance: 0.3,
      movingChance: 0.25,
      crumbleChance: 0.12
    }
  },
  {
    id: 'statueofliberty',
    name: '自由女神',
    targetHeight: 2000,
    desc: '美国的象征',
    theme: {
      bgGradient: ['#1a1a2e', '#1a3a4a'],
      platformColor: '#2d8a4e',
      accentColor: '#4ade80'
    },
    platformConfig: {
      baseGap: 60,
      gapVariance: 50,
      boostChance: 0.32,
      movingChance: 0.28,
      crumbleChance: 0.15
    }
  },
  {
    id: 'burjkhalifa',
    name: '迪拜塔',
    targetHeight: 3000,
    desc: '世界最高建筑',
    theme: {
      bgGradient: ['#0a0a1a', '#1a1a3a'],
      platformColor: '#c9a227',
      accentColor: '#ffd700'
    },
    platformConfig: {
      baseGap: 55,
      gapVariance: 45,
      boostChance: 0.35,
      movingChance: 0.3,
      crumbleChance: 0.18
    }
  }
];

module.exports = { landmarks };
