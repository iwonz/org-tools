import type { EditableEmployeeFields, OrgToolsState } from "@org-tools/types";
import { describe, expect, test } from "vitest";

import { isUuid } from "@/lib/employee-data";
import { createEmptyEmployeeLiveFilterRule } from "@/lib/live-unit-filter";
import { createBlankOrgToolsState, parseOrgFileJson, parseOrgToolsState } from "@/lib/org-file";
import type { OrgEditorUnitConfiguration } from "@/stores/org-editor-store";
import { OrgStore } from "@/stores/org-store";

const uuid = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;

const employeeFields = (
  overrides: Partial<EditableEmployeeFields> = {},
): EditableEmployeeFields => ({
  avatarBase64Url: null,
  birthday: null,
  email: "alex@example.test",
  firstName: "Alex",
  lastName: "Morgan",
  phone: null,
  profileUrl: null,
  tags: [{ date: null, label: "Platform" }],
  username: "alex",
  ...overrides,
  gender: overrides.gender ?? "unspecified",
});

const manualUnit = (name: string): OrgEditorUnitConfiguration => ({
  assignments: [],
  bossEmployeeId: null,
  membershipMode: "manual",
  name,
});

const populatedStore = () => {
  const store = new OrgStore();
  const unitId = store.createUnit(manualUnit("Platform"));
  const employeeId = store.createEmployee(employeeFields(), [
    { isBoss: true, position: "Lead", unitId },
  ]);
  return { employeeId, store, unitId };
};

