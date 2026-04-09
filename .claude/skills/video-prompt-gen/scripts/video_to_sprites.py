#!/usr/bin/env python3
"""
Video to Game Sprite Frames Processor
Processes AI-generated videos into game-ready sprite frames.

Features:
- Frame extraction at configurable FPS
- Background removal using rembg
- Batch processing with progress display
- Output optimization for game engines

Usage:
    python video_to_sprites.py --input video.mp4 --output ./sprites --fps 12 --remove-bg
"""

import argparse
import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Installing Pillow...")
    os.system(f"{sys.executable} -m pip install Pillow -q")
    from PIL import Image

try:
    import rembg
except ImportError:
    print("Installing rembg...")
    os.system(f"{sys.executable} -m pip install rembg -q")
    import rembg

try:
    from tqdm import tqdm
except ImportError:
    print("Installing tqdm...")
    os.system(f"{sys.executable} -m pip install tqdm -q")
    from tqdm import tqdm

try:
    import cv2
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False

try:
    import subprocess
    FFMPEG_AVAILABLE = subprocess.run(['ffmpeg', '-version'], capture_output=True).returncode == 0
except:
    FFMPEG_AVAILABLE = False


def extract_frames_opencv(video_path: str, output_dir: str, target_fps: int = 12) -> list:
    """
    Extract frames using OpenCV (fallback when ffmpeg not available).
    """
    if not HAS_CV2:
        print("Installing OpenCV...")
        os.system(f"{sys.executable} -m pip install opencv-python -q")
        global cv2
        import cv2 as _cv2
        cv2 = _cv2

    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        print(f"Error: Cannot open video {video_path}")
        return []

    # Get video properties
    video_fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / video_fps if video_fps > 0 else 0

    print(f"Video FPS: {video_fps}")
    print(f"Total frames: {total_frames}")
    print(f"Duration: {duration:.2f}s")
    print(f"Extracting at {target_fps} FPS...")

    # Calculate frame interval
    frame_interval = max(1, int(video_fps / target_fps))

    extracted = []
    frame_count = 0
    saved_count = 0

    with tqdm(total=total_frames, desc="Extracting frames") as pbar:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_count % frame_interval == 0:
                output_file = output_dir / f"frame_{saved_count:04d}.png"
                cv2.imwrite(str(output_file), frame)
                extracted.append(str(output_file))
                saved_count += 1

            frame_count += 1
            pbar.update(1)

    cap.release()
    print(f"Extracted {len(extracted)} frames")

    return extracted


def extract_frames(video_path: str, output_dir: str, fps: int = 12) -> list:
    """
    Extract frames from video at specified FPS.
    Uses ffmpeg if available, otherwise falls back to OpenCV.

    Args:
        video_path: Path to input video file
        output_dir: Directory to save extracted frames
        fps: Frames per second to extract

    Returns:
        List of extracted frame paths
    """
    # Use OpenCV if ffmpeg is not available
    if not FFMPEG_AVAILABLE:
        print("FFmpeg not found, using OpenCV for frame extraction...")
        return extract_frames_opencv(video_path, output_dir, fps)

    import subprocess

    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Get video duration
    probe_cmd = [
        'ffprobe', '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        video_path
    ]

    try:
        result = subprocess.run(probe_cmd, capture_output=True, text=True)
        duration = float(result.stdout.strip())
        total_frames = int(duration * fps)
        print(f"Video duration: {duration:.2f}s")
        print(f"Extracting {total_frames} frames at {fps} FPS")
    except Exception as e:
        print(f"Could not get video duration: {e}")
        total_frames = None

    # Extract frames using ffmpeg
    output_pattern = str(output_dir / "frame_%04d.png")

    cmd = [
        'ffmpeg', '-y',
        '-i', video_path,
        '-vf', f'fps={fps}',
        output_pattern
    ]

    print(f"Running: {' '.join(cmd)}")
    subprocess.run(cmd, capture_output=True)

    # Get list of extracted frames
    frames = sorted(output_dir.glob("frame_*.png"))
    print(f"Extracted {len(frames)} frames")

    return [str(f) for f in frames]


