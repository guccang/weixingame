#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

WEIXINCLOUD_PATH=""
VERSION=""
ARGS=()

while [ "$#" -gt 0 ]; do
  case "$1" in
    --weixincloud)
      if [ "$#" -lt 2 ]; then
        echo "[publish_all] missing value for --weixincloud" >&2
        exit 1
      fi
      WEIXINCLOUD_PATH="$2"
      shift 2
      ;;
    --version)
      if [ "$#" -lt 2 ]; then
        echo "[publish_all] missing value for --version" >&2
        exit 1
      fi
      VERSION="$2"
      ARGS+=("$1" "$2")
      shift 2
      ;;
    *)
      ARGS+=("$1")
      shift
      ;;
  esac
done

if [ -z "$WEIXINCLOUD_PATH" ]; then
  echo "[publish_all] --weixincloud is required" >&2
  exit 1
fi

if [ ! -f "$WEIXINCLOUD_PATH" ]; then
  echo "[publish_all] weixincloud script not found: $WEIXINCLOUD_PATH" >&2
  exit 1
fi

if [ -z "$VERSION" ]; then
  echo "[publish_all] --version is required" >&2
  exit 1
fi

if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "[publish_all] version must match x.y.z, got: $VERSION" >&2
  exit 1
fi

if [ ! -d "$REPO_ROOT/scripts/node_modules/@cloudbase/node-sdk" ]; then
  (cd "$REPO_ROOT/scripts" && npm install)
fi

cd "$REPO_ROOT"
source "$WEIXINCLOUD_PATH"
node scripts/publishCloudAssets.js --env-id "${CLOUDBASE_ENV_ID:-}" "${ARGS[@]}"
