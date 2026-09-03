import { describe, expect, it } from "vitest";

import { SURFACE_LAYER_INDEX } from "@/lib/surface-layers";

describe("floating surface layers", () => {
  it("keeps nested Select content above Popovers and Dialogs", () => {
    expect(SURFACE_LAYER_INDEX.popover).toBeGreaterThan(SURFACE_LAYER_INDEX.dialog);
    expect(SURFACE_LAYER_INDEX.select).toBeGreaterThan(SURFACE_LAYER_INDEX.popover);
  });
});
