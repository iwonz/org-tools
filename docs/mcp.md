# Local MCP agent access

The SQLite runtime includes an optional Model Context Protocol server at `http://127.0.0.1:3000/mcp`.
It is disabled by default and is intentionally absent from GitHub Pages. Open **Agent access** in the
sidebar footer, review the full-access warning, and select **Enable MCP** to create a local bearer
token. The dialog can mask, reveal, copy, or rotate that token and shows recent applied activity.

The endpoint is stateless Streamable HTTP. It accepts authenticated `POST` requests only from a
loopback Host, accepts no Origin or a matching loopback Origin, provides no CORS response, and has no
remote-binding or tunnel mode. Disabling access rejects every MCP request immediately while retaining
the token for a later local re-enable. Rotating the token revokes the old token and every unapplied
preview.

## Connect a client

Set the token in the environment before starting the selected client:

```sh
export ORG_TOOLS_MCP_TOKEN='ot_mcp_...'
```

For Codex, add this to user `~/.codex/config.toml` or trusted project `.codex/config.toml`:

```toml
[mcp_servers.org_tools]
url = "http://127.0.0.1:3000/mcp"
bearer_token_env_var = "ORG_TOOLS_MCP_TOKEN"
```

Claude Code and Cursor can use an HTTP entry in `.mcp.json`:

```json
{
  "mcpServers": {
    "org-tools": {
      "type": "http",
      "url": "http://127.0.0.1:3000/mcp",
      "headers": {
        "Authorization": "Bearer ${ORG_TOOLS_MCP_TOKEN}"
      }
    }
  }
}
```

OpenClaw and Hermes use the same Streamable HTTP URL and `Authorization: Bearer
${ORG_TOOLS_MCP_TOKEN}` header in their local MCP server settings. Pi connects through
`pi-codemcp`; configure an `org-tools` Streamable HTTP server with that URL and header. OpenCode can
use:

```json
{
  "mcp": {
    "org-tools": {
      "type": "remote",
      "url": "http://127.0.0.1:3000/mcp",
      "enabled": true,
      "headers": {
        "Authorization": "Bearer {env:ORG_TOOLS_MCP_TOKEN}"
      }
    }
  }
}
```

The in-product dialog keeps these client templates bundled and offline. ChatGPT web, Grok, Claude
web, and the generic remote Claude connector are not listed because Org Tools does not expose a
public endpoint or tunnel.

## Agent workflow

Read tools expose the domain guide, state revision, Views, Units, Employees, composition analysis,
and bounded change history. Every collection uses cursor pagination with a maximum page size of 100.
Unit lists and View structures return compact membership summaries; `get_unit` separately paginates
resolved Employees and each Live-rule collection. Avatar bytes are omitted unless
`includeAvatarData` is explicitly true. The resource
`orgtools://guide` and prompts `analyze_team_composition`, `plan_reorganization`, and
`undo_agent_change` teach the same workflow.

Every mutation is two-step:

1. Read the current revision and relevant entities.
2. Call `preview_change(expectedRevision, reason, operations)`.
3. Review and report the server-produced semantic diff and summary.
4. Call `apply_change(previewId)` only after approval.
5. Report the returned `changeId`, affected IDs, base/result revisions, and exact summary.

Previews expire after ten minutes. Apply is atomic, advances the state revision once, and is
idempotent for a retained preview. Temporary references let one batch create and connect Employees,
Units, and Views before their UUIDs are known. Reorganization planning should create a Main-derived
custom View unless the user explicitly requests a Main change.

Use `preview_undo(changeId, expectedRevision)` before undoing an agent change. Selective Undo checks
every affected value against the applied result. It preserves later independent edits and blocks the
entire Undo when a later edit overlaps, returning the exact conflicting entity, View, and field.

## Trust boundary and recovery

The token grants complete local read/write access to Employees, Units, Main, and custom Views. Keep
it out of shell history, screenshots, commits, and logs. Org Tools sends data only to the local MCP
client, but that agent can send the data to its configured model provider. Choose a client and model
provider whose data handling is appropriate for the organization.

MCP settings, token, previews, and the bounded 100-change/64 MiB activity journal live only in the
configured SQLite database. They are excluded from state Export. The browser listens for external
revisions: independent local and MCP edits merge by stable ID, while overlapping fields require an
explicit **Keep local**, **Use MCP**, or **Cancel** decision. The activity dialog also offers a
confirmed selective Undo.

Run `pnpm mcp:check` for the isolated authenticated protocol smoke test.
