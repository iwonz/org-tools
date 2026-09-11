## Context

Distribution rows apply both a tonal fill and foreground through separate CSS classes. The
foreground inherits into Employee names. Connection paths and markers use the same tone class.

## Goals / Non-Goals

**Goals:** keep names in the normal light/dark theme foreground for either distribution status,
including selected rows, while retaining status backgrounds and connection colors.

**Non-Goals:** changing data flow, trust boundaries, state, membership indexes, geometry, export,
or six-locale product copy. No database conversion or dependency is needed.

## Decisions

Apply only the fill class to Employee row containers. Leave the tone class on SVG connections.
This allows normal inherited name text and ordinary selection colors without adding per-name
overrides or duplicating theme values. Update the existing settings browser workflow to assert
neutral names alongside custom fill and connection colors in both themes.

## Risks / Trade-offs

Selected distribution rows must retain neutral names while ordinary selected rows retain their
existing contrasting text. Browser checks and gallery review cover the inherited styling.
The change adds no computation or state mutation and preserves the existing scale bounds.
