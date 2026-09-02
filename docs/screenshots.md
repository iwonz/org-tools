# Screenshots

The screenshot catalog is generated from the production applications and declared in `docs/screenshot-demo.json`. The README shows the ten featured module frames; this page covers all 38 current scenarios. Every scenario uses synthetic data, a fixed clock, local fonts, reduced motion, and no external requests.

The local server suite resets the singleton SQLite state before each workflow. The Pages suite verifies that the same scenarios can be prepared in memory without API or file-persistence controls. Every owned page is monitored for unexpected console warnings and errors, uncaught page errors, failed application requests, and failing same-origin resources. A diagnostic fails with its runtime, scenario, category, source, and bounded message; React, Next.js, MobX, localization, hydration, and application diagnostics are never suppressed. Run `pnpm screenshots:generate`, inspect both themes and languages, then run it again and compare hashes.

## Import

### State import confirmation

[![State import confirmation](screenshots/demo-import.png)](screenshots/demo-import.png)

Review the selected filename, size, Employee, and Unit counts before atomically replacing the current state.

Capabilities: Strict state validation, Summary counts, Atomic replacement.

### Invalid state recovery

[![Invalid state recovery](screenshots/feature-import-invalid-state.png)](screenshots/feature-import-invalid-state.png)

Reject partial, arbitrary, or malformed JSON without changing data and offer an immediate file re-selection action.

Capabilities: Strict rejection, No mutation, Choose another file.

## Export

### Direct state Export

[![Direct state Export](screenshots/demo-export.png)](screenshots/demo-export.png)

Download the complete validated application state directly from the sidebar without an intermediate dialog.

Capabilities: Complete state, Direct download, Unsaved live snapshot.

## Theme

### Dark theme

[![Dark theme](screenshots/demo-theme.png)](screenshots/demo-theme.png)

Use the expanded sidebar theme menu to choose Light, Dark, or System appearance.

Capabilities: Dark theme, Light option, System option, Expanded sidebar.

### Light shell and expanded navigation

[![Light shell and expanded navigation](screenshots/feature-theme-light-shell.png)](screenshots/feature-theme-light-shell.png)

Inspect the light interface with expanded module labels and locally accessible actions.

Capabilities: Light theme, Expanded sidebar, Module labels, Local actions.

## Language

### Russian interface

[![Russian interface](screenshots/demo-language.png)](screenshots/demo-language.png)

Switch the complete interface in place using the bundled Russian and English catalogs.

Capabilities: Russian locale, In-place switching, Localized navigation, Persistent locale.

### English language menu

[![English language menu](screenshots/feature-language-english-menu.png)](screenshots/feature-language-english-menu.png)

Open the English language selector with stable rows, flags, names, and selected state.

Capabilities: English locale, Flag selector, Selected indicator, Stable menu geometry.

## Teams

### Team hierarchy and roster

[![Team hierarchy and roster](screenshots/demo-teams.png)](screenshots/demo-teams.png)

Browse the edge-aligned hierarchy, selected path, searchable roster count, and one contiguous direct
and descendant Employee roster with tags and row actions but no redundant section headings.

Capabilities: Nested Teams, Search and counts, Unified roster, Employee actions.

### Create a manual Team

[![Create a manual Team](screenshots/feature-teams-create-manual.png)](screenshots/feature-teams-create-manual.png)

Create a root Team with manual membership and configure its identity and structure.

Capabilities: Create Team, Manual membership, Root hierarchy.

### Configure a Live Team

[![Configure a Live Team](screenshots/feature-teams-create-live.png)](screenshots/feature-teams-create-live.png)

Build dynamic membership from Employee birthday, position, tags, and source Team rules.

Capabilities: Live membership, Birthday filters, Position filters, Tag filters, Source Teams.

### Edit Team assignments

[![Edit Team assignments](screenshots/feature-teams-edit.png)](screenshots/feature-teams-edit.png)

Edit a Team, select its boss, and manage Employee positions and membership assignments.

Capabilities: Edit Team, Boss assignment, Membership, Per-Team positions.

## Employees

### Employee catalog

[![Employee catalog](screenshots/demo-employees.png)](screenshots/demo-employees.png)

Search the complete Employee catalog and use tag, edit, delete, contact, and Team context actions.

Capabilities: Virtualized catalog, Search and counts, Tags, Contact links, Row actions.

### Compound Employee filters

[![Compound Employee filters](screenshots/feature-employees-filters.png)](screenshots/feature-employees-filters.png)

Compose birthday, gender, position, tag, Team, and text criteria with visible match counts.

Capabilities: Birthday filter, Gender filter, Position filter, Tag filter, Team filter.

### Employee profile and assignments

[![Employee profile and assignments](screenshots/feature-employees-form.png)](screenshots/feature-employees-form.png)

Edit identity, contact, gender, birthday, embedded avatar, tags, Team membership, boss state, and positions.

Capabilities: Identity and contact, Gender and birthday, Embedded avatar, Tags, Team assignments.

### Tag date calendar

[![Tag date calendar](screenshots/feature-employees-tag-date.png)](screenshots/feature-employees-tag-date.png)

