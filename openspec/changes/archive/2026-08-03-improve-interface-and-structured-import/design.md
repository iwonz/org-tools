## Context

The shell currently spends header space on a View/count subtitle, the six top-level tabs use several
unrelated empty layouts, and the language menu has a generic icon. Russian copy also renders Unit as
a formal organizational subdivision rather than the intended Team terminology.

The import boundary currently has two paths: arbitrary CSV/tabular JSON maps to unassigned global
Employees, while a strict `OrgToolsStateV1` replaces the entire workspace. A partial structure
format must therefore be additive, explicitly distinguishable, previewable, and fully validated
without weakening the complete-state parser or mutating the live store during planning.

## Goals / Non-Goals

**Goals:**

- Improve the compact brand/header and language affordance without adding assets or requests.
- Apply natural Russian Team terminology while keeping Unit as the machine model.
- Share one top-level empty layout and omit controls that cannot perform meaningful work.
- Provide local bilingual format documentation, valid examples, and copy/download actions.
- Merge a strict structured import into Main atomically, preserving all existing Views and UI state.

**Non-Goals:**

- Changing `OrgToolsStateV1`, export schemas, filenames, URLs, locale routing, or user content.
- Importing partial custom Views, allowing partial imports to delete/update existing entities, or
  assigning imported Units directly to custom Views.
- Adding a schema service, syntax-highlighting package, remote flag asset, telemetry, or storage.

## Decisions

### Brand and locale affordances stay local and accessible

The header subtitle and its derived count work are removed. A thematic organization emoji is placed
between Org and Tools, while both words use the same CSS gradient treatment; visual spans are hidden
from accessibility and the complete brand has the accessible name `Org Tools`. Unicode Russian and
United Kingdom flags replace the language icon in the trigger and options, remain `aria-hidden`, and
do not change the localized language labels or selection semantics.

Typed UI IDs remain the existing English sentence-style catalog keys. Before catalogs reach
`NextIntlClientProvider`, a deterministic adapter replaces reserved dots in UI IDs with a collision-
checked internal token. The UI translation wrapper applies the same encoding during lookup. Catalog
files, descriptors, and call sites remain readable and typed, while `next-intl` receives only valid
namespace-safe keys.

Russian catalog values translate Unit as Team with grammatical declension and Live Unit as Dynamic
Team. English IDs, TypeScript symbols, serialized keys, example schemas, and user-authored values
remain unchanged. Catalog tests prohibit the previous Russian Unit terms.

### One top-level empty component, contextual compact variants

A shared product empty component owns icon tile, title, description, and one optional primary
action. Teams and Employees omit their toolbars when empty. Export and Analytics omit source grids
when no Employee data exists. Calendar omits its header and grid when no birthdays exist. A blank
Org Editor omits layout and zoom controls; View management remains only when multiple Views make it
necessary. Search/filter/dialog no-results reuse the compact body styling but retain contextual
copy and controls.

### Explicit structured import envelope

Only JSON with `kind: "org-tools-import"` and `formatVersion: 1` enters the structured path. Exact
known keys are required so spelling mistakes fail instead of being discarded. `employees` and
`units` arrays are required and may be empty. Employee and Unit `key` values are trimmed, unique in
their own file-local namespaces, and never persisted. Employees use the existing editable field
normalizers and require a name, username, or email.

Nested `children` define parentage and array order. Manual Units are the default and may contain
Employee assignments. Live Units require a non-empty `liveFilter`, reject direct assignments, and
resolve `selectedUnitKeys` only against Units in the same file. Optional filter fields normalize to
the current empty scalar/array defaults before existing cycle and rule validation runs. Manual Unit
assignments require a known Employee key, allow one boss, reject duplicate references, and normalize
positions.

### Identity resolution and detached candidate building

Structured Employees use current username-first/email-second identity resolution. One unambiguous
existing match is reused without changing its fields; new identities receive fresh UUIDs and one
timestamp during candidate construction. Ambiguous existing matches, conflicting username/email,
duplicate incoming identities, and dangling references invalidate the plan.

The planner returns semantic validation errors plus a preview tree and counts. Confirmation clones
the current complete state, appends new global Employees, builds imported Units in a detached Main
editor using generated UUIDs and remapped references, preserves existing custom Views and UI state,
then validates the resulting value through `parseOrgToolsState`. Only the validated result is loaded
into the live store. Any parse, graph, layout, or Live resolution failure leaves the store unchanged.
Root Units append after existing roots; children preserve input order. Existing Unit names are not
deduplicated because names are user data and are not identifiers.

### Import dialog separates operation from reference material

The modal owns `Import file` and `Formats & examples` tabs. Switching tabs does not reset the current
session; closing does. The reference tab has Employees, Teams, Teams + Employees, and Full workspace
sections with behavior notes, local TypeScript/plain-text schemas, minimal synthetic examples, and
copy/download controls. Examples are statically bundled and their machine keys are English in both
locales. Import actions appear only on the file tab.

The full workspace example exercises global Employees, Main/custom Views, manual/Live Units,
assignments, layout, viewport, and UI state and must pass the production complete-state parser. The
structured examples must pass the production structured parser in unit tests.

## Risks / Trade-offs

- [Structured import can partially mutate before a late failure] → Build and strictly validate a
  detached complete-state candidate before the single live-store load.
- [File-local keys can be confused with persisted IDs] → Label them as import references and never
  expose them after commit.
- [Live rules depend on remapped Units] → Allocate all Unit IDs first, then remap filters and run the
  existing topological validation.
- [Large reference examples make the modal unwieldy] → Use a section selector, bounded scrollable
  code blocks, and local download for full content.
- [A shared empty component erases useful context] → Standardize only top-level absence and retain
  compact contextual no-results.
- [Emoji flags have platform rendering differences] → Keep labels and accessibility independent of
  glyph rendering and inspect supported desktop screenshots.

## Migration Plan

Add the public partial-import types and parser without changing existing routes. Extend session and
UI dispatch after parser tests pass, then refactor header/empty surfaces, messages, examples, docs,
and browser coverage. Existing state files and preferences require no migration. Rollback removes
the new partial path and UI refinements; complete-state and tabular imports remain compatible.

## Open Questions

None.
