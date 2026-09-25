## ADDED Requirements

### Requirement: Dashboard builder chrome is responsive and accessible
Analytics SHALL provide localized empty, viewing, editing, validation, loading, error, and truncation states with visible focus, keyboard access, accessible names, and logical RTL order. Dialogs, menus, tabs, grids, drag handles, and reorder controls MUST remain operable without a pointer.

#### Scenario: Open empty Analytics
- **WHEN** State contains no dashboards
- **THEN** Analytics shows one clear create action without rendering placeholder metrics

#### Scenario: Use a narrow RTL viewport
- **WHEN** Analytics renders in Arabic below the maintained grid breakpoint
- **THEN** panels and widgets form one logical column and controls follow RTL reading order

