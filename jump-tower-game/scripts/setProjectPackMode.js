#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const PROJECT_CONFIG_PATH = path.join(REPO_ROOT, 'project.config.json');
const ASSET_IGNORE_FOLDERS = ['images', 'audio'];

function getArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) {
    return '';
  }
  return process.argv[index + 1];
}

function printHelp() {
  console.log([
    '切换微信开发者工具打包模式',
    '',
    '用法：',
    '  node scripts/setProjectPackMode.js --mode local',
    '  node scripts/setProjectPackMode.js --mode cloud',
    '',
    '模式说明：',
    '  local  保留 images/audio 在工程包中，适合本地模拟器开发',
    '  cloud  从 project.config.json 的 packOptions.ignore 中排除 images/audio，适合真机调试上传或体验版',
    ''
  ].join('\n'));
}

function normalizeMode(mode) {
  const value = String(mode || '').trim().toLowerCase();
  if (value === 'local' || value === 'cloud') {
    return value;
  }
  return '';
}

function readProjectConfig() {
  if (!fs.existsSync(PROJECT_CONFIG_PATH)) {
    throw new Error('未找到 project.config.json: ' + PROJECT_CONFIG_PATH);
  }
  return JSON.parse(fs.readFileSync(PROJECT_CONFIG_PATH, 'utf8'));
}

function writeProjectConfig(projectConfig) {
  fs.writeFileSync(PROJECT_CONFIG_PATH, JSON.stringify(projectConfig, null, 4) + '\n', 'utf8');
}

function isIgnoredFolder(entry, folder) {
  return !!entry &&
    entry.type === 'folder' &&
    String(entry.value || '').replace(/\/+$/, '') === folder;
}

function ensureIgnoreFolder(ignoreList, folder) {
  for (let i = 0; i < ignoreList.length; i++) {
    if (isIgnoredFolder(ignoreList[i], folder)) {
      return;
    }
  }
  ignoreList.unshift({
    type: 'folder',
    value: folder
  });
}

function removeIgnoreFolder(ignoreList, folder) {
  for (let i = ignoreList.length - 1; i >= 0; i--) {
    if (isIgnoredFolder(ignoreList[i], folder)) {
      ignoreList.splice(i, 1);
    }
  }
}

function main() {
  const mode = normalizeMode(getArg('--mode'));
  if (!mode || process.argv.includes('--help') || process.argv.includes('-h')) {
    printHelp();
    if (!mode) {
      process.exit(1);
    }
    return;
  }

  const projectConfig = readProjectConfig();
  if (!projectConfig.packOptions || !Array.isArray(projectConfig.packOptions.ignore)) {
    projectConfig.packOptions = projectConfig.packOptions || {};
    projectConfig.packOptions.ignore = Array.isArray(projectConfig.packOptions.ignore)
      ? projectConfig.packOptions.ignore
      : [];
  }

  const ignoreList = projectConfig.packOptions.ignore;
  for (let i = 0; i < ASSET_IGNORE_FOLDERS.length; i++) {
    const folder = ASSET_IGNORE_FOLDERS[i];
    if (mode === 'cloud') {
      ensureIgnoreFolder(ignoreList, folder);
    } else {
      removeIgnoreFolder(ignoreList, folder);
    }
  }

  writeProjectConfig(projectConfig);

  console.log('[setProjectPackMode] mode:', mode);
  console.log('[setProjectPackMode] project:', PROJECT_CONFIG_PATH);
  console.log('[setProjectPackMode] asset ignores:', ASSET_IGNORE_FOLDERS.join(', '), mode === 'cloud' ? 'enabled' : 'disabled');
}

main();
