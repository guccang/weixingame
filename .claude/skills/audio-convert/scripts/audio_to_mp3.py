#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
音频格式转换工具
作者: wanxiubin
功能: 将 ogg、wav 音频文件转换为 mp3 格式
"""

import os
import sys
from pathlib import Path


def get_audio_files(path):
    """
    获取目录下所有支持的音频文件
    """
    supported_ext = {'.ogg', '.wav', '.OGG', '.WAV'}
    if Path(path).is_file():
        if Path(path).suffix in supported_ext:
            return [Path(path)]
        return []
    else:
        return [f for f in Path(path).iterdir()
                if f.is_file() and f.suffix in supported_ext]


def convert_to_mp3(input_path, bitrate='192k'):
    """
    将音频文件转换为 mp3 格式

    Args:
        input_path: 输入文件路径
        bitrate: 输出 mp3 比特率

    Returns:
        输出文件的路径
    """
    try:
        from pydub import AudioSegment
    except ImportError:
        raise ImportError(
            "未安装 pydub 库，请先安装: pip install pydub\n"
            "同时需要安装 ffmpeg"
        )

    input_path = Path(input_path)
    output_path = input_path.with_suffix('.mp3')

    # 读取音频文件
    audio = AudioSegment.from_file(str(input_path))

    # 导出为 mp3
    audio.export(str(output_path), format='mp3', bitrate=bitrate)

    return str(output_path)


def process_audio_files(path, bitrate='192k'):
    """
    处理目录中的所有音频文件
    """
    audio_files = get_audio_files(path)

    if not audio_files:
        print(f"未找到 ogg 或 wav 文件: {path}")
        return 0

    processed = 0
    for audio_file in audio_files:
        try:
            output_path = convert_to_mp3(audio_file, bitrate)
            print(f"✓ {audio_file.name} -> {output_path}")
            processed += 1
        except Exception as e:
            print(f"✗ {audio_file.name}: {e}")

    return processed


def main():
    """命令行入口函数"""
    if len(sys.argv) < 2:
        print("使用方法: python audio_to_mp3.py <input_path> [options]")
        print("")
        print("参数:")
        print("  input_path : 输入音频文件或目录")
        print("")
        print("选项:")
        print("  --bitrate N : 设置mp3比特率 (默认 192k)")
        print("")
        print("示例:")
        print("  python audio_to_mp3.py jump.ogg")
        print("  python audio_to_mp3.py audio/")
        print("  python audio_to_mp3.py audio/ --bitrate 320")
        print("")
        print("依赖安装:")
        print("  pip install pydub")
        print("  # macOS: brew install ffmpeg")
        print("  # Ubuntu: sudo apt install ffmpeg")
        sys.exit(1)

    input_path = sys.argv[1]
    bitrate = '192k'

    # 解析参数
    i = 2
    while i < len(sys.argv):
        arg = sys.argv[i]
        if arg == '--bitrate':
            if i + 1 < len(sys.argv):
                bitrate = sys.argv[i + 1] + 'k'
                i += 1
        i += 1

    try:
        input_path_obj = Path(input_path)

        if input_path_obj.is_dir():
            # 处理目录
            print(f"处理目录: {input_path}")
            processed = process_audio_files(input_path, bitrate)
            print(f"\n完成! 共转换 {processed} 个文件")
        else:
            # 处理单个文件
            output_path = convert_to_mp3(input_path, bitrate)
            print(f"转换完成: {output_path}")

    except ImportError as e:
        print(f"错误: {e}")
        sys.exit(1)
    except FileNotFoundError as e:
        print(f"错误: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"错误: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
