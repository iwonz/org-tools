## ADDED Requirements

### Requirement: Public showcase cannot receive organization data
The public showcase SHALL be a non-interactive static documentation artifact with no application
runtime, project endpoint, writable form, browser persistence, external asset request, telemetry, or
mechanism for opening, importing, saving, or exporting organization data.

#### Scenario: Public network audit
- **WHEN** a visitor opens and browses the generated Pages artifact
- **THEN** it loads only same-site generated HTML and synthetic screenshot files and sends no
  organization data, interaction data, or background request to another service

#### Scenario: Local application boundary remains unchanged
- **WHEN** a visitor follows the showcase's usage guidance
- **THEN** the functional application is started separately on loopback with its configured local
  SQLite database, and GitHub Pages is not part of the organization-data path
