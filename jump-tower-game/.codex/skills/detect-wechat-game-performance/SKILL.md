---
name: detect-wechat-game-performance
description: Analyze WeChat mini game performance problems in this repo. Use when the user asks to inspect FPS drops, stutter, memory leaks, event buildup, timer leaks, queue growth, render hotspots, or long-session freezes in a 微信小游戏 project.
---

# Detect WeChat Game Performance

## Overview

Use this skill when diagnosing runtime slowdowns in a WeChat mini game, especially issues that only appear after the game runs for a while. The skill combines a fast static scan with targeted code inspection and a concrete reporting format that focuses on growth over time: listeners, timers, arrays, caches, spawned objects, and expensive per-frame work.

## Workflow

1. Start with the bundled static scan:
   - `.codex/skills/detect-wechat-game-performance/scripts/static_scan.sh`
2. Inspect the high-risk files it surfaces. Prioritize:
   - game loop and update/render paths
   - global `wx.on*` listeners
   - `setTimeout` and `setInterval`
   - dynamic arrays and caches
   - `wx.createImage()` and `wx.createInnerAudioContext()`
   - boss/projectile/trail/particle/text queues
3. Separate findings into two buckets:
   - true leak or unbounded growth
   - high churn or high per-frame cost without a strict leak
4. Recommend fixes that reduce long-session growth first:
   - add caps or eviction
   - clear delayed callbacks on scene/run transitions
   - bind global listeners once
   - stop or destroy contexts that outlive their use
   - remove off-screen or dead entities promptly
5. If the user wants runtime verification, ask them to reproduce in WeChat DevTools and collect the metrics listed in `references/runtime-metrics.md`.

## What To Look For

- Listener buildup:
  - repeated `wx.onTouchStart`, `wx.onTouchMove`, `wx.onTouchEnd`, `wx.onShareAppMessage`
  - callbacks bound inside retry, login, panel-open, or error paths
- Timer buildup:
  - nested `setTimeout`
  - `setInterval` without centralized cleanup
  - delayed UI effects that survive restart or scene switch
- Unbounded containers:
  - text queues
  - particles, trails, projectiles, pickups, coins, monsters
  - URL-keyed image caches and per-session maps
- Expensive frame work:
  - object creation inside `update()` or `render()`
  - repeated filtering or sorting in hot loops
  - image/audio creation inside gameplay code instead of preload/cache
  - repeated `Date.now()` driven layout or drawing work for large lists
- WeChat-specific risk:
  - `wx.createInnerAudioContext()` not destroyed
  - `wx.createImage()` caches that never evict
  - global touch handlers registered more than once

## Reporting Format

Return findings first, ordered by severity. For each finding include:

- file and line reference
- why it grows or stays hot over time
- whether it is a leak, queue buildup, or per-frame hotspot
- a concrete fix
- expected impact

If no strong leak is found, say that explicitly and list the remaining high-churn suspects.

## Commands

Run the bundled scan from repo root:

```bash
.codex/skills/detect-wechat-game-performance/scripts/static_scan.sh
```

Target a different path:

```bash
.codex/skills/detect-wechat-game-performance/scripts/static_scan.sh js
```

## Resources

### scripts/

- `scripts/static_scan.sh`: fast grep-based scan for listeners, timers, object creation, caches, and hot-loop suspects.

### references/

- `references/runtime-metrics.md`: runtime metrics to capture in WeChat DevTools and how to interpret growth.
