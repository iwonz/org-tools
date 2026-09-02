## Context

Data Download currently stores CSV, JSON, and template settings in the strict UI projection. JSON
is produced by first creating row-mode-dependent Unit rows, always writes a hard-coded `units`
property, and treats tags as ordinary Employee fields. Editor export has a separate template
projector and no JSON format. The settings view also materializes the complete preview after every
change, which is unsuitable for the maintained 20,000-Employee target.

The public state is current-only and unversioned. The local SQLite runtime accepts only the exact
current JSON projection, while Pages holds the same state in live-tab memory. All output must remain
local and initiated by the user.

## Goals / Non-Goals

**Goals:**

- Provide one pure JSON/template projection model reusable by Data Download and Editor export.
- Make Units and Tags independently selectable, nameable, filterable JSON collections.
- Keep previews and selectors bounded at 20,000 Employees and 4,000 Units.
- Make global Export a direct strict complete-state download.
- Replace the strict Download UI shape without runtime compatibility code.

**Non-Goals:**

- Changing State or Employee Import, organization data, SQLite columns, or the PNG renderer.
- Adding remote processing, browser snapshot persistence, schema versions, or legacy readers.
- Publishing GitHub Pages as part of this delivery.

## Decisions

### Structured current-only Download state

`OrgToolsDownloadState` keeps source selections, filters, queries, Template row mode, and Template
format. It replaces CSV fields and the flat name map with structured JSON settings: ordered scalar
Employee fields, a Unit collection name plus ordered nested fields, a Tag collection name plus
`label`/`date` fields, and exact Unit/tag exclusion keys. Selected nested fields are the sole group
selection source: zero means off, a subset means indeterminate, and all means on. Both collections
start off. This avoids redundant booleans and makes invalid combinations impossible.

Alternative: keep the flat map and special internal keys. Rejected because `tags` would collide
between the previous Employee field and the new collection, and validation boundaries would remain
implicit.

### One employee-first JSON projector

JSON walks unique selected Employees once. It emits ordered scalar fields, then each enabled
collection. Unit membership is never reduced by Template row mode; exact excluded Unit IDs are
filtered without excluding descendants or Employees. Tags are `{ label, date }` objects filtered by
normalized label. `unitFullPath` remains a string joined by the fixed ` / ` separator. Names are
non-empty and unique within the containing JSON object.

Editor JSON passes a scoped Unit-context index to the same projector. Its Employee set is derived
before exclusions, so an Employee remains with an empty `units` array when every scoped assignment
is excluded. Editor settings remain session-local and independent from durable Download settings.

### Template rows remain a separate projection

Template keeps All Units/First Unit semantics, the existing condition syntax, and Employee, Unit,
tag, and dated-tag tokens. Editor supplies only Unit contexts in the chosen Unit/subtree scope.
Both surfaces use the same renderer and the fixed Unit-path separator.

### Bounded configuration and preview

Exclusion controls use searchable virtualized rows and a count-only trigger instead of rendering
one chip per selection. The preview accepts at most 50 records/rows and 128 KiB. Complete JSON or
Template text is built only after Copy or Download, in yielding batches with a single active build;
no output enters state or browser storage.

### Direct complete-state Export

The sidebar action captures and validates the current state and immediately downloads
`org-tools-state.json`. Validation failure uses the shell's localized error surface. The modal,
Employee-export serializer, and Employee-export file format are removed. Employee Import remains
available because it is an ingestion workflow rather than a symmetric transfer contract.

## Risks / Trade-offs

- [The new UI projection rejects existing state documents] → Update fixtures and the ignored local
  SQLite row once, document the break, and keep runtime parsing exact.
- [Large explicit Copy still needs one complete string] → Build only after the action, yield between
  bounded batches, expose busy state, and retain localized clipboard failures.
- [Custom output names can collide] → Validate top-level and nested object namespaces before Copy or
  Download and keep actions disabled with precise localized errors.
- [Editor and Download settings can drift] → Share schemas, controls, and pure projectors while
  intentionally keeping their state ownership separate.

## Migration Plan

1. Replace code, fixtures, and strict parser together; no compatibility branch is committed.
2. Stop the local runtime and transactionally rewrite only `ui_json.download` in the configured
   ignored database. Preserve `organization_json` and `created_at`, increment revision once, and
   verify the row with the production parser before commit.
3. Archive the change, merge, and push `main`. Do not dispatch the manual Pages workflow.

Rollback uses the prior Git commit and, before the one-time local conversion, an in-memory copy of
the original row that is restored in the same process if validation fails.

## Open Questions

None.
