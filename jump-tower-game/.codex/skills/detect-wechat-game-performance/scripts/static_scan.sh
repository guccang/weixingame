#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-.}"

if command -v rg >/dev/null 2>&1; then
  SEARCH_CMD=(rg -n --no-heading -S)
else
  SEARCH_CMD=(grep -RIn)
fi

print_section() {
  printf '\n== %s ==\n' "$1"
}

run_search() {
  local pattern="$1"
  "${SEARCH_CMD[@]}" "$pattern" "$TARGET" || true
}

print_section "Global WeChat Listeners"
run_search 'wx\.(onTouchStart|onTouchMove|onTouchEnd|onShareAppMessage|onShow|onHide|onResize)\('

print_section "Timers"
run_search 'setTimeout\(|setInterval\(|clearTimeout\(|clearInterval\('

print_section "Animation And Frame Loops"
run_search 'requestAnimationFrame\(|cancelAnimationFrame\(|loop\(\)|update\(|render\('

print_section "Dynamic Resource Creation"
run_search 'wx\.createImage\(|wx\.createInnerAudioContext\(|new Image\('

print_section "Queue And Cache Suspects"
run_search 'push\(|unshift\(|splice\(|filter\(|sort\(|cache|imageCache|avatarCache|floatingTexts|particles|trailEffects|floatingPickups|coins|platforms|monsters'

print_section "Potential Cleanup Hooks"
run_search 'reset\(|clear\(|destroy\(|stop\(|off\('

print_section "Hot Loop Object Creation"
run_search 'update\(|render\(|draw\('

printf '\nScan complete for: %s\n' "$TARGET"
