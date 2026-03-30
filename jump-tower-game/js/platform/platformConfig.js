/**
 * 平台配置管理器
 * 从表格加载平台配置，管理平台资源和属性
 */

const tableManager = require('../tables/tableManager');

// 平台配置
const platformConfig = {
  // 所有平台数据（从表格加载）
  platforms: [],
  // 按类型分组的平台
  byType: {},
  // 已加载的图片资源
  images: {},
  // 是否已初始化
  initialized: false
};

/**
 * 从表格初始化平台配置
 */
function initFromTable() {
  if (platformConfig.initialized) return;

  const platforms = tableManager.getAll('Platforms');
  platformConfig.platforms = platforms;

  // 按类型分组
  for (const p of platforms) {
    if (!platformConfig.byType[p.Type]) {
      platformConfig.byType[p.Type] = [];
    }
    platformConfig.byType[p.Type].push(p);
  }

  platformConfig.initialized = true;
  console.log('[PlatformConfig] 从表格加载平台:', platforms.length, '个');
  console.log('[PlatformConfig] 类型分组:', Object.keys(platformConfig.byType));
}

/**
 * 获取指定类型的随机平台配置
 * @param {string} type - 平台类型
 * @returns {Object|null} 平台配置
 */
function getRandomByType(type) {
  if (!platformConfig.initialized) {
    initFromTable();
  }

  const list = platformConfig.byType[type];
  if (!list || list.length === 0) {
    // 如果没有该类型，返回 normal 类型
    const normalList = platformConfig.byType['normal'];
    if (normalList && normalList.length > 0) {
      return normalList[Math.floor(Math.random() * normalList.length)];
    }
    return platformConfig.platforms[0] || null;
  }

  return list[Math.floor(Math.random() * list.length)];
}

/**
 * 根据 ID 获取平台配置
 * @param {number} id - 平台 ID
 * @returns {Object|null} 平台配置
 */
function getById(id) {
  if (!platformConfig.initialized) {
    initFromTable();
  }
  return tableManager.getById('Platforms', id);
}

/**
 * 加载平台图片资源
 */
function loadImages() {
  if (!platformConfig.initialized) {
    initFromTable();
  }

  for (const p of platformConfig.platforms) {
    if (!platformConfig.images[p.Id]) {
      const img = wx.createImage();
      img.src = p.ResPath;
      platformConfig.images[p.Id] = img;
    }
  }

  console.log('[PlatformConfig] 图片加载完成:', Object.keys(platformConfig.images).length, '个');
}

/**
 * 获取平台图片
 * @param {number} platformId - 平台 ID
 * @returns {Image|null} 图片对象
 */
function getImage(platformId) {
  return platformConfig.images[platformId] || null;
}

/**
 * 获取所有平台类型
 * @returns {Array<string>} 类型数组
 */
function getAllTypes() {
  if (!platformConfig.initialized) {
    initFromTable();
  }
  return Object.keys(platformConfig.byType);
}

// 初始化
initFromTable();
loadImages();

module.exports = {
  platformConfig,
  initFromTable,
  getRandomByType,
  getById,
  loadImages,
  getImage,
  getAllTypes
};
