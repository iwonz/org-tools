# Usage

## Choose a runtime

The public application at `https://iwonz.github.io/org-tools/` is fully functional and browser-only.
Its state exists in memory, synchronizes to other currently open Org Tools tabs on the same origin,
and disappears after the final tab closes. Use Import and Export to move state explicitly.

For automatic durable storage, run `pnpm dev` and open `http://127.0.0.1:3000`. The local server
stores one state in SQLite. Every organization action is written automatically; filters, searches,
theme, locale, sidebar, active sections, calendar period, selection, and viewport follow after a
short bounded delay. There is no Save action or state switcher.

While either runtime resolves its initial state, the shell shows only one centered circular loader
without technical status copy. The indicator uses local styles, respects reduced motion, and keeps
a localized accessible status name.

The compact sidebar contains Units, Employees, Editor, Analytics, Calendar, Data Download, Import,
state Export, language, and theme. Its desktop control expands the 64 px icon rail to a 240 px label
panel without moving icon centers. The header shows the current section icon and title plus its primary action:
**Add Unit**, **Add Employee**, or enabled **Continue** in the relevant workflow. On narrow screens
the action keeps its accessible name and tooltip while showing only the icon.
Text-bearing buttons and tabs place their thematic icon before the visible label. Disclosure,
sorting, removal, status, and count affordances remain trailing when that position communicates
their distinct role.

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
  movement. The hierarchy starts directly below the shared header; selected-path and search controls
  align with roster avatars, and direct plus descendant Employees appear in one contiguous list.
  The current roster count appears below search without redundant roster-section headings or counts.
  **Add Unit** is in the shared header.
- **Employees** manages profiles, gender, birthday, embedded avatar, tags, contact fields, and Unit
  assignments with compound filters. Avatar cropping produces a local 512 by 512 image, preferring
  WebP and falling back to PNG when the browser cannot encode WebP. **Add Employee** is in the shared
  header.
- **Editor** manages the current Unit structure on an adaptive snapped grid, including search,
  history, layout, bulk commands, templates, and PNG output. There is no alternate View or structure
  selector: Units and Editor always operate on the same organization. Closing Search clears its
  query. Unit cards keep the same opaque background
  when hovered or selected, with selection indicated only by the signal border. PNG output mirrors
  the live Unit header, roster spacing, centered avatars, boss marker, variable row heights, and
  hierarchy connections while retaining configurable output styling. Every tag is written in full;
  oversized labels wrap inside their compact chip. Static/Live membership type is not printed.
- **Analytics** derives organization distributions locally and provides Employee drill-down.
- **Calendar** combines recurring birthdays and dated tags with interactive dates and Employee
  actions. Day and tag dialogs omit redundant descriptions, the dated-event and current/future
  headings, and empty Birthday, dated-event, or Past sections. Both day details and dated-tag
  history use complete Employee cards with the ordinary Tag, Edit, and Delete actions while
  retaining bounded scrolling and tag-history navigation.
- **Data Download** selects Units or Employees and produces CSV, JSON, templates, and PNG output.
  **Continue** stays disabled in the shared header until at least one Employee is selected.

## Import and Export

**Import** opens a modal with **All state** and **Employees**. All state accepts the exact current
state shape up to 25 MiB and replaces it atomically after confirmation. Employees accepts a JSON
array, maps flat or nested properties, requires first name, last name, and email, and can import
nested Team assignments. Existing deterministic identities can be updated, skipped, or limited to
Teams in bulk with per-Employee overrides. Invalid input never changes current data.

**Export** opens the same two choices. All state downloads `org-tools-state.json`. Employees
downloads `org-tools-employees.json` as a flat Employee array with nested Team assignments. Both
include current unsaved-in-flight memory after validation. Data Download artifacts remain separate
reporting outputs and cannot be imported as application state or Employee transfer.

Employee IDs are deterministic 64-character SHA-256 values derived from normalized first name, last
name, and email. Unicode NFKC normalization, trimmed and collapsed whitespace, lowercase, U+001F
separators, UTF-8, and the complete digest make create, edit, Import, and Export use exactly the same
identity rule. Editing identity fields updates all references atomically; a duplicate is rejected.

## Failure recovery

If a SQLite write fails, current data remains in memory. Org Tools retries a bounded number of times,
shows a localized Retry action, and enables the native leave warning while a write is pending. A
corrupt current row or unknown database schema blocks startup with Retry; it is never reset
automatically. Browser tabs converge through deterministic logical stamps while server writes remain
serialized.

See [State transfer format](import-formats.md), [Privacy](privacy.md), and
[Screenshots](screenshots.md) for the exact boundaries and visual catalog.
