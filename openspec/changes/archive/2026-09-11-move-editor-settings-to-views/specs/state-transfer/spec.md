## RENAMED Requirements

- FROM: `### Requirement: Complete state requires Unit grouping settings`
- TO: `### Requirement: Complete state requires View settings`

## MODIFIED Requirements

### Requirement: Complete state requires View settings
Every View SHALL contain exact required `structure.settings` with boolean groupByTag and showTagCloud
plus non-null distributedColor and undistributedColor using the existing named or canonical lowercase
six/eight-digit HEX contract. Missing, extra, or invalid settings and obsolete Unit groupByTag SHALL
reject the complete candidate atomically. New Views SHALL default to true, true, green, and amber.
Complete Export and Import SHALL preserve View settings and catalog array order exactly.

#### Scenario: Round-trip grouping
- **WHEN** a complete current state is exported and imported
- **THEN** every View's settings and the global Tag order are preserved

#### Scenario: Reject obsolete grouping shape
- **WHEN** a View lacks valid settings or any Unit retains groupByTag
- **THEN** the complete import fails without changing current state
