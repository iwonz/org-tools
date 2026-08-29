import type { OrgToolsState } from "@org-tools/types";
import { describe, expect, test } from "vitest";

import { createBlankOrgToolsState, parseOrgToolsState } from "@/lib/org-file";
import { createStructuredSave, STRUCTURED_SAVE_FILE_NAMES } from "@/lib/structured-save";

const uuid = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
const timestamp = "2026-08-03T12:00:00.000Z";

const buildState = (): OrgToolsState => {
  const state = createBlankOrgToolsState();
  const main = state.views[0];
  if (!main) throw new Error("Expected Main View.");
  const employeeId = uuid(1);
  const rootId = uuid(2);
  const liveId = uuid(3);
  state.employees = [
    {
      avatarBase64Url: null,
      birthday: "03-14",
      createdAt: timestamp,
      email: "avery.stone@example.test",
      firstName: "Avery",
      gender: "female",
      id: employeeId,
      lastName: "Stone",
      phone: null,
      profileUrl: null,
      tags: [{ date: "2026-04-01", label: "Remote" }],
      updatedAt: timestamp,
      username: "avery.stone",
    },
  ];
  main.state.units = [
    {
      bossEmployeeId: employeeId,
      collapsed: false,
      createdAt: timestamp,
      employeeIds: [employeeId],
      employeePositions: [{ employeeId, position: "Lead" }],
      id: rootId,
      liveFilter: null,
      name: "Product",
      order: 0,
      parentId: null,
      updatedAt: timestamp,
      x: 120,
      y: 80,
    },
    {
      bossEmployeeId: employeeId,
      collapsed: false,
      createdAt: timestamp,
      employeeIds: [],
      employeePositions: [{ employeeId, position: "Remote Lead" }],
      id: liveId,
      liveFilter: {
        birthday: null,
        includeWithoutTags: false,
        includeWithoutUnits: false,
        query: "",
        selectedPositions: [],
        selectedTags: ["Remote"],
        selectedUnitIds: [rootId],
      },
      name: "Remote leads",
      order: 1,
      parentId: null,
      updatedAt: timestamp,
      x: 500,
      y: 80,
    },
  ];
  return parseOrgToolsState(state);
};

describe("structured save", () => {
  test("uses stable public filenames", () => {
    expect(STRUCTURED_SAVE_FILE_NAMES).toEqual({
      employees: "org-tools-employees.json",
      teams: "org-tools-teams.json",
      teamsEmployees: "org-tools-teams-employees.json",
      workspace: "org-tools-state.json",
    });
  });

  test("serializes canonical Employees state", () => {
    const document = createStructuredSave(buildState(), "employees");
    expect(document).toMatchObject({ content: "employees", kind: "org-tools-state" });
    expect(document.employees).toHaveLength(1);
    expect(document.views).toHaveLength(1);
    expect(document.views[0]?.state.units).toEqual([]);
    expect(parseOrgToolsState(document)).toEqual(document);
  });

  test("serializes Teams without Employee-specific roles", () => {
    const document = createStructuredSave(buildState(), "teams");
    const units = document.views[0]?.state.units ?? [];
    expect(document.content).toBe("teams");
    expect(document.employees).toEqual([]);
    expect(units.map(({ name }) => name)).toEqual(["Product", "Remote leads"]);
    expect(units.every((unit) => unit.employeeIds.length === 0)).toBe(true);
    expect(units.every((unit) => unit.employeePositions.length === 0)).toBe(true);
    expect(units.every((unit) => unit.bossEmployeeId === null)).toBe(true);
    expect(units[1]?.liveFilter?.selectedTags).toEqual(["Remote"]);
    expect(parseOrgToolsState(document)).toEqual(document);
  });

  test("preserves complete Main semantics in combined state", () => {
    const source = buildState();
    const document = createStructuredSave(source, "teamsEmployees");
    expect(document.content).toBe("teamsEmployees");
    expect(document.employees).toEqual(source.employees);
    expect(document.views[0]?.state.units).toEqual(source.views[0]?.state.units);
    expect(document.ui).toEqual({
      activeTab: "orgEditor",
      expandedUnitIds: [],
      selectedUnitId: null,
      theme: "system",
    });
    expect(parseOrgToolsState(document)).toEqual(document);
  });

  test("preserves all Views and UI only for Full workspace", () => {
    const source = buildState();
    source.ui.theme = "dark";
    const document = createStructuredSave(source, "workspace");
    expect(document).toEqual({ ...source, content: "workspace" });
  });
});
