# project-tooling Specification

## Purpose
Define the specification workflow, privacy-preserving development commands, and public automation.
## Requirements
### Requirement: OpenSpec governs repository changes
The repository SHALL include the Codex OpenSpec integration, English project context, strict
validation, and archived capability specifications.

#### Scenario: Specification validation
- **WHEN** `pnpm spec:validate` runs
- **THEN** all active changes and main specs pass strict non-interactive validation

#### Scenario: Telemetry-free specification commands
- **WHEN** a contributor runs OpenSpec through `pnpm spec -- ...`
- **THEN** the repository wrapper applies the CLI's documented telemetry opt-out variables

### Requirement: Repository changes complete one closed delivery lifecycle
Every repository change MUST begin from a clean current default branch, proceed through one isolated
OpenSpec change, and finish integrated, published when allowed, archived, validated, and free of
dangling work.

#### Scenario: Clean current start
- **WHEN** a contributor begins a repository change
- **THEN** they fetch the configured origin, update `main` without rewriting history, verify that the
  worktree is clean and `main` matches `origin/main`, and resolve any active OpenSpec change before
  creating new work

#### Scenario: Isolated OpenSpec implementation
- **WHEN** the clean baseline is ready
- **THEN** the contributor creates a short-lived `change/<openspec-change-name>` branch, creates or
  continues exactly one OpenSpec change, reads its artifacts and relevant documentation, and keeps
  implementation, tests, documentation, and task status together

#### Scenario: Validated and archived change
- **WHEN** implementation tasks are complete
- **THEN** formatting, static checks, unit tests, production build, browser tests, screenshot
  generation and visual review, deterministic screenshot verification, public-safety checks,
  OpenSpec validation, and diff checks pass before delta specs are synchronized and the completed
  change is archived

#### Scenario: Integrated delivery
- **WHEN** the archived change is ready for delivery and publication is allowed
- **THEN** the contributor creates meaningful commits, updates and merges into `main`, pushes `main`
  to the configured origin, removes the merged change branch, and verifies that local `HEAD`, local
  `main`, and `origin/main` agree with a clean worktree, no unique change commits, and no active
  OpenSpec changes

#### Scenario: Explicit publication exception
- **WHEN** the user explicitly forbids publication or an external service blocks the final merge or
  push
- **THEN** the contributor preserves the safest clean local state and reports the exact incomplete
  integration instead of claiming that the delivery lifecycle is complete

### Requirement: Browser validation fails on unexpected runtime diagnostics
Development and production browser validation SHALL monitor every owned page for console errors and
warnings, uncaught page errors, hydration diagnostics, failed application requests, and failing
same-origin resource responses. React, Next.js, MobX, localization, accessibility, and application
diagnostics MUST NOT be suppressed or allowlisted. Any exception for browser-generated noise MUST
be narrow, documented beside its matcher, and include no organization data.

#### Scenario: Development React diagnostic
- **WHEN** the development probe renders and interacts with the application while React development
  diagnostics are enabled
- **THEN** a render-phase update, hydration mismatch, uncaught error, or unexpected console warning
  fails the probe with its source and message

#### Scenario: Complete production workflow audit
- **WHEN** the maintained server and Pages browser catalogs exercise Import, Export, theme,
  language, Teams, Employees, Editor, Calendar, Data Download, menus, dialogs, and
  representative mutations
- **THEN** every page finishes without an unexpected console error or warning, page error, failed
  application request, or failing same-origin resource response

#### Scenario: Actionable failure report
- **WHEN** an unexpected browser diagnostic occurs
- **THEN** validation reports the runtime, scenario, diagnostic category, URL when available, and
  message without transmitting the diagnostic or synthetic state outside the local test process

### Requirement: Public automation uses supported action runtimes
Repository CI and Pages publication workflows SHALL use maintained official action major versions
whose declared inputs are supported and whose JavaScript runtimes are accepted by GitHub-hosted
runners without deprecation annotations.

#### Scenario: CI workflow starts
- **WHEN** GitHub runs the repository validation workflow on a clean checkout
- **THEN** checkout, package-manager setup, Node.js setup, and screenshot artifact upload execute on
  their maintained action runtimes without deprecated-runtime annotations

