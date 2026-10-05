## ADDED Requirements

### Requirement: PNG visibility controls are localized and accessible
The application SHALL provide complete bundled English, Russian, Spanish, French, Arabic, and
Simplified Chinese copy for the Tag selector, selection summary, search, bulk actions, empty state,
and **Hide Staffing Slots** checkbox. The selector SHALL support logical-direction placement,
keyboard focus, checkbox activation, Escape dismissal, and virtualized scrolling without relying
on color alone.

#### Scenario: Use the selector in RTL
- **WHEN** an Arabic user opens either PNG dialog and operates the selector with the keyboard
- **THEN** labels and controls follow RTL direction while focus, search, bulk selection, and dismissal remain complete
