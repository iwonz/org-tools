## Context

The live Editor derives distribution row status from the active View's complete direct-membership
index and paints a themed tonal row surface. The PNG painter already receives View settings for
grouping and Tag-cloud visibility, but it has neither distribution-enabled Unit IDs nor the shared
membership index, and the current capability contract explicitly excludes distribution colors from
PNG. Image generation is local, bounded, and uses an intentionally light export palette with
image-only customization.

## Goals / Non-Goals

**Goals:**

- Paint distributed and source-only Employee row surfaces in PNG exactly when the live active View
  does, including membership outside the selected export scope.
- Share status resolution and light tonal color derivation across DOM and canvas paths without
  rebuilding the 4,000-Unit membership index during image preview.
- Establish persistent View and Unit/Employee card presentation parity as the default requirement
  for later Editor PNG changes.

**Non-Goals:**

- Export selection, hover, focus, menus, controls, distribution placement paths, endpoint markers,
  the placement map, or the canvas grid.
- Make PNG follow the active light/dark application theme or remove existing image-only title,
  background, font, scope, radius, Employee-format, and boss-label controls.
- Change state schemas, persistence, migrations, localization, JSON, Template, or Employee output.

## Decisions

- Add one pure distribution-presentation resolver that accepts an Employee, source Unit, the
  distribution-enabled Unit set, and the complete direct-membership index. It returns no state for
  ordinary Units or the existing assigned/source-only state and other-Unit count for enabled Units.
  Both the live row and PNG render data consume this resolver, replacing duplicated conditional
  logic.
- Pass the existing memoized enabled-Unit set and complete membership index from the Editor through
  the export dialog into image generation. The PNG painter MUST use the complete active-View index,
  not rebuild status from the Unit-only or subtree image subset. This keeps preview changes bounded
  and preserves manual plus resolved Live membership semantics.
- Derive the light tonal fill used by custom CSS variables and canvas from one palette calculation.
  Paint a shared rounded Employee row surface before avatars, names, boss treatment, and Tags.
  Employee text remains the neutral light export foreground and Tag chips retain their own colors.
- Treat persistent View settings and stable Unit/Employee card presentation as shared DOM/PNG
  semantics. Record the rule in capability specs, architecture documentation, and `AGENTS.md`.
  Explicit image settings remain output overrides; transient interaction stays excluded.
- Extend existing unit and cross-runtime browser workflows and make the gallery Image export fixture
  visibly contain both statuses. Canvas method instrumentation verifies painter inputs, while the
  existing decoded-download check continues to verify a real bounded PNG.

## Risks / Trade-offs

- [Status is derived from the export subset] -> Pass and test the complete active-View membership
  index, including an out-of-scope placement in Unit-only export.
- [Canvas and DOM tones drift] -> Centralize light tonal palette derivation and compare named, HEX,
  and alpha colors in unit tests.
- [Transient placement graphics leak into output] -> Pass only persistent mode and membership data;
  do not pass selection or connection render state, and assert distribution strokes are absent.
- [Preview work regresses at scale] -> Reuse memoized Editor indexes and store aligned status in the
  immutable per-Unit render data built for each requested image.

## Migration Plan

No data migration or compatibility reader is required. Deploy the shared UI change to both server
and Pages builds. Rollback is a code revert; persisted state and non-image exports remain compatible.

## Open Questions

None.
