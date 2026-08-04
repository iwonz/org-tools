## MODIFIED Requirements

### Requirement: The interface supports English and Russian
The application SHALL provide complete English and Russian translations for every runtime label,
status, empty state, dialog, validation error, accessibility name, tooltip, plural, number, and date
while leaving user-authored and imported content unchanged. Russian UI copy SHALL present Unit as
Team with grammatical declension and Live Unit as Dynamic Team while machine contracts remain
English.

#### Scenario: English interface
- **WHEN** the active locale is English
- **THEN** Save and import references are ordered Teams, Employees, Teams + Employees, Full workspace and every revised surface is English

#### Scenario: Russian interface
- **WHEN** the active locale is Russian
- **THEN** Save and import references use the approved Russian Team, Employee, combined, and complete-workspace labels in that order and every revised surface is Russian

#### Scenario: Localized machine example
- **WHEN** either locale displays a version 2 import interface or JSON example
- **THEN** explanatory copy is localized while machine keys and synthetic user data remain English

#### Scenario: Namespace-safe catalog initialization
- **WHEN** sentence-style typed UI IDs contain period characters
- **THEN** the client provider receives deterministically encoded dot-free keys and initializes without an `INVALID_KEY` console error
- **AND** runtime lookups continue to resolve the original typed IDs in both locales
