import { describe, expect, test } from "vitest";

import {
  ExportSessionStore,
  exportJsonTagFieldKeys,
  exportJsonUnitFieldKeys,
} from "@/stores/export-session-store";

describe("ExportSessionStore", () => {
  test("defaults to JSON with both compound groups disabled", () => {
    const store = new ExportSessionStore();
    expect(store.tabMode).toBe("json");
    expect(store.selectedJsonUnitFieldKeys).toEqual([]);
    expect(store.selectedJsonTagFieldKeys).toEqual([]);
  });

  test("selects all fields from off or partial and clears a fully selected group", () => {
    const store = new ExportSessionStore();
    store.toggleJsonGroup("units");
    expect(store.selectedJsonUnitFieldKeys).toEqual(exportJsonUnitFieldKeys);
    store.toggleJsonUnitFieldKey("unitId");
    expect(store.selectedJsonUnitFieldKeys).not.toContain("unitId");
    store.toggleJsonGroup("units");
    expect(store.selectedJsonUnitFieldKeys).toEqual(exportJsonUnitFieldKeys);
    store.toggleJsonGroup("units");
    expect(store.selectedJsonUnitFieldKeys).toEqual([]);

    store.toggleJsonGroup("tags");
    expect(store.selectedJsonTagFieldKeys).toEqual(exportJsonTagFieldKeys);
  });
});
