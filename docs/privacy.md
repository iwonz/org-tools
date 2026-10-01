# Privacy and data safety

## Data boundary

Org Tools is self-hosted. Browsers communicate only with the configured same-origin server;
PostgreSQL and the backup directory are deployment-owned. The runtime has no telemetry, analytics
SDK, remote logging, remote sync, remote fonts, or remote image fetches. Reverse proxies must keep
PostgreSQL private and expose only the application over HTTPS.

The browser does not persist organization snapshots in cookies, local storage, IndexedDB, Cache
Storage, service workers, or browser files. A session cookie contains only an opaque random token.
Theme and locale are the only non-sensitive browser preferences outside PostgreSQL.

## Access boundary

Authorization is enforced before serialization and again before mutation. UI visibility is a
convenience, not a security control. Unavailable fields and resources are omitted rather than
replaced with `null`; guessed inaccessible IDs receive the same response as unknown IDs. Search,
filters, counts, Calendar, labels, Download, and image export consume the same filtered projection.
Server-side Template evaluation can use hidden inputs without returning them.

Audit records actor, action, result, targets, time, and correlation ID. Passwords, setup/session/
CSRF tokens, backup passphrases, and hidden values never enter audit or application logs.

## Local files

Employee avatars remain bounded embedded PNG, JPEG, or WebP data URLs. Markdown does not execute
HTML or load images. Safe explicit links require user action and use referrer protections.

PostgreSQL data and encrypted recovery backups live at absolute external paths configured by
`ORG_TOOLS_POSTGRES_DATA_PATH` and `ORG_TOOLS_BACKUP_PATH`. `.env`, database data, dumps, and backups
are ignored and rejected by publication checks. CI uses disposable paths and never uploads them.

## Outputs and backups

Data Download and Editor PNG export are explicit actions and contain only the caller's authorized
projection. Spreadsheet-like text is escaped where the output format requires it.

Complete Backup is available only with the corresponding permission and current-password
reauthentication. It includes password hashes, roles, grants, ACL, UI states, and audit so recovery
is complete, but excludes live sessions, CSRF, setup token, and rate-limit buckets. AES-256-GCM
detects tampering; the passphrase is never stored. Restore creates a timestamped encrypted recovery
copy before its atomic replacement and then revokes all sessions.

## Publication

The Docker build context, image filesystem, and history are scanned for `.env`, credentials,
database files, dumps, backups, and real organization data. Public fixtures use fictional names,
`example.test`, reserved phone numbers, and embedded assets. GHCR images contain only production
code and local assets.
