## ADDED Requirements

### Requirement: Complete state requires Unit grouping settings
Every Unit in every View SHALL contain a required boolean `groupByTag`. Missing or non-boolean values SHALL reject the complete candidate atomically. New Units SHALL default to true. Complete Export and Import SHALL preserve the field and catalog array order exactly.

#### Scenario: Round-trip grouping
- **WHEN** a complete current state is exported and imported
- **THEN** per-Unit grouping and global Tag order are preserved

#### Scenario: Reject obsolete grouping shape
- **WHEN** any Unit omits groupByTag or supplies a non-boolean value
- **THEN** the complete import fails without changing current state
