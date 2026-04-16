# UI、输入与资源模式规则

这份规则用于约束开始界面、底部导航、面板切换、触摸输入和资源模式切换，避免再次出现今天修复过的同类问题。

适用范围：

- `js/controls/controls.js`
- `js/ui/mainUI.js`
- `js/ui/panelManager.js`
- `js/drawer/startScreen.js`
- `js/drawer/characterSelect.js`
- `js/resource/envConfig.js`
- `project.config.json`

## 1. 单次手势只允许触发一次 UI 点击

规则：

- 开始界面和结算界面的按钮点击，必须保证同一手势只处理一次。
- 不允许在 `touchstart`、`touchmove`、`touchend` 中对同一个 UI 点击重复调用 `handleTouch()`。
- 如果某次手势已经在 `touchstart` 成功命中 UI，后续 `touchmove` 和 `touchend` 不能再次切换同一个面板。

原因：

- 手机上的一次点击手势常常会带有细小的 move/end 事件。
- 如果 `touchstart` 已经打开/关闭面板，`touchmove` 或 `touchend` 再次处理会导致面板闪烁。

当前实现：

- `js/controls/controls.js` 使用 `startUiTouchHandled` 防重复触发。

新增代码时要求：

- 如果往开始界面再加新的点击入口，必须复用现有的单手势消费逻辑，不要绕开它直接在 `touchend` 再做一次按钮处理。

## 2. 底部导航按钮必须支持 toggle

规则：

- 底部导航按钮点击同一个按钮时，行为必须是：
  - 未打开 -> 打开对应面板
  - 已打开 -> 关闭对应面板
- 不允许同一个按钮只能打开不能关闭。

原因：

- 手机单手操作时，用户预期底部导航是开关，不是单向跳转。

当前实现：

- `js/ui/mainUI.js` 中 `open-panel` 和 `open-debug-panel` 都走 `_togglePanel(panelKey)`。

新增代码时要求：

- 新底部按钮不要直接写死 `pm.open(...)`。
- 统一通过 `open-panel` 或专门的 toggle 分支接入。

## 3. 面板状态必须先在 UIPanelManager 中注册

规则：

- 新增面板前，必须先在 `js/ui/panelManager.js` 的 `panels` 里注册状态位。
- 如果该面板来自底部图标，也必须在 `openFromIcon()` 映射中补上。

原因：

- 未注册的 panel key 会导致高亮、关闭、fallback、toggle 行为不一致。

必须同时检查：

- `panels` 状态表
- `openFromIcon()` 映射
- `js/drawer/startScreen.js` 的绘制分支
- `js/ui/mainUI.js` 的 fallback 关闭逻辑

## 4. 开始界面的面板必须形成完整闭环

规则：

- 新增一个面板时，至少要同时完成下面四件事：
  - 底部按钮 action 指向正确 panel key
  - `drawStartScreen()` 有对应绘制分支
  - 面板内部有关闭入口
  - `mainUI._handleFallbackTouch()` 能正确关闭它

原因：

- 只接 action 不接绘制分支，会显示错误内容或落到默认界面。
- 只接绘制不接 fallback，会导致面板无法关闭或关闭异常。

## 5. 面板数据源必须与按钮语义一致

规则：

- 角色按钮只能显示角色数据。
- 宠物按钮只能显示宠物数据。
- 道具/背包按钮只能显示道具数据。
- 不允许为了复用 UI 结构而直接复用错误的数据源。

原因：

- 这类错误表面上是“面板打开了”，本质上是路由或数据绑定错了。

当前约束：

- 角色面板使用 `progressionSystem.getCharacterCatalog()`
- 宠物面板使用 `progressionSystem.getPetCatalog()`
- 商店 tab 面板使用 `progressionSystem.getShopCatalogByTab()`

新增代码时要求：

- 先确认按钮语义，再确认数据函数，不要只复用 `getShopEntryMeta()` 就忽略数据来源。

## 6. 布局源必须明确，避免 JSON 和 JS 配置分叉

规则：

- 开始界面真正运行时使用的是 `layouts/startScreen.json`。
- `js/layout/configs/startScreenLayout.js` 只能视为备用或旧配置，不能假设它一定生效。

