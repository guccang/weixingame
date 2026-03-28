#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
去除图片背景工具
作者: wanxiubin
功能: 使用 AI 模型智能去除图片背景，支持多种方法
"""

import os
import sys
from pathlib import Path

# 检查是否安装了 rembg
try:
    from rembg import remove
    HAS_REMBG = True
except ImportError:
    HAS_REMBG = False

from PIL import Image, ImageFilter

# 支持的图片格式
IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.PNG', '.JPG', '.JPEG'}


def get_output_path_for_file(input_path):
    """
    为单个文件生成输出路径（同级目录，加 _nobg 后缀）
    例如: /path/to/icon.png -> /path/to/icon_nobg.png
    """
    input_path = Path(input_path)
    return input_path.parent / f"{input_path.stem}_nobg.png"


def get_output_dir_for_directory(input_dir):
    """
    为目录生成输出目录（同级目录，加 _out 后缀）
    例如: /path/to/images -> /path/to/images_out
    """
    input_dir = Path(input_dir)
    return input_dir.parent / f"{input_dir.name}_out"


def remove_background_ai(input_path, output_path=None):
    """
    使用 rembg AI 模型去除背景 (推荐方式)
    效果最好，能智能识别主体，边缘平滑

    Args:
        input_path: 输入图片路径
        output_path: 输出图片路径

    Returns:
        输出文件的路径
    """
    if not HAS_REMBG:
        raise ImportError(
            "未安装 rembg 库，请先安装: pip install rembg\n"
            "或者使用简单模式: python remove_background.py <input> <output> --simple"
        )

    # 打开图片
    with open(input_path, 'rb') as f:
        input_data = f.read()

    # 使用 AI 去除背景
    output_data = remove(input_data)

    # 如果没有指定输出路径，自动生成（同级目录加后缀）
    if output_path is None:
        output_path = get_output_path_for_file(input_path)

    # 保存结果
    with open(output_path, 'wb') as f:
        f.write(output_data)

    return str(output_path)


def remove_white_background(input_path, output_path=None, threshold=240, smooth_edges=True):
    """
    去除图片的白色背景 (简单模式)
    适用于纯白背景的简单图片

    Args:
        input_path: 输入图片路径
        output_path: 输出图片路径
        threshold: 白色阈值(0-255)
        smooth_edges: 是否平滑边缘

    Returns:
        输出文件的路径
    """
    # 检查输入文件是否存在
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"输入文件不存在: {input_path}")

    # 打开图片
    img = Image.open(input_path)

    # 转换为RGBA模式
    if img.mode != 'RGBA':
        img = img.convert('RGBA')

    # 获取图片数据
    datas = img.getdata()
    new_data = []

    # 遍历每个像素
    for item in datas:
        # 检查是否为白色(或接近白色)
        if item[0] > threshold and item[1] > threshold and item[2] > threshold:
            # 将白色像素设置为透明
            new_data.append((255, 255, 255, 0))
        else:
            # 对边缘像素进行羽化处理
            if smooth_edges:
                # 检查是否是边缘像素（接近白色但不完全是白色）
                avg = (item[0] + item[1] + item[2]) / 3
                if avg > threshold - 30:
                    # 计算透明度，实现平滑过渡
                    alpha = int(255 * (1 - (avg - (threshold - 30)) / 30))
                    alpha = max(0, min(255, alpha))
                    new_data.append((item[0], item[1], item[2], alpha))
                else:
                    new_data.append(item)
            else:
                new_data.append(item)

    # 更新图片数据
    img.putdata(new_data)

    # 可选：应用轻微的高斯模糊来平滑边缘
    if smooth_edges:
        # 创建一个用于模糊的副本
        alpha = img.split()[3]
        alpha = alpha.filter(ImageFilter.GaussianBlur(radius=0.5))
        img.putalpha(alpha)

    # 如果没有指定输出路径，自动生成（同级目录加后缀）
    if output_path is None:
        output_path = get_output_path_for_file(input_path)

    # 保存为PNG格式
    img.save(output_path, 'PNG')

    return str(output_path)


def remove_background_auto(input_path, output_path=None, threshold=240):
    """
    自动选择最佳方法去除背景
    优先使用 AI 模式，如果未安装则使用简单模式

    Args:
        input_path: 输入图片路径
        output_path: 输出图片路径
        threshold: 简单模式的白色阈值

    Returns:
        (输出文件的路径, 使用的方法名称)
    """
    if HAS_REMBG:
        result = remove_background_ai(input_path, output_path)
        return result, "AI模式(rembg)"
    else:
        result = remove_white_background(input_path, output_path, threshold)
        return result, "简单模式(阈值法)"


def process_single_file(input_path, output_path=None, use_ai=True, threshold=240):
    """处理单个文件"""
    if use_ai:
        if not HAS_REMBG:
            raise ImportError("未安装 rembg 库，请先安装: pip install rembg")
        result_path = remove_background_ai(input_path, output_path)
        method = "AI模式(rembg)"
    else:
        result_path = remove_white_background(input_path, output_path, threshold)
        method = "简单模式(阈值法)"
    return result_path, method


def process_directory(input_dir, use_ai=True, threshold=240):
    """处理目录中的所有图片"""
    input_dir = Path(input_dir)
    output_dir = get_output_dir_for_directory(input_dir)
    output_dir.mkdir(exist_ok=True)

    # 获取所有图片文件
    image_files = [f for f in input_dir.iterdir()
                   if f.is_file() and f.suffix in IMAGE_EXTENSIONS]

    if not image_files:
        print(f"目录中没有找到图片文件: {input_dir}")
        return 0, output_dir

    processed = 0
    method_used = None

    for img_file in image_files:
        output_path = output_dir / f"{img_file.stem}.png"
        try:
            result_path, method = process_single_file(
                str(img_file), str(output_path), use_ai, threshold
            )
            method_used = method
            print(f"✓ {img_file.name} -> {output_path.name}")
            processed += 1
        except Exception as e:
            print(f"✗ {img_file.name}: {e}")

    return processed, output_dir, method_used


def main():
    """命令行入口函数"""
    if len(sys.argv) < 2:
        print("使用方法: python remove_background.py <input_path> [options]")
        print("")
        print("参数:")
        print("  input_path    : 输入图片路径或目录")
        print("")
        print("选项:")
        print("  --ai          : 强制使用 AI 模式(需要安装 rembg)")
        print("  --simple      : 使用简单模式(阈值法)")
        print("  --threshold N : 设置白色阈值(0-255, 默认240, 仅简单模式)")
        print("")
        print("输出规则:")
        print("  单文件: 同级目录生成 <原文件名>_nobg.png")
        print("  目录:   同级目录生成 <原目录名>_out/ 文件夹")
        print("")
        print("示例:")
        print("  python remove_background.py logo.png")
        print("  python remove_background.py images/")
        print("  python remove_background.py logo.png --ai")
        print("  python remove_background.py images/ --simple --threshold 220")
        print("")
        print("安装 AI 模式依赖:")
        print("  pip install rembg")
        sys.exit(1)

    input_path = sys.argv[1]
    threshold = 240
    force_ai = False
    force_simple = False

    # 解析参数
    i = 2
    while i < len(sys.argv):
        arg = sys.argv[i]
        if arg == '--ai':
            force_ai = True
        elif arg == '--simple':
            force_simple = True
        elif arg == '--threshold':
            if i + 1 < len(sys.argv):
                threshold = int(sys.argv[i + 1])
                i += 1
        i += 1

    # 确定使用的方法
    use_ai = not force_simple  # 默认用 AI，除非指定 --simple

    try:
        input_path_obj = Path(input_path)

        if input_path_obj.is_dir():
            # 处理目录
            print(f"处理目录: {input_path}")
            processed, output_dir, method = process_directory(
                input_path, use_ai, threshold
            )
            print(f"\n完成! 共处理 {processed} 张图片")
            print(f"使用方法: {method}")
            print(f"输出目录: {output_dir}")
        else:
            # 处理单个文件
            result_path, method = process_single_file(
                input_path, None, use_ai, threshold
            )
            print(f"处理完成! 使用方法: {method}")
            print(f"输出文件: {result_path}")

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
