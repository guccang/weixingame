/**
 * 技能数据加载器
 * 加载和解析技能配置文件
 */

let skillConfig = null;

/**
 * 加载技能配置
 * @param {Function} callback - 加载完成回调
 */
function loadSkillConfig(callback) {
  if (skillConfig) {
    callback(skillConfig);
    return;
  }

  const req = wx.request({
    url: 'js/skill/skillConfig.json',
    data: {},
    success: function(res) {
      skillConfig = res.data;
      callback(skillConfig);
    },
    fail: function() {
      console.error('Failed to load skill config, using embedded default');
      skillConfig = getEmbeddedConfig();
      callback(skillConfig);
    }
  });
}

/**
 * 获取内置默认配置
 */
function getEmbeddedConfig() {
  return {
    gestureThreshold: 30,
    gestureChargeMin: 5,
    gestures: {
      'up': 'jump',
      'down': 'slide',
      'left': 'moveLeft',
      'right': 'moveRight'
    },
    skills: {
      'jump': {
        'name': '跳跃',
        'frameIndex': 2,
        'sound': 'audio/jump.mp3',
        'particle': {
          'color': '#ffffff',
          'count': 8,
          'speed': 4
        },
        'physics': {
          'type': 'jump',
          'force': -15
        },
        'chargeGain': 1
      },
      'doubleJump': {
        'name': '二段跳',
        'frameIndex': 2,
        'sound': 'audio/jump.mp3',
        'particle': {
          'color': '#fd79a8',
          'count': 12,
          'speed': 5
        },
        'physics': {
          'type': 'doubleJump',
          'force': -18
        }
      },
      'slide': {
        'name': '下滑',
        'frameIndex': 4,
        'particle': {
          'color': '#88ccff',
          'count': 10,
          'speed': 6
        },
        'physics': {
          'type': 'slide',
          'force': 20
        },
        'chargeRelease': true
      },
      'moveLeft': {
        'name': '左移',
        'frameIndex': 1,
        'physics': {
          'type': 'horizontal',
          'direction': -1,
          'speed': 8
        }
      },
      'moveRight': {
        'name': '右移',
        'frameIndex': 1,
        'physics': {
          'type': 'horizontal',
          'direction': 1,
          'speed': 8
        }
      },
      'land': {
        'name': '落地',
        'frameIndex': 5,
        'particle': {
          'color': '#74b9ff',
          'count': 8,
          'speed': 3
        }
      },
      'boost': {
        'name': '火箭弹射',
        'frameIndex': 2,
        'sound': 'audio/jump.mp3',
        'particle': {
          'color': '#ffdd57',
          'count': 20,
          'speed': 8
        },
        'barrage': '火箭弹射！',
        'shake': 10,
        'physics': {
          'type': 'boost',
          'force': -22
        }
      },
      'charge': {
        'name': '蓄力',
        'frameIndex': 1,
        'particle': {
          'color': '#55efc4',
          'count': 5,
          'speed': 2
        }
      },
      'chargeFull': {
        'name': '满蓄力释放',
        'frameIndex': 2,
        'sound': 'audio/jump.mp3',
        'particle': {
          'color': '#ff00ff',
          'count': 30,
          'speed': 12
        },
        'barrage': '满蓄力发射！！',
        'shake': 20,
        'physics': {
          'type': 'chargeFull',
          'force': -50
        }
      }
    },
    chargeMax: 6
  };
}

/**
 * 获取技能配置
 * @returns {Object} 技能配置
 */
function getSkillConfig() {
  if (!skillConfig) {
    skillConfig = getEmbeddedConfig();
  }
  return skillConfig;
}

/**
 * 根据ID获取技能配置
 * @param {string} skillId - 技能ID
 * @returns {Object|null} 技能配置
 */
function getSkill(skillId) {
  const config = getSkillConfig();
  return config.skills[skillId] || null;
}

/**
 * 根据手势方向获取技能ID
 * @param {string} direction - 手势方向 (up/down/left/right)
 * @returns {string|null} 技能ID
 */
function getSkillByGesture(direction) {
  const config = getSkillConfig();
  return config.gestures[direction] || null;
}

/**
 * 获取手势阈值
 * @returns {number} 阈值
 */
function getGestureThreshold() {
  const config = getSkillConfig();
  return config.gestureThreshold || 30;
}

module.exports = {
  loadSkillConfig,
  getSkillConfig,
  getSkill,
  getSkillByGesture,
  getGestureThreshold,
  getEmbeddedConfig
};
