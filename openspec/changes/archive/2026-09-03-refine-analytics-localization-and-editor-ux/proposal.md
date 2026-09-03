## Why

Analytics omits birth-year and age insights, while its drill-down and surrounding chrome repeat
information or diverge from the standard Employee workflow. The two-language selector, Editor
selection/toolbars, Unit split layout, and several Calendar labels also no longer meet the intended
localized, space-efficient interaction model.

## What Changes

- Add known birth-year distribution and deterministic age summaries for the whole organization,
  men, and women while excluding missing and unknown-year birthdays.
- Remove the duplicate Analytics heading and make analytical Employee drill-down use the standard
  actionable Employee cards.
- **BREAKING**: expand the strict `AppLocale` value set from English/Russian to English, Simplified
  Chinese, Russian, Spanish, French, and Arabic, with complete bundled catalogs, first-use browser
  detection, and Arabic RTL layout.
- Replace language and theme dropdowns with separate accessible modal selectors and use bundled
  Noto Sans family fonts for consistent script coverage.
- Preserve multi-selected Units after a group drag, arrange only an explicit multi-selection, and
  reorganize the Editor chrome to maximize the canvas.
- Keep compact sidebar tooltips above Editor controls, align Unit and Employee searches in equal
  panes, and correct Calendar date and navigation localization.
- Preserve local-only behavior, the `OrgToolsState` object shape, singleton SQLite persistence,
  Pages memory-only state, and all Import/Export behavior.

## Capabilities

### New Capabilities

- `organization-analytics`: Birth-year distributions, age cohorts, deterministic extremes, and
  actionable analytical drill-down.

### Modified Capabilities

- `interface-localization`: Six complete locales, browser detection, Arabic RTL, localized modal
  selectors, and six-catalog completeness checks.
- `interface-chrome`: Editor-specific header removal, overlay hierarchy, modal settings controls,
  equal Unit panes, and locally bundled multilingual typography.
- `organization-editor`: Persistent multi-selection during drag, selected-only arrangement, and
  separated history and canvas controls.
- `single-state-runtime`: The strict UI locale enum and first-use locale bootstrap behavior expand
  without changing the state object or persistence schema.
- `dated-employee-tags`: Calendar date titles and navigation remain fully locale-correct across all
  supported languages.
- `project-tooling`: Browser localization coverage, performance assertions, documentation, and the
  deterministic 46-frame gallery expand to the new surfaces.

## Impact

The change affects shared types and strict state validation, Analytics derivation and UI, locale
providers and message catalogs, shell/sidebar controls, Editor interaction and layout commands,
the Unit split workflow, Calendar formatting, local font dependencies, browser/unit tests,
documentation, OpenSpec capabilities, and screenshot fixtures. Existing `en` and `ru` states remain
valid; no SQLite schema or organization-data migration is required. No remote font, translation,
telemetry, or other network service is introduced.
