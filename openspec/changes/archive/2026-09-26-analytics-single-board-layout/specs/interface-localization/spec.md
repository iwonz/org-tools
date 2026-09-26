## MODIFIED Requirements

### Requirement: Dashboard builder copy is complete in six locales
All singleton Analytics, filter, tab, widget, query, drill-down, export, validation, accessibility, empty, loading, error, and truncation messages SHALL exist in all six catalogs. Obsolete dashboard collection and panel lifecycle messages MUST be removed.

#### Scenario: Validate all catalogs
- **WHEN** localization completeness checks run
- **THEN** every maintained locale has the same Analytics key set without obsolete dashboard or panel actions
