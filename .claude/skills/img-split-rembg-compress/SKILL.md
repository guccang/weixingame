---
name: img-split-rembg-compress
description: 图集批量处理工具，一键完成拆分、去背景、压缩。触发词：拆分去背景压缩、split remove compress、2 2 中、3 3 高。当需要处理图集（sprite sheet）并输出带透明背景的独立图标时使用此技能。
---

# 图集批量处理工具

一键完成：图集拆分 → AI去背景 → 品质压缩

## 使用方法

```
/img-batch <图片路径> <行数> <列数> [品质]
```

### 参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `图片路径` | 输入图集路径 | 必需 |
| `行数` | 拆分行数 | 必需 |
| `列数` | 拆分列数 | 必需 |
| `品质` | 压缩品质：高/中/低 | 中 |

### 品质档位

| 档位 | 关键字 | 最大宽度 | JPG质量 |
|-----|-------|---------|--------|
| 高 | 高/high | 1920px | 85 |
| 中 | 中/medium | 1280px | 70 |
| 低 | 低/low | 800px | 50 |

### 示例

```
# 2行2列，中品质压缩
/img-batch atlas.png 2 2 中

# 3行4列，高品质压缩
/img-batch sprite.png 3 4 高

# 2行3列，低品质压缩
/img-batch icons.png 2 3 低
```

## 处理流程

1. **拆分** - 按行列数将图集裁切为独立图片
2. **去背景** - 使用 rembg AI 智能去背景（默认开启）
3. **压缩** - 按指定品质压缩输出

## 输出

- 输出目录：输入文件同目录下的 `_<原文件名>_split` 文件夹
- 文件命名：`icon_<行号>_<列号>.png`
- 透明背景：PNG 格式保留 Alpha 通道

## 依赖

- `rembg` - AI 去背景（pip install "rembg[cpu]"）
- `Pillow` - 图片处理（pip install Pillow）
- `F:/ProjFlutter/fitness_tools/compress_images.py` - 压缩脚本