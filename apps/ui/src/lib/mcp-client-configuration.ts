export const MCP_CLIENTS = [
  { name: "Codex", skillsAgentId: "codex" },
  { name: "Claude Code", skillsAgentId: "claude-code" },
  { name: "Cursor", skillsAgentId: "cursor" },
  { name: "OpenClaw", skillsAgentId: "openclaw" },
  { name: "Hermes", skillsAgentId: "hermes-agent" },
  { name: "Pi", skillsAgentId: "pi" },
  { name: "OpenCode", skillsAgentId: "opencode" },
] as const;

export type McpClientName = (typeof MCP_CLIENTS)[number]["name"];

const getClient = (name: McpClientName) => {
  const client = MCP_CLIENTS.find((candidate) => candidate.name === name);
  if (!client) throw new Error(`Unsupported MCP client: ${name}`);
  return client;
};

export const buildMcpClientConfiguration = (
  client: McpClientName,
  endpoint: string,
  token: string,
): string => {
  const authorization = `Bearer ${token}`;
  if (client === "Codex") {
    return `[mcp_servers.org_tools]\nurl = ${JSON.stringify(endpoint)}\nhttp_headers = { Authorization = ${JSON.stringify(authorization)} }`;
  }
  if (client === "OpenCode") {
    return JSON.stringify(
      {
        mcp: {
          "org-tools": {
            enabled: true,
            headers: { Authorization: authorization },
            type: "remote",
            url: endpoint,
          },
        },
      },
      null,
      2,
    );
  }
  if (client === "Pi") {
    return `pi-codemcp\nname: org-tools\ntransport: streamable-http\nurl: ${endpoint}\nAuthorization: ${authorization}`;
  }
  return JSON.stringify(
    {
      mcpServers: {
        "org-tools": {
          headers: { Authorization: authorization },
          type: "http",
          url: endpoint,
        },
      },
    },
    null,
    2,
  );
};

export const buildMcpAgentSetupPrompt = (
  clientName: McpClientName,
  endpoint: string,
  token: string,
): string => {
  const client = getClient(clientName);
  const configuration = buildMcpClientConfiguration(clientName, endpoint, token);

  return `Set up Org Tools for me so you can inspect my organization and prepare reviewed organization-structure drafts through its local MCP server.

1. Install the Org Tools companion skill globally for ${clientName}:
   \`npx skills add iwonz/org-tools --skill org-tools -g -a ${client.skillsAgentId} -y\`
2. Configure Org Tools as a Streamable HTTP MCP server at \`${endpoint}\` with the current bearer token. Use exactly this configuration:

\`\`\`
${configuration}
\`\`\`

3. Reload or restart ${clientName} if it requires that after an MCP configuration change.
4. Verify the connection by calling \`get_domain_guide\` and then \`get_organization_overview\`. Do not call mutation or undo tools during setup.

Once that is done, let me know when Org Tools is ready and report the read-only organization overview.`;
};
