# JSON布局系统设计方案

## 概述

将现有硬编码的UI布局改为JSON配置方式，支持多种布局方式和锚点系统。

## 设计决策

| 决策项 | 选择 |
|--------|------|
| 布局方式 | 多种布局支持（固定、相对、Flex） |
| 配置粒度 | 分层配置（布局+样式在JSON，文本/图片走资源文件） |
| 文件组织 | 按界面分文件 |
| 响应式 | 锚点系统 |
| 实现方案 | 轻量布局引擎 |

## 文件结构

```
jump-tower-game/
├── layouts/
│   ├── startScreen.json      # 开始界面
│   ├── shopPanel.json        # 商店面板
│   ├── modeSelect.json       # 模式选择
│   ├── achievementPanel.json # 成就面板
│   └── components/           # 可复用组件模板
│       ├── button.json
│       └── panel.json
├── js/layout/
│   ├── layoutEngine.js      # 布局引擎核心
│   ├── layoutLoader.js      # JSON配置加载器
│   └── layoutResolver.js    # 布局解析器
```

## 配置结构

### 基础元素配置

```json
{
  "id": "startScreen",
  "vars": {
    "primaryColor": "#00d084",
    "iconSize": 50
  },
  "elements": [
    {
      "id": "title",
      "type": "text",
      "anchor": { "x": "center", "y": "center" },
      "offset": { "x": 0, "y": -120 },
      "style": {
        "color": "#ffdd57",
        "fontSize": 36,
        "fontWeight": "bold",
        "shadow": { "color": "#ffaa00", "blur": 20 }
      },
      "textKey": "GAME_TITLE"
    },
    {
      "id": "startBtn",
      "type": "button",
      "anchor": { "x": "center", "y": "center" },
      "offset": { "x": 0, "y": 200 },
      "size": { "width": 140, "height": 50 },
      "style": {
        "bgColor": "#00d084",
        "borderRadius": 25,
        "shadow": { "color": "#00d084", "blur": 15 }
      },
      "textKey": "START_BUTTON"
    }
  ]
}
```

### 锚点系统

- **x轴**: `left` | `center` | `right`
- **y轴**: `top` | `center` | `bottom`

### 尺寸支持

- 固定值: `{ "width": 140, "height": 50 }`
- 百分比: `{ "width": "80%", "height": "50%" }`
- 混合: `{ "width": "80%", "height": 50 }`
- 变量引用: `{ "width": "${iconSize}", "height": "${iconSize}" }`

### Flex布局

```json
{
  "id": "bottomBar",
  "type": "flex",
  "anchor": { "x": "center", "y": "bottom" },
  "offset": { "x": 0, "y": -100 },
  "flex": {
    "direction": "row",
    "gap": 0,
    "justify": "space-between",
    "align": "center"
  },
  "size": { "width": "100%", "height": 50 },
  "children": [
    { "id": "shop", "type": "iconButton", "size": { "width": 50, "height": 50 } },
    { "id": "character", "type": "iconButton", "size": { "width": 50, "height": 50 } },
    { "id": "mode", "type": "iconButton", "size": { "width": 50, "height": 50 } },
    { "id": "achievement", "type": "iconButton", "size": { "width": 50, "height": 50 } },
    { "id": "leaderboard", "type": "iconButton", "size": { "width": 50, "height": 50 } }
  ]
}
```

**Flex属性**:

| 属性 | 值 | 说明 |
|------|-----|------|
| direction | `row` / `column` | 排列方向 |
| gap | 数字或百分比 | 元素间距 |
| justify | `start` / `center` / `end` / `space-between` / `space-around` | 主轴对齐 |
| align | `start` / `center` / `end` / `stretch` | 交叉轴对齐 |
| wrap | `nowrap` / `wrap` | 是否换行 |

### 组件模板

**定义模板** (`components/button.json`):
```json
{
  "id": "primaryButton",
  "type": "template",
  "props": {
    "size": { "width": 140, "height": 50 },
    "style": {
      "bgColor": "#00d084",
      "borderRadius": 25,
      "textColor": "#ffffff"
    }
  }
}
```

**使用模板**:
```json
{
  "id": "startBtn",
  "template": "primaryButton",
  "anchor": { "x": "center", "y": "center" },
  "textKey": "START_BUTTON",
  "override": {
    "style": { "bgColor": "#ff6b6b" }
  }
}
```

### 条件显示

```json
{
  "id": "startBtn",
  "visibleWhen": "!panelManager.isAnyOpen()"
}
```

## 布局引擎API

```javascript
class LayoutEngine {
  constructor() {
    this.layouts = {};      // 缓存加载的布局配置
    this.components = {};   // 组件模板
  }

  // 加载布局配置
  loadLayout(id, config) { ... }

  // 计算元素实际位置
  calculateBounds(element, containerWidth, containerHeight) { ... }

  // 解析整个界面
  resolveLayout(layoutId, W, H) { ... }

  // 支持Flex布局
  resolveFlexLayout(elements, container, direction, gap, align) { ... }
}
```

### 锚点计算逻辑

```javascript
_calculateAnchorPoint(anchor, W, H, size) {
  let baseX = 0, baseY = 0;

  // X锚点
  if (anchor.x === 'center') baseX = (W - size.width) / 2;
  else if (anchor.x === 'right') baseX = W - size.width;
  // 'left' 默认为 0

  // Y锚点
  if (anchor.y === 'center') baseY = (H - size.height) / 2;
  else if (anchor.y === 'bottom') baseY = H - size.height;
  // 'top' 默认为 0

  return { x: baseX, y: baseY };
}
```

## 集成方式

### 初始化

```javascript
// bootstrap.js 或 game.js
const layoutEngine = new LayoutEngine();
layoutEngine.loadLayout('startScreen', require('../layouts/startScreen.json'));
game.layoutEngine = layoutEngine;
```

### 绘制流程

```javascript
function drawStartScreen(ctx, game, images, characterConfig, jobConfig) {
  const { W, H } = game;

  // 从布局引擎获取元素位置
  const layout = game.layoutEngine.resolveLayout('startScreen', W, H);

  // 使用布局配置绘制
  const titleEl = layout.elements.title;
  ctx.fillStyle = titleEl.style.color;
  ctx.fillText(getText(titleEl.textKey), titleEl.bounds.x, titleEl.bounds.y);

  // 点击区域自动绑定
  game.startBtnArea = layout.elements.startBtn.bounds;
}
```

## 迁移计划

1. 创建布局引擎核心代码
2. 创建 `layouts/` 目录和配置文件
3. 逐步迁移各界面（从 `startScreen` 开始）
4. 保留原有代码作为回退

## 元素类型

| 类型 | 说明 |
|------|------|
| text | 文本元素 |
| button | 按钮 |
| image | 图片 |
| panel | 面板容器 |
| flex | Flex布局容器 |
| iconButton | 图标按钮 |

## 样式属性

| 属性 | 类型 | 说明 |
|------|------|------|
| color | string | 文字颜色 |
| bgColor | string | 背景颜色 |
| fontSize | number | 字体大小 |
| fontWeight | string | 字体粗细 |
| borderRadius | number | 圆角半径 |
| shadow | object | 阴影 { color, blur } |
| borderColor | string | 边框颜色 |
| borderWidth | number | 边框宽度 |
