// 状态到帧索引的映射
const STATE_TO_FRAME_INDEX = {
  'idle': 0,   // 站立
  'charge': 1, // 蓄力
  'jump': 2,   // 起跳
  'rise': 3,   // 上升
  'fall': 4,   // 下落
  'land': 5    // 落地
};

// 角色配置
const characterConfig = {
  // 当前选中的角色
  current: 'coach',
  // 角色列表
  list: ['coach', 'ironman'],
  // 角色中文名称
  names: {
    'coach': '健身教练',
    'ironman': '钢铁侠'
  },
  // 序列帧总数
  frameCount: 6,
  // 已加载的角色资源
  frames: {},
  // 加载状态
  loadedCharacters: {}
};

// 加载指定角色的序列帧
function loadCharacter(characterName) {
  if (characterConfig.frames[characterName]) {
    return; // 已加载
  }

  characterConfig.frames[characterName] = [];
  let loadCount = 0;

  for (let i = 0; i < characterConfig.frameCount; i++) {
    const img = wx.createImage();
    img.onload = function() {
      loadCount++;
      if (loadCount >= characterConfig.frameCount) {
        characterConfig.loadedCharacters[characterName] = true;
      }
    };
    img.src = `images/characters/${characterName}/jump_${i}.png`;
    characterConfig.frames[characterName].push(img);
  }
}

// 获取角色当前状态对应的帧图片
function getCharacterFrame(characterName, state) {
  if (!characterConfig.loadedCharacters[characterName]) {
    return null;
  }
  const frameIndex = STATE_TO_FRAME_INDEX[state];
  return characterConfig.frames[characterName][frameIndex] || null;
}

// 切换角色
function switchCharacter(characterName) {
  if (characterConfig.list.includes(characterName)) {
    characterConfig.current = characterName;
    loadCharacter(characterName);
  }
}

// 预加载所有角色
loadCharacter('coach');
loadCharacter('ironman');

module.exports = {
  STATE_TO_FRAME_INDEX: STATE_TO_FRAME_INDEX,
  characterConfig: characterConfig,
  loadCharacter: loadCharacter,
  getCharacterFrame: getCharacterFrame,
  switchCharacter: switchCharacter
};
