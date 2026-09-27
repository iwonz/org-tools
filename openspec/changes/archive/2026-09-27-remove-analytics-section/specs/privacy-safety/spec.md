## MODIFIED Requirements

### Requirement: Organization data remains local
The application SHALL transmit state only between the local-server page and its loopback same-origin
singleton state API. Pages SHALL process state only in current page memory, live same-origin tab
messages, explicit Import, and explicit Export. Neither runtime SHALL transmit organization data,
durable UI, candidates, tag dates, events, avatars, searches or exports to a third party
or non-loopback service. State snapshots SHALL remain out of cookies, IndexedDB, local storage,
session storage, and Cache Storage. The browser MAY persist only bounded locale and theme bootstrap
metadata, and the local database MAY persist the validated singleton state.

#### Scenario: Core workflow network audit
- **WHEN** either runtime loads, imports, edits, searches, renders, synchronizes tabs, or
  exports
- **THEN** requests contain no third-party organization data and are limited to assets plus the
  loopback singleton API in server mode

#### Scenario: Singleton database persistence
- **WHEN** a valid organization or UI projection changes in server mode
- **THEN** it is written only to the configured local SQLite database and not copied to browser
  storage, logs, telemetry, or another service

#### Scenario: Pages tab synchronization
- **WHEN** Pages initializes or updates state with live same-origin peers
- **THEN** bytes use only in-memory BroadcastChannel messages and disappear after the final tab closes

#### Scenario: Preference persistence
- **WHEN** locale or theme changes
- **THEN** local storage contains only bounded bootstrap identifiers and no organization or other
  durable UI snapshot

#### Scenario: Candidate validation failure
- **WHEN** any imported, exported, synchronized, or API-written state fails strict validation
- **THEN** current state and its durable destination remain unchanged

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
- **WHEN** `{positions}` appears in any Editor, PNG, fallback, picker, catalog, Calendar, or drag-preview card
- **THEN** its Unit-name segment has no navigation target

## REMOVED Requirements

### Requirement: Analytics calculation and image capture stay local
**Reason**: Analytics calculation, charting, drill-down, and image capture are removed.
**Migration**: The general local-only and no-third-party guarantees continue to cover every remaining workflow.
