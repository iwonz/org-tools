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
    expect(store.jsonTopLevelFieldOrder.slice(-2)).toEqual(["units", "tags"]);
    expect(store.selectedJsonUnitFieldKeys).toEqual([]);
    expect(store.selectedJsonTagFieldKeys).toEqual([]);
  });

  test("reorders top-level and nested JSON fields without changing selection", () => {
    const store = new ExportSessionStore();
    store.toggleEmployeeFieldKey("email");
    store.toggleJsonGroup("units");
    store.moveJsonTopLevelFieldKey("units", "username", "before");
    store.moveJsonUnitFieldKey("isBoss", "unitId", "before");

    expect(store.jsonTopLevelFieldOrder.slice(0, 2)).toEqual(["units", "username"]);
    expect(store.selectedEmployeeFieldKeys).toEqual(["username", "email"]);
    expect(store.jsonUnitFieldOrder[0]).toBe("isBoss");
    expect(store.selectedJsonUnitFieldKeys[0]).toBe("isBoss");
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