原因：

- 如果只改 JS 布局配置，不改 JSON，运行时界面不会更新。
- 今天宠物按钮的一个问题就来自布局源分叉。

新增代码时要求：

- 修改开始界面按钮、底栏、panel action 时，优先检查 `layouts/startScreen.json`。
- 如果保留 JS 配置文件，修改时必须确保两边一致，或明确删掉不用的旧配置。

## 7. 浮层面板不要整屏吞掉底部导航

规则：

- 开始界面的浮层面板如果允许底部导航继续可用，面板点击热区不能覆盖整个屏幕。
- 面板应只注册自身可见区域，底部导航区域要留出操作空间。

原因：

- 全屏 `consume` 会把底部导航吃掉，导致用户无法直接从一个功能面板切到另一个。

当前实现：

- 角色面板改成了卡片式浮层，并为底部导航预留空间。

新增代码时要求：

- 如果希望底部导航仍可点，panel 注册区域只能是浮层本体。
- 如果希望整屏模态，就不要要求底部导航继续工作，这两者不能混用。

## 8. consume 面板如果仍需内部 fallback 点击，必须支持 passThrough

规则：

- 如果某个面板注册了 `consume: true`，但内部点击还要走 `mainUI` fallback 逻辑，那么必须显式标记可透传。

原因：

- 否则最上层 panel entry 会把触摸吞掉，底层角色卡或列表项点击根本到不了。

当前实现：

- `js/ui/mainUI.js` 支持 `meta.passThrough`
- 角色面板使用 `consume: true, passThrough: true`

新增代码时要求：

- 只有在确实需要“阻止点穿到底层界面，但允许本面板内部 fallback 继续工作”时才使用 `passThrough`。

## 9. 资源模式按环境自动切换，不靠手改代码

规则：

- 开发者工具本地运行：`local`
- 真机调试、体验版、正式版：`cloud`
- 手动覆盖只作为调试手段，不能作为日常流程

当前实现：

- `js/resource/envConfig.js`
  - `develop + devtools -> local`
  - `develop + 真机 -> cloud`
  - `trial/release -> cloud`

原因：

- 本地开发需要直接读工作区资源。
- 真机调试和上传有包体限制，不能依赖大资源进包。

## 10. 打包模式切换只能用脚本，不手改 project.config.json

规则：

- 不要直接手改 `project.config.json` 里的 `packOptions.ignore`。
- 一律通过脚本切换：

```bash
./debug-local
./debug-device
```

或：

```bash
npm --prefix scripts run pack-mode:local
npm --prefix scripts run pack-mode:cloud
```

原因：

- 手改最容易漏改、错改、忘改回。
- 本地开发和真机上传对 `images/audio` 是否进包的要求相反。

当前实现：

- `scripts/setProjectPackMode.js`
- 根目录快捷命令 `debug-local` / `debug-device`
- skill: `switch-wechat-asset-mode`

## 11. 真机调试不要依赖本地大资源进包

规则：

- 真机调试如果包体受限，必须走云资源。
- 不要试图让 10MB+ 的图片音频继续走本地调试包。

原因：

- 包体限制是工具/平台边界，不是代码里再套一层 fallback 能解决的。

## 12. 修改这几个区域时的最小检查清单

每次改下面这些内容时，提交前至少自查一遍：

- 底部按钮 action 是否指向正确 panel key
- `panelManager` 是否注册了该面板
- `drawStartScreen()` 是否有正确绘制分支
- fallback 关闭逻辑是否补齐
- 是否会在同一手势中重复触发 UI 点击
- 面板点击热区是否错误覆盖到底部导航
- 数据源函数是否与按钮语义匹配
- 运行时真正使用的是 JSON 布局还是 JS 布局
- 本地/真机资源模式是否符合当前调试目标

## 13. 推荐开发流程

本地模拟器开发：

```bash
./debug-local
```

真机调试或上传前：

```bash
./debug-device
```

修改开始界面按钮或面板后：

1. 先在开发者工具里验证打开/关闭
2. 再在手机上验证同一手势不会闪烁
3. 再验证目标面板展示的是正确数据源
