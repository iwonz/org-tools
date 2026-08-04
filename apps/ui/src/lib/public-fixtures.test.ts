import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  createEmployeeImportAutoMapping,
  normalizeEmployeeImportRows,
  parseEmployeeImportText,
  planEmployeeImport,
} from "@/lib/employee-import";
import { parseOrgToolsState } from "@/lib/org-file";

const syntheticWorkspaceUrl = new URL(
  "../../../../packages/screenshots/fixtures/synthetic-workspace.json",
  import.meta.url,
);
const exampleJsonUrl = new URL("../../../../examples/employees.json", import.meta.url);

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

  it("discovers and maps the nested JSON example collection", async () => {
    const source = await readFile(exampleJsonUrl, "utf8");
    const parsed = parseEmployeeImportText(source);
    expect(parsed.kind).toBe("tabular");
    if (parsed.kind !== "tabular") return;

    const collection = parsed.document.collections.find(({ id }) => id === "$.records");
    expect(collection).toBeDefined();
    if (!collection) return;
    const mapping = createEmployeeImportAutoMapping(collection.sourceFields);
    expect(mapping).toMatchObject({
      firstName: "name.given",
      lastName: "name.family",
    });
    const rows = normalizeEmployeeImportRows(collection, mapping, ",");
    const plan = planEmployeeImport(rows, [], mapping);

    expect(plan.canCommit).toBe(true);
    expect(plan.newEmployeeCount).toBe(2);
    expect(plan.invalidRowCount).toBe(0);
  });
});
