## MODIFIED Requirements

### Requirement: Dashboard dependencies and screenshots are deterministic
The repository SHALL keep exactly 59 deterministic PNG gallery files. Three maintained Analytics scenarios SHALL show singleton board viewing, flattened constructor mode, and widget-grid PNG preview without dashboard selectors or panel chrome.

#### Scenario: Generate the gallery twice
- **WHEN** the supported screenshot command runs twice from the same source and fixture
- **THEN** both 59-file PNG sets have identical hashes and contain the three singleton-board scenarios
