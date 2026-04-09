---
name: video-prompt-gen
description: |
  Generate optimized prompts for Google Veo/Gemini video generation to create game character animation assets.
  Use this skill when the user wants to generate video prompts for character animations, sprite sheets, or game art assets.
  Triggers: "video prompt", "generate video", "animation prompt", "character animation", "sprite animation", "game asset video", "Veo prompt", "Gemini video", "视频提示词", "动画提示词".
---

# Video Prompt Generator for Game Animation Assets

Interactive workflow for generating Veo/Gemini video prompts and processing videos into game sprite frames.

## Workflow Overview

```
1. Interactive Prompt Generation
   ├── Ask style preference
   ├── Ask action type
   ├── Ask character description
   └── Generate optimized prompt

2. Wait for Video
   └── User provides video path after generation

3. Video Processing (in video_temp directory)
   ├── Ask processing parameters
   ├── Extract frames
   ├── Remove backgrounds with edge cleanup
   └── Optimize for game engine

4. Frame Selection & Export
   ├── List frames for selection
   ├── Ask frame range (e.g., "0000-0008")
   ├── Ask output prefix (e.g., "run")
   └── Copy & rename to project directory
```

## Directory Structure

```
video_temp/                    # Temporary processing directory
├── frames/                    # Raw extracted frames
├── nobg/                      # Background-removed frames
└── final/                     # Optimized frames (for selection)

jump-tower-game/images/characters/{character}/{action}/   # Final output
├── run_0.png
├── run_1.png
└── ...
```

---

## Phase 1: Interactive Prompt Generation

### Step 1: Ask Art Style

Use AskUserQuestion to ask:

```
Question: "选择你的美术风格 / Choose your art style:"
Header: "Art Style"
Options:
  - label: "像素风 Pixel Art"
    description: "16-bit retro game aesthetic, limited palette, crisp pixels"
  - label: "2D 卡通 Cartoon"
    description: "Flat colors, bold outlines, animated series look"
  - label: "日系动漫 Anime"
    description: "Cel-shaded, vibrant colors, clean lines, expressive"
  - label: "写实风格 Realistic"
    description: "Photorealistic, detailed textures, cinematic"
  - label: "奇幻风格 Fantasy"
    description: "Magical atmosphere, painterly, ethereal glow"
```

### Step 2: Ask Action Type

Use AskUserQuestion to ask:

```
Question: "选择动作类型 / Choose action type:"
Header: "Action"
Options:
  - label: "待机 Idle"
    description: "Standing still with subtle breathing, gentle sway"
  - label: "行走 Walk"
    description: "Walking cycle, steady pace, natural gait"
  - label: "跑步 Run"
    description: "Running cycle, fast pace, dynamic movement"
  - label: "跳跃 Jump"
    description: "Crouch then leap, arc trajectory, dynamic pose"
```

### Step 3: Ask Character Description

Use AskUserQuestion to ask:

```
Question: "描述你的角色 / Describe your character:"
Header: "Character"
Options:
  - label: "战士 Warrior"
    description: "Armored knight with sword/shield"
  - label: "法师 Mage"
    description: "Robed spellcaster with staff/wand"
  - label: "弓手 Archer"
    description: "Ranged fighter with bow"
  - label: "刺客 Rogue"
    description: "Stealthy character with daggers"
```

**If user selects one of the presets**, ask for customization:

```
Question: "自定义角色细节 / Customize character details:"
Header: "Details"
(This should be an open text input - user can describe specific features)
```

### Step 4: Ask Background Type

Use AskUserQuestion to ask:

```
Question: "选择背景类型 (便于后期去背景) / Choose background type:"
Header: "Background"
Options:
  - label: "绿幕 Green Screen (推荐)"
    description: "Solid green, best for chroma key extraction"
  - label: "白色 White"
    description: "Plain white, clean extraction"
  - label: "黑色 Black"
    description: "Pure black background"
  - label: "灰色 Gray"
    description: "Neutral gray background"
```

