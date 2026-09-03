## ADDED Requirements

### Requirement: Shared Tag filters support bulk selection
Every shared Employee Tag filter, including Live Unit rules, SHALL expose Select all and Deselect all
actions alongside the independent Without tags option. Select all SHALL select every currently
available Tag exactly once in catalog order, and Deselect all SHALL clear every selected Tag. Both
actions MUST leave Without tags unchanged and MUST produce one logical filter update.

#### Scenario: Select every Tag
- **WHEN** at least one available Tag is not selected and the user activates Select all
- **THEN** every available Tag becomes selected in one update while Without tags keeps its current value

#### Scenario: Deselect every Tag
- **WHEN** one or more Tags are selected and the user activates Deselect all
- **THEN** the selected Tag list becomes empty in one update while Without tags keeps its current value

#### Scenario: Use a complete selection
- **WHEN** every available Tag is already selected
- **THEN** Select all is disabled while Deselect all remains available

#### Scenario: Use an empty selection
- **WHEN** no Tag is selected
- **THEN** Deselect all is disabled and Select all remains available when Tags exist

#### Scenario: Use a large Tag catalog
- **WHEN** the filter exposes many Tags through its virtualized list
- **THEN** either bulk action operates on the complete option set rather than only mounted rows
