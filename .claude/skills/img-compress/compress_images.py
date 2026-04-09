# -*- coding: utf-8 -*-
"""
图片压缩脚本
开发者: wanxiubin
功能: 压缩PNG/JPG图片，支持路径配置、递归处理和品质档位
"""

import os
import argparse
from PIL import Image
from pathlib import Path

# ==================== 配置区域 ====================
# 默认配置，可通过命令行参数覆盖

# 默认路径（当前目录）
DEFAULT_PATHS = ["."]

# 支持的图片格式
SUPPORTED_FORMATS = ["*.png", "*.jpg", "*.jpeg", "*.webp"]

# 大图阈值（超过此大小使用调色板模式压缩）
LARGE_IMAGE_THRESHOLD = 1 * 1024 * 1024  # 1MB

# 品质档位配置
QUALITY_LEVELS = {
    "high": {
        "name": "高",
        "quality": 85,
        "max_width": 1920,
        "description": "保持高清，文件较大"
    },
    "medium": {
        "name": "中",
        "quality": 70,
        "max_width": 1280,
        "description": "平衡画质与大小"
    },
    "low": {
        "name": "低",
        "quality": 50,
        "max_width": 800,
        "description": "最小文件，大图使用调色板模式"
    }
}

DEFAULT_LEVEL = "high"
DEFAULT_RECURSIVE = True

# ==================== 功能实现 ====================


def compress_png_palette(img, output_path):
    """
    使用调色板模式压缩PNG（适合大图，压缩率极高）
    """
    # 转换为调色板模式
    if img.mode == 'RGBA' or img.mode == 'RGB':
        img_p = img.convert('P', palette=Image.ADAPTIVE, colors=256)
    else:
        img_p = img.convert('P', palette=Image.ADAPTIVE, colors=256)

    img_p.save(output_path, 'PNG', optimize=True)


def compress_image(input_path, output_path=None, quality=85, max_width=1920, level_name="", use_palette_for_large=False):
    """
    压缩单张图片
    """
    if output_path is None:
        output_path = input_path

    original_size = os.path.getsize(input_path)
    is_large_png = (original_size > LARGE_IMAGE_THRESHOLD and
                    input_path.lower().endswith('.png') and
                    use_palette_for_large)

    with Image.open(input_path) as img:
        width, height = img.size

        # 如果是大图PNG且启用调色板模式，直接使用调色板压缩（不缩放）
        if is_large_png:
            print(f"  尺寸: {width}x{height} (大图调色板模式)")
            compress_png_palette(img, output_path)
        else:
            # 如果宽度超过最大值，等比缩放
            if width > max_width:
                ratio = max_width / width
                new_width = max_width
                new_height = int(height * ratio)
                # 低品质使用更快的缩放算法
                resample = Image.BILINEAR if quality <= 50 else Image.LANCZOS
                img = img.resize((new_width, new_height), resample)
                print(f"  尺寸: {width}x{height} -> {new_width}x{new_height}")
            else:
                print(f"  尺寸: {width}x{height} (无需缩放)")

            # 保存压缩后的图片
            ext = os.path.splitext(input_path)[1].lower()
            if ext == '.png':
                # PNG使用压缩级别
                compress_level = 9 if quality <= 70 else 6
                img.save(output_path, 'PNG', optimize=True, compress_level=compress_level)
            elif ext in ['.jpg', '.jpeg']:
                img.save(output_path, 'JPEG', quality=quality, optimize=True)
            elif ext == '.webp':
                img.save(output_path, 'WEBP', quality=quality)
            else:
                img.save(output_path, optimize=True)

    new_size = os.path.getsize(output_path)
    reduction = (1 - new_size / original_size) * 100

    return original_size, new_size, reduction


def collect_images(directory, patterns, recursive=True):
    """
    收集目录下所有匹配的图片文件
    """
    dir_path = Path(directory)
    image_files = []

    if recursive:
        for pattern in patterns:
            image_files.extend(dir_path.rglob(pattern))
    else:
        for pattern in patterns:
            image_files.extend(dir_path.glob(pattern))

    # 去重并排序
    return sorted(set(image_files))