### Step 5: Ask Edge Quality Preference

Use AskUserQuestion to ask:

```
Question: "边缘质量偏好 / Edge quality preference:"
Header: "Edge Quality"
Options:
  - label: "干净边缘 Clean Edges (推荐)"
    description: "Simple silhouette, bold outlines, easy background removal"
  - label: "标准 Standard"
    description: "Normal detail level, may require more post-processing"
  - label: "细节丰富 Detailed"
    description: "Maximum detail, complex edges (harder to remove background)"
```

### Step 6: Generate Prompt

After collecting all inputs, generate the prompt using this formula:

```
[Camera] + [Subject] + [Action] + [Context] + [Style] + [Edge Quality]
```

**Edge Quality Keywords (CRITICAL for clean background removal):**

When "Clean Edges" is selected, ALWAYS include these keywords:
```
clean silhouette, simple outline, bold edges, minimal edge detail,
solid colors, no gradients on edges, clear separation from background,
flat shading, cel-shaded style, no anti-aliasing on edges
```

**Output format:**

```markdown
## 🎬 Generated Video Prompt

**Style**: [selected style]
**Action**: [selected action]
**Duration**: [recommended seconds]

### Primary Prompt (Copy to Veo/Gemini)
```
[Complete optimized prompt]
```

### Negative Prompt
```
[Elements to avoid]

IMPORTANT: Always include these edge-related negatives for clean background removal:
blurry edges, soft edges, gradient edges, anti-aliased edges, fuzzy outline,
complex edge details, hair strands, particle effects, motion blur on edges,
semi-transparent edges, glow effects, bloom, lens flare, edge noise
```

### 📋 Next Steps
1. Copy the prompt above
2. Go to Gemini/Google AI Studio and generate the video
3. Download the generated video
4. Come back and tell me the video path to process it into sprite frames
```

---

## Phase 2: Wait for Video

After generating the prompt, **wait for the user to provide the video path**.

When user provides a video path, proceed to Phase 3.

---

## Phase 3: Video Processing (video_temp directory)

All intermediate processing happens in `video_temp/` directory.

### Step 1: Show Video Info

First, run the script to get video info:

```bash
python <skill-dir>/scripts/video_to_sprites.py --info -i "<video_path>"
```

Show the video info to the user.

### Step 2: Ask FPS

Use AskUserQuestion to ask:

```
Question: "选择帧率 / Choose frame rate (FPS):"
Header: "FPS"
Options:
  - label: "12 FPS (推荐)"
    description: "Classic animation, 12 frames per second"
  - label: "8 FPS"
    description: "Lower frame count, retro feel"
  - label: "24 FPS"
    description: "Smooth animation, more frames"
  - label: "6 FPS"
    description: "Minimal frames, choppy but small file size"
```

### Step 3: Ask Background Removal

Use AskUserQuestion to ask:

```
Question: "是否去除背景 / Remove background?"
Header: "BG Removal"
Options:
  - label: "是 Yes"
    description: "Use rembg to remove background (recommended for sprites)"
  - label: "否 No"
    description: "Keep original backgrounds"
```

**If user selects "Yes"**, ask for model:

```
Question: "选择去背景模型 / Choose background removal model:"
Header: "Model"
Options:
  - label: "isnet-anime (推荐动漫)"
    description: "Best for anime/cartoon style characters"
  - label: "u2net"
    description: "General purpose, good for most images"
  - label: "silueta"
    description: "Fast, good for simple subjects"
  - label: "u2netp"
    description: "Lightweight version of u2net"
```

### Step 4: Ask Output Options

Use AskUserQuestion to ask:

```
Question: "输出尺寸限制 / Output size limit:"
Header: "Size"
Options:
  - label: "不限制 No limit"
    description: "Keep original size"
  - label: "最大 128px"
    description: "Max width/height 128 pixels (pixel art)"
  - label: "最大 256px"
    description: "Max width/height 256 pixels"
  - label: "最大 512px"
    description: "Max width/height 512 pixels"
```

