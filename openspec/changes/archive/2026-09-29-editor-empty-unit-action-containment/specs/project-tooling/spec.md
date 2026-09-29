## ADDED Requirements

### Requirement: Validation covers empty Unit action containment

Repository validation SHALL cover expanded empty manual and Live Units, collapsed geometry, zoomed DOM containment, action accessibility, hierarchy spacing, anchors, and DOM/PNG agreement in both production runtimes. The deterministic gallery SHALL remain exactly 56 PNG files.

#### Scenario: Validate both runtimes
- **WHEN** Server and Pages browser checks render empty manual and Live Units at ordinary and enlarged zoom
- **THEN** every empty-state child remains within its Unit border without clipping external connection or child-Unit controls

#### Scenario: Regenerate maintained screenshots
- **WHEN** the 56-frame gallery is generated twice from unchanged source and fixtures
- **THEN** every PNG passes visual review and both SHA-256 manifests are identical
