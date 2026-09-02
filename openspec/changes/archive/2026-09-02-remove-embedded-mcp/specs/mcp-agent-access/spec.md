## REMOVED Requirements

### Requirement: MCP transport is explicitly enabled and local-only
**Reason**: Org Tools no longer exposes an agent protocol or transport endpoint.
**Migration**: Use the interactive application and explicit state Import or Export.

### Requirement: MCP credentials have an explicit lifecycle
**Reason**: Agent authentication and MCP access are removed.
**Migration**: Existing owned token metadata is deleted with the MCP tables.

### Requirement: MCP reads are complete, paginated, and bounded
**Reason**: Agents can no longer read organization data through Org Tools.
**Migration**: Inspect data in the application or through an explicit exported state file.

### Requirement: Every agent mutation uses Preview then Apply
**Reason**: Agent mutation tools are removed.
**Migration**: Make reviewed changes through the interactive editor or Import.

### Requirement: Typed operations cover the complete organization domain
**Reason**: The typed agent-operation contract is removed with MCP.
**Migration**: Use the existing application commands and unchanged `OrgToolsState` transfer contract.

### Requirement: MCP changes are auditable and selectively reversible
**Reason**: MCP activity and selective Undo no longer exist.
**Migration**: Use the editor's existing local command history where available.

### Requirement: MCP publishes guidance, prompts, and honest tool annotations
**Reason**: Protocol resources and prompts are removed.
**Migration**: No agent-facing replacement is provided.

### Requirement: Users manage MCP from a server-only localized modal
**Reason**: The MCP control and all credential/setup UI are removed.
**Migration**: The sidebar footer contains only Import, Export, language, and theme.
