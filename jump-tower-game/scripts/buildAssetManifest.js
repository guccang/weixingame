#!/usr/bin/env node

/**
 * 从仓库内置资源清单生成可导入云数据库的 manifest 文档。
 *
 * 用法：
 * node scripts/buildAssetManifest.js --version 1.0.0
 * node scripts/buildAssetManifest.js --version 1.0.0 --fileid-prefix "cloud://env.bucket/"
 * node scripts/buildAssetManifest.js --version 1.0.0 --fileid-prefix "cloud://env.bucket/" --output manifest.json
 */

const fs = require('fs');
const path = require('path');
const { localManifest } = require('../js/resource/assetCatalog');

function getArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) {
    return '';
  }
  return process.argv[index + 1];
}

function normalizePrefix(prefix) {
  if (!prefix) return '';
  return prefix.endsWith('/') ? prefix : prefix + '/';
}

function assertSemver(version) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error('version 必须是 x.y.z 格式，例如 1.0.0');
  }
}

function buildDoc(version, fileIdPrefix) {
  const assets = localManifest.assets.map(function(asset) {
    const item = {
      key: asset.key,
      type: asset.type,
      localPath: asset.localPath,
      cloudPath: asset.cloudPath
    };

    if (fileIdPrefix) {
      item.fileID = fileIdPrefix + asset.cloudPath;
    }

    return item;
  });

  return {
    enabled: true,
    version: version,
    updatedAt: Date.now(),
    assets: assets
  };
}

function main() {
  const version = getArg('--version');
  const fileIdPrefix = normalizePrefix(getArg('--fileid-prefix'));
  const outputPath = getArg('--output');
  if (!version) {
    throw new Error('缺少参数 version。请通过 --version 提供，例如 1.0.0');
  }
  assertSemver(version);
  const doc = buildDoc(version, fileIdPrefix);
  const content = JSON.stringify(doc, null, 2);

  if (outputPath) {
    const absPath = path.resolve(process.cwd(), outputPath);
    fs.writeFileSync(absPath, content + '\n', 'utf-8');
    console.log('[buildAssetManifest] wrote:', absPath);
    return;
  }

  process.stdout.write(content + '\n');
}

if (require.main === module) {
  main();
}

module.exports = {
  assertSemver: assertSemver,
  buildDoc: buildDoc,
  normalizePrefix: normalizePrefix
};
