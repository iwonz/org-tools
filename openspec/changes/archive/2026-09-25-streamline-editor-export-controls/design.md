## Context

Template export currently expands Employees through a persisted `allUnits` or `firstUnit` mode. The mode is duplicated across Data Download and scoped Editor export, affects previews and counts, and is part of the exact `ui.download` State projection. PNG export independently exposes density, output font, and title controls in two dialogs, while the renderer carries each setting into bounds, font loading, and painting. Solid backgrounds use native color inputs even though the application already has a local color dropdown with presets and used-color discovery. The toolbar's custom curved Arrow glyph is less direct than the requested directional icon.

The strict current State has no version or compatibility reader. The configured SQLite singleton is the immediately previous valid shape at revision 33893, locale `ru`, with `ui.download.rowMode: "allUnits"`.

## Goals / Non-Goals

**Goals:**

- Use one deterministic all-assignment Template row stream and add transient exact line deduplication shared by preview, counts, Copy, and Save.
- Reduce both PNG dialogs to meaningful image settings, render saved output at requested 3x within existing safety limits, and reuse the shared local color picker.
- Remove the obsolete durable row mode without weakening strict State validation.
- Make the Arrow tool recognizable through a standard local icon.
- Preserve local-only processing, large-data bounds, DOM/PNG geometry, and canvas-element typography.

**Non-Goals:**

- Changing structured JSON records, Template syntax, Employee display formats, Unit scope, image padding, Unit radius, gradients, or transparent backgrounds.
- Persisting Template filtering options or image dialog drafts.
- Adding runtime State migration, a schema version, remote fonts, remote color catalogs, or new dependencies.

## Decisions

### Evaluate every retained assignment

The shared row builder will always emit every retained Unit context in structure order and retain the existing direct-selection fallback for an unassigned Employee. JSON continues grouping these rows into one Employee object. Removing `firstUnit` and `ExportRowMode` makes every Template token deterministic and removes mode-specific counting.

Alternative: keep one hidden fixed mode. Rejected because the obsolete type and State field would continue to imply a supported choice and preserve unnecessary compatibility code.

### Process final logical lines once

A shared Template-output processor will consume rendered fragments as one logical stream, split CRLF, CR, and LF boundaries, optionally remove whitespace-only lines, then optionally retain only the first exact line value. Exact comparison includes case and whitespace. Processed output uses LF separators and no synthetic terminal line. Preview text, complete text, and visible counts use the same processor; async batches share one deduplication set so duplicates across batch boundaries cannot return. The preview retains at most 50 processed lines and 128 KiB while the count pass remains linear.

Alternative: deduplicate Employee rows or rendered row fragments. Rejected because the accepted product behavior defines uniqueness after complete text rendering and line splitting.

### Fix PNG output density and standard font

The settings type will no longer contain density, title, title alignment, title size, or output font. Rendering requests a constant density of 3 and keeps the 32-megapixel, 16,384-side Save/Copy limits plus the 8-megapixel preview limit. Standard Unit and Employee content uses the system UI family. Durable Text and Sticker elements continue to resolve their own stored typography and font loading. Title bounds and painting are removed entirely.

Alternative: choose the largest density that fills the canvas limit. Rejected because even small diagrams would produce unnecessarily large files and exceed the former supported maximum.

### Reuse semantic organization colors for solid backgrounds

The shared color dropdown remains the source of presets, current organization colors, custom values, and alpha. Solid image backgrounds store an `EmployeeTagColor` in transient settings and resolve it through `employeeTagColorToHex` before Canvas painting. `allowNoColor` is disabled because transparent background remains a separate explicit choice.

### Replace the toolbar glyph without changing the Arrow tool

`HiOutlineArrowUpRight` replaces the custom Bezier toolbar SVG. Arrow creation, curves, endpoints, markers, and persistent canvas data remain unchanged.

## Risks / Trade-offs

- [Line filtering could diverge across preview and complete output] → Route synchronous preview, asynchronous output, and counts through one processor and test batch boundaries.
- [Removing `rowMode` makes the owned SQLite unreadable by the new parser] → Stop the runtime, retain a complete timestamped backup family, validate a detached candidate, commit one revision increment, and reopen with the production parser.
- [A semantic color name is not a valid Canvas fill style] → Keep the semantic value in settings and resolve it centrally before painting.
- [A fixed 3x request can exceed browser Canvas capacity] → Preserve the existing effective-density clamp and expose no misleading quality selector.
- [Removing an output font could alter durable canvas text] → Apply the system family only to standard structure content and continue loading and painting each canvas element's stored typography.

## Migration Plan

1. Confirm the stopped configured database parses with the pre-change production parser and retain data fingerprints.
2. Back up the SQLite database plus any journal, WAL, and SHM sidecars under one ignored timestamp.
3. Copy the database to a detached candidate, remove only `ui.download.rowMode`, increment revision once, and update `updated_at` in one transaction.
4. Validate the candidate with the new production parser and compare every unrelated organization and UI value plus table metadata.
5. Apply the same guarded transaction to the configured database, validate the committed row, and prove ordinary server startup.
6. Remove the temporary converter and probes. Rollback stops the runtime and restores the complete timestamped family with the pre-change code.

## Open Questions

None.
