---
name: img-compress
description: 图片压缩工具，减小文件大小同时保留图片质量
---

## 说明
调用本地压缩脚本处理图片，支持PNG/JPG/JPEG/WebP格式。

## 使用方式
- `/img-compress` - 高品质，默认路径
- `/img-compress 高` - 高品质，默认路径
- `/img-compress 中` - 中品质，默认路径
- `/img-compress 低` - 低品质，默认路径
- `/img-compress 高 E:\path` - 高品质，指定路径
- `/img-compress 中 E:\path` - 中品质，指定路径
- `/img-compress 低 E:\path` - 低品质，指定路径

## 品质档位

| 档位 | 关键字 | 最大宽度 | JPG质量 | 大图优化 | 说明 |
|-----|-------|---------|--------|---------|------|
| 高 | 高/high | 1920px | 85 | 无 | 保持高清（默认） |
| 中 | 中/medium | 1280px | 70 | 无 | 平衡画质与大小 |
| 低 | 低/low | 800px | 50 | **调色板模式** | 最小文件 |

## 低品质模式特性

**大图优化（超过1MB的PNG）：**
- 自动使用调色板模式（256色）压缩
- 压缩率可达 **80-90%**
- 适合背景图、UI大图等场景
- 示例：1.1MB → 100KB（节省90%）

## 参数解析规则
1. 第一个参数为品质档位：高/high、中/medium、低/low（可选，默认高）
2. 第二个参数为路径（可选，默认当前项目 images 目录）

## 操作步骤
1. 解析参数：品质档位和路径
2. 将中文档位转换为英文：高->high、中->medium、低->low
3. 执行压缩脚本（脚本位于 skill 目录下，使用相对路径）：
   ```bash
   python "./compress_images.py" "路径" -l high/medium/low -r
   ```
4. 显示压缩结果

## 注意事项
- **路径格式**：Windows 路径必须使用正斜杠 `/` 而非反斜杠 `\`，否则 bash 会解析错误
- 示例：`E:/weixingame/images` ✓ 而非 `E:\weixingame\images` ✗
- 调色板模式会减少颜色数到256色，可能有轻微画质损失

## 环境
- Windows系统
- 需要安装 Python 和 Pillow 库
