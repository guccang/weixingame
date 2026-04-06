---
name: cloud-upload
description: 上传游戏资源到微信云开发服务器。当用户说"打包上传"、"上传云端"、"发布资源"、"cloud-upload"、"上传资源"或需要将游戏资源发布到云开发环境时使用此skill。
---

# Cloud Upload Skill

上传游戏资源到微信云开发环境。

## 工作流程

1. **读取凭证** - 从 `~/github_repo/weixincloud.sh` 加载环境变量
2. **执行上传** - 运行 `scripts/publishCloudAssets.js` 脚本
3. **输出结果** - 汇报上传状态和资源数量

## 使用方法

执行时需提供版本号参数：

```
/cloud-upload 1.2.2
```

或直接描述：

```
上传资源到云端，版本1.2.2
```

## 项目路径

游戏项目路径：`/Users/guccang/github_repo/weixingame/jump-tower-game`

## 执行命令

```bash
cd /Users/guccang/github_repo/weixingame/jump-tower-game && \
source ~/github_repo/weixincloud.sh && \
node scripts/publishCloudAssets.js --version <VERSION>
```

## 凭证文件

凭证位置：`~/github_repo/weixincloud.sh`

内容格式：
```bash
export CLOUDBASE_ENV_ID=cloud1-9gazfwmccd451101
export CLOUDBASE_SECRET_ID=AKIDxxxxx
export CLOUDBASE_SECRET_KEY=xxxxx
```

## 成功输出示例

```
[publishCloudAssets] uploading assets: 41
[publishCloudAssets] uploaded: assets/images/ui_main/bg_main.png
...
[publishCloudAssets] inserted manifest version: 1.2.1
[publishCloudAssets] verified assets: 41
[publishCloudAssets] done
```

## 错误处理

如果上传失败：
1. 检查凭证文件是否存在
2. 确认网络连接
3. 验证 `manifest.json` 与本地资源是否匹配
