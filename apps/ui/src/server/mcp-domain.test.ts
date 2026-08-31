import type { EditableEmployeeFields } from "@org-tools/types";
import { describe, expect, it } from "vitest";

import { createBlankOrgToolsState } from "@/lib/org-file";
import { previewDomainOperations, previewSelectiveUndo } from "@/server/mcp-domain";

const uuid = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;

const fields = (overrides: Partial<EditableEmployeeFields> = {}): EditableEmployeeFields => ({
  avatarBase64Url: null,
  birthday: null,
  email: "alex@example.test",
  firstName: "Alex",
  gender: "unspecified",
  lastName: "Morgan",
  phone: "+1 555-0101",
  profileUrl: "https://example.test/people/alex",
  tags: [{ date: null, label: "Platform" }],
  username: "alex",
  ...overrides,
});

const options = () => {
  let nextId = 100;
  return {
    idFactory: () => uuid(nextId++),
    now: () => "2026-08-31T12:00:00.000Z",
  };
};

describe("MCP organization operations", () => {
  it("resolves temporary references and builds an atomic Main-derived scenario", () => {
    const state = createBlankOrgToolsState();
    const mainViewId = state.organization.views[0]?.id;
    expect(mainViewId).toBeTruthy();

    const preview = previewDomainOperations(
      state,
      [
        { employee: fields(), ref: "employee.alex", type: "employee.create" },
        {
          ref: "unit.platform",
          type: "unit.create",
          unit: {
            bossEmployeeId: "employee.alex",
            employeeIds: ["employee.alex"],
            employeePositions: [{ employeeId: "employee.alex", position: "Lead" }],
            name: "Platform",
            x: 31,
            y: 47,
          },
          viewId: mainViewId,
        },
        {
          name: "Platform proposal",
          ref: "view.proposal",
          sourceViewId: mainViewId,
          type: "view.create",
        },
      ],
      options(),
    );

    expect(preview.state.organization.employees).toHaveLength(1);
    expect(preview.resolvedRefs).toMatchObject({
      "employee.alex": uuid(100),
      "unit.platform": uuid(101),
      "view.proposal": uuid(102),
    });
    const mainUnit = preview.state.organization.views[0]?.document.units[0];
    expect(mainUnit).toMatchObject({
      bossEmployeeId: uuid(100),
      employeeIds: [uuid(100)],
      id: uuid(101),
      name: "Platform",
      x: 24,
      y: 48,
    });
    const proposal = preview.state.organization.views.find((view) => view.id === uuid(102));
    expect(proposal).toMatchObject({ kind: "custom", name: "Platform proposal" });
    expect(proposal?.document.units[0]?.id).toBe(uuid(103));
    expect(preview.summary.created).toBeGreaterThanOrEqual(4);
    expect(preview.affectedIds).toContain(uuid(100));
  });

  it("selectively undoes independent fields and blocks overlapping changes", () => {
    const initial = createBlankOrgToolsState();
    const created = previewDomainOperations(
      initial,
      [{ employee: fields(), ref: "employee.alex", type: "employee.create" }],
      options(),
    ).state;
    const employeeId = created.organization.employees[0]?.id;
    expect(employeeId).toBeTruthy();
    const update = previewDomainOperations(
      created,
      [{ employeeId, patch: { firstName: "Avery" }, type: "employee.update" }],
      options(),
    );

    const independent = structuredClone(update.state);
    if (!independent.organization.employees[0]) throw new Error("Missing test Employee.");
    independent.organization.employees[0].lastName = "Taylor";
    const undone = previewSelectiveUndo(independent, update.diff);
    expect(undone.state.organization.employees[0]).toMatchObject({
      firstName: "Alex",
      lastName: "Taylor",
    });

    const overlapping = structuredClone(update.state);
    if (!overlapping.organization.employees[0]) throw new Error("Missing test Employee.");
    overlapping.organization.employees[0].firstName = "Jordan";
    expect(() => previewSelectiveUndo(overlapping, update.diff)).toThrowError(
      expect.objectContaining({ code: "undo_conflict" }),
    );
  });

  it("rejects invalid references without changing the input state", () => {
    const state = createBlankOrgToolsState();
    const before = structuredClone(state);
    expect(() =>
      previewDomainOperations(state, [
        {
          employeeId: "employee.missing",
          patch: { firstName: "No change" },
          type: "employee.update",
        },
      ]),
    ).toThrowError(expect.objectContaining({ code: "invalid_operation" }));
    expect(state).toEqual(before);
  });

  it("covers Employee, Unit, assignment, View, local Employee, override, and structure CRUD", () => {
    const initial = createBlankOrgToolsState();
    const mainViewId = initial.organization.views[0]?.id;
    if (!mainViewId) throw new Error("Missing Main View.");
    let nextId = 200;
    const domainOptions = {
      idFactory: () => uuid(nextId++),
      now: () => "2026-08-31T12:30:00.000Z",
    };
    const created = previewDomainOperations(
      initial,
      [
        { employee: fields(), ref: "employee.global", type: "employee.create" },
        {
          name: "Scenario",
          ref: "view.scenario",
          sourceViewId: mainViewId,
          type: "view.create",
        },
      ],
      domainOptions,
    );
    const employeeId = created.resolvedRefs["employee.global"];
    const viewId = created.resolvedRefs["view.scenario"];
    if (!employeeId || !viewId) throw new Error("Missing resolved test references.");

    const expanded = previewDomainOperations(
      created.state,
      [
        { name: "Scenario 2027", type: "view.rename", viewId },
        {
          employee: fields({ email: "local@example.test", firstName: "Local", username: "local" }),
          ref: "employee.local",
          type: "viewEmployee.create",
          viewId,
        },
        {
          employeeId,
          fields: fields({ firstName: "Scenario Alex" }),
          type: "viewOverride.upsert",
          viewId,
        },
        {
          ref: "unit.root",
          type: "unit.create",
          unit: { name: "Scenario root" },
          viewId,
        },
        {
          ref: "unit.child",
          type: "unit.create",
          unit: { name: "Scenario child", parentId: "unit.root" },
          viewId,
        },
        {
          employeeId,
          isBoss: true,
          position: "Lead",
          type: "unit.assignEmployee",
          unitId: "unit.root",
          viewId,
        },
        {
          employeeId: "employee.local",
          position: "Designer",
          type: "unit.assignEmployee",
          unitId: "unit.child",
          viewId,
        },
        { layoutMode: "leftRight", type: "view.arrange", viewId },
      ],
      domainOptions,
    );
    const localEmployeeId = expanded.resolvedRefs["employee.local"];
    const rootUnitId = expanded.resolvedRefs["unit.root"];
    const childUnitId = expanded.resolvedRefs["unit.child"];
    if (!localEmployeeId || !rootUnitId || !childUnitId) {
      throw new Error("Missing expanded test references.");
    }
    const scenario = expanded.state.organization.views.find((view) => view.id === viewId);
    expect(scenario).toMatchObject({ name: "Scenario 2027" });
    expect(scenario?.document.employeeOverrides[0]).toMatchObject({
      employeeId,
      firstName: "Scenario Alex",
    });
    expect(scenario?.document.units.find((unit) => unit.id === rootUnitId)).toMatchObject({
      bossEmployeeId: employeeId,
      employeeIds: [employeeId],
      employeePositions: [{ employeeId, position: "Lead" }],
    });

    const updated = previewDomainOperations(
      expanded.state,
      [
        {
          employeeId,
          patch: { lastName: "Taylor" },
          type: "employee.update",
        },
        {
          employeeId: localEmployeeId,
          patch: { firstName: "Updated local" },
          type: "viewEmployee.update",
          viewId,
        },
        { employeeId, type: "viewOverride.delete", viewId },
        {
          employeeId,
          type: "unit.unassignEmployee",
          unitId: rootUnitId,
          viewId,
        },
        {
          patch: {
            liveFilter: {
              birthday: null,
              includeWithoutTags: false,
              includeWithoutUnits: false,
              query: "",
              selectedPositions: [],
              selectedTags: ["Operations"],
              selectedUnitIds: [],
            },
            name: "Live scenario child",
            x: 77,
          },
          type: "unit.update",
          unitId: childUnitId,
          viewId,
        },
      ],
      domainOptions,
    );
    expect(updated.state.organization.employees[0]?.lastName).toBe("Taylor");
    const updatedScenario = updated.state.organization.views.find((view) => view.id === viewId);
    expect(updatedScenario?.document.employeeOverrides).toEqual([]);
    expect(updatedScenario?.document.employees[0]?.firstName).toBe("Updated local");
    expect(updatedScenario?.document.units.find((unit) => unit.id === childUnitId)).toMatchObject({
      employeeIds: [],
      name: "Live scenario child",
      x: 72,
    });

    const localRemoved = previewDomainOperations(
      updated.state,
      [{ employeeId: localEmployeeId, type: "viewEmployee.delete", viewId }],
      domainOptions,
    );
    expect(
      localRemoved.state.organization.views.find((view) => view.id === viewId)?.document.employees,
    ).toEqual([]);

    const replaced = previewDomainOperations(
      localRemoved.state,
      [
        {
          document: {
            employeeOverrides: [],
            employees: [],
            layoutMode: "topDown",
            units: [
              {
                bossEmployeeId: null,
                collapsed: false,
                createdAt: "2026-08-31T12:30:00.000Z",
                employeeIds: [],
                employeePositions: [],
                id: uuid(900),
                liveFilter: null,
                name: "Replacement",
                order: 0,
                parentId: null,
                updatedAt: "2026-08-31T12:30:00.000Z",
                x: 25,
                y: 49,
              },
            ],
          },
          type: "view.replaceStructure",
          viewId,
        },
      ],
      domainOptions,
    );
    expect(
      replaced.state.organization.views.find((view) => view.id === viewId)?.document.units[0],
    ).toMatchObject({ id: uuid(900), x: 24, y: 48 });

    const removed = previewDomainOperations(
      replaced.state,
      [
        { employeeId, type: "employee.delete" },
        { type: "unit.delete", unitId: uuid(900), viewId },
        { type: "view.delete", viewId },
      ],
      domainOptions,
    );
    expect(removed.state.organization.employees).toEqual([]);
    expect(removed.state.organization.views).toHaveLength(1);
    expect(removed.state.organization.views[0]?.kind).toBe("main");
  });
});
