## ADDED Requirements

### Requirement: Partial structured imports preserve the complete state contract
The application SHALL build a partial import as a detached `OrgToolsStateV1` candidate, preserve the
existing complete-state schema and current UI/View records, and load only a candidate that passes the
same strict parser used for opened workspace files.

#### Scenario: Partial import candidate
- **WHEN** a valid structured import is merged with a current workspace
- **THEN** the resulting saved workspace remains a valid unchanged-version `org-tools-state` document

#### Scenario: Complete workspace open
- **WHEN** a valid `org-tools-state` file is selected through the revised import dialog
- **THEN** it continues to replace the workspace atomically rather than entering the partial merge path
