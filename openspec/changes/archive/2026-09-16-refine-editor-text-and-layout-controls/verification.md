# Owned SQLite preparation

- The configured owned database used the default ignored path
  `.org-tools/org-tools.sqlite3`; no config override or database sidecar was present.
- Runtime processes were stopped before inspection and conversion.
- The singleton row contained one immediately preceding Text element and no current-shape Text
  elements. The production parser accepted the state before conversion through the explicit
  compatibility path.
- A byte-identical, timestamped database-family backup was retained at
  `.org-tools/org-tools.sqlite3.before-rich-text-20260916T120227Z.bak` with SHA-256
  `6bc99e11c769d034760637a41294a581e5b4c80fd407230d368680f6fdb5aa16`.
- A detached candidate converted exactly one Text element, retained all other fields, incremented
  the singleton revision from 22639 to 22640, passed SQLite integrity checking, and returned HTTP
  200 from the production `/api/state` route.
- Before/after fingerprints confirmed unchanged Employee, Unit, View, Tag, and custom-field counts;
  IDs; assignments; entity timestamps; UI bytes; and the organization projection excluding only
  the added Text fields and normalized vertical alignment.
- The configured database was then converted in one `BEGIN IMMEDIATE` transaction. It passed the
  same fingerprint and integrity checks, and a normal production startup reopened it and returned
  HTTP 200 from `/api/state`.
- The one-off converter and detached candidate were removed and are not part of the repository.
