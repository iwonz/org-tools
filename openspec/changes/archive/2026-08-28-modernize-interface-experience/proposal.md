## Why

The interface is functionally complete but its deliberately flattened visual treatment removes too
many grouping, hierarchy, and state cues. Users must infer structure from whitespace alone, active
navigation is easy to miss, large workflows feel unfinished, and repeated controls do not form a
cohesive product-wide system.

## What Changes

- Introduce a restrained neutral visual system with warmer shell tones, graphite primary actions,
  consistent typography, radii, control heights, focus treatment, and light/dark tokens.
- Enforce one bundled UI typeface across headings, body copy, placeholders, native controls,
  portals, and code-like editing surfaces while keeping user-selected image-export fonts scoped to
  the exported artifact and its explicit preview.
- Make product and nested navigation states immediately legible through compact, tinted active
  surfaces while preserving keyboard navigation and responsive shell containment.
- Restore purposeful hierarchy through full-bleed working surfaces, tonal pane grouping, compact
  section backgrounds, and interaction states while avoiding decorative frames and shell gutters.
- Improve hierarchy and density across Teams, Employees, Editor, Analytics, Calendar, Download,
  dialogs, popovers, empty states, and status feedback without removing or relocating any workflow.
- Replace visually boxed button and tab states with a deliberate interaction model: subtle signal
  color, lightweight active indicators, geometry-stable tonal pressed feedback, and keyboard-only
  focus rings, with reduced-motion support and no saturated framework-style primary controls.
- Replace the horizontal application menu with a dark collapsible sidebar that owns all six product
  destinations plus language, theme, Import, and workspace Export actions. The expanded mode shows
  icon-and-label rows; the compact mode shows icons only with accessible names and hover tooltips.
- Remove decorative pointer-state borders and inset hairlines completely. Hover, active, and
  selected states communicate through tone and foreground contrast without added hover shadow;
  explicit keyboard focus remains visible without becoming a pointer-hover outline.
- Remove the decorative Org Tools glyph and refine compact sidebar geometry with evenly centered
  icon-only rows. The rounded-square collapse control keeps sufficient contrast in every pointer
  state and occupies the former glyph position when compact. Theme and language menu rows keep
  stable content geometry while highlighted.
- Make sidebar collapse a continuous right-edge width transition: navigation icons keep one fixed
  horizontal coordinate, labels clip and fade instead of switching display, and the toggle shares
  that fixed icon axis without a discrete jump.
- Remove the visible Org Tools title from the sidebar header and align the collapse control to the
  same 40 px row, horizontal padding, and 20 px icon axis as every navigation and action item in
  both sidebar modes.
- Make the Editor grid visually adaptive across zoom levels and use one shared document-space step
  for drag, creation, paste, overlap resolution, hierarchy layout, and arrangement coordinates.
- Unify Analytics section and table backgrounds so all six groups read as one clean, consistent
  analytical surface rather than several adjacent neutral shades.
- Replace the violet interaction cast with a restrained steel-blue signal and nearly neutral
  blue-gray tonal surfaces in both themes, without turning primary actions into saturated blue
  buttons or changing semantic colors.
- Remove pressed scaling and decorative in-flow shadows from controls, selected rows, shell chrome,
  cards, and Editor toolbars; reserve only restrained depth for true overlay layers.
- Preserve all current local-only behavior, import/export contracts, localization, virtualization,
  editor interactions, and explicit user-action boundaries for links and files.
- Update usage, screenshots, browser assertions, and publication expectations to describe and
  validate the refreshed interface.
- Non-goals: changing organization data, state or export schemas, persistence, remote services,
  telemetry, product terminology, or the maintained scale target.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `interface-chrome`: Replace the flat continuous-surface contract with a cohesive, layered visual
  system that provides stronger hierarchy, active states, grouped workflows, and consistent
  interaction feedback.
- `organization-editor`: Add an adaptive document-space grid and require every coordinate-changing
  editor operation to finish on its shared snap step.
- `project-tooling`: Update deterministic screenshots and browser validation from flat-chrome
  assertions to the refreshed responsive light/dark visual system.

## Impact

The change affects shared UI primitives and tokens, the application shell, collapsible sidebar,
context header, top-level product
surfaces, selected workflow layouts, browser smoke assertions, deterministic gallery images, and
the interface documentation. It adds no runtime dependency, request, server path, storage use, or
public data compatibility change. Organization content remains in memory and leaves the page only
through explicit existing actions.
