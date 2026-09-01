## MODIFIED Requirements

### Requirement: MCP credentials have an explicit lifecycle
A fresh valid database SHALL initialize MCP disabled with no usable token. The first Enable action
SHALL generate a persistent token containing 256 random bits after the `ot_mcp_` prefix. Disable
SHALL immediately reject MCP requests while retaining the token. Rotate SHALL atomically replace the
token and revoke every unapplied preview. The control interface SHALL mask the token by default and
require explicit actions to reveal or copy it. An explicit enabled or disabled setting SHALL persist
across process restarts and SHALL NOT be reset merely because the local server starts.

#### Scenario: Fresh database
- **WHEN** the local runtime initializes a new empty database
- **THEN** MCP is disabled and no authenticated protocol request can read organization data

#### Scenario: First enable
- **WHEN** the user confirms full-access consent for the first time
- **THEN** MCP becomes enabled with one newly generated token that is not part of application state

#### Scenario: Disable and re-enable
- **WHEN** the user disables and later re-enables MCP without rotating
- **THEN** the same token becomes valid only after re-enable and no organization value changes

#### Scenario: Restart after explicit enablement
- **WHEN** the user enabled MCP and the local runtime restarts against the same valid database
- **THEN** MCP remains enabled with the same token until the user disables or rotates it

#### Scenario: Rotate token
- **WHEN** the user confirms token rotation
- **THEN** the old token and all unapplied previews fail immediately while a new masked token is available
