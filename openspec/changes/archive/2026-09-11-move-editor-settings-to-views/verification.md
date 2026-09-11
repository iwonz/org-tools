# Verification

Validated on 2026-09-11 with synthetic data and isolated loopback runtimes.

- Formatting, Biome lint, all workspace type checks, and diff whitespace checks passed.
- All 234 unit tests passed, including strict settings rejection, isolated history, View copying,
  target-View Unit Paste, shared grouping, hidden footer geometry, and the existing 20,000 Employee /
  4,000 Unit scale coverage.
- Development startup and diagnostics checks passed.
- Production server and browser-only Pages builds passed.
- All 51 server browser tests and all nine Pages browser tests passed with strict diagnostics.
- The final View settings workflow passed again in both runtimes after adding short-viewport
  coverage. It checks palette preview writes and final commits, cancellation, exact colors, both
  themes, path/marker tones, Undo/Redo, PNG footers, live peers, View changes, nested scrolling,
  Escape, and focus restoration.
- Pages artifact checks and the public-safety scan passed.
- All 59 gallery PNGs were visually reviewed, including the View dialog, distribution tones and
  endpoints, note placement, and PNG output. Two complete successful generations produced identical
  SHA-256 hashes for every frame, with no missing or extra files.
- Seven capability specifications were synchronized and strict OpenSpec validation passed.

The settings synchronization workflow exposed a startup race: a delayed SQLite response could
replace a newer live-peer snapshot and lower its logical stamp. Startup now compares stamps before
installing that response. The regression delays the initial request to reproduce this ordering.

The authorized configured SQLite database was converted with its verified writer stopped and a
consistent ignored backup retained. The temporary offline tool used the production parser, added
default settings to all three Views, removed Unit grouping, preserved Tag order and durable UI,
and committed one transaction at revision 16604. A repeat run was a validated no-op. Synthetic
conversion tests passed for success, idempotence, invalid-input atomicity, and rollback after an
update failure. No conversion tool, database, or backup is included in Git or the runtime.
