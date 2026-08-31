## MODIFIED Requirements

### Requirement: Users manage MCP from a server-only localized modal
Server mode SHALL render one sidebar action labeled MCP after Export and before language and theme
with the same compact and expanded geometry as other actions. Its icon SHALL use the ordinary
sidebar foreground while disabled and semantic green while enabled. The modal title SHALL be MCP and
SHALL provide Enable or Disable, full-access consent, endpoint, masked Reveal/Copy/Rotate controls,
ready-to-paste setup for supported local clients containing the current token, bounded activity, and
confirmed Undo. It SHALL omit an Enabled badge, environment-variable setup step, Examples tab,
provider-notice section, and remote-only web clients.

#### Scenario: Disabled consent
- **WHEN** a server user opens MCP before enabling it
- **THEN** the modal explains full local read/write authority and offers an explicit Enable action without exposing a token

#### Scenario: Enabled sidebar state
- **WHEN** MCP settings report enabled
- **THEN** the sidebar MCP icon is semantic green without a text status badge in the dialog

#### Scenario: Enabled credentials
- **WHEN** MCP is enabled and the user opens setup
- **THEN** the modal shows the local endpoint, a masked token with reveal/copy/rotate controls, and a ready-to-paste configuration containing the current token for the selected client

#### Scenario: Reduced tab set
- **WHEN** the enabled MCP modal opens
- **THEN** it exposes Setup and Activity without an Examples tab or provider-notice section

#### Scenario: Confirmed UI undo
- **WHEN** the user selects Undo on an activity entry and confirms a safe generated preview
- **THEN** the control API applies the inverse as a new audited change and the live interface updates

#### Scenario: Unsafe UI undo
- **WHEN** a selected activity overlaps a later value
- **THEN** the modal shows the localized conflict summary and leaves state unchanged
