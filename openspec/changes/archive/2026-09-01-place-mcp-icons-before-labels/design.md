## Context

The MCP modal already uses bundled `react-icons` components and stable text labels. Its top-level
tabs and enable/disable actions currently render label then icon, while Client setup renders seven
text-only choices. The server-only boundary, accessible names, token flow, and screenshot fixtures
must remain unchanged.

## Goals / Non-Goals

**Goals:**

- Make MCP tabs, enable/disable actions, and token rotation consistently icon-first.
- Give every supported client a recognizable leading mark while preserving its full text name.
- Keep all icon assets local, decorative to assistive technology, and geometry-stable.
- Cover the ordering and all seven client mappings with browser assertions and visual review.

**Non-Goals:**

- Changing client configuration snippets, MCP transport, token lifecycle, or server APIs.
- Adding a dependency, remote brand asset, animation, icon-only client mode, or Pages MCP UI.
- Reworking unrelated button icon placement across the application.

## Decisions

### Use one explicit client-icon component

A typed `McpClientIcon` component maps the existing seven `McpClientName` values to local SVG React
components. Available Simple Icons marks are reused from the installed `react-icons` package for
Claude Code, Cursor, Hermes, Pi, and OpenCode. Codex and OpenClaw use small local inline SVG marks
because the installed bundle contains no matching exports. This keeps the mapping exhaustive and
avoids runtime requests or a new package.

All client icons use `currentColor`, a shared 16 px box, `aria-hidden`, and a stable test marker.
The visible client name remains the accessible label.

### Order icons directly before labels

The decorative icon is the first element in each affected button or tab. The rotation action uses
a bundled refresh icon, while its Russian catalog value uses the requested Update token wording. Existing shared control
gaps provide spacing, so no absolute positioning or layout-specific selector is required. This
keeps pointer, selected, and focus geometry unchanged.

### Verify DOM order rather than appearance alone

Browser coverage asserts that the first child is the expected decorative SVG and that accessible
names remain unchanged. Client choices additionally expose stable client IDs for checking the
complete mapping without coupling tests to SVG path data.

## Risks / Trade-offs

- [Two marks are locally approximated rather than imported official assets] -> Keep them simple,
  monochrome, and client-specific; they are navigational aids while the exact visible name remains
  authoritative.
- [Decorative SVGs could pollute accessible names] -> Mark every icon `aria-hidden` and assert the
  full text label as the button's accessible name.
- [A future client can be added without an icon] -> Type the icon map against `McpClientName` so a
  missing case fails TypeScript.
