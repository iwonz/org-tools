## MODIFIED Requirements

### Requirement: Exact State persists analytics definitions and UI
Organization state SHALL contain required singleton `analytics` definitions with exact filter, tab, and data-widget arrays. Durable UI SHALL contain required active tab, filter values keyed by filter ID, and drill-down state. The parser MUST enforce widget/filter discriminators, UUID/reference integrity, collection limits, compatible targets, and root-versus-tab membership. Drafts, results, caches, visibility, SVG, and PNG data MUST remain transient.

#### Scenario: Reject the dashboard collection shape
- **WHEN** State contains `organization.analyticsDashboards`, dashboard or panel definitions, filter widgets, or former active-dashboard/panel-tab UI keys
- **THEN** strict validation fails without runtime compatibility conversion
