# Usage

## Choose a runtime

The public application at `https://iwonz.github.io/org-tools/` is fully functional and browser-only.
Its state exists in memory, synchronizes to other currently open Org Tools tabs on the same origin,
and disappears after the final tab closes. Use Import and Export to move state explicitly.

For automatic durable storage, run `pnpm dev` and open `http://127.0.0.1:3000`. The local server
stores one state in SQLite. Every organization action is written automatically; filters, searches,
theme, locale, sidebar, active sections, calendar period, selection, and viewport follow after a
short bounded delay. There is no Save action or state switcher.

On macOS or Linux, `pnpm dev-stop` stops all identified server and Pages development instances of
this checkout, including instances in other terminals or on custom ports. It waits for shutdown,
leaves production servers and other checkouts running, and succeeds if nothing is running.
Start development again with `pnpm dev` or `pnpm pages:dev`.

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
choice takes priority. The Language modal shows a bundled local flag at the logical start of each
row and switches navigation, menus, dialogs, errors, empty states,
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
  model** defines stored Value fields, repeatable Composite fields, or derived Template fields with optional MD5/SHA-256 output.
  Option values can allow multiple selections and, when configured, new shared choices created while editing an Employee.
  Composite fields contain ordered typed subfields, exactly one required primary key that is unique within each Employee,
  and zero or more records; every populated Composite date appears in Calendar. **Employee model**
  keeps these definitions on **Model** and adds **Display**, where four saved formats control cards
  in Employees, Units, Editor, and Editor image output. Each format supports `@` suggestions,
  `{token}` fields, conditions, and inline bold, italic, strikethrough, code, or links. Selecting
  text opens the local formatting menu; its link editor accepts only `http`, `https`, `mailto`, or
  `tel` addresses. Model lists Employee-owned fields separately from Unit-context fields, and custom
  Template fields suggest only values available without Unit context. Each destination has its own
  0-24 px integer line-spacing input. New organizations start every gap at 5 px and use
  `**{fullName}** {positions} {tags}` for Employees and Units. Enter creates rows, authored internal blank rows remain visible, and
  long text wraps by words with character fallback. Markdown supplies any emphasis. `{tags}` retains colored and dated chips, while
  `{positions}` renders every contextual assignment as a bordered `Position · Unit` pill.
  `{position}` and `{unitName}` remain ordinary `; `-joined text. `{isBoss}` is condition-only, so
  visible boss text is authored in a ternary. `{email}` is ordinary text until
  an author adds an explicit link such as `[{email}](mailto:{email})`. Empty formats are valid.
  The gap appears only between adjacent visible rows, with no extra space above, below, or around a
  single row. Valid edits apply immediately; blank or invalid gap text is restored or normalized on
  blur and Enter. **Reset** beside Format restores only that section's current-locale default and
  keeps every gap unchanged. Ordinary tokens do not create links. Explicit safe Markdown links work
  in interactive lists, while only the Unit-name portion of `{positions}` links implicitly in the
  Employees and Units sections. Cards outside those named sections keep it inert and use the
  Employees format;
  **Tags** manages normalized labels, filled color treatments, usage counts, rename, and cascading
  deletion. Its flat rows expose Eye, Color, Edit, and Delete: Eye opens current full Employee cards,
  Edit opens a rename-only modal, and Color opens the picker directly. The picker keeps a full custom
  palette, a synchronized opacity slider and percentage field, exact HTML Keyword, HEX, RGB, or RGBA
  entry, one compact wrapping set of localized named chips plus No color, and compact **Used colors**
  swatches collected from global Tags and every View. Used swatches preserve exact alpha, include
  inactive Views, and disappear when their last configured use is removed; no separate recent-color
  history is stored. Color and opacity remain a local preview until **Apply**; **Cancel**, Escape,
  outside dismissal, invalid input, and unchanged Apply make no change. Keyword, HEX, and RGB preserve
  the draft opacity, while RGBA updates both.
  Named colors at 100% retain their semantic name, opaque arbitrary choices use canonical `#rrggbb`,
  and lower opacity uses canonical `#rrggbbaa`; a zero-percent configured color remains distinct from
  No color. Semi-transparent fills keep their real alpha and an opaque readable foreground in both
  themes and matching PNG output. Gender is
  a native-radio segmented switcher. Birthday
  keeps Day, Month, and Year selects inside one compound field;
  Tag filters preserve the catalog order and provide normalized label search plus **Select all** and **Deselect all** for
  the visible result set while keeping hidden selections and **Without tags** unchanged. The Tag
  catalog keeps Employee usage and a nonzero **With date** count inline after each Tag. Drag a Tag
  by its leading handle, or focus the handle and use Up/Down, to change its global order.
  The whole row follows the pointer while neighboring rows make room. Hold near a list edge to
  scroll; release inside to save the shown position. Escape or release outside cancels the move. A filtered
  move inserts the Tag relative to its target in the full catalog. All Tag chips, pickers, Calendar
  groups, and export values follow that order; searching does not promote matching chips. New Tags
  append, and renaming or recoloring retains position. Tag surfaces use the same 11 px type, 16 px
  line height, 8 px horizontal and 2 px vertical padding, 6 px radius, and 6 px two-axis gaps
  throughout cards, previews, forms, pickers, filters, the catalog, Calendar, Editor, and PNG. A
  long label wraps by word and then grapheme; each wrapped part keeps its own content-sized tonal
  background, padding, radius, date or count suffix, and interaction target.
  **Unknown year** stores `1900` so Calendar can retain the known recurring day and month. Avatar cropping produces a local 512 by 512 image, preferring
  WebP and falling back to PNG when the browser cannot encode WebP. **Add Employee** is in the shared
  header. The tag field keeps every draft chip in one wrapping picker and commits it only with the
  rest of the form.
