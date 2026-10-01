import type {
  AuthorizedOrganizationProjection,
  CustomEmployeeFieldDefinition,
  Employee,
  EmployeeId,
  EmployeeTagDefinition,
  OrgEditorCanvasElement,
  OrgEditorLayoutMode,
  OrgEditorUnit,
  OrgEditorUnitId,
  OrgEditorViewSettings,
  TagId,
  ViewId,
} from "@org-tools/types";

import {
  createAuthorizedTemplateValuesByEmployeeId,
  hydrateAuthorizedEmployee,
} from "@/lib/authorized-projection-client";
import { buildOrganizationStructureWithResolution } from "@/lib/build-organization-structure";
import type { AuthorizedTemplateValuesByEmployeeId } from "@/lib/custom-employee-fields";
import { buildEditorEmployeeUnitIndex } from "@/lib/editor-distribution";
import type { OrgEditorSourceIndex } from "@/lib/org-editor";

export type OrgEditorImageExportSource = {
  canvasElements: readonly OrgEditorCanvasElement[];
  customEmployeeFieldDefinitions: readonly CustomEmployeeFieldDefinition[];
  distributionEnabledUnitIds: ReadonlySet<OrgEditorUnitId>;
  distributionUnitIdsByEmployeeId: ReadonlyMap<EmployeeId, readonly OrgEditorUnitId[]>;
  employeeById: ReadonlyMap<EmployeeId, Employee>;
  layoutMode: OrgEditorLayoutMode;
  resolvedTemplateValuesByEmployeeId?: AuthorizedTemplateValuesByEmployeeId;
  sourceIndex: OrgEditorSourceIndex;
  tagDefinitions: readonly EmployeeTagDefinition[];
  tagOrder: readonly TagId[];
  units: OrgEditorUnit[];
  viewId: ViewId;
  viewSettings: OrgEditorViewSettings;
};

export const createOrgEditorImageExportSourceFromProjection = ({
  distributionEnabledUnitIds,
  projection,
  viewId,
}: {
  distributionEnabledUnitIds: ReadonlySet<OrgEditorUnitId>;
  projection: AuthorizedOrganizationProjection;
  viewId: ViewId;
}): OrgEditorImageExportSource | null => {
  const view = projection.views.find((candidate) => candidate.id === viewId);
  if (!view) return null;
  const employees = projection.employees.map(hydrateAuthorizedEmployee);
  const resolvedTemplateValuesByEmployeeId = createAuthorizedTemplateValuesByEmployeeId(
    projection.employees,
  );
  const result = buildOrganizationStructureWithResolution(
    employees,
    {
      ...view.structure,
      distributionModeUnitIds: [],
      selectedItems: [],
      viewport: { scale: 1, x: 0, y: 0 },
    },
    projection.tags,
    projection.employeeFieldDefinitions,
    resolvedTemplateValuesByEmployeeId,
  );
  const units = view.structure.units.map((unit) =>
    unit.liveFilter === null
      ? unit
      : {
          ...unit,
          employeeIds: result.liveEmployeeIdsByUnitId.get(unit.id) ?? [],
        },
  );
  const employeeById = result.structure.indexes.employeesById;
  const visibleUnitIds = new Set(units.map((unit) => unit.id));
  const selectedDistributionUnitIds = new Set(
    [...distributionEnabledUnitIds].filter((unitId) => visibleUnitIds.has(unitId)),
  );
  return {
    canvasElements: view.structure.canvasElements,
    customEmployeeFieldDefinitions: projection.employeeFieldDefinitions,
    distributionEnabledUnitIds: selectedDistributionUnitIds,
    distributionUnitIdsByEmployeeId: buildEditorEmployeeUnitIndex(units),
    employeeById,
    layoutMode: view.structure.layoutMode,
    resolvedTemplateValuesByEmployeeId,
    sourceIndex: { employeesById: employeeById },
    tagDefinitions: projection.tags,
    tagOrder: projection.tags.map((tag) => tag.id),
    units,
    viewId,
    viewSettings: view.structure.settings,
  };
};
