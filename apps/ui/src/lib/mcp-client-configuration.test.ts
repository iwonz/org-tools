import { describe, expect, it } from "vitest";

import { buildMcpClientConfiguration, MCP_CLIENTS } from "@/lib/mcp-client-configuration";

describe("MCP client configuration", () => {
  const endpoint = "http://127.0.0.1:3000/mcp";
  const token = "ot_mcp_synthetic_test_token";

  it.each(MCP_CLIENTS)("embeds the current token for %s without an environment step", (client) => {
    const configuration = buildMcpClientConfiguration(client, endpoint, token);

    expect(configuration).toContain(endpoint);
    expect(configuration).toContain(`Bearer ${token}`);
    expect(configuration).not.toContain("ORG_TOOLS_MCP_TOKEN");
    expect(configuration).not.toContain("<token>");
  });

  it("uses Codex static HTTP headers", () => {
    expect(buildMcpClientConfiguration("Codex", endpoint, token)).toContain(
      `http_headers = { Authorization = "Bearer ${token}" }`,
    );
  });
});