#### Scenario: Pages workflow uploads the complete artifact
- **WHEN** GitHub runs the manually dispatched Pages workflow
- **THEN** configuration, hidden-file artifact upload, and deployment use supported action majors
  and accepted inputs without deprecated-runtime or unexpected-input annotations

### Requirement: Documentation and gallery cover current product surfaces
The repository SHALL document both local-only runtimes, six bundled locales, Arabic RTL, isolated
Editor Views over global Employees, View-selectable Data
Download, wrapped direct Tag footers, modal Language and Theme settings, selected-only Editor
arrangement, direct State Export, source-driven Employee Import, colored Editor PNG Tags, privacy,
performance, and screenshots without obsolete guidance. The deterministic gallery SHALL contain
exactly 56 PNGs and the README SHALL retain exactly nine featured Import, Export, Theme, Language,
Units, Employees, Editor, Calendar, and Download frames.

#### Scenario: Complete gallery
- **WHEN** screenshot generation runs against the production runtimes
- **THEN** it deterministically replaces exactly 56 declared PNGs covering only current product workflows

#### Scenario: Locale gallery
- **WHEN** Language frames are generated
- **THEN** the primary frame shows six flagged language rows and the supporting frame demonstrates Arabic RTL

#### Scenario: Updated workflow gallery
- **WHEN** Editor, Units, Calendar, Language, Import, Download, and Tag frames are generated
- **THEN** they show View selection and management, direct Tag footers, View Download source, colored PNG Tags, rose weekends, flags, target Selects, and flat spaced Tag management

#### Scenario: View workflow gallery
- **WHEN** the four supporting View frames are generated
- **THEN** they show the selector, Blank/Copy dialog, isolated custom document, and Rename/Delete lifecycle with synthetic data

#### Scenario: Transfer gallery
- **WHEN** screenshot generation completes
- **THEN** featured Import shows State and Employee modes while supporting frames show source-driven mapping and explicit database recreation

#### Scenario: Tag management gallery
- **WHEN** Tag supporting frames are generated
- **THEN** catalog, rename, quick color, full Employee membership, and separated padding-free rows are visible across the maintained scenarios

#### Scenario: Structured-output gallery
- **WHEN** screenshot generation completes
- **THEN** Data Download shows its View source, JSON collections, exact exclusions, bounded preview, Template, and token suggestions while Editor shows Image, JSON, and Template for the active View

#### Scenario: Editor gallery
- **WHEN** Editor frames are generated
- **THEN** the system selector and protected management state are visible without restoring View-local Employee copies or overrides

#### Scenario: Featured README
- **WHEN** a visitor opens README
- **THEN** the same nine current product previews remain featured and every linked PNG exists

#### Scenario: Deterministic generation
- **WHEN** the 56-frame gallery is generated twice from unchanged source and fixed fixtures
- **THEN** every PNG hash is identical and every owned page has no unexpected console or network diagnostic

#### Scenario: Full-View image settings frame
- **WHEN** the full-View image export gallery frame is captured
- **THEN** it shows the preview above the uncompressed settings and no redundant explanatory subtitle

### Requirement: Localization validation covers every supported catalog
Automated checks SHALL validate exact keys, placeholders, non-empty translations, allowed technical
tokens, browser detection, writing direction, and representative visible and accessibility surfaces
for `en`, `zh`, `ru`, `es`, `fr`, and `ar` in both production runtimes.

#### Scenario: Validate six catalogs
- **WHEN** repository and browser validation runs
- **THEN** every supported locale passes static parity and runtime surface checks without fallback copy

#### Scenario: Validate large localized data
- **WHEN** Editor exercises 20,000 Employees and 4,000 Units
- **THEN** locale-only UI changes do not serialize organization state or trigger per-frame full scans

### Requirement: Gallery documents Employee schema, Tags, and Calendar
The deterministic gallery SHALL contain 56 PNG files: the maintained workflows plus View selection,
copy creation, isolated editing, rename/delete, and Unit note Preview/Editor scenarios. Every PNG SHALL use synthetic data and
appear identically across two generations.

#### Scenario: Regenerate the gallery
- **WHEN** screenshots are generated twice from the same clean production build
- **THEN** all 56 referenced PNG files exist and their SHA-256 manifests match

