# Owned SQLite preparation

- The configured owned database used the default ignored path
  `.org-tools/org-tools.sqlite3`; no config override or live database sidecar was present.
- The checkout-owned runtime was stopped before inspection and conversion. The singleton row used
  revision 23441 and contained one immediately preceding open-position record with exact
  `id`, `tags`, and `title` keys and no current-shape record.
- A byte-identical timestamped backup was retained at
  `.org-tools/org-tools.sqlite3.before-open-position-backgrounds-20260917T093516Z.bak` with SHA-256
  `f6ff880a753c87ddd0673146df359d9f46b34b4b38133115b1a57bb0f8bd9367`.
- A detached database copy added exactly one `backgroundColor: null`, retained the complete
  organization projection after removing only that new key, preserved UI bytes with SHA-256
  `e4602a483404f22b810e6622099182911187e33d690a282ea9e51fca20dc358d`, incremented revision from
  23441 to 23442, passed SQLite integrity checking, and passed the production State parser.
- The configured database was converted by the same guarded operation in one `BEGIN IMMEDIATE`
  transaction. Its committed organization JSON has SHA-256
  `a232134b19863e7e0d8b7324e4e74030163f979c18f33521b2f7041bcc317e85`; the committed row passed the
  production parser and SQLite integrity checking.
- A normal production runtime reopened the configured database and returned HTTP 200 from
  `/api/state` with revision 23442, one open position, and one explicit null background.
- The one-off converter, detached candidate, parser probe, and HTTP response were removed and are
  not part of the repository.
