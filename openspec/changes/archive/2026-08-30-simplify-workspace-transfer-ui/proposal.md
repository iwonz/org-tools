## Why

Workspace transfer currently exposes partial-state projections, arbitrary JSON mapping, and a
four-choice Export dialog even though projects and browser workspaces are durable full snapshots.
The extra paths make the interface and public contract harder to understand, while floating menus
and persistent status copy add avoidable visual noise.

## What Changes

- **BREAKING** Narrow `OrgToolsState.content` to the literal `"workspace"` and remove partial-state
  and arbitrary-JSON import/export compatibility.
- Replace Import with strict full-workspace validation and one compact destructive replacement
  confirmation; make Export an immediate validated `org-tools-state.json` download.
- Make Save feedback transient, remove the file-menu heading, and hide Autosave UI entirely when
  File System Access is unavailable.
- Give every non-modal dropdown surface one stable neutral outline without interaction borders or
  additional elevation.
- Remove obsolete mapping, projection, example, test, specification, documentation, and screenshot
  artifacts while leaving the separate CSV/JSON/PNG Download workflow unchanged.

## Capabilities

### New Capabilities

- `workspace-transfer`: Strict full-workspace Import and immediate full-workspace Export behavior.

### Modified Capabilities

- `structured-import`: Remove every partial-state import requirement.
- `structured-save`: Remove every partial-state and dialog-based workspace Export requirement.
- `tabular-import`: Remove arbitrary JSON discovery, mapping, preview, and append requirements.
- `workspace-state`: Replace the content-scoped public contract with one complete workspace shape.
- `interface-chrome`: Define transient Save feedback and consistent outlined dropdown surfaces.
- `interface-localization`: Remove obsolete transfer copy while preserving localized replacement
  errors, summaries, and status feedback.
- `privacy-safety`: Restrict transfer validation and local data flow to full workspace files.
- `project-tooling`: Update repository scans, browser coverage, and the reduced screenshot catalog.
- `project-workspaces`: Preserve project identity and dirty semantics across full workspace Import.
- `browser-pages-workspace`: Preserve file binding and fallback behavior while hiding unavailable
  Autosave controls.

## Impact

The public TypeScript and JSON transfer contract becomes workspace-only. Previously exported full
workspace files remain valid; partial state files and arbitrary JSON are rejected without migration
or fallback. Import/export UI, stores, serializers, messages, tests, examples, documentation,
OpenSpec capabilities, screenshot generation, and publication checks are simplified. SQLite APIs,
project identity, browser file handles, the Download tab, privacy boundaries, and performance
targets remain unchanged.
