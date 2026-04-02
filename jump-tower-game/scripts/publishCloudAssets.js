#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const tcb = require('@cloudbase/node-sdk');
const { buildDoc } = require('./buildAssetManifest');

const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_COLLECTION = 'asset_manifest';

function getArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) {
    return '';
  }
  return process.argv[index + 1];
}

function hasFlag(flag) {
  return process.argv.indexOf(flag) !== -1;
}

function getRequiredValue(name, flags, envKeys) {
  for (let i = 0; i < flags.length; i++) {
    const value = getArg(flags[i]);
    if (value) return value;
  }

  for (let j = 0; j < envKeys.length; j++) {
    const value = process.env[envKeys[j]];
    if (value) return value;
  }

  throw new Error('缺少参数 ' + name + '。请通过 ' + flags.join('/') + ' 或环境变量 ' + envKeys.join('/') + ' 提供');
}

function getOptionalValue(flags, envKeys, defaultValue) {
  for (let i = 0; i < flags.length; i++) {
    const value = getArg(flags[i]);
    if (value) return value;
  }

  for (let j = 0; j < envKeys.length; j++) {
    const value = process.env[envKeys[j]];
    if (value) return value;
  }

  return defaultValue;
}

function writeJsonIfNeeded(outputPath, data) {
  if (!outputPath) return;
  const absPath = path.resolve(process.cwd(), outputPath);
  fs.writeFileSync(absPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log('[publishCloudAssets] wrote manifest:', absPath);
}

function assertSemver(version) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error('version 必须是 x.y.z 格式，例如 1.0.0');
  }
}

function getLocalFilePath(localPath) {
  return path.resolve(REPO_ROOT, localPath);
}

async function uploadAsset(app, asset) {
  const filePath = getLocalFilePath(asset.localPath);
  if (!fs.existsSync(filePath)) {
    throw new Error('本地资源不存在: ' + filePath);
  }

  const result = await app.uploadFile({
    cloudPath: asset.cloudPath,
    fileContent: fs.createReadStream(filePath)
  });

  const fileID = result && (result.fileID || result.fileId);
  if (!fileID) {
    throw new Error('上传成功但未返回 fileID: ' + asset.cloudPath);
  }

  return Object.assign({}, asset, {
    fileID: fileID
  });
}

async function disableOtherVersions(db, collectionName, currentId) {
  const res = await db.collection(collectionName).where({
    enabled: true
  }).get();

  const docs = res.data || [];
  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    if (!doc._id || doc._id === currentId) {
      continue;
    }
    await db.collection(collectionName).doc(doc._id).update({
      enabled: false
    });
  }
}

async function upsertManifest(db, collectionName, doc, disableOthers) {
  const existing = await db.collection(collectionName).where({
    version: doc.version
  }).get();

  let currentId = '';

  if (existing.data && existing.data.length > 0) {
    currentId = existing.data[0]._id;
    await db.collection(collectionName).doc(currentId).update(doc);
    console.log('[publishCloudAssets] updated manifest version:', doc.version);
  } else {
    const addRes = await db.collection(collectionName).add(doc);
    currentId = addRes && (addRes._id || addRes.id || '');
    console.log('[publishCloudAssets] inserted manifest version:', doc.version);
  }

  if (disableOthers) {
    await disableOtherVersions(db, collectionName, currentId);
  }

  return currentId;
}

async function verifyManifest(db, collectionName, version) {
  const res = await db.collection(collectionName).where({
    version: version
  }).get();

  if (!res.data || res.data.length === 0) {
    throw new Error('写入后校验失败：未查到 version=' + version);
  }

  const doc = res.data[0];
  if (doc.enabled !== true) {
    throw new Error('写入后校验失败：enabled 不是 true');
  }

  if (!Array.isArray(doc.assets) || doc.assets.length === 0) {
    throw new Error('写入后校验失败：assets 为空');
  }

  return doc;
}

async function main() {
  const envId = getRequiredValue('env-id', ['--env-id'], ['CLOUDBASE_ENV_ID']);
  const secretId = getRequiredValue('secret-id', ['--secret-id'], ['CLOUDBASE_SECRET_ID', 'TENCENTCLOUD_SECRETID']);
  const secretKey = getRequiredValue('secret-key', ['--secret-key'], ['CLOUDBASE_SECRET_KEY', 'TENCENTCLOUD_SECRETKEY']);
  const sessionToken = getOptionalValue(['--session-token'], ['CLOUDBASE_SESSION_TOKEN', 'TENCENTCLOUD_SESSIONTOKEN'], '');
  const version = getRequiredValue('version', ['--version'], []);
  const collectionName = getOptionalValue(['--collection'], [], DEFAULT_COLLECTION);
  const outputPath = getArg('--output');
  const disableOthers = !hasFlag('--keep-others-enabled');

  assertSemver(version);

  const app = tcb.init({
    env: envId,
    secretId: secretId,
    secretKey: secretKey,
    sessionToken: sessionToken || undefined
  });

  const db = app.database();
  const manifest = buildDoc(version, '');
  const uploadedAssets = [];

  console.log('[publishCloudAssets] uploading assets:', manifest.assets.length);
  for (let i = 0; i < manifest.assets.length; i++) {
    const asset = manifest.assets[i];
    const uploaded = await uploadAsset(app, asset);
    uploadedAssets.push(uploaded);
    console.log('[publishCloudAssets] uploaded:', asset.cloudPath);
  }

  const manifestDoc = {
    enabled: true,
    version: manifest.version,
    updatedAt: Date.now(),
    assets: uploadedAssets
  };

  writeJsonIfNeeded(outputPath, manifestDoc);
  await upsertManifest(db, collectionName, manifestDoc, disableOthers);
  const verifiedDoc = await verifyManifest(db, collectionName, version);
  console.log('[publishCloudAssets] verified assets:', verifiedDoc.assets.length);

  console.log('[publishCloudAssets] done');
  console.log('[publishCloudAssets] env:', envId);
  console.log('[publishCloudAssets] collection:', collectionName);
  console.log('[publishCloudAssets] version:', version);
}

main().catch(function(err) {
  console.error('[publishCloudAssets] failed:', err && err.stack ? err.stack : err);
  process.exit(1);
});
