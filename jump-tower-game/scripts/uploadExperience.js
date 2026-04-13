#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const ci = require('miniprogram-ci');

const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_DESC_PREFIX = '体验版';
const FIXED_ROBOT = 1;
const DEFAULT_THREADS = 0;

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

function parseBoolean(rawValue, defaultValue) {
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return defaultValue;
  }

  const normalized = String(rawValue).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].indexOf(normalized) !== -1) {
    return true;
  }
  if (['0', 'false', 'no', 'n', 'off'].indexOf(normalized) !== -1) {
    return false;
  }
  return defaultValue;
}

function parseInteger(rawValue, defaultValue, minValue, maxValue) {
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return defaultValue;
  }

  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed)) {
    throw new Error('数值参数必须是整数: ' + rawValue);
  }

  if (typeof minValue === 'number' && parsed < minValue) {
    throw new Error('数值参数不能小于 ' + minValue + ': ' + rawValue);
  }

  if (typeof maxValue === 'number' && parsed > maxValue) {
    throw new Error('数值参数不能大于 ' + maxValue + ': ' + rawValue);
  }

  return parsed;
}

function assertSemver(version) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error('version 必须是 x.y.z 格式，例如 1.3.0');
  }
}

function printHelp() {
  console.log([
    '微信小游戏体验版上传',
    '',
    '用法：',
    '  node scripts/uploadExperience.js --version 1.3.0',
    '  node scripts/uploadExperience.js --version 1.3.0 --desc "体验版 1.3.0"',
    '  npm --prefix scripts run upload-experience -- --version 1.3.0',
    '',
    '可选参数：',
    '  --version            体验版版本号，格式 x.y.z；不传时会在终端里提示输入',
    '  --desc               体验版备注，默认是 "体验版 <version>"',
    '  --project-path       小游戏项目目录，默认仓库根目录',
    '  --appid              覆盖 project.config.json 中的 appid',
    '  --private-key-path   微信 CI 私钥文件路径',
    '  --private-key        微信 CI 私钥内容，也可通过环境变量传入',
    '  --upload-source-map  上传 sourceMap；默认关闭，避免 4MB 限制',
    '  --use-cos            强制走 COS 异步上传；默认开启',
    '  --threads            本地编译线程数，默认 0 交给工具决定',
    '  --help               显示帮助',
    '',
    '环境变量：',
    '  WECHAT_CI_PRIVATE_KEY_PATH',
    '  WECHAT_CI_PRIVATE_KEY',
    '  WECHAT_CI_DESC',
    '  WECHAT_CI_VERSION',
    '  WECHAT_CI_APPID',
    '  WECHAT_CI_PROJECT_PATH',
    '  WECHAT_CI_UPLOAD_SOURCE_MAP',
    '  WECHAT_CI_USE_COS',
    '  WECHAT_CI_THREADS'
  ].join('\n'));
}

function promptInput(question) {
  return new Promise(function(resolve) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(question, function(answer) {
      rl.close();
      resolve(answer);
    });
  });
}

async function resolveVersion() {
  const rawVersion = getOptionalValue(['--version'], ['WECHAT_CI_VERSION'], '');
  if (rawVersion) {
    assertSemver(rawVersion);
    return rawVersion;
  }

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('缺少参数 version。请通过 --version 提供，例如 1.3.0');
  }

  const prompted = String(await promptInput('请输入体验版版本号 (x.y.z): ')).trim();
  assertSemver(prompted);
  return prompted;
}

function resolveProjectPath() {
  const rawValue = getOptionalValue(['--project-path'], ['WECHAT_CI_PROJECT_PATH'], '');
  if (!rawValue) {
    return REPO_ROOT;
  }
  return path.resolve(process.cwd(), rawValue);
}

function readJson(absPath) {
  return JSON.parse(fs.readFileSync(absPath, 'utf8'));
}

function resolveProjectConfig(projectPath) {
  const configPath = path.join(projectPath, 'project.config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('未找到 project.config.json: ' + configPath);
  }
  return readJson(configPath);
}

function resolveAppId(projectConfig) {
  const appid = getOptionalValue(['--appid'], ['WECHAT_CI_APPID'], projectConfig.appid || '');
  if (!appid) {
    throw new Error('未找到 appid。请在 project.config.json 中配置，或通过 --appid / WECHAT_CI_APPID 传入');
  }
  return appid;
}

function resolveProjectType(projectConfig) {
  const explicitType = getOptionalValue(['--project-type'], ['WECHAT_CI_PROJECT_TYPE'], '');
  if (explicitType) {
    return explicitType;
  }

  if (projectConfig.compileType === 'game') {
    return 'miniGame';
  }
  if (projectConfig.compileType === 'plugin') {
    return 'miniGamePlugin';
  }
  return 'miniProgram';
}

function normalizePattern(pattern) {
  return String(pattern || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/\/+/g, '/');
}

function parseWxIgnore(projectPath) {
  const wxIgnorePath = path.join(projectPath, '.wxignore');
  if (!fs.existsSync(wxIgnorePath)) {
    return [];
  }

  return fs.readFileSync(wxIgnorePath, 'utf8')
    .split(/\r?\n/)
    .map(function(line) {
      return line.trim();
    })
    .filter(function(line) {
      return line && !line.startsWith('#');
    })
    .map(normalizePattern);
}

function convertPackOptionToPatterns(packOption) {
  if (!packOption || !packOption.value) {
    return [];
  }

  const value = normalizePattern(packOption.value);
  if (!value) {
    return [];
  }

  if (packOption.type === 'folder') {
    const folder = value.replace(/\/$/, '');
    return [folder + '/**', folder + '/**/*'];
  }

  return [value];
}

