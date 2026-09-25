## ADDED Requirements

### Requirement: Dashboard builder copy is complete in six locales
All dashboard, panel, tab, widget, dataset, query, aggregation, filter, drill-down, export, validation, accessibility, empty, loading, error, and truncation messages SHALL exist in English, Russian, Chinese, Spanish, French, and Arabic catalogs without obsolete fixed-Analytics keys.

#### Scenario: Validate all catalogs
- **WHEN** localization completeness checks run
- **THEN** every maintained locale has the same dashboard key set and no removed fixed-report key remains

