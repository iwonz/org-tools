## MODIFIED Requirements

### Requirement: Unit Markdown cannot create background disclosure
Unit note rendering SHALL remain inside the authenticated self-hosted application. Raw HTML MUST NOT
execute, image syntax MUST NOT create a resource request, and no renderer plugin may fetch, embed,
log, or transmit note content. Allowed links SHALL require explicit activation and SHALL suppress
opener and referrer information.

#### Scenario: Preview remote-looking content
- **WHEN** a note includes remote image, iframe, script, or HTML syntax
- **THEN** the application makes no request, executes no embedded content, and keeps the source
  inside the authenticated application

#### Scenario: Render an authorized note
- **WHEN** the server projection includes a Unit note and the browser renders it
- **THEN** no remote asset, telemetry, browser snapshot persistence, or background third-party
  request is created

### Requirement: Distribution analysis remains local
Distribution indexes, status, selection, and paths SHALL be derived only from the authorized active
View in browser memory and MUST NOT create third-party requests, telemetry, remote logging, browser
snapshot storage, or new report fields.

#### Scenario: Inspect distribution
- **WHEN** the Editor highlights and connects an Employee's authorized placements
- **THEN** the workflow completes from the current projection without an external request or
  organization mutation
