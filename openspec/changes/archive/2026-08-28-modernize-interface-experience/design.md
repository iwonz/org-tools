## Context

The current interface is the result of several changes that removed nearly every persistent fill,
divider, selected background, workflow inset, and section boundary. That achieved visual quiet but
also made hierarchy depend almost entirely on whitespace. The representative screenshots and
component audit show four recurring issues:

- active product and nested tabs are difficult to distinguish at a glance;
- large white or dark areas provide weak task context and make finished workflows look incomplete;
- Teams, Download, Analytics, and repeated Employee content lack scanning landmarks;
- shared controls use the same compact monochrome treatment even when their importance differs.

The first implementation pass also exposed a second-order consistency problem: native inputs,
placeholders, code-oriented fields, and export settings can opt out of the UI font; several button
and selectable-card states stack a border, ring, fill, and shadow; and the neutral-only hover model
is calm but too inert. The refinement therefore needs more expression in interaction, not more
permanent chrome.

Reference review exposed a third-order shell problem. Even after visual refinement, six horizontal
product tabs plus four global actions make the top bar read as a component toolbar instead of stable
application navigation. Transient inset hairlines also recreate the same boxed feeling during the
exact pointer states that should feel effortless. The target shell therefore uses a collapsible
dark sidebar and explicitly forbids decorative hover or active borders.

The application is a single browser-only React surface. UI changes must preserve in-memory state,
strict file validation, explicit local file actions, link protections, virtualization, editor
geometry, localization, and the 20,000 Employee / 4,000 Team target. No organization content may
cross the browser boundary. Existing deterministic screenshots and Playwright smoke tests are the
visual and behavioral regression harness.

## Goals / Non-Goals

**Goals:**

- Establish one restrained light/dark visual language with clear hierarchy and recognizable state.
- Make navigation, workflow grouping, primary actions, and dense repeated content easier to scan.
- Apply shared decisions through tokens and primitives before adding workflow-specific styling.
- Keep useful workspace density and avoid a decorative card around every row or control.
- Use one locally bundled UI font throughout the application chrome and every native or custom
  control, with an explicit exception only for user-selected export-artifact previews.
- Make interaction feel responsive through restrained signal color, depth, and motion while keeping
  the resting interface utilitarian.
- Move every product destination and global shell action out of the top bar into one collapsible
  sidebar with an icon-only compact mode and a quiet current-workflow header.
- Keep pointer interaction borderless and geometry-stable: tone and contrast may change, but hover
  and press must not introduce borders, outlines, inset hairlines, shadows, scaling, or movement.
- Preserve responsive containment, keyboard access, localization, privacy, and performance.

**Non-Goals:**

- Change persisted state, file formats, import/export semantics, stores, derived indexes, or data
  flow.
- Add branding, onboarding, a landing screen, remote fonts, assets, dependencies, telemetry, or
  network requests.
- Redesign the Editor document model or change PNG export geometry beyond applying the same snapped
  document coordinates that the interactive canvas stores.
- Replace the current interaction model or rename product workflows.

## Decisions

### Use full-bleed working surfaces with tonal grouping

The shell and header use calm neutral tones, while every ordinary product workflow remains
full-bleed with no decorative outer border, rounded frame, or empty shell gutter. Structure inside a
workflow comes from restrained tonal backgrounds, typography, alignment, and semantic objects. This
restores hierarchy without producing nested panel outlines.

Alternative considered: retain the uninterrupted root surface and change only typography. That
would leave the main navigation and pane-grouping problems unresolved. An inset framed workflow and
a card-per-row treatment were rejected because they create empty perimeter bands, visual noise, and
less usable workspace.

### Keep the control system neutral

Primary actions use high-contrast graphite rather than a saturated brand color. Selected
navigation, hover, focus, and selection use neutral tonal differences; destructive and
calendar-event colors remain semantic exceptions. Light and dark values are defined together in
CSS variables so component code does not branch by theme.

Alternative considered: a conventional saturated blue primary. It made otherwise restrained
controls read like a generic component framework and competed with organization content.

### Use one UI typeface without leaking export typography into chrome

