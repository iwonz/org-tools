import { PERMISSIONS } from "@org-tools/types/security";
import { describe, expect, it } from "vitest";

import { PERMISSION_LABEL_KEYS, PERMISSION_SCOPE_LABEL_KEYS } from "./security-labels";

describe("Administration security labels", () => {
  it("provides a label for every permission without changing permission identifiers", () => {
    expect(Object.keys(PERMISSION_LABEL_KEYS).sort()).toEqual([...PERMISSIONS].sort());
    expect(Object.keys(PERMISSION_LABEL_KEYS)).toHaveLength(PERMISSIONS.length);
    expect(PERMISSIONS).toContain("employee.update");
    expect(PERMISSION_LABEL_KEYS["employee.update"]).toBe("Edit Employee data");
    expect(PERMISSION_LABEL_KEYS["editorImageExport.exportAs"]).toBe(
      "Export Editor images as another user",
    );
  });

  it("provides a label for every permission scope without changing scope identifiers", () => {
    expect(Object.keys(PERMISSION_SCOPE_LABEL_KEYS).sort()).toEqual(
      ["all", "managedDirect", "managedSubtree", "self"].sort(),
    );
    expect(PERMISSION_SCOPE_LABEL_KEYS.managedSubtree).toBe("Managed Units and descendants");
  });
});
