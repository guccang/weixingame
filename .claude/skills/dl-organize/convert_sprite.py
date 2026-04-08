#!/usr/bin/env python3
"""
序列帧图片规格转换工具
将指定目录下所有PNG图片统一转换为指定尺寸 RGBA 格式

用法:
  python convert_sprite.py <目标目录> [尺寸]
  尺寸格式: WxH 或 N（正方形），默认 128

示例:
  python convert_sprite.py D:/GitWechatGame/jump-tower-game/images/_temp
  python convert_sprite.py D:/GitWechatGame/jump-tower-game/images/_temp 256
  python convert_sprite.py D:/GitWechatGame/jump-tower-game/images/_temp 256x128
"""

import sys
import os
import glob
from PIL import Image

TARGET_MODE = "RGBA"


def parse_size(size_str):
    """解析尺寸字符串，支持 '128', '256x256', '256x128' 等格式"""
    if "x" in size_str:
        w, h = size_str.split("x", 1)
        return (int(w), int(h))
    else:
        n = int(size_str)
        return (n, n)


def convert_directory(dir_path, target_size):
    """递归转换目录下所有PNG图片为统一规格"""
    if not os.path.isdir(dir_path):
        print(f"错误: 目录不存在 - {dir_path}")
        return

    png_files = glob.glob(os.path.join(dir_path, "**/*.png"), recursive=True)
    if not png_files:
        print(f"未找到PNG文件 - {dir_path}")
        return

    changed = 0
    skipped = 0

    for f in sorted(png_files):
        img = Image.open(f)
        needs_convert = False

        if img.mode != TARGET_MODE:
            img = img.convert(TARGET_MODE)
            needs_convert = True

        if img.size != target_size:
            img = img.resize(target_size, Image.LANCZOS)
            needs_convert = True

        if needs_convert:
            img.save(f, "PNG")
            changed += 1
            print(f"  转换: {os.path.relpath(f, dir_path)}")
        else:
            skipped += 1

    print(f"\n完成: 共 {changed + skipped} 张, 转换 {changed} 张, 跳过 {skipped} 张")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: python convert_sprite.py <目标目录> [尺寸]")
        print("尺寸格式: WxH 或 N（正方形），默认 128")
        sys.exit(1)

    target_dir = sys.argv[1]
    size_str = sys.argv[2] if len(sys.argv) > 2 else "128"
    target_size = parse_size(size_str)

    print(f"目标规格: {target_size[0]}x{target_size[1]} {TARGET_MODE}")
    print(f"处理目录: {target_dir}\n")
    convert_directory(target_dir, target_size)
