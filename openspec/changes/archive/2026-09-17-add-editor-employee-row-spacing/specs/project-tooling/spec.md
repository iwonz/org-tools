## ADDED Requirements

### Requirement: Validation covers Editor Unit row spacing

Unit and browser validation SHALL cover first, middle, and last Employee/open-position rows,
variable Tag heights, virtualization, collapse, attachments, DOM/PNG agreement, and both production
runtimes. The deterministic gallery SHALL retain its existing 59 scenarios while showing the revised
row rhythm in current Editor frames.

#### Scenario: Validate both runtimes
- **WHEN** Server and Pages browser checks inspect a mixed expanded Unit
- **THEN** computed row bounds contain only interior four-pixel intervals and interaction geometry remains aligned

#### Scenario: Regenerate Editor evidence
- **WHEN** the 59-frame gallery is generated twice from unchanged source and fixtures
- **THEN** affected Editor and Image-export frames show the revised spacing and both SHA-256 manifests match