### Step 5: Execute Processing to video_temp

Build and execute the command (all output goes to video_temp):

```bash
python <skill-dir>/scripts/video_to_sprites.py \
  --input "<video_path>" \
  --output "./video_temp" \
  --fps <fps> \
  [--remove-bg --bg-model <model>] \
  [--max-width <size> --max-height <size>] \
  --trim
```

**Show progress and results to user.**

After processing completes, tell the user:
```
Processing complete! Frames are in video_temp/final/
Ready for frame selection in Phase 4.
```

---

## Phase 4: Frame Selection & Export to Project

### Step 1: List Available Frames

Show the user the available frames:

```bash
python <skill-dir>/scripts/video_to_sprites.py --list-frames --output "./video_temp"
```

Or simply list the files:
```bash
ls -la video_temp/final/
```

### Step 2: Ask Frame Range

Use AskUserQuestion to ask:

```
Question: "选择帧范围 / Select frame range (e.g., 0000-0008):"
Header: "Frames"
(This should be open text input - user enters range like "0000-0008" or "0-8")
```

### Step 3: Ask Output Prefix

Use AskUserQuestion to ask:

```
Question: "输出文件前缀 / Output file prefix:"
Header: "Prefix"
Options:
  - label: "run"
    description: "Running animation (run_0.png, run_1.png...)"
  - label: "idle"
    description: "Idle animation (idle_0.png, idle_1.png...)"
  - label: "jump"
    description: "Jump animation (jump_0.png, jump_1.png...)"
  - label: "walk"
    description: "Walk animation (walk_0.png, walk_1.png...)"
```

### Step 4: Ask Project Output Directory

Use AskUserQuestion to ask:

```
Question: "项目输出目录 / Project output directory:"
Header: "Output"
(This should be open text input - suggest default based on character and action)
Default: "./jump-tower-game/images/characters/{character_name}/{action}/"
```

### Step 5: Execute Frame Selection

Build and execute the command:

```bash
python <skill-dir>/scripts/video_to_sprites.py \
  --output "./video_temp" \
  --select-frames "<frame_range>" \
  --rename-prefix "<prefix>" \
  --project-output "<project_dir>"
```

**Example:**
```bash
python scripts/video_to_sprites.py \
  --output "./video_temp" \
  --select-frames "0000-0008" \
  --rename-prefix "run" \
  --project-output "./jump-tower-game/images/characters/mecha_boss/run/"
```

**Show results to user:**
```markdown
## Done! Frames exported to project directory

Output: ./jump-tower-game/images/characters/mecha_boss/run/
- run_0.png
- run_1.png
- run_2.png
- ...
```

---

## Edge Quality Optimization Guide (CRITICAL for clean background removal)

### Problem: AI-generated edges are too complex for clean background removal

When generating game sprites, complex edges (blurry, gradient, semi-transparent) make background removal difficult.

### Solution: Use these prompt strategies

#### 1. Style Selection for Clean Edges

**Best styles for clean edges:**
- **2D Cartoon**: Bold outlines, flat colors, cel-shaded
- **Pixel Art**: Crisp edges, no anti-aliasing
- **Anime**: Clean lines, cel-shaded (avoid detailed hair strands)

**Avoid for clean edges:**
- Realistic (too much edge detail)
- Fantasy (often has glow/ethereal effects)

#### 2. Character Design Guidelines

**DO:**
- Simple, bold silhouettes
- Solid color clothing (avoid patterns at edges)
- Clean geometric shapes
- Minimal protruding elements (spikes, fur, hair strands)

**AVOID:**
- Feathers, fur, hair strands at edges
- Complex armor with many small details
- Particle effects, smoke, flames at edges
- Transparent/semi-transparent elements

#### 3. Edge Quality Keywords (add to prompt)

