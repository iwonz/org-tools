import { describe, expect, it } from "vitest";

import {
  buildMcpAgentSetupPrompt,
  buildMcpClientConfiguration,
  MCP_CLIENTS,
} from "@/lib/mcp-client-configuration";

describe("MCP client configuration", () => {
  const endpoint = "http://127.0.0.1:3000/mcp";
  const token = "ot_mcp_synthetic_test_token";

  it.each(MCP_CLIENTS)(
    "embeds the current token for $name without an environment step",
    ({ name }) => {
      const configuration = buildMcpClientConfiguration(name, endpoint, token);

      expect(configuration).toContain(endpoint);
      expect(configuration).toContain(`Bearer ${token}`);
      expect(configuration).not.toContain("ORG_TOOLS_MCP_TOKEN");
      expect(configuration).not.toContain("<token>");
    },
  );

  it("uses Codex static HTTP headers", () => {
    expect(buildMcpClientConfiguration("Codex", endpoint, token)).toContain(
      `http_headers = { Authorization = "Bearer ${token}" }`,
    );
  });

  it("builds the complete Codex setup prompt", () => {
    expect(buildMcpAgentSetupPrompt("Codex", endpoint, token)).toBe(
      `Set up Org Tools for me so you can inspect my organization and prepare reviewed organization-structure drafts through its local MCP server.

1. Install the Org Tools companion skill globally for Codex:
   \`npx skills add iwonz/org-tools --skill org-tools -g -a codex -y\`
2. Configure Org Tools as a Streamable HTTP MCP server at \`${endpoint}\` with the current bearer token. Use exactly this configuration:

\`\`\`
[mcp_servers.org_tools]
url = "${endpoint}"
http_headers = { Authorization = "Bearer ${token}" }
\`\`\`

3. Reload or restart Codex if it requires that after an MCP configuration change.
4. Verify the connection by calling \`get_domain_guide\` and then \`get_organization_overview\`. Do not call mutation or undo tools during setup.

Once that is done, let me know when Org Tools is ready and report the read-only organization overview.`,
    );
  });

  it.each(MCP_CLIENTS)(
    "builds a complete read-only setup prompt for $name",
    ({ name, skillsAgentId }) => {
      const prompt = buildMcpAgentSetupPrompt(name, endpoint, token);

      expect(prompt).toContain(
        `npx skills add iwonz/org-tools --skill org-tools -g -a ${skillsAgentId} -y`,
      );
      expect(prompt).toContain(endpoint);
      expect(prompt).toContain(`Bearer ${token}`);
      expect(prompt).toContain("get_domain_guide");
      expect(prompt).toContain("get_organization_overview");
      expect(prompt).toContain("Do not call mutation or undo tools during setup.");
      expect(prompt).not.toContain("ORG_TOOLS_MCP_TOKEN");
      expect(prompt).not.toContain("<token>");
    },
  );

  it("rebuilds the prompt with only the rotated token", () => {
    const firstToken = "ot_mcp_synthetic_first_token";
    const rotatedToken = "ot_mcp_synthetic_rotated_token";
    const rotatedPrompt = buildMcpAgentSetupPrompt("Codex", endpoint, rotatedToken);

    expect(rotatedPrompt).toContain(rotatedToken);
    expect(rotatedPrompt).not.toContain(firstToken);
  });
});