def compress_directory(directory, patterns, quality=85, max_width=1920, recursive=True, level_name="", use_palette_for_large=False):
    """
    压缩目录下所有匹配的图片
    """
    image_files = collect_images(directory, patterns, recursive)

    if not image_files:
        print(f"  未找到匹配的图片文件")
        return 0, 0

    total_original = 0
    total_new = 0
    success_count = 0

    for img_path in image_files:
        # 显示相对路径
        try:
            rel_path = img_path.relative_to(directory)
            print(f"  [{success_count + 1}] {rel_path}")
        except:
            print(f"  [{success_count + 1}] {img_path.name}")

        try:
            original, new, reduction = compress_image(
                str(img_path),
                quality=quality,
                max_width=max_width,
                level_name=level_name,
                use_palette_for_large=use_palette_for_large
            )
            total_original += original
            total_new += new
            success_count += 1

            original_kb = original / 1024
            new_kb = new / 1024
            print(f"      {original_kb:.1f}KB -> {new_kb:.1f}KB (-{reduction:.1f}%)")
        except Exception as e:
            print(f"      错误: {e}")

    return total_original, total_new


def compress_paths(paths, patterns, quality=85, max_width=1920, recursive=True, level_name="", use_palette_for_large=False):
    """
    批量压缩多个路径
    """
    grand_original = 0
    grand_new = 0

    for path in paths:
        if not os.path.exists(path):
            print(f"路径不存在: {path}")
            continue

        print(f"\n{'='*60}")
        print(f"目录: {path}")
        print(f"品质: {level_name}")
        print(f"递归: {'是' if recursive else '否'}")
        print(f"{'='*60}")

        original, new = compress_directory(
            path, patterns, quality, max_width, recursive, level_name, use_palette_for_large
        )
        grand_original += original
        grand_new += new

    return grand_original, grand_new


def main():
    parser = argparse.ArgumentParser(description='图片压缩工具')
    parser.add_argument('paths', nargs='*', help='目标路径列表')
    parser.add_argument('-l', '--level', choices=['high', 'medium', 'low'],
                        default=DEFAULT_LEVEL, help='品质档位: high/medium/low (默认: high)')
    parser.add_argument('-r', '--recursive', action='store_true', default=None,
                        help='递归处理子目录')
    parser.add_argument('-nr', '--no-recursive', action='store_true',
                        help='不递归处理子目录')

    args = parser.parse_args()

    # 确定路径
    paths = args.paths if args.paths else DEFAULT_PATHS

    # 确定是否递归
    if args.no_recursive:
        recursive = False
    elif args.recursive:
        recursive = True
    else:
        recursive = DEFAULT_RECURSIVE

    # 获取品质档位配置
    level_config = QUALITY_LEVELS[args.level]
    quality = level_config["quality"]
    max_width = level_config["max_width"]
    level_name = f"{level_config['name']}({args.level})"

    # 低品质模式启用大图调色板压缩
    use_palette_for_large = (args.level == 'low')

    print("=" * 60)
    print("图片压缩工具")
    print("=" * 60)
    print(f"目标路径数: {len(paths)}")
    print(f"品质档位: {level_name} - {level_config['description']}")
    print(f"JPG质量: {quality}")
    print(f"最大宽度: {max_width}px")
    print(f"递归模式: {'是' if recursive else '否'}")
    if use_palette_for_large:
        print(f"大图优化: 超过1MB使用调色板模式 (256色)")
    print("=" * 60)

    grand_original, grand_new = compress_paths(
        paths,
        SUPPORTED_FORMATS,
        quality,
        max_width,
        recursive,
        level_name,
        use_palette_for_large
    )

    # 打印总计
    if grand_original > 0:
        total_reduction = (1 - grand_new / grand_original) * 100
        print(f"\n{'='*60}")
        print("总计")
        print(f"{'='*60}")
        print(f"原始大小: {grand_original/1024:.1f}KB ({grand_original/1024/1024:.2f}MB)")
        print(f"压缩后:   {grand_new/1024:.1f}KB ({grand_new/1024/1024:.2f}MB)")
        print(f"节省空间: {(grand_original-grand_new)/1024:.1f}KB")
        print(f"压缩比例: {total_reduction:.1f}%")
        print("=" * 60)


if __name__ == "__main__":
    main()
