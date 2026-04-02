# 微信小游戏云资源发布说明

## 1. 背景

这个项目已经从“资源全部打进小游戏首包”的方式，改成了“代码首包 + 云端资源”的方式。

改造前的主要问题：

- `images/` 和 `audio/` 里的大文件直接参与小游戏上传包
- 首包体积超过微信小游戏 `4MB` 限制
- 每次资源变更都要重新发整个小游戏包
- 手工维护云数据库 `asset_manifest` 很容易出错

改造后的目标：

- 首包尽可能小，只保留运行代码和少量配置
- 图片、音频、表格资源放在微信云存储
- 客户端启动时从云函数获取资源清单
- 资源版本由云端控制，客户端按版本下载和缓存
- 使用脚本一次性完成上传资源 + 生成 manifest + 写数据库

## 2. 我们解决了什么问题

### 2.1 首包超过 4MB

已经在 [project.config.json](/Users/guccang/github_repo/weixingame/jump-tower-game/project.config.json) 里通过 `packOptions.ignore` 排除了以下目录：

- `images`
- `audio`
- `cloudfunctions`
- `docs`
- `scripts`
- `.codex`

因此正式上传小游戏时，首包里主要只剩：

- `js/`
- `tables/`
- `game.js`
- `game.json`
- 项目配置

### 2.2 资源改了就要重新发包

现在资源不再依赖首包更新，而是依赖云端 manifest。

只要：

- 上传新资源到云存储
- 发布新 manifest 版本

客户端下次启动就会拿到新版本。

### 2.3 手工维护 manifest 容易错

已经改成：

- 用 [js/resource/assetCatalog.js](/Users/guccang/github_repo/weixingame/jump-tower-game/js/resource/assetCatalog.js) 维护资源源信息
- 用脚本自动上传和生成 manifest
- 自动写入 `asset_manifest` 集合
- 自动校验写库结果

避免手工复制一大堆 `fileID`。

## 3. 运行原理

### 3.1 启动流程

小游戏启动后执行：

1. [game.js](/Users/guccang/github_repo/weixingame/jump-tower-game/game.js) 进入 [js/bootstrap.js](/Users/guccang/github_repo/weixingame/jump-tower-game/js/bootstrap.js)
2. `bootstrap` 初始化云环境并调用资源管理器
3. [js/resource/assetManager.js](/Users/guccang/github_repo/weixingame/jump-tower-game/js/resource/assetManager.js) 调用云函数 `getAssetManifest`
4. 云函数从 `asset_manifest` 集合中返回当前生效版本
5. 客户端拿到：
   - `version`
   - `assets`
6. 客户端把资源下载到本地缓存目录：

```text
wx.env.USER_DATA_PATH/assets/<version>/
```

7. 运行时图片、音频、表格统一通过资源系统加载缓存文件

### 3.2 版本是怎么决定的

当前版本不是客户端写死的，而是云函数返回的。

链路如下：

- 发布脚本写入数据库文档里的 `version`
- 云函数读取数据库并返回 `version`
- 客户端记录当前 `version`
- 本地缓存目录以 `version` 命名

所以客户端拿哪个资源版本，取决于云函数返回哪条 manifest。

### 3.3 当前云函数如何选择版本

当前 [cloudfunctions/getAssetManifest/index.js](/Users/guccang/github_repo/weixingame/jump-tower-game/cloudfunctions/getAssetManifest/index.js) 的策略是：

- 读取 `asset_manifest`
- 按 `updatedAt` 倒序
- 找到第一条 `enabled === true` 的记录
- 返回它的 `version` 和 `assets`

因此当前策略等价于：

**所有客户端默认都拿“当前启用的最新版本”。**

如果以后要支持：

- 多个小游戏客户端版本
- 对应不同资源版本

需要继续扩展为：

- 客户端把 `clientVersion` 传给云函数
- 云函数按 `clientVersion` 选择对应 manifest

当前文档先描述现有实现。

## 4. 关键文件

### 4.1 客户端

- [js/bootstrap.js](/Users/guccang/github_repo/weixingame/jump-tower-game/js/bootstrap.js)
  - 启动资源初始化
- [js/resource/envConfig.js](/Users/guccang/github_repo/weixingame/jump-tower-game/js/resource/envConfig.js)
  - 决定本地模式 / 云模式
