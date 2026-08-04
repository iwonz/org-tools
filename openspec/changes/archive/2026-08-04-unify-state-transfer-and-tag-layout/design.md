## Context

The application currently has two public transfer envelopes: complete `org-tools-state` files and
partial `org-tools-import` files. Save and import consequently branch into separate parsers,
previews, examples, and mutations even though both ultimately produce the same normalized workspace.
Generic CSV and JSON import is Employee-only. Employee tag dates are always visible as inputs, while
Employee cards and the Org Editor cap visible tags and the PNG renderer assumes fixed row heights.

The product is a static browser-only application. Selected files, detached candidates, previews,
and rendered images must remain in memory and must never cross a network boundary or enter browser
storage. The maintained scale is 20,000 Employees and 4,000 Units, so variable geometry must be
derived once and reused rather than measured repeatedly during rendering.

## Goals / Non-Goals

**Goals:**

- Make `OrgToolsState` the sole public machine contract, with a `content` discriminator that states
  which canonical projection the file carries.
- Save and strictly parse four deterministic projections through the same validation path.
- Let recognized states append or replace compatible projections atomically, with Full workspace
  always replacing the current workspace.
- Let ordinary JSON and CSV map to manual Teams, Employees, or Teams + Employees through one
  append-only preview.
- Hide optional tag dates behind focused calendar popovers and display every tag everywhere.
- Reuse one deterministic tag-row layout model for Org Editor interaction and PNG rendering.
- Preserve browser-only processing, current-schema-only contracts, localization, and scale targets.

**Non-Goals:**

- Backward compatibility for `org-tools-import` or any obsolete state shape.
- Live-rule authoring in generic CSV or JSON mapping.
- Server persistence, synchronization, remote validation, telemetry, or notification behavior.
- Changing tabular Export formats except for the existing dated-tag image presentation.

## Decisions

### One strict scoped state envelope

`OrgToolsState` gains `content: "teams" | "employees" | "teamsEmployees" | "workspace"`. The strict
parser validates exact keys and verifies that each discriminator matches its canonical payload.
Partial states contain exactly one Main View and a deterministic UI shell; Full workspace preserves
all Views and UI state. This is preferred to optional top-level fields because every file can be
validated and consumed by the same state parser without inference.

The obsolete `OrgToolsImport` type, parser, examples, and compatibility tests are deleted. A JSON
object claiming `kind: "org-tools-state"` never falls through to generic mapping when strict parsing
fails, preventing malformed state from acquiring weaker semantics.

### Projection first, operation second

Recognized state import first offers only projections contained by the file. A partial projection
then offers Append or Replace all current, defaulting to Append. Full workspace skips the operation
choice, displays a destructive warning, and replaces atomically. Replace builds a clean Main-only
workspace for a partial projection; it does not retain current custom Views, Employees, or Teams.

Append constructs a detached candidate. Employees resolve by normalized username and then email
without overwriting an existing match. Imported entity identifiers are regenerated, all references
are remapped, Main root Teams are appended, and imported coordinates are translated as one cluster
into a free canvas region. Current custom Views and UI state remain unchanged. The candidate is
serialized and passed through the strict state parser before the store is mutated.

### Generic mapping produces the same detached candidate shape

Ordinary JSON and CSV share a target selector for Teams, Employees, or Teams + Employees and are
always append-only. JSON selects a root collection and maps recursive `children` and inline
`employees` arrays. CSV maps flat `teamKey` and `parentTeamKey` relations plus Employee and assignment
fields. Generic Teams are manual; Live semantics require a recognized state.

Rows are normalized into an internal import graph before preview. Repeated keys group only when
their entity data agrees. Unknown parents, graph cycles, conflicting identities, and multiple bosses
are graph errors and block the complete candidate. This reuses state candidate construction rather
than introducing another public contract.

### Tag date popovers and a shared row-layout model

Assigned tags render as chips containing `label` or `label · localized date`. A calendar button opens
a compact date popover with set and clear actions; bulk mixed values use a localized mixed-date
label. Native date controls remain inside the popover for keyboard and platform accessibility.

A pure tag packing function receives rendered chip labels, an available width, and stable typography
metrics and returns row count, chip positions, and height. Org Editor code derives Employee row
heights and prefix offsets once per View, Employee/tag revision, width, and locale. Virtualization,
hit testing, selection, connector anchors, automatic layout, and bounds consume those offsets. PNG
export uses the same packing constants and localized labels, avoiding a separate capped layout.

### Local trust boundary and failure atomicity

File bytes are read with browser APIs and parsed in memory. No new runtime dependency or remote
resource is required. Parse errors and candidate errors are owned localized descriptors; raw parser
or browser messages are not presented. Cancellation discards the session. Only a fully validated
candidate is committed in one store action.

## Risks / Trade-offs

- **Variable tag rows increase layout work** → Memoize packing by Employee tag content, locale, and
  available width, then derive prefix sums in linear time and use binary search for visible rows.
- **Append layout may collide with unusually large existing graphs** → Translate the imported
  bounding box beyond the current Main bounds with a fixed gap while preserving relative positions.
- **Generic mapping can become complex** → Separate discovery, mapping, graph normalization, and
  candidate validation; expose errors and counts before enabling commit.
- **Breaking removal of `org-tools-import` rejects prior files** → Follow the repository's explicit
  current-schema-only policy and remove obsolete documentation and examples in the same change.
- **Native date popovers vary by browser** → Keep the trigger, accessible name, current value, and
  clear action under application control and cover supported browsers with interaction tests.

## Migration Plan

1. Add `content` to `OrgToolsState`, implement projection serializers and strict content validation,
   and update runtime Full workspace creation to emit `content: "workspace"`.
2. Replace structured Save and import branches with scoped-state projection workflows, then delete
   `OrgToolsImport`, format examples, and their fixtures/tests.
3. Generalize CSV/JSON discovery and mapping, build detached candidates, and add atomic store actions.
4. Replace persistent tag date inputs, remove tag caps, and introduce shared variable geometry for
   editor and PNG rendering.
5. Update localization, documentation, deterministic fixtures/screenshots, and full validation.

Rollback is a source rollback of the complete change. Saved files use the current-only contract, so
no runtime migration or dual reader is retained.

## Open Questions

None. Product defaults and destructive semantics are fixed by the approved plan.