describe("OrgToolsState", () => {
  test("starts directly in an editable blank workspace", () => {
    const store = new OrgStore();

    expect(store.activeTab).toBe("orgEditor");
    expect(store.units?.roots).toEqual([]);
    expect(store.units?.allEmployees).toEqual([]);
    expect(store.activeOrgView?.kind).toBe("main");
    expect(isUuid(store.activeOrgViewId)).toBe(true);
  });

  test("round-trips generic Employee fields, assignments, Views, and UI state", () => {
    const { employeeId, store, unitId } = populatedStore();
    store.updateEmployee(
      employeeId,
      employeeFields({
        avatarBase64Url: "data:image/png;base64,iVBORw==",
        birthday: "02-29",
        gender: "female",
        phone: "+1 555-0101",
        profileUrl: "https://example.test/profiles/alex",
        tags: [
          { date: "2026-02-28", label: " Platform " },
          { date: "2026-02-28", label: "platform" },
          { date: null, label: "On call" },
        ],
      }),
      [{ isBoss: true, position: "Engineering Lead", unitId }],
    );
    const customViewId = store.createOrgView("Scenario", "main");
    store.setTheme("dark");
    store.setActiveTab("calendar");

    const state = store.createOrgToolsState();
    const parsedFile = parseOrgFileJson(JSON.parse(JSON.stringify(state)));
    const restored = new OrgStore();
    restored.loadOrgToolsState(parsedFile.state, "org-tools-state.json", null);

    expect(state).toMatchObject({ content: "workspace", kind: "org-tools-state" });
    expect(state).not.toHaveProperty("formatVersion");
    expect(state).not.toHaveProperty("schemaVersion");
    expect(restored.activeOrgViewId).toBe(customViewId);
    expect(restored.theme).toBe("dark");
    expect(restored.activeTab).toBe("calendar");
    expect(restored.workspaceEmployees[0]).toMatchObject({
      avatarBase64Url: "data:image/png;base64,iVBORw==",
      birthday: "02-29",
      gender: "female",
      profileUrl: "https://example.test/profiles/alex",
      tags: [
        { date: "2026-02-28", label: "Platform" },
        { date: null, label: "On call" },
      ],
    });
    expect(
      restored.uiOrgStructure?.indexes.employeesById.get(employeeId)?.unitPositions[0],
    ).toMatchObject({ isBoss: true, position: "Engineering Lead", unitId });
    expect(restored.createOrgToolsState()).toEqual(state);
  });

  test("rejects obsolete version fields and string-tag state without migration", () => {
    const { store } = populatedStore();
    const legacy = structuredClone(store.createOrgToolsState()) as unknown as Record<
      string,
      unknown
    >;
    legacy.formatVersion = 1;
    const employees = legacy.employees as Array<Record<string, unknown>>;
    if (!employees[0]) throw new Error("Expected a test Employee.");
    employees[0].tags = ["Platform", "Remote"];
    const views = legacy.views as Array<{
      state: { employeeOverrides: unknown[]; employees: unknown[] };
    }>;
    for (const view of views) {
      view.state.employeeOverrides = [];
      view.state.employees = [];
    }

    expect(() => parseOrgToolsState(legacy)).toThrow("top-level structure");

    delete legacy.formatVersion;
    expect(() => parseOrgToolsState(legacy)).toThrow("invalid Employee");
  });

  test("uses UUIDs for every Employee, Unit, and View", () => {
    const { employeeId, store, unitId } = populatedStore();
    const customViewId = store.createOrgView("Alternative", "main");
    const state = store.createOrgToolsState();

    expect(
      [employeeId, unitId, customViewId, ...state.views.map((view) => view.id)].every(isUuid),
    ).toBe(true);
    expect(
      state.views.flatMap((view) => view.state.units.map((unit) => unit.id)).every(isUuid),
    ).toBe(true);
  });

  test("rejects legacy, unknown, numeric, unsafe, and malformed Employee shapes", () => {
    expect(() => parseOrgToolsState({ kind: "org-structure-ui-state" })).toThrow(
      "Unsupported workspace kind",
    );
    expect(() => parseOrgToolsState({ ...createBlankOrgToolsState(), formatVersion: 4 })).toThrow(
      "top-level structure",
    );
    expect(() => parseOrgToolsState({ ...createBlankOrgToolsState(), schemaVersion: 4 })).toThrow(
      "top-level structure",
    );

    const { store } = populatedStore();
    const state = JSON.parse(JSON.stringify(store.createOrgToolsState())) as OrgToolsState & {
      unexpected?: boolean;
    };
    state.unexpected = true;
    expect(() => parseOrgToolsState(state)).toThrow("top-level structure");

    const unsafeProfile = JSON.parse(JSON.stringify(store.createOrgToolsState())) as OrgToolsState;
    const employee = unsafeProfile.employees[0];
    if (!employee) throw new Error("Expected a test Employee.");
    employee.profileUrl = "javascript:alert(1)";
    expect(() => parseOrgToolsState(unsafeProfile)).toThrow("invalid Employee");

    const badBirthday = JSON.parse(JSON.stringify(store.createOrgToolsState())) as OrgToolsState;
    const birthdayEmployee = badBirthday.employees[0];
    if (!birthdayEmployee) throw new Error("Expected a test Employee.");
    birthdayEmployee.birthday = "31.12.2000";
    expect(() => parseOrgToolsState(badBirthday)).toThrow("invalid Employee");

    const missingGender = JSON.parse(JSON.stringify(store.createOrgToolsState())) as {
      employees: Array<Record<string, unknown>>;
    };
    const employeeWithoutGender = missingGender.employees[0];
    if (!employeeWithoutGender) throw new Error("Expected a test Employee.");
    delete employeeWithoutGender.gender;
    expect(() => parseOrgToolsState(missingGender)).toThrow("invalid Employee");

    const invalidGender = JSON.parse(JSON.stringify(store.createOrgToolsState())) as {
      employees: Array<Record<string, unknown>>;
    };
    const employeeWithInvalidGender = invalidGender.employees[0];
    if (!employeeWithInvalidGender) throw new Error("Expected a test Employee.");
    employeeWithInvalidGender.gender = "custom";
    expect(() => parseOrgToolsState(invalidGender)).toThrow("invalid Employee");

    const numericId = JSON.parse(JSON.stringify(store.createOrgToolsState())) as {
      employees: Array<{ id: unknown }>;
    };
    const numericEmployee = numericId.employees[0];
    if (!numericEmployee) throw new Error("Expected a test Employee.");
    numericEmployee.id = 1;
    expect(() => parseOrgToolsState(numericId)).toThrow("invalid Employee");

    const invalidTags = structuredClone(store.createOrgToolsState());
    const taggedEmployee = invalidTags.employees[0];
    if (!taggedEmployee) throw new Error("Expected a test Employee.");
    taggedEmployee.tags = [
      { date: "2026-02-30", label: "Exit" },
      { date: null, label: "exit" },
    ];
    expect(() => parseOrgToolsState(invalidTags)).toThrow("invalid Employee");
  });

  test("strict graph validation rejects missing references and leaves the active store unchanged", () => {
    const { store } = populatedStore();
    const before = store.createOrgToolsState();
    const invalid = JSON.parse(JSON.stringify(before)) as OrgToolsState;
    const main = invalid.views.find((view) => view.kind === "main");
    const unit = main?.state.units[0];
    if (!unit) throw new Error("Expected a test Unit.");
    unit.parentId = uuid(999);

    expect(() => store.loadOrgToolsState(invalid, "invalid.json", null)).toThrow(
      "missing parent Unit",
    );
    expect(store.createOrgToolsState()).toEqual(before);
  });

  test("validates Live Unit graph references and cycles", () => {
    const state = createBlankOrgToolsState();
    const main = state.views[0];
    if (!main) throw new Error("Expected Main View.");
    const now = "2026-07-31T00:00:00.000Z";
    const firstId = uuid(101);
    const secondId = uuid(102);
    const rule = (selectedUnitIds: string[]) => ({
      ...createEmptyEmployeeLiveFilterRule(),
      selectedUnitIds,
    });
    main.state.units = [
      {
        bossEmployeeId: null,
        collapsed: false,
        createdAt: now,
        employeeIds: [],
        employeePositions: [],
        id: firstId,
        liveFilter: rule([secondId]),
        name: "First",
        order: 0,
        parentId: null,
        updatedAt: now,
        x: 0,
        y: 0,
      },
      {
        bossEmployeeId: null,
        collapsed: false,
        createdAt: now,
        employeeIds: [],
        employeePositions: [],
        id: secondId,
        liveFilter: rule([firstId]),
        name: "Second",
        order: 1,
        parentId: null,
        updatedAt: now,
        x: 360,
        y: 0,
      },
    ];

    expect(() => parseOrgToolsState(state)).toThrow("cyclic dependency");
  });
});

