import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { OrgToolsState } from "@org-tools/types";
import { describe, expect, it } from "vitest";
import { createBlankOrgToolsState, parseOrgToolsState } from "@/lib/org-file";
import { projectAccountUi } from "@/server/authorized-ui";

describe("authorized UI projection", () => {
  it("removes hidden identifiers while retaining the account's own search state", () => {
    const state = createBlankOrgToolsState();
    const systemView = state.organization.views[0];
    if (!systemView) throw new Error("fixture is missing the system View");
    state.ui.activeTab = "orgEditor";
    state.ui.editor.searchOpen = true;
    state.ui.editor.searchQuery = "confidential value";
    state.ui.expandedUnitIds = ["00000000-0000-4000-8000-000000000111"];
    state.ui.employees.query = "private employee";
    state.ui.editorImageExport.excludedTagIds = ["00000000-0000-4000-8000-000000000112"];
    const result = projectAccountUi({
      access: {
        grants: [],
        isSuperAdmin: false,
        managedDirectUnitIds: [],
        managedSubtreeUnitIds: [],
      },
      projection: {
        employeeDisplayFormats: state.organization.employeeDisplayFormats,
        employeeDisplayLineGaps: state.organization.employeeDisplayLineGaps,
        employeeFieldDefinitions: [],
        employees: [],
        tags: [],
        views: [],
      },
      ui: state.ui,
    });
    expect(result.activeTab).toBe("employees");
    expect(result.editor.views).toEqual([]);
    expect(result.editor.searchQuery).toBe("confidential value");
    expect(result.employees.query).toBe("private employee");
    expect(result.expandedUnitIds).toEqual([]);
    expect(result.editorImageExport).toEqual({
      excludedTagIds: [],
      hideStaffingSlots: false,
    });
  });

  it("keeps only references that exist in the authorized projection", () => {
    const state = createBlankOrgToolsState();
    const systemView = state.organization.views[0];
    if (!systemView) throw new Error("fixture is missing the system View");
    const editorView = state.ui.editor.views[0];
    if (!editorView) throw new Error("fixture is missing the system Editor UI state");
    state.ui.editor.views[0] = {
      ...editorView,
      distributionModeUnitIds: ["00000000-0000-4000-8000-000000000111"],
      viewId: systemView.id,
    };
    const result = projectAccountUi({
      access: {
        grants: [{ permission: "editor.system.read", scope: "all" }],
        isSuperAdmin: false,
        managedDirectUnitIds: [],
        managedSubtreeUnitIds: [],
      },
      projection: {
        employeeDisplayFormats: state.organization.employeeDisplayFormats,
        employeeDisplayLineGaps: state.organization.employeeDisplayLineGaps,
        employeeFieldDefinitions: [],
        employees: [],
        tags: [],
        views: [systemView],
      },
      ui: state.ui,
    });
    expect(result.activeTab).toBe("orgEditor");
    expect(result.editor.views).toHaveLength(1);
    expect(result.editor.views[0]?.distributionModeUnitIds).toEqual([]);
  });

  it("keeps only authorized image-export Tag exclusions", () => {
    const state = createBlankOrgToolsState();
    const visibleTagId = "00000000-0000-4000-8000-000000000121";
    const hiddenTagId = "00000000-0000-4000-8000-000000000122";
    state.ui.editorImageExport = {
      excludedTagIds: [visibleTagId, hiddenTagId],
      hideStaffingSlots: true,
    };
    const result = projectAccountUi({
      access: {
        grants: [],
        isSuperAdmin: false,
        managedDirectUnitIds: [],
        managedSubtreeUnitIds: [],
      },
      projection: {
        employeeDisplayFormats: state.organization.employeeDisplayFormats,
        employeeDisplayLineGaps: state.organization.employeeDisplayLineGaps,
        employeeFieldDefinitions: [],
        employees: [],
        tags: [{ color: "blue", id: visibleTagId, label: "Visible" }],
        views: [],
      },
      ui: state.ui,
    });

    expect(result.editorImageExport).toEqual({
      excludedTagIds: [visibleTagId],
      hideStaffingSlots: true,
    });
  });

  it("keeps Download state valid for projected custom Employee fields", async () => {
    const state = JSON.parse(
      await readFile(
        resolve(process.cwd(), "packages/screenshots/fixtures/synthetic-state.json"),
        "utf8",
      ),
    ) as OrgToolsState;
    const result = projectAccountUi({
      access: {
        grants: [],
        isSuperAdmin: true,
        managedDirectUnitIds: [],
        managedSubtreeUnitIds: [],
      },
      projection: state.organization,
      ui: state.ui,
    });

    expect(() =>
      parseOrgToolsState({ organization: state.organization, ui: result }),
    ).not.toThrow();
    expect(
      result.download.jsonTopLevelFieldOrder.filter((field) => field.startsWith("custom:")),
    ).toHaveLength(3);
  });
});
