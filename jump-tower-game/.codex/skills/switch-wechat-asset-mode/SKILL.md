---
name: switch-wechat-asset-mode
description: Switch this WeChat mini game between local simulator packaging and cloud-backed device packaging. Use when the user wants one command to toggle `project.config.json` asset ignore rules for `images` and `audio`, or asks to prepare for 本地模拟器开发 versus 真机调试/体验版上传.
---

# Switch WeChat Asset Mode

## Overview

Use this skill to toggle the repo between two packaging modes without hand-editing `project.config.json`.

- `local`: keep `images/` and `audio/` inside the project package for local simulator work.
- `cloud`: exclude `images/` and `audio/` from the package for device debugging or experience uploads, where runtime assets are expected to come from cloud storage.

## Workflow

1. Choose the target mode:
   - local simulator development -> `local`
   - device debug, preview upload, experience upload -> `cloud`
2. Run one of the bundled shell wrappers:
   - `.codex/skills/switch-wechat-asset-mode/scripts/debug-local.sh`
   - `.codex/skills/switch-wechat-asset-mode/scripts/debug-device.sh`
3. The wrapper calls `scripts/setProjectPackMode.js`, which updates `project.config.json`.
4. Rebuild in WeChat DevTools after switching modes.

## Commands

Switch to local simulator packaging:

```bash
.codex/skills/switch-wechat-asset-mode/scripts/debug-local.sh
```

Switch to cloud-backed device packaging:

```bash
.codex/skills/switch-wechat-asset-mode/scripts/debug-device.sh
```

Equivalent npm commands:

```bash
npm --prefix scripts run pack-mode:local
npm --prefix scripts run pack-mode:cloud
```

## Rules

- Do not hand-edit `project.config.json` when the wrappers can do it.
- Use `local` only for simulator-side debugging where local assets are required.
- Use `cloud` before any upload path that enforces package-size limits.
- After switching, recompile in WeChat DevTools so the new pack rules take effect.

## Resources

### scripts/

- `scripts/debug-local.sh`: switch to local packaging mode
- `scripts/debug-device.sh`: switch to cloud packaging mode
