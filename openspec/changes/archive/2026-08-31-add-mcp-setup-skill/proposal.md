## Why

The MCP dialog still exposes a technical configuration block without a reusable agent workflow, so
users must teach every client how to use Org Tools after connecting it. Its enabled icon also names
a semantic color that the theme does not define, so the intended green signal is not rendered
reliably.

## What Changes

- Replace the visible MCP dialog description and raw configuration block with a copyable, generated
  agent setup prompt containing the selected client's exact endpoint, current token, connection
  configuration, companion-skill install command, and read-only verification steps.
- Add one public, instruction-only `org-tools` Agent Skill that teaches bounded discovery,
  organization analysis, Main-derived draft Views, explicit Preview approval before Apply, safe Undo,
  and exact result reporting.
- Add a real semantic success color in both themes and keep the enabled MCP icon green across sidebar
  layouts and interaction states.
- Add deterministic skill validation, client prompt tests, browser coverage, documentation, and
  updated MCP screenshots.
- Keep Org Tools installation, MCP protocol/tools, SQLite, public state, Pages isolation, and the
  43-frame gallery count unchanged. No CLI package or automatic MCP enablement is introduced.

## Capabilities

### New Capabilities

- `mcp-agent-skill`: Defines the distributable Org Tools Agent Skill, global installation contract,
  safe agent workflow, and unavailable-MCP recovery behavior.

### Modified Capabilities

- `mcp-agent-access`: Replaces raw client configuration with an in-memory setup prompt and requires
  explicit user approval before Apply or Undo.
- `interface-chrome`: Removes the visible MCP header description and makes the enabled icon visibly
  semantic green without interaction-state regressions.
- `interface-localization`: Localizes the new setup-prompt controls and accessibility description
  while treating the English agent prompt as machine-facing configuration.
- `privacy-safety`: Keeps prompt generation local and transient, excludes credentials from durable
  state and artifacts, and limits provider-boundary disclosure to documentation rather than visible
  modal copy.
- `project-tooling`: Adds skill validation and updates deterministic MCP browser and screenshot
  coverage without changing Pages publication.

## Impact

The server-only MCP control, theme tokens, message catalogs, MCP domain guide, documentation,
OpenSpec capabilities, tests, and five MCP gallery frames change. The repository gains
`skills/org-tools/SKILL.md` and a local `pnpm skill:check` command. The setup prompt invokes the
third-party `skills` installer only after a user copies it to an agent; Org Tools itself performs no
new remote request, stores no generated prompt, and never includes MCP code in Pages.
