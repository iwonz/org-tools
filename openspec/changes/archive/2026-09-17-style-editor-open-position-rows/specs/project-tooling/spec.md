## ADDED Requirements

### Requirement: Gallery verifies open-position vacancy styling

The maintained deterministic Editor gallery SHALL show the complete dashed open-position row in the
live canvas and applicable Image-export previews without adding a screenshot scenario. The style
MUST remain visible at the maintained capture size and MUST NOT alter Employee-row presentation.

#### Scenario: Regenerate vacancy evidence
- **WHEN** the 59-frame gallery is generated twice from unchanged source and fixtures
- **THEN** affected Editor and Image-export frames show the reviewed dashed vacancy outline, every
  PNG passes visual inspection, and both SHA-256 manifests are identical
