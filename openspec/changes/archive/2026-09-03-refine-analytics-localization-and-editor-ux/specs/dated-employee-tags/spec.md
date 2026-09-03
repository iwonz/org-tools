## ADDED Requirements

### Requirement: Dated-event surfaces follow the active writing direction
Calendar Tag rails, event headings, Employee rows, and day dialogs SHALL use the active locale and
writing direction while preserving Tag and Employee data verbatim. Arabic mirroring MUST NOT change
event grouping, date identity, or interaction results.

#### Scenario: Open Arabic day events
- **WHEN** Arabic is active and a populated Calendar date opens
- **THEN** owned labels and layout are RTL while Tag labels, Employee identities, and actions remain intact
