## Context

The catalog and Employee controls apply independent alphabetic sorts while Unit footers already use the persisted catalog array. Editor roster ordering is shared with PNG and row geometry. Tag colors use a non-modal portal inside a modal dialog, whose scroll lock can block wheel events.

## Goals / Non-Goals

**Goals:** One manually ordered global Tag catalog; consistent Tag displays and contiguous default-enabled Employee grouping; accessible settings; strict portable state; safe one-time conversion of the configured database.

**Non-Goals:** Group headings, duplicate Employees, configurable alphabetic order, remote data, new dependencies, browser persistence, or runtime compatibility code.

## Decisions

### Own order in the catalog and derived model

Keep `organization.tags` as the sole persisted order rather than adding rank fields or another order array. Build a reusable Tag priority index when the catalog changes and resolve Employee assignments into catalog order in the derived model. Presentation and export preserve that order; search highlights without promoting matches. Label-based draft controls preserve catalog options and append new staged labels. Calendar retains chronological event history but orders Tag groups by catalog identity.

Catalog native drag handles reuse the existing interaction pattern with before/after insertion and keyboard ArrowUp/ArrowDown. Hover/drop indicators are transient; only completed drops call the store. Filtered reordering moves the source relative to the target in the complete catalog, preserving every other Tag's relative order. No-op and canceled operations emit no organization write.

### Own grouping in the Unit document

Add required boolean `groupByTag`, default true, to `OrgEditorUnit` and exact parsing. The settings modal resolves a live Unit ID and applies its switch immediately through one Editor history command. Copy, clone, persistence, and Undo/Redo preserve this View-local field. Boss is first; other Employees use the minimum catalog Tag rank, then the existing full-name/ID comparator. Tagless Employees use the last group. Disabled grouping uses only the name comparator. No Employee is repeated and groups have no separators.

Use the same ordered Employee IDs for DOM, PNG, variable-height prefix layouts, distribution anchors, search reveal, and selection. Cache Tag ranks and Employee priorities outside sort comparisons and render loops. Catalog changes invalidate derived Views and geometry once through existing store ownership. Grouping does not rewrite manual or resolved Live membership.

### Reuse established accessible primitives

Enable modal behavior specifically on the Tag color Popover so Radix owns its nested scroll lock, focus, and Escape lifecycle. Keep bounded overflow and existing color controls. Hide the With date count when zero. Add a settings gear beside the note action with hover/focus and coarse-pointer visibility, stopping canvas drag/double-click propagation. Use an accessible switch in the existing Dialog without a new dependency or output-only controls.

## Risks / Trade-offs

- Stale row offsets after reordering → refresh the shared ordered row source alongside derived tag layouts and exercise exact reveal/connection anchors.
- Nested modal focus or wheel regressions → test presets, nested format Select, Escape, focus return, and small viewports with real browser input.
- New mandatory field rejects old files → explicitly convert only the configured local database outside runtime, retain a backup, and document the current-only contract.
- Large catalog actions rebuild data → commit only once per completed interaction and retain the existing 20,000 Employee / 4,000 Unit bounds.

## Migration Plan

Stop the runtime using the configured database. Make a consistent ignored SQLite backup, validate the recognized current input, add `groupByTag: true` to every Unit in every View, and validate the complete candidate with the production parser. Update the singleton organization JSON and revision in one transaction; preserve UI, identities, Tag order, and all unrelated values. Failure leaves the original intact; already-current data is a no-op. Verify a temporary synthetic database conversion and rollback before touching the real database. Keep the conversion tool temporary and outside shipped runtime. Rollback uses the pre-change code and backup together while the server is stopped.

## Open Questions

None.
