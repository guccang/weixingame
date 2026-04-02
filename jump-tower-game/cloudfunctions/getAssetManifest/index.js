const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const COLLECTION_NAME = 'asset_manifest';

function normalizeManifestDoc(doc) {
  if (!doc) return null;
  const payload = doc.data && !doc.version && !doc.assets ? doc.data : doc;
  if (!payload) return null;
  if (payload.enabled !== true) return null;

  return {
    version: payload.version || 'cloud-unknown',
    updatedAt: payload.updatedAt || 0,
    assets: Array.isArray(payload.assets) ? payload.assets : []
  };
}

/**
 * 集合文档结构约定：
 * {
 *   enabled: true,
 *   version: '2026.04.02-001',
 *   updatedAt: Date.now(),
 *   assets: [
 *     {
 *       key: 'ui.bgMain',
 *       type: 'image',
 *       localPath: 'images/ui_main/bg_main.png',
 *       cloudPath: 'assets/images/ui_main/bg_main.png',
 *       fileID: 'cloud://...'
 *     }
 *   ]
 * }
 */
exports.main = async function() {
  try {
    const res = await db.collection(COLLECTION_NAME)
      .orderBy('updatedAt', 'desc')
      .limit(20)
      .get();

    const docs = res.data || [];
    console.log('[getAssetManifest] fetched docs:', docs.length);

    for (let i = 0; i < docs.length; i++) {
      const manifest = normalizeManifestDoc(docs[i]);
      if (!manifest) {
        continue;
      }
      console.log('[getAssetManifest] using version:', manifest.version, 'assets:', manifest.assets.length);
      return {
        version: manifest.version,
        assets: manifest.assets
      };
    }
  } catch (e) {
    console.error('[getAssetManifest] 查询 asset_manifest 失败:', e);
  }

  return {
    version: 'cloud-empty',
    assets: []
  };
};
