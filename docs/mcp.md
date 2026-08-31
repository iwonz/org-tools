# Local MCP

The SQLite runtime includes an optional Model Context Protocol server at `http://127.0.0.1:3000/mcp`.
It is disabled by default and is intentionally absent from GitHub Pages: the static application has
no MCP control, accessible action, dialog, route, token, or request. In the local server, open
**MCP** in the sidebar footer, review the full-access warning, and select **Enable MCP** to create a
local bearer token. The sidebar icon becomes green while enabled. The dialog can mask, reveal, copy,
or rotate that token, generates a complete agent setup prompt, and shows recent applied activity.

The endpoint is stateless Streamable HTTP. It accepts authenticated `POST` requests only from a
loopback Host, accepts no Origin or a matching loopback Origin, provides no CORS response, and has no
remote-binding or tunnel mode. Disabling access rejects every MCP request immediately while retaining
the token for a later local re-enable. Rotating the token revokes the old token and every unapplied
preview.

## Connect a client

Open the **Setup** tab and select Codex, Claude Code, Cursor, OpenClaw, Hermes, Pi, or OpenCode. The
displayed English prompt is ready to paste into that agent. It asks the agent to:

1. install the public [`org-tools` skill](../skills/org-tools/SKILL.md) globally and only for the
   selected client with
   `npx skills add iwonz/org-tools --skill org-tools -g -a <client-id> -y`;
2. configure the current loopback endpoint and bearer token using that client's exact syntax;
3. reload or restart the client when required;
4. verify the connection with `get_domain_guide` and `get_organization_overview` without performing
   a test mutation.

The client IDs are `codex`, `claude-code`, `cursor`, `openclaw`, `hermes-agent`, `pi`, and
`opencode`. The prompt embeds the current token directly; there is no placeholder or separate
environment-variable step. Codex receives a `config.toml` entry using the supported `http_headers`
map, Claude Code and Cursor receive `.mcp.json`, Pi receives a `pi-codemcp` entry, and the remaining
clients receive their local HTTP configuration shape.

The prompt is generated locally from bundled templates only while the dialog is open and exists
only in component memory or the clipboard after **Copy**. Rotate revokes the old token, invalidates
pending previews, and immediately rebuilds the prompt with the new token. ChatGPT web, Grok, Claude
web, and the generic remote Claude connector are not listed because Org Tools exposes no public
endpoint or tunnel.

The installed skill contains instructions only. It stores no token or endpoint and directs an agent
with unavailable Org Tools tools to ask for a fresh setup prompt instead of searching files,
environment variables, shell history, or logs for credentials.

## Agent workflow

Read tools expose the domain guide, state revision, Views, Units, Employees, composition analysis,
and bounded change history. Every collection uses cursor pagination with a maximum page size of 100.
Unit lists and View structures return compact membership summaries; `get_unit` separately paginates
resolved Employees and each Live-rule collection. Avatar bytes are omitted unless
`includeAvatarData` is explicitly true. The resource
`orgtools://guide` and prompts `analyze_team_composition`, `plan_reorganization`, and
`undo_agent_change` teach the same workflow.

Every mutation has a Preview and a separately approved Apply:

1. Read the current revision and relevant entities.
2. Call `preview_change(expectedRevision, reason, operations)`.
3. Review and report the server-produced semantic diff and summary.
4. Stop and wait for a new explicit user approval of that exact preview; the request that led to the
   Preview is not approval.
5. Call `apply_change(previewId)` only after that approval.
6. Report the returned `changeId`, affected IDs, base/result revisions, and exact summary.

Previews expire after ten minutes. Apply is atomic, advances the state revision once, and is
idempotent for a retained preview. Temporary references let one batch create and connect Employees,
Units, and Views before their UUIDs are known. Reorganization planning should create a Main-derived
custom View unless the user explicitly requests a Main change.

Use `preview_undo(changeId, expectedRevision)` before undoing an agent change. Selective Undo checks
every affected value against the applied result. It preserves later independent edits and blocks the
entire Undo when a later edit overlaps, returning the exact conflicting entity, View, and field. An
agent must report the undo preview and wait for another explicit approval before applying it.

## Trust boundary and recovery

The token grants complete local read/write access to Employees, Units, Main, and custom Views. The
generated setup prompt contains that secret; keep it out of screenshots, commits, and logs. Org
Tools sends data only to the local MCP client, but that agent can send the data to its configured
model provider. Choose a client and model provider whose data handling is appropriate for the
organization.

MCP settings, token, previews, and the bounded 100-change/64 MiB activity journal live only in the
configured SQLite database. They are excluded from state Export. The browser listens for external
revisions: independent local and MCP edits merge by stable ID, while overlapping fields require an
explicit **Keep local**, **Use MCP**, or **Cancel** decision. The activity dialog also offers a
confirmed selective Undo.

Run `pnpm mcp:check` for the isolated authenticated protocol smoke test and `pnpm skill:check` for
offline validation of the public skill layout and safety contract.
