## Why

Canvas tools currently expose conflicting selection states, incomplete transforms, and generic Unit
context actions, which makes durable annotations unreliable to edit. The full-View Image dialog also
diverges from the established Editor export controls, so its footer and Employee format are harder
to understand than the equivalent Unit export workflow.

## What Changes

- Make tool activation and canvas selection mutually clear: selecting one element selects only that
  element, while choosing a creation tool clears the prior selection and activates that tool.
- Show element-specific right-click actions, including plane and z-order commands, instead of Unit
  actions for a selected canvas element.
- Replace the single-corner resize and detached rotation affordance with usable edge/corner transform
  handles whose rotation is centered on the selected element bounds.
- Simplify and reflow the contextual tool property surface so controls remain readable without
  overlap, and remove the unnecessary separator before View Image export.
- Align the full-View Image dialog footer with scoped Editor Image export by adding the same Copy and
  Save button icons.
- Use the shared token-aware Format input for full-View Employee formatting, including `@`
  suggestions, existing `?` conditional expressions, and the focusable information help icon.
- Preserve the strict State model, local-only operation, current PNG rendering contract, and existing
  supported canvas element types.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `organization-editor`: Refine canvas-tool selection, activation, context actions, transforms,
  property layout, toolbar composition, and full-View Image dialog controls.
- `data-export`: Extend the shared token-aware Format input contract to Editor Image Employee formats
  while retaining conditional-expression behavior.

## Impact

The change affects Editor canvas event routing, canvas-element transform geometry, the contextual
tools toolbar, element context menus, the full-View Image export dialog, shared Format input usage,
localized copy, unit/browser tests, documentation, and maintained screenshots. It changes no State
shape, migration behavior, file type, remote dependency, or privacy boundary.
