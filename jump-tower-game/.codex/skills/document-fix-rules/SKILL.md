---
name: document-fix-rules
description: Capture newly discovered bugs, edge cases, and UI or engineering fixes into project rules or incident docs after they are repaired. Use when a fix exposed a previously unseen problem and the user wants the lessons written into the repo for future review and prevention.
---

# Document Fix Rules

## Overview

Use this skill after a real fix has already been made and the project needs that knowledge written down in a reusable form.

The goal is not to produce a changelog. The goal is to convert one repair into:

- a reusable rule
- a minimal failure explanation
- a prevention checklist
- a stable document location inside the repo

## When To Use

Use this skill when:

- a bug or integration issue was previously unseen
- the same class of mistake could happen again
- the user asks to "整理规则", "沉淀文档", "复盘", or "避免后续再踩坑"
- a UI/input/resource/env fix should become an explicit team constraint

Do not use this skill for:

- routine code changes with no new lesson
- release notes
- generic README cleanup with no concrete fix history behind it

## Workflow

1. Inspect the repaired issue before writing:
   - read the changed files
   - identify the user-visible symptom
   - identify the actual root cause, not just the patch shape
   - identify what invariant should have existed earlier
2. Choose the document target:
   - extend an existing rules doc if the issue belongs to an established topic
   - create a new `docs/technical/*.md` rule doc if the lesson is cross-cutting and repeatable
   - create a dated incident doc only when the lesson is highly specific and does not justify a standing rule
3. Write for future prevention:
   - what broke
   - why it broke
   - what rule now exists
   - what future changes must check before merge
4. Link it from an obvious entry point when needed:
   - add to `README.md` if the document is a standing project rule
   - avoid scattering links across multiple files unless there is a strong navigation need
5. Keep the document alive:
   - append new rules into the same topic doc when the domain is the same
   - avoid creating many tiny overlapping docs

## Writing Rules

Prefer rule-oriented wording over narrative wording.

Good:

- "Bottom navigation buttons must support toggle behavior."
- "A single gesture must not trigger the same UI action twice."
- "Real-device debug must use cloud assets when package size exceeds tool limits."

Avoid:

- "Today we changed X, then we found Y, then we tried Z."

## Required Sections

For a standing rules doc, include most of these sections:

- scope or affected modules
- rule
- reason
- current implementation note when useful
- requirements for future code changes
- minimal verification checklist

For a one-off incident doc, include:

- symptom
- trigger conditions
- root cause
- fix summary
- prevention rules

## Path Selection

Use these defaults unless the repo already has a better convention:

- standing engineering rules: `docs/technical/<topic>.md`
- dated case-specific notes: `docs/technical/incidents/YYYY-MM-DD-<topic>.md`
- gameplay or ops process rules: `docs/gameoperations/<topic>.md`

If the repo already has a matching rule document, update it instead of creating a near-duplicate.

## Output Standard

The document should let a future engineer answer these questions quickly:

- What failed?
- Why did it fail?
- What rule do we follow now?
- What do I need to check before changing this area again?

If those four answers are not obvious, the document is not finished.

## Resources

- For reusable section structure and wording patterns, read `references/doc-templates.md`.
- To scaffold a new dated or standing doc, you can use `scripts/scaffold_fix_doc.sh`.
