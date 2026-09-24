import { describe, expect, it } from "vitest";

import { createDefaultEmployeeDisplayFormats } from "@/lib/employee-display-defaults";
import { createBlankOrgToolsState } from "@/lib/org-file";
import { OrgStore } from "@/stores/org-store";

describe("state change tracking", () => {
  it("tracks imported organization state and can reset after hydration", () => {
    const store = new OrgStore();
    store.resetChangeTracking();
    expect(store.organizationChangeSequence).toBe(0);

    store.loadOrgToolsState(createBlankOrgToolsState("dark"), "import.json", 100);
    expect(store.organizationChangeSequence).toBeGreaterThan(0);
    expect(store.uiChangeSequence).toBeGreaterThan(0);

    store.resetChangeTracking();
    expect(store.organizationChangeSequence).toBe(0);
    expect(store.uiChangeSequence).toBe(0);
  });

  it("does not treat tab and theme changes as organization changes", () => {
    const store = new OrgStore();
    store.resetChangeTracking();
    store.setActiveTab("analytics");
    store.setTheme("dark");

    expect(store.organizationChangeSequence).toBe(0);
    expect(store.uiChangeSequence).toBeGreaterThan(0);
  });

  it("tracks distribution mode as bounded UI without an organization change", () => {
    const store = new OrgStore();
    const unitId = store.orgEditor.addUnit({ name: "Source", x: 0, y: 0 });
    store.resetChangeTracking();

    store.orgEditor.toggleUnitDistributionMode(unitId);

    expect(store.organizationChangeSequence).toBe(0);
    expect(store.uiChangeSequence).toBeGreaterThan(0);
  });

  it("tracks focused Employee display changes and ignores repeated values", () => {
    const store = new OrgStore();
    store.resetChangeTracking();

    store.setEmployeeDisplayFormat("employees", "{fullName}\n{tags}");
    expect(store.employeeDisplayFormats.employees).toBe("{fullName}\n{tags}");
    expect(store.organizationChangeSequence).toBe(1);

    store.setEmployeeDisplayFormat("employees", "{fullName}\n{tags}");
    expect(store.organizationChangeSequence).toBe(1);

    store.setEmployeeDisplayLineGap("employees", 12);
    expect(store.employeeDisplayLineGaps.employees).toBe(12);
    expect(store.organizationChangeSequence).toBe(2);

    store.setEmployeeDisplayLineGap("employees", 12);
    store.setEmployeeDisplaySettings(store.employeeDisplayFormats, store.employeeDisplayLineGaps);
    expect(store.organizationChangeSequence).toBe(2);
  });

  it("rejects invalid focused Employee display line gaps", () => {
    const store = new OrgStore();
    store.resetChangeTracking();

    for (const lineGap of [-1, 1.5, 25, Number.NaN]) {
      expect(() => store.setEmployeeDisplayLineGap("editor", lineGap)).toThrow(RangeError);
    }
    expect(store.organizationChangeSequence).toBe(0);
  });

  it("resets one Employee display format for the current locale", () => {
    const store = new OrgStore();
    store.setLocale("ru");
    store.setEmployeeDisplayFormat("editorExport", "Custom");
    store.setEmployeeDisplayLineGap("editorExport", 19);
    store.resetChangeTracking();

    store.resetEmployeeDisplayFormat("editorExport");

    expect(store.employeeDisplayFormats.editorExport).toBe(
      createDefaultEmployeeDisplayFormats("ru").editorExport,
    );
    expect(store.employeeDisplayLineGaps.editorExport).toBe(19);
    expect(store.organizationChangeSequence).toBe(1);

    store.setEmployeeDisplayFormat("employees", "Custom");
    store.setEmployeeDisplayLineGap("employees", 13);
    store.resetChangeTracking();
    store.resetEmployeeDisplayFormat("employees");
    expect(store.employeeDisplayFormats.employees).toBe("**{fullName}** {positions} {tags}");
    expect(store.employeeDisplayLineGaps.employees).toBe(13);
    expect(store.organizationChangeSequence).toBe(1);
  });
});
