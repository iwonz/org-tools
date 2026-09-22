## Context

Custom Employee definitions are a strict discriminated union of Template and scalar Value fields. Stored values accept only scalar JSON primitives, search documents expose one text value per field, and Calendar indexes only dated Tag assignments. The Employee model dialog edits definitions, while every Employee save passes through the global store's atomic validation. Editor keyboard paste currently schedules a zero-delay fallback on `keydown`; a later `paste` event can arrive after that timer and invoke the same command again.

The state contract is intentionally unversioned and current-only. Browser mode keeps it in live memory, server mode stores one strict singleton in local SQLite, and all transformations remain local.

## Goals / Non-Goals

**Goals:**

- Represent fixed or user-extensible multi-option values as unique option-ID arrays.
- Represent Composite values as ordered arrays of typed records governed by one reusable schema.
- Validate definitions and Employee values centrally and atomically, including required values and per-Employee primary-key uniqueness.
- Derive filter, Template, export, import, and Calendar projections once outside render paths.
- Guarantee one structural paste for one keyboard paste gesture without breaking image or fallback paste.

**Non-Goals:**

- Display advanced custom values on Employee cards or Editor PNG output.
- Add nested Composite fields, multi-option Composite subfields, global primary-key uniqueness, colors, remote catalogs, or runtime legacy readers.
- Change the current custom date input contract (`DD.MM.YYYY`) or the Calendar's ISO date indexes.

## Decisions

### Persist explicit field modes and typed record arrays

Every Value definition receives required `multiple` and `allowCustomOptions` booleans. Only Option fields may set `multiple`; only multi-option fields may allow custom options. A multi-option Employee value is an ordered, duplicate-free array of option UUIDs. Single values retain their scalar representation.

Composite definitions use `kind: "composite"`, `required`, `primaryFieldId`, and an ordered `fields` array. Each subfield has a UUID, name, primitive Value type, required flag, and options for Option fields. Composite Employee values are ordered arrays of objects keyed by subfield UUID. The primary subfield is always required; empty optional cells are omitted. This keeps schema identity stable across renames and makes JSON output typed without copying display labels into state.

Alternatives considered were label-based storage and one synthetic JSON string. Labels make renames destructive and strings defeat strict typing, filtering, and validation.

### Add shared custom options inside Employee-save transactions

The Employee dialog holds newly typed option labels in local draft state and assigns stable UUIDs. Its save callback sends pending options alongside Employee fields. Global and Editor Employee save paths first build cloned definitions, normalize and deduplicate labels case-insensitively within each field, validate the complete Employee candidate against them, and commit definitions plus Employee changes together. Failed saves change neither catalog nor Employee.

### Centralize definition and value normalization

Shared helpers validate exact definition shapes, canonical dates, finite numbers, known option IDs, nonempty required values, one valid primary subfield, and unique normalized primary values per Employee. Definition changes that make stored values incompatible use the existing destructive-change confirmation and clear the affected field values and filters. Removing an option also removes it from scalar or array values and from Composite subfield cells.

### Flatten advanced values only for derived projections

Search documents expose one string array per custom field. Multi-option fields resolve every selected option label; Composite fields expose every primary-key display value. A filter matches when any projected value is selected; unset means the projection is empty. Template rendering joins arrays with `; ` and formats Composite records as deterministic JSON so no information is silently discarded. Structured JSON exports the native typed array/object representation with option labels resolved recursively.

Mapped Employee Import accepts arrays for multi-option fields and arrays of objects for Composite fields, resolving option IDs or normalized labels. Creating new fields from Import remains limited to ordinary Value definitions; current Composite definitions can be mapping targets.

### Generalize dated-event indexes

The dated Tag event shape becomes a dated Employee event with a source discriminant. Each populated Composite date cell contributes one event keyed by ISO date converted from the canonical custom date. Its label combines Composite field name, primary-key display value, and date-subfield name. Tag events retain catalog color, ordering, and history interaction; Composite groups use neutral styling and no Tag-history action. Index construction stays linear in Employees plus populated dated cells.

### Arbitrate keyboard paste gestures

A monotonically increasing keyboard-paste request token owns the fallback timer. The browser `paste` event consumes the current token before handling image or structural content. The fallback checks that its token is still current and that no paste event consumed it. A short consumed-token guard ignores a paste event that arrives after the fallback already executed. Each later keydown creates a new token, so intentional repeated pastes remain available. Context-menu paste calls the store directly and is unchanged.

## Risks / Trade-offs

- [Strict State shape changes] → Convert only the configured immediately previous valid SQLite snapshot offline with a timestamped ignored backup, detached validation, committed-row validation, and normal startup proof.
- [Composite schemas can make the Employee form large] → Keep records collapsed to one bounded row editor, reuse existing virtualized option pickers where applicable, and avoid card rendering.
- [Many Composite dates can enlarge Calendar indexes] → Build indexes once per organization revision and store references rather than Employee copies.
- [Changing schemas can discard incompatible data] → Use explicit destructive confirmation and one atomic store mutation, matching existing field-kind and type changes.
- [Paste event ordering differs by browser] → Cover event-before-timer, event-after-fallback, no-event fallback, image paste, and consecutive commands in browser tests.

## Migration Plan

1. Land the new exact parser, types, fixtures, tests, UI, and documentation together.
2. Before integration, inspect the configured owned database. If absent or already current, record that result. If it has the immediately previous valid shape, stop the owned runtime, retain a timestamped ignored backup of the database family, convert definitions by adding false mode flags while preserving scalar values, validate a detached candidate and the committed row with the production parser, then prove normal startup.
3. Keep the converter and database artifacts outside the repository. Unknown, mixed, older, or corrupt shapes remain blocked.
4. Rollback uses the retained database-family backup together with the previous application commit.

## Open Questions

None.
