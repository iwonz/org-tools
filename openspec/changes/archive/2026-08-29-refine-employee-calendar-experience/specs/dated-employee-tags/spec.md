## ADDED Requirements

### Requirement: Quick Employee tag options remain compact
The quick Employee tag picker SHALL use compact virtualized rows that fit the checkbox, tag label,
and optional date action without clipping or oversized vertical whitespace.

#### Scenario: Tag option density
- **WHEN** the quick tag picker contains multiple labels
- **THEN** each option occupies at most 44 px and its checkbox, label, and date action remain centered,
  visible, and independently actionable

## MODIFIED Requirements

### Requirement: Tag dates are editable in single and bulk workflows
The application SHALL hide optional date controls by default, expose a calendar action beside each
assigned tag, and let the resulting compact popover set, replace, or clear a date in single and bulk
Employee workflows while tag removal remains distinct. The popover SHALL use the local UI-kit
calendar instead of a native date input and SHALL NOT repeat the tag label inside the popover.

#### Scenario: Open date editor
- **WHEN** a user activates the calendar action for an assigned tag
- **THEN** a localized single-date calendar and Clear date action appear
- **AND** no native date input or repeated tag label is rendered

#### Scenario: Add an existing tag in bulk
- **WHEN** a bulk tag toggle adds a label to missing Employees
- **THEN** missing Employees receive the label with a null date and existing Employees retain their current dates

#### Scenario: Apply a bulk date
- **WHEN** selected Employees show mixed dates for one label and the user selects or clears a common date
- **THEN** the same requested date value is applied to every selected Employee carrying the label
