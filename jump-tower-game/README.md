# 示例游戏

示例相关说明查阅[新手教程](https://developers.weixin.qq.com/minigame/dev/guide/develop/start.html)

## 源码目录介绍

```
├── audio                                      // 音频资源
├── images                                     // 图片资源
├── js
│   ├── base
│   │   ├── animatoin.js                       // 帧动画的简易实现
│   │   ├── pool.js                            // 对象池的简易实现
│   │   └── sprite.js                          // 游戏基本元素精灵类
│   ├── libs
│   │   └── tinyemitter.js                     // 事件监听和触发
│   ├── player
│   │   ├── bullet.js                          // 子弹类
│   │   └── index.js                           // 玩家类
│   ├── runtime
│   │   ├── background.js                      // 背景类
│   │   ├── gameinfo.js                        // 用于展示分数和结算界面
│   │   └── music.js                           // 全局音效管理器
│   ├── main.js                               // 游戏入口主函数
│   └── render.js                             // 基础渲染信息
├── .eslintrc.js                               // 代码规范
├── game.js                                    // 游戏逻辑主入口
├── game.json                                  // 游戏运行时配置
├── project.config.json                        // 项目配置
└── project.private.config.json                // 项目个人配置
```

## 命令行上传体验版

先准备微信 CI 私钥，并通过环境变量或参数传入：

```bash
export WECHAT_CI_PRIVATE_KEY_PATH=/abs/path/to/private.key
```

上传体验版时可以直接输入版本号，也可以命令行传参：

```bash
node scripts/uploadExperience.js --version 1.3.0
```

或：

```bash
npm --prefix scripts run upload-experience -- --version 1.3.0
```

可选参数：

- `--desc` 自定义备注
- `--robot` 指定 CI 机器人编号，默认 `1`
- `--upload-source-map` 开启 sourceMap 上传；默认关闭，避免 4MB 限制

## 项目规则

UI、输入、面板切换和资源模式的项目约束见：

- [docs/technical/ui-input-and-asset-rules.md](/Users/guccang/github_repo/weixingame/jump-tower-game/docs/technical/ui-input-and-asset-rules.md)