### Requirement: Large-model validation remains bounded
Automated checks SHALL exercise 20,000 Employees and 4,000 Units with identity, Tag, custom field,
Import, filter, and output indexes, and SHALL fail on organization serialization or complete-list
rendering caused only by UI interaction.

#### Scenario: Filter the large fixture
- **WHEN** a custom filter changes on the maintained fixture
- **THEN** indexed matching and virtualized options respond without rebuilding organization state

### Requirement: Gallery verifies Tag fill semantics
The deterministic screenshot gallery SHALL show named, arbitrary, and alpha Tag colors as readable
filled surfaces without separate leading color dots in representative Employee, Tag catalog,
Calendar, assignment, and Editor PNG workflows. Tag supporting frames SHALL show the separate rename
modal, row-level quick color Popover with full palette, opacity controls, exact type Select, wrapping
preset chips, and Apply or Cancel actions, plus the full Employee membership dialog. The maintained
Template token frame SHALL show the Format help affordance and localized guidance.

#### Scenario: Regenerate Tag-bearing frames
- **WHEN** the maintained 56-frame gallery is generated twice from unchanged source
- **THEN** affected PNGs show named, arbitrary, and transparent fills, compact presets, opacity, draft actions, flat rows, rename, membership, and identical hash manifests

#### Scenario: Validate exact custom color behavior
- **WHEN** browser validation enters HTML Keyword, HEX, RGB, and RGBA colors plus opacity in both runtimes
- **THEN** valid drafts preview locally and Apply resolves one canonical color, invalid or canceled drafts preserve the previous value, and the type Select remains inside its parent Popover

#### Scenario: Validate shared picker consumers
- **WHEN** browser validation opens Tag, distribution, Text, Sticker, and Arrow color controls
- **THEN** every shared Popover exposes the same compact presets, opacity, atomic Apply, and Cancel behavior while the Image-export background uses the same picker contract

#### Scenario: Validate Format guidance
- **WHEN** browser validation visits each token-aware Format surface
- **THEN** a help icon follows the label and exposes localized `@` guidance on hover and keyboard focus

### Requirement: Gallery verifies universal Unit Tag footers
The maintained Editor screenshots SHALL show content-sized direct-Tag footer chips with the
universal 8 pixel inline inset, 6 pixel two-axis gaps, and no extra trailing area after the measured
count. Screenshot generation SHALL retain the maintained 56 declared scenarios.

#### Scenario: Regenerate Editor frames
- **WHEN** the deterministic gallery is generated twice from unchanged source
- **THEN** affected Editor frames show universally sized evenly inset footer chips and all 56 PNG hashes match between runs

### Requirement: Large multi-View validation remains bounded
Automated checks SHALL exercise global Employee mutation, active View switching, Data Download source
switching, and Tag footer derivation with 20,000 Employees and 4,000 Units without eager inactive-View
rebuilds, UI-triggered organization serialization, or complete-list rendering.

#### Scenario: Switch a large View
- **WHEN** the maintained large fixture changes active View, viewport, or selection
- **THEN** only required derived structures build and no organization write occurs until a structural command

### Requirement: Gallery and browser checks cover refined cross-View interactions
The maintained 56-frame deterministic gallery SHALL cover the current scenario set while updating the
Editor View, clipboard, and Unit footer frames. Browser validation SHALL exercise cross-View paste,
all four edge-pan drag modes, nested and multi-selection deletion, and tooltip absence in both server
and Pages runtimes without console, page, resource, or external-network diagnostics.

#### Scenario: Regenerate affected Editor frames
- **WHEN** the 56-frame gallery is generated twice from unchanged source and fixtures
- **THEN** complete wrapping footer Tags and the current View interactions appear with identical SHA-256 manifests

#### Scenario: Validate large interaction performance
- **WHEN** edge-pan and deletion are exercised with 20,000 Employees and 4,000 Units
- **THEN** no drag frame serializes organization state or performs a complete Unit scan and release creates at most one viewport commit and one structural command

### Requirement: Validation and gallery cover Unit Markdown notes
Repository validation SHALL cover strict Unit note state, View-local history and copying, safe
Markdown, both runtime persistence paths, localization, accessibility, and browser diagnostics. The
deterministic gallery SHALL contain exactly 56 PNGs including Unit note Preview and Editor scenarios
while the README retains its ten featured frames.

