## Why

Editor distribution connections disappear when a user begins a left-button pan because blank-canvas pointer-down clears selection before the gesture is classified. Distribution mode also requires manually selecting every descendant Unit, and keyboard paste can prefer an older operating-system image over the structure just copied inside Editor.

## What Changes

- Preserve Employee selection and distribution connections during a real canvas pan while retaining blank-click deselection.
- Replace the Unit context-menu distribution switch with an accessible scope submenu for selected Units or their complete descendant closure.
- Stamp successful Editor copies with an opaque, non-sensitive clipboard token so keyboard paste follows the most recent actual copy source while retaining image paste and the one-shot fallback.
- Update Editor requirements, local-only clipboard guarantees, documentation, six locale catalogs, browser coverage, and the existing distribution screenshot without changing gallery size.
- Keep the exact State contract, Editor document model, PNG contract, and SQLite row shape unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `editor-distribution-mode`: Preserve selection during pan and add selected-versus-descendant distribution scope controls.
- `organization-editor`: Arbitrate structural and image paste through the latest clipboard marker and distinguish blank click from pan.
- `privacy-safety`: Keep clipboard ownership markers opaque, local, and free of organization content.

## Impact

The change affects Editor pointer gesture classification, the Unit context menu, the transient cross-View clipboard, keyboard copy/paste arbitration, browser tests, screenshots, documentation, and six locale catalogs. It adds no dependency, remote request, persistent field, runtime compatibility reader, or SQLite conversion.
