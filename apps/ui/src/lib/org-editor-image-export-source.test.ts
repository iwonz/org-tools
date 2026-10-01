import type {
  AuthorizedOrganizationProjection,
  CustomEmployeeFieldDefinition,
} from "@org-tools/types";
import { describe, expect, it } from "vitest";
import { createEmptyEmployeeLiveFilterRule } from "@/lib/live-unit-filter";
import { createOrgEditorUnitFromScratch } from "@/lib/org-editor";
import { createOrgEditorTextElement } from "@/lib/org-editor-canvas";
import { createOrgEditorImageExportSourceFromProjection } from "@/lib/org-editor-image-export-source";
import { createBlankOrgToolsState } from "@/lib/org-file";

const uuid = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
const employeeId = uuid(1);
const viewId = uuid(2);
const manualUnitId = uuid(3);
const liveUnitId = uuid(4);
const hiddenUnitId = uuid(5);
const tagId = uuid(6);
const templateFieldId = uuid(7);

const templateDefinition: CustomEmployeeFieldDefinition = {
  hash: "none",
  id: templateFieldId,
  key: "authorizedSummary",
  kind: "template",
  name: "Authorized summary",
  template: "",
};

const projection = (): AuthorizedOrganizationProjection => {
  const state = createBlankOrgToolsState();
  const view = state.organization.views[0];
  if (!view) throw new Error("System View is missing.");
  view.id = viewId;
  const canvasElement = { ...createOrgEditorTextElement({ x: 24, y: 48 }), id: uuid(8) };
  view.structure.canvasElements = [canvasElement];
  view.structure.units = [
    createOrgEditorUnitFromScratch({
      employeeIds: [employeeId],
      id: manualUnitId,
      name: "Manual",
      x: 0,
      y: 0,
    }),
    createOrgEditorUnitFromScratch({
      id: liveUnitId,
      liveFilter: {
        ...createEmptyEmployeeLiveFilterRule(),
        customFields: [
          {
            fieldId: templateFieldId,
            includeUnset: false,
            selectedValues: ["Authorized value"],
          },
        ],
      },
      name: "Live",
      x: 400,
      y: 0,
    }),
  ];
  return {
    employeeDisplayFormats: state.organization.employeeDisplayFormats,
    employeeDisplayLineGaps: state.organization.employeeDisplayLineGaps,
    employeeFieldDefinitions: [templateDefinition],
    employees: [
      {
        createdAt: "2026-10-01T00:00:00.000Z",
        customFieldValues: {},
        firstName: "Taylor",
        id: employeeId,
        lastName: "Example",
        resolvedTemplateValues: { [templateFieldId]: "Authorized value" },
        tags: [{ date: null, tagId }],
        updatedAt: "2026-10-01T00:00:00.000Z",
      },
    ],
    tags: [{ color: "#2563eb", id: tagId, label: "Visible" }],
    views: [view],
  };
};

describe("Editor image export source", () => {
  it("hydrates one isolated projection and resolves Live Units with context-local Template values", () => {
    const source = createOrgEditorImageExportSourceFromProjection({
      distributionEnabledUnitIds: new Set([manualUnitId, hiddenUnitId]),
      projection: projection(),
      viewId,
    });

    expect(source).not.toBeNull();
    expect(source?.viewId).toBe(viewId);
    expect(source?.employeeById.get(employeeId)).toMatchObject({
      firstName: "Taylor",
      fullName: "Taylor Example",
      tags: [{ label: "Visible" }],
    });
    expect(source?.resolvedTemplateValuesByEmployeeId?.get(employeeId)).toEqual({
      [templateFieldId]: "Authorized value",
    });
    expect(source?.units.find((unit) => unit.id === liveUnitId)?.employeeIds).toEqual([employeeId]);
    expect([...(source?.distributionEnabledUnitIds ?? [])]).toEqual([manualUnitId]);
    expect(source?.distributionUnitIdsByEmployeeId.get(employeeId)).toEqual([
      manualUnitId,
      liveUnitId,
    ]);
    expect(source?.tagOrder).toEqual([tagId]);
    expect(source?.canvasElements.map((element) => element.id)).toEqual([uuid(8)]);
  });

  it("returns no source for an inaccessible View", () => {
    expect(
      createOrgEditorImageExportSourceFromProjection({
        distributionEnabledUnitIds: new Set(),
        projection: projection(),
        viewId: uuid(999),
      }),
    ).toBeNull();
  });
});