describe("atomic Employee import", () => {
  test("adds normalized Employees without Unit assignments in one operation", () => {
    const store = new OrgStore();
    store.createUnit(manualUnit("Unrelated Unit"));

    const result = store.importEmployees([
      employeeFields({
        tags: [
          { date: null, label: " Platform " },
          { date: null, label: "platform" },
        ],
      }),
      employeeFields({ email: "sam@example.test", firstName: "Sam", username: "sam" }),
    ]);

    expect(result.newEmployeeCount).toBe(2);
    expect(store.workspaceEmployees.map((employee) => employee.tags)).toEqual([
      [{ date: null, label: "Platform" }],
      [{ date: null, label: "Platform" }],
    ]);
    expect(
      result.employeeIds.every(
        (employeeId) =>
          store.uiOrgStructure?.indexes.employeesById.get(employeeId)?.unitIds.length === 0,
      ),
    ).toBe(true);
  });

  test("rolls back the entire batch on invalid values or stale duplicate identities", () => {
    const store = new OrgStore();
    const before = store.createOrgToolsState();

    expect(() =>
      store.importEmployees([
        employeeFields(),
        employeeFields({ avatarBase64Url: "data:image/svg+xml;base64,PHN2Zy8+" }),
      ]),
    ).toThrow("Avatar");
    expect(store.createOrgToolsState()).toEqual(before);

    store.importEmployees([employeeFields()]);
    const afterFirstImport = store.createOrgToolsState();
    expect(() => store.importEmployees([employeeFields()])).toThrow("no longer unique");
    expect(store.createOrgToolsState()).toEqual(afterFirstImport);
  });
});
