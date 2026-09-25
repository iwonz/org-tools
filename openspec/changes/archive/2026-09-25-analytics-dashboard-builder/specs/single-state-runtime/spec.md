## ADDED Requirements

### Requirement: Exact State persists analytics definitions and UI
Organization state SHALL contain required `analyticsDashboards` definitions and durable UI SHALL contain required analytics active dashboard, active tabs, filter values, and drill-down state. The parser MUST enforce discriminated widget shapes, UUID/reference integrity, collection limits, compatible filter targets, and current-only exact keys. Drafts, query results, caches, visibility, SVG, and PNG data MUST remain transient.

#### Scenario: Round trip analytics State
- **WHEN** a valid dashboard State is saved, synchronized, exported, imported, or reopened
- **THEN** definitions and bounded UI state restore exactly while calculated results are rebuilt locally

#### Scenario: Reject the preceding Analytics shape
- **WHEN** State contains the old `ui.analytics.filters/query` shape or omits `organization.analyticsDashboards`
- **THEN** strict validation fails without runtime compatibility conversion

