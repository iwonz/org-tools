# Usage

## Browser workspace and local development

The repository's GitHub Pages URL is the functional browser-only workspace at `/org-tools/`. It can
open, import, edit, analyze, save, and export organization data without a backend. Run
`pnpm pages:dev` for that static-export variant. Run `pnpm dev` and open
`http://127.0.0.1:3000` for durable multi-project SQLite storage. The command uses webpack
explicitly so its first browser load follows the same compiler family as production, and excludes
the reserved `.org-tools` runtime and `.playwright-cli` diagnostic directories from file watching
so local runtime writes do not trigger Fast Refresh. Root navigation uses a pre-render server
redirect to the current project's stable URL. Wait for the `Development workspace ready` line: the
launcher prints it after warming the root route, current project, and local project API.
`pnpm dev:check` starts that entry point against an isolated database in the ignored runtime boundary,
verifies routing, the interactive shell, Editor canvas, and project API in Chromium, and shuts down
every owned process. If Chromium is not installed locally, run
`pnpm --filter @org-tools/screenshots exec playwright install chromium` once.

org-tools opens the last selected project at `/projects/<uuid>`. A new database starts with a blank
`New project`, Main View, and Editor selected. A dark 64 px compact sidebar contains the six product
destinations followed by the project switcher, **Import**, **Export**, language, and theme controls.
Its desktop toggle expands the panel to 240 px; narrow layouts keep the compact rail.
Compact items hide their visible labels while keeping localized accessible names, native titles,
and pointer tooltips; every icon is centered with equal inline space. There is no decorative Org
Tools glyph or visible product title. The collapse control is a left-aligned 48 px by 40 px compact
item instead of a full-width row and uses the same 14 px horizontal padding around its 20 px icon as
compact navigation and action items in both sidebar modes. During a desktop transition, the right
edge travels continuously between 240 and 64 px while labels clip and fade and every icon remains
stationary. The toggle icon keeps stable contrast. Narrow automatic compact mode omits the unused
header row. Sidebar mode is transient UI state and is never written to the workspace or browser
storage.

The content header contains the current workflow icon and title plus the Save button. Save feedback
is anchored immediately to its left without reserving visible copy: **Unsaved** appears for two
seconds after an organization edit, **Saving…** remains for the write, **Saved** appears for two
seconds after success, and a failure remains until the next edit or save attempt. Feedback uses an
`aria-live` region and never moves the button or title. Active navigation uses a calm
tonal surface and stronger foreground; hover changes tone without introducing a border, outline,
inset hairline, elevation shadow, or layout shift. Press changes tone without scaling, rotating,
translating, or resizing content. Keyboard focus remains explicit, and reduced-motion removes the
sidebar width and label animation. Ordinary controls, selected choices, cards, shell chrome, and
Editor toolbars do not use decorative shadows; true overlays use only restrained separation depth.
Nested tabs follow the same borderless tonal state language. Organization data autosaves only when
the shared default-off option is explicitly enabled; bounded SQLite project UI state continues to
save separately after 300 ms.
Empty product tabs show one focused next action and omit controls that cannot yet do useful work.

Ordinary product workflows remain full-bleed below the header: there is no decorative outer panel,
rounded frame, or empty shell-colored gutter around working content. A restrained neutral palette,
typography, alignment, and soft tonal backgrounds group headers, split panes, and Analytics
sections without accumulating outlines. Repeated rows stay contiguous and rely on density plus
hover or focus feedback. Dialogs, fields, popovers, selectable or destructive choices, calendar
cells, hierarchy guides, focus and error states, and Editor data nodes retain boundaries only where
those boundaries communicate meaning. The Editor canvas remains the deliberate exception and keeps
a distinct neutral workspace background.

Inter is the single application typeface for headings, body text, placeholders, native controls,
menus, dialogs, and template or JSON editing surfaces. Image export can still use a user-selected
font inside the exported artifact and its explicit preview; that choice never changes the dialog or
application chrome. A restrained steel-blue signal appears only in focus, selection, and other small
state details, while larger interaction surfaces use nearly neutral blue-gray. Primary action fills
remain graphite. Motion is limited to small pressed responses and is removed when the browser
requests reduced motion.

## Interface language

The interface supports English and Russian. On first use, org-tools selects the first supported
language from the browser preferences and falls back to English. Use the flag language menu
immediately to the left of the theme menu to switch in place. Its closed trigger shows only the
active flag; the menu shows each flag with its language name and selected indicator. The choice is
remembered locally under `org-tools-locale`. Opening or importing a workspace does not change the
language, and user-entered organization content is never translated.
Theme and language menu rows keep their content at a stable position while hover, focus, and
selection change only tone and foreground contrast.

