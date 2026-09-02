import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { parseOrgToolsState } from "@/lib/org-file";

const syntheticWorkspaceUrl = new URL(
  "../../../../packages/screenshots/fixtures/synthetic-state.json",
  import.meta.url,
);

describe("public synthetic fixtures", () => {
  it("keeps the screenshot workspace valid and deterministic", async () => {
    const source = await readFile(syntheticWorkspaceUrl, "utf8");
    const state = parseOrgToolsState(JSON.parse(source));

    expect(Object.keys(state).sort()).toEqual(["organization", "ui"]);
    expect(state).not.toHaveProperty("formatVersion");
    expect(state.organization.employees).toHaveLength(4);
    expect(state.organization.structure.units).toHaveLength(2);
  });
});
