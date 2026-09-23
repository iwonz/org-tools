## ADDED Requirements

### Requirement: Employee display Markdown remains inert and local
Employee display Markdown SHALL parse and render only in the current browser or loopback runtime.
Raw HTML MUST NOT execute, image or embedded-content syntax MUST NOT create a resource request, and
Employee values MUST NOT be reinterpreted as Markdown. Only explicit activation of an `http:`,
`https:`, `mailto:`, or `tel:` link in a list card MAY navigate, and web links MUST suppress opener
and referrer information. Editor rows and PNG output MUST render link appearance without navigation.

#### Scenario: Render remote-looking Markdown
- **WHEN** a format or Employee value contains an image, iframe, script, unsupported URL, or HTML
- **THEN** the application makes no request, executes no embedded content, and keeps organization data local

#### Scenario: Activate a safe list link
- **WHEN** a user explicitly activates an allowed Markdown link in a list Employee card
- **THEN** navigation uses the validated destination with referrer and opener protection while the application sends no background request