#### Scenario: Generate Unit note frames
- **WHEN** screenshot generation runs twice from unchanged source and fixtures
- **THEN** all 56 PNGs have identical hashes and the two note frames show Preview and Editor with
  synthetic Markdown content

### Requirement: Validation and gallery cover Editor distribution mode
Repository validation SHALL cover strict View UI state, manual and Live membership, bounded
derivation, context-switch accessibility, persisted highlighting, single-selection connections,
multi-selection suppression, collapsed fallbacks, output exclusion, localization, and browser
diagnostics. The deterministic gallery SHALL contain exactly 56 PNGs while README retains ten
featured frames.

#### Scenario: Generate distribution frames
- **WHEN** screenshot generation runs twice from unchanged source and fixtures
- **THEN** all 56 hashes match and supporting frames show status highlighting plus selected placement connections

#### Scenario: Validate the large Editor
- **WHEN** 20,000 Employees and 4,000 Units exercise distribution mode
- **THEN** selection and viewport changes do not rebuild membership indexes, scan all Units, or write organization state

#### Scenario: Validate a large noted Editor
- **WHEN** performance coverage renders 20,000 Employees and 4,000 Units with closed notes
- **THEN** no note Markdown is parsed, no organization write occurs, and spatial canvas behavior
  remains bounded

### Requirement: Validation covers Tag-filter bulk selection
Repository validation SHALL cover complete Tag selection, complete deselection, disabled states,
Without tags independence, shared filter consumers, six locales, RTL, large virtualized catalogs,
both runtimes, and browser diagnostics. The maintained deterministic gallery SHALL remain exactly 56
PNGs and update its existing Employee-filter frame without adding a scenario.

#### Scenario: Validate shared filter consumers
- **WHEN** browser coverage exercises Tag filters in ordinary and Live Unit workflows
- **THEN** the same bulk controls and one-update semantics work without console, page, resource, or network diagnostics

#### Scenario: Regenerate the gallery
- **WHEN** screenshot generation runs twice from unchanged source and fixtures
- **THEN** all 56 hashes match and the existing Employee-filter frame shows the bulk Tag actions

### Requirement: Validation covers bulk distribution and Tag discovery
Repository validation SHALL cover single, all, and mixed distribution selections, one bounded UI
update, multi-placement row actions, read-only map navigation, searchable locale-aware Tag options,
search-scoped bulk selection, inline catalog counts, both runtimes, six locales, RTL, browser
diagnostics, and maintained large-model limits. The deterministic gallery SHALL contain exactly 56
PNGs while README retains ten featured frames.

#### Scenario: Validate both runtimes
- **WHEN** browser coverage exercises the workflows in server and Pages applications
- **THEN** behavior matches without console, page, resource, or unexpected network diagnostics

#### Scenario: Validate the large model
- **WHEN** 20,000 Employees and 4,000 Units exercise the placement map and Tag filters
- **THEN** viewport and selection do not rebuild membership indexes, the map reads only one Employee's placements, and Tag rows remain virtualized

#### Scenario: Regenerate the gallery
- **WHEN** screenshot generation runs twice from unchanged source and fixtures
- **THEN** all 56 hashes match and supporting frames show bulk distribution plus Employee placement navigation

### Requirement: Validation covers catalog ordering and Unit grouping
Repository validation SHALL cover atomic pointer and keyboard Tag moves, filtered insertion and cancellation, scrollable nested color presets, conditional dated counts, strict grouping state, earliest-Tag grouping, boss placement, View-local history and copying, manual and Live membership, ordered output, both runtime persistence paths, accessibility, localization, and bounded derivation. The 56-frame deterministic gallery SHALL include View settings with default-enabled grouping and Tag cloud switches plus distribution colors and catalog rows with leading reorder handles. README SHALL retain ten featured frames.

#### Scenario: Validate ordered presentation in both runtimes
- **WHEN** users reorder Tags and toggle View grouping in browser validation
- **THEN** the catalog and Employee Tag surfaces retain the global sequence, each Employee appears once in the expected canvas and PNG sequence, and SQLite reload or live-tab exchange preserves the result without unexpected diagnostics

#### Scenario: Validate the current-only state boundary
- **WHEN** a View omits settings or supplies invalid settings
- **THEN** the complete state is rejected without mutation and the runtime does not migrate it

