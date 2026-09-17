## Context

Unit rosters currently contain only global Employee IDs. Row geometry, virtualization, selection,
drag/drop, canvas anchors, scoped canvas-element export, and PNG painting all assume an Employee
owner. Open positions must remain local to one manual Unit and one View while using the same row
geometry and global Tag catalog. The State contract is strict, current-only, and unversioned.

## Goals / Non-Goals

**Goals:**

- Persist titled, tagged open positions inside manual Units without creating Employee records.
- Share deterministic Unit-row geometry between DOM interaction, attachments, and PNG output.
- Replace a position atomically while preserving its canvas attachments.
- Preserve large-roster virtualization and current-only State validation.

**Non-Goals:**

- Open positions in Live Units, boss positions, manual row ordering, standalone position clipboard
  entries, Tag transfer to Employees, or inclusion in Employee-oriented counts and exports.

## Decisions

### Persist positions inside their owning Unit

Each Unit receives a required `openPositions` array. An entry contains `id`, normalized non-empty
`title`, and exact `EmployeeTagAssignment[]` data so the existing catalog colors and optional dates
can be reused. Position IDs are UUIDs unique inside a View. Keeping ownership inside the Unit makes
deletion, subtree copy, and strict Live-Unit validation explicit; a View-level entity table would
add an unnecessary ownership join.

### Represent rendered rows as a discriminated derived sequence

Shared helpers derive `employee` and `openPosition` rows, stable row keys, resolved Tags, measured
heights, and prefix offsets. Boss Employees remain first. Remaining rows sort by catalog Tag
priority when grouping is enabled, then display title/name and ID. Employee counts, distribution,
Tag-cloud summaries, organization indexes, Analytics, and data export continue to consume only
Employee IDs. The row-height cache and virtualization index use discriminated row keys so pointer
hit testing remains logarithmic and does not scan all rows.

### Give positions their own selection and anchor owner

`OrgEditorSelectedItem` and `OrgEditorAnchorOwner` gain `openPosition` variants identified by
`unitId` plus `openPositionId`. Left/right row anchors reuse Employee anchor IDs. Resolvers use the
derived row index while expanded and the Unit edge fallback while collapsed. Dependency owner keys,
scoped export, detach predicates, clone, and paste remapping recognize the new owner explicitly;
positions are never disguised as Employee IDs.

### Make replacement one store command

Picker replacement adds the chosen Employee to the target Unit if absent and does not remove other
occurrences. A single-Employee drag keeps the existing move semantics. Both paths remove the open
position, rekey every attachment owner to the resulting Employee occurrence, select that Employee,
realign affected roots, and publish exactly once. Position Tags are discarded. If the Employee is
already in the target Unit, only the position removal and attachment rekey occur. Multi-Employee
drag remains a Unit drop and cannot consume a position.

Deletion first resolves current canvas geometry, removes the selected positions, and detaches
incoming links at their last world coordinates in the same history command. Global Tag deletion
removes assignments from every View and copied Unit before a valid State is published.

### Reuse presentation primitives across DOM and PNG

The DOM row and PNG painter consume the same derived row sequence, Tag data, tag-layout geometry,
and placeholder-avatar semantics. Position titles are not passed through Employee-format templates.
Unit/subtree scope includes canvas elements transitively attached to position owner keys. Collapse,
full-View bounds, and layer behavior remain unchanged.

### Keep the parser current-only

The strict parser requires `openPositions` on every Unit, validates exact keys, UUIDs, normalized
titles, unique assignments, existing Tag IDs, empty Live-Unit arrays, selection ownership, and
anchor ownership. No schema marker, migration, or compatibility branch is added. All mutations are
constructed in memory and committed only after a complete valid next State exists.

## Risks / Trade-offs

- **Breaking State shape** → Inspect the configured owned database, keep a timestamped ignored
  backup, convert only a detached previous-schema candidate, validate it with the production parser,
  and atomically install it before publication.
- **Row geometry divergence** → Replace Employee-only geometry inputs with one shared row model
  and cover DOM, hit testing, attachment resolution, and PNG with parity tests.
- **Accidental Employee semantics** → Keep position types and selectors discriminated and add
  exclusion tests for counts, Analytics, Calendar, distribution, and data exports.
- **Large Unit regressions** → Cache measured heights by stable row key and retain bounded row
  virtualization, prefix offsets, and spatial Unit queries.
- **Replacement could create stale links** → Rekey every attachment in the same command before
  the removed owner can be persisted; validate the final attachment graph once.

## Migration Plan

1. Update types, parser, fixtures, and runtime producers together; old exported State is rejected.
2. Before integration, inspect the configured owned SQLite database without mutating it.
3. If it contains the immediately previous valid State, stop the owned runtime, back up the complete
   database family, add `openPositions: []` to every Unit in a detached copy, validate with the
   production parser, atomically install it, validate the committed row, and prove normal startup.
4. If absent or already current, record that result. Never commit the converter or database files.
5. Rollback restores the timestamped database-family backup together with the previous application
   commit.

## Open Questions

None.
