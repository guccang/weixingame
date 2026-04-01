#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
图集批量处理工具
功能: 拆分图集 → AI去背景 → 品质压缩
用法: python split_rembg_compress.py <图片路径> <行数> <列数> [品质]
"""

import os
import sys
import subprocess
import tempfile
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow not found. Install with: pip install Pillow")
    sys.exit(1)

# 检查 rembg
try:
    from rembg import remove
    HAS_REMBG = True
except ImportError:
    HAS_REMBG = False


def remove_background(image_path, output_path=None):
    """使用 rembg 去除背景"""
    if not HAS_REMBG:
        print("Warning: rembg not installed, skipping background removal")
        return False

    try:
        with open(image_path, 'rb') as f:
            input_data = f.read()

        output_data = remove(input_data)

        if output_path is None:
            output_path = image_path

        with open(output_path, 'wb') as f:
            f.write(output_data)
        return True
    except Exception as e:
        print(f"Warning: rembg failed: {e}")
        return False


def compress_images(output_dir, quality='medium'):
    """调用外部压缩脚本"""
    compress_script = Path("F:/ProjFlutter/fitness_tools/compress_images.py")

    if not compress_script.exists():
        print(f"Warning: compress script not found at {compress_script}")
        return False

    try:
        dir_path = str(output_dir).replace('\\', '/')
        result = subprocess.run(
            ['python', str(compress_script), dir_path, '-l', quality, '-r'],
            capture_output=True,
            text=True,
            timeout=300
        )
        return result.returncode == 0
    except Exception as e:
        print(f"Warning: compress failed: {e}")
        return False


def split_and_process(input_path, rows, cols, quality='medium'):
    """
    拆分图集 → 去背景 → 压缩

    Args:
        input_path: 输入图集路径
        rows: 行数
        cols: 列数
        quality: 压缩品质 (high/medium/low)
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"输入文件不存在: {input_path}")

    if rows <= 0 or cols <= 0:
        raise ValueError("行数和列数必须大于0")

    # 设置输出目录
    base_name = Path(input_path).stem
    output_dir = Path(input_path).parent / f"_{base_name}_split"
    output_dir.mkdir(parents=True, exist_ok=True)

    # 打开图片
    img = Image.open(input_path)
    width, height = img.size

    # 计算每个图标的尺寸
    icon_width = width // cols
    icon_height = height // rows

    if icon_width == 0 or icon_height == 0:
        raise ValueError(f"图片尺寸不足以裁切为{rows}行{cols}列")

    print(f"输入: {input_path}")
    print(f"尺寸: {width}x{height}")
    print(f"拆分: {rows}行 x {cols}列 = {rows * cols}张")
    print(f"品质: {quality}")
    print(f"输出: {output_dir}")
    print("-" * 40)

    total = rows * cols
    success = 0

    for row in range(rows):
        for col in range(cols):
            # 计算裁切区域
            left = col * icon_width
            upper = row * icon_height
            right = left + icon_width
            lower = upper + icon_height

            # 裁切
            icon = img.crop((left, upper, right, lower))

            if icon.mode != 'RGBA':
                icon = icon.convert('RGBA')

            # 生成输出文件名
            output_name = f"icon_{row}_{col}.png"
            output_path = output_dir / output_name

            # Step 1: 保存临时文件用于去背景
            temp_path = output_dir / f"_temp_{output_name}"
            icon.save(temp_path, 'PNG')

            # Step 2: rembg 去背景
            if HAS_REMBG:
                remove_background(str(temp_path), str(temp_path))

            # Step 3: 压缩
            if quality != 'none':
                try:
                    img_to_compress = Image.open(temp_path)
                    max_widths = {'high': 1920, 'medium': 1280, 'low': 800}
                    max_width = max_widths.get(quality, 1280)

                    if img_to_compress.width > max_width:
                        ratio = max_width / img_to_compress.width
                        new_height = int(img_to_compress.height * ratio)
                        img_to_compress = img_to_compress.resize(
                            (max_width, new_height), Image.LANCZOS
                        )

                    img_to_compress.save(temp_path, 'PNG', optimize=True)
                except Exception as e:
                    print(f"  compress warning: {e}")

            # 移动到最终位置
            temp_path.rename(output_path)
            success += 1

            print(f"  [{success}/{total}] {output_name}")

    print("-" * 40)
    print(f"完成! 成功处理 {success}/{total} 张图片")

    return output_dir


def main():
    if len(sys.argv) < 4:
        print("图集批量处理工具")
        print("")
        print("用法: python split_rembg_compress.py <图片路径> <行数> <列数> [品质]")
        print("")
        print("示例:")
        print("  python split_rembg_compress.py atlas.png 2 2 中")
        print("  python split_rembg_compress.py sprite.png 3 4 高")
        print("  python split_rembg_compress.py icons.png 2 3 低")
        sys.exit(1)

    input_path = sys.argv[1]
    rows = int(sys.argv[2])
    cols = int(sys.argv[3])
    quality = sys.argv[4] if len(sys.argv) > 4 else 'medium'

    # 转换中文品质
    quality_map = {'高': 'high', '中': 'medium', '低': 'low', 'high': 'high', 'medium': 'medium', 'low': 'low'}
    quality = quality_map.get(quality, 'medium')

    try:
        output_dir = split_and_process(input_path, rows, cols, quality)
        print(f"\n输出目录: {output_dir}")
    except Exception as e:
        print(f"错误: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()