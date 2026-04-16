#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$ROOT_DIR"

echo "[switch-wechat-asset-mode] switching to cloud/device packaging mode"
npm --prefix scripts run pack-mode:cloud
echo "[switch-wechat-asset-mode] done: device debug/upload should exclude bundled images/audio"
