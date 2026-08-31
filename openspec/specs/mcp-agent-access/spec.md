# mcp-agent-access Specification

## Purpose
Define secure local agent access, bounded organization tools, reviewed mutations, and auditable recovery.
## Requirements
### Requirement: MCP transport is explicitly enabled and local-only
The local SQLite runtime SHALL expose a stateless Streamable HTTP MCP endpoint at `/mcp` that is
disabled by default. The endpoint MUST accept only JSON POST requests with a loopback Host, an
absent or matching loopback Origin, and a valid bearer token while returning no CORS headers and
supporting no GET, legacy SSE, tunnel, remote bind, or static Pages transport.

#### Scenario: Disabled endpoint
- **WHEN** a local client sends an otherwise valid MCP request before the user enables access
- **THEN** the endpoint rejects it with no organization data or protocol result

#### Scenario: Authenticated loopback request
- **WHEN** an enabled endpoint receives a JSON POST with a valid loopback boundary and current token
- **THEN** it negotiates a supported MCP protocol revision and returns a no-store protocol response

#### Scenario: Invalid transport boundary
- **WHEN** Host is non-loopback, Origin is mismatched, authorization is missing or invalid, the
  method is GET, or the request attempts CORS
- **THEN** the request is rejected before protocol arguments or organization state are processed

#### Scenario: Static runtime
- **WHEN** the GitHub Pages application is built or used
- **THEN** it contains no MCP route, control, token, server SDK, SQLite dependency, or MCP network call

### Requirement: MCP credentials have an explicit lifecycle
The first Enable action SHALL generate a persistent token containing 256 random bits after the
`ot_mcp_` prefix. Disable SHALL immediately reject MCP requests while retaining the token. Rotate
SHALL atomically replace the token and revoke every unapplied preview. The control interface SHALL
mask the token by default and require explicit actions to reveal or copy it.

#### Scenario: First enable
- **WHEN** the user confirms full-access consent for the first time
- **THEN** MCP becomes enabled with one newly generated token that is not part of application state

#### Scenario: Disable and re-enable
- **WHEN** the user disables and later re-enables MCP without rotating
- **THEN** the same token becomes valid only after re-enable and no organization value changes

#### Scenario: Rotate token
- **WHEN** the user confirms token rotation
- **THEN** the old token and all unapplied previews fail immediately while a new masked token is available

### Requirement: MCP reads are complete, paginated, and bounded
The server SHALL provide `get_domain_guide`, `get_organization_overview`, `list_views`,
`get_view_structure`, `list_units`, `get_unit`, `search_employees`, `get_employee`,
`analyze_team_composition`, `list_changes`, and `get_change`. Collection results MUST use cursor
pagination with a maximum of 100 records. Employee fields SHALL be complete except that avatar bytes
MUST be omitted unless `includeAvatarData` is explicitly true.

#### Scenario: Bounded collection read
- **WHEN** an agent requests a collection with an omitted or excessive limit
- **THEN** the response contains at most 100 records and a stable continuation cursor when more exist

#### Scenario: Employee without avatar bytes
- **WHEN** an agent reads or searches Employees without explicitly requesting avatar data
- **THEN** all permitted Employee fields and avatar presence metadata are returned without the data URL bytes

#### Scenario: Composition analysis
- **WHEN** an agent analyzes all or selected Units or a View
- **THEN** the server returns bounded derived counts and distributions from the current revision without mutating state

### Requirement: Every agent mutation uses Preview then Apply
The server SHALL expose `preview_change(expectedRevision, reason, operations)` and
`apply_change(previewId)`. Preview MUST resolve temporary references, validate exact typed
operations and the complete detached result, and return a server-generated semantic diff without
changing current state. A preview SHALL expire after ten minutes and bind its exact base revision.
Apply MUST atomically commit only that stored preview, increment the state revision exactly once,
and return a change ID, actual summary, affected IDs, and base and result revisions.

#### Scenario: Valid preview
- **WHEN** exact operations produce a valid complete organization at the expected revision
- **THEN** the server stores an immutable preview and returns its bounded diff while current state and revision remain unchanged

#### Scenario: Invalid or stale preview
- **WHEN** operations are invalid, references do not resolve, the expected revision is stale, or the result violates an invariant
- **THEN** no preview capable of Apply is produced and current state remains unchanged

#### Scenario: Atomic apply
- **WHEN** an unexpired preview still matches its base revision and the agent applies it
- **THEN** its complete result and activity record commit in one transaction with one revision increment

#### Scenario: Idempotent reapply
- **WHEN** an agent applies a preview that was already applied successfully
- **THEN** the server returns the original change result without another state write or revision increment

#### Scenario: Expired preview
- **WHEN** Apply targets an unapplied preview more than ten minutes after creation
- **THEN** it is rejected without mutation and must be previewed again

### Requirement: Typed operations cover the complete organization domain
Preview operations SHALL cover complete Employee CRUD, fields, tags and assignments; Unit CRUD,
manual and Live membership, bosses, hierarchy, positions and geometry; Main and custom View CRUD,
View-local Employees and overrides, structure replacement, and arrangement. A batch MAY assign
temporary refs to newly created entities and use those refs in later operations; the server SHALL
replace them with stable UUIDs atomically. Arbitrary code, SQL, JSON Patch, and unvalidated full-state
replacement MUST NOT be accepted.

