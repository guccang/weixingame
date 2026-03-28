---
name: img-compress
description: 图片压缩工具，减小文件大小同时保留图片质量
---

## 说明
调用 fitness_tools 目录下的压缩脚本处理图片，支持PNG/JPG/JPEG/WebP格式。

## 使用方式
- `/img-compress` - 高品质，默认路径
- `/img-compress 高` - 高品质，默认路径
- `/img-compress 中` - 中品质，默认路径
- `/img-compress 低` - 低品质，默认路径
- `/img-compress 高 F:\path` - 高品质，指定路径
- `/img-compress 中 F:\path` - 中品质，指定路径
- `/img-compress 低 F:\path` - 低品质，指定路径

## 品质档位

| 档位 | 关键字 | 最大宽度 | JPG质量 | 说明 |
|-----|-------|---------|--------|------|
| 高 | 高/high | 1920px | 85 | 保持高清（默认） |
| 中 | 中/medium | 1280px | 70 | 平衡画质与大小 |
| 低 | 低/low | 800px | 50 | 最小文件 |

## 参数解析规则
1. 第一个参数为品质档位：高/high、中/medium、低/low（可选，默认高）
2. 第二个参数为路径（可选，默认 `F:\ProjFlutter\fitness\assets\images`）

## 操作步骤
1. 解析参数：品质档位和路径
2. 将中文档位转换为英文：高->high、中->medium、低->low
3. 执行压缩脚本（注意：路径必须使用正斜杠 `/` 格式）：
   ```bash
   python "F:/ProjFlutter/fitness_tools/compress_images.py" "路径" -l high/medium/low -r
   ```
4. 显示压缩结果

## 注意事项
- **路径格式**：Windows 路径必须使用正斜杠 `/` 而非反斜杠 `\`，否则 bash 会解析错误
- 示例：`F:/ProjFlutter/fitness/assets/images` ✓ 而非 `F:\ProjFlutter\fitness\assets\images` ✗

## 环境
- Windows系统
- 需要安装 Python 和 Pillow 库