- [js/resource/assetManager.js](/Users/guccang/github_repo/weixingame/jump-tower-game/js/resource/assetManager.js)
  - 管理 manifest、缓存、路径解析
- [js/resource/assetManifestService.js](/Users/guccang/github_repo/weixingame/jump-tower-game/js/resource/assetManifestService.js)
  - 调云函数拿 manifest
- [js/resource/assetCatalog.js](/Users/guccang/github_repo/weixingame/jump-tower-game/js/resource/assetCatalog.js)
  - 资源源清单

### 4.2 云端

- [cloudfunctions/getAssetManifest/index.js](/Users/guccang/github_repo/weixingame/jump-tower-game/cloudfunctions/getAssetManifest/index.js)
  - 返回当前生效 manifest

### 4.3 发布脚本

- [scripts/buildAssetManifest.js](/Users/guccang/github_repo/weixingame/jump-tower-game/scripts/buildAssetManifest.js)
  - 只生成 manifest JSON
- [scripts/publishCloudAssets.js](/Users/guccang/github_repo/weixingame/jump-tower-game/scripts/publishCloudAssets.js)
  - 上传资源 + 写数据库
- [publish-cloud-assets skill](/Users/guccang/github_repo/weixingame/jump-tower-game/.codex/skills/publish-cloud-assets/SKILL.md)
  - 对应的一键发布 skill

## 5. 资源发布流程

### 5.1 前置条件

先准备以下信息：

- CloudBase 环境 ID
- 腾讯云 `SecretId`
- 腾讯云 `SecretKey`
- 可选 `SessionToken`

环境变量示例：

```bash
export CLOUDBASE_ENV_ID='cloud1-9gazfwmccd451101'
export CLOUDBASE_SECRET_ID='AKIDxxxxxxxxxxxxxxxx'
export CLOUDBASE_SECRET_KEY='xxxxxxxxxxxxxxxx'
```

如果使用临时凭证：

```bash
export CLOUDBASE_SESSION_TOKEN='xxxxxxxxxxxxxxxx'
```

### 5.2 第一次安装脚本依赖

```bash
cd scripts
npm install
```

或者直接使用 skill 包装脚本，它会自动安装：

```bash
.codex/skills/publish-cloud-assets/scripts/publish_all.sh \
  --env-id "$CLOUDBASE_ENV_ID" \
  --version 2026.04.02-001 \
  --output manifest.json
```

### 5.3 正式发布一个新资源版本

推荐命令：

```bash
.codex/skills/publish-cloud-assets/scripts/publish_all.sh \
  --env-id "$CLOUDBASE_ENV_ID" \
  --version 2026.04.02-001 \
  --output manifest.json
```

这条命令会做这些事：

1. 读取 [assetCatalog.js](/Users/guccang/github_repo/weixingame/jump-tower-game/js/resource/assetCatalog.js)
2. 把所有资源上传到云存储
3. 为每个资源拿到 `fileID`
4. 生成 manifest 文档
5. 写入数据库集合 `asset_manifest`
6. 默认关闭其它 `enabled === true` 的旧版本
7. 回查数据库，验证写入结果

发布成功后，终端里应该看到类似输出：

```text
[publishCloudAssets] uploaded: assets/images/ui_main/bg_main.png
...
[publishCloudAssets] updated manifest version: 2026.04.02-001
[publishCloudAssets] verified assets: 36
[publishCloudAssets] done
```

### 5.4 如何换新版本号

只需要在发布时改 `--version`：

```bash
.codex/skills/publish-cloud-assets/scripts/publish_all.sh \
  --env-id "$CLOUDBASE_ENV_ID" \
  --version 2026.04.03-001 \
  --output manifest.json
```

客户端不会写死版本号，而是下次启动时从云函数拿到这个新版本。

## 6. 云函数部署流程

本地修改了 [cloudfunctions/getAssetManifest/index.js](/Users/guccang/github_repo/weixingame/jump-tower-game/cloudfunctions/getAssetManifest/index.js) 后，必须重新上传部署，否则线上还是旧代码。

在微信开发者工具里：

