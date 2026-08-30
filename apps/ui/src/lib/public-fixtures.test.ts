import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { parseOrgToolsState } from "@/lib/org-file";

const syntheticWorkspaceUrl = new URL(
  "../../../../packages/screenshots/fixtures/synthetic-workspace.json",
  import.meta.url,
);

describe("public synthetic fixtures", () => {
  it("keeps the screenshot workspace valid and deterministic", async () => {
    const source = await readFile(syntheticWorkspaceUrl, "utf8");
    const state = parseOrgToolsState(JSON.parse(source));

    expect(state.kind).toBe("org-tools-state");
    expect(state.content).toBe("workspace");
    expect(state).not.toHaveProperty("formatVersion");
    expect(state.employees).toHaveLength(4);
    expect(state.views).toHaveLength(1);
    expect(state.views[0]?.state.units).toHaveLength(2);
  });
});