```
clean silhouette, simple outline, bold edges, minimal edge detail,
solid colors, no gradients on edges, clear separation from background,
flat shading, cel-shaded style, crisp edges, sharp outline
```

#### 4. Negative Prompts for Edge Quality

```
blurry edges, soft edges, gradient edges, anti-aliased edges,
fuzzy outline, complex edge details, hair strands, particle effects,
motion blur on edges, semi-transparent edges, glow effects, bloom,
lens flare, edge noise, intricate edge details, frayed edges
```

#### 5. Background Keywords for Easy Removal

| Background | Keywords | Notes |
|------------|----------|-------|
| Green Screen | `solid green background, chroma key green, #00FF00 background` | Best for rembg |
| White | `plain white background, pure white backdrop` | Good for dark subjects |
| Black | `pure black background, solid black backdrop` | Good for light subjects |

**IMPORTANT:** Always specify "solid" or "uniform" background - avoid gradients!

#### 6. Example Optimized Prompt

```
BEFORE (hard to remove background):
A mechanical boss with spinning gears, steam vents, glowing eyes,
spiky armor plates, exhaust pipes, sparks flying from joints...

AFTER (easy to remove background):
A mechanical boss, clean silhouette with bold black outline,
simple geometric armor plates, solid metal body with minimal edge details,
flat cel-shaded coloring, clear separation from solid green background,
no sparks or particles at edges, no glow effects
```

---

## Quick Reference: Style Keywords

### Pixel Art
```
pixel art style, 16-bit aesthetic, limited color palette, retro game graphics,
crisp pixel edges, no anti-aliasing, SNES era, NES style
```

### 2D Cartoon
```
2D cartoon style, flat colors, bold outlines, animated series look,
vector art style, clean lines, cel-shaded
```

### Anime
```
Japanese anime style, cel-shaded, vibrant colors, clean lines, manga aesthetic,
anime character design, expressive eyes, stylized features
```

### Realistic
```
photorealistic, detailed textures, natural lighting, cinematic quality,
8K rendering, realistic proportions, physically accurate
```

### Fantasy
```
fantasy art style, magical atmosphere, painterly, ethereal glow, mystical,
enchanted, digital painting, concept art quality
```

---

## Quick Reference: Action Prompts

| Action | Keywords | Duration |
|--------|----------|----------|
| Idle | `standing still, subtle breathing animation, gentle sway, occasional blink` | 4-6s |
| Walk | `walking cycle, steady pace, natural gait, consistent speed, loop-friendly` | 6-8s |
| Run | `running cycle, fast pace, dynamic stride, forward lean, pumping arms` | 4-6s |
| Jump | `crouch anticipation, powerful leap, arc trajectory, dynamic silhouette` | 4-6s |

---

## Camera Keywords (Always Include)

```
Static camera, side view, full shot, locked camera, no camera movement
```

**This is essential for consistent frame extraction.**

---

## Background Keywords

| Type | Keyword | Best For |
|------|---------|----------|
| Green | `solid green background` | Chroma key, rembg |
| White | `plain white background` | Clean extraction |
| Black | `pure black background` | Light subjects |
| Gray | `neutral gray background` | General use |

---

## Post-Processing Workflow Reminder

After script execution, remind user:

```markdown
## Processing Complete!

Your sprite frames are ready at: video_temp/final/

### Key Features:
- **Consistent Frame Size**: All frames use the same bounding box for smooth animation
- **Background Removed**: Transparent backgrounds ready for game engine
- **Optimized**: Trimmed transparent edges while maintaining animation consistency

### Next Steps:
1. Review the frames in video_temp/final/
2. Select the best frames for your animation (Phase 4)
3. Export selected frames to project directory

### Frame Count: X frames
### Output Size: WxH pixels (consistent across all frames)
```

---

## Script Location

The video processing script is located at:
```
<skill-dir>/scripts/video_to_sprites.py
```

Run standalone with:
```bash
python video_to_sprites.py --help
```