The Russian interface uses localized Team terminology for Unit and Live Unit. English machine keys,
persisted types, and export fields remain unchanged.

## Project workspaces and Save

Open the project switcher in the sidebar footer to select a project or use **Create project**,
**Rename project**, **Copy project link**, and **Delete project**. Names are required, limited to 100
trimmed characters, and unique after Unicode normalization and case folding. A project keeps its UUID
and stable link when renamed. Deleting the current project opens a remaining project; deleting the
final project immediately creates a new blank one.

Employee, Team, View, Live rule, assignment, and editor-document changes make the current project
**Unsaved**. Use header **Save** or `Ctrl+S`/`Cmd+S`; Saving, Saved, and Save failed use a fixed status
area without moving the header. Switching project or following an internal project action while
dirty offers **Save**, **Discard**, and **Cancel**. Closing or reloading the page also invokes the
browser's unsaved-change protection.

Theme, product tab, active View, selected or expanded Units, and each View's viewport and selection
do not activate Save. They are stored as a small project UI projection. If another tab saves first,
the conflict dialog offers **Load saved version**, **Overwrite saved version**, or **Cancel**; no
version is silently lost. An unavailable or corrupt project stays blocked and offers only safe retry,
switch, or delete recovery.

The project popover also contains **Autosave**, off by default. When enabled, organization edits use
one trailing 1000 ms debounce and the same revisioned Save operation. Only one write runs at once;
edits made during that write schedule the next save. Manual Save remains available and immediate.
A conflict or error pauses autosave without clearing dirty state.

## Browser file workspace

The Pages sidebar replaces project management with one file menu: **New workspace**, **Open
workspace**, **Save As**, the current filename, and, when File System Access is available,
**Autosave**. Open, Save, Import, and Export use only the complete strict `content: "workspace"`
contract. Import marks the browser working copy Unsaved, while Export reads all current changes.

On browsers with File System Access, Open binds the selected JSON file. Save and
`Ctrl+S`/`Cmd+S` write that handle; the first Save opens Save As. A successful write completes
createWritable, write, and close before the UI reports Saved. The application remembers only the
file handle in IndexedDB. On a later visit it opens automatically if permission remains granted;
otherwise editing is blocked behind **Reconnect file** or **Start blank**. A corrupt or unavailable
file is never replaced silently.

Before writing, Org Tools compares file size and last-modified time with the last known fingerprint.
An external edit stops autosave and offers **Load file**, **Overwrite file**, **Save As**, or
**Cancel**. New and Open while dirty use **Save**, **Discard**, and **Cancel**, and closing the tab
keeps the native unsaved-change warning.

On browsers without File System Access, Open uses a normal JSON chooser and Save downloads
`org-tools-state.json`. The workspace exists only until the tab reloads. Autosave controls and
technical compatibility explanations are omitted because that capability is unavailable. Theme,
locale, and the autosave boolean are the only local-storage metadata;
the organization snapshot never enters browser storage.

## Product tabs

- **Units** manages the shared Unit hierarchy and effective membership. Its hierarchy uses a quiet
  tonal pane beside the full-bleed selected-Employee area without a decorative divider.
- **Employees** manages the global Employee catalog, tags, and contact fields. Its populated header
  shows the total catalog size directly below search and adds the visible match count while search or
  filters are active. Exact-value Gender choices compose with birthday, position, tag, Unit, and
  text filters. Search and counts sit in a quiet tonal header above the continuous zero-gap
  virtualized list.
- **Editor** arranges the Main View or an independent custom View on a canvas. View selection,
  history, layout, hierarchy, and search actions form one compact surfaced top-left toolbar. Search
  is the last action and reveals its field to the right of its trigger. Zoom, scale reset, and
  primary-Team focus form a matching surfaced toolbar at the bottom left. The canvas retains its
  neutral-gray background. Its visible grid adapts at different zoom levels while drag, add,
  import, paste, hierarchy changes, and Arrange finish on one 24-unit document grid.
- **Analytics** summarizes the current organization without sending data elsewhere. Its six groups
  use one uniform borderless surface tone from heading through table rows, plus compact gaps and
  tonal row feedback, to keep the tables clean and scannable.
- **Calendar** combines recurring birthdays with one-time dated Employee tag events. Every date is
  an interactive tonal target with a fixed top date row, while today receives the stronger signal
  treatment.
