## Why

Org Tools has no safe, local protocol that lets coding agents inspect an organization or prepare and apply auditable organization changes. An embedded, explicitly enabled MCP endpoint provides that access without weakening the product's local-only privacy boundary or requiring a remote connector.

## What Changes

- Add an opt-in, bearer-authenticated Streamable HTTP MCP endpoint to the loopback SQLite runtime; the browser-only Pages runtime remains MCP-free.
- Add paginated read tools for organization guidance, Employees, Units, Views, composition analysis, and the local MCP change log.
- Add an atomic Preview -> Apply workflow for Employee, Unit, assignment, hierarchy, geometry, and View mutations, including temporary references, idempotent apply, expiration, and safe selective undo.
- Extend the SQLite schema with persistent MCP settings, short-lived previews, and a bounded semantic activity journal while preserving the singleton organization state and public Import/Export contract.
- Make state writes revision-aware and notify live browser sessions about external revisions so independent edits can merge and overlapping edits require an explicit localized resolution.
- Add a server-only sidebar control and localized modal for consent, token lifecycle, supported local-client setup, examples, activity summaries, and confirmed undo.
- Add bundled MCP guidance as a resource and reusable prompts. Saved organization fields are always treated as data, never as agent instructions.
- Document the local trust boundary: Org Tools sends data only to the authenticated local MCP client, while that client may forward it to its selected model provider.

Non-goals are remote tunnels, CORS, legacy HTTP+SSE, MCP on GitHub Pages, cloud connector support, multi-user collaboration, automatic agent approval, export of MCP credentials/history, or a change to `OrgToolsState`.

## Capabilities

### New Capabilities

- `mcp-agent-access`: Secure local MCP transport, tools, prompts, preview/apply mutations, activity history, token controls, and selective undo.

### Modified Capabilities

- `single-state-runtime`: Revision-aware singleton writes, external revision events, and deterministic three-way reconciliation with MCP changes.
- `privacy-safety`: Local MCP disclosure boundary, token protection, transport validation, and Pages isolation.
- `interface-chrome`: Server-only footer action and MCP management/activity modal behavior.
- `interface-localization`: Complete English/Russian MCP UI, errors, setup instructions, and conflict resolution copy.
- `organization-editor`: Atomic externally applied organization/View changes and explicit overlap resolution in the live editor.
- `project-tooling`: MCP protocol checks, gallery coverage, publication isolation, and documentation requirements.

## Impact

- Adds the official MCP TypeScript server SDK and schema validation dependency to the local server application.
- Adds `/mcp`, same-origin MCP control routes, and a state revision event endpoint to the Next.js server runtime.
- Migrates the configured local SQLite database from schema v1 to v2 without changing or exporting its singleton organization state.
- Extends server persistence, state coordination, MobX integration, localization catalogs, browser/protocol/unit tests, docs, OpenSpec capability specs, and the screenshot gallery from 38 to 43 images.
- Keeps GitHub Pages static, browser-only, free of MCP code, API calls, credentials, organization fixtures, and server chunks.
