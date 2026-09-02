import type {
  EmployeeLiveFilterRule,
  OrganizationEmployee,
  OrgEditorState,
  OrgEditorUnit,
} from "@org-tools/types";
import { describe, expect, test } from "vitest";

import { buildAnalytics } from "@/lib/analytics";
import {
  buildOrganizationStructure,
  buildOrganizationStructureWithResolution,
} from "@/lib/build-organization-structure";
import {
  createEmptyEmployeeLiveFilterRule,
  getLiveUnitTopologicalOrder,
  validateEmployeeLiveFilterRule,
} from "@/lib/live-unit-filter";
import { createDefaultOrgEditorState, createOrgEditorUnitFromScratch } from "@/lib/org-editor";

const timestamp = "2026-07-31T00:00:00.000Z";
const uuid = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
const ALEX_ID = uuid(1);
const BLAIR_ID = uuid(2);
const CASEY_ID = uuid(3);
const MANUAL_ID = uuid(101);
const LIVE_ID = uuid(102);

const createEmployee = (
  id: string,
  fields: Partial<OrganizationEmployee>,
): OrganizationEmployee => ({
  avatarBase64Url: null,
  birthday: null,
  createdAt: timestamp,
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
  createEmployee(ALEX_ID, {
    birthday: "12.03.1900",
    email: "alex@example.test",
    firstName: "Alex",
    tags: [
      { date: "2026-03-12", label: "QA" },
      { date: null, label: "Critical" },
    ],
    username: "alex",
  }),
  createEmployee(BLAIR_ID, {
    firstName: "Blair",
    tags: [{ date: null, label: "QA" }],
    username: "blair",
  }),
  createEmployee(CASEY_ID, {
    firstName: "Casey",
    tags: [{ date: null, label: "Design" }],
    username: "casey",
  }),
];

const rule = (value: Partial<EmployeeLiveFilterRule>): EmployeeLiveFilterRule => ({
  ...createEmptyEmployeeLiveFilterRule(),
  ...value,
});

const unit = (id: string, value: Partial<OrgEditorUnit> = {}): OrgEditorUnit => ({
  ...createOrgEditorUnitFromScratch({ id, name: id, x: 0, y: 0 }),
  createdAt: timestamp,
  updatedAt: timestamp,
  ...value,
});

const state = (units: OrgEditorUnit[]): OrgEditorState => ({
  ...createDefaultOrgEditorState(),
  units,
});

describe("Live Unit resolver", () => {
  test("combines query, birthday, tags, positions, and Unit filters", () => {
    const structure = buildOrganizationStructure(
      employees,
      state([
        unit(MANUAL_ID, {
          employeeIds: [ALEX_ID, BLAIR_ID],
          employeePositions: [
            { employeeId: ALEX_ID, position: "QA" },
            { employeeId: BLAIR_ID, position: "Developer" },
          ],
        }),
        unit(LIVE_ID, {
          liveFilter: rule({
            birthday: { day: 12, month: 3 },
            query: "alex qa",
            selectedPositions: ["QA"],
            selectedTags: ["QA"],
            selectedUnitIds: [MANUAL_ID],
          }),
        }),
      ]),
    );

    expect(structure.indexes.unitsById.get(LIVE_ID)?.directEmployeeIds).toEqual([ALEX_ID]);
    expect(
      structure.indexes.birthdayEmployeesByKey.get("03-12")?.map((employee) => employee.id),
    ).toEqual([ALEX_ID]);
  });

  test("derives positions from manual Units and applies sparse overrides", () => {
    const defaultLiveId = uuid(103);
    const overriddenLiveId = uuid(104);
    const structure = buildOrganizationStructure(
      employees,
      state([
        unit(MANUAL_ID, {
          employeeIds: [ALEX_ID, BLAIR_ID],
          employeePositions: [
            { employeeId: ALEX_ID, position: "QA" },
            { employeeId: BLAIR_ID, position: "Developer" },
          ],
        }),
        unit(defaultLiveId, { liveFilter: rule({ selectedTags: ["QA"] }) }),
        unit(overriddenLiveId, {
          employeePositions: [
            { employeeId: ALEX_ID, position: "QA Lead" },
            { employeeId: BLAIR_ID, position: null },
          ],
          liveFilter: rule({ selectedTags: ["QA"] }),
        }),
      ]),
    );
    const position = (employeeId: string, unitId: string) =>
      structure.indexes.employeesById
        .get(employeeId)
        ?.unitPositions.find((unitPosition) => unitPosition.unitId === unitId)?.position;

    expect(position(ALEX_ID, defaultLiveId)).toBe("QA");
    expect(position(BLAIR_ID, defaultLiveId)).toBe("Developer");
    expect(position(ALEX_ID, overriddenLiveId)).toBe("QA Lead");
    expect(position(BLAIR_ID, overriddenLiveId)).toBeNull();
    expect(buildAnalytics(structure.allEmployees).positionCounts).toEqual(
      expect.arrayContaining([expect.objectContaining({ count: 1, label: "QA Lead" })]),
    );
  });

  test("treats Without Unit as absence from manual Units while Live dependencies resolve in order", () => {
    const qaLiveId = uuid(105);
    const withoutManualId = uuid(106);
    const downstreamId = uuid(107);
    const editorState = state([
      unit(MANUAL_ID, { employeeIds: [ALEX_ID] }),
      unit(qaLiveId, { liveFilter: rule({ selectedTags: ["QA"] }) }),
      unit(withoutManualId, { liveFilter: rule({ includeWithoutUnits: true }) }),
      unit(downstreamId, { liveFilter: rule({ selectedUnitIds: [qaLiveId] }) }),
    ]);
    const result = buildOrganizationStructureWithResolution(employees, editorState);

    expect(getLiveUnitTopologicalOrder(editorState.units).map((current) => current.id)).toEqual([
      qaLiveId,
      withoutManualId,
      downstreamId,
    ]);
    expect(result.liveEmployeeIdsByUnitId.get(qaLiveId)).toEqual([ALEX_ID, BLAIR_ID]);
    expect(result.liveEmployeeIdsByUnitId.get(withoutManualId)).toEqual([BLAIR_ID, CASEY_ID]);
    expect(result.liveEmployeeIdsByUnitId.get(downstreamId)).toEqual([ALEX_ID, BLAIR_ID]);
  });

  test("rejects empty rules, self references, and indirect cycles", () => {
    const units = [
      unit(MANUAL_ID, { liveFilter: rule({ selectedUnitIds: [LIVE_ID] }) }),
      unit(LIVE_ID, { liveFilter: rule({ selectedTags: ["QA"] }) }),
    ];

    expect(() =>
      validateEmployeeLiveFilterRule({
        rule: createEmptyEmployeeLiveFilterRule(),
        unitId: MANUAL_ID,
        units,
      }),
    ).toThrow("at least one filter");
    expect(() =>
      validateEmployeeLiveFilterRule({
        rule: rule({ selectedUnitIds: [MANUAL_ID] }),
        unitId: MANUAL_ID,
        units,
      }),
    ).toThrow("cannot reference itself");
    expect(() =>
      validateEmployeeLiveFilterRule({
        rule: rule({ selectedUnitIds: [MANUAL_ID] }),
        unitId: LIVE_ID,
        units,
      }),
    ).toThrow("cyclic dependency");
  });
});
