export const MCP_CLIENTS = [
  "Codex",
  "Claude Code",
  "Cursor",
  "OpenClaw",
  "Hermes",
  "Pi",
  "OpenCode",
] as const;

export type McpClientName = (typeof MCP_CLIENTS)[number];

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