def remove_background(input_path: str, output_path: str, model: str = 'isnet-anime',
                       edge_cleanup: bool = True, edge_erode: int = 2) -> bool:
    """
    Remove background from a single image.

    Args:
        input_path: Path to input image
        output_path: Path to save output image
        model: rembg model to use (isnet-anime, u2net, etc.)
        edge_cleanup: Whether to apply edge cleanup for green screen residue
        edge_erode: Erosion amount for edge cleanup (pixels)

    Returns:
        True if successful, False otherwise
    """
    try:
        with open(input_path, 'rb') as f:
            input_data = f.read()

        output_data = rembg.remove(input_data, model=model)

        if edge_cleanup:
            # Post-process to clean up green screen residue on edges
            output_data = _clean_green_edges(output_data, erode_amount=edge_erode)

        with open(output_path, 'wb') as f:
            f.write(output_data)

        return True
    except Exception as e:
        print(f"Error processing {input_path}: {e}")
        return False


def _clean_green_edges(image_data: bytes, erode_amount: int = 2) -> bytes:
    """
    Clean up green screen residue on image edges.
    Applies erosion to remove thin green borders and color contamination.

    Args:
        image_data: Raw PNG image data
        erode_amount: Number of pixels to erode from edges

    Returns:
        Cleaned PNG image data
    """
    import io

    # Load image
    img = Image.open(io.BytesIO(image_data))

    # Only process if image has alpha channel
    if img.mode != 'RGBA':
        return image_data

    # Get alpha channel
    r, g, b, a = img.split()

    # Erode alpha channel to remove edge artifacts
    if erode_amount > 0:
        import numpy as np
        from scipy import ndimage

        alpha_array = np.array(a)

        # Erode the alpha mask
        kernel_size = erode_amount * 2 + 1
        kernel = np.ones((kernel_size, kernel_size))
        eroded = ndimage.binary_erosion(alpha_array > 0, structure=kernel, iterations=1)
        alpha_array = (eroded * 255).astype(np.uint8)
        a = Image.fromarray(alpha_array, mode='L')

    # Reconstruct image
    img = Image.merge('RGBA', (r, g, b, a))

    # Save to bytes
    output = io.BytesIO()
    img.save(output, format='PNG', optimize=True)
    return output.getvalue()


def batch_remove_background(
    input_dir: str,
    output_dir: str,
    model: str = 'isnet-anime',
    keep_original: bool = True,
    edge_cleanup: bool = True,
    edge_erode: int = 2
) -> list:
    """
    Remove background from all images in a directory.

    Args:
        input_dir: Directory containing input images
        output_dir: Directory to save processed images
        model: rembg model to use
        keep_original: Whether to keep original files
        edge_cleanup: Whether to apply edge cleanup for green screen residue
        edge_erode: Erosion amount for edge cleanup (pixels)

    Returns:
        List of processed frame paths
    """
    input_dir = Path(input_dir)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    input_files = sorted(input_dir.glob("*.png"))
    print(f"Processing {len(input_files)} frames with rembg ({model})")
    if edge_cleanup:
        print(f"Edge cleanup enabled: erode={edge_erode}px")

    processed = []
    for input_file in tqdm(input_files, desc="Removing backgrounds"):
        output_file = output_dir / f"{input_file.stem}_nobg.png"

        if remove_background(
            str(input_file),
            str(output_file),
            model=model,
            edge_cleanup=edge_cleanup,
            edge_erode=edge_erode
        ):
            processed.append(str(output_file))

    print(f"Processed {len(processed)} frames successfully")

    if not keep_original:
        # Remove original frames
        for f in input_files:
            f.unlink()

    return processed


