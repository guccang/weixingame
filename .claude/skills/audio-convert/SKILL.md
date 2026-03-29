name: audio-convert
description: 将ogg和wav音频文件转换为mp3格式。触发词：音频转换、ogg转mp3、wav转mp3、音频格式转换。
---

# 音频格式转换工具

将 ogg 和 wav 音频文件转换为 mp3 格式。

## 功能特性

- 支持 ogg、wav 格式转换为 mp3
- 批量处理目录中的所有音频文件
- 使用 ffmpeg 进行高质量转换

## 使用方法

```
/audio-convert <路径> [选项]
```

### 参数

| 参数 | 说明 |
|------|------|
| 路径 | 音频文件路径或包含音频文件的目录 |

### 选项

| 选项 | 说明 |
|------|------|
| `--bitrate N` | 设置输出mp3比特率（默认 192k） |

### 示例

```
# 转换单个文件
/audio-convert jump.ogg

# 转换整个目录
/audio-convert audio/

# 指定比特率
/audio-convert audio/ --bitrate 320
```

## 依赖安装

需要安装 ffmpeg 和 pydub：

```bash
# macOS
brew install ffmpeg
pip install pydub

# Ubuntu/Debian
sudo apt install ffmpeg
pip install pydub

# Windows
# 下载 ffmpeg: https://ffmpeg.org/download.html
pip install pydub
```

## 输出规则

- 单文件：同级目录生成同名的 mp3 文件（覆盖原ogg/wav同名文件）
- 目录：覆盖目录中所有匹配的 ogg/wav 文件为 mp3
