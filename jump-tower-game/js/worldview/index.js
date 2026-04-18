const { GAME_MODES } = require('../game/constants');
const { landmarks } = require('../game/landmarks');

const LEAGUE_PROFILE = {
  name: '天穹跃迁联盟大会',
  seasonName: '城市空域巡回赛季',
  slogan: '赢下赛区徽章，晋级天穹冠军杯。',
  dossierName: '空域图鉴',
  summitName: '冠军杯',
  partnerCode: '伴飞搭档'
};

const SEASON_TIERS = [
  { id: 'rookie', minScore: 0, title: '见习跃迁员', homeLabel: '资格赛预备席', badgeTarget: 1, badgeLabel: '预备徽章册', leagueClass: '新人组' },
  { id: 'contender', minScore: 220, title: '外卡挑战者', homeLabel: '外卡晋级赛', badgeTarget: 2, badgeLabel: '外卡徽章册', leagueClass: '晋级组' },
  { id: 'vanguard', minScore: 820, title: '主赛区先锋', homeLabel: '主赛区排位赛', badgeTarget: 3, badgeLabel: '主赛区徽章册', leagueClass: '排位组' },
  { id: 'elite', minScore: 1650, title: '空域精英', homeLabel: '高空冠军赛', badgeTarget: 4, badgeLabel: '冠军前哨册', leagueClass: '精英组' },
  { id: 'legend', minScore: 2800, title: '冠位竞速者', homeLabel: '冠位巡回赛', badgeTarget: landmarks.length, badgeLabel: '冠军收藏册', leagueClass: '冠军组' }
];

const BOSS_PROFILES = {
  leaper: {
    id: 'leaper',
    title: '近压守区者',
    codename: '贴身压迫型',
    warningText: '守区者正在封锁前方赛道！',
    spawnText: '近压守区者入场，准备变向穿越。',
    interruptText: '守区者节奏被打断！',
    defeatText: '守区者被清出赛道！',
    missText: '守区者扑空，突破窗口已开！',
    hitText: '守区者重压命中！',
    dashText: '蓄力冲刺撕开了守区者防线！',
    growthText: '体型压制成功，守区者被撞离赛道！'
  },
  thrower: {
    id: 'thrower',
    title: '空投干扰官',
    codename: '空域封锁型',
    warningText: '上空干扰席启动，注意空投压制！',
    spawnText: '空投干扰官进场，注意上空落点。',
    interruptText: '干扰节奏被切断！',
    defeatText: '空投干扰官撤离赛道！',
    exitText: '上空压制结束，赛道暂时净空。'
  },
  default: {
    id: 'default',
    title: '赛区守卫',
    codename: '标准守关型',
    warningText: '前方赛道出现强压干扰！',
    spawnText: '赛区守卫入场！',
    interruptText: '赛区守卫被打断！',
    defeatText: '赛区守卫已退场！'
  }
};

function getDefaultState() {
  return {
    unlockedZones: [],
    unlockedBossProfiles: [],
    lastNarrativeUnlock: '',
    lastSeasonTier: SEASON_TIERS[0].id
  };
}

function normalizeState(state) {
  const next = Object.assign(getDefaultState(), state || {});
  next.unlockedZones = Array.isArray(next.unlockedZones) ? Array.from(new Set(next.unlockedZones.filter(Boolean))) : [];
  next.unlockedBossProfiles = Array.isArray(next.unlockedBossProfiles) ? Array.from(new Set(next.unlockedBossProfiles.filter(Boolean))) : [];
  next.lastNarrativeUnlock = next.lastNarrativeUnlock || '';
  next.lastSeasonTier = next.lastSeasonTier || SEASON_TIERS[0].id;
  return next;
}

function getSeasonTier(progress) {
  const highestScore = progress && progress.achievementStats
    ? Math.max(0, Math.floor(progress.achievementStats.highestScore || 0))
    : 0;
  let current = SEASON_TIERS[0];
  for (let i = 0; i < SEASON_TIERS.length; i++) {
    if (highestScore >= SEASON_TIERS[i].minScore) {
      current = SEASON_TIERS[i];
    }
  }
  return current;
}

function getBossProfile(behaviorType) {
  return BOSS_PROFILES[behaviorType] || BOSS_PROFILES.default;
}

function getZoneById(zoneId) {
  for (let i = 0; i < landmarks.length; i++) {
    if (landmarks[i].id === zoneId) return landmarks[i];
  }
  return null;
}

