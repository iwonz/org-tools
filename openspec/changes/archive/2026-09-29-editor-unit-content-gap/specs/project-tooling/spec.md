## ADDED Requirements

### Requirement: Validation covers compact Unit content spacing

Repository validation SHALL cover one-line and two-line Unit summaries, Employees, Staffing Slots, Manual and Live empty states, collapsed geometry, zoomed DOM spacing, hierarchy placement, anchors, and DOM/PNG agreement in both production runtimes. The deterministic gallery SHALL remain exactly 56 PNG files.

#### Scenario: Validate both runtimes
- **WHEN** Server and Pages browser checks render Units with one or two summary lines at ordinary and enlarged zoom
- **THEN** the last summary line and following content use the same eight-pixel interval while row geometry, empty-state containment, and external controls remain correct

#### Scenario: Regenerate maintained screenshots
- **WHEN** the 56-frame gallery is generated twice from unchanged source and fixtures
- **THEN** every PNG passes visual review and both SHA-256 manifests are identical
