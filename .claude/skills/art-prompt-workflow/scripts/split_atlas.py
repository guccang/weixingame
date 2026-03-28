# -*- coding: utf-8 -*-
"""
图集拆解脚本 v4.1
开发者: wanxiubin
功能: 根据元素规格JSON拆解图集，支持网格模式和坐标模式

v4.1 更新:
- 新增放大倍数参数：最后一个纯数字参数作为放大倍数
  例如 target_pixel是64x64，参数2则输出128x128

v4.0 更新:
- 优化流程：拆图 → rembg去背景 → 缩放像素
- 新增 --no-rembg 选项跳过去背景步骤
- 新增 --no-resize 选项跳过缩放步骤

v3.1 更新:
- 移除压缩功能，保持高分辨率

v3.0 功能:
- 按宽高比分组（ratio_1_1格式）
- 根据target_pixel自动缩放
"""

import json
import os
import sys
import subprocess
from pathlib import Path
from math import gcd

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow library not found. Install with: pip install Pillow")
    sys.exit(1)

# 检查 rembg 是否可用
try:
    from rembg import remove
    HAS_REMBG = True
except ImportError:
    HAS_REMBG = False


def remove_background_with_rembg(image_path, output_path=None):
    """使用 rembg 去除背景"""
    if not HAS_REMBG:
        print("Warning: rembg not installed, skipping background removal")
        return image_path

    try:
        with open(image_path, 'rb') as f:
            input_data = f.read()

        output_data = remove(input_data)

        if output_path is None:
            output_path = image_path  # 覆盖原文件

        with open(output_path, 'wb') as f:
            f.write(output_data)

        return output_path
    except Exception as e:
        print(f"Warning: rembg failed for {image_path}: {e}")
        return image_path


def get_ratio(width, height):
    """计算宽高比"""
    d = gcd(width, height)
    return f"{width//d}:{height//d}"


def get_spec_name(width, height):
    """生成规格名称"""
    d = gcd(width, height)
    return f"ratio_{width//d}_{height//d}"