function getNextLockedZone(state) {
  for (let i = 0; i < landmarks.length; i++) {
    if (state.unlockedZones.indexOf(landmarks[i].id) === -1) {
      return landmarks[i];
    }
  }
  return null;
}

function getHighestReachedZone(score) {
  let matched = null;
  const safeScore = Math.max(0, Math.floor(score || 0));
  for (let i = 0; i < landmarks.length; i++) {
    if (safeScore >= landmarks[i].targetHeight) {
      matched = landmarks[i];
    }
  }
  return matched;
}

function getUnlockedZoneCount(state) {
  return state && Array.isArray(state.unlockedZones) ? state.unlockedZones.length : 0;
}

function getUnlockedBossCount(state) {
  return state && Array.isArray(state.unlockedBossProfiles) ? state.unlockedBossProfiles.length : 0;
}

function getCollectionLine(state) {
  return LEAGUE_PROFILE.dossierName + ' ' + getUnlockedZoneCount(state) + '/' + landmarks.length
    + ' · 守关档案 ' + getUnlockedBossCount(state) + '/' + (Object.keys(BOSS_PROFILES).length - 1);
}

function getHomeNarrative(progress, options) {
  const normalizedProgress = progress || {};
  const state = normalizeState(normalizedProgress.worldview);
  const tier = getSeasonTier(normalizedProgress);
  const selectedLandmark = options && options.selectedLandmark ? options.selectedLandmark : null;
  const nextZone = getNextLockedZone(state);

  let hint = LEAGUE_PROFILE.slogan;
  let dossierLine = '';
  if (selectedLandmark) {
    hint = '已锁定赛区：' + selectedLandmark.leagueTitle + '，目标 ' + selectedLandmark.targetHeight + 'm';
    dossierLine = selectedLandmark.badgeName + ' · ' + selectedLandmark.captainTitle;
  } else if (nextZone) {
    hint = '再冲 ' + nextZone.targetHeight + 'm 解锁 ' + nextZone.leagueTitle;
    dossierLine = '下一枚徽章：' + nextZone.badgeName + ' · 考官 ' + nextZone.captainTitle;
  } else {
    hint = '四大赛区徽章已集齐，继续冲榜争夺' + LEAGUE_PROFILE.summitName + '种子席位。';
    dossierLine = '已完成全部赛区公开考核，进入冠军席位争夺阶段。';
  }

  return {
    title: LEAGUE_PROFILE.name,
    subtitle: tier.homeLabel + ' · ' + LEAGUE_PROFILE.seasonName,
    hint: hint,
    statusLine: '当前身份：' + tier.title + ' · ' + tier.leagueClass,
    unlockLine: state.lastNarrativeUnlock || ('已解锁赛区 ' + getUnlockedZoneCount(state) + '/' + landmarks.length),
    badgeLine: '徽章进度：' + getUnlockedZoneCount(state) + '/' + tier.badgeTarget + ' · ' + tier.badgeLabel,
    dossierLine: dossierLine,
    collectionLine: getCollectionLine(state),
    partnerLine: LEAGUE_PROFILE.partnerCode + '席位已开放，可在宠物页配置协同出战。'
  };
}

function getRunStartNarrative(game) {
  const progress = game && game.progression ? game.progression : {};
  const tier = getSeasonTier(progress);
  const selectedLandmark = game && game.gameMode ? game.gameMode.selectedLandmark : null;
  const gameMode = game && game.gameMode ? game.gameMode.gameMode : GAME_MODES.ENDLESS;

  if (gameMode === GAME_MODES.CHALLENGE && selectedLandmark) {
    return {
      headline: selectedLandmark.stageName + ' 开赛',
      subline: selectedLandmark.badgeName + '争夺中，对手 ' + selectedLandmark.captainTitle
    };
  }

  if (gameMode === GAME_MODES.TIME_ATTACK) {
    const ms = game && game.gameMode ? Math.max(0, game.gameMode.selectedTimeLimit || 0) : 0;
    const minutes = Math.max(1, Math.round(ms / 60000));
    return {
      headline: '计时冲榜赛开场',
      subline: minutes + ' 分钟内拉高成绩，抢占联赛榜位。'
    };
  }

  return {
    headline: tier.title + ' 出战',
    subline: '巡回大会开启，收集赛区徽章并登记' + LEAGUE_PROFILE.dossierName + '。'
  };
}

