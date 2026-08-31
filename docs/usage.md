# Usage

## Choose a runtime

The public application at `https://iwonz.github.io/org-tools/` is fully functional and browser-only.
Its state exists in memory, synchronizes to other currently open Org Tools tabs on the same origin,
and disappears after the final tab closes. Use Import and Export to move state explicitly.

For automatic durable storage, run `pnpm dev` and open `http://127.0.0.1:3000`. The local server
stores one state in SQLite. Every organization action is written automatically; filters, searches,
theme, locale, sidebar, active sections, calendar period, selection, and viewport follow after a
short bounded delay. There is no Save action or state switcher.

The compact sidebar contains Units, Employees, Editor, Analytics, Calendar, Data Download, Import,
state Export, language, and theme. Its desktop control expands the 64 px icon rail to a 240 px label
panel without moving icon centers. The local server additionally places **Agent access** after state
Export; Pages does not show it. The header contains only the current section icon and title.

## Local agent access

Open **Agent access** in the local server sidebar to enable or disable MCP, reveal or copy the
loopback endpoint and token, rotate credentials, inspect bundled setup for supported local clients,
see examples, and review applied activity. Enabling grants complete access to Employees, Units, Main,
and custom Views. The dialog explains that a local client can pass data to its model provider.

Agent changes always use Preview → Apply. Apply writes automatically like a user action and updates
open browser tabs. Independent simultaneous fields merge; overlapping fields require **Keep local**,
**Use MCP**, or **Cancel**. Activity **Undo** is confirmed and succeeds only when later edits do not
overlap the values being restored. See [Local MCP agent access](mcp.md) for tools and client setup.

## Language and appearance

English and Russian catalogs are bundled locally. The first static tab uses the first supported
browser language and falls back to English. The language menu switches all navigation, menus,
dialogs, errors, empty states, and accessibility labels in place. Locale and theme are allowed local
metadata; both are also part of exported state so an Import restores the selected interface.

Theme and language rows do not shift on hover or selection. Floating menus use a thin neutral border
and restrained separation shadow. Hover, active, and pressed states never add a border or resize the
control.

## Product modules

- **Units** manages the hierarchy, manual and Live membership, bosses, positions, and Employee
  movement.
- **Employees** manages profiles, gender, birthday, embedded avatar, tags, contact fields, and Unit
  assignments with compound filters.
- **Editor** manages Main and custom Views on an adaptive snapped grid, including search, history,
  layout, bulk commands, templates, and PNG output.
- **Analytics** derives organization distributions locally and provides Employee drill-down.
- **Calendar** combines recurring birthdays and dated tags with interactive dates and Employee
  actions.
- **Data Download** selects Units or Employees and produces CSV, JSON, templates, and PNG output.

## Import and Export

**Import** opens a JSON chooser and then a compact confirmation with filename, size, Employee count,
Unit count, and View count. The file must be at most 25 MiB and match the exact current state shape.
**Replace state** applies the validated candidate atomically. Invalid JSON, old shapes, partial data,
and arbitrary JSON leave current data unchanged and can be replaced from the same dialog.

**Export state** validates the current live state and immediately downloads
`org-tools-state.json`. It has no format dialog or success notification. Data Download artifacts are
reporting outputs and cannot be imported as application state.

## Failure recovery

If a SQLite write fails, current data remains in memory. Org Tools retries a bounded number of times,
shows a localized Retry action, and enables the native leave warning while a write is pending. A
corrupt current row or unknown database schema blocks startup with Retry; it is never reset
automatically. Browser tabs converge through logical stamps and server write order. MCP activity has
a bounded local history, and cross-source overlapping fields use an explicit conflict dialog.

See [State transfer format](import-formats.md), [MCP](mcp.md), [Privacy](privacy.md), and
[Screenshots](screenshots.md) for the exact boundaries and visual catalog.