def select_key_frames(
    frame_dir: str,
    output_dir: str,
    frame_indices: list,
    naming: str = "sprite_{action}_{index}.png"
) -> list:
    """
    Select and rename key frames for animation.

    Args:
        frame_dir: Directory containing all frames
        output_dir: Directory to save selected frames
        frame_indices: List of frame indices to select (0-based)
        naming: Naming pattern for output files

    Returns:
        List of selected frame paths
    """
    frame_dir = Path(frame_dir)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    all_frames = sorted(frame_dir.glob("*.png"))
    selected = []

    for idx in frame_indices:
        if idx < len(all_frames):
            src = all_frames[idx]
            dst = output_dir / naming.format(action="anim", index=idx)
            dst.write_bytes(src.read_bytes())
            selected.append(str(dst))

    print(f"Selected {len(selected)} key frames")
    return selected


def optimize_for_game(
    input_dir: str,
    output_dir: str,
    max_width: int = None,
    max_height: int = None,
    trim: bool = True
) -> list:
    """
    Optimize sprites for game engine use.

    IMPORTANT: When trim=True, calculates a CONSISTENT bounding box across ALL frames
    to ensure all output frames have the same dimensions (essential for animation).

    Args:
        input_dir: Directory containing input images
        output_dir: Directory to save optimized images
        max_width: Maximum width (None to keep original)
        max_height: Maximum height (None to keep original)
        trim: Whether to trim transparent edges (uses consistent bbox for all frames)

    Returns:
        List of optimized frame paths
    """
    input_dir = Path(input_dir)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    input_files = sorted(input_dir.glob("*.png"))

    if not input_files:
        print("No frames to optimize")
        return []

    # Step 1: Calculate consistent bounding box across all frames
    # This ensures all frames have the same dimensions for animation consistency
    consistent_bbox = None
    if trim:
        print("Calculating consistent bounding box across all frames...")
        for input_file in input_files:
            img = Image.open(input_file)
            bbox = img.getbbox()
            if bbox:
                if consistent_bbox is None:
                    consistent_bbox = bbox
                else:
                    # Union of bounding boxes - take the outermost bounds
                    consistent_bbox = (
                        min(consistent_bbox[0], bbox[0]),  # left
                        min(consistent_bbox[1], bbox[1]),  # top
                        max(consistent_bbox[2], bbox[2]),  # right
                        max(consistent_bbox[3], bbox[3])   # bottom
                    )

        if consistent_bbox:
            print(f"Consistent bbox: {consistent_bbox} -> size: {consistent_bbox[2]-consistent_bbox[0]}x{consistent_bbox[3]-consistent_bbox[1]}")
        else:
            print("Warning: No content found in frames, skipping trim")
            trim = False

    # Step 2: Apply consistent transformations to all frames
    optimized = []
    for input_file in tqdm(input_files, desc="Optimizing"):
        img = Image.open(input_file)

        # Trim using CONSISTENT bounding box (same for all frames)
        if trim and consistent_bbox:
            img = img.crop(consistent_bbox)

        # Resize if needed
        if max_width or max_height:
            img.thumbnail((max_width or img.width, max_height or img.height), Image.LANCZOS)

        # Save optimized
        output_file = output_dir / input_file.name
        img.save(output_file, 'PNG', optimize=True)
        optimized.append(str(output_file))

    print(f"Optimized {len(optimized)} frames (all with consistent size)")
    return optimized