function getThemeNarrative(definition) {
  if (!definition) {
    return {
      bannerText: '赛区切换',
      barrageText: '空域变化',
      pillText: '赛区切换'
    };
  }

  return {
    bannerText: (definition.leagueTitle || definition.name) + ' 开启',
    barrageText: definition.eventLabel || (definition.name + ' 赛段'),
    pillText: definition.eventLabel || (definition.name + ' 空域')
  };
}

function getBossWarningText(behaviorType) {
  return getBossProfile(behaviorType).warningText;
}

function getBossSpawnText(monster) {
  return getBossProfile(monster && monster.behaviorType).spawnText;
}

function getBossInterruptText(monster) {
  return getBossProfile(monster && monster.behaviorType).interruptText;
}

function getBossDefeatText(monster, context) {
  const profile = getBossProfile(monster && monster.behaviorType);
  if (context && context.viaChargeDash && profile.dashText) {
    return profile.dashText;
  }
  return profile.defeatText;
}

function getBossMissText(monster) {
  return getBossProfile(monster && monster.behaviorType).missText || 'Boss扑空了！';
}

function getBossHitText(monster, isFinalAttack) {
  const profile = getBossProfile(monster && monster.behaviorType);
  if (profile.hitText) return profile.hitText;
  return isFinalAttack ? 'Boss终结命中！' : 'Boss重击命中！';
}

function getBossExitText(monster) {
  return getBossProfile(monster && monster.behaviorType).exitText || 'Boss退场';
}

function getGrowthBossDefeatText(monster) {
  return getBossProfile(monster && monster.behaviorType).growthText || 'Boss被顶飞了！';
}

function getResultNarrative(game) {
  const progress = game && game.progression ? game.progression : {};
  const tier = getSeasonTier(progress);
  const state = normalizeState(progress.worldview);
  const nextZone = getNextLockedZone(state);
  const gameMode = game && game.gameMode ? game.gameMode.gameMode : GAME_MODES.ENDLESS;
  const selectedLandmark = game && game.gameMode ? game.gameMode.selectedLandmark : null;
  const score = Math.max(0, game && game.score ? game.score : 0);
  const matchedZone = selectedLandmark || getHighestReachedZone(score);
  const currentBadgeCount = getUnlockedZoneCount(state);

  let title = '联赛战报';
  let accent = '#7cf3c8';
  let modeLabel = '巡回赛';
  let summaryText = '本局冲上 ' + score + ' m';
  let sideLabel = '身份';
  let sideValue = tier.title;
  let message = '';
  let commentaryTitle = '联盟裁定';
  let spotlight = '当前登记：' + getCollectionLine(state);

  if (game && typeof game.isDebugRun === 'function' && game.isDebugRun()) {
    title = 'Debug 战报';
    accent = '#ffd37b';
    modeLabel = 'Debug Run';
    message = '本局为调试对局，不计入联赛成绩、金币或世界观解锁。';
    commentaryTitle = '调试说明';
    spotlight = '不会写入徽章、图鉴、席位或冠军杯资格。';
  } else if (gameMode === GAME_MODES.TIME_ATTACK) {
    title = '计时赛战报';
    accent = '#7ce7ff';
    modeLabel = '计时冲榜';
    summaryText = '限时成绩 ' + score + ' m';
    message = '计时赛已结束，保持节奏才能在短时窗口里抢到更高榜位。';
    spotlight = '速冲成绩会影响席位评价，但不直接授予赛区徽章。';
  } else if (gameMode === GAME_MODES.CHALLENGE && selectedLandmark) {
    const challengeGoal = game && game.gameMode && typeof game.gameMode.getChallengeGoal === 'function'
      ? game.gameMode.getChallengeGoal()
      : null;
    const achieved = game && game.gameMode && typeof game.gameMode.isChallengeCompleted === 'function'
      ? game.gameMode.isChallengeCompleted()
      : score >= selectedLandmark.targetHeight;
    const target = challengeGoal ? challengeGoal.target : selectedLandmark.targetHeight;
    const progressValue = challengeGoal ? challengeGoal.progress : score;
    title = achieved ? '徽章到手' : '徽章战失利';
    accent = achieved ? '#7cf3c8' : '#ffba7c';
    modeLabel = selectedLandmark.leagueTitle;
    summaryText = challengeGoal
      ? (selectedLandmark.name + ' ' + progressValue + ' / ' + target + ' ' + challengeGoal.summaryLabel)
      : (selectedLandmark.name + ' ' + score + ' / ' + target + ' m');
    sideLabel = '赛区';
    sideValue = selectedLandmark.name;
    commentaryTitle = achieved ? '馆主裁定' : '复盘建议';
    message = achieved
      ? '你已经完成 ' + selectedLandmark.leagueTitle + ' 的守关考核，联赛席位继续上升。'
      : '这条赛道还没被完全读懂，再调节节奏就能突破 ' + selectedLandmark.leagueTitle + '。';
    spotlight = achieved
      ? '获得 ' + selectedLandmark.badgeName + ' · 现有徽章 ' + currentBadgeCount + '/' + landmarks.length
      : '目标徽章：' + selectedLandmark.badgeName + ' · ' + (challengeGoal ? challengeGoal.desc : selectedLandmark.captainTitle);
  } else if (matchedZone) {
    modeLabel = matchedZone.leagueTitle || '巡回赛';
    summaryText = matchedZone.name + ' 赛段最高 ' + score + ' m';
    message = '本局已打到 ' + matchedZone.leagueTitle + ' 节奏区间，继续冲刺就能稳定拿下更高席位。';
    spotlight = '当前最深赛段：' + matchedZone.stageName + ' · 徽章目标 ' + matchedZone.badgeName;
  } else {
    message = '巡回赛刚刚起步，先把基础节奏打稳，再去争夺下一赛区门票。';
    spotlight = '起步阶段先登记基础成绩，拿下首枚赛区徽章后才能进入大会主舞台。';
  }

  if (nextZone && !(game && typeof game.isDebugRun === 'function' && game.isDebugRun())) {
    message += ' 下一目标：' + nextZone.leagueTitle + ' ' + nextZone.targetHeight + 'm。';
  } else if (!nextZone && !(game && typeof game.isDebugRun === 'function' && game.isDebugRun())) {
    message += ' 主赛区已全部解锁，接下来就是刷新联赛极限纪录。';
  }

  return {
    meta: {
      title: title,
      accent: accent,
      modeLabel: modeLabel,
      summaryText: summaryText,
      sideLabel: sideLabel,
      sideValue: sideValue
    },
    message: message,
    commentaryTitle: commentaryTitle,
    spotlight: spotlight
  };
}

