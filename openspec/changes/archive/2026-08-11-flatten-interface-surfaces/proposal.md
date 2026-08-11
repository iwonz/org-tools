## Why

The interface currently nests bordered or filled layout islands inside an already unified shell, which makes every workflow feel dense and visually fragmented. The product needs one calm, spacious surface language in which hierarchy comes from typography, whitespace, and interaction states while the Org Editor canvas remains distinct from the surrounding application.

## What Changes

- Make the light application shell and all top-level workflow backgrounds continuous white; keep the dark theme on one continuous dark neutral background.
- Replace the bordered product navigation, global action group, and nested segmented tab containers with flat, spaced controls whose active state is communicated through text weight, color, and accessible state rather than a filled island or underline.
- Remove rounded outer workflow containers and quiet nested fills from Teams, Employees, Analytics, Calendar, and Download so their headers, controls, panes, lists, and sections sit directly on the shared page surface.
- Use whitespace, compact gaps, typography, hover, and focus feedback instead of decorative rules or card-like grouping for ordinary layout and repeated content.
- Flatten the Org Editor control groups while preserving a separate neutral-gray canvas background and the meaningful boundaries of canvas nodes.
- Retain boundaries that communicate semantics or interaction: form fields, dialogs, popovers, selectable and destructive choices, calendar cells, focus/error states, hierarchy guides, and true data cards where their boundary is required.
- Update deterministic screenshots and user-facing documentation to describe the flat surface system in both themes and at supported viewport widths.
- Keep all data contracts, import/export behavior, persistence, localization, privacy, and performance characteristics unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `interface-chrome`: replace bordered and filled layout islands with a continuous flat surface system and define the smaller set of meaningful retained boundaries.
- `organization-editor`: flatten Editor control groups and Analytics grouping while preserving the neutral canvas and existing interaction behavior.

## Impact

This affects shared shell and tab primitives, header controls, top-level workflow wrappers, repeated list styling, Analytics groups, Org Editor controls and canvas styling, browser visual assertions, deterministic screenshots, and UI documentation. It introduces no dependency, network, storage, public state, import, export, or localization contract changes.
