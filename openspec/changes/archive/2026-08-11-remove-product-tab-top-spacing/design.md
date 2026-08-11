## Context

Product panels now share the header boundary, but their first child groups use independent top
padding: 8 px in Teams, 12 px in Employees, Analytics, and Calendar, and 10–12 px in Download.
The Editor canvas paint begins at zero, so the first visible ordinary-workflow content shifts when
the active product tab changes.

## Goals / Non-Goals

**Goals:**

- Place the first visible populated content group at the top edge of every product tab.
- Keep side and bottom spacing so controls remain readable on the continuous root surface.
- Verify the leading element geometry against the header boundary, not only the transparent wrapper.

**Non-Goals:**

- Removing spacing between later sections or inside controls.
- Moving Editor overlay controls or changing its canvas background.
- Changing centered empty states, responsive layout, or any product behavior.

## Decisions

Each top-level workflow will remove only the top component of its first group's padding or margin.
Teams will also remove the artificial minimum header height that would otherwise center the first
button below the top edge. Download will remove top margin from its first source tabs and top padding
from its selected-Employee header. Shared nested components keep their defaults; the Download caller
uses an explicit header override because this alignment is a root-surface concern.

Removing all padding from product workflows was rejected because horizontal containment and spacing
between subsequent sections remain useful. Changing the generic Tabs component was also rejected
because nested dialog and source tabs have independent layout needs.

## Risks / Trade-offs

- [Controls can appear too close to the unified header] -> Retain horizontal and bottom spacing and
  verify light/dark screenshots at maintained viewports.
- [A nested Download header can retain its default inset] -> Assert the bounding top of both source
  and selected-Employee leading controls in browser tests.
