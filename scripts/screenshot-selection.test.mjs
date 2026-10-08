import { describe, expect, it } from "vitest";

import { createScreenshotSelection } from "../packages/screenshots/tests/screenshot-selection.ts";

const manifest = [
  { id: "employee-list", module: "employees" },
  { id: "employee-form", module: "employees" },
  { id: "editor-canvas", module: "editor" },
];

describe("screenshot selection", () => {
  it("selects the full manifest without a filter", () => {
    expect([...createScreenshotSelection(manifest, {})]).toEqual([
      "employee-list",
      "employee-form",
      "editor-canvas",
    ]);
  });

  it("combines module and exact ID filters", () => {
    expect([
      ...createScreenshotSelection(manifest, { ids: "editor-canvas", modules: "employees" }),
    ]).toEqual(["employee-list", "employee-form", "editor-canvas"]);
  });

  it("rejects stale module and ID names", () => {
    expect(() =>
      createScreenshotSelection(manifest, { ids: "removed", modules: "missing" }),
    ).toThrow("modules=missing; ids=removed");
  });
});
