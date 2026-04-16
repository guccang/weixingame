#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "usage: $0 <rule|incident> <slug> <title>" >&2
  exit 1
fi

mode="$1"
slug="$2"
shift 2
title="$*"
today="$(date +%F)"

case "$mode" in
  rule)
    target="docs/technical/${slug}.md"
    mkdir -p "docs/technical"
    if [[ ! -f "$target" ]]; then
      cat > "$target" <<EOF
# ${title}

这份规则用于约束 <问题域>，避免重复出现已经修复过的问题。

适用范围：

- \`<path>\`

## 1. <规则标题>

规则：

- ...

原因：

- ...

当前实现：

- ...

新增代码时要求：

- ...

## 最小检查清单

- ...
- ...
- ...
EOF
    fi
    ;;
  incident)
    target="docs/technical/incidents/${today}-${slug}.md"
    mkdir -p "docs/technical/incidents"
    if [[ ! -f "$target" ]]; then
      cat > "$target" <<EOF
# ${today} ${title}

## 症状

- ...

## 触发条件

- ...

## 根因

- ...

## 修复

- ...

## 后续规则

- ...

## 验证

- ...
EOF
    fi
    ;;
  *)
    echo "invalid mode: ${mode}" >&2
    exit 1
    ;;
esac

echo "$target"
