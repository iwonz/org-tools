## ADDED Requirements

### Requirement: Enabled MCP preserves a disclosed local trust boundary
The local server SHALL disclose organization data only to a bearer-authenticated MCP client over
loopback after explicit Enable consent. It MUST NOT bind remotely, enable CORS, create a tunnel,
load remote setup content, log tokens or state, or include MCP credentials, previews, or activity in
Import, Export, browser storage, or Pages. The modal SHALL explain that the selected local agent may
send retrieved values to its own model provider after receiving them.

#### Scenario: Local authenticated disclosure
- **WHEN** the user enables MCP and an authenticated local client calls a read tool
- **THEN** requested bounded organization data travels only from SQLite runtime to that loopback client

#### Scenario: Token or history export
- **WHEN** application state is exported or imported
- **THEN** the public state contains no MCP enablement, token, preview, actor, activity, or revision metadata

#### Scenario: Remote request
- **WHEN** a non-loopback or cross-origin client attempts MCP or control access
- **THEN** it receives no organization data, credential, or permissive CORS response

#### Scenario: Agent-provider warning
- **WHEN** the user reviews consent or setup instructions
- **THEN** the interface distinguishes Org Tools' loopback boundary from the selected agent's possible model-provider transmission
