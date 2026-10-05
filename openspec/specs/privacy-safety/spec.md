# privacy-safety Specification

## Purpose
Define the self-hosted data boundary, least-data delivery, publication safeguards, inert rich
content, local embedded media, and explicit external navigation rules.
## Requirements
### Requirement: Public artifacts use general safety checks
The repository SHALL validate tracked files, Docker build context, production build, runtime image,
and image history for portable paths, credentials, environment files, database or Backup material,
organization fixtures, generated caches and reports, unsupported media, obsolete current-runtime
contracts, and unnecessary source. Checks MUST report only paths and rule names, never secret or
organization values.

#### Scenario: Publication scan
- **WHEN** publication safety scans source and built artifacts
- **THEN** a prohibited artifact or contract causes a failing exit code with its path and rule but without its sensitive contents

### Requirement: External contact actions are explicit
The application SHALL open persisted profile links and mail links only after a user action with
referrer protections.

#### Scenario: Profile navigation
- **WHEN** a user activates a valid Employee profile link
- **THEN** it opens separately with `noopener`, `noreferrer`, and no referrer

### Requirement: Custom field computation remains local
The system SHALL keep custom values, template dependencies, distinct filter values, digest hashing,
authorized projection derivation, and output generation inside the user's browser and same-origin
Org Tools server. These operations MUST NOT create remote requests, telemetry, remote logging,
third-party storage, or browser snapshot persistence.

#### Scenario: Compute a custom digest
- **WHEN** a user previews, copies, or downloads an authorized hashed custom field
- **THEN** the clear value and digest remain within the self-hosted trust boundary

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

### Requirement: Editor clipboard ownership markers disclose no organization data
Editor structural Copy SHALL keep complete clipboard content only in current-tab memory. The system
clipboard marker MAY contain a cryptographically random token and fixed format identifier but MUST
NOT contain Unit, Employee, Tag, canvas, View, organization, or document content. The token MUST NOT
enter the organization document, per-account UI state, PostgreSQL, browser storage, logs, URLs,
exports, or network requests and MUST be invalid without an exact matching in-memory Editor clipboard.

#### Scenario: Inspect a structural clipboard marker
- **WHEN** selected Editor content is copied through keyboard or context-menu action
- **THEN** the system clipboard contains only an opaque ownership marker while the structural payload remains in current-tab memory

#### Scenario: End the browser session
- **WHEN** the page is fully reloaded or its transient Editor clipboard is cleared
- **THEN** any older system marker cannot paste or recover the removed payload

### Requirement: Canvas images remain local and bounded
Canvas Image insertion SHALL occur only after explicit file selection or image clipboard paste and
SHALL accept only bounded embedded PNG, JPEG, or WebP bytes. The application MUST NOT fetch a canvas
image URL, upload an input or generated image, include remote asset references, or persist temporary
object URLs. Adding an image SHALL fail atomically when validated dimensions or the resulting strict
organization document exceed an established bound.

#### Scenario: Insert and export a local image
- **WHEN** the user inserts a valid local image and exports a View PNG
- **THEN** source bytes, authorized preview, Copy, Save, and PostgreSQL persistence remain within the self-hosted trust boundary without a third-party request

#### Scenario: Reject a remote or oversized image
- **WHEN** insertion or a mutation supplies a remote, unsupported, oversized, or over-pixel image
- **THEN** no element is committed, no remote request occurs, and the previous document remains unchanged

### Requirement: Employee display Markdown remains inert and local
Employee display Markdown SHALL parse and render only inside the authenticated self-hosted
application. Raw HTML MUST NOT execute, image or embedded-content syntax MUST NOT create a request,
and Employee values MUST NOT be reinterpreted as Markdown. Ordinary tokens remain plain text unless
inside an explicit safe Markdown link. Only explicit activation of an allowed link in an interactive
card MAY navigate with opener and referrer protection; Editor rows and PNG output remain inert.

#### Scenario: Render remote-looking Markdown
- **WHEN** a format or Employee value contains image, iframe, script, unsupported URL, or HTML syntax
- **THEN** the application makes no request, executes no embedded content, and keeps organization data inside the deployment

#### Scenario: Render a plain ordinary token
- **WHEN** a card format contains profile, email, position, Unit, or custom data outside an explicit Markdown link
- **THEN** the value remains ordinary text with no navigation target

#### Scenario: Activate a safe list link
- **WHEN** a user explicitly activates an allowed Markdown link in an interactive Employee card
- **THEN** navigation uses the validated destination with referrer and opener protection

#### Scenario: Activate a native Unit segment
- **WHEN** a user activates the Unit-name segment of `{positions}` in an Employees or Units card
- **THEN** only local authorized Unit navigation occurs and no external request is made

#### Scenario: Render a native Unit segment elsewhere
- **WHEN** `{positions}` appears in an Editor, PNG, fallback, picker, catalog, Calendar, or drag-preview card
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

### Requirement: Alternate export projection is minimal and audited
The server SHALL return only active-subject summaries and a requested View's authorized image input
through same-origin no-store endpoints. Projection creation MUST require the acting session,
image-export permission, reserved export-as permission, JSON content type, CSRF, exact Origin, and
Fetch Metadata protections, and MUST record a value-free audit event.

#### Scenario: Inspect an alternate export response
- **WHEN** a Super Administrator requests another account's projection
- **THEN** the payload omits hidden fields, Tags, Employees, Units, Slots, Canvas attachments, target UI state, grants, policies, sessions, and administrative records

#### Scenario: Call the endpoint without reserved access
- **WHEN** a non-Super-Administrator or invalid mutation request calls either export-as endpoint
- **THEN** the server returns the standard protected-resource response and records the denial without hidden values

#### Scenario: Record a successful projection
- **WHEN** the server constructs an alternate projection
- **THEN** audit identifies the actor, subject, View, and optional root Unit while the current session remains unchanged

### Requirement: Persistent identifiers use platform cryptography
New persistent Employee and organization resource identifiers SHALL use the supported platform's
cryptographically secure UUID generator. Runtime code MUST NOT fall back to `Math.random()` or
another non-cryptographic pseudo-random source for identifiers or security markers.

#### Scenario: Create a persistent identifier
- **WHEN** a supported browser or server creates a new persistent resource
- **THEN** the identifier is produced by platform cryptography and satisfies the strict UUID contract

#### Scenario: Platform cryptography is unavailable
- **WHEN** the required cryptographic primitive is missing
- **THEN** creation fails without generating or persisting a weaker identifier

### Requirement: Image visibility preferences remain local account metadata
PNG Tag exclusions and Staffing Slot visibility SHALL be stored only in the authenticated account's
PostgreSQL UI state and encrypted Backup payload. They MUST NOT modify organization data, be sent to
third parties, enter browser persistence, or be included in another account's UI response. Stored
Tag preferences SHALL contain IDs only, without copied labels or hidden field values.

#### Scenario: Persist an image preference
- **WHEN** an authenticated account changes an image visibility control
- **THEN** the existing same-origin UI endpoint stores only that account's normalized IDs and boolean
- **AND** no organization revision, remote request, or telemetry event is created
