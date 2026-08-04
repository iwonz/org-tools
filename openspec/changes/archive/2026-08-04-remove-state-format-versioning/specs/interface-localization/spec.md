## MODIFIED Requirements

### Requirement: Locale is independent of workspace state
The application SHALL keep locale outside the single current `OrgToolsState` contract and SHALL NOT translate persisted tag labels, organization content, export keys, machine values, ISO dates, or filenames.

#### Scenario: Open a workspace in Russian
- **WHEN** a Russian-interface user opens an English-authored workspace containing dated tags
- **THEN** the interface and displayed date formatting remain Russian while tag labels and serialized contracts remain unchanged

#### Scenario: Obsolete contract error
- **WHEN** a selected state or structured file contains obsolete version fields
- **THEN** the localized error describes an unsupported file shape without recommending an older numbered schema
