#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
图标自动裁切工具
作者: wanxiubin
功能: 根据行列数自动裁切图标图片,输出PNG格式
"""

import os
import sys
from PIL import Image


def split_icons(input_path, rows, cols, output_dir=None):
    """
    根据行列数自动裁切图标

    Args:
        input_path: 输入图片路径
        rows: 行数
        cols: 列数
        output_dir: 输出目录,如果为None则在输入文件同目录下创建

    Returns:
        输出文件路径列表
    """
    # 检查输入文件是否存在
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"输入文件不存在: {input_path}")

    # 检查行列数是否有效
    if rows <= 0 or cols <= 0:
        raise ValueError("行数和列数必须大于0")

    # 打开图片
    img = Image.open(input_path)

    # 获取图片尺寸
    width, height = img.size

    # 计算每个图标的尺寸
    icon_width = width // cols
    icon_height = height // rows

    if icon_width == 0 or icon_height == 0:
        raise ValueError(f"图片尺寸不足以裁切为{rows}行{cols}列")

    # 如果没有指定输出目录,在输入文件同目录下创建
    if output_dir is None:
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        dir_name = os.path.dirname(input_path)
        output_dir = os.path.join(dir_name, f"{base_name}_icons")

    # 创建输出目录
    os.makedirs(output_dir, exist_ok=True)

    output_files = []

    # 裁切图片
    for row in range(rows):
        for col in range(cols):
            # 计算裁切区域
            left = col * icon_width
            upper = row * icon_height
            right = left + icon_width
            lower = upper + icon_height

            # 裁切
            icon = img.crop((left, upper, right, lower))

            # 转换为RGBA模式
            if icon.mode != 'RGBA':
                icon = icon.convert('RGBA')

            # 生成输出文件名
            output_name = f"icon_{row}_{col}.png"
            output_path = os.path.join(output_dir, output_name)

            # 保存
            icon.save(output_path, 'PNG')
            output_files.append(output_path)

    return output_files


def main():
    """命令行入口函数"""
    if len(sys.argv) < 4:
        print("使用方法: python split_icons.py <input_image> <rows> <cols> [output_dir]")
        print("  input_image: 输入图片路径")
        print("  rows: 行数")
        print("  cols: 列数")
        print("  output_dir: 输出目录(可选,默认在输入文件同目录下创建icons文件夹)")
        sys.exit(1)

    input_path = sys.argv[1]
    rows = int(sys.argv[2])
    cols = int(sys.argv[3])
    output_dir = sys.argv[4] if len(sys.argv) > 4 else None

    try:
        output_files = split_icons(input_path, rows, cols, output_dir)
        print(f"处理完成! 共生成 {len(output_files)} 个图标文件:")
        for file_path in output_files:
            print(f"  - {file_path}")
    except Exception as e:
        print(f"错误: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