- **Editor** manages the system **Units** View and isolated planning Views on an adaptive snapped
  grid, including search, history, layout, bulk commands, Image, JSON, and Template output. A View
  can start empty or copy any existing View; custom Views may be renamed or deleted, while the
  system View is protected and stays synchronized with Units. Unit hierarchy, assignments, rules,
  history, selection, and geometry are View-local; Employee profiles, custom fields, and Tags are
  global. Copy and Paste share one transient clipboard across Views in the current tab, regenerate
  Unit identity on Paste, and keep Undo limited to the target View. A copied Live Unit whose source
  is outside the copied group is pasted as a static snapshot of its visible membership. View
  selection and management occupy the top logical start; Search, layout, Collapse/Expand,
  and always-available **Export image** occupy the top logical end. Undo/Redo share the bottom
  logical-start surface with zoom and focus, while tools stay centered at the bottom with applicable
  single-element properties directly above. The surfaces share one 48-pixel, borderless, shadowless
  visual treatment and stack into collision-free rows on compact screens. Vertical and horizontal layout are separate
  buttons: every press arranges in that direction and supports Undo/Redo, including a repeated press.
  Search expands inward without moving the
  other controls. Dragging one Unit in an existing multi-selection keeps the group selected;
  With at least two selected Units, a direction button moves only those Units in one undoable snapped
  operation; otherwise it arranges the complete hierarchy. Closing Search
  clears its query. **View settings** beside the View selector applies to every Unit in the active View,
  including Live Units. **Unit display** contains **Group by tag** and **Show Tag cloud**, both on by
  default. Each Employee appears once under their earliest catalog Tag priority; groups have no
  headings or separators and use alphabetical full-name order within them. Untagged Employees come
  last, and the boss always remains first. Turning grouping off gives one alphabetical list after
  the boss. Turning the cloud off removes the footer and its height from both Editor and PNG while
  retaining Employee Tags. **Distribution mode** settings choose **Distributed** and **Not
  distributed** colors through the shared palette, exact input, and opacity draft. Green and amber
  are the defaults; the distributed color also controls placement lines and endpoint markers.
  Employee display lines keep the normal theme text color for both distribution statuses,
  including selected rows. Safe Markdown links are styled but inert on the canvas. The Editor row
  height grows with shared rich format blocks. The selected display gap separates adjacent authored
  blocks, including complete Tags and positions blocks, without adding space above the first or
  below the last. Text, Markdown, Tags, and assignments flow inline within a block. Wrapped Tag and
  position collections keep their own 6 px internal gap, and every fragment shares its order,
  rectangle, typography, color, spacing, hit-testing, anchors, and Unit geometry with PNG. Each image dialog starts from the Editor-export format; edits in
  the dialog are temporary and do not update the Employee model. Settings
  apply immediately, support Undo/Redo, remain independent between Views, and are copied with a
  complete View. Pasted Units follow the target View settings.
  Manual Unit context menus also provide **Add open position**. An open position is a View-local
  employee-shaped row with a neutral avatar, editable title, the shared dated Tag picker, and a
  **Background color** control that accepts the bundled named/custom palette, independent opacity,
  or **No background**. The alpha-preserving background covers the complete row beneath its dashed vacancy outline and appears in
  Editor PNG. It is hidden by collapse and participates in Group by tag and canvas side attachments,
  but does not
  appear in Employees, Analytics, Calendar, distribution, Employee totals, Tag-cloud counts, or
  data exports. Its context menu supports Edit, **Replace with Employee**, and Delete. Picker
  replacement adds the chosen Employee occurrence without removing other assignments; dropping one
  Employee from another manual Unit moves that occurrence and consumes the position. Both preserve
  attached annotations, while a multi-Employee drop remains an ordinary Unit drop. A thin dashed
  outline surrounds the complete open-position row on the canvas and in Editor PNG output without
  changing its geometry; selection and drop feedback temporarily take visual priority while keeping
  the outline visible with semantic color. Employee and open-position surfaces have a compact four
  logical pixel interval only between adjacent rows; the first and last rows add no outer interval.
  The bottom-center tools row provides Select, Text, Arrow, Sticker, and embedded Image, including in
  an empty View. Arrow uses one Bezier curve with a free start and filled triangular end marker;
  Image uses a rounded-square photo glyph. Choosing a creation tool clears the current canvas selection; a plain element click selects
  only that element, while Ctrl/Cmd builds an explicit group. Right-clicking an element opens Back,
  Front, Duplicate, and Delete instead of Unit or layer-plane commands; these commands are absent
  from the properties row. Text and Sticker offer **System**, **Georgia**, **Bebas Neue**, **Lobster**,
  and **Montserrat**, with one **Bold** button switching between Regular and Bold. Text starts in
  two-axis automatic sizing, stays tight from 48 by 32 through the normal 480 by 320 cap, and may
  uniformly reduce rendered type to an 8 px floor without changing chosen font sizes. Content that
  still exceeds the cap grows downward without clipping. Any side or corner resize creates a fixed
  Width/Height frame; enlarging it restores type only to its chosen size, and an undersized frame
  grows to the minimum complete height. The shared Text/Sticker contenteditable supports
  grapheme-safe partial family, size, weight, and color formatting, caret styling, retained selection
  across property controls, and plain-text paste. Text can omit its
  background, fill the complete block, or fill each visual line; its alignment control is horizontal
  only. Historical font values and Medium weight still import safely as System/Regular, and the
  preceding plain Text State shape loads without a corruption error. DOM and PNG use the same local
  stacks, word wrapping, effective fragment layout, fills, and geometry. Sticker keeps authored
  type, grows on overflow, retains all nine alignment combinations, and has a background color and a
  flat four-pixel-radius bordered surface mirrored in PNG. Images accept only
  local PNG, JPEG, or WebP file/clipboard bytes and
  resize independently by default; hold Shift during a resize to preserve proportions. Cubic Arrows expose two
  endpoints, Bezier controls, line style, independent icon-toggle markers, and shared anchors.
  Moving or attaching one endpoint keeps the opposite endpoint and preserves the curve in the new
  chord direction. Modifier and
  marquee selection, group move/resize/rotation, global Back/Front, Delete, Copy/Paste,
  Duplicate, and Undo/Redo apply as one committed View-local command per completed gesture. Selected
  rectangular and group frames use a thin solid outline with four visible corner resize markers;
  transparent side targets resize one dimension and transparent zones directly outside the corners
  rotate around the exact center. Their screen size stays constant while zooming, every changed
  rectangle receives whole-pixel Width and Height values, one attached element keeps the center of
  its current bounds fixed, and groups use their shared bounds center. Resting selections have no
  connector markers. With the Arrow tool armed, or while an endpoint is being attached, hovering an
  eligible Unit, Employee or open-position row, element, or Arrow outlines that one owner and reveals all of its
  anchors; the nearest in-range anchor is emphasized and an exact point can start the Arrow. There
  is no detached rotation handle, persistent aspect lock, or permanent anchor field. Clicking outside an
  active Text or Sticker editor saves once before normal selection routing; the first Escape saves
  and leaves the element selected, while the next Escape clears that resting selection. Contextual
  settings stay in one compact auto-width row; alignment, geometry, and common actions open only
  when requested. Back places only the selected ordered block below complete Unit cards, while Front
  places it above complete Unit cards without changing attachments.
  Every hierarchy total counts unique Employees in that Unit and all descendants, including anyone
  also assigned to ancestors. Bosses count once, and collapse or distribution mode never changes
  the totals. Canvas, PNG, Units, and hierarchy selection trees share this meaning.
  Unit cards keep the same opaque background
  when hovered or selected, with selection indicated only by the signal border. PNG output mirrors
  the live Unit header, four-pixel interior-only roster spacing, centered avatars, boss marker,
  variable row heights,
  direct-membership Tag summary footer, persistent distribution row tones, and hierarchy connections
  while retaining a light export palette and configurable output styling. Unit-only and subtree
  images determine distribution status from the complete active View, including assignments outside
  the image scope. Footer chips use the universal insets and follow their own label/count width rather
  than reserving trailing space. Long footer and Employee-row Tags wrap into content-sized decorated
  fragments without an ellipsis or full-width colored remainder, including mixed scripts and emoji;
  the count suffix stays together. Static/Live
  membership type is not printed. Dragging Units, Employees, connections, or a marquee near the
  canvas edge smoothly pans in that direction without ending the gesture. Deleting a nested or
  multi-Unit selection is one atomic operation that removes stale selections, filters, and output
  references before automatic storage. A Unit note action appears on hover or keyboard focus and
  stays visible in its signal color when content exists. It always opens on **Preview**; **Editor**
  changes a private Markdown draft that becomes one undoable View-local update only after
  **Save**. Clearing and saving removes the note, while closing a changed draft requires explicit
  discard confirmation. View cloning and cross-View Copy/Paste carry notes; Image, JSON, and
  Template Editor exports omit them. **Distribution mode** in a Unit context menu independently
  highlights direct members with the View distributed color when they also belong to another Unit
  in the active View and its undistributed color when they exist only in the source Unit. Its tri-state context switch can update one Unit or the whole
  selected Unit set in one operation. Ordinary Units expose placement links only for Employees
  assigned to at least two ordinary Units
  in that View; reference Units do not count or appear in their maps. Distribution-enabled sources
  retain all direct placements, including other references. The independent action opens a
  read-only local map with pan, zoom, Fit, and exact navigation back to an
  expanded and selected Employee occurrence. Selecting exactly one Employee draws local placement links,
  including a card-edge marker for a collapsed target; multi-selection hides the links without
  disabling the highlights. The setting is View-local and does not alter Units, history, geometry,
  JSON, or Template output. Editor Image exports preserve its stable row tones without selection,
  placement lines, or endpoint markers. The dedicated View Image dialog previews the entire durable
  scene in a preview-first vertical dialog, with the background picker, padding, Unit radius, and
  Employee format arranged below it before the Copy and Save controls. Solid backgrounds use the shared preset, used, and custom color picker with
  opacity. Its Employee rows use the saved Editor-export line spacing and standard structure text
  uses the system UI font; Text and Sticker elements retain their own typography.
  Full-View and Unit/subtree previews begin fitted and support pointer-centered wheel zoom,
  10%-to-400% controls, 100%, Fit, drag pan, and keyboard pan. Manual zoom and the relative center
  survive preview regeneration; these inspection controls never affect the PNG or View state.
  Export always requests 3× output, then applies canvas safety limits silently.
  Employee format uses the shared `@` suggestion input and its information help documents
  `{condition ? 'value' : 'fallback'}`; Copy and Save retain the standard clipboard and download
  icons. Scoped Template export also offers **Keep only unique values** and **Remove empty lines**;
  its preview, Copy, Save, and preview totals all describe the same filtered output.
  Unit/subtree Image export includes transitively attached annotations but excludes free or external
  ones. Editor exports always use the active View.
