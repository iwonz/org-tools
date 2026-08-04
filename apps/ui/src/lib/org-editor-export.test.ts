import type { Employee, OrgEditorUnit } from "@org-tools/types";
import { describe, expect, test } from "vitest";

import {
  createDefaultOrgEditorImageExportSettings,
  createOrgEditorExportFileBaseName,
  getEmployeeCanvasAvatarUrl,
  getOrgEditorExportEmployeeRowHeight,
  getOrgEditorExportEmployeeTagLabels,
  ORG_EDITOR_EXPORT_GRADIENTS,
} from "@/lib/org-editor-export";

const employee: Employee = {
  avatarBase64Url: "data:image/webp;base64,aGVsbG8=",
  birthday: null,
  email: "avery@example.test",
  firstName: "Avery",
  fullName: "Avery Stone",
  id: "00000000-0000-4000-8000-000000000011",
  lastName: "Stone",
  phone: "+1 555-0111",
  profileUrl: null,
  scope: "workspace",
  tags: [],
  unitIds: [],
  unitPositions: [],
  username: "avery",
};

const unit: OrgEditorUnit = {
  bossEmployeeId: null,
  collapsed: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  employeeIds: [],
  employeePositions: [],
  id: "00000000-0000-4000-8000-000000000012",
  liveFilter: null,
  name: "Research & Development / Lab",
  order: 0,
  parentId: null,
  updatedAt: "2026-01-01T00:00:00.000Z",
  x: 0,
  y: 0,
};

describe("Org Editor image export", () => {
  test("uses only a validated embedded avatar", () => {
    expect(getEmployeeCanvasAvatarUrl(employee)).toBe(employee.avatarBase64Url);
    expect(
      getEmployeeCanvasAvatarUrl({ ...employee, avatarBase64Url: "blob:untrusted-avatar" }),
    ).toBeNull();
    expect(getEmployeeCanvasAvatarUrl(undefined)).toBeNull();
  });

  test("uses English defaults and filesystem-safe Unit names", () => {
    expect(createDefaultOrgEditorImageExportSettings().imageBossLabel).toBe("Manager");
    expect(ORG_EDITOR_EXPORT_GRADIENTS.map(({ label }) => label)).toEqual([
      "Air",
      "Mint",
      "Rose",
      "Amber",
      "Lavender",
      "Graphite",
      "Aurora",
    ]);
    expect(createOrgEditorExportFileBaseName(unit)).toBe("Research-Development-Lab");
  });

  test("localizes every dated tag and expands PNG rows with the shared packing model", () => {
    const taggedEmployee = {
      ...employee,
      tags: [
        { date: null, label: "Alpha" },
        { date: "2026-09-01", label: "Last day" },
        { date: null, label: "Remote" },
        { date: null, label: "Mentor" },
      ],
    };
    const english = getOrgEditorExportEmployeeTagLabels(taggedEmployee, "en");
    const russian = getOrgEditorExportEmployeeTagLabels(taggedEmployee, "ru");
    expect(english).toHaveLength(4);
    expect(english).toContain("Last day · Sep 1, 2026");
    expect(russian).not.toEqual(english);
    expect(getOrgEditorExportEmployeeRowHeight(taggedEmployee, "en", 90)).toBeGreaterThan(48);
  });
});
