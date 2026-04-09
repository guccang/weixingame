/**
 * 角色配置模块
 * 数据从表格管理器加载
 */

const tableManager = require('../tables/tableManager');
const assetManager = require('../resource/assetManager');

// 状态到帧索引的映射
const STATE_TO_FRAME_INDEX = {
  'idle': 0,   // 站立
  'charge': 1, // 蓄力
  'jump': 2,   // 起跳
  'rise': 3,   // 上升
  'fall': 4,   // 下落
  'land': 5    // 落地
};

// 角色配置（从表格初始化）
const characterConfig = {
  // 当前选中的角色文件夹名
  current: null,
  // 角色列表（JumpFolder 数组）
  list: [],
  // 角色中文名称映射（JumpFolder -> Name）
  names: {},
  // 角色序列帧数量映射（JumpFolder -> FrameCount）
  frameCounts: {},
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
    // 设置帧数量映射
    characterConfig.frameCounts[row.JumpFolder] = row.FrameCount || 6;
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
  let frameCount = 0; // 实际加载成功的帧数
  let stopped = false; // 是否已停止加载
  const maxFrames = characterConfig.frameCounts[characterName] || 6; // 从表格读取帧数

  // 动态检测实际帧数
  for (let i = 0; i < maxFrames; i++) {
    // 如果已确定帧序列结束，不再尝试加载更多
    if (stopped) {
      break;
    }

    const img = wx.createImage();
    const imgPath = assetManager.getImagePath(`images/characters/${characterName}/jump_${i}.png`);
    img.onload = (function(idx) {
      return function() {
        // 只有成功加载的有效帧才加入
        if (this.width > 0) {
          characterConfig.frames[characterName][idx] = this;
          frameCount++;
          // 成功加载后继续尝试下一帧
        }
      };
    })(i);
    img.onerror = (function() {
      return function() {
        // 遇到第一个不存在的帧号时停止加载
        stopped = true;
        // 标记加载完成
        characterConfig.loadedCharacters[characterName] = true;
      };
    })();
    img.src = imgPath;
    // 预先分配数组位置，避免索引错位
    characterConfig.frames[characterName].push(null);
  }

  // 如果循环正常结束（未通过onerror停止），标记加载完成
  if (!stopped && frameCount > 0) {
    characterConfig.loadedCharacters[characterName] = true;
  }
}

/**
 * 获取角色当前状态对应的帧图片
 */
function getCharacterFrame(characterName, state) {
  if (!characterConfig.loadedCharacters[characterName]) {
    return null;
  }
  const frames = characterConfig.frames[characterName];
  if (!frames || frames.length === 0) {
    return null;
  }
  const frameIndex = STATE_TO_FRAME_INDEX[state];
  // 计算实际加载的有效帧数
  const actualFrameCount = frames.filter(function(f) { return f && f.width > 0; }).length;
  if (actualFrameCount === 0) {
    return null;
  }
  // 帧索引越界时返回最后一帧（适用于帧数不足的情况）
  const validIndex = Math.min(frameIndex, actualFrameCount - 1);
  return frames[validIndex] || null;
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
