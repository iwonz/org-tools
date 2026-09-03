## ADDED Requirements

### Requirement: Gallery verifies compact Unit Tag footers
The maintained Editor screenshots SHALL show content-sized direct-Tag footer chips with equal compact
insets and without a large empty trailing area. Screenshot generation SHALL retain the existing 52
declared scenarios.

#### Scenario: Regenerate Editor frames
- **WHEN** the deterministic gallery is generated twice from unchanged source
- **THEN** affected Editor frames show compact evenly inset footer chips and all 52 PNG hashes match between runs
