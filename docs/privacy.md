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

Browser responses deny framing, suppress referrers and MIME sniffing, restrict browser capabilities,
isolate opener/resource contexts, and allow scripts, styles, fonts, images, connections, and workers
only from the application plus the bounded `data:`/`blob:` uses required for embedded media and
explicit local file output.

## Local files

Employee avatars remain bounded embedded PNG, JPEG, or WebP data URLs. Markdown does not execute
HTML or load images. Safe explicit links require user action and use referrer protections.

PostgreSQL data and encrypted recovery backups live at absolute external paths configured by
`ORG_TOOLS_POSTGRES_DATA_PATH` and `ORG_TOOLS_BACKUP_PATH`. `.env`, database data, dumps, and backups
are ignored and rejected by publication checks. CI uses disposable paths and never uploads them.
Local changed-path validation also uses a dedicated Compose project with temporary PostgreSQL and
Backup bind directories. Browser fixtures and authentication tests never connect to the configured
development database, and cleanup removes the temporary data after the run.

## Outputs and backups

Data Download and Editor PNG export are explicit actions and contain only the caller's authorized
projection. Spreadsheet-like text is escaped where the output format requires it.

A Super Administrator may explicitly render an Editor PNG with another active account as the
access subject. This does not impersonate that account: the server returns only its authorized
View projection, omits grants, policies, UI state, sessions, administration data, and every hidden
resource or field value, and records the acting administrator plus subject and export root in
audit. The selected subject is transient and resets to the administrator on every dialog open.

Complete Backup is available only with the corresponding permission and current-password
reauthentication. It includes password hashes, roles, grants, ACL, UI states, and audit so recovery
is complete, but excludes live sessions, CSRF, setup token, and rate-limit buckets. AES-256-GCM
detects tampering; the passphrase is never stored. Restore creates a timestamped encrypted recovery
copy before its atomic replacement and then revokes all sessions.

## Publication

The tracked worktree, Docker exclusion contract, production build, image filesystem, and history are
scanned for `.env`, credentials, database files, dumps, backups, generated reports, and real
organization data. The locked dependency graph is audited during validation, and dead files or
dependencies fail the hygiene gate. Public fixtures use fictional names, `example.test`, reserved
phone numbers, and embedded assets. GHCR images contain only production code and local assets.