function resolveProjectIgnores(projectPath, projectConfig) {
  const patterns = [];
  const seen = Object.create(null);

  function pushPattern(pattern) {
    const normalized = normalizePattern(pattern);
    if (!normalized || seen[normalized]) {
      return;
    }
    seen[normalized] = true;
    patterns.push(normalized);
  }

  const packOptions = projectConfig.packOptions || {};
  const packIgnores = Array.isArray(packOptions.ignore) ? packOptions.ignore : [];

  for (let i = 0; i < packIgnores.length; i++) {
    const optionPatterns = convertPackOptionToPatterns(packIgnores[i]);
    for (let j = 0; j < optionPatterns.length; j++) {
      pushPattern(optionPatterns[j]);
    }
  }

  const wxIgnorePatterns = parseWxIgnore(projectPath);
  for (let k = 0; k < wxIgnorePatterns.length; k++) {
    pushPattern(wxIgnorePatterns[k]);
  }

  pushPattern('node_modules/**');
  pushPattern('node_modules/**/*');

  return patterns;
}

function resolvePrivateKeyOptions() {
  const privateKey = getOptionalValue(['--private-key'], ['WECHAT_CI_PRIVATE_KEY'], '');
  if (privateKey) {
    return {
      privateKey: privateKey.replace(/\\n/g, '\n')
    };
  }

  const privateKeyPath = getOptionalValue(['--private-key-path'], ['WECHAT_CI_PRIVATE_KEY_PATH'], '');
  if (!privateKeyPath) {
    throw new Error('缺少微信 CI 私钥。请通过 --private-key-path / WECHAT_CI_PRIVATE_KEY_PATH，或 --private-key / WECHAT_CI_PRIVATE_KEY 提供');
  }

  const absPath = path.resolve(process.cwd(), privateKeyPath);
  if (!fs.existsSync(absPath)) {
    throw new Error('微信 CI 私钥文件不存在: ' + absPath);
  }

  return {
    privateKeyPath: absPath
  };
}

function resolveDescription(version) {
  return getOptionalValue(['--desc'], ['WECHAT_CI_DESC'], DEFAULT_DESC_PREFIX + ' ' + version);
}

function warnIgnoredRobotOverride() {
  if (hasFlag('--robot') || process.env.WECHAT_CI_ROBOT) {
    console.warn('[uploadExperience] warning: robot 参数已禁用，固定使用 ci机器人1');
  }
}

function resolveThreads() {
  const rawValue = getOptionalValue(['--threads'], ['WECHAT_CI_THREADS'], String(DEFAULT_THREADS));
  return parseInteger(rawValue, DEFAULT_THREADS, 0);
}

function shouldUploadSourceMap() {
  if (hasFlag('--upload-source-map')) {
    return true;
  }
  if (hasFlag('--no-upload-source-map')) {
    return false;
  }
  return parseBoolean(process.env.WECHAT_CI_UPLOAD_SOURCE_MAP, false);
}

function shouldUseCos() {
  if (hasFlag('--use-cos')) {
    return true;
  }
  if (hasFlag('--no-use-cos')) {
    return false;
  }
  return parseBoolean(process.env.WECHAT_CI_USE_COS, true);
}

function buildProgressLogger() {
  let lastLabel = '';
  return function onProgressUpdate(progress) {
    if (!progress || typeof progress !== 'object') {
      return;
    }

    const label = progress.name || progress._name || progress.message || progress._message || '';
    const status = progress.status || progress._status || '';
    const key = [label, status].join(':');

    if (key && key !== lastLabel) {
      lastLabel = key;
      console.log('[uploadExperience] progress:', label || 'task', status || 'running');
    }
  };
}

async function main() {
  if (hasFlag('--help') || hasFlag('-h')) {
    printHelp();
    return;
  }

  const version = await resolveVersion();
  const projectPath = resolveProjectPath();
  const projectConfig = resolveProjectConfig(projectPath);
  const appid = resolveAppId(projectConfig);
  const type = resolveProjectType(projectConfig);
  const ignores = resolveProjectIgnores(projectPath, projectConfig);
  const privateKeyOptions = resolvePrivateKeyOptions();
  const desc = resolveDescription(version);
  warnIgnoredRobotOverride();
  const threads = resolveThreads();
  const useCOS = shouldUseCos();
  const uploadWithSourceMap = shouldUploadSourceMap();

  const project = new ci.Project(Object.assign({
    appid: appid,
    type: type,
    projectPath: projectPath,
    ignores: ignores
  }, privateKeyOptions));

  console.log('[uploadExperience] appid:', appid);
  console.log('[uploadExperience] type:', type);
  console.log('[uploadExperience] projectPath:', projectPath);
  console.log('[uploadExperience] version:', version);
  console.log('[uploadExperience] desc:', desc);
  console.log('[uploadExperience] robot:', FIXED_ROBOT, '(fixed)');
  console.log('[uploadExperience] ignores:', ignores.length);
  console.log('[uploadExperience] uploadWithSourceMap:', uploadWithSourceMap);
  console.log('[uploadExperience] useCOS:', useCOS);

  const result = await ci.upload({
    project: project,
    version: version,
    desc: desc,
    robot: FIXED_ROBOT,
    threads: threads,
    useCOS: useCOS,
    setting: {
      useProjectConfig: true,
      uploadWithSourceMap: uploadWithSourceMap
    },
    onProgressUpdate: buildProgressLogger()
  });

  console.log('[uploadExperience] upload complete');
  console.log(JSON.stringify(result, null, 2));
}

main().catch(function(err) {
  console.error('[uploadExperience] failed:', err && err.stack ? err.stack : err);
  process.exit(1);
});
