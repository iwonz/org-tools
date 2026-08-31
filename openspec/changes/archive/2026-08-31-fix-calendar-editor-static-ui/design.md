## Context

The Calendar derives birthday and dated-tag collections before rendering dialogs, but two dialog
branches currently render explicit empty states instead of omitting optional sections. The Org
Editor Unit card uses a translucent hover color over its canvas, which visually weakens the card.
The Pages entry point already uses the browser controller without MCP; regression checks need to
assert the absence at the rendered UI boundary.

## Goals / Non-Goals

**Goals:**

- Render Calendar detail sections directly from the presence of their derived collections.
- Preserve full dialog space for the remaining section when another section is absent.
- Use an opaque existing accent token for Unit-card hover without geometry changes.
- Verify Pages cannot expose the MCP control, text, dialog, endpoint, or request.

**Non-Goals:**

- Change Calendar event derivation, dates, virtualization, editor state, or persistence.
- Change MCP tools, credentials, transport, server controls, or the public state contract.
- Add a dependency, migration, compatibility reader, telemetry, or Pages publication.

## Decisions

- Conditional sections remain presentation-only branches over the existing memoized arrays. This
  avoids new state and preserves failure atomicity because no data mutation is involved.
- The Calendar day body uses two columns only when both birthdays and dated tags exist. A tag dialog
  uses two equal rows only when past events exist, so the remaining list receives the full body.
- Unit hover replaces the translucent accent alpha with the opaque shared accent surface. A new
  browser assertion compares computed alpha and preserves card geometry; no bespoke color is added.
- Pages isolation is verified at the public rendered entry point and by the existing output scanner.
  MCP remains imported only by the server application entry point.

## Risks / Trade-offs

- [Conditional grids could leave implicit empty tracks] -> derive grid columns and rows from the
  same collection predicates that control section rendering.
- [An opaque hover could reduce foreground contrast in one theme] -> assert computed opacity and
  inspect both theme screenshots.
- [A selector-only Pages test could miss visible MCP copy] -> assert the control, accessible name,
  dialog, MCP endpoint requests, and output markers are all absent.