- **Download** selects local sources and produces CSV, JSON, or separator-based templates. Its
  source pane uses a quiet tone while the selected-Employee area stays visually open.

Populated product workflows begin directly below the context header without an outer workflow
inset. Sidebar destinations and nested tabs identify the active item with stronger foreground and a
restrained tonal surface without changing font weight or rendering a border. Pointer hover uses a
translucent tonal wash without added elevation; focus and press remain distinct without changing
control geometry.

The Main View is canonical. A custom View can begin as a copy of Main or empty, then keep its own
document, local Employees, global Employee overrides, canvas layout, viewport, and command history.

## Import and export a workspace

Choose **Export** to validate the current live snapshot and immediately download
`org-tools-state.json`. Export has no configuration dialog and no in-app success banner. It always
contains the complete `content: "workspace"` state, including changes that have not yet been saved
to the SQLite project or bound browser file.

Choose **Import** to open the native JSON chooser. A compact confirmation then shows the selected
filename, size, and Employee, Unit, and View counts. Files are limited to 25 MiB and must be a strict
complete workspace. **Choose another file** retries in the same dialog, **Cancel** leaves the current
working copy untouched, and destructive **Replace workspace** installs the validated detached
candidate atomically.

Former `teams`, `employees`, and `teamsEmployees` projections, arbitrary JSON, and malformed
documents are rejected without fallback or mutation. Import applies the file's theme and workspace
UI state but does not change the current SQLite project identity, name, or revision and does not
rebind the browser file handle. It marks organization data Unsaved; the next project or file Save
makes the imported snapshot durable.

The separate **Download** module continues to produce CSV, JSON, text-template, and PNG reporting
artifacts. These purpose-built outputs are not workspace transfer files and cannot be imported as a
workspace. See [Workspace transfer format](import-formats.md) for the exact contract.

## Employee data

An Employee can have a name, email, username, explicit profile URL, embedded avatar, phone,
`MM-DD` birthday, required normalized gender, and tags. Gender is stored as `male`, `female`, or
`unspecified`; the form never infers it, and catalog filters use exact selected
values. Each tag can optionally carry one exact `YYYY-MM-DD` date. Tag identity, search, and Live
Unit filtering remain label-based. Positions and boss status belong to each Employee-to-Unit
assignment, so the same Employee can have different roles in different Units.

The Employee form and quick tag menu hide date controls behind a calendar action. A dated chip reads
`label · localized date`; bulk editing displays mixed dates and can apply or clear one date for all
selected Employees that have the label. Quick tag options remain 44 px high with centered checkbox,
label, and date actions. Every Employee surface and PNG image shows all tags on
wrapped rows without `+N` counters. PNG tags use the same neutral rounded treatment and localized
`label · date` content as Employee cards, with compact row spacing. Full workspace files preserve
both dated and undated tags.

Profile and email links open only when activated. Choose an avatar from a PNG, JPEG, or WebP file,
use the explicit clipboard action, or paste an image while the Employee form is focused. The crop
dialog supports drag, touch, wheel, keyboard movement, and a zoom slider. Confirmation produces an
embedded 512-by-512 WebP in the form draft; saving the Employee applies it to the workspace. Cancel
keeps the previous avatar. A saved avatar can be re-cropped, replaced, or removed, while remote
images and raw data-URL editing are not accepted.

Calendar keeps a selected month and bare numeric year plus Previous and Next controls in its header.
Every in-month date remains a pointer and keyboard button whether or not it has events, and the date
number stays in the same top position. Birthdays repeat annually, with February 29 shown on February
28 in non-leap years; dated tags appear only on their exact date. A tag's calendar action opens a
localized single-date calendar without repeating the tag label. Select a day to apply it or use
**Clear date** to remove the current value. Day dialogs show birthday rows without extra horizontal
list padding and expose
the same tag, edit, and delete actions as the Employee catalog. The open day re-derives its rows
after each mutation. The dated-tag section appears only when that day has events. The bounded tag
cloud opens a virtualized dialog with current and future events ascending and past events descending.
Analytics
keeps six sortable, virtualized sections and drill-down dialogs on one page. The six sections use
soft borderless tonal backgrounds, headings, columns, whitespace, and hover or focus feedback
without outlined row cards. Short sections follow their content height, while long sections expose
eight rows before scrolling internally.

The generic Download surface keeps `tags` as labels. Gender is a selectable raw stable enum field.
Selecting `tagDates` adds `{tag, date}` objects in JSON and `tag=YYYY-MM-DD` values in CSV or
templates.