function resolveWorldviewProgress(progress, context) {
  const state = normalizeState(progress && progress.worldview);
  const highestScore = progress && progress.achievementStats
    ? Math.max(Math.floor(progress.achievementStats.highestScore || 0), Math.floor(context && context.score || 0))
    : Math.max(0, Math.floor(context && context.score || 0));
  const unlocks = [];

  for (let i = 0; i < landmarks.length; i++) {
    const zone = landmarks[i];
    if (highestScore >= zone.targetHeight && state.unlockedZones.indexOf(zone.id) === -1) {
      state.unlockedZones.push(zone.id);
      unlocks.push({
        id: 'zone:' + zone.id,
        message: '登记徽章档案：' + zone.badgeName
      });
    }
  }

  const bossTypes = context && Array.isArray(context.bossProfilesEncountered)
    ? context.bossProfilesEncountered
    : [];
  for (let i = 0; i < bossTypes.length; i++) {
    const bossType = bossTypes[i];
    if (state.unlockedBossProfiles.indexOf(bossType) === -1) {
      state.unlockedBossProfiles.push(bossType);
      unlocks.push({
        id: 'boss:' + bossType,
        message: '登记守关图鉴：' + getBossProfile(bossType).title
      });
    }
  }

  const tier = getSeasonTier(progress || {});
  if (state.lastSeasonTier !== tier.id) {
    unlocks.unshift({
      id: 'tier:' + tier.id,
      message: '联盟席位晋升：' + tier.title
    });
  }
  state.lastSeasonTier = tier.id;
  if (unlocks.length > 0) {
    state.lastNarrativeUnlock = unlocks[unlocks.length - 1].message;
  }

  return {
    state: state,
    unlocks: unlocks,
    tier: tier
  };
}

module.exports = {
  LEAGUE_PROFILE,
  getDefaultState,
  normalizeState,
  getSeasonTier,
  getHomeNarrative,
  getRunStartNarrative,
  getThemeNarrative,
  getBossProfile,
  getBossWarningText,
  getBossSpawnText,
  getBossInterruptText,
  getBossDefeatText,
  getBossMissText,
  getBossHitText,
  getBossExitText,
  getGrowthBossDefeatText,
  getResultNarrative,
  resolveWorldviewProgress
};