- **Analytics** derives organization distributions locally without repeating the page title. It
  reports known birth years and completed ages, including one-decimal averages plus deterministic
  youngest and oldest Employees for everyone, men, and women. Missing birthdays and the `1900`
  unknown-year sentinel are excluded. Every Eye drill-down uses current full Employee cards with
  Tag, Edit, and Delete actions.
- **Calendar** combines recurring birthdays and dated tags with localized weekday order, leading
  month offsets, soft rose weekend tones, a horizontal Tag rail, conditional Today navigation, event-bearing interactive dates, and Employee
  actions. Empty dates remain non-interactive and open no dialog. A day dialog is one vertical scroll: nonempty Birthdays come first, followed by each
  interactive Tag heading and its full Employee-card list. Day and tag dialogs omit redundant
  descriptions, generic dated-event/current-future headings, special event subtitles, and empty
  Birthday, dated-event, or Past sections. Both day details and dated-tag
  history use complete Employee cards with the ordinary Tag, Edit, and Delete actions while
  retaining bounded scrolling and tag-history navigation.
  Day-dialog titles follow the active locale; Russian titles omit the abbreviated year suffix and
  use the catalog's corrected backward/forward navigation labels.
- **Data Download** first selects the system or a custom View, then uses equal source and
  selected-Employee panes whose geometry stays fixed when switching Team/Employee sources. Changing
  View clears source-specific selections, Unit exclusions, and filters, then produces structured
  JSON or Template output from Employees assigned in that View.
  JSON always produces one record per Employee. Drag handles order scalar fields and the ordinary
  Unit and Tag rows in one list; enabled Unit and Tag arrays expose their own reorderable fields,
  names, and searchable exclusion menus. Template creates one row for every retained assignment in
  structural order and keeps a fallback row for a directly selected Employee without a Unit. Every
  token-aware Format label includes a help icon, and
  its placeholder explains that typing `@` opens a localized caret menu and inserts the stable
  `{token}` syntax. The information help also shows the supported
  `{condition ? 'value' : 'fallback'}` form. Unit paths use the fixed ` / ` separator. **Continue**
  stays disabled in the shared header until at least one Employee is selected. **Remove empty
  lines** deletes whitespace-only Template lines from preview, Copy, and Download. **Keep only
  unique values** keeps the first exact occurrence of each final text line after optional empty-line
  removal. Preview, counts, Copy, and Download use that same processing order; closing the settings
  resets both options.

## Import and Export

**Import** opens a modal with **All state** and **Employees**. All state accepts the exact current
state shape up to 25 MiB and replaces it atomically after confirmation. Employees accepts a JSON
array, shows a bounded preview of the first record with the most mappable properties, and lists every
discovered source path beside a real Org Tools target Select. Each target belongs to only one path;
selecting an occupied target transfers it from the previous row. UUID, first name, last name, and
email are required, and nested Team assignments import only when Teams is mapped. Existing Value fields may be mapped and new
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

Repository delivery handles an owned snapshot from the immediately previous valid State shape
before publication: the server is stopped, the database family is backed up, the additive conversion
is validated offline and committed once, and the configured server is reopened. This is not an
automatic product migration; unexpected, older, mixed, or corrupt shapes continue to use the
blocking recovery workflow without silent mutation.

See [State transfer format](import-formats.md), [Privacy](privacy.md), and
[Screenshots](screenshots.md) for the exact boundaries and visual catalog.