#### Scenario: Regenerate settings and catalog frames
- **WHEN** the gallery is generated twice from unchanged source and fixtures
- **THEN** all 56 PNG hashes match and the new settings frame shows the View display switches and distribution color fields

### Requirement: Validation covers reference-aware placements and reliable Editor controls
Browser and unit coverage SHALL exercise ordinary/reference placement eligibility, live mode changes, full-row pointer sorting, gaps, auto-scroll, cancellation and peer replacement, independent layout buttons, and exact unique subtree counts in both runtimes. The maintained 56-frame gallery SHALL remain deterministic and be visually reviewed. The 20,000 Employee and 4,000 Unit bounds SHALL remain covered without organization writes during drag preview or eager per-row membership scans.

#### Scenario: Validate the refined interactions
- **WHEN** the complete repository checks and both production browser suites run
- **THEN** placement maps, drag completion, direction history, and hierarchy counts match the requirements without unexpected diagnostics

#### Scenario: Regenerate the gallery
- **WHEN** all 56 PNGs are generated twice from unchanged source and fixtures
- **THEN** their hashes match and each frame passes visual review

### Requirement: View settings receive end-to-end verification
Documentation and the deterministic gallery SHALL cover View settings, cloud visibility, and
custom distribution colors. Validation SHALL exercise isolated history, View copying, Unit Paste,
strict state boundaries, live-tab synchronization, canvas/PNG agreement, and the maintained scale.

#### Scenario: Review the gallery
- **WHEN** screenshots are generated
- **THEN** the View settings dialog is represented, every PNG is visually reviewed, and repeated generation has identical hashes

#### Scenario: Convert the configured database offline
- **WHEN** the explicitly authorized current database is converted with its process stopped
- **THEN** a consistent backup precedes production validation and one revision-incrementing transaction, failure leaves the original unchanged, already-current data is a no-op, and no database or temporary tool enters Git

### Requirement: Gallery demonstrates canvas tools and complete View export
The deterministic 56-frame gallery SHALL keep its existing frame count while updating the featured
Editor frame to show the tools surface and representative Text, Sticker, embedded Image, and curved
Arrow elements. The Editor image-export and image-settings frames SHALL show the complete View
preview, selected density, actual dimensions, and shared settings using obviously synthetic embedded
content.

#### Scenario: Generate the updated gallery twice
- **WHEN** the maintained screenshot workflow runs twice from the same clean production state
- **THEN** every PNG is visually valid, the second run has identical hashes, no real organization or remote image appears, and the catalog still contains exactly 56 frames

### Requirement: Canvas interaction retains large-Editor bounds
Automated checks SHALL cover canvas-element spatial queries, dependency resolution, frame-coalesced
previews, image validation, both production runtimes, and full/scoped PNG output while preserving the
20,000-Employee and 4,000-Unit target.

#### Scenario: Interact with a large annotated Editor
- **WHEN** pointer preview or anchor snapping runs in a large Editor with canvas elements
- **THEN** it examines bounded nearby spatial candidates, updates only the affected dependency closure, and performs no persistent write until one final commit

### Requirement: Browser and gallery checks cover organization color reuse and refined tool glyphs

Automated Server and Pages checks SHALL verify Used colors across every remaining shared picker consumer, including inactive-View sources, alpha variants, atomic Apply/Cancel behavior, keyboard operation, narrow width, and RTL. The maintained deterministic gallery SHALL show the Used colors section and refined Arrow and Image icons without increasing its 56 scenarios.

#### Scenario: Validate every shared picker consumer
- **WHEN** browser validation opens Tag, distribution, Text, Sticker, and Arrow color controls
- **THEN** each exposes the same organization-wide Used colors and reuses a swatch only through Apply

#### Scenario: Validate refined toolbar icons
- **WHEN** browser validation inspects the Editor tool surface
- **THEN** the Arrow SVG has one cubic path plus a filled end triangle, the Image tool uses the rounded photo glyph, and both retain their accessible names

#### Scenario: Regenerate maintained screenshots
- **WHEN** the 56-frame gallery is generated twice from unchanged source
- **THEN** affected color-picker and Editor frames show the current section and icons and both SHA-256 manifests match

### Requirement: Validation covers Editor Unit row spacing

