## Why

Reference Units used for distribution currently create misleading placement links in ordinary Units. Tag dragging lacks a reliable full-row preview, layout direction behaves as one toggle, and Editor descendant counts can omit Employees already present in ancestors.

## What Changes

- Exclude distribution-enabled Units from ordinary-Unit placement actions and maps while preserving reference-Unit distribution behavior.
- Replace native Tag dragging with captured pointer gestures, full-row previews, animated insertion, bounded auto-scroll, and one final catalog mutation.
- Keep the layout control's appearance but make its two directions independently selectable with no-op repeated selection.
- Count unique Employees in each Unit's own subtree, including its direct membership, consistently in canvas and PNG.
- Update documentation, six-locale accessible controls, browser coverage, and the existing deterministic gallery.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `editor-distribution-mode`: source-sensitive placement eligibility and live modal updates.
- `tag-catalog`: full-row pointer sorting and reliable atomic completion or cancellation.
- `organization-editor`: explicit direction selection and subtree-local unique counts.
- `project-tooling`: validate the refined interactions in both runtimes and the maintained gallery.

## Impact

Changes stay in derived membership/count helpers and existing Editor and Tag controls. No persisted field, state schema, database conversion, dependency, network request, storage surface, or report mode is added. Tag order remains global; distribution exclusions affect placement discovery only, not membership, hierarchy counts, or reference-Unit status.
