## Context

The static client currently downloads only `OrgToolsStateV1`, accepts only structured import
version 1, and edits avatar data URLs as text. Import guidance already exposes four semantic data
shapes, while Calendar, Analytics, and product navigation have redundant or visually heavy chrome.
All processing must remain in the browser, preserve the 20,000 Employee / 4,000 Unit target, and
keep source text English outside the Russian catalog.

## Goals / Non-Goals

**Goals:**

- Produce deterministic full-catalog/Main partial files and retain exact complete-state downloads.
- Make version 2 the only structured partial contract and preserve Live bosses and position overrides.
- Turn local image files or clipboard images into bounded cropped WebP avatar data URLs.
- Fit a 31-day Calendar at 1280x720 and simplify Analytics without removing virtualized behavior.
- Keep all new UI and failures bilingual, accessible, and local-only.

**Non-Goals:**

- Per-item partial-save selection, migration or compatibility for structured import version 1.
- Persisting original avatar sources, changing `OrgToolsStateV1`, or changing generic Export formats.
- Mobile-specific navigation redesign or a server-side image/data path.

## Decisions

### Version 2 is the sole partial contract

Remove the V1 public type, parser branch, fixtures, examples, and compatibility tests. V2 keeps the
same discriminator and top-level arrays, adds `liveBossEmployeeKey` and `positionOverrides`, and
strictly rejects version 1 and unknown fields. Manual Units reject both Live-only fields; Live Units
reject direct assignments, validate unique Employee references, and remap boss/positions into the
detached candidate before complete-state graph validation.

### Partial save serializes from a complete-state snapshot

A pure serializer accepts `OrgToolsStateV1` plus `teams`, `employees`, or `teamsEmployees`. It uses
persisted UUIDs only as file-local keys, traverses Main by parent and order, and runs its output
through the production V2 parser. Team-only output excludes all Employee-specific references;
combined output includes every global Employee, manual assignments, and Live role metadata. Full
workspace continues through the existing complete-state serializer.

### The Save dialog is an explicit download boundary

The header action opens a localized radio dialog ordered Teams, Employees, Teams + Employees, Full
workspace, with Full workspace selected each time. Options that cannot add their named data are
disabled. Download remains one explicit local action and uses fixed English filenames.

### Avatar input is normalized before it reaches state

Use `react-easy-crop` for a responsive 1:1 round overlay and accessible pointer, touch, wheel, slider,
and keyboard control. File and clipboard Blobs are accepted only for PNG, JPEG, or WebP, bounded to
25 MiB and 40 megapixels, decoded locally, and downscaled to a 4096-pixel longest-side temporary
source. Crop confirmation draws a 512x512 canvas and encodes WebP at quality 0.9, then applies the
existing 2 MiB data-URL validator to the Employee draft. Object URLs are revoked on every replace,
cancel, and unmount. Re-crop uses the persisted square; no source image is retained.

### Product surfaces retain their existing data models

Calendar moves month and navigation into the existing header and computes 4-5 `minmax(88px,1fr)`
rows in the remaining viewport, with overflow only as a fallback. Analytics retains virtualized
bounded lists and dialogs but removes the outer border lattice and card backgrounds. Trigger and
content DOM order becomes Units, Employees, Org Editor, Analytics, Calendar, Export. The wordmark
splits a continuous graphite/steel/blue palette across the two text spans with dark-theme values.

## Risks / Trade-offs

- [V1 files stop importing] -> Show an owned unsupported-version error and document V2 as the only current contract.
- [Large compressed images can exhaust decode memory] -> Enforce file and decoded-pixel limits, release sources promptly, and downscale before interaction.
- [Nested crop dialog focus can regress] -> Use the existing Radix dialog primitives, explicit labels, and browser keyboard coverage.
- [Calendar content can be cramped below the maintained viewport] -> Keep an 88px row minimum and allow local fallback scrolling.
- [Six large analytic groups cannot all be unbounded] -> Preserve per-section bounded virtual scroll areas while removing their card treatment.

## Migration Plan

Archive and sync the completed predecessor change, then ship the V2 parser, examples, serializer,
and UI atomically. There is no V1 migration path by product decision. Rollback restores the prior
build and V1 implementation; `OrgToolsStateV1` files remain unaffected in either direction.

## Open Questions

None.
