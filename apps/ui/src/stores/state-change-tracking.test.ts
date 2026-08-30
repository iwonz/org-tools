import { describe, expect, it } from "vitest";

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
});