Apply or clear one exact date for an Employee tag through the localized calendar popover.

Capabilities: Quick tags, Dated tags, Calendar picker, Clear date.

### Employee Team assignments

[![Employee Team assignments](screenshots/feature-employees-form-assignments.png)](screenshots/feature-employees-form-assignments.png)

Inspect the lower Employee form with Team membership, boss state, and per-Team positions.

Capabilities: Team membership, Boss state, Per-Team positions, Multiple assignments.

### Local avatar crop

[![Local avatar crop](screenshots/feature-employees-avatar-crop.png)](screenshots/feature-employees-avatar-crop.png)

Crop and zoom a local PNG, JPEG, WebP, or pasted image before embedding a 512 by 512 local result.
WebP is preferred and the browser's PNG encoder is the compatibility fallback.

Capabilities: Local file, Clipboard image, Crop and zoom, WebP with PNG fallback.

## Employee transfer

### Employee field mapping

[![Employee field mapping](screenshots/feature-employee-import-mapping.png)](screenshots/feature-employee-import-mapping.png)

Map arbitrary flat or nested JSON properties to current Employee fields and optional Team
assignments while previewing the candidate.

Capabilities: Field mapping, Nested paths, Team assignments, Import preview.

### Employee duplicate resolution

[![Employee duplicate resolution](screenshots/feature-employee-import-duplicates.png)](screenshots/feature-employee-import-duplicates.png)

Resolve deterministic identity matches with one bulk policy and sparse per-Employee overrides before
atomic import.

Capabilities: Deterministic identity, Bulk policy, Per-Employee override, Atomic import.

## Editor

### Visual organization Editor

[![Visual organization Editor](screenshots/demo-editor.png)](screenshots/demo-editor.png)

Arrange opaque Unit cards on the adaptive snap grid with frame-bounded gestures, hierarchy lines, zoom, history, and normal-weight layout controls.

Capabilities: Canvas layout, Adaptive snap grid, Hierarchy, Zoom, Arrange and collapse.

### Editor search

[![Editor search](screenshots/feature-editor-search.png)](screenshots/feature-editor-search.png)

Reveal the right-growing search field, locate Units and Employees without leaving the canvas, and clear the query when Search closes.

Capabilities: Unit search, Employee search, Canvas navigation.

### Unit context commands

[![Unit context commands](screenshots/feature-editor-unit-commands.png)](screenshots/feature-editor-unit-commands.png)

Open Unit commands for editing, adding hierarchy, collapse and expand, copy, and local export.

Capabilities: Context menu, Add child Unit, Edit, Collapse and expand, Copy, Export.

### Bulk Employee commands

[![Bulk Employee commands](screenshots/feature-editor-bulk-employees.png)](screenshots/feature-editor-bulk-employees.png)

Select multiple Employee rows and apply shared boss, tag, edit, copy, or delete actions.

Capabilities: Multi-selection, Boss assignment, Bulk tags, Edit, Copy, Delete.

### Editor image export

[![Editor image export](screenshots/feature-editor-image-export.png)](screenshots/feature-editor-image-export.png)

Open a local hierarchy PNG whose Unit cards, centered Employee rows, complete wrapping tags, boss
marker, and connections follow the live canvas without printing Static/Live membership type, then
choose transparent, solid, or gradient backgrounds.

Capabilities: Expanded PNG preview, Complete tags, Membership-neutral cards, Hierarchy, Boss marker, Scope,
Background presets.

### Editor text template export

[![Editor text template export](screenshots/feature-editor-template-export.png)](screenshots/feature-editor-template-export.png)

Build a text representation from Employee and Unit tokens with a live preview.

Capabilities: Text template, Field tokens, Scope, Live preview.

### Editor structured JSON export

[![Editor structured JSON export](screenshots/feature-editor-json-export.png)](screenshots/feature-editor-json-export.png)

Export the selected Unit or subtree through the shared Employee-first JSON engine with configurable Unit and Tag groups.

Capabilities: JSON, Scoped Employees, Scoped assignments, Units and Tags.

### Editor image detail settings

[![Editor image detail settings](screenshots/feature-editor-image-settings.png)](screenshots/feature-editor-image-settings.png)

Configure PNG title, font, spacing, alignment, boss label, and Employee card content below the
aligned hierarchy preview.

Capabilities: Title and font, Spacing and alignment, Boss label, Employee card content.

## Analytics

### Organization Analytics

[![Organization Analytics](screenshots/demo-analytics.png)](screenshots/demo-analytics.png)

Review sortable position, birth month, birthday, first-name, last-name, and full-name distributions.

Capabilities: Six distributions, Counts, Sorting, Virtualized rows.

### Complete Analytics groups

[![Complete Analytics groups](screenshots/feature-analytics-complete-groups.png)](screenshots/feature-analytics-complete-groups.png)

Scroll the unified Analytics surface to inspect the remaining name distributions and bounded groups.

Capabilities: Last names, Full names, Content-sized groups, Internal scrolling.

### Analytics drill-down

[![Analytics drill-down](screenshots/feature-analytics-drilldown.png)](screenshots/feature-analytics-drilldown.png)