1. 打开项目
2. 进入“云开发”
3. 选择正确环境
4. 打开“云函数”
5. 找到 `getAssetManifest`
6. 选择“上传并部署：云端安装依赖”

部署完成后，再点“测试”。

### 6.1 云函数测试成功的标准

返回结果应该类似：

```json
{
  "version": "2026.04.02-001",
  "assets": [
    {
      "key": "ui.bgMain",
      "fileID": "cloud://..."
    }
  ]
}
```

如果返回：

```json
{
  "version": "cloud-empty",
  "assets": []
}
```

说明数据库中没有查到生效的 manifest，或者记录结构不对。

## 7. 数据库结构要求

集合名必须是：

```text
asset_manifest
```

单条记录必须是扁平结构，不要再包一层 `data`：

正确结构：

```json
{
  "enabled": true,
  "version": "2026.04.02-001",
  "updatedAt": 1775142101107,
  "assets": [
    {
      "key": "ui.bgMain",
      "type": "image",
      "localPath": "images/ui_main/bg_main.png",
      "cloudPath": "assets/images/ui_main/bg_main.png",
      "fileID": "cloud://..."
    }
  ]
}
```

错误结构：

```json
{
  "_id": "...",
  "data": {
    "enabled": true,
    "version": "2026.04.02-001",
    "assets": []
  }
}
```

错误结构会导致云函数查不到 `enabled === true`。

## 8. 本地和云端模式

模式由 [js/resource/envConfig.js](/Users/guccang/github_repo/weixingame/jump-tower-game/js/resource/envConfig.js) 控制。

### 8.1 本地开发

`develop` 环境默认走本地资源回退，方便调试。

也可以手动强制：

```js
GameGlobal.ASSET_SOURCE_MODE = 'local'
```

### 8.2 生产环境

生产环境默认走云资源。

并且正式上传包已经忽略了 `images/` 和 `audio/`，所以生产环境必须保证：

- 云函数可用
- manifest 可用
- 云存储资源存在

否则客户端启动时会显示资源加载失败页。

## 9. 常见问题

### 9.1 为什么已经上云了，首包还是超过 4MB

因为“支持云资源”不等于“本地资源不会被打包”。

只有在 [project.config.json](/Users/guccang/github_repo/weixingame/jump-tower-game/project.config.json) 中把大资源目录排除，上传包体积才会真正下降。

### 9.2 为什么云函数返回 `cloud-empty`

常见原因：

- `asset_manifest` 集合没有数据
- 数据不在当前环境
- `enabled` 不是布尔值 `true`
- 文档结构错误，包进了 `data`

### 9.3 为什么发布脚本说成功，但云函数还是查不到

之前脚本曾经用错 SDK 写法，导致文档被写成：

```json
{
  "data": { ... }
}
```

现在已经修复。

如果历史脏数据还在，请删除旧错误记录后重新发布。

### 9.4 客户端怎么知道当前拿哪个版本

不是客户端写死。

而是：

- 云函数返回哪个 `version`
- 客户端就拿哪个 `version`

并且缓存目录也按这个版本生成。

## 10. 目前的局限

当前实现适合：

- 单客户端代码版本
- 对应一个当前生效资源版本

当前还没有实现：

- 不同客户端版本拿不同资源版本
- `clientVersion` 与 `resourceVersion` 的精确匹配
- 灰度发布

如果后续需要多客户端版本并存，建议下一步扩展：

- 客户端上报 `clientVersion`
- manifest 增加 `clientVersion` / `minClientVersion` / `maxClientVersion`
- 云函数按客户端版本选择资源版本

## 11. 发布检查清单

每次发新版前，建议按这个顺序检查：

1. 资源是否已经在 [assetCatalog.js](/Users/guccang/github_repo/weixingame/jump-tower-game/js/resource/assetCatalog.js) 中登记
2. 是否执行了资源发布脚本
3. 发布日志里是否有：
   - `verified assets: ...`
   - `done`
4. 数据库 `asset_manifest` 是否存在正确扁平结构记录
5. 云函数是否已经重新上传并部署
6. 云函数测试返回是否为：
   - 正确 `version`
   - 非空 `assets`
7. 小游戏控制台是否打印：

```text
[AssetManager] 初始化完成, mode= cloud version= ...
```

满足以上条件后，再做真机调试和正式上传。
