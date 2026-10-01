# privacy-safety Specification

## Purpose
Define the browser data boundary, publication safeguards, and explicit external navigation rules.
## Requirements
### Requirement: Public artifacts use general safety checks
The repository SHALL validate tracked and generated artifacts for portable paths, secrets,
unexpected language, unsupported media, generated caches, and obsolete public contracts through
general project rules.

#### Scenario: Publication scan
- **WHEN** the public-safety check scans tracked files and the production build
- **THEN** a general artifact or contract violation causes a failing exit code without embedding
  project-origin-specific policy

### Requirement: External contact actions are explicit
The application SHALL open persisted profile links and mail links only after a user action with
referrer protections.

#### Scenario: Profile navigation
- **WHEN** a user activates a valid Employee profile link
- **THEN** it opens separately with `noopener`, `noreferrer`, and no referrer

### Requirement: Custom field computation remains local
Custom field computation SHALL keep custom values, template dependencies, distinct filter values,
MD5/SHA-256 hashing, Import mapping, and output generation only in browser memory or the loopback
same-origin runtime. It SHALL NOT add remote requests, telemetry, or browser snapshot storage.

#### Scenario: Compute a custom digest
- **WHEN** a user previews, copies, or downloads a hashed custom field
- **THEN** the clear value and digest remain within the current local runtime

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

### Requirement: Distribution analysis remains local
Distribution indexes, status, selection, and paths SHALL be derived only from the active in-memory
View and MUST NOT create network requests, telemetry, remote logging, browser snapshot storage, or
new report fields.

#### Scenario: Inspect distribution in Pages
- **WHEN** Pages highlights and connects an Employee's placements
- **THEN** the workflow completes in live-tab memory without an API or external request

### Requirement: Editor clipboard ownership markers disclose no organization data
Editor structural Copy SHALL keep complete clipboard content only in current-tab memory. The system
clipboard marker MAY contain a random token and fixed format identifier but MUST NOT contain Unit,
Employee, Tag, canvas, View, organization, or State content. The token MUST NOT enter persistent
State, SQLite, BroadcastChannel, browser storage, logs, URLs, exports, or network requests and MUST
be invalid without an exact matching in-memory Editor clipboard.

#### Scenario: Inspect a structural clipboard marker
- **WHEN** selected Editor content is copied through keyboard or context-menu action
- **THEN** the system clipboard contains only an opaque ownership marker while the structural payload remains in current-tab memory

#### Scenario: Load complete State
- **WHEN** complete State replacement clears the transient Editor clipboard
- **THEN** any older system marker cannot paste or recover the removed payload

### Requirement: Canvas images remain local and bounded
Canvas Image insertion SHALL occur only after explicit file selection or image clipboard paste and
SHALL accept only bounded embedded PNG, JPEG, or WebP bytes. The application MUST NOT fetch a canvas
image URL, upload an input or generated image, include remote asset references, or persist temporary
object URLs. Adding an image SHALL fail atomically when its validated dimensions or resulting
complete State exceed an established bound.

#### Scenario: Insert and export a local image
- **WHEN** the user inserts a valid local image and exports a View PNG
- **THEN** source bytes, preview, copy, save, persistence, and live-tab synchronization remain inside the browser and loopback same-origin runtime without a network request

#### Scenario: Reject a remote or oversized image
- **WHEN** an insertion or imported State supplies a remote, unsupported, oversized, or over-pixel image
- **THEN** no element is committed, no remote request occurs, and the previous state remains unchanged

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

### Requirement: Organization data stays within the self-hosted trust boundary
Organization, authentication, access, audit, Backup, search, and export data SHALL travel only among
the user's browser, the same-origin Org Tools server, its configured PostgreSQL database, and explicit
operator-controlled files. Runtime code SHALL NOT send it to telemetry, remote logging, remote
synchronization, remote avatar, analytics, or third-party storage services.

#### Scenario: Use the complete product
- **WHEN** users authenticate, edit, search, filter, render, download, back up, or restore data
- **THEN** no organization or credential value is sent to a third-party network destination

### Requirement: Least-data delivery is a privacy boundary
The server SHALL omit every inaccessible field, resource, relationship, count, option, event, label,
and derived value before responding. Errors, logs, audit, server events, and timing-sensitive
identifier responses SHALL not reveal the existence or value of inaccessible data.

#### Scenario: Compare UI and direct API access
- **WHEN** an account lacks access to a value
- **THEN** the value is absent from both rendered surfaces and direct network responses rather than merely hidden by CSS or client logic