def select_and_rename_frames(
    input_dir: str,
    output_dir: str,
    frame_start: int,
    frame_end: int,
    prefix: str = "run",
    padding: int = 2,
    delete_others: bool = False
) -> list:
    """
    Select frames by index range and rename with game-friendly names.

    Args:
        input_dir: Directory containing source frames
        output_dir: Directory to save renamed frames
        frame_start: Start frame index (0-based, inclusive)
        frame_end: End frame index (0-based, inclusive)
        prefix: Prefix for output filenames (e.g., "run", "idle", "jump")
        padding: Number of digits for numbering (2 = run01, 3 = run001)
        delete_others: If True, delete frames not in selection from output_dir

    Returns:
        List of renamed frame paths
    """
    input_dir = Path(input_dir)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Get all frames sorted
    all_frames = sorted(input_dir.glob("*.png"))

    if frame_start < 0 or frame_end >= len(all_frames):
        print(f"Warning: Frame range [{frame_start}, {frame_end}] out of bounds (0-{len(all_frames)-1})")
        frame_start = max(0, frame_start)
        frame_end = min(len(all_frames) - 1, frame_end)

    selected = []
    rename_index = 1

    for i in range(frame_start, frame_end + 1):
        src = all_frames[i]
        dst = output_dir / f"{prefix}{rename_index:0{padding}d}.png"
        dst.write_bytes(src.read_bytes())
        selected.append(str(dst))
        rename_index += 1

    print(f"Selected frames {frame_start:04d} to {frame_end:04d}")
    print(f"Renamed to {prefix}01 to {prefix}{rename_index-1:0{padding}d}")
    print(f"Total: {len(selected)} frames")
    print(f"Output: {output_dir}")

    return selected


def list_frames(input_dir: str, step: int = 8) -> None:
    """
    List all frames with indices for easy selection.
    Shows every Nth frame as a preview.

    Args:
        input_dir: Directory containing frames
        step: Show every Nth frame (default 8)
    """
    input_dir = Path(input_dir)
    all_frames = sorted(input_dir.glob("*.png"))

    print(f"\n=== Frame List ({len(all_frames)} total) ===")
    print(f"Format: [index] filename (size)")
    print("-" * 50)

    for i, frame in enumerate(all_frames):
        size = frame.stat().st_size / 1024  # KB
        if i % step == 0 or i == len(all_frames) - 1:
            print(f"[{i:04d}] {frame.name} ({size:.1f}KB)")
        elif i % step == step // 2:
            print(f"  ... frames {i-step//2+1:04d} to {i+step//2-1:04d} ...")

    print("-" * 50)
    print(f"\nUsage: --select-frames \"{0:04d}-{min(7, len(all_frames)-1):04d}\" --rename-prefix run")


