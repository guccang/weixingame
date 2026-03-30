/**
 * 角色配置模块
 * 数据从表格管理器加载
 */

const tableManager = require('../tables/tableManager');

// 状态到帧索引的映射
const STATE_TO_FRAME_INDEX = {
  'idle': 0,   // 站立
  'charge': 1, // 蓄力
  'jump': 2,   // 起跳
  'rise': 3,   // 上升
  'fall': 4,   // 下落
  'land': 5    // 落地
};

// 序列帧总数
const FRAME_COUNT = 6;

// 角色配置（从表格初始化）
const characterConfig = {
  // 当前选中的角色文件夹名
  current: null,
  // 角色列表（JumpFolder 数组）
  list: [],
  // 角色中文名称映射（JumpFolder -> Name）
  names: {},
  // 已加载的角色资源
  frames: {},
  // 加载状态
  loadedCharacters: {},
  // 是否已初始化
  initialized: false
};

/**
 * 从表格数据初始化角色配置
 */
function initFromTable() {
  if (characterConfig.initialized) return;

  const characters = tableManager.getAll('Character');

  for (const row of characters) {
    // 添加到列表
    characterConfig.list.push(row.JumpFolder);
    // 设置名称映射
    characterConfig.names[row.JumpFolder] = row.Name;
  }

  // 设置默认角色（第一个）
  if (characterConfig.list.length > 0) {
    characterConfig.current = characterConfig.list[0];
  }

  characterConfig.initialized = true;
  console.log('[Character] 从表格加载角色:', characterConfig.list);
}

/**
 * 加载指定角色的序列帧
 */
function loadCharacter(characterName) {
  if (characterConfig.frames[characterName]) {
    return; // 已加载
  }

  // 确保已初始化
  if (!characterConfig.initialized) {
    initFromTable();
  }

  // 检查角色是否存在
  if (!characterConfig.list.includes(characterName)) {
    console.warn('[Character] 未知角色:', characterName);
    return;
  }

  characterConfig.frames[characterName] = [];
  let loadCount = 0;

  for (let i = 0; i < FRAME_COUNT; i++) {
    const img = wx.createImage();
    img.onload = function() {
      loadCount++;
      if (loadCount >= FRAME_COUNT) {
        characterConfig.loadedCharacters[characterName] = true;
      }
    };
    img.src = `images/characters/${characterName}/jump_${i}.png`;
    characterConfig.frames[characterName].push(img);
  }
}

/**
 * 获取角色当前状态对应的帧图片
 */
function getCharacterFrame(characterName, state) {
  if (!characterConfig.loadedCharacters[characterName]) {
    return null;
  }
  const frameIndex = STATE_TO_FRAME_INDEX[state];
  return characterConfig.frames[characterName][frameIndex] || null;
}

/**
 * 切换角色
 */
function switchCharacter(characterName) {
  // 确保已初始化
  if (!characterConfig.initialized) {
    initFromTable();
  }

  if (characterConfig.list.includes(characterName)) {
    characterConfig.current = characterName;
    loadCharacter(characterName);
  }
}

/**
 * 预加载所有角色
 */
function preloadAllCharacters() {
  // 确保已初始化
  if (!characterConfig.initialized) {
    initFromTable();
  }

  for (const characterName of characterConfig.list) {
    loadCharacter(characterName);
  }
}

// 初始化并预加载
initFromTable();
preloadAllCharacters();

module.exports = {
  STATE_TO_FRAME_INDEX,
  characterConfig,
  loadCharacter,
  switchCharacter,
  getCharacterFrame,
  initFromTable
};