Unit and browser validation SHALL cover first, middle, and last Employee/Staffing Slot rows, variable Tag heights, virtualization, collapse, attachments, DOM/PNG agreement, and both production runtimes. The deterministic gallery SHALL retain its existing 56 scenarios while showing the current row rhythm.

#### Scenario: Validate both runtimes
- **WHEN** Server and Pages browser checks inspect a mixed expanded Unit
- **THEN** computed row bounds contain only interior four-pixel intervals and interaction geometry remains aligned

#### Scenario: Regenerate Editor evidence
- **WHEN** the 56-frame gallery is generated twice from unchanged source and fixtures
- **THEN** affected Editor and Image-export frames show matching spacing and both SHA-256 manifests match

### Requirement: Advanced fields and paste arbitration are regression tested
Automated checks SHALL cover exact state parsing, definition and value validation, filters, Template and JSON output, mapped Import, Calendar indexing, accessible switches, custom-option commits, and keyboard paste event ordering while retaining the 20,000 Employee and 4,000 Unit target.

#### Scenario: Run the publication checks
- **WHEN** the full repository validation lifecycle runs
- **THEN** advanced-field workflows and single-paste behavior pass in both server and browser-only runtimes without console, resource, localization, or privacy failures

### Requirement: Screenshot gallery covers Employee display formats
The deterministic gallery SHALL remain exactly 56 PNG files. The primary Employee-model frame SHALL
show the icon-labeled Display tab, flat format sections, numeric line-gap inputs, per-format Reset
actions, a rich native preview, the Markdown selection menu, and no Display Save button. Existing
Value and Template frames SHALL continue to cover Model. Repeated unchanged generation MUST produce
identical hashes.

#### Scenario: Generate the Employee model gallery
- **WHEN** the maintained gallery is generated twice from unchanged source
- **THEN** all 56 PNG hashes match and the Employee-model frames cover live Markdown Display editing, Reset actions, numeric gaps, and the existing Model workflows

### Requirement: Maintained validation covers unified Employee inline layout
The deterministic gallery and browser suite SHALL retain the maintained scenario count and cover
complete username and email suffixes, actual-font Markdown measurement, one universal Tag surface,
long multilingual Tag fragments, dated and counted suffix insets, adjacent formatted Employee
content, both PNG format inputs, Editor geometry, virtualized Tag controls, catalog drag previews,
Calendar, and Unit Tag footers. Two unchanged gallery runs MUST produce identical hashes.

#### Scenario: Regenerate unified layout frames
- **WHEN** the maintained gallery is generated twice after the shared layout change
- **THEN** every one of the 56 hashes matches and affected frames show complete identity text plus aligned DOM and PNG Tag geometry

#### Scenario: Exercise multilingual measurement
- **WHEN** browser validation renders Latin, Cyrillic, Arabic, CJK, emoji, Markdown marks, dates, and counts across supported surfaces
- **THEN** no final glyph is clipped and every Tag suffix retains the exact shared trailing inset

### Requirement: Simplified export controls retain deterministic coverage
Browser smoke tests and the maintained 56-frame gallery SHALL cover the recognizable Arrow icon,
all-assignment Template output, both transient line filters, fixed-density PNG output, simplified
image settings, and the shared solid-background color dropdown in both production runtimes. Gallery
generation SHALL remain deterministic and SHALL add or remove no frames.

#### Scenario: Validate simplified exports
- **WHEN** the full repository validation workflow runs
- **THEN** both runtimes exercise the updated Template and PNG surfaces without obsolete row-mode, density, title, or output-font controls

#### Scenario: Preserve the gallery contract
- **WHEN** screenshots are generated twice from the same commit
- **THEN** exactly 56 PNG files are produced with matching hashes and every updated image is visually reviewed

### Requirement: Staffing Slot delivery has deterministic Editor evidence

Browser validation SHALL cover named and unnamed Staffing Slots in manual and Live Units, create/edit/delete, one-slot and selected-slot movement, Tags, strict State, selection, anchors, Unit/View copy, Slot-first ordering, zero-filtered summaries, Rose surfaces, collapse, virtualization, Undo/Redo, and DOM/PNG parity in both production runtimes. The maintained 56-frame gallery SHALL show the revised Editor without adding a scenario and SHALL remain deterministic across two runs.