Open a distribution value to inspect matching Employee cards and their normal actions.

Capabilities: Value drill-down, Matching Employees, Employee actions.

## Calendar

### Employee Calendar

[![Employee Calendar](screenshots/demo-calendar.png)](screenshots/demo-calendar.png)

Navigate a monthly calendar with birthdays, uniformly spaced dated-tag counts, events, and a strong current-day state.

Capabilities: Monthly navigation, Birthdays, Dated tags, Today state, Tag cloud.

### Calendar day details

[![Calendar day details](screenshots/feature-calendar-day-details.png)](screenshots/feature-calendar-day-details.png)

Open a dated-event date to inspect complete Employee cards, every event label, and the ordinary
right-aligned actions without a redundant section heading.

Capabilities: Interactive dates, Conditional content, Dated-event cards, Tag history, Employee actions.

### Dated-tag event history

[![Dated-tag event history](screenshots/feature-calendar-tag-events.png)](screenshots/feature-calendar-tag-events.png)

Open a tag from the bounded cloud to inspect current and future events without a redundant heading,
plus conditional past events as complete Employee cards with right-aligned actions.

Capabilities: Tag cloud, Conditional history, Complete Employee cards, Employee actions, Virtualized dialog.

## Download

### Template Data Download

[![Template Data Download](screenshots/demo-download.png)](screenshots/demo-download.png)

Configure a separator-based template, row mode, field tokens, live preview, copy, and local download.

Capabilities: Template format, Row mode, Field tokens, Preview, Copy and download.

### Download source selection

[![Download source selection](screenshots/feature-download-source-selection.png)](screenshots/feature-download-source-selection.png)

Select Employees from Teams or the catalog, inspect and filter the resulting set, then continue from the shared header.

Capabilities: Team sources, Employee sources, Selected set, Search and filters, Exclusions.

### JSON Unit and Tag exclusions

[![JSON Unit and Tag exclusions](screenshots/feature-download-json-exclusions.png)](screenshots/feature-download-json-exclusions.png)

Enable structured Unit and Tag arrays, rename their fields, and exclude exact Units or normalized Tag labels through searchable virtualized menus.

Capabilities: Group toggles, Field naming, Unit exclusions, Tag exclusions.

### JSON Download settings

[![JSON Download settings](screenshots/feature-download-json-settings.png)](screenshots/feature-download-json-settings.png)

Choose Employee fields and configure the names of the optional nested Unit and Tag groups for JSON output.

Capabilities: JSON, Employee fields, Nested Unit fields, Nested Tag fields.

### JSON Download preview

[![JSON Download preview](screenshots/feature-download-json-preview.png)](screenshots/feature-download-json-preview.png)

Inspect the lower field list and formatted JSON structure before copying or downloading the local file.

Capabilities: Remaining fields, Formatted JSON, Copy, Local download.

## Review checklist

- Confirm Import exposes All state and Employees with mapped fields and deterministic duplicate
  choices; Export must download only the complete state directly with no dialog.
- Review light and dark themes, English and Russian menus, compact and expanded sidebar geometry, and every product module.
- Confirm startup uses one centered icon-only loader with no visible technical status copy.
- Confirm dialogs, popovers, filters, error states, Editor exports, Analytics drill-down, Calendar events, and Download previews are fully visible.
- Confirm thematic icons precede text in buttons and tabs while disclosure, sorting, removal,
  status, and count affordances retain their semantic trailing positions.
- Confirm Units has no empty hierarchy header, its path/search aligns to roster avatars, direct and
  descendant Employees form one contiguous list, and its count sits below search without roster-section headings.
- Confirm Calendar day details omit the Dated tags heading, group same-day labels by Employee, and
  expose complete Employee cards with Tag, Edit, and Delete actions.
- Confirm Calendar tag history omits the Current and upcoming heading and exposes complete Employee
  cards while retaining the conditional Past section.
- Confirm an unselected Editor Unit keeps its resting background and opacity during passive hover in
  both themes.
- Confirm the Editor operates directly on the one current Unit structure and exposes no View
  selector, create, rename, or delete controls.
- Confirm Editor PNG previews preserve the live Unit header rhythm, centered avatars, aligned name
  and tag columns, complete chip-internal tag wrapping without ellipsis, boss marker, variable row
  heights, and connection endpoints without card overlap, membership-type labels, or transient
  editing chrome.
- Confirm Editor Export exposes Image, JSON, and Template, and that Data Download exposes only JSON
  and Template. Russian uses its localized Template label consistently, JSON groups support naming
  and searchable exclusions, and previews remain bounded.
- Confirm avatar crop remains interactive, contains the source, and exposes no encoding error; the
  browser suite separately verifies the visually identical PNG fallback when WebP is unavailable.
- Confirm both runtimes expose the same sidebar actions and compact/expanded geometry.
- Require a clean browser diagnostic report for every server and Pages scenario; investigate new warnings instead of broadening an allowlist.
- Reject real data, local filesystem paths, browser notifications, external images, nondeterministic timestamps, clipping, or unintended overlays.
- Regenerate immediately; all 38 PNGs must retain identical hashes. Material differences require review and a deliberate update.
