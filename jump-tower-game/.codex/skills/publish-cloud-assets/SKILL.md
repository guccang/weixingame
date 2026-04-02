---
name: publish-cloud-assets
description: Upload tracked local assets to CloudBase storage and upsert the generated manifest into the asset_manifest collection. Use when the user wants one command to publish resources, generate fileIDs, and sync the database document for this WeChat mini game project.
---

# Publish Cloud Assets

## Overview

Use this skill for the full CloudBase asset publish flow. It reads `js/resource/assetCatalog.js`, uploads every tracked file to cloud storage, generates a manifest with returned `fileID`s, writes that manifest into the `asset_manifest` collection, and verifies the written document can be queried back correctly.

## Workflow

1. Confirm tracked assets in `js/resource/assetCatalog.js`.
2. Ensure script dependencies exist:
   - `cd scripts && npm install`
3. Require the caller to pass a `weixincloud.sh` path that exports:
   - `CLOUDBASE_ENV_ID`
   - `CLOUDBASE_SECRET_ID`
   - `CLOUDBASE_SECRET_KEY`
   - optional `CLOUDBASE_SESSION_TOKEN`
4. Require the caller to pass `--version` in `x.y.z` format, for example `1.0.0`.
5. Run the publish wrapper so it sources `weixincloud.sh` and performs storage + database steps end to end.
5. If the publish step succeeds, confirm the post-write verification output before considering the task complete.
6. Return the version, collection name, output file path, and any failed upload/database step.

## Commands

Install dependencies:

```bash
cd scripts && npm install
```

Publish everything and also save a local manifest snapshot:

```bash
.codex/skills/publish-cloud-assets/scripts/publish_all.sh \
  --weixincloud /absolute/path/to/weixincloud.sh \
  --version 1.0.0 \
  --output manifest.json
```

## Rules

- Do not hand-enter manifest records in `asset_manifest`.
- Use the upload script as the source of returned `fileID`s.
- Keep resource keys stable; change only when runtime code changes with them.
- If a runtime asset is missing from the catalog, add it before publishing.
- Default behavior is to disable other enabled manifest versions after the new version is upserted.
- If the user needs to keep old versions enabled, pass `--keep-others-enabled`.
- Treat publish as failed if the script cannot read back the written version with `enabled === true` and a non-empty `assets` array.
- Do not accept date-style versions such as `2026.04.02-001`; require semantic versions such as `1.0.0`.

## Required Inputs

- `weixincloud.sh` absolute or resolvable path
- `version` in `x.y.z` format
- optional `output`

## Resources

### scripts/

- `scripts/publish_all.sh`: installs script dependencies when needed and runs the publish command end to end
