import type { OrgEditorUnit, OrgToolsState, WorkspaceEmployee } from "@org-tools/types";
import { describe, expect, test } from "vitest";
import { createDefaultOrgEditorState } from "@/lib/org-editor";
import { createBlankOrgToolsState, parseOrgToolsState } from "@/lib/org-file";
import {
  buildStateImportCandidate,
  getAvailableStateImportContents,
  planStateImport,
} from "@/lib/structured-import";
import { createStructuredSave } from "@/lib/structured-save";

const uuid = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
const timestamp = "2026-08-04T08:00:00.000Z";

const employee = (id: string, username = "avery"): WorkspaceEmployee => ({
  avatarBase64Url: null,
  birthday: null,
  createdAt: timestamp,
  email: `${username}@example.test`,
  firstName: "Avery",
  id,
  lastName: "Stone",
  phone: null,
  profileUrl: null,
  tags: [{ date: "2026-09-01", label: "Last day" }],
  updatedAt: timestamp,
  username,
});

const unit = (overrides: Partial<OrgEditorUnit> = {}): OrgEditorUnit => ({
  bossEmployeeId: null,
  collapsed: false,
  createdAt: timestamp,
  employeeIds: [],
  employeePositions: [],
  id: uuid(20),
  liveFilter: null,
  name: "Product",
  order: 0,
  parentId: null,
  updatedAt: timestamp,
  x: 120,
  y: 80,
  ...overrides,
});

const sourceState = (): OrgToolsState => {
  const state = createBlankOrgToolsState();
  const employeeId = uuid(10);
  const rootId = uuid(20);
  state.employees = [employee(employeeId)];
  const main = state.views[0];
  if (!main) throw new Error("Expected Main View.");
  main.state.units = [
    unit({
      bossEmployeeId: employeeId,
      employeeIds: [employeeId],
      employeePositions: [{ employeeId, position: "Lead" }],
      id: rootId,
    }),
    unit({
      bossEmployeeId: employeeId,
      employeePositions: [{ employeeId, position: "Remote Lead" }],
      id: uuid(21),
      liveFilter: {
        birthday: null,
        includeWithoutTags: false,
        includeWithoutUnits: false,
        query: "",
        selectedPositions: [],
        selectedTags: ["Last day"],
        selectedUnitIds: [rootId],
      },
      name: "Remote leads",
      order: 1,
      x: 480,
    }),
  ];
  return parseOrgToolsState(state);
};

describe("scoped state import", () => {
  test("offers only projections carried by source content", () => {
    expect(getAvailableStateImportContents("teams")).toEqual(["teams"]);
    expect(getAvailableStateImportContents("employees")).toEqual(["employees"]);
    expect(getAvailableStateImportContents("teamsEmployees")).toEqual([
      "teams",
      "employees",
      "teamsEmployees",
    ]);
    expect(getAvailableStateImportContents("workspace")).toEqual([
      "teams",
      "employees",
      "teamsEmployees",
      "workspace",
    ]);
  });

  test("plans combined content and preserves Live roles", () => {
    const source = createStructuredSave(sourceState(), "teamsEmployees");
    const plan = planStateImport(source, "teamsEmployees", []);
    expect(plan).toMatchObject({
      assignmentCount: 1,
      liveUnitCount: 1,
      manualUnitCount: 1,
      newEmployeeCount: 1,
      unitCount: 2,
    });
  });

  test("appends with UUID remapping, identity reuse, and translated relative layout", () => {
    const current = createBlankOrgToolsState();
    current.employees = [employee(uuid(1))];
    const currentMain = current.views[0];
    if (!currentMain) throw new Error("Expected Main View.");
    currentMain.state.units = [unit({ id: uuid(2), name: "Existing", x: 600 })];
    const customViewId = uuid(3);
    current.views.push({
      createdAt: timestamp,
      id: customViewId,
      kind: "custom",
      name: "Scenario",
      state: createDefaultOrgEditorState(),
      updatedAt: timestamp,
    });
    current.activeViewId = customViewId;
    current.ui.activeTab = "calendar";
    const source = createStructuredSave(sourceState(), "teamsEmployees");
    let nextId = 100;
    const result = buildStateImportCandidate(current, source, "teamsEmployees", "append", {
      createId: () => uuid(nextId++),
      now: timestamp,
    });
    const imported = result.views[0]?.state.units.slice(1) ?? [];
    expect(result.employees).toHaveLength(1);
    expect(imported).toHaveLength(2);
    expect((imported[1]?.x ?? 0) - (imported[0]?.x ?? 0)).toBe(360);
    expect(imported[0]?.bossEmployeeId).toBe(uuid(1));
    expect(imported[1]?.liveFilter?.selectedUnitIds).toEqual([imported[0]?.id]);
    expect(imported[1]?.bossEmployeeId).toBe(uuid(1));
    expect(result.views.map(({ id }) => id)).toContain(customViewId);
    expect(result.activeViewId).toBe(customViewId);
    expect(result.ui.activeTab).toBe("calendar");
    expect(parseOrgToolsState(result)).toEqual(result);
  });

  test("partial replace wipes current data and custom Views", () => {
    const current = sourceState();
    current.employees.push(employee(uuid(30), "jordan"));
    current.views.push({
      ...structuredClone(current.views[0] as NonNullable<(typeof current.views)[0]>),
      id: uuid(31),
      kind: "custom",
      name: "Scenario",
    });
    const source = createStructuredSave(sourceState(), "employees");
    const result = buildStateImportCandidate(current, source, "employees", "replace");
    expect(result.content).toBe("workspace");
    expect(result.employees).toEqual(source.employees);
    expect(result.views).toHaveLength(1);
    expect(result.views[0]?.state.units).toEqual([]);
  });

  test("Full workspace is replacement-only and unsupported projections are atomic", () => {
    const current = createBlankOrgToolsState();
    const source = sourceState();
    expect(buildStateImportCandidate(current, source, "workspace", "replace")).toEqual(source);
    const before = structuredClone(current);
    expect(() =>
      buildStateImportCandidate(
        current,
        createStructuredSave(source, "teams"),
        "employees",
        "append",
      ),
    ).toThrow();
    expect(current).toEqual(before);
  });
});