#### Scenario: Validate Staffing Slot workflows
- **WHEN** Server and Pages browser checks exercise mixed Unit hierarchies with zero and nonzero summary values
- **THEN** Slot lifecycle, ordering, surface, summary visibility, and geometry pass while Units and Employee-oriented surfaces remain unchanged

#### Scenario: Regenerate maintained screenshots
- **WHEN** the 56-frame gallery is generated twice from unchanged source and fixtures
- **THEN** every PNG is visually inspected and both SHA-256 sets are identical

### Requirement: Delivery converts an owned previous-schema database safely

A release replacing the exact open-position State shape MUST record whether the configured owned SQLite database is absent, already current, or safely converted from the immediately previous valid shape. Conversion MUST occur with the runtime stopped, a timestamped database-family backup, detached and committed-row production-parser validation, preservation comparison, and ordinary startup proof. Converter and database artifacts MUST remain uncommitted.

#### Scenario: Convert the configured previous snapshot
- **WHEN** the owned database contains the immediately previous valid open-position shape
- **THEN** slot names, Tags, IDs, selections, and anchors are retained, obsolete colors are removed, revision advances once, and all checks complete before publication

### Requirement: Validation covers empty Unit action containment

Repository validation SHALL cover expanded empty manual and Live Units, collapsed geometry, zoomed DOM containment, action accessibility, hierarchy spacing, anchors, and DOM/PNG agreement in both production runtimes. The deterministic gallery SHALL remain exactly 56 PNG files.

#### Scenario: Validate both runtimes
- **WHEN** Server and Pages browser checks render empty manual and Live Units at ordinary and enlarged zoom
- **THEN** every empty-state child remains within its Unit border without clipping external connection or child-Unit controls

#### Scenario: Regenerate maintained screenshots
- **WHEN** the 56-frame gallery is generated twice from unchanged source and fixtures
- **THEN** every PNG passes visual review and both SHA-256 manifests are identical

### Requirement: Validation covers compact Unit content spacing

Repository validation SHALL cover one-line and two-line Unit summaries, Employees, Staffing Slots, Manual and Live empty states, collapsed geometry, zoomed DOM spacing, hierarchy placement, anchors, and DOM/PNG agreement in both production runtimes. The deterministic gallery SHALL remain exactly 56 PNG files.

#### Scenario: Validate both runtimes
- **WHEN** Server and Pages browser checks render Units with one or two summary lines at ordinary and enlarged zoom
- **THEN** the last summary line and following content use the same eight-pixel interval while row geometry, empty-state containment, and external controls remain correct

#### Scenario: Regenerate maintained screenshots
- **WHEN** the 56-frame gallery is generated twice from unchanged source and fixtures
- **THEN** every PNG passes visual review and both SHA-256 manifests are identical

### Requirement: Container tooling is reproducible
The development and CI toolbox SHALL pin Node, pnpm, PostgreSQL, browser, and OpenSpec versions through
tracked image and lock inputs. Every documented format, lint, typecheck, unit, integration, browser,
screenshot, build, migration, specification, and publication command SHALL run through Compose on a
host with Docker and Git only.

#### Scenario: Validate a clean checkout
- **WHEN** a contributor initializes `.env` and runs the documented Compose validation entry point
- **THEN** the pinned toolbox executes the complete repository checks without host Node or pnpm

### Requirement: Server and image validation replace Pages validation
CI SHALL start ephemeral PostgreSQL, run checked migrations, exercise Setup/Login and representative
roles, build the hardened server image, run both unit and browser suites, generate exactly 56 server
PNGs twice, compare hashes, and scan tracked files, build context, image layers, and runtime resources.

#### Scenario: Continuous validation
- **WHEN** CI runs for a pull request
- **THEN** all server, authorization, PostgreSQL, image, locale, gallery, performance, OpenSpec, and publication-safety checks pass without publishing an image

### Requirement: Release automation is part of the closed lifecycle
The delivery lifecycle SHALL include Release Please configuration, a passing release PR, public GHCR
multi-platform publication, SBOM and provenance verification, and an anonymous pull check for a
stable release. Publication failure SHALL be reported without claiming the lifecycle is complete.

#### Scenario: Deliver the first stable release
- **WHEN** the archived implementation reaches synchronized `main`
- **THEN** the generated `v1.0.0` release PR is verified and merged and its GitHub Release and public image tags are confirmed
