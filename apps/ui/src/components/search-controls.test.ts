import type { OrganizationEmployee, OrgEditorState } from "@org-tools/types";
import { describe, expect, test } from "vitest";

import { buildOrganizationStructure } from "@/lib/build-organization-structure";
import {
  createEmptyEmployeeSearchFilters,
  filterEmployeesBySearch,
  getEmployeesForSearch,
  pruneEmployeeSearchFilters,
} from "@/lib/employee-search";
import { buildEmployeeUnitMembershipIndex } from "@/lib/employee-unit-contexts";
import { createDefaultOrgEditorState, createOrgEditorUnitFromScratch } from "@/lib/org-editor";

const uuid = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
const ROOT_ID = uuid(100);
const FIRST_TEAM_ID = uuid(101);
const SECOND_TEAM_ID = uuid(102);
const ALEX_ID = uuid(1);
const BLAIR_ID = uuid(2);
const CASEY_ID = uuid(3);
const DANA_ID = uuid(4);
const CRITICAL_TAG_ID = uuid(201);
const DEPARTMENT_FIELD_ID = uuid(301);
const timestamp = "2026-07-31T00:00:00.000Z";

const employee = (id: string, fields: Partial<OrganizationEmployee>): OrganizationEmployee => ({
  avatarBase64Url: null,
  birthday: null,
  createdAt: timestamp,
  customFieldValues: {},
  email: null,
  firstName: "Employee",
  id,
  lastName: "Example",
  phone: null,
  profileUrl: null,
  tags: [],
  updatedAt: timestamp,
  username: null,
  ...fields,
  gender: fields.gender ?? "unspecified",
});

const employees: OrganizationEmployee[] = [
  employee(ALEX_ID, {
    birthday: "12.03.1900",
    email: "alex@example.test",
    firstName: "Alex",
    gender: "female",
    customFieldValues: { [DEPARTMENT_FIELD_ID]: "Engineering" },
    tags: [{ date: null, tagId: CRITICAL_TAG_ID }],
    username: "alex",
  }),
  employee(BLAIR_ID, {
    birthday: "18.04.1990",
    email: "blair@example.test",
    firstName: "Blair",
    gender: "male",
    customFieldValues: { [DEPARTMENT_FIELD_ID]: "Operations" },
    username: "blair",
  }),
  employee(CASEY_ID, { firstName: "Casey", gender: "unspecified", username: "casey" }),
  employee(DANA_ID, {
    email: "dana@example.test",
    firstName: "Dana",
    username: "dana",
  }),
];

const editorState: OrgEditorState = {
  ...createDefaultOrgEditorState(),
  units: [
    createOrgEditorUnitFromScratch({
      bossEmployeeId: CASEY_ID,
      employeeIds: [CASEY_ID],
      employeePositions: [{ employeeId: CASEY_ID, position: "Boss" }],
      id: ROOT_ID,
      name: "Root",
      x: 0,
      y: 0,
    }),
    createOrgEditorUnitFromScratch({
      employeeIds: [ALEX_ID],
      employeePositions: [{ employeeId: ALEX_ID, position: "QA" }],
      id: FIRST_TEAM_ID,
      name: "Team",
      parentId: ROOT_ID,
      x: 0,
      y: 200,
    }),
    createOrgEditorUnitFromScratch({
      employeeIds: [BLAIR_ID],
      employeePositions: [{ employeeId: BLAIR_ID, position: "QA" }],
      id: SECOND_TEAM_ID,
      name: "Team",
      parentId: ROOT_ID,
      x: 360,
      y: 200,
    }),
  ],
};

const structure = buildOrganizationStructure(
  employees,
  editorState,
  [{ color: null, id: CRITICAL_TAG_ID, label: "Critical" }],
  [
    {
      id: DEPARTMENT_FIELD_ID,
      key: "department",
      kind: "value",
      name: "Department",
      options: [],
      required: false,
      valueType: "text",
    },
  ],
);
const membershipIndex = buildEmployeeUnitMembershipIndex(
  structure.allEmployees,
  structure.indexes.unitsById,
);

const filter = (
  filters: ReturnType<typeof createEmptyEmployeeSearchFilters>,
  queryTokens: string[] = [],
) =>
  filterEmployeesBySearch({
    employeeSearchDocumentByEmployeeId: structure.indexes.employeeSearchDocumentByEmployeeId,
    employeeUnitMembershipsByEmployeeId: membershipIndex,
    employees: structure.indexes.employeesByName,
    filters,
    queryTokens,
  }).map((currentEmployee) => currentEmployee.id);

