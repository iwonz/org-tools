# Privacy and data safety

Org Tools is local-only. It has no accounts, telemetry, analytics SDK, remote logging, remote
synchronization, remote database, or background network request.

## Data boundaries

The static Pages application keeps organization data only in JavaScript memory. Live tabs on the
same origin may exchange validated state through `BroadcastChannel`; no snapshot enters local
storage, session storage, IndexedDB, Cache Storage, cookies, or a service worker. After the final tab
closes, the state is gone. Locale and theme are the only allowed browser metadata.

The local server exchanges data only between the browser and the loopback same-origin runtime.
SQLite stores one singleton state in the configured local file. The API rejects non-loopback Hosts,
cross-origin mutations, non-JSON mutations, malformed scopes, and invalid state. It does not enable
CORS. A failed or corrupt database is reported by a stable code and is never replaced silently.
Only an explicit confirmed Create new action may replace it: the runtime first closes SQLite and
retains the database plus any existing sidecars under timestamped backup names. A partial recovery
restores the original file family.

If repository delivery changes the exact State shape, preparation of the configured owned snapshot
is an offline local operation: owned processes stop, an ignored timestamped database-family backup
is retained, a detached candidate and committed row pass the production parser, and preservation
hashes are compared before normal startup is accepted. No organization payload, backup, converter,
or diagnostic fingerprint leaves the machine or enters Git, and runtime validation remains strict.

Import reads one explicitly selected JSON file into a bounded transient candidate. It may validate a
complete state (including every View) or map an Employee array with optional nested Team assignments
into the system View; the source, bounded
richest-record preview, virtualized source-to-target mapping, pending custom fields, and duplicate choices are discarded when the modal closes. Birthday
validation is local and accepts only `DD.MM.YYYY`; year `1900` records an unknown year without
inferring one. Employee UUID creation, duplicate-key normalization, custom Template evaluation, and
optional MD5 or SHA-256 output all run locally. Export
validates and downloads the complete state only after an explicit user action. Structured JSON field
ordering, bounded previews, image painting, copying, and downloads all remain in browser memory;
the full Tag color palette and exact HTML Keyword, HEX, RGB, or RGBA parser run locally and persist
only canonical lowercase six- or eight-digit HEX without contacting a palette, color, or asset
service. Palette gestures commit only their final valid color; invalid or canceled drafts are discarded without changing state. Bundled language flags never create network requests. Dragging a field never transmits or
persists organization data. Custom Views contain references to the same global Employee catalog and
never duplicate profile or avatar payloads. Organization records are never
copied to browser storage. Employee avatars must be bounded embedded PNG, JPEG, or WebP data URLs;
remote avatars are never fetched. Crop encoding prefers WebP and falls back only to the browser's
local PNG canvas encoder; neither path uploads the source or result. Profile and email navigation
require direct user actions and referrer protection.

Editor canvas Images are accepted only from an explicit local file choice or an image clipboard
paste. PNG, JPEG, and WebP headers, bytes, and intrinsic dimensions are validated before commit;
each source is limited to 25 MiB and 40 megapixels, and the complete resulting State must still fit
the 25 MiB transfer bound. Original bytes remain an embedded data URL without upload, remote URL,
object-URL persistence, or quality-reducing re-encoding. Decode failure produces the same inert
local placeholder in the Editor and PNG. Full-View and scoped preview/copy/save rasterization loads
only validated embedded data URLs with bounded concurrency and never creates a network request.
Canvas selection, tool activation, contextual target outlines and anchors, perimeter
resize/rotation previews, context menus, Format token suggestions, Format help, and the Remove empty
lines choice remain transient browser UI. PNG preview Fit/manual mode, zoom, pan, pointer capture,
keyboard position, normalized focal point, and local object URL also remain in dialog memory only.
Only a completed element command updates the active View;
Template line filtering derives local output without writing State. None of these interactions adds
storage, logging, telemetry, or network access.

Unit notes are bounded local Markdown embedded only in complete state transfer and the configured
SQLite state. Preview never executes raw HTML and replaces Markdown images with inert local text,
so opening a note cannot fetch an asset. Supported external links navigate only after a direct
click and always use `noopener`, `noreferrer`, and a no-referrer policy. Editor Image and structured
Employee outputs omit note content.
Distribution mode derives direct membership, tonal status, and selected-placement paths solely from
the active in-memory View. Its bounded View UI setting may use the existing local persistence or
live-tab channel. Editor PNG locally paints persistent status row tones from that View while
excluding selection and placement overlays; JSON, Template, and Employee outputs remain
distribution-neutral. No path creates a request or additional browser storage.

## Local files and publication

The default `.org-tools/` runtime directory is ignored by Git. Stop the local server before copying
the SQLite file so rollback-journal transactions are settled. A custom path may be outside the
repository, but invalid configuration is a blocking error.

The macOS/Linux `pnpm dev-stop` command reads local process identities, commands, parent links, and
working directories only to identify this checkout's development processes. It does not read
process environments or organization state, persist a process registry, log command lines, access
the network, or remove runtime files. Graceful shutdown precedes any verified forceful termination.

The Pages artifact contains HTML, CSS, JavaScript, and locally bundled Noto UI families. Editor
annotations and Image export resolve only the local system sans-serif stack or Georgia with local
Times/serif fallbacks; historical imported family names resolve to the same System stack. Language,
theme, and Editor font selectors never download catalogs or fonts. It
contains no SQLite code, state endpoint, organization fixture, secret, remote asset, or external
request. `pnpm pages:check` and `pnpm public:check` scan these boundaries.

Tests and screenshots use fictional names, `example.test`, reserved `555-01xx` phone numbers, and
embedded or initial avatars. Never commit a real organization state, contact list, screenshot,
filesystem path, credential, database, build output, or browser report.
