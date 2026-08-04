## Why

The top-level Save action cannot produce the partial documents that the import workflow documents,
Employee avatars require raw data URLs instead of an approachable local crop workflow, and Calendar
and Analytics spend too much of the viewport on redundant chrome. The product shell also needs a
clearer navigation order and a calmer brand treatment.

## What Changes

- Add a localized Save dialog for Teams, Employees, Teams with Employees, and the complete workspace.
- Add strict serializers for re-importable Main subsets while keeping `OrgToolsStateV1` as the only
  complete workspace document.
- **BREAKING**: replace `OrgToolsImportV1` with the sole supported `OrgToolsImportV2` contract and
  add Live boss and position-override references; version 1 structured files are rejected.
- Replace raw avatar data-URL editing with local file/clipboard selection, pan and zoom cropping,
  bounded WebP encoding, replacement, recropping, and removal.
- Reorder import references and product tabs, move Calendar navigation into its header, make the
  calendar fit maintained desktop viewports, and flatten the Analytics surface.
- Replace the vivid wordmark gradient with a restrained graphite-to-blue light/dark palette.
- Keep every workflow browser-only, bilingual, synthetic in tests/examples, and free of remote
  image or organization-data requests.
- Do not add per-item partial-save selection, persist avatar source images, change
  `OrgToolsStateV1`, or change generic CSV/template export behavior.

## Capabilities

### New Capabilities

- `structured-save`: Defines the four top-level save choices and deterministic re-importable Main
  subset serialization.

### Modified Capabilities

- `structured-import`: Replaces version 1 with the exact version 2 contract and adds Live role data.
- `employee-model`: Adds bounded local avatar selection, crop, encoding, recrop, and removal behavior.
- `organization-editor`: Changes product-tab order, Calendar layout, Analytics presentation, and
  wordmark styling.
- `interface-localization`: Localizes the new save and avatar workflows and locks reference labels.
- `privacy-safety`: Extends the local data boundary to clipboard images, crop canvases, and partial saves.
- `workspace-state`: Changes the top-level Save workflow without changing the complete state schema.
- `project-tooling`: Extends browser and screenshot validation for the revised product surfaces.

## Impact

The UI package gains `react-easy-crop`, a pure structured-save serializer, a Save dialog, avatar
image helpers, and revised shell/Calendar/Analytics components. The public types package removes
`OrgToolsImportV1` and exports `OrgToolsImportV2`. Message catalogs, import examples, usage/privacy/
architecture/performance documentation, Playwright coverage, screenshots, and OpenSpec specs change
with the behavior. No server, migration layer, remote request, browser organization persistence, or
complete-state version change is introduced.