describe("Employee Unit filters", () => {
  test("returns the central sorted array without a full pass for an empty search", () => {
    const sortedEmployees = structure.indexes.employeesByName;
    const visibleEmployees = getEmployeesForSearch({
      employeeSearchDocumentByEmployeeId: structure.indexes.employeeSearchDocumentByEmployeeId,
      employeeUnitMembershipsByEmployeeId: membershipIndex,
      employees: sortedEmployees,
      filters: createEmptyEmployeeSearchFilters(),
      queryTokens: [],
    });

    expect(visibleEmployees).toBe(sortedEmployees);
  });

  test("uses exact Unit membership without descendants and ORs values inside the Unit group", () => {
    expect(filter({ ...createEmptyEmployeeSearchFilters(), selectedUnitIds: [ROOT_ID] })).toEqual([
      CASEY_ID,
    ]);
    expect(
      filter({
        ...createEmptyEmployeeSearchFilters(),
        selectedUnitIds: [FIRST_TEAM_ID, SECOND_TEAM_ID],
      }),
    ).toEqual([ALEX_ID, BLAIR_ID]);
  });

  test("ORs missing tags with selected tags", () => {
    expect(filter({ ...createEmptyEmployeeSearchFilters(), includeWithoutTags: true })).toEqual([
      BLAIR_ID,
      CASEY_ID,
      DANA_ID,
    ]);
    expect(
      filter({
        ...createEmptyEmployeeSearchFilters(),
        includeWithoutTags: true,
        selectedTags: [CRITICAL_TAG_ID],
      }),
    ).toEqual([ALEX_ID, BLAIR_ID, CASEY_ID, DANA_ID]);
  });

  test("ORs missing Units with selected exact Unit assignments", () => {
    expect(filter({ ...createEmptyEmployeeSearchFilters(), includeWithoutUnits: true })).toEqual([
      DANA_ID,
    ]);
    expect(
      filter({
        ...createEmptyEmployeeSearchFilters(),
        includeWithoutUnits: true,
        selectedUnitIds: [FIRST_TEAM_ID],
      }),
    ).toEqual([ALEX_ID, DANA_ID]);
  });

  test("counts a Live assignment as a Unit in ordinary search", () => {
    const membershipsWithLiveUnit = new Map(membershipIndex);
    membershipsWithLiveUnit.set(DANA_ID, {
      manualUnitIdSet: new Set(),
      unitIdSet: new Set([uuid(200)]),
    });

    const visibleIds = filterEmployeesBySearch({
      employeeSearchDocumentByEmployeeId: structure.indexes.employeeSearchDocumentByEmployeeId,
      employeeUnitMembershipsByEmployeeId: membershipsWithLiveUnit,
      employees: structure.indexes.employeesByName,
      filters: { ...createEmptyEmployeeSearchFilters(), includeWithoutUnits: true },
      queryTokens: [],
    }).map((currentEmployee) => currentEmployee.id);
    expect(visibleIds).toEqual([]);
  });

  test("combines filter groups and text through AND", () => {
    expect(
      filter(
        {
          birthday: { day: 12, month: 3, year: 1900 },
          customFields: [],
          includeWithoutTags: false,
          includeWithoutUnits: false,
          selectedGenders: ["female"],
          selectedPositions: ["QA"],
          selectedTags: [CRITICAL_TAG_ID],
          selectedUnitIds: [FIRST_TEAM_ID],
        },
        ["alex"],
      ),
    ).toEqual([ALEX_ID]);
    expect(
      filter({
        ...createEmptyEmployeeSearchFilters(),
        includeWithoutTags: true,
        includeWithoutUnits: true,
      }),
    ).toEqual([DANA_ID]);
  });

  test("matches exact gender values and ORs selections inside the group", () => {
    expect(filter({ ...createEmptyEmployeeSearchFilters(), selectedGenders: ["female"] })).toEqual([
      ALEX_ID,
    ]);
    expect(
      filter({
        ...createEmptyEmployeeSearchFilters(),
        selectedGenders: ["male", "unspecified"],
      }),
    ).toEqual([BLAIR_ID, CASEY_ID, DANA_ID]);
  });

  test("ORs custom values within a field and ANDs custom field sections", () => {
    expect(
      filter({
        ...createEmptyEmployeeSearchFilters(),
        customFields: [
          {
            fieldId: DEPARTMENT_FIELD_ID,
            includeUnset: false,
            selectedValues: ["Engineering", "Operations"],
          },
        ],
      }),
    ).toEqual([ALEX_ID, BLAIR_ID]);
    expect(
      filter({
        ...createEmptyEmployeeSearchFilters(),
        customFields: [{ fieldId: DEPARTMENT_FIELD_ID, includeUnset: true, selectedValues: [] }],
      }),
    ).toEqual([CASEY_ID, DANA_ID]);
  });

  test("prunes unavailable Unit IDs without changing other filters", () => {
    const filters = pruneEmployeeSearchFilters(
      {
        ...createEmptyEmployeeSearchFilters(),
        includeWithoutUnits: true,
        selectedTags: ["Critical"],
        selectedUnitIds: [FIRST_TEAM_ID, uuid(999)],
      },
      new Set([ROOT_ID, FIRST_TEAM_ID, SECOND_TEAM_ID]),
    );

    expect(filters).toMatchObject({
      includeWithoutUnits: true,
      selectedTags: ["Critical"],
      selectedUnitIds: [FIRST_TEAM_ID],
    });
  });
});
