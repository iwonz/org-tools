## 1. Unified State Contract

- [x] 1.1 Add the `content` discriminator and strict canonical payload validation to `OrgToolsState`
- [x] 1.2 Implement and unit-test deterministic serializers for all four state projections
- [x] 1.3 Remove the public `OrgToolsImport` contract, parser, examples, fixtures, and obsolete tests

## 2. Save and Recognized State Import

- [x] 2.1 Make every Save choice download and re-parse a scoped `OrgToolsState` with the required filename
- [x] 2.2 Replace import format tabs with compatible state projection and append/replace operation controls
- [x] 2.3 Implement Employee identity reuse, UUID/reference remapping, free-area layout translation, clean partial replacement, and detached candidate validation
- [x] 2.4 Add unit and browser coverage for the projection matrix, warnings, append, replace, cancellation, and atomic failures

## 3. Generic JSON and CSV Mapping

- [x] 3.1 Generalize discovery and mapping models for Teams, Employees, and Teams + Employees
- [x] 3.2 Implement recursive JSON children/employees mapping and flat relational CSV graph construction
- [x] 3.3 Validate key grouping, parents, cycles, identities, bosses, previews, and atomic append candidates
- [x] 3.4 Add unit and browser coverage for generic JSON and CSV mappings in both locales

## 4. Tag Editing and Presentation

- [x] 4.1 Replace always-visible tag date inputs with accessible single and bulk calendar popovers
- [x] 4.2 Show localized dated labels and every tag without limits or overflow counters across Employee surfaces
- [x] 4.3 Add mixed-date, set, clear, wrapping, accessibility, and locale tests

## 5. Variable Editor and PNG Geometry

- [x] 5.1 Add a shared deterministic tag packing and Employee row-height model with prefix offsets
- [x] 5.2 Use variable offsets for Org Editor virtualization, hitboxes, selection, connectors, layout, and bounds
- [x] 5.3 Pass locale into PNG export and render all wrapped dated tags with matching expanded geometry
- [x] 5.4 Add geometry, PNG, locale-invalidation, and large-View tests

## 6. Shell, Localization, and Documentation

- [x] 6.1 Remove every logo shadow and update deterministic visual coverage
- [x] 6.2 Add matching English and Russian messages for state import, generic mapping, warnings, and tag date actions
- [x] 6.3 Update architecture, privacy, performance, usage, import-format, screenshot, fixture, and publication documentation

## 7. Validation and Archive

- [x] 7.1 Run formatting, lint, typecheck, unit tests, build, and localized browser smoke tests
- [x] 7.2 Regenerate and manually inspect deterministic screenshots, including state import, mapping, tags, editor, PNG, and the logo
- [x] 7.3 Run strict OpenSpec validation and the publication-safety scan
- [x] 7.4 Sync capability deltas, archive the completed change, and revalidate the main specifications