Inter remains the single application typeface. The root, native form elements, placeholders,
buttons, portal content, preformatted editing surfaces, and browser-native file controls explicitly
inherit it. User-selectable fonts remain available for image export because they are document
content, but the export dialog labels and editing controls continue to use Inter.

Alternative considered: keep monospace fields for template and JSON content. That creates a visible
second UI voice and conflicts with the product-wide typography requirement; structure remains clear
through size, tone, spacing, and wrapping instead.

### Use a restrained utility signal instead of decorative color

Graphite remains the primary action fill. A desaturated steel-blue signal is reserved for active
rails, keyboard focus, text selection, and other small state indicators. Large selected and hover
surfaces use nearly neutral blue-gray tones instead of lavender fills, so the system reads as a
utility workspace rather than decorative branding. The signal never becomes a large primary button
or panel fill. Ordinary hover and press do not add elevation, shadow, scaling, rotation, or
translation; tonal feedback supplies the response without changing geometry.

Alternative considered: brighten all primary actions. That would recreate the framework-like accent
buttons the design is removing. Pure monochrome was also rejected because it made every state feel
equally static.

### Give every interactive state one dominant cue without pointer borders

Tabs use stronger text plus a quiet tonal active surface, a faint tonal wash on hover, and a
keyboard-only focus ring. Buttons do not carry a permanent outline or decorative shadow, and hover
or press only changes tone or foreground contrast without transform or size change. Selectable
cards use tone and their native radio or checkbox rather than a selected border, ring, or shadow.
Borders remain for editable fields, calendar geometry, data previews, canvas nodes, and explicit
drag or destructive boundaries where they communicate structure. True overlay layers may retain
one restrained shadow when the overlay alone does not separate them sufficiently from content.

This state budget prevents the common permanent combination of border, outline, fill, shadow, and
color from making a small control look like a generic component-library demo while avoiding an
overly flat response during pointer interaction.

### Make the application sidebar the stable navigation anchor

The application shell places the six product destinations in their existing order inside a dark
vertical sidebar. Language, theme, Import, and workspace Export move into the same sidebar so the
content header contains only current-workflow context. Expanded mode shows icons and labels;
compact mode narrows to an icon rail, hides visible labels, preserves accessible names, and exposes
tooltips. Desktop users can toggle modes without persisting organization or shell state, while
narrow viewports use the compact rail to preserve working space. A tonal row and stronger
foreground identify the active destination; hover uses a lighter tonal fill; keyboard focus keeps
an explicit ring. No navigation state uses a border, outline, or inset hairline during pointer
interaction. The decorative Org Tools glyph and visible product title are removed. The collapse
control occupies a 40 px row and uses the same 14 px inline padding and 20 px icon size as product
navigation and shell actions. Its icon therefore stays on the same fixed horizontal axis in expanded
and compact modes while the sidebar right edge contracts independently. Icon-only rows use the full
available compact-row width with a mathematically centered icon, and the control foreground remains
legible against every hover, active, and focus background. Expanded and compact rows share the same
icon padding, while labels animate max-width and opacity inside an overflow clip rather than
toggling display. Narrow automatic compact mode omits the unused header row.

Alternative considered: retaining the horizontal product tabs and moving only transfer actions.
That does not solve the crowded toolbar impression or create a stable application anchor.

### Put structure in shared primitives first

Color, typography, radius, button, input, dialog, tab, card, empty-state, and product-surface
changes live in shared tokens or primitives. Workflow code adds boundaries only where the primitive
cannot know the semantic structure: split panes, Analytics groups, Calendar surface, and Editor
toolbars.

This keeps styling consistent and avoids duplicated render or state logic. It does not change any
store observation boundary or introduce a new runtime dependency.

### Use density and tone for scanning, not panel borders

Teams and Download use tonal and typographic pane grouping without a decorative outer frame. Dense
list and table rows use alignment and interaction feedback; Analytics sections use soft tonal
surfaces without outlines. Rows remain contiguous and virtualized, with no extra wrapper observers,
shadows, or gaps that would change measurement complexity.

Alternative considered: floating cards for every Employee and analytics row. It was rejected for
visual overload, smaller effective viewport, and unnecessary virtualizer remeasurement risk.

### Keep the Editor purposefully distinct

