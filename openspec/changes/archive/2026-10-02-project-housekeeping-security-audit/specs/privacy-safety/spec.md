## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Public artifacts use general safety checks
The repository SHALL validate tracked files, Docker build context, production build, runtime image,
and image history for portable paths, credentials, environment files, database or Backup material,
organization fixtures, generated caches and reports, unsupported media, obsolete current-runtime
contracts, and unnecessary source. Checks MUST report only paths and rule names, never secret or
organization values.

#### Scenario: Publication scan
- **WHEN** publication safety scans source and built artifacts
- **THEN** a prohibited artifact or contract causes a failing exit code with its path and rule but without its sensitive contents

### Requirement: Custom field computation remains local
The system SHALL keep custom values, template dependencies, distinct filter values, digest hashing,
authorized projection derivation, and output generation inside the user's browser and same-origin
Org Tools server. These operations MUST NOT create remote requests, telemetry, remote logging,
third-party storage, or browser snapshot persistence.

#### Scenario: Compute a custom digest
- **WHEN** a user previews, copies, or downloads an authorized hashed custom field
- **THEN** the clear value and digest remain within the self-hosted trust boundary

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
