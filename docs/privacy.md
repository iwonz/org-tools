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

Import reads one explicitly selected JSON file into a bounded transient candidate. It may validate a
complete state or map an Employee array with optional nested Team assignments; the source, mapping,
preview, and duplicate choices are discarded when the modal closes. Export selects complete state
or Employees only after an explicit user action. Organization records are never copied to browser
storage. Employee avatars must be bounded embedded PNG, JPEG, or WebP data URLs; remote avatars are
never fetched. Crop encoding prefers WebP and falls back only to the browser's local PNG canvas
encoder; neither path uploads the source or result. Profile and email navigation require direct user
actions and referrer protection.

## Local files and publication

The default `.org-tools/` runtime directory is ignored by Git. Stop the local server before copying
the SQLite file so rollback-journal transactions are settled. A custom path may be outside the
repository, but invalid configuration is a blocking error.

The Pages artifact contains HTML, CSS, JavaScript, and local fonts only. It contains no SQLite code,
state endpoint, organization fixture, secret, remote asset, or external request. `pnpm pages:check`
and `pnpm public:check` scan these boundaries.

Tests and screenshots use fictional names, `example.test`, reserved `555-01xx` phone numbers, and
embedded or initial avatars. Never commit a real organization state, contact list, screenshot,
filesystem path, credential, database, build output, or browser report.
