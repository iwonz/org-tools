## MODIFIED Requirements

### Requirement: Enabled MCP preserves a disclosed local trust boundary
The local server SHALL disclose organization data only to a bearer-authenticated MCP client over
loopback after explicit Enable consent. It MUST NOT bind remotely, enable CORS, create a tunnel,
load remote setup content, log tokens or state, or include MCP credentials, live credential-bearing
setup prompts, previews, or activity in Import, Export, browser storage, Pages, screenshots, or
commits. The
full-access consent SHALL remain visible before Enable; detailed model-provider and copied-token
trust boundaries SHALL remain in bundled documentation without requiring a visible provider notice
or title description in the modal. Org Tools itself MUST NOT run the setup prompt or contact its
skill source.

#### Scenario: Local authenticated disclosure
- **WHEN** the user enables MCP and an authenticated local client calls a read tool
- **THEN** requested bounded organization data travels only from SQLite runtime to that loopback client

#### Scenario: Transient setup prompt
- **WHEN** the enabled modal generates or copies setup for a selected client
- **THEN** the current endpoint and token exist only in component memory and the user-activated clipboard and are not persisted or sent by Org Tools

#### Scenario: Token or history export
- **WHEN** application state is exported or imported
- **THEN** the public state contains no MCP enablement, token, setup prompt, preview, actor, activity, or revision metadata

#### Scenario: Remote request
- **WHEN** a non-loopback or cross-origin client attempts MCP or control access
- **THEN** it receives no organization data, credential, or permissive CORS response

#### Scenario: Bundled trust documentation
- **WHEN** a user reviews MCP documentation
- **THEN** it distinguishes Org Tools' loopback boundary from the selected agent's possible model-provider transmission and treats copied setup text as a credential
