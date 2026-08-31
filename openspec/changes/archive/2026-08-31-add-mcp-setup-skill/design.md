## Context

The local runtime already exposes authenticated Streamable HTTP MCP, seven client-specific
configuration shapes, bundled server guidance, and explicit Enable/Rotate controls. The dialog
currently renders the raw configuration and a visible header description. It assigns `text-success`
to the enabled icon, but the theme has no success color token, so the class has no generated color.

The repository is public and can distribute an Agent Skill directly from a conventional
`skills/org-tools/SKILL.md` path. The application must remain local-only: it may generate a prompt in
memory, but it must not install software, contact GitHub, persist the prompt, or include MCP in Pages.

## Goals / Non-Goals

**Goals:**

- Give each supported local client one copyable prompt that installs the public skill, configures
  the current endpoint and token, reloads the client, and verifies read-only connectivity.
- Teach agents the domain and enforce a user approval boundary between Preview and Apply or Undo.
- Make enabled MCP visually green in both themes and every sidebar interaction state.
- Keep the visible modal compact, localized, deterministic, and free of real credentials in tests.

**Non-Goals:**

- Publishing an Org Tools CLI, npm runtime package, plugin, tunnel, remote MCP endpoint, or automatic
  enablement.
- Changing MCP tools, control APIs, SQLite, `OrgToolsState`, Pages, or the gallery size.
- Persisting generated prompts or tokens outside existing MCP settings and selected client config.

## Decisions

### Distribute one instruction-only skill from the repository

`skills/org-tools/SKILL.md` is the only skill artifact. It has precise discovery metadata and a
compact workflow, with no scripts, assets, copied schemas, or credentials. `npx skills add` can
discover that conventional path and install it globally for a selected agent. A local validation
script checks the skill without adding a runtime dependency or contacting a registry.

This is preferred to a plugin because the user selected a simple cross-agent skill install and the
dynamic local token cannot be safely bundled in a static plugin manifest. It is preferred to an npm
Org Tools CLI because the application is already running before its modal can generate the prompt.

### Generate one complete prompt from typed client descriptors

Each supported client descriptor contains its display name and `skills` installer agent ID. The
existing exact client configuration builder remains the source of transport syntax. A new pure
builder embeds that configuration into a fixed English agent prompt together with the global skill
install command and read-only verification calls.

The current endpoint and token are arguments. The builder rejects neither valid dynamic ports nor
token rotations, adds no placeholder or token environment variable, and returns no value until the
UI has the revealed token in memory. Selecting a client or rotating the token recomputes the prompt.
Copy is an explicit user action; the application performs no setup command or external request.

### Preserve accessibility without visible header copy

The MCP title retains an `sr-only` localized DialogDescription so Radix has a description and
assistive technology receives context, while the unwanted visible sentence is absent. The disabled
consent screen continues to disclose full local read/write authority before Enable.

### Define success as a theme semantic token

Light and dark palettes define `--success`, exposed through Tailwind as `--color-success`. The MCP
icon owns `text-success` while enabled, so inherited hover, active, open, compact, and expanded
button colors cannot replace it. Browser tests compare computed enabled color with the disabled
foreground rather than merely checking a class name.

### Keep the explicit approval boundary in both guidance layers

The MCP server guide and installed skill both allow bounded reads and Preview without another
confirmation. They require the agent to present the server diff and wait for a new explicit user
approval before Apply. Undo uses the same preview-and-approval boundary. Setup verification calls
only read tools and never changes state.

## Risks / Trade-offs

- **A copied prompt contains the current bearer token** -> Generate it only after explicit Enable,
  keep it in component memory, mask the separate credential row, disable Copy on load failure, rotate
  atomically, sanitize screenshots, and document that copied setup text is a secret.
- **Third-party client configuration can evolve** -> Keep all seven shapes in one tested pure module
  and include the exact configuration inside the prompt so the selected agent can apply it.
- **A remote skill install uses GitHub outside the application's privacy boundary** -> Org Tools
  never runs the command; the user explicitly sends the copied prompt to their chosen agent.
- **English prompt text appears in Russian UI** -> Treat the preformatted agent instruction like
  machine configuration while localizing its heading, Copy action, status, and accessibility copy.
- **Skill guidance could duplicate server instructions** -> Keep the skill focused on routing,
  approval, and reporting, and require it to read the current server guide first.
