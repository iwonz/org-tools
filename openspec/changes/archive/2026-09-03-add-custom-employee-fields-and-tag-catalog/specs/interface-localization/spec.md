## ADDED Requirements

### Requirement: Employee schema and Tag management are completely localized
Both bundled locales SHALL translate model dialogs, field kinds, value types, hashing, requiredness,
option lifecycle, Tag colors, counts, duplicate review columns, validation, accessible names, and
custom filter controls without raw keys or fallback English in Russian UI.

#### Scenario: Audit Russian management surfaces
- **WHEN** localization validation opens Employee model, Tags, Employee form, Import review, filters,
  output settings, and Calendar
- **THEN** every owned visible and accessible string uses the Russian catalog except allowed data and technical names

### Requirement: Calendar navigation and weekdays are localized
Calendar SHALL format weekday headings, Today, month navigation, Tag assignment counts, and empty
states through the active locale while retaining locale-specific week order.

#### Scenario: Switch Calendar locale
- **WHEN** Calendar changes between English and Russian
- **THEN** weekday order, labels, controls, counts, dialogs, and accessible names update in place
