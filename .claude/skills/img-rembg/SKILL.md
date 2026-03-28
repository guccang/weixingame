name: img-rembg
description: 智能去除图片背景，支持 AI 模式（rembg）和简单阈值模式。触发词：去背景、去除背景、透明背景、remove background、抠图、去白底。
---

# 图片去背景工具

智能去除图片背景，输出透明背景的 PNG 图片。

## 功能特性

- **AI 模式**：使用 rembg + U2-Net 深度学习模型，智能识别主体，边缘平滑无毛刺（推荐）
- **简单模式**：阈值法去除白色背景，适用于纯白背景的简单图片
- **自动选择**：默认优先使用 AI 模式，未安装 rembg 时自动降级到简单模式

## 使用方法

```
/img-rembg <图片路径> [选项]
```

### 选项

| 选项 | 说明 |
|------|------|
| `--ai` | 强制使用 AI 模式（需要安装 rembg） |
| `--simple` | 使用简单模式（阈值法） |
| `--threshold N` | 设置白色阈值（0-255，默认 240，仅简单模式） |

### 示例

```
# AI 模式去背景（推荐）
/img-rembg logo.png --ai

# 简单模式
/img-rembg logo.png --simple

# 调整阈值
/img-rembg logo.png --simple --threshold 220
```

## 依赖安装

AI 模式需要安装 rembg：

```bash
pip install "rembg[cpu]"
```

首次使用 AI 模式会自动下载模型文件（约 176MB）。
