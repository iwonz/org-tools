## ADDED Requirements

### Requirement: Unit Markdown cannot create background disclosure
Unit note rendering SHALL remain entirely local. Raw HTML MUST NOT execute, image syntax MUST NOT
create a resource request, and no renderer plugin may fetch, embed, log, or transmit note content.
Allowed links SHALL require explicit activation and SHALL suppress opener and referrer information.

#### Scenario: Preview remote-looking content
- **WHEN** a note includes remote image, iframe, script, or HTML syntax
- **THEN** the application makes no request, executes no embedded content, and keeps the source local

#### Scenario: Render a note in Pages
- **WHEN** Pages previews a note
- **THEN** no server module, state API, remote asset, telemetry, or browser snapshot persistence is used
