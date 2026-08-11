## MODIFIED Requirements

### Requirement: Save offers complete and structured partial documents
The application SHALL expose a localized header Export action with a document-download icon, open an
Export workspace dialog ordered Teams, Employees, Teams + Employees, and Full workspace, default to
Full workspace, and download the chosen strictly validated `OrgToolsState` only after explicit
confirmation. A successful download SHALL close the dialog without creating a global success notice.

#### Scenario: Open Save dialog
- **WHEN** a user activates the header Export action by its visible label or accessible icon-only control
- **THEN** no file is downloaded until the Export workspace dialog displays the four choices and the user confirms one

#### Scenario: Empty data option
- **WHEN** a partial choice has none of the data named by that choice
- **THEN** that choice is disabled while Full workspace remains available

#### Scenario: Successful workspace download
- **WHEN** the browser accepts a confirmed workspace download
- **THEN** the Export workspace dialog closes without rendering a global downloaded-file notice