The Editor retains a neutral canvas and existing selection, drag, connection, and PNG behavior. A
24-unit document-space grid becomes the single coordinate contract. Drag, add, import, paste,
overlap avoidance, subtree relayout, and full arrangement snap final Unit origins to this step.
The visible grid uses power-of-two multiples of the base step to keep approximately 24 to 48 CSS
pixels between lines as zoom changes; its origin follows the viewport transform, so visible lines
always represent valid snap coordinates. Floating toolbars and data nodes retain the shared visual
language, while the canvas remains edge-to-edge. Snapping stays in store and pure geometry helpers
instead of pointer-event rendering so it adds no per-frame observer or collection scan.

Alternative considered: scale one fixed 48-unit grid at every zoom. At low zoom its lines merge and
at high zoom they become too sparse, while the existing 24-unit snap step does not match the visible
lines. An adaptive presentation over one base step keeps both density and geometry predictable.

### Use one Analytics group tone

Analytics keeps six bounded groups, but the group body, column header, and virtualized row viewport
share one background tone. Hierarchy comes from typography, spacing, and row hover rather than
stacking several near-white or near-black fills. All groups use the same tokenized opacity in both
themes, preserving bounded height, sorting, and virtualization.

### Preserve data flow and trust boundaries

All changes are presentational React and CSS. Imported organization data continues to flow from an
explicit local file through strict detached validation into in-memory stores. Exports still leave
only through explicit download, copy, or image actions. No visual token, primitive, screenshot, or
test adds persistence, telemetry, remote assets, requests, or new handling of profile and email
links. Failure atomicity is unchanged because mutation code is untouched.

### Validate behavior and visuals together

Unit, type, lint, build, strict OpenSpec, browser smoke, screenshot generation, and public-safety
checks remain the release gate. Browser assertions will test observable hierarchy and containment
without overfitting exact color serialization. Representative screenshots will be inspected in
light and dark themes at desktop size, while smoke coverage retains 390, 1024, and 1280 px header
checks.

## Risks / Trade-offs

- [Tonal surfaces could still accumulate] → Keep ordinary workflows full-bleed, reserve tone for
  navigation and true internal groups, and keep repeated rows contiguous.
- [New padding can reduce effective workspace] → Avoid outer workflow insets, keep the Editor
  edge-to-edge, and retain current virtualized viewport constraints.
- [Token changes can create dark-theme contrast regressions] → Define paired theme tokens and
  inspect representative dark screenshots plus focus, disabled, selected, and destructive states.
- [Motion can distract or shift dense layouts] → Do not transform controls, menu rows, or repeated
  content; limit motion to the sidebar width and label visibility transition and disable it through
  `prefers-reduced-motion`.
- [A signal hue can resemble a generic brand primary] → Keep the steel-blue chroma restrained,
  reserve it for small indicators and focus, use nearly neutral blue-gray interaction washes, and
  keep primary action fills graphite.
- [Existing browser tests encode the removed flat design] → Replace those assertions in the same
  change with tests for explicit active state, pane grouping, workflow framing, and containment.
- [Visual changes can affect measured virtual rows] → Avoid adding row wrappers or vertical gaps;
  retain content-driven measurement and run browser workflows using multi-tag rows.
- [Russian labels are wider] → Give the expanded sidebar a bounded width, truncate labels safely,
  keep complete accessible names and tooltips, and run Russian desktop plus compact-rail checks.
- [The sidebar can consume working width] → Use a 240 px expanded width, a compact icon rail on
  narrow viewports, and a user-controlled desktop collapse mode without browser persistence.
- [Grid snapping can move imported legacy coordinates] → Snap only coordinates produced by an
  explicit editor mutation; opening an existing workspace remains lossless until the user edits it.

## Migration Plan

1. Add the token and shared primitive layer without changing component behavior.
2. Apply workflow framing and semantic pane/section boundaries.
3. Update documentation, capability deltas, and browser assertions.
4. Generate and inspect the deterministic gallery, then run the complete validation suite.

There is no data migration. Rollback is a code and stylesheet revert because state and public file
contracts remain unchanged.

## Open Questions

None. The implementation can tune token values and compact spacing during screenshot review as long
as it preserves the specified hierarchy, density, accessibility, and privacy constraints.
