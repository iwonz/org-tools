## Context

Org Tools currently has two deliveries over one strict `OrgToolsState`: a loopback Next.js server with one automatically persisted SQLite state, and a browser-only static Pages build whose live tabs share memory through `BroadcastChannel`. The server state API is private and scoped, but it has no externally documented agent protocol, no durable audit history, and no revision-aware coordination between browser writes and an external writer.

The new MCP surface has a stronger trust boundary than ordinary same-origin state writes. It exposes full organization data and permits broad mutations, so it must be explicitly enabled, authenticated, local-only, auditable, and unable to enter the static build. MCP changes also arrive concurrently with UI edits, which requires revision-aware writes and deterministic reconciliation without changing the public state-transfer format.

## Goals / Non-Goals

**Goals:**

- Provide a standards-based Streamable HTTP MCP endpoint on the existing loopback runtime.
- Give local agents complete, paginated organization reads and atomic Employee, Unit, assignment, hierarchy, geometry, and View writes.
- Require a validated Preview -> Apply boundary for every mutation and provide idempotency, exact summaries, history, and safe selective undo.
- Preserve current singleton state through an in-place SQLite v1-to-v2 migration.
- Keep tokens, previews, and activity outside `OrgToolsState`, Import, Export, and browser storage.
- Notify live browsers of agent revisions and merge independent edits while requiring an explicit decision for overlapping edits.
- Keep the shared UI browser-safe and prove that Pages contains no MCP implementation, endpoint reference, credential, or server dependency.

**Non-Goals:**

- Remote hosting, tunnels, CORS, non-loopback bind, legacy HTTP+SSE, GET transport, or cloud connectors.
- Automatic approval, free-form code execution, SQL access, arbitrary JSON Patch, or treating organization text as instructions.
- Accounts, users, collaborative cursors, long-term version history, backups, remote synchronization, or multi-process coordination.
- MCP access in GitHub Pages or a change to the public `OrgToolsState` and state transfer contract.

## Decisions

### Use the official server SDK behind a server-only adapter

The server route will use the current `@modelcontextprotocol/server` v2 Streamable HTTP primitives in stateless mode. A thin adapter will translate the Next.js Web `Request` into one isolated MCP request and return a Web `Response`. The route accepts POST only; GET and DELETE return method-not-allowed responses rather than establishing legacy SSE sessions.

The MCP implementation, schemas, persistence, and modal transport live in server-only modules. The shared shell receives an optional server action slot, so `apps/pages` neither imports nor tree-shakes server code. `pages:check` will scan the emitted artifact for MCP package identifiers, `/mcp`, control routes, token prefixes, SQLite symbols, and server chunks.

Alternative considered: implement JSON-RPC directly. Rejected because protocol negotiation, error envelopes, annotations, prompts, and resources are safer and more interoperable through the official SDK.

### Enforce transport security before protocol parsing

Every `/mcp` request is rejected unless the Host is a supported loopback name or literal, Origin is absent or is the exact loopback same-origin origin, content type is JSON, MCP is enabled, and a constant-time comparison accepts `Authorization: Bearer <token>`. Responses use `Cache-Control: no-store`, never add CORS headers, and never log authorization values or organization payloads.

The generated token contains 256 random bits encoded after the `ot_mcp_` prefix. Disable preserves the token for later use but gates all requests immediately. Rotate commits a new token and deletes all unapplied previews in the same transaction. The control API requires the existing same-origin mutation checks; revealing or copying the token is an explicit UI action.

Alternative considered: one token per client. Rejected for the first local-only release because client identity is not authenticated independently. The journal still records the caller-supplied bounded actor label and the authenticated endpoint as the authority.

### Migrate SQLite to one v2 ownership boundary

Schema v2 keeps the v1 `application_state` row unchanged and adds:

- `mcp_settings`: singleton enabled flag, token, created/updated/rotated timestamps;
- `mcp_previews`: preview ID, base revision, actor, reason, normalized operations, before/after organization snapshots, semantic diff, expiration, optional applied change ID and result;
- `mcp_changes`: change ID, actor, reason, forward/inverse semantic diff, summary, affected IDs, base/result revisions, timestamps.

Opening an exact v1 schema runs one immediate transaction that creates the new tables and sets `PRAGMA user_version = 2`. Existing state bytes and revision remain unchanged. Unknown tables or a corrupt current row still block startup. Retention deletes expired previews and oldest changes until both the 100-row and 64 MiB serialized-journal limits hold.

Snapshots in previews are private short-lived validation material, not browser persistence or public state. They permit exact stale detection and deterministic application without recomputing agent intent. Applied history stores bounded semantic values rather than avatar bytes unless an avatar field actually changed.

### Use typed domain operations, not arbitrary patches

`preview_change` accepts a discriminated union of bounded domain operations. Operations cover Employee CRUD and fields, tags and assignments; Unit CRUD, membership/rules, bosses, hierarchy, positions and geometry; View CRUD, Main-derived or empty creation, local Employees/overrides, structure replacement, and arrangement. Each batch can assign `$ref` names to created objects and reference them later. The engine resolves refs to generated UUIDs, applies operations to a detached state through domain invariants, validates the complete result, and creates a semantic path diff.

All operation schemas use exact keys, input limits, and maximum batch size. A preview is immutable, expires after ten minutes, and binds the exact base revision, reason, actor, resolved IDs, before state, after state, and diff. `apply_change` commits the stored result in one SQLite transaction with one revision increment. Re-applying an already applied preview returns its stored result.

