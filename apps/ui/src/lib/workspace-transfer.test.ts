import { describe, expect, it } from "vitest";

import { createBlankOrgToolsState } from "@/lib/org-file";
import { MAX_WORKSPACE_IMPORT_BYTES, parseWorkspaceImportText } from "@/lib/workspace-transfer";

describe("workspace transfer", () => {
  it("parses one complete workspace and derives bounded summary counts", () => {
    const state = createBlankOrgToolsState("dark");
    const candidate = parseWorkspaceImportText("workspace.json", JSON.stringify(state));

    expect(candidate).toMatchObject({
      employeeCount: 0,
      fileName: "workspace.json",
      state,
      unitCount: 0,
      viewCount: 1,
    });
  });

  it.each(["teams", "employees", "teamsEmployees"])(
    "rejects the obsolete %s content scope",
    (content) => {
      const state = createBlankOrgToolsState("system") as unknown as Record<string, unknown>;
      expect(() =>
        parseWorkspaceImportText("partial.json", JSON.stringify({ ...state, content })),
      ).toThrow("Only a complete Org Tools workspace can be imported.");
    },
  );

  it("rejects arbitrary and malformed JSON", () => {
    expect(() => parseWorkspaceImportText("rows.json", '[{"name":"Example"}]')).toThrow(
      "Only a complete Org Tools workspace can be imported.",
    );
    expect(() => parseWorkspaceImportText("broken.json", "{")).toThrow(
      "Could not read or parse the selected file.",
    );
  });

  it("rejects files larger than the workspace limit", () => {
    expect(() =>
      parseWorkspaceImportText("large.json", "{}", MAX_WORKSPACE_IMPORT_BYTES + 1),
    ).toThrow("The selected file is {size} MiB; the limit is {limit} MiB.");
  });
});
