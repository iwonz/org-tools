## Why

MCP controls currently place their decorative icons after the label, which conflicts with the
requested scan order, and the client selector relies on text alone. Icon-first actions and
client-specific marks make the setup surface faster to recognize without changing its behavior.

## What Changes

- Place the decorative icon before the visible label in the MCP Setup and Activity tabs and in the
  Enable and Disable actions.
- Add one bundled client-specific icon before each supported client label in Client setup.
- Rename the Russian Rotate token action to the requested Update token wording and add a leading refresh icon.
- Keep accessible names, control geometry, token handling, MCP behavior, and Pages isolation
  unchanged.
- Update automated browser coverage, documentation, specifications, and the existing screenshot
  gallery for the revised visual contract.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mcp-agent-access`: MCP modal controls become icon-first and supported client choices gain local
  client-specific marks.
- `interface-chrome`: the shared MCP control-order contract changes from trailing to leading icons.

## Impact

The change affects the server-only MCP modal, its browser tests and screenshots, and the related
MCP/interface documentation. It adds no network request, runtime dependency, API change, state
change, compatibility behavior, or Pages MCP surface.
