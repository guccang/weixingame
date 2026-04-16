#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$ROOT_DIR"

echo "[switch-wechat-asset-mode] switching to local packaging mode"
npm --prefix scripts run pack-mode:local
echo "[switch-wechat-asset-mode] done: local simulator should use bundled images/audio"
