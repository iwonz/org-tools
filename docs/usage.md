# Usage

org-tools opens directly in a blank Main View with Editor selected. One 56 px header places the six
product tabs on the left and the language, theme, **Import**, and **Export** actions on the right,
without a visible wordmark. Below 1024 px the transfer actions keep their localized accessible names
and document-arrow icons while hiding their visible labels, and the tab region scrolls horizontally
without overflowing the page. The application does not autosave. Empty product tabs show one focused
next action and omit controls that cannot yet do useful work.

The root shell, transparent header, and all six top-level product surfaces share one continuous,
theme-aware neutral background. Dialogs, cards, fields, popovers, calendar cells, and interactive
controls keep their own opaque surfaces where contrast communicates an actual boundary. The shell,
populated surface headers, dialogs, local sections, and repeated list rows use spacing, background
grouping, and interaction feedback instead of decorative horizontal rules. Borders remain on
controls, selectable cards, dialogs, calendar cells, independent split panes, hierarchy guides,
focus states, and destructive states where they communicate an actual boundary.

## Interface language

The interface supports English and Russian. On first use, org-tools selects the first supported
language from the browser preferences and falls back to English. Use the flag language menu
immediately to the left of the theme menu to switch in place. Its closed trigger shows only the
active flag; the menu shows each flag with its language name and selected indicator. The choice is
remembered locally under `org-tools-locale`. Opening or importing a workspace does not change the
language, and user-entered organization content is never translated.

The Russian interface uses localized Team terminology for Unit and Live Unit. English machine keys,
persisted types, and export fields remain unchanged.

## Product tabs

- **Units** manages the shared Unit hierarchy and effective membership.
- **Employees** manages the global Employee catalog, tags, and contact fields. Its populated header
  shows the total catalog size and adds the visible match count while search or filters are active.
- **Editor** arranges the Main View or an independent custom View on a canvas.
- **Analytics** summarizes the current organization without sending data elsewhere.
- **Calendar** combines recurring birthdays with one-time dated Employee tag events.
- **Download** selects local sources and produces CSV, JSON, or separator-based templates.

The Main View is canonical. A custom View can begin as a copy of Main or empty, then keep its own
document, local Employees, global Employee overrides, canvas layout, viewport, and command history.

## Import and export a workspace

Choose **Export** to select one of four local JSON downloads. The dialog is ordered **Teams**,
**Employees**, **Teams + Employees**, and **Full workspace**, and defaults to the full workspace on
every opening. Empty partial choices are disabled.

- Teams downloads `org-tools-teams.json` with the Main hierarchy and Live rules but no Employee
  assignments.
- Employees downloads `org-tools-employees.json` with the complete global catalog and no Teams.
- Teams + Employees downloads `org-tools-teams-employees.json` with Main hierarchy, manual
  assignments, bosses, Live filters, Live bosses, and Live position overrides.
- Full workspace downloads `org-tools-state.json`, the complete current workspace with Views,
  layout, viewport, and UI state.

Choose **Import** to open the native JSON file chooser. After a file is selected, the dialog
recognizes `content` and
offers only data available in the file. Teams + Employees offers the first three choices; Full
workspace offers all four. Partial choices default to **Append** and also allow **Replace all
current**. Append remaps UUID references, reuses unambiguous Employees without overwrite, appends
roots to Main, moves the imported layout into free canvas space, and preserves custom Views and UI.
Partial replace clears the current organization and installs only the selected projection. The two
operations appear in a separate Import mode section, with replacement styled as destructive. Full
workspace always replaces and shows a separate destructive warning.

A successful replacement closes without leaving a global filename banner. Append keeps its
localized merge summary, and failed operations continue to show their owned error without changing
the workspace.

Every operation builds and strictly validates a detached complete candidate. Canceling or any
unknown field, scope mismatch, unsafe value, invalid date, identity conflict, dangling reference, or
Live cycle leaves the current workspace unchanged.

## Import ordinary JSON

Any JSON file that does not claim `kind: "org-tools-state"` opens a mapping workflow. Choose
**Teams**, **Employees**, or **Teams + Employees**; ordinary mapping always appends and creates
manual Teams.

1. For JSON with multiple object arrays, choose the root collection. Map Team fields, recursive
   `children`, inline `employees`, and applicable Employee fields.
2. For combined JSON, map the inline `employees` array plus optional `employeeKey`, `position`, and
   `isBoss` fields.
3. If tags arrive in text, choose the delimiter. JSON tag arrays remain arrays and produce undated
   tag assignments.
4. Review the virtualized Team tree, nested Teams, Employee cards, positions, bosses, new/reused
   identity state, assignments, invalid rows, conflicts, and source examples before confirming.

Recognized Employees-only state displays the complete imported catalog as read-only cards. Teams +
Employees places manual assignment cards inside each Team and lists Employees without a direct
manual assignment separately. Live boss and position overrides appear as Live roles; calculated Live
membership is evaluated only after import.

Repeated keys are rejected. Ambiguous Employees and multiple bosses block the complete append. Live
filters are available only through a recognized scoped state. See
[Import formats](import-formats.md) for the exact rules.

The files in [`examples/`](../examples/) demonstrate arbitrary Employee headers and nested fields
using only synthetic values.

## Employee data

An Employee can have a name, email, username, explicit profile URL, embedded avatar, phone,
`MM-DD` birthday, and tags. Each tag can optionally carry one exact `YYYY-MM-DD` date. Tag identity,
search, and Live Unit filtering remain label-based. Positions and boss status belong to each
Employee-to-Unit assignment, so the same Employee can have different roles in different Units.

The Employee form and quick tag menu hide date controls behind a calendar action. A dated chip reads
`label · localized date`; bulk editing displays mixed dates and can apply or clear one date for all
selected Employees that have the label. Every Employee surface and PNG image shows all tags on
wrapped rows without `+N` counters. Ordinary JSON mapping creates undated tags; scoped state
files carry dated tags.

Profile and email links open only when activated. Choose an avatar from a PNG, JPEG, or WebP file,
use the explicit clipboard action, or paste an image while the Employee form is focused. The crop
dialog supports drag, touch, wheel, keyboard movement, and a zoom slider. Confirmation produces an
embedded 512-by-512 WebP in the form draft; saving the Employee applies it to the workspace. Cancel
keeps the previous avatar. A saved avatar can be re-cropped, replaced, or removed, while remote
images and raw data-URL editing are not accepted.

Calendar keeps a selected month and year plus Previous and Next controls in its header. Birthdays
repeat annually, with February 29 shown on February 28 in non-leap years; dated tags appear only on
their exact date. Day dialogs separate birthdays and dated tags. The bounded tag cloud opens a
virtualized dialog with current and future events ascending and past events descending. Analytics
keeps six sortable, virtualized sections and drill-down dialogs on one visually continuous page.
The surface header, section titles, and rows are borderless and use whitespace plus hover or focus
feedback. Short sections follow their content height, while long sections expose eight rows before
scrolling internally.

The generic Download surface keeps `tags` as labels. Selecting `tagDates` adds `{tag, date}` objects in
JSON and `tag=YYYY-MM-DD` values in CSV or templates.