def get_video_info(video_path: str) -> dict:
    """Get video information using ffprobe."""
    import subprocess
    import json

    cmd = [
        'ffprobe', '-v', 'quiet',
        '-print_format', 'json',
        '-show_format', '-show_streams',
        video_path
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        info = json.loads(result.stdout)

        video_stream = next(
            (s for s in info.get('streams', []) if s['codec_type'] == 'video'),
            {}
        )

        return {
            'duration': float(info.get('format', {}).get('duration', 0)),
            'width': int(video_stream.get('width', 0)),
            'height': int(video_stream.get('height', 0)),
            'fps': eval(video_stream.get('r_frame_rate', '0/1')),
            'frames': int(video_stream.get('nb_frames', 0)),
        }
    except Exception as e:
        print(f"Error getting video info: {e}")
        return {}


def main():
    parser = argparse.ArgumentParser(
        description='Process video into game sprite frames'
    )

    parser.add_argument('--input', '-i', required=True, help='Input video path')
    parser.add_argument('--output', '-o', default='./video_temp',
                        help='Temp output directory for intermediate processing (default: ./video_temp)')
    parser.add_argument('--project-output', '-p', default=None,
                        help='Final project directory for selected frames (e.g., ./jump-tower-game/images/characters/boss/run)')
    parser.add_argument('--fps', type=int, default=12, help='Frames per second to extract')
    parser.add_argument('--remove-bg', action='store_true', help='Remove backgrounds')
    parser.add_argument('--bg-model', default='isnet-anime',
                        choices=['isnet-anime', 'u2net', 'u2netp', 'silueta'],
                        help='rembg model to use')
    parser.add_argument('--key-frames', type=int, nargs='+',
                        help='Specific frame indices to extract (0-based)')
    parser.add_argument('--max-width', type=int, help='Maximum output width')
    parser.add_argument('--max-height', type=int, help='Maximum output height')
    parser.add_argument('--trim', action='store_true', default=True,
                        help='Trim transparent edges')
    parser.add_argument('--edge-cleanup', action='store_true', default=True,
                        help='Clean up green screen residue on edges')
    parser.add_argument('--edge-erode', type=int, default=2,
                        help='Erosion amount for edge cleanup (pixels)')
    parser.add_argument('--info', action='store_true', help='Show video info only')
    parser.add_argument('--select-frames', type=str,
                        help='Frame range to select, format: "0000-0008" or "0-8"')
    parser.add_argument('--rename-prefix', type=str, default='run',
                        help='Prefix for renamed frames (e.g., "run", "idle", "jump")')
    parser.add_argument('--list-frames', action='store_true',
                        help='List all frames with indices for selection')

    args = parser.parse_args()

    # Show info only
    if args.info:
        info = get_video_info(args.input)
        print("\nVideo Information:")
        for k, v in info.items():
            print(f"  {k}: {v}")
        return

    # List frames mode
    if args.list_frames:
        if args.project_output:
            list_frames(args.project_output)
        else:
            list_frames(args.output + "/final")
        return

    # Create temp output directory for intermediate processing
    output_dir = Path(args.output)
    frames_dir = output_dir / "frames"
    nobg_dir = output_dir / "nobg"
    final_dir = output_dir / "final"

    # Step 1: Extract frames
    print("\n=== Step 1: Extracting Frames ===")
    frames = extract_frames(args.input, str(frames_dir), args.fps)

    if not frames:
        print("No frames extracted!")
        return

    # Step 2: Remove backgrounds (optional)
    if args.remove_bg:
        print("\n=== Step 2: Removing Backgrounds ===")
        processed = batch_remove_background(
            str(frames_dir),
            str(nobg_dir),
            model=args.bg_model
        )
        source_dir = nobg_dir
    else:
        source_dir = frames_dir

    # Step 3: Select key frames (optional)
    if args.key_frames:
        print("\n=== Step 3: Selecting Key Frames ===")
        select_key_frames(str(source_dir), str(final_dir), args.key_frames)
        optimize_dir = final_dir
    else:
        optimize_dir = source_dir

    # Step 4: Optimize
    print("\n=== Step 4: Optimizing ===")
    optimize_for_game(
        str(optimize_dir),
        str(final_dir),
        max_width=args.max_width,
        max_height=args.max_height,
        trim=args.trim
    )

    # Step 5: Select and rename frames - copy to project directory
    if args.select_frames:
        print("\n=== Step 5: Selecting and Renaming Frames ===")
        # Parse frame range (e.g., "0000-0008" or "0-8")
        range_str = args.select_frames.replace(" ", "")
        parts = range_str.split("-")
        if len(parts) == 2:
            frame_start = int(parts[0])
            frame_end = int(parts[1])

            # Determine final output directory
            if args.project_output:
                project_dir = Path(args.project_output)
            else:
                # Fallback to temp directory if no project output specified
                project_dir = output_dir / "selected"

            select_and_rename_frames(
                str(final_dir),
                str(project_dir),
                frame_start,
                frame_end,
                prefix=args.rename_prefix
            )
            final_output = project_dir
            print(f"\n[OK] Frames copied to project directory: {final_output}")
        else:
            print(f"Invalid frame range format: {args.select_frames}")
            final_output = final_dir
    else:
        final_output = final_dir
        print(f"\n[OK] Intermediate frames saved to: {final_output}")

    print(f"   Total frames: {len(list(final_output.glob('*.png')))}")


if __name__ == '__main__':
    main()