Alternative considered: expose full-state replacement. Rejected because it hides intent, inflates client traffic, weakens summaries, and makes selective undo unsafe.

### Derive selective undo from semantic before/after values

Each diff entry records an entity/path identity plus before and after values. `preview_undo` loads the change, reads current state, and checks every affected path. A path is reversible only when its current value still equals the original change's after value. Independent later paths remain untouched. Any mismatch blocks the entire undo preview and returns a precise bounded conflict summary; partial silent undo is forbidden. A successful undo becomes a normal preview and Apply creates a new journaled change.

Deletion and collection membership use stable entity IDs and keyed semantic paths, so array reordering unrelated to the target does not create an overlap. Full View structure replacement intentionally claims the View structure as one conflict domain.

### Coordinate browser and MCP writes with revisions and server events

`PUT /api/state` includes `expectedRevision`. The server writes only against that revision and returns the new revision plus current state metadata. `/api/state/events` is a no-store server-sent revision stream for local browser tabs; it carries revision and change source only, not organization bytes. On an external revision the browser fetches current server state.

The controller retains the last acknowledged base state. If local and server values changed on disjoint semantic paths, a three-way merge produces one validated state and writes it against the new revision. If paths overlap, persistence pauses and the localized dialog offers Keep local, Use MCP, or Cancel. Keep local writes the local conflicting values over the newest revision while preserving independent server changes; Use MCP accepts server conflicts while preserving independent local changes; Cancel retains memory and unload protection. No branch is chosen silently.

Alternative considered: last-write-wins. Rejected because a broad agent change could silently erase a user's in-progress organization edit.

### Return bounded data and explicit agent guidance

Read collections use cursor pagination capped at 100 items. Overview and analysis are computed from cached validated state and derived maps. Avatar bytes are omitted unless `includeAvatarData` is explicitly true. All tools return structured content with actual revisions and affected IDs; annotations distinguish read-only inspection, non-destructive preview, and destructive Apply.

The bundled `orgtools://guide` resource and three prompts describe domain invariants, the Preview -> Apply contract, safe defaults, and the requirement to report the server-generated summary. Organizational proposals default to a Main-derived custom View; Main changes require explicit user intent. Persisted names, tags, descriptions, and contact fields are wrapped as untrusted data and never concatenated into protocol instructions.

### Keep management UI explicit and server-only

The sidebar receives an MCP action after Export and before language/theme only in server mode. Its compact and expanded geometry matches other actions. The modal initially shows disabled consent and a warning about full local access. Once enabled it provides masked/reveal/copy/rotate token controls, endpoint, bundled setup tabs for supported local clients, example requests, and the latest bounded activity with confirmed Undo.

The copy explains both boundaries: Org Tools talks only to an authenticated local MCP client, while the user-selected agent may send retrieved data to its model provider. Remote web clients are omitted rather than shown as unsupported options.

## Risks / Trade-offs

- **[Broad local authority]** A process that obtains the token can read or change all organization data. -> MCP is disabled by default, loopback-only, bearer-authenticated, visibly disclosed, immediately revocable, and fully journaled.
- **[Token exposure in UI or process configuration]** Revealing or copying a token can leak it. -> Mask by default, never log it, use environment-variable snippets where supported, keep responses no-store, and rotate atomically.
- **[Large state preview cost]** Full validation and snapshots can be expensive at 20,000 Employees. -> Read tools use revision caches and bounded projections; only Preview and Apply serialize the organization; one Apply performs one snapshot and transaction.
- **[Semantic diff defects]** Incorrect paths could make undo unsafe. -> Typed operations, stable IDs, exact before/after values, complete result validation, conflict-all behavior, and dedicated CRUD/undo tests.
- **[Event connection lifecycle]** Development reloads or browser closes can leave subscribers. -> Use process-level bounded subscriber sets, abort-signal cleanup, keep-alives without state payloads, and no remote bind.
- **[Static bundle contamination]** A shared import could pull MCP or Node code into Pages. -> Server-only module boundaries plus static artifact scans and browser network tests fail publication.
- **[SDK protocol evolution]** MCP clients negotiate different supported protocol revisions. -> Pin the v2 SDK, use its supported negotiation, add raw protocol smoke tests, and avoid non-standard response fields.

## Migration Plan

1. Install and pin server-only MCP/schema dependencies.
2. Add schema-v2 migration and repository APIs; verify a v1 fixture retains its exact state and revision.
3. Add typed operation/diff/undo engine, MCP tools/resources/prompts, and secured `/mcp` route.
4. Add revision-aware state writes, revision events, browser three-way reconciliation, and control APIs.
5. Add the optional server-only sidebar action, localized modal, activity, and confirmed undo.
6. Extend tests, documentation, Pages isolation checks, and the deterministic screenshot catalog.
7. Run the full two-runtime validation matrix before archiving and delivery.

Rollback is code-only after deployment: stop the server and restore a database backup taken while stopped. Schema v2 does not alter the v1 singleton row, but older code intentionally rejects unknown current schema v2; therefore downgrading code without restoring a pre-migration database is unsupported.

## Open Questions

None. The endpoint, trust boundary, supported clients, mutation authority, preview lifetime, history bounds, merge choices, and static-runtime exclusion are fixed by the approved plan.
