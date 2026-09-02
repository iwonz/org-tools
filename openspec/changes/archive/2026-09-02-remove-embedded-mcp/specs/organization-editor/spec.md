## REMOVED Requirements

### Requirement: Applied agent changes update the live organization safely
**Reason**: External agent writes and their live reconciliation are removed.
**Migration**: Interactive edits, Import, and live-tab synchronization continue to update the organization.

### Requirement: Agent operations preserve editor invariants
**Reason**: The agent operation schema is removed with MCP.
**Migration**: Existing editor commands continue to enforce identifiers, hierarchy, membership, geometry, and View isolation.
