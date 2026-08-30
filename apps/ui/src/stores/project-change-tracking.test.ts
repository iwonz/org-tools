import { describe, expect, it } from "vitest";

import { createBlankOrgToolsState } from "@/lib/org-file";
import { OrgStore } from "@/stores/org-store";

describe("project change tracking", () => {
  it("marks imported organization state dirty but can reset after project hydration", () => {
    const store = new OrgStore();
    store.resetProjectChangeTracking();
    expect(store.organizationChangeSequence).toBe(0);

    store.loadOrgToolsState(createBlankOrgToolsState("dark"), "import.json", 100);
    expect(store.organizationChangeSequence).toBeGreaterThan(0);
    expect(store.uiChangeSequence).toBeGreaterThan(0);

    store.resetProjectChangeTracking();
    expect(store.organizationChangeSequence).toBe(0);
    expect(store.uiChangeSequence).toBe(0);
  });

  it("does not treat tab and theme changes as organization changes", () => {
    const store = new OrgStore();
    store.resetProjectChangeTracking();
    store.setActiveTab("analytics");
    store.setTheme("dark");

    expect(store.organizationChangeSequence).toBe(0);
    expect(store.uiChangeSequence).toBeGreaterThan(0);
  });
});
