## MODIFIED Requirements

### Requirement: Employee display Markdown remains inert and local
Employee display Markdown SHALL parse and render only in the current browser or loopback runtime.
Raw HTML MUST NOT execute, image or embedded-content syntax MUST NOT create a resource request, and
Employee values MUST NOT be reinterpreted as Markdown. Every ordinary Employee, Unit-context, and
custom token MUST remain plain text unless it is inside an explicit safe Markdown link. Only explicit
activation of an `http:`, `https:`, `mailto:`, or `tel:` Markdown link in an interactive list card
MAY navigate, and web links MUST suppress opener and referrer information. The Unit-name segment of
native `{positions}` MAY navigate internally only in Employees and Units cards. Editor rows, PNG
output, and every fallback card MUST render link appearance or native position styling without
navigation.

#### Scenario: Render remote-looking Markdown
- **WHEN** a format or Employee value contains an image, iframe, script, unsupported URL, or HTML
- **THEN** the application makes no request, executes no embedded content, and keeps organization data local

#### Scenario: Render a plain ordinary token
- **WHEN** a list-card format contains profile, email, position, Unit, or custom data outside an explicit Markdown link
- **THEN** the value remains ordinary text with no navigation target

#### Scenario: Activate a safe list link
- **WHEN** a user explicitly activates an allowed Markdown link in an interactive list Employee card
- **THEN** navigation uses the validated destination with referrer and opener protection while the application sends no background request

#### Scenario: Activate a native Unit segment
- **WHEN** a user activates the Unit-name segment of `{positions}` in an Employees or Units card
- **THEN** only local Unit navigation occurs and no external request is made

#### Scenario: Render a native Unit segment elsewhere
- **WHEN** `{positions}` appears in any Editor, PNG, fallback, picker, catalog, Calendar, Analytics, or drag-preview card
- **THEN** its Unit-name segment has no navigation target
