## ADDED Requirements

### Requirement: Dashboard dependencies and screenshots are deterministic
The repository SHALL pin locally bundled compatible Recharts, react-is, and html-to-image packages, validate server and Pages bundles for remote resources, and keep exactly 59 deterministic PNG gallery files. Three maintained Analytics scenarios SHALL show dashboard viewing, builder mode, and PNG preview.

#### Scenario: Generate the gallery twice
- **WHEN** the supported screenshot command runs twice from the same source and fixture
- **THEN** both 59-file PNG sets have identical hashes and contain the three dashboard scenarios

