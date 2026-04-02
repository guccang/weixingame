---
name: build-asset-manifest
description: Generate or refresh the CloudBase asset manifest for this WeChat mini game project. Use when the user wants to add resources to cloud delivery, regenerate manifest JSON, sync assetCatalog changes into a deployable manifest, or prepare asset_manifest database payloads.
---

# Build Asset Manifest

## Overview

Use this skill when working on the game's cloud resource pipeline. It keeps the source of truth in `js/resource/assetCatalog.js`, generates a manifest document with `scripts/buildAssetManifest.js`, and avoids hand-editing `asset_manifest` records.

## Workflow

1. Inspect the current catalog and generator script:
   - `js/resource/assetCatalog.js`
   - `scripts/buildAssetManifest.js`
2. If the user added or removed resources, update `js/resource/assetCatalog.js` first.
3. Require the caller to pass `--version` in `x.y.z` format, for example `1.0.0`.
4. Generate the manifest JSON with the repo script instead of manually writing `assets[]`.
5. If the user needs CloudBase-ready data, include `--fileid-prefix "cloud://<env>.<bucket>/"`.
6. Return either:
   - the generated file path, or
   - the JSON payload to import into the `asset_manifest` collection.

## Commands

Generate to stdout:

```bash
node scripts/buildAssetManifest.js --version 1.0.0
```

Generate a file:

```bash
node scripts/buildAssetManifest.js --version 1.0.0 --output manifest.json
```

Generate a CloudBase-ready manifest with file IDs:

```bash
node scripts/buildAssetManifest.js \
  --version 1.0.0 \
  --fileid-prefix "cloud://<env>.<bucket>/" \
  --output manifest.json
```

Or run the bundled wrapper:

```bash
.codex/skills/build-asset-manifest/scripts/generate_manifest.sh --version 1.0.0 --output manifest.json
```

## Rules

- Do not hand-edit long `assets` arrays in database payloads.
- Treat `js/resource/assetCatalog.js` as the source of truth for tracked resources.
- Keep `key` stable once a resource is already used by runtime code.
- Prefer updating the generator or catalog over pasting one-off JSON.
- If a resource is used at runtime but missing from the catalog, add it before generating.
- If the user asks for database import data, produce a single manifest document, not individual records.
- Do not accept date-style versions such as `2026.04.02-001`; require semantic versions such as `1.0.0`.

## Output Expectations

When finishing, include:

- the command used
- the output file path if one was written
- any assumptions, especially `version` and `fileID` prefix

## Resources

### scripts/

- `scripts/generate_manifest.sh`: thin wrapper around the repo generator for repeatable usage from the skill
