## 1. Account UI State and migration

- [x] 1.1 Add exact image-export preferences to shared types, blank State, parser, MobX load/capture/setters, and account UI projection.
- [x] 1.2 Add PostgreSQL migration `0004` for bootstrap and account UI JSON and cover migration, strict parsing, defaults, normalization, and Backup round trips.

## 2. Shared controls and localization

- [x] 2.1 Build the shared searchable virtualized Tag visibility selector with catalog-wide bulk actions, counts, colors, keyboard behavior, and RTL support.
- [x] 2.2 Add the shared Hide Staffing Slots checkbox and wire both controls into full-View and scoped PNG dialogs with immediate profile persistence.
- [x] 2.3 Complete and validate all six localization catalogs.

## 3. Image planning and Canvas output

- [x] 3.1 Filter Employee `{tags}`/`{tagDates}`, Staffing Slot Tags, and Unit Tag clouds before shared image geometry is measured.
- [x] 3.2 Suppress Staffing Slot rows and summary counts and recalculate Unit, hierarchy, anchor, and final image bounds.
- [x] 3.3 Exclude Slot-dependent canvas attachment chains and arrows while retaining unrelated full-View and scoped content.
- [x] 3.4 Add focused unit coverage for Tag filtering, Slot suppression, summaries, geometry, and attachment reachability.

## 4. Browser behavior and documentation

- [x] 4.1 Cover both dialogs, bulk and individual Tag changes, reload/UI synchronization, Preview/Copy/Save parity, access-subject projection, six locales, and RTL in browser tests.
- [x] 4.2 Update architecture, usage, privacy, performance, screenshots, and related capability documentation.
- [x] 4.3 Update the maintained 56-frame gallery scenario and visually inspect the changed image-export evidence.

## 5. Validation and delivery

- [x] 5.0 Bound the newly published unpatched OpenSpec-only `braces` advisory to its exact dev path with a tested 2026-11-05 review deadline.
- [x] 5.1 Run format, lint, typecheck, unit, migration/restart, development, production build, browser, performance, public-safety, and strict OpenSpec validation gates.
- [x] 5.2 Generate the 56-frame gallery twice, compare SHA-256 hashes, inspect every frame, and record deterministic results.
- [x] 5.3 Sync canonical specs, archive the change, validate no active changes, integrate fresh `origin/main`, push `main`, remove the change branch, and verify clean matching refs.
