## REMOVED Requirements

### Requirement: Exact State persists analytics definitions and UI
**Reason**: Analytics definitions and durable interaction State are removed from the product.
**Migration**: The owned SQLite row is converted once; other old Analytics-bearing State is rejected by the current exact parser.

## ADDED Requirements

### Requirement: Exact State excludes removed Analytics data
Organization and durable UI State MUST omit Analytics definitions and interaction data. The exact parser MUST reject `organization.analytics`, `ui.analytics`, and `analytics` as an active product tab without runtime conversion.

#### Scenario: Reject an Analytics-bearing State
- **WHEN** imported, synchronized, or API-written State contains an Analytics organization key, Analytics UI key, or Analytics active tab
- **THEN** strict validation rejects the complete candidate without changing current State
