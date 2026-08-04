## Context

The compact header currently renders `Org` and `Tools` as independently colored gradient text with a decorative puzzle emoji between them. The emoji is hidden from assistive technology, while the containing wordmark exposes the accessible name `Org Tools`. The requested change is purely presentational and crosses the component, browser assertion, screenshot, documentation, and capability-spec surfaces.

## Goals / Non-Goals

**Goals:**

- Render a clean text-only `Org Tools` wordmark with clear spacing between the words.
- Preserve the existing accessible name, restrained light/dark gradients, and absence of shadows.
- Keep deterministic visual and browser coverage aligned with the header.

**Non-Goals:**

- Redesign the header, change the product name, or alter navigation.
- Change locale catalogs, public state, import/export behavior, storage, or network behavior.
- Add dependencies or image assets.

## Decisions

- Remove the decorative emoji element entirely instead of hiding it with CSS. This keeps the DOM and accessibility tree free of an obsolete visual element; merely making it transparent would leave unnecessary layout spacing and test ambiguity.
- Retain the two word spans and their existing start-to-middle and middle-to-end gradient classes. A single combined span was considered, but would unnecessarily change the established color distribution and make the requested removal broader than needed.
- Reduce the flex gap to provide normal word separation after the wider emoji-sized separator disappears. The containing `role="img"` and `aria-label="Org Tools"` remain the stable accessible identity.
- Regenerate the existing deterministic shell screenshots and replace the emoji-specific smoke assertion with an explicit absence assertion. No data flow, trust boundary, validation, failure-atomicity, or performance path changes because the header is static presentation.

## Risks / Trade-offs

- [The two independently clipped gradients can look discontinuous across the word space] → Keep the established shared middle color at the adjacent edges and verify both themes visually.
- [Removing the emoji narrows the header and can shift adjacent actions] → Preserve the existing flex behavior and inspect maintained desktop screenshots.

## Migration Plan

Ship the markup, assertions, documentation, and regenerated screenshots together. Rollback is the inverse markup-only change and requires no state migration.

## Open Questions

None.
