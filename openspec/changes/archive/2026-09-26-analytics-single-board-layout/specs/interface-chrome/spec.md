## MODIFIED Requirements

### Requirement: Dashboard builder chrome is responsive and accessible
Analytics SHALL provide localized empty, viewing, editing, validation, loading, error, and truncation states for one anonymous board. Filter, tab, and widget controls MUST retain visible focus, keyboard access, accessible names, drag alternatives, and logical RTL order. Dashboard selectors, dashboard lifecycle controls, and panel chrome MUST NOT render.

#### Scenario: Use a narrow RTL viewport
- **WHEN** Analytics renders in Arabic below the maintained grid breakpoint
- **THEN** the active widget grid forms one logical column and filter, tab, and constructor controls follow RTL reading order
