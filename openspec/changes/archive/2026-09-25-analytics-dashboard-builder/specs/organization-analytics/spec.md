## REMOVED Requirements

### Requirement: Analytics reports known birth years and completed ages
**Reason**: Fixed birth-year and age reports are replaced by configurable dashboard widgets and typed current-date queries.
**Migration**: Recreate desired summaries as KPI, table, or chart widgets.

### Requirement: Age cohorts expose deterministic summaries
**Reason**: Fixed all/male/female age cohorts are replaced by configurable dimensions and filters.
**Migration**: Configure gender filters and birthday measures on dashboard widgets.

### Requirement: Analytical drill-down uses current actionable Employee cards
**Reason**: Drill-down is generalized to every chart and table result in the dashboard builder.
**Migration**: Use the dashboard drill-down contract.

### Requirement: Analytics content avoids duplicate chrome
**Reason**: The fixed Analytics body no longer exists.
**Migration**: Dashboard chrome and empty state are specified by the builder capability.

### Requirement: Analytics remains bound to the system View
**Reason**: Every widget now explicitly selects its source View.
**Migration**: Existing State receives no default dashboard; users choose a View per widget.

