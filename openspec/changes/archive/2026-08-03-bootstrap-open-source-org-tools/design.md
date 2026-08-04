## Context

The application is a static Next.js workspace with a local organization editor. The repository must
remain browser-only, use generic file-based persistence, and publish only reviewed source and
deterministic artifacts.

## Goals / Non-Goals

**Goals:**

- Preserve the six-tab editor, Main and custom Views, Live Units, local exports, analytics, and birthday calendar.
- Replace legacy inputs with a strict versioned state and a generic mapped CSV/JSON Employee import.
- Guarantee local processing, embedded avatars, English public artifacts, deterministic tests, and a clean OpenSpec workflow.
- Keep the existing 20,000 Employee and 4,000 Unit performance target.

**Non-Goals:**

- Server persistence, collaboration, autosave, telemetry, remote synchronization, or publishing the repository.
- Legacy state migration, source-specific exporters, remote avatar fetching, or relational Unit import from tabular files.
- Localization beyond English in the first open-source release.

## Decisions

### Reviewed repository contents

Only reviewed source paths and deterministic assets belong in the repository. Generated output,
media, caches, and temporary fixtures remain outside tracked source.

### Versioned browser state

`OrgToolsStateV1` uses `kind: "org-tools-state"` and `formatVersion: 1`. Employee, Unit, and View
IDs are UUID strings. The parser performs strict structural and graph validation before swapping the
active store. State lives in memory and is persisted only through explicit JSON open/save.

### Generic Employee model

Persisted Employees contain generic contact/profile fields, a bounded embedded raster avatar, `MM-DD` birthday, and tags. Profile URLs are stored rather than derived. Positions and boss status remain Unit-scoped. External image URLs, source IDs, origins, and gender are removed.

### Two-path import

Files are first classified as strict full state or tabular input. Full state can only replace the workspace after confirmation. CSV and non-state JSON enter a transient `ImportSessionStore` that discovers collections and fields, maps them to Employee targets, previews normalization, detects duplicates, and commits all valid new Employees atomically without Unit assignments.

### Preserve the editor core

The MobX editor and derived indexes remain, but the store initializes directly from blank state. Product strings, locale behavior, selectors, metadata, and packages become English and generic. Gender filters and analytics are removed while birthday behavior is normalized.

### Screenshot-only quality tooling

The removed guided-demo media tooling is replaced by a small Playwright package that starts the
static build, loads a compact synthetic state, runs smoke assertions, and writes PNG screenshots.
Large fixtures are generated only in temporary directories.

### OpenSpec is the sole workflow

The repository pins OpenSpec 1.5.0, includes Codex integration, validates strictly in CI, and
archives this bootstrap change into main capability specs. Repository commands use a wrapper that
sets OpenSpec's documented telemetry opt-out variables. The old task registry is not migrated.

## Risks / Trade-offs

- [Large base64 avatars inflate state files] → Bound each decoded avatar, bound input files and row counts, and never duplicate generated performance fixtures in Git.
- [Strict state parsing rejects future or edited files] → Include a format version and actionable errors; add migrations only through a future OpenSpec change.
- [Arbitrary JSON is impossible to interpret perfectly] → Support object rows, nested scalar dot paths, and explicit collection selection rather than executing JSONPath expressions.
- [Repository artifacts can include non-portable output] → Scan tracked files and production output with a deterministic public-safety script and manually inspect screenshots.
- [Removing gender changes existing filters and analytics] → Remove the field and all dependent UI/tests as one atomic model change.

## Migration Plan

1. Create the repository and OpenSpec artifacts.
2. Rename packages and remove legacy modules.
3. Introduce the state and Employee contracts, then adapt stores and editor features.
4. Add the new import pipeline and UI.
5. Translate and document the retained product.
6. Add synthetic fixtures, smoke tests, screenshots, CI, and safety scanning.
7. Validate, sync specs, and archive the change.

Rollback uses the normal version-control workflow.

## Open Questions

None. The approved plan fixes browser-only persistence, English UI, six tabs, birthday without gender, unassigned mapped imports, MIT licensing, and no initial commit.
