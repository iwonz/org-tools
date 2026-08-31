## Context

The SQLite repository currently recognizes an empty database, an obsolete multi-project schema, a
pre-MCP singleton schema marked with `PRAGMA user_version = 1`, and the current four-table schema
marked as version 2. That is inconsistent with the product's current-only contract: startup code
both interprets a version marker and mutates recognized obsolete layouts. The MCP sidebar action and
dialog title also use longer “Agent access” wording despite MCP being the established feature name.

## Goals / Non-Goals

**Goals:**

- Determine database validity only from the exact current managed table and column shape.
- Create that shape for a genuinely empty database and reject every non-current shape atomically.
- Remove all application reads and writes of SQLite `user_version` and every legacy migration/reset
  branch.
- Use “MCP” as the visible and accessible entry name in both locales, with a green enabled icon.
- Produce ready-to-paste configurations from the current token without an environment-variable
  setup step, Examples tab, provider notice, or Enabled badge.
- Keep tests, documentation, specs, and deterministic screenshots aligned.

**Non-Goals:**

- Changing current table columns, MCP protocol behavior, tokens, activity retention, revisions, or
  public state transfer.
- Recovering data from obsolete database layouts.
- Publishing GitHub Pages as part of this local-server-only correction.

## Decisions

### Validate shape instead of version metadata

Startup will configure SQLite pragmas, list managed tables, and branch only twice: create the current
schema when no managed tables exist, or validate the exact current table set and exact columns. Any
other shape throws `database_unavailable` before a transaction or destructive statement. This keeps
the database file unchanged on rejection and makes the schema itself the only contract.

Using a new integer/string version marker was rejected because it would preserve the mechanism being
removed. Retaining special handling for known old table sets was rejected because a reset or
migration is still backward-compatibility behavior.

### Preserve exact-current reopen behavior

A database whose tables and columns already match the current schema remains current regardless of
unused SQLite application metadata left by older binaries. The runtime does not read, write, clear,
or document that metadata. It validates the singleton row through the production state parser before
serving requests.

### Consolidate the MCP entry state

The sidebar action, tooltip, accessible name, and dialog title will share one catalog key, `MCP`, in
English and Russian. A lightweight same-origin settings read on mount makes the icon semantic green
when enabled; disabled and unavailable states retain the ordinary sidebar color. The dialog content
and Disable action communicate enabled state, so the text badge is redundant.

### Generate complete client configuration locally

Opening an enabled dialog retrieves the current token through the existing same-origin reveal
action and keeps it masked in the credential row. Every client builder receives that token and
places `Authorization: Bearer <current-token>` directly in its supported static-header field. Codex
uses the documented `http_headers` map. The UI removes the separate shell-export step, Examples tab,
and repeated provider-notice section. No token enters documentation, fixtures, logs, state Export,
Pages, or screenshot output; deterministic screenshots keep the credential masked and sanitize the
configuration secret.

## Risks / Trade-offs

- **Obsolete databases no longer open or reset automatically** → startup fails visibly without
  changing the file; users can start with a new database and explicitly Import a current state.
- **A malformed current-looking database can still contain invalid row data** → the existing strict
  state parser continues to block it without repair.
- **Short label provides less intent by itself** → the MCP icon tooltip/accessibility name and modal
  consent content remain available, while the established acronym keeps the sidebar compact.
- **Ready configuration contains a bearer secret** → it is fetched only after the local dialog opens,
  stays masked in the credential row, never enters persistence or screenshots, and remains subject
  to the existing same-origin control boundary.
