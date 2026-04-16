# Runtime Metrics

Use this checklist when the user wants runtime proof from WeChat DevTools instead of static reasoning alone.

## Core Signals

- FPS:
  - Watch for steady decline over time, not only single-frame spikes.
  - A freeze-after-minutes bug usually shows a gradual drop before the stall.
- JS heap or memory usage:
  - The important pattern is monotonic growth across identical gameplay loops.
  - A healthy session may oscillate; a leak keeps ratcheting upward after GC.
- Main-thread or script time:
  - Look for update/render work that increases as arrays or caches grow.
- Object counts:
  - Track particles, floating text, pickups, coins, platforms, bosses, active skills, cached images.
- Event frequency:
  - Repeated listener registration often shows up as duplicated response per tap or gesture.

## Reproduction Method

1. Start a fresh session.
2. Record baseline values after the first 10 to 20 seconds.
3. Let the game run for 5 to 10 minutes, or reproduce the exact flow that freezes.
4. Trigger the same actions repeatedly:
   - restart
   - open and close panels
   - touch and drag
   - spawn bosses, pickups, particles, and rewards
5. Compare the end-state metrics with the baseline.

## Interpretation

- FPS down, object counts up:
  - Usually queue buildup or missing cleanup.
- Memory up, counts flat:
  - Usually resource or listener leak, or native object retention.
- Duplicate touch behavior:
  - Strong sign of repeated `wx.on*` registration.
- Restart makes the game worse each time:
  - Strong sign of uncleared `setTimeout`, `setInterval`, global listeners, or caches tied to each run.

## Repo-Level Counters Worth Adding

If the user wants instrumentation, suggest logging these counters every few seconds:

- `particles.length`
- `trailEffects.length`
- `barrage.floatingTexts.length`
- `runDirector.pickupSystem.floatingPickups.length`
- `coins.length`
- `platforms.length`
- `bossSystem.monsters.length`
- any image or avatar cache size
- any pending timeout count managed by the game shell

Keep the counters lightweight and removable.
