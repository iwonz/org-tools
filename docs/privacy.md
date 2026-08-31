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

Optional MCP access is available only in this local runtime and is disabled by default. `/mcp`
accepts authenticated JSON POST requests from loopback clients, permits no CORS or remote binding,
and rejects GET, legacy SSE, mismatched Origins, and invalid tokens. The 256-bit `ot_mcp_` token,
ten-minute previews, and bounded activity journal remain in SQLite and never enter state Export.
Disable takes effect immediately; Rotate revokes the old token and pending previews.

Enabling MCP grants the chosen local agent complete access to organization data. Org Tools itself
sends data only to that local client, but the client can forward it to its configured model provider.
The consent dialog states this boundary. Stored Employee names, tags, Unit names, and every other
field are treated as data rather than instructions. Tokens must never enter logs, screenshots,
commits, shell history, or Pages artifacts.

Import reads one explicitly selected JSON file into a bounded transient candidate. Export and Data
Download begin only after explicit user actions. Organization records are never copied to browser
storage. Employee avatars must be bounded embedded PNG, JPEG, or WebP data URLs; remote avatars are
never fetched. Profile and email navigation require direct user actions and referrer protection.

## Local files and publication

The default `.org-tools/` runtime directory is ignored by Git. Stop the local server before copying
the SQLite file so rollback-journal transactions are settled. A custom path may be outside the
repository, but invalid configuration is a blocking error.

The Pages artifact contains HTML, CSS, JavaScript, and local fonts only. It contains no SQLite code,
state or MCP endpoint, MCP package, token prefix, MCP control, organization fixture, secret, remote
asset, or external request. `pnpm pages:check`
and `pnpm public:check` scan these boundaries.

Tests and screenshots use fictional names, `example.test`, reserved `555-01xx` phone numbers, and
embedded or initial avatars. Never commit a real organization state, contact list, screenshot,
filesystem path, credential, database, build output, or browser report.