#### Scenario: Related batch creation
- **WHEN** one preview creates an Employee and Unit with temporary refs and assigns the Employee to that Unit
- **THEN** the returned diff and later Apply use server-generated stable IDs with all references valid

#### Scenario: View planning default
- **WHEN** an agent prepares an organizational proposal without an explicit request to change Main
- **THEN** the domain guide and planning prompt direct it to create a Main-derived custom View

#### Scenario: Explicit Main edit
- **WHEN** the user explicitly requests a Main organization change and the agent submits valid Main operations
- **THEN** Preview and Apply support that change under the same validation and audit rules

### Requirement: MCP changes are auditable and selectively reversible
Every Apply SHALL journal the bounded actor, reason, semantic forward and inverse values, actual
summary, affected IDs, and revisions. The journal SHALL retain at most 100 newest changes and at
most 64 MiB. `preview_undo(changeId)` SHALL prepare a normal inverse preview only when every affected
current value still equals that change's applied value; it SHALL preserve later independent values
and SHALL block the entire undo on an overlapping value with an exact bounded conflict summary.

#### Scenario: Independent later change
- **WHEN** a later change modifies a field outside the selected change's affected semantic paths
- **THEN** undo preview preserves that later field and reverses only the selected change values

#### Scenario: Overlapping later change
- **WHEN** a later user or agent edit changes a semantic path affected by the selected change
- **THEN** undo preview is not created and the response identifies the conflicting entity and field without mutating state

#### Scenario: Retention limit
- **WHEN** the journal exceeds 100 entries or 64 MiB after Apply
- **THEN** oldest entries are removed until both limits hold while current state remains unchanged

### Requirement: MCP publishes guidance, prompts, and honest tool annotations
The server SHALL publish `orgtools://guide` and the prompts `analyze_team_composition`,
`plan_reorganization`, and `undo_agent_change`. Guidance SHALL describe domain invariants,
Preview -> explicit user approval -> Apply, Main-versus-custom-View defaults, and the requirement to
report the server's actual Apply summary. Tool annotations MUST distinguish read-only inspection,
non-mutating Preview, and destructive Apply. Persisted names, tags, contact fields, and other
organization values MUST always be represented as untrusted data rather than protocol instructions.

#### Scenario: Agent discovers guidance
- **WHEN** a compatible client lists resources, prompts, and tools
- **THEN** it receives bundled current guidance and accurate read-only or destructive annotations without a network fetch

#### Scenario: Apply approval boundary
- **WHEN** an agent has created a valid mutation or undo preview
- **THEN** current guidance requires it to present the exact diff and wait for explicit user approval before Apply

#### Scenario: Apply result reporting
- **WHEN** an agent successfully applies a preview
- **THEN** the result explicitly instructs it to report the actual server summary, affected IDs, change ID, and revisions to the user

### Requirement: Users manage MCP from a server-only localized modal
Server mode SHALL render one sidebar action labeled MCP after Export and before language and theme
with the same compact and expanded geometry as other actions. Its icon SHALL use the ordinary
sidebar foreground while disabled and a defined semantic green token while enabled in both themes
and every hover, active, open, compact, or expanded state. The modal title SHALL be MCP and SHALL
provide Enable or Disable, full-access consent, endpoint, masked Reveal/Copy/Rotate controls, a
copyable setup prompt for supported local clients containing the current endpoint and token, bounded
activity, and confirmed Undo. It SHALL omit a visible title description, Enabled badge,
environment-variable setup step, raw standalone configuration block, Examples tab, provider-notice
section, and remote-only web clients while retaining a localized hidden dialog description.

#### Scenario: Disabled consent
- **WHEN** a server user opens MCP before enabling it
- **THEN** the modal explains full local read/write authority and offers an explicit Enable action without exposing a token

#### Scenario: Enabled sidebar state
- **WHEN** MCP settings report enabled
- **THEN** computed icon color is semantic green across themes and interaction states without a text status badge in the dialog

#### Scenario: Enabled credentials
- **WHEN** MCP is enabled and the user opens setup
- **THEN** the modal shows the local endpoint, a masked token with reveal/copy/rotate controls, and one copyable setup prompt containing the current endpoint and token for the selected client

#### Scenario: Rotated prompt
- **WHEN** the user rotates the MCP token
- **THEN** the displayed prompt immediately contains only the new token and the previous copied prompt can no longer authenticate

#### Scenario: Reduced visible header and tabs
- **WHEN** the enabled MCP modal opens
- **THEN** it exposes Setup and Activity with no visible title description, raw configuration section, Examples tab, or provider-notice section

#### Scenario: Confirmed UI undo
- **WHEN** the user selects Undo on an activity entry and confirms a safe generated preview
- **THEN** the control API applies the inverse as a new audited change and the live interface updates

#### Scenario: Unsafe UI undo
- **WHEN** a selected activity overlaps a later value
- **THEN** the modal shows the localized conflict summary and leaves state unchanged
