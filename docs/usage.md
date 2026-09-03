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

The compact sidebar contains Employees, Units, Editor, Analytics, Calendar, Data Download, Import,
state Export, language, and theme. Its desktop control expands the 64 px icon rail to a 240 px label
panel without moving icon centers. The header shows the current section icon and title plus its contextual actions:
**Add Unit**; **Employee model**, **Tags**, and **Add Employee**; or enabled **Continue**. On narrow screens
the action keeps its accessible name and tooltip while showing only the icon.
Text-bearing buttons and tabs place their thematic icon before the visible label. Disclosure,
sorting, removal, status, and count affordances remain trailing when that position communicates
their distinct role.

## Language and appearance

English, Simplified Chinese, Russian, Spanish, French, and Modern Standard Arabic catalogs are
bundled locally. A new static state uses the first supported entry in the browser language list and
falls back to English. An existing SQLite state, imported state, live-tab state, or previous manual
choice takes priority. The Language modal switches navigation, menus, dialogs, errors, empty states,
date formatting, plurals, and accessibility labels in place. Arabic sets the document to RTL and
mirrors the shell while keeping Editor canvas coordinates LTR. The Theme modal offers Light, Dark,
and System. Locale and theme are allowed local metadata; both are also part of exported state so an
Import restores the selected interface.

Theme and language radio rows do not shift on hover or selection. Floating menus use a thin neutral border
and restrained separation shadow. Hover, active, and pressed states never add a border or resize the
control.

## Product modules

- **Units** manages the hierarchy, manual and Live membership, bosses, positions, and Employee
  movement. Its hierarchy and roster use equal desktop columns, and their searches share one
  horizontal row. The selected path, summary, and search align with roster avatars; direct plus
  descendant Employees appear in one contiguous list.
  The current roster count appears below search without redundant roster-section headings or counts.
  **Add Unit** is in the shared header.
- **Employees** manages profiles, gender, complete birthdays, embedded avatar, typed custom fields,
  shared tags whose configured color is their tonal fill, contact fields, and Unit assignments with compound filters. **Employee
  model** defines stored Value fields or derived Template fields with optional MD5/SHA-256 output;
  **Tags** manages normalized labels, filled color treatments, usage counts, rename, and cascading
  deletion. Editing opens a dedicated modal. Its color dropdown keeps a full custom palette first,
  exact HTML Keyword, HEX, RGB, or RGBA entry next, and localized named presets plus No color below;
  arbitrary choices are stored as canonical `#rrggbb` or `#rrggbbaa` values and use readable tonal
  fills in both themes. Invalid exact input remains a draft and does not change the Tag. Gender is
  a native-radio segmented switcher. Birthday
  keeps Day, Month, and Year selects inside one compound field;
  **Unknown year** stores `1900` so Calendar can retain the known recurring day and month. Avatar cropping produces a local 512 by 512 image, preferring
  WebP and falling back to PNG when the browser cannot encode WebP. **Add Employee** is in the shared
  header. The tag field keeps every draft chip in one wrapping picker and commits it only with the
  rest of the form.
- **Editor** manages the current Unit structure on an adaptive snapped grid, including search,
  history, layout, bulk commands, Image, JSON, and Template output. It uses the full content height:
  Undo/Redo are at the logical start, while Search, layout, Arrange, and Collapse/Expand are at the
  logical end. Search expands inward without moving the other controls. Dragging one Unit in an
  existing multi-selection keeps the group selected; **Arrange selected** moves only those Units in
  one undoable snapped operation. There is no alternate View or
  structure selector: Units and Editor always operate on the same organization. Closing Search
  clears its query. Unit cards keep the same opaque background
  when hovered or selected, with selection indicated only by the signal border. PNG output mirrors
  the live Unit header, roster spacing, centered avatars, boss marker, variable row heights, and
  hierarchy connections while retaining configurable output styling. Every tag is written in full;
  oversized labels wrap inside their compact chip. Static/Live membership type is not printed.
- **Analytics** derives organization distributions locally without repeating the page title. It
  reports known birth years and completed ages, including one-decimal averages plus deterministic
  youngest and oldest Employees for everyone, men, and women. Missing birthdays and the `1900`
  unknown-year sentinel are excluded. Every Eye drill-down uses current full Employee cards with
  Tag, Edit, and Delete actions.
- **Calendar** combines recurring birthdays and dated tags with localized weekday order, leading
  month offsets, weekend tones, a horizontal Tag rail, conditional Today navigation, interactive dates, and Employee
  actions. A day dialog is one vertical scroll: nonempty Birthdays come first, followed by each
  interactive Tag heading and its full Employee-card list. Day and tag dialogs omit redundant
  descriptions, generic dated-event/current-future headings, special event subtitles, and empty
  Birthday, dated-event, or Past sections. Both day details and dated-tag
  history use complete Employee cards with the ordinary Tag, Edit, and Delete actions while
  retaining bounded scrolling and tag-history navigation.
  Day-dialog titles follow the active locale; Russian titles omit the abbreviated year suffix and
  use the catalog's corrected backward/forward navigation labels.
- **Data Download** uses equal source and selected-Employee panes whose geometry stays fixed when
  switching sources, then produces structured JSON or Template output.
  JSON always produces one record per Employee. Drag handles order scalar fields and the ordinary
  Unit and Tag rows in one list; enabled Unit and Tag arrays expose their own reorderable fields,
  names, and searchable exclusion menus. Template retains All Units and First Unit row modes through
  the same control used by Editor export. Every token-aware Format label includes a help icon, and
  its placeholder explains that typing `@` opens a localized caret menu and inserts the stable
  `{token}` syntax. Unit paths use the fixed ` / ` separator. **Continue**
  stays disabled in the shared header until at least one Employee is selected.

## Import and Export

**Import** opens a modal with **All state** and **Employees**. All state accepts the exact current
state shape up to 25 MiB and replaces it atomically after confirmation. Employees accepts a JSON
array, shows a bounded preview of the first record with the most mappable properties, maps source
paths left-to-right into fixed fields, requires UUID, first name, last name, and email, and imports
nested Team assignments only when Teams is mapped. Existing Value fields may be mapped and new
Value definitions may be prepared atomically. The review separates additions, identity duplicates,
and skipped rows. A mapped birthday must be a real `DD.MM.YYYY` value; `1900` means the birth year
is unknown, including for `29.02.1900`. Existing identities can be updated, skipped, or limited to
Teams in bulk with per-Employee overrides. UUID collisions with another identity block the import.
Invalid input never changes current data.

**Export** immediately validates the live state and downloads `org-tools-state.json`; it has no
dialog or Employee-only mode. The file includes the latest in-memory changes. Data Download and
Editor artifacts remain separate outputs and cannot be imported as application state or Employee
transfer.

Employee IDs are stable UUID v4 values and identity edits never change them. Duplicate detection is
separate: first name, last name, and email use Unicode NFKC normalization, trimmed and collapsed
whitespace, and locale-independent lowercase. A second normalized identity is rejected.

## Failure recovery

If a SQLite write fails, current data remains in memory. Org Tools retries a bounded number of times,
shows a localized Retry action, and enables the native leave warning while a write is pending. A
corrupt current row or unknown database schema blocks startup with **Retry** and **Create new**; it
is never reset automatically. Create new requires confirmation, preserves the database and existing
sidecars as one timestamped backup family, and opens a validated blank current database. If recovery
fails partway, the originals are restored. Browser tabs converge through deterministic logical stamps while server writes remain
serialized.

See [State transfer format](import-formats.md), [Privacy](privacy.md), and
[Screenshots](screenshots.md) for the exact boundaries and visual catalog.
