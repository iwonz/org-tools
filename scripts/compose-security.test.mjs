import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

function serviceBlock(source, serviceName) {
  const match = source.match(new RegExp(`^  ${serviceName}:\\n(?<body>(?: {4}.*\\n|\\n)*)`, "mu"));
  if (!match?.groups?.body) {
    throw new Error(`Missing ${serviceName} service`);
  }
  return match.groups.body;
}

describe("Compose application security", () => {
  it("limits the development write exception without weakening production", async () => {
    const [productionSource, developmentSource] = await Promise.all([
      readFile("compose.yaml", "utf8"),
      readFile("compose.dev.yaml", "utf8"),
    ]);
    const productionApp = serviceBlock(productionSource, "app");
    const developmentApp = serviceBlock(developmentSource, "app");
    const developmentToolbox = serviceBlock(developmentSource, "toolbox");

    expect(productionApp).toContain('cap_drop: ["ALL"]');
    expect(productionApp).toContain("read_only: true");
    expect(productionApp).toContain('user: "10001:10001"');
    expect(productionApp).not.toContain("cap_add:");

    expect(developmentApp).toContain('cap_add: ["DAC_OVERRIDE"]');
    expect(developmentApp).toContain("read_only: false");
    expect(developmentApp).toContain('user: "0:0"');
    expect(developmentSource.match(/cap_add:/gu)).toHaveLength(1);

    expect(developmentToolbox).toContain('GIT_CONFIG_COUNT: "1"');
    expect(developmentToolbox).toContain("GIT_CONFIG_KEY_0: safe.directory");
    expect(developmentToolbox).toContain("GIT_CONFIG_VALUE_0: /workspace");
    expect(developmentApp).not.toContain("GIT_CONFIG_");
    expect(productionSource).not.toContain("GIT_CONFIG_");
  });
});
