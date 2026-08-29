## Context

The current screenshot contract intentionally limits the README and the entire generated gallery to
the same ten primary frames. That makes the front page concise, but the detailed screenshot guide
cannot explain secondary workflows such as JSON mapping, Live Team configuration, Employee filters,
custom Views, Editor commands, Analytics drill-down, Calendar dialogs, or the different Data
Download formats.

The existing manifest already provides one exact file list and publication checks already prevent
stale PNGs. The change can extend that contract without changing the application or introducing a
second screenshot system. Captures continue to run against the static production build with fixed
browser conditions and synthetic local data.

## Goals / Non-Goals

**Goals:**

- Preserve exactly ten featured README frames, one for each primary workflow.
- Build a comprehensive detailed gallery grouped under those same ten workflows.
- Make every supporting frame declare the visible capabilities it documents.
- Reuse existing product interactions and deterministic fixtures rather than staging artificial UI.
- Make publication checks distinguish featured README coverage from full guide coverage.
- Require future visible functionality changes to update the capability catalog in the same change.

**Non-Goals:**

- Put the complete gallery in the README or turn the README into product documentation.
- Capture every transient hover, error, or responsive breakpoint as a separate public image.
- Replace browser assertions with screenshots or treat screenshots as behavioral tests.
- Change runtime UI, public file formats, synthetic workspace content, or dependencies.
- Generate screenshots from real organization data or external services.

## Decisions

### Extend the manifest with module, featured, and capability metadata

Each entry will include a stable identifier, owning primary module, `featured` flag, title,
filename, description, and one or more concise capability labels. Exactly one entry per primary
module is featured. Supporting entries can grow when the product gains a meaningful visible
workflow.

This keeps one source of truth while allowing two presentations. A separate README manifest was
rejected because duplicate identities and filenames would drift. Hard-coding a permanent total for
supporting frames was rejected because completeness, not an arbitrary image count, is the contract.

### Define completeness as an explicit coverage matrix

The initial catalog will cover:

- Import: recognized scoped state, full replacement, ordinary JSON mapping, and mapped preview.
- Workspace Export: all four visible content scopes and local download action.
- Theme and language: expanded menus plus the light/English and dark/Russian states visible across
  the catalog; compact and expanded sidebar states remain represented.
- Teams: populated hierarchy, create/edit configuration, and Live membership rules.
- Employees: catalog, compound filters, full Employee form, tag date editing, and avatar crop.
- Editor: canvas, custom Views, search, Unit and Employee context commands, multi-selection actions,
  image export, and text-template export.
- Analytics: the complete group set and a drill-down dialog.
- Calendar: month, day details with Employee actions, and dated-tag event history.
- Data Download: populated source selection plus CSV, JSON, and Template configuration and preview.

The guide will render this matrix as grouped sections with short capability lists adjacent to each
clickable full-size frame. Invisible guarantees such as atomic rollback, same-origin networking,
keyboard semantics, and actual downloaded bytes stay in browser tests and prose because a static
image cannot prove them.

### Keep one deterministic generation suite

The existing Playwright gallery suite will generate every manifest entry. Shared helpers establish
the synthetic workspace, fixed date, viewport, locale, reduced motion, fonts, pointer position, and
focus stabilization. Related frames can share setup within one test only when state remains clear;
independent workflows start from a fresh page so order cannot change output.

The generator continues to delete only direct PNG children of `docs/screenshots`, then requires exact
manifest equality. Feature frames use the `feature-<module>-<state>.png` convention while the ten
featured files retain their stable `demo-<module>.png` paths so README links do not churn.

### Validate two different link contracts

Publication checks will require:

- the screenshot directory to equal all manifest files;
- the README to preview and link exactly the ten `featured: true` entries;
- the detailed guide to preview and link every manifest entry exactly once;
- exactly one featured entry for every primary module;
- unique identifiers, filenames, and non-empty capability arrays;
- every supporting frame to belong to a primary module.

This is preferred to counting Markdown headings because direct file/link equality is objective and
fails on stale assets.

### Keep screenshots local and bounded

All capture data comes from the existing synthetic workspace, ordinary JSON example, or in-browser
generated avatar. No state crosses the browser boundary. Gallery expansion increases repository
asset size and generation time but does not affect the production bundle or product performance.

## Risks / Trade-offs

- [The full catalog becomes too large to review] → Group frames by module, keep one primary frame
  plus only distinct functional states, and require full-size links instead of duplicating prose.
- [A feature is technically present but not visually provable] → Document it in the capability
  matrix and keep behavioral proof in smoke tests; do not manufacture a misleading screenshot.
- [Repeated setup makes generation slow] → Reuse deterministic helpers and group closely related
  states while keeping the suite serial and independent across workflows.
- [Dialogs or popovers retain focus tooltips] → Use the existing pointer and focus stabilization and
  visually inspect every output after generation.
- [Manifest and Markdown drift] → Validate exact featured and complete link sets during
  `public:check`.
- [Additional PNGs make reviews noisy] → Use stable names, deterministic state and geometry, a tiny
  edge-only rasterization tolerance, and remove only superseded gallery PNGs.

## Migration Plan

1. Extend the manifest schema and publication checks while preserving the ten featured filenames.
2. Add supporting Playwright capture states grouped by primary workflow.
3. Rewrite the detailed guide as the complete visual capability catalog; keep README unchanged
   except for wording that distinguishes the concise showcase from the full guide.
4. Generate and inspect the full set twice, rejecting any content or geometry drift while allowing
   only negligible platform antialiasing differences at curved edges.
5. Run the complete repository validation suite, synchronize the project-tooling spec, archive the
   change, commit, merge, push, and clean the merged branch.

Rollback is a normal revert. No application data migration or compatibility handling is required.

## Open Questions

None.
