## Why

org-tools currently exposes every browser workflow only in English. Russian-speaking users need a
complete localized interface whose language is detected once, remains under explicit user control,
and does not introduce routes, servers, or a new organization-data persistence path.

## What Changes

- Add English and Russian message catalogs and render every runtime label, status, validation error,
  accessibility name, plural, number, and date through `next-intl`.
- Add a language selector before the theme selector, detect a supported browser language on first
  use, and persist only the locale preference in local storage.
- Keep the single static `/` route and bundle both catalogs locally without middleware, locale URL
  segments, remote loading, telemetry, or background requests.
- Keep `OrgToolsStateV1`, imported and user-entered data, export schemas, and generated filenames
  unchanged; opening a workspace does not change the locale.
- Permit Cyrillic only in the Russian message catalog while keeping source code, tests, fixtures,
  specifications, and documentation in English.

Non-goals are translation of organization data or machine export values, additional locales,
locale-specific routes, server-side locale negotiation, and cross-device preference sync.

## Capabilities

### New Capabilities

- `interface-localization`: Supported locales, first-use detection, preference persistence, runtime
  switching, translation coverage, and locale-aware presentation.

### Modified Capabilities

- `privacy-safety`: Allow bounded non-sensitive theme and locale preferences in local storage while
  continuing to forbid organization data in browser persistence.
- `project-tooling`: Keep public engineering artifacts English while allowing the reviewed Russian
  catalog and validating both catalogs and localized browser behavior.
- `organization-editor`: Make all six retained product surfaces available in either supported
  interface language.

## Impact

- Adds the `next-intl` UI runtime dependency, two bundled JSON catalogs, a client locale provider,
  a language menu, and typed localizable error/message descriptors.
- Refactors UI components and locale-derived analytics/import labels without changing persisted
  workspace or export contracts.
- Updates Playwright coverage, locale unit tests, documentation, OpenSpec context, and the
  publication scanner. Organization data remains local and the 20,000 Employee / 4,000 Unit target
  remains unchanged.
