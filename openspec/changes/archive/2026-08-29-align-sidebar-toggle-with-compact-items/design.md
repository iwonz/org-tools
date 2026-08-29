## Context

The compact sidebar is 64 px wide with 8 px outer gutters. Its navigation items therefore occupy a
48 px by 40 px row and place a 20 px icon inside 14 px horizontal padding. The pending sidebar
refinement instead gives the toggle a 40 px square with zero padding. The icon axis happens to align,
but the target and breathing room do not match the compact menu system.

## Goals / Non-Goals

**Goals:**

- Make the toggle use the compact item footprint and horizontal padding in both sidebar modes.
- Preserve one fixed icon coordinate through the width transition.
- Cover the shared width, padding, and icon geometry in the browser suite.

**Non-Goals:**

- Changing navigation-item dimensions, sidebar widths, responsive behavior, or collapse state.
- Persisting sidebar state or changing application data.
- Refactoring unrelated sidebar actions or Calendar behavior already present in the worktree.

## Decisions

The toggle header will use the same 8 px sidebar gutter as navigation and action groups. The button
will have an explicit 48 px width, 40 px height, and 14 px horizontal padding around its 20 px icon.
Those dimensions are identical to a navigation row when the 64 px rail is compact, while the fixed
width prevents the toggle from stretching in the 240 px expanded panel.

The same classes will apply in both modes; only the chevron direction changes. This avoids a width,
padding, or alignment branch during the sidebar transition. Keeping the rule in CSS and component
local state introduces no new data flow, trust boundary, validation path, dependency, or collection
work.

Browser assertions will compare the toggle with a compact navigation item before and after toggling,
including computed inline padding and icon position. This is preferred to screenshot-only coverage
because the mismatch is geometric and should fail with an exact regression signal.

## Risks / Trade-offs

- [The expanded toggle has a deliberately compact target rather than a full-width row] → Keep it
  left-aligned with menu icons and retain the accessible label, title, focus ring, and 48 px width.
- [Duplicated utility values could drift later] → Assert equality against compact navigation geometry
  in the browser suite and describe the invariant in the capability spec.
