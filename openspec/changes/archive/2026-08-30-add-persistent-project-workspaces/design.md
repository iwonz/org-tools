## Context

The application currently constructs one blank MobX `OrgStore` in the browser, restores organization
data only through explicit JSON selection, and emits a static `apps/ui/out` build. Browser code cannot
open a native SQLite file at a configurable repository path, so durable projects require a local
runtime. The approved privacy boundary is the same machine and same origin: organization data may
cross between the page and a loopback server but must never reach browser persistence, a remote host,
telemetry, logging, or another service.

The public transfer document remains the strict current-only `OrgToolsState`. SQLite is an internal
container for named projects, not a new import format. The implementation must remain responsive at
20,000 Employees and 4,000 Units and must not serialize the complete organization after every UI
gesture.

## Goals / Non-Goals

**Goals:**

- Keep multiple named projects in one configurable, ignored SQLite file and restore the last opened
  project through a stable `/projects/<uuid>` URL.
- Provide explicit, revision-checked Save for organization data and separate lightweight automatic
  persistence for navigation and editor UI state.
- Keep all project traffic same-origin on `127.0.0.1`, validate every stored state, fail atomically,
  and preserve existing Import and Export behavior inside the current project.
- Provide complete localized project CRUD, unsaved-change protection, conflict resolution,
  documentation, browser coverage, and screenshot coverage.

**Non-Goals:**

- Accounts, permissions, LAN or public serving, remote synchronization, collaboration, telemetry, or
  remote backups.
- Relational normalization of Employees, Units, Views, tags, or editor documents.
- Project names or database metadata in `OrgToolsState`, SQLite import through the UI, public state
  migrations, or compatibility readers.
- Autosaving organization data or silently selecting a conflict winner.

## Decisions

### Use the Next.js Node runtime and built-in SQLite

Remove static export and run the existing application with `next dev` or `next start`, explicitly
binding both commands to `127.0.0.1`. Node 22.13+ provides `node:sqlite` without a launch flag, avoids
a native third-party dependency, and supports a synchronous single-process repository appropriate
for a local single-user application. Database access is lazy so `pnpm build` does not create local
state, and the connection is cached on `globalThis` to survive development hot reload.

The default database is `<repo>/.org-tools/org-tools.sqlite3`. A strict ignored
`.org-tools/config.json` may specify `databasePath`; `ORG_TOOLS_DB_PATH` takes precedence. Relative
paths resolve from the repository root. Invalid configuration or an unavailable database fails
visibly rather than falling back to page memory. SQLite uses schema `user_version = 1`, foreign keys,
rollback journal mode, full synchronous writes, and a busy timeout. WAL is deliberately avoided so
the durable resting artifact is one database file; transient rollback journals remain inside the
ignored directory.

### Store one validated state snapshot per project

`projects` stores UUID `id`, display `name`, normalized unique `name_key`, `state_json`, `ui_json`,
`state_revision`, and timestamps. `app_state` stores the last project ID. Create, delete, and Save
run in transactions with prepared statements. Project names are NFC-normalized, trimmed, limited to
100 Unicode characters, and compared case-insensitively through an application-generated key.

`state_json` is a full parsed `content: "workspace"` `OrgToolsState`; it is validated before write
and after read. `state_revision` increments only on explicit organization Save. Project metadata is
written immediately and does not change the state revision.

`ui_json` is an internal `ProjectUiState` projection containing active View, root UI fields, and
each View's viewport and selected items. It is written last-write-wins after a 300 ms debounce and
never contains Employees, Units, assignments, filters, or other organization content. On load its
references are filtered against the saved state before the overlay is applied. An explicit Save
writes both the complete current state and its UI projection in one transaction.

### Separate organization dirtiness from UI persistence

The store exposes a monotonic organization change sequence. Employee, Unit, View-document, Live
rule, assignment, layout, and import mutations advance it. Theme, active tab/View, expanded or
selected Unit, editor viewport, and editor selection notify a separate UI sequence. Hydration is
suppressed from both sequences. Save records the organization sequence captured with the outgoing
snapshot, so changes made during an in-flight request remain dirty after the response.

The header owns a compact Save action with Unsaved, Saving, Saved, and Save failed states and a
Ctrl/Cmd+S shortcut. Internal project navigation while dirty opens Save / Discard / Cancel; browser
unload uses the native confirmation. Export always reads the live store, so it can back up unsaved
work, while Import marks the project dirty.

### Resolve concurrent project edits explicitly

State Save sends `expectedRevision`. The repository updates only when it matches and otherwise
returns `409 revision_conflict` with the current revision and timestamp. The UI pauses the attempted
save and offers: load the stored state, overwrite using the returned current revision, or cancel and
keep the local dirty state. No automatic merge is attempted. UI-only persistence is last-write-wins
because it cannot overwrite organization data.

### Keep project navigation inside the existing shell

`/` resolves or creates `New project`, records the selected project, and redirects to its stable
route. There is no project hub. A sidebar-footer project switcher uses the existing compact row
geometry, lists projects, and exposes Create, Rename, Copy link, and Delete. Deleting the current
project selects a remaining project; deleting the last creates a fresh uniquely named project.
Unknown or corrupt projects render a blocking localized recovery state without replacing stored
bytes.

### Constrain the local API trust boundary

The project API is same-origin and returns `Cache-Control: no-store`. Mutations require
`application/json`, a loopback Host, and an Origin matching that Host; CORS is not enabled. State
payloads are parsed through the production parser. Stable error codes are localized by the client,
and server logs never include project names, state, request bodies, or organization values.

## Risks / Trade-offs

- [The app is no longer portable static output] → Document the Node requirement, bind loopback, and
  test the production server instead of `serve out`.
- [A full Save can be large] → Serialize only on explicit Save, show progress, keep UI autosave as a
  bounded projection, and retain the 20,000/4,000 performance fixture.
- [A page can close before manual Save] → Maintain explicit dirtiness, keyboard Save, internal
  navigation guards, and native unload confirmation.
- [Two tabs can overwrite each other] → Enforce optimistic state revisions and require an explicit
  load-or-overwrite decision.
- [UI overlays can reference unsaved entities] → Filter every ID against the saved state during
  hydration and retain the saved state's valid fallback.
- [Database or config corruption could cause silent loss] → Fail closed, preserve bytes, expose
  recovery actions, and never install a blank state implicitly.
- [A default database could dirty the repository] → Ignore `.org-tools` runtime contents and make
  publication checks reject tracked database and journal files anywhere.

## Migration Plan

1. Create the project repository and API behind the new Node runtime, then integrate routing and
   store lifecycle.
2. Replace static test serving with production Next start and unique temporary databases.
3. Update project UI, documentation, privacy rules, screenshots, and publication checks.
4. Existing users start with `New project` and perform one normal JSON Import; no public-state
   conversion is required.
5. Rollback is a normal code revert. The SQLite file remains ignored and can be copied while the
   server is stopped or its current state can be exported before rollback.

## Open Questions

None. Product and implementation choices are fixed by the approved plan.