def load_spec(spec_path):
    """加载元素规格JSON文件"""
    with open(spec_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def detect_spec_format(spec):
    """检测JSON格式版本"""
    if 'ratio' in spec or 'target_pixel' in spec:
        return 'v3'  # 新格式：按比例分组
    elif 'element_size' in spec and 'grid' in spec:
        return 'v2'  # 旧格式：规格分组
    elif 'elements' in spec:
        return 'v1'  # 旧格式：混合坐标
    return 'unknown'


def calculate_scale(actual_size, spec_size):
    """计算实际图片与规格的比例"""
    scale_x = actual_size[0] / spec_size['width']
    scale_y = actual_size[1] / spec_size['height']

    # 允许一定误差
    if abs(scale_x - scale_y) > 0.1:
        print(f"Warning: Scale mismatch - X:{scale_x:.2f} Y:{scale_y:.2f}")

    return (scale_x + scale_y) / 2


def get_element_coords_v3(element, spec):
    """V3格式：根据网格位置计算坐标"""
    element_size = spec.get('element_size', {})
    grid = spec.get('grid', {})

    width = element_size.get('width', 64)
    height = element_size.get('height', 64)

    grid_pos = element.get('grid_pos', {})
    col = grid_pos.get('col', 0)
    row = grid_pos.get('row', 0)

    return {
        'x': col * width,
        'y': row * height,
        'width': width,
        'height': height
    }


def get_element_coords_v2(element, spec):
    """V2格式：根据网格位置计算坐标"""
    return get_element_coords_v3(element, spec)


def get_element_coords_v1(element, grid_config=None):
    """V1格式：支持coords和grid两种模式"""
    # 优先使用coords模式
    if 'coords' in element:
        return {
            'x': element['coords']['x'],
            'y': element['coords']['y'],
            'width': element['coords']['width'],
            'height': element['coords']['height']
        }

    # 使用grid模式
    if 'grid' in element and grid_config:
        row = element['grid']['row']
        col = element['grid']['col']
        col_width = grid_config.get('col_width', 64)
        row_height = grid_config.get('row_height', 64)
        spacing = grid_config.get('spacing', 0)

        return {
            'x': col * (col_width + spacing),
            'y': row * (row_height + spacing),
            'width': col_width,
            'height': row_height
        }

    return None


def resize_image(image, target_pixel, scale_multiplier=1):
    """
    缩放图片到目标像素

    Args:
        image: PIL Image对象
        target_pixel: 目标像素字典 {'width': int, 'height': int}
        scale_multiplier: 放大倍数，默认为1。例如target_pixel是64x64，倍数为2则输出128x128
    """
    target_width = target_pixel.get('width', image.width) * scale_multiplier
    target_height = target_pixel.get('height', image.height) * scale_multiplier

    if image.width != target_width or image.height != target_height:
        # 使用高质量重采样
        return image.resize((target_width, target_height), Image.LANCZOS)
    return image


def compress_image(image_path, quality='high'):
    """
    压缩图片
    quality: high (1920px, 85%), medium (1280px, 70%), low (800px, 50%)
    """
    quality_settings = {
        'high': {'max_width': 1920, 'jpg_quality': 85},
        'medium': {'max_width': 1280, 'jpg_quality': 70},
        'low': {'max_width': 800, 'jpg_quality': 50}
    }

    settings = quality_settings.get(quality, quality_settings['high'])

    try:
        img = Image.open(image_path)

        # 计算缩放
        max_width = settings['max_width']
        if img.width > max_width:
            ratio = max_width / img.width
            new_height = int(img.height * ratio)
            img = img.resize((max_width, new_height), Image.LANCZOS)

        # 保存（PNG保持透明度）
        if image_path.lower().endswith('.png'):
            # PNG使用优化压缩
            img.save(image_path, 'PNG', optimize=True)
        else:
            img.save(image_path, 'JPEG', quality=settings['jpg_quality'], optimize=True)

        return True
    except Exception as e:
        print(f"Compress error for {image_path}: {e}")
        return False


def call_external_compress(output_dir, quality='high'):
    """调用外部压缩脚本（如果可用）"""
    compress_script = Path("F:/ProjFlutter/fitness_tools/compress_images.py")

    if compress_script.exists():
        try:
            # 将路径转换为正斜杠格式
            dir_path = str(output_dir).replace('\\', '/')
            result = subprocess.run(
                ['python', str(compress_script), dir_path, '-l', quality, '-r'],
                capture_output=True,
                text=True,
                timeout=300
            )
            if result.returncode == 0:
                print(f"External compression completed: {quality}")
                return True
            else:
                print(f"External compression failed: {result.stderr}")
        except Exception as e:
            print(f"External compression error: {e}")

    return False


def split_atlas(atlas_path, spec_path, output_dir=None, use_rembg=True, use_resize=True, scale_multiplier=1):
    """
    拆解图集

    流程: 拆图 → rembg去背景 → 缩放像素

    Args:
        atlas_path: 图集路径
        spec_path: 规格JSON路径
        output_dir: 输出目录
        use_rembg: 是否使用rembg去背景
        use_resize: 是否缩放到目标像素
        scale_multiplier: 放大倍数，默认1。例如target_pixel是64x64，倍数为2则输出128x128
    """
    # 加载规格
    spec = load_spec(spec_path)
    spec_format = detect_spec_format(spec)
    print(f"Detected spec format: {spec_format}")

    # 获取目标像素（V3格式）
    target_pixel = spec.get('target_pixel', None)
    if target_pixel and spec_format == 'v3':
        print(f"Target output size: {target_pixel['width']}x{target_pixel['height']}")

    # 获取压缩配置（已禁用）
    compress_config = spec.get('compress', {})
    compress_enabled = False  # 始终禁用压缩，保持高分辨率
    compress_quality = compress_config.get('quality', 'high')

    # 设置输出目录
    if output_dir is None:
        output_dir = Path(atlas_path).parent / "split"
    else:
        output_dir = Path(output_dir)

    output_dir.mkdir(parents=True, exist_ok=True)

    # 打开图集
    atlas = Image.open(atlas_path)
    actual_size = atlas.size

    # 计算缩放比例
    spec_size = spec.get('canvas', {})
    if spec_size and 'width' in spec_size:
        scale = calculate_scale(actual_size, spec_size)
        print(f"Detected scale: {scale:.2f}x")
    else:
        scale = 1.0
        print("No canvas spec found, using 1:1 scale")

    # 获取网格配置（V1格式）
    grid_config = spec.get('grid_config', None)

    # 拆解结果
    results = []

    # 显示处理流程
    process_steps = ["1.拆图"]
    if use_rembg and HAS_REMBG:
        process_steps.append("2.rembg去背景")
    if use_resize and target_pixel:
        process_steps.append("3.缩放像素")
    print(f"处理流程: {' → '.join(process_steps)}")

    # 遍历元素
    elements = spec.get('elements', [])
    for element in elements:
        name = element.get('name', 'unknown')
        name_cn = element.get('name_cn', name)

        # 根据格式获取坐标
        if spec_format == 'v3':
            coords = get_element_coords_v3(element, spec)
        elif spec_format == 'v2':
            coords = get_element_coords_v2(element, spec)
        else:
            coords = get_element_coords_v1(element, grid_config)

        if not coords:
            print(f"Skip {name}: no coords info")
            continue

        # 应用缩放
        x = int(coords['x'] * scale)
        y = int(coords['y'] * scale)
        w = int(coords['width'] * scale)
        h = int(coords['height'] * scale)

        # 边界检查
        if x + w > actual_size[0] or y + h > actual_size[1]:
            print(f"Warning: {name} out of bounds, clipping")
            w = min(w, actual_size[0] - x)
            h = min(h, actual_size[1] - y)

        # Step 1: 裁剪（保持原始高分辨率）
        try:
            cropped = atlas.crop((x, y, x + w, y + h))
            cropped_size = cropped.size  # 原始裁剪尺寸

            # Step 2: rembg去背景
            if use_rembg and HAS_REMBG:
                # 先保存临时文件
                temp_path = output_dir / f"_temp_{name}.png"
                cropped.save(temp_path, 'PNG')

                # 使用 rembg 去背景
                output_path = output_dir / f"{name}.png"
                remove_background_with_rembg(str(temp_path), str(output_path))

                # 删除临时文件
                if temp_path.exists():
                    temp_path.unlink()

                # 重新打开处理后的图片
                cropped = Image.open(output_path)

            # Step 3: 缩放到目标像素
            if use_resize and target_pixel and spec_format == 'v3':
                cropped = resize_image(cropped, target_pixel, scale_multiplier)
                final_size = (target_pixel['width'] * scale_multiplier, target_pixel['height'] * scale_multiplier)
            else:
                final_size = cropped.size

            # 保存最终结果
            output_path = output_dir / f"{name}.png"
            cropped.save(output_path, 'PNG')

            result = {
                'name': name,
                'name_cn': name_cn,
                'original_coords': coords,
                'scaled_coords': {'x': x, 'y': y, 'width': w, 'height': h},
                'cropped_size': {'width': cropped_size[0], 'height': cropped_size[1]},
                'final_size': {'width': final_size[0], 'height': final_size[1]},
                'output_path': str(output_path),
                'rembg_applied': use_rembg and HAS_REMBG,
                'status': 'success'
            }
            results.append(result)
            print(f"Saved: {output_path} ({final_size[0]}x{final_size[1]})")

        except Exception as e:
            print(f"Error saving {name}: {e}")
            results.append({
                'name': name,
                'status': 'failed',
                'error': str(e)
            })

    # 尝试调用外部压缩脚本
    if compress_enabled:
        external_compressed = call_external_compress(output_dir, compress_quality)
        if not external_compressed:
            print("(Using built-in compression)")

    # 生成报告
    spec_name = spec.get('spec_name', Path(spec_path).stem)
    report = {
        'spec_name': spec_name,
        'spec_format': spec_format,
        'ratio': spec.get('ratio', 'unknown'),
        'target_pixel': target_pixel,
        'atlas_path': str(atlas_path),
        'spec_path': str(spec_path),
        'output_dir': str(output_dir),
        'actual_size': {'width': actual_size[0], 'height': actual_size[1]},
        'scale': scale,
        'process': {
            'rembg_enabled': use_rembg and HAS_REMBG,
            'resize_enabled': use_resize and target_pixel is not None
        },
        'compress': {
            'enabled': compress_enabled,
            'quality': compress_quality
        },
        'total_elements': len(elements),
        'successful': len([r for r in results if r.get('status') == 'success']),
        'failed': len([r for r in results if r.get('status') == 'failed']),
        'elements': results
    }

    report_path = output_dir / f'_split_report_{spec_name}.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"\nSplit complete: {report['successful']}/{report['total_elements']} elements")
    print(f"Report saved: {report_path}")

    return report


def split_all_in_dir(atlas_dir, specs_dir, output_dir=None, use_rembg=True, use_resize=True, scale_multiplier=1):
    """批量拆解目录中的所有图集"""
    atlas_dir = Path(atlas_dir)
    specs_dir = Path(specs_dir)

    # 查找所有规格文件（支持新旧格式）
    spec_files = list(specs_dir.glob('ratio_*.json'))  # 新格式: ratio_1_1.json
    if not spec_files:
        spec_files = list(specs_dir.glob('*_*.json'))   # 旧格式: 96_96.json

    if not spec_files:
        print(f"No spec files found in {specs_dir}")
        return

    print(f"Found {len(spec_files)} spec files")

    for spec_file in spec_files:
        spec_name = spec_file.stem
        # 尝试多种图集文件名
        possible_atlas = [
            atlas_dir / f"{spec_name}.png",
            atlas_dir / f"{spec_name}.jpg"
        ]

        atlas_file = None
        for p in possible_atlas:
            if p.exists():
                atlas_file = p
                break

        if not atlas_file:
            print(f"Skip {spec_name}: atlas not found in {atlas_dir}")
            continue

        print(f"\n--- Processing {spec_name} ---")

        # 设置输出目录
        if output_dir:
            out_dir = Path(output_dir)
        else:
            out_dir = atlas_dir / "split"

        split_atlas(str(atlas_file), str(spec_file), str(out_dir), use_rembg, use_resize, scale_multiplier)


def main():
    if len(sys.argv) < 3:
        print("图集拆解脚本 v4.1")
        print("")
        print("用法:")
        print("  单个拆解: python split_atlas.py <图集路径> <规格JSON> [输出目录] [选项] [放大倍数]")
        print("  批量拆解: python split_atlas.py --batch <图集目录> <规格目录> [输出目录] [选项] [放大倍数]")
        print("")
        print("选项:")
        print("  --no-rembg   : 跳过 rembg 去背景步骤")
        print("  --no-resize  : 跳过缩放像素步骤（保持原始裁剪尺寸）")
        print("  放大倍数     : 最后一个纯数字参数，如 2 表示2倍放大")
        print("")
        print("示例:")
        print("  # 完整流程：拆图 → rembg去背景 → 缩放像素")
        print("  python split_atlas.py atlas/ratio_1_1.png specs/ratio_1_1.json output/")
        print("")
        print("  # target_pixel是64x64，2倍放大输出128x128")
        print("  python split_atlas.py atlas/ratio_1_1.png specs/ratio_1_1.json output/ 2")
        print("")
        print("  # target_pixel是64x64，4倍放大输出256x256")
        print("  python split_atlas.py atlas/ratio_1_1.png specs/ratio_1_1.json output/ 4")
        print("")
        print("  # 只拆图和缩放，不去背景，2倍放大")
        print("  python split_atlas.py atlas/ratio_1_1.png specs/ratio_1_1.json output/ --no-rembg 2")
        print("")
        print("  # 只拆图和去背景，不缩放")
        print("  python split_atlas.py atlas/ratio_1_1.png specs/ratio_1_1.json output/ --no-resize")
        print("")
        print("  # 只拆图，保持原始尺寸")
        print("  python split_atlas.py atlas/ratio_1_1.png specs/ratio_1_1.json output/ --no-rembg --no-resize")
        print("")
        print("处理流程 (v4.1):")
        print("  默认: 拆图 → rembg去背景 → 缩放像素")
        sys.exit(1)

    # 解析选项
    use_rembg = True
    use_resize = True
    scale_multiplier = 1

    # 批量模式
    if sys.argv[1] == '--batch':
        if len(sys.argv) < 4:
            print("Error: --batch requires <atlas_dir> and <specs_dir>")
            sys.exit(1)

        atlas_dir = sys.argv[2]
        specs_dir = sys.argv[3]
        output_dir = None

        # 解析剩余参数
        for i in range(4, len(sys.argv)):
            arg = sys.argv[i]
            if arg == '--no-rembg':
                use_rembg = False
            elif arg == '--no-resize':
                use_resize = False
            elif not arg.startswith('--'):
                # 检查是否为纯数字（放大倍数）
                try:
                    scale_multiplier = int(arg)
                    print(f"Scale multiplier: {scale_multiplier}x")
                except ValueError:
                    output_dir = arg

        split_all_in_dir(atlas_dir, specs_dir, output_dir, use_rembg, use_resize, scale_multiplier)
        return

    # 单个拆解模式
    atlas_path = sys.argv[1]
    spec_path = sys.argv[2]
    output_dir = None

    # 解析剩余参数
    for i in range(3, len(sys.argv)):
        arg = sys.argv[i]
        if arg == '--no-rembg':
            use_rembg = False
        elif arg == '--no-resize':
            use_resize = False
        elif not arg.startswith('--'):
            # 检查是否为纯数字（放大倍数）
            try:
                scale_multiplier = int(arg)
                print(f"Scale multiplier: {scale_multiplier}x")
            except ValueError:
                output_dir = arg

    # 验证文件存在
    if not os.path.exists(atlas_path):
        print(f"Error: Atlas file not found: {atlas_path}")
        sys.exit(1)

    if not os.path.exists(spec_path):
        print(f"Error: Spec file not found: {spec_path}")
        sys.exit(1)

    split_atlas(atlas_path, spec_path, output_dir, use_rembg, use_resize, scale_multiplier)


if __name__ == '__main__':
    main()
