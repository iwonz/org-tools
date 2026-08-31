## MODIFIED Requirements

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
- **WHEN** an agent successfully applies an approved preview
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
