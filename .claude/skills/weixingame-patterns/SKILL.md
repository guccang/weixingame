---
name: weixingame-patterns
description: Coding patterns extracted from weixingame repository (WeChat mini-game project)
version: 1.0.0
source: local-git-analysis
analyzed_commits: 100
---

# Weixingame Patterns

A WeChat mini-game project for a jump-tower game with table-driven configuration.

## Commit Conventions

This project uses **Chinese commit prefixes**:

| Prefix | Meaning | Example |
|--------|---------|---------|
| `【New】` | New features | `【New】新增Boss怪物系统` |
| `【Update】` | Updates/enhancements | `【Update】UI界面更新` |
| `【Fix】` | Bug fixes | `【Fix】修复滑动下落重复触发bug` |
| `【Bug】` | Bug fixes (alternative) | `【Bug】恢复iOS下滑卡冷却时间修复` |
| `【Refactor】` | Code refactoring | `【Refactor】表格系统重构` |
| `【资源整理】` | Asset cleanup | `【资源整理】删除临时资源目录` |

**Format**: `【Type】Description` or `【Type】Description - Details`

## Code Architecture

```
weixingame/
├── jump-tower-game/           # WeChat mini-game root
│   ├── js/                    # JavaScript source code
│   │   ├── main.js           # Game entry point (most frequently changed)
│   │   ├── audio/            # Audio management
│   │   ├── barrage/          # Bullet/projectile system
│   │   ├── base/             # Base classes (animation, pool, sprite)
│   │   ├── character/        # Character system
│   │   ├── controls/         # Input/touch controls
│   │   ├── drawer/           # Rendering/drawing modules
│   │   ├── game/             # Game constants and index
│   │   ├── level/            # Level management
│   │   ├── monster/          # Monster/Boss system
│   │   ├── physics/          # Physics simulation
│   │   ├── player/           # Player logic
│   │   ├── praise/           # Praise/feedback system
│   │   ├── resource/         # Resource loading
│   │   ├── runtime/          # Runtime services (cloud, login, music)
│   │   ├── skill/            # Skill system
│   │   ├── tables/           # Table configuration system
│   │   └── ui/               # UI components
│   ├── tables/               # Game config files (.txt format)
│   │   ├── Character.txt     # Character stats
│   │   ├── Platforms.txt     # Platform configurations
│   │   ├── Monsters.txt      # Monster configurations
│   │   └── ...
│   ├── images/               # Game assets
│   │   ├── characters/       # Character sprites
│   │   ├── monsters/         # Monster sprites
│   │   ├── platforms/        # Platform images
│   │   └── ui_main/          # UI elements
│   └── audio/                # Audio files
├── tools/                    # Python utility scripts
│   ├── table_converter.py    # Convert tables to JS
│   └── frame_animator/       # Animation tools
├── art-assets/               # Art generation workflow
│   ├── prompts/              # AI art prompts
│   ├── specs/                # Art specifications
│   └── output/               # Generated assets
└── .claude/skills/           # Claude Code skills
    ├── art-prompt-workflow/  # Art generation workflow
    ├── game-table-editor/    # Table editing
    └── img-*/                # Image processing tools
```

## Workflows

### Adding a New Game Feature

1. Create feature module in `jump-tower-game/js/{domain}/`
2. Register in `main.js` (entry point)
3. Add drawer in `jump-tower-game/js/drawer/`
4. Add physics in `jump-tower-game/js/physics/` if needed
5. Update `tableConfig.js` and `tableStruct.js` if config needed

### Modifying Game Configuration

1. Edit corresponding `.txt` file in `jump-tower-game/tables/`
2. Update `tableStruct.js` if schema changes
3. Update `tableConfig.js` if new table added
4. Run `tools/table_converter.py` if needed

### Adding WeChat Cloud Features

Files that change together:
- `jump-tower-game/js/runtime/cloudStorage.js`
- `jump-tower-game/js/runtime/wxlogin.js`
- `jump-tower-game/js/main.js`

### Creating Art Assets

Use the art-prompt-workflow skill:
1. Create prompt in `art-assets/prompts/`
2. Create spec in `art-assets/specs/`
3. Generate and output to `art-assets/output/`
4. Copy to `jump-tower-game/images/`

## Table System

The project uses a custom table-driven configuration system:

| File | Purpose |
|------|---------|
| `tableManager.js` | Loads and manages tables at runtime |
| `tableConfig.js` | Table registration and paths |
| `tableStruct.js` | Table schema definitions |
| `tables/*.txt` | Actual data files (tab-separated) |

**Pattern**: Changes to table system typically involve all three JS files.

## WeChat Mini-Game Specifics

- Uses CommonJS (not ES Modules) for WeChat compatibility
- Cloud storage via `wx.cloud` API
- Touch controls optimized for mobile
- Audio management with memory cleanup (`destroy()` after play)

## Key Files (High Change Frequency)

| File | Changes | Purpose |
|------|---------|---------|
| `main.js` | 10+ | Game entry point, orchestrates all systems |
| `cloudStorage.js` | 9 | WeChat cloud data storage |
| `controls.js` | 6 | Touch/input handling |
| `tableStruct.js` | 5 | Table schema definitions |
| `tableManager.js` | 5 | Table loading and access |
| `platform.js` (physics) | 5 | Platform physics logic |

## Testing Patterns

No automated tests detected. Manual testing via:
- WeChat DevTools simulator
- Real device testing for iOS-specific issues

## Common Issues & Solutions

### iOS Memory Issues
- Call `destroy()` on audio objects after playback
- Manage animation frame IDs to prevent duplicate loops
- Store event listener references for proper cleanup

### WeChat Cloud Development
- Configure cloud environment ID in both `cloudStorage.js` and `wxlogin.js`
- Use `openid` as user identifier for cloud data
- Handle async cloud API calls properly

## Claude Skills in This Project

| Skill | Purpose |
|-------|---------|
| `art-prompt-workflow` | Generate AI art prompts and process images |
| `game-table-editor` | Edit and convert game configuration tables |
| `img-split` | Split sprite sheets |
| `img-rembg` | Remove image backgrounds |
| `img-compress` | Compress images |
| `audio-convert` | Convert audio to MP3 |
| `git_commit` | Standardized commit messages |
