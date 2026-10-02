## ADDED Requirements

### Requirement: Administration grants have deterministic order
Administration account and role read models SHALL return permission grants ordered by permission and scope so equivalent PostgreSQL contents produce the same API and visual presentation across clean instances.

#### Scenario: Equivalent grant sets from clean databases
- **WHEN** two clean instances contain the same role or account grant set
- **THEN** their Administration responses and rendered grant order are identical
