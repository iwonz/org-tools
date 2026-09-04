## MODIFIED Requirements

### Requirement: Shared Tag filters support bulk selection
Every shared Employee Tag filter, including Live Unit rules, SHALL expose a transient search field,
locale-aware alphabetic option ordering, Select all and Deselect all actions, and the independent
Without tags option. Search SHALL match normalized Tag labels without case or diacritic sensitivity
and SHALL keep the option list virtualized. Select all SHALL add every currently visible Tag exactly
once while preserving selected Tags outside the query. Deselect all SHALL remove every currently
visible Tag while preserving selections outside the query. Both actions MUST leave Without tags
unchanged and MUST produce one logical filter update.

#### Scenario: Search a large Tag catalog
- **WHEN** the user enters part of a Tag label
- **THEN** the virtualized list shows matching Tags in locale-aware alphabetic order without changing selection

#### Scenario: Select found Tags
- **WHEN** at least one visible Tag is not selected and the user activates Select all
- **THEN** every visible Tag becomes selected in one update while hidden selections and Without tags remain unchanged

#### Scenario: Deselect found Tags
- **WHEN** one or more visible Tags are selected and the user activates Deselect all
- **THEN** only visible Tag IDs are removed in one update while hidden selections and Without tags remain unchanged

#### Scenario: Use bulk actions without a query
- **WHEN** the search field is empty
- **THEN** Select all and Deselect all operate on the complete sorted Tag catalog rather than mounted rows

#### Scenario: Reopen the filter
- **WHEN** the filter popover closes and opens again
- **THEN** the transient Tag query is empty while persisted filter selections remain intact
