import type { EmployeeId, OrgToolsDownloadState, UnitId } from "@org-tools/types";
import { makeAutoObservable, observable } from "mobx";

export type ExportTabMode = "json" | "template";
export type ExportRowMode = "allUnits" | "firstUnit";
export type ExportEmployeeFieldKey =
  | "id"
  | "firstName"
  | "lastName"
  | "fullName"
  | "gender"
  | "username"
  | "profileUrl"
  | "email"
  | "phone"
  | "avatarBase64Url"
  | "birthday"
  | "tags"
  | "tagDates";
export type ExportJsonEmployeeFieldKey = Exclude<ExportEmployeeFieldKey, "tagDates" | "tags">;
export type ExportUnitFieldKey = "unitId" | "unitName" | "unitFullPath" | "position" | "isBoss";
export type ExportJsonUnitFieldKey = ExportUnitFieldKey;
export type ExportJsonTagFieldKey = "date" | "label";
export type ExportFieldKey = ExportEmployeeFieldKey | ExportUnitFieldKey;
export type ExportFieldDropPlacement = "after" | "before";
export type ExportJsonFieldNames = {
  employee: Record<ExportJsonEmployeeFieldKey, string>;
  tags: {
    collection: string;
    fields: Record<ExportJsonTagFieldKey, string>;
  };
  units: {
    collection: string;
    fields: Record<ExportJsonUnitFieldKey, string>;
  };
};
export type ExportJsonSettingsState = Pick<
  OrgToolsDownloadState,
  | "employeeFieldOrder"
  | "excludedJsonTagKeys"
  | "excludedJsonUnitIds"
  | "jsonFieldNames"
  | "jsonTagFieldOrder"
  | "jsonUnitFieldOrder"
  | "selectedEmployeeFieldKeys"
  | "selectedJsonTagFieldKeys"
  | "selectedJsonUnitFieldKeys"
>;

export type ExportSelection =
  | { id: string; type: "unit"; unitId: UnitId }
  | { employeeId: EmployeeId; id: string; type: "employee" };

export const exportEmployeeFieldKeys: ExportEmployeeFieldKey[] = [
  "id",
  "firstName",
  "lastName",
  "fullName",
  "gender",
  "username",
  "profileUrl",
  "email",
  "phone",
  "avatarBase64Url",
  "birthday",
  "tags",
  "tagDates",
];
export const exportJsonEmployeeFieldKeys: ExportJsonEmployeeFieldKey[] = [
  "id",
  "firstName",
  "lastName",
  "fullName",
  "gender",
  "username",
  "profileUrl",
  "email",
  "phone",
  "avatarBase64Url",
  "birthday",
];
export const exportUnitFieldKeys: ExportUnitFieldKey[] = [
  "unitId",
  "unitName",
  "unitFullPath",
  "position",
  "isBoss",
];
export const exportJsonUnitFieldKeys: ExportJsonUnitFieldKey[] = [
  "unitId",
  "unitName",
  "unitFullPath",
  "position",
  "isBoss",
];
export const exportJsonTagFieldKeys: ExportJsonTagFieldKey[] = ["label", "date"];
export const exportFieldKeys: ExportFieldKey[] = [
  ...exportEmployeeFieldKeys,
  ...exportUnitFieldKeys,
];
const createIdentityNameMap = <FieldKey extends string>(fieldKeys: FieldKey[]) =>
  Object.fromEntries(fieldKeys.map((fieldKey) => [fieldKey, fieldKey])) as unknown as Record<
    FieldKey,
    string
  >;

export const createDefaultExportJsonFieldNames = (): ExportJsonFieldNames => ({
  employee: createIdentityNameMap(exportJsonEmployeeFieldKeys),
  tags: {
    collection: "tags",
    fields: createIdentityNameMap(exportJsonTagFieldKeys),
  },
  units: {
    collection: "units",
    fields: createIdentityNameMap(exportJsonUnitFieldKeys),
  },
});
export const defaultExportEmployeeFieldKeys: ExportJsonEmployeeFieldKey[] = ["username"];
export const defaultExportEmployeeFieldOrder: ExportJsonEmployeeFieldKey[] = [
  ...defaultExportEmployeeFieldKeys,
  ...exportJsonEmployeeFieldKeys.filter(
    (fieldKey) => !defaultExportEmployeeFieldKeys.includes(fieldKey),
  ),
];
export const defaultExportJsonUnitFieldKeys: ExportJsonUnitFieldKey[] = [];
export const defaultExportJsonUnitFieldOrder: ExportJsonUnitFieldKey[] = [
  ...exportJsonUnitFieldKeys,
];
export const defaultExportJsonTagFieldKeys: ExportJsonTagFieldKey[] = [];
export const defaultExportJsonTagFieldOrder: ExportJsonTagFieldKey[] = [...exportJsonTagFieldKeys];

const toggleFieldInOrder = <FieldKey extends string>(
  selectedFieldKeys: FieldKey[],
  fieldOrder: FieldKey[],
  fieldKey: FieldKey,
) => {
  const selectedFieldKeySet = new Set(selectedFieldKeys);

  if (selectedFieldKeySet.has(fieldKey)) {
    selectedFieldKeySet.delete(fieldKey);
  } else {
    selectedFieldKeySet.add(fieldKey);
  }

  return fieldOrder.filter((currentFieldKey) => selectedFieldKeySet.has(currentFieldKey));
};

const moveFieldInOrder = <FieldKey extends string>({
  fieldKey,
  fieldOrder,
  placement,
  selectedFieldKeys,
  targetFieldKey,
}: {
  fieldKey: FieldKey;
  fieldOrder: FieldKey[];
  placement: ExportFieldDropPlacement;
  selectedFieldKeys: FieldKey[];
  targetFieldKey: FieldKey;
}) => {
  if (fieldKey === targetFieldKey) {
    return { fieldOrder, selectedFieldKeys };
  }

  const nextFieldOrder = fieldOrder.filter((currentFieldKey) => currentFieldKey !== fieldKey);
  const targetIndex = nextFieldOrder.indexOf(targetFieldKey);

  if (targetIndex === -1) {
    return { fieldOrder, selectedFieldKeys };
  }

  nextFieldOrder.splice(placement === "after" ? targetIndex + 1 : targetIndex, 0, fieldKey);

  return {
    fieldOrder: nextFieldOrder,
    selectedFieldKeys: nextFieldOrder.filter((currentFieldKey) =>
      selectedFieldKeys.includes(currentFieldKey),
    ),
  };
};

export class ExportSessionStore {
  tabMode: ExportTabMode = "json";
  rowMode: ExportRowMode = "allUnits";
  selectedEmployeeFieldKeys: ExportJsonEmployeeFieldKey[] = [...defaultExportEmployeeFieldKeys];
  employeeFieldOrder: ExportJsonEmployeeFieldKey[] = [...defaultExportEmployeeFieldOrder];
  selectedJsonUnitFieldKeys: ExportJsonUnitFieldKey[] = [...defaultExportJsonUnitFieldKeys];
  jsonUnitFieldOrder: ExportJsonUnitFieldKey[] = [...defaultExportJsonUnitFieldOrder];
  selectedJsonTagFieldKeys: ExportJsonTagFieldKey[] = [...defaultExportJsonTagFieldKeys];
  jsonTagFieldOrder: ExportJsonTagFieldKey[] = [...defaultExportJsonTagFieldOrder];
  jsonFieldNames: ExportJsonFieldNames = createDefaultExportJsonFieldNames();
  excludedJsonUnitIds: UnitId[] = [];
  excludedJsonTagKeys: string[] = [];
  templateFormat = "{email}, ";
  selections: ExportSelection[] = [];
  excludedEmployeeIds: EmployeeId[] = [];

  constructor() {
    makeAutoObservable(
      this,
      {
        employeeFieldOrder: observable.shallow,
        excludedEmployeeIds: observable.shallow,
        excludedJsonTagKeys: observable.shallow,
        excludedJsonUnitIds: observable.shallow,
        jsonFieldNames: observable.ref,
        jsonTagFieldOrder: observable.shallow,
        jsonUnitFieldOrder: observable.shallow,
        selectedEmployeeFieldKeys: observable.shallow,
        selectedJsonTagFieldKeys: observable.shallow,
        selectedJsonUnitFieldKeys: observable.shallow,
        selections: observable.shallow,
      },
      { autoBind: true },
    );
  }

  reset(): void {
    this.tabMode = "json";
    this.rowMode = "allUnits";
    this.selectedEmployeeFieldKeys = [...defaultExportEmployeeFieldKeys];
    this.employeeFieldOrder = [...defaultExportEmployeeFieldOrder];
    this.selectedJsonUnitFieldKeys = [...defaultExportJsonUnitFieldKeys];
    this.jsonUnitFieldOrder = [...defaultExportJsonUnitFieldOrder];
    this.selectedJsonTagFieldKeys = [...defaultExportJsonTagFieldKeys];
    this.jsonTagFieldOrder = [...defaultExportJsonTagFieldOrder];
    this.jsonFieldNames = createDefaultExportJsonFieldNames();
    this.excludedJsonUnitIds = [];
    this.excludedJsonTagKeys = [];
    this.templateFormat = "{email}, ";
    this.selections = [];
    this.excludedEmployeeIds = [];
  }

  loadState(state: OrgToolsDownloadState): void {
    const employeeFieldKeySet = new Set<ExportJsonEmployeeFieldKey>(exportJsonEmployeeFieldKeys);
    const jsonUnitFieldKeySet = new Set<ExportJsonUnitFieldKey>(exportJsonUnitFieldKeys);
    const jsonTagFieldKeySet = new Set<ExportJsonTagFieldKey>(exportJsonTagFieldKeys);
    const employeeOrder = state.employeeFieldOrder.filter(
      (key): key is ExportJsonEmployeeFieldKey =>
        employeeFieldKeySet.has(key as ExportJsonEmployeeFieldKey),
    );
    const jsonOrder = state.jsonUnitFieldOrder.filter((key): key is ExportJsonUnitFieldKey =>
      jsonUnitFieldKeySet.has(key as ExportJsonUnitFieldKey),
    );
    const jsonTagOrder = state.jsonTagFieldOrder.filter((key): key is ExportJsonTagFieldKey =>
      jsonTagFieldKeySet.has(key as ExportJsonTagFieldKey),
    );
    this.tabMode = state.tabMode;
    this.rowMode = state.rowMode;
    this.employeeFieldOrder =
      employeeOrder.length > 0 ? employeeOrder : [...defaultExportEmployeeFieldOrder];
    this.jsonUnitFieldOrder =
      jsonOrder.length > 0 ? jsonOrder : [...defaultExportJsonUnitFieldOrder];
    this.jsonTagFieldOrder =
      jsonTagOrder.length > 0 ? jsonTagOrder : [...defaultExportJsonTagFieldOrder];
    this.selectedEmployeeFieldKeys = this.employeeFieldOrder.filter((key) =>
      state.selectedEmployeeFieldKeys.includes(key),
    );
    this.selectedJsonUnitFieldKeys = this.jsonUnitFieldOrder.filter((key) =>
      state.selectedJsonUnitFieldKeys.includes(key),
    );
    this.selectedJsonTagFieldKeys = this.jsonTagFieldOrder.filter((key) =>
      state.selectedJsonTagFieldKeys.includes(key),
    );
    this.jsonFieldNames = {
      employee: { ...state.jsonFieldNames.employee } as ExportJsonFieldNames["employee"],
      tags: {
        collection: state.jsonFieldNames.tags.collection,
        fields: { ...state.jsonFieldNames.tags.fields } as ExportJsonFieldNames["tags"]["fields"],
      },
      units: {
        collection: state.jsonFieldNames.units.collection,
        fields: { ...state.jsonFieldNames.units.fields } as ExportJsonFieldNames["units"]["fields"],
      },
    };
    this.excludedJsonUnitIds = [...state.excludedJsonUnitIds];
    this.excludedJsonTagKeys = [...state.excludedJsonTagKeys];
    this.templateFormat = state.templateFormat;
    this.selections = state.selections.map((selection) => ({ ...selection })) as ExportSelection[];
    this.excludedEmployeeIds = [...state.excludedEmployeeIds];
  }

  createState(): Pick<
    OrgToolsDownloadState,
    | "employeeFieldOrder"
    | "excludedEmployeeIds"
    | "excludedJsonTagKeys"
    | "excludedJsonUnitIds"
    | "jsonFieldNames"
    | "jsonTagFieldOrder"
    | "jsonUnitFieldOrder"
    | "rowMode"
    | "selectedEmployeeFieldKeys"
    | "selectedJsonTagFieldKeys"
    | "selectedJsonUnitFieldKeys"
    | "selections"
    | "tabMode"
    | "templateFormat"
  > {
    return {
      employeeFieldOrder: [...this.employeeFieldOrder],
      excludedEmployeeIds: [...this.excludedEmployeeIds],
      excludedJsonTagKeys: [...this.excludedJsonTagKeys],
      excludedJsonUnitIds: [...this.excludedJsonUnitIds],
      jsonFieldNames: {
        employee: { ...this.jsonFieldNames.employee },
        tags: {
          collection: this.jsonFieldNames.tags.collection,
          fields: { ...this.jsonFieldNames.tags.fields },
        },
        units: {
          collection: this.jsonFieldNames.units.collection,
          fields: { ...this.jsonFieldNames.units.fields },
        },
      },
      jsonTagFieldOrder: [...this.jsonTagFieldOrder],
      jsonUnitFieldOrder: [...this.jsonUnitFieldOrder],
      rowMode: this.rowMode,
      selectedEmployeeFieldKeys: [...this.selectedEmployeeFieldKeys],
      selectedJsonTagFieldKeys: [...this.selectedJsonTagFieldKeys],
      selectedJsonUnitFieldKeys: [...this.selectedJsonUnitFieldKeys],
      selections: this.selections.map((selection) => ({ ...selection })),
      tabMode: this.tabMode,
      templateFormat: this.templateFormat,
    };
  }

  setTabMode(tabMode: ExportTabMode): void {
    this.tabMode = tabMode;
  }

  setJsonSettings(state: ExportJsonSettingsState): void {
    this.employeeFieldOrder = [...state.employeeFieldOrder];
    this.excludedJsonTagKeys = [...state.excludedJsonTagKeys];
    this.excludedJsonUnitIds = [...state.excludedJsonUnitIds];
    this.jsonFieldNames = structuredClone(state.jsonFieldNames) as ExportJsonFieldNames;
    this.jsonTagFieldOrder = [...state.jsonTagFieldOrder];
    this.jsonUnitFieldOrder = [...state.jsonUnitFieldOrder];
    this.selectedEmployeeFieldKeys = [...state.selectedEmployeeFieldKeys];
    this.selectedJsonTagFieldKeys = [...state.selectedJsonTagFieldKeys];
    this.selectedJsonUnitFieldKeys = [...state.selectedJsonUnitFieldKeys];
  }

  setRowMode(rowMode: ExportRowMode): void {
    this.rowMode = rowMode;
  }

  setTemplateFormat(templateFormat: string): void {
    this.templateFormat = templateFormat;
  }

  appendTemplateField(fieldKey: ExportFieldKey): void {
    this.templateFormat = `${this.templateFormat}{${fieldKey}}`;
  }

  setJsonFieldName(
    group: "employee" | "tags" | "units",
    fieldKey: ExportJsonEmployeeFieldKey | ExportJsonTagFieldKey | ExportJsonUnitFieldKey,
    fieldName: string,
  ): void {
    if (group === "employee") {
      this.jsonFieldNames = {
        ...this.jsonFieldNames,
        employee: { ...this.jsonFieldNames.employee, [fieldKey]: fieldName },
      } as ExportJsonFieldNames;
      return;
    }
    this.jsonFieldNames = {
      ...this.jsonFieldNames,
      [group]: {
        ...this.jsonFieldNames[group],
        fields: { ...this.jsonFieldNames[group].fields, [fieldKey]: fieldName },
      },
    } as ExportJsonFieldNames;
  }

  setJsonCollectionName(group: "tags" | "units", collection: string): void {
    this.jsonFieldNames = {
      ...this.jsonFieldNames,
      [group]: { ...this.jsonFieldNames[group], collection },
    };
  }

  resetJsonFieldName(
    group: "employee" | "tags" | "units",
    fieldKey: ExportJsonEmployeeFieldKey | ExportJsonTagFieldKey | ExportJsonUnitFieldKey,
  ): void {
    this.setJsonFieldName(group, fieldKey, fieldKey);
  }

  resetJsonCollectionName(group: "tags" | "units"): void {
    this.setJsonCollectionName(group, group);
  }

  toggleEmployeeFieldKey(fieldKey: ExportJsonEmployeeFieldKey): void {
    this.selectedEmployeeFieldKeys = toggleFieldInOrder(
      this.selectedEmployeeFieldKeys,
      this.employeeFieldOrder,
      fieldKey,
    );
  }

  toggleJsonUnitFieldKey(fieldKey: ExportJsonUnitFieldKey): void {
    this.selectedJsonUnitFieldKeys = toggleFieldInOrder(
      this.selectedJsonUnitFieldKeys,
      this.jsonUnitFieldOrder,
      fieldKey,
    );
  }

  toggleJsonTagFieldKey(fieldKey: ExportJsonTagFieldKey): void {
    this.selectedJsonTagFieldKeys = toggleFieldInOrder(
      this.selectedJsonTagFieldKeys,
      this.jsonTagFieldOrder,
      fieldKey,
    );
  }

  toggleJsonGroup(group: "tags" | "units"): void {
    if (group === "units") {
      this.selectedJsonUnitFieldKeys =
        this.selectedJsonUnitFieldKeys.length === this.jsonUnitFieldOrder.length
          ? []
          : [...this.jsonUnitFieldOrder];
      return;
    }
    this.selectedJsonTagFieldKeys =
      this.selectedJsonTagFieldKeys.length === this.jsonTagFieldOrder.length
        ? []
        : [...this.jsonTagFieldOrder];
  }

  setExcludedJsonUnitIds(unitIds: UnitId[]): void {
    this.excludedJsonUnitIds = [...new Set(unitIds)];
  }

  setExcludedJsonTagKeys(tagKeys: string[]): void {
    this.excludedJsonTagKeys = [...new Set(tagKeys)];
  }

  moveEmployeeFieldKey(
    fieldKey: ExportJsonEmployeeFieldKey,
    targetFieldKey: ExportJsonEmployeeFieldKey,
    placement: ExportFieldDropPlacement,
  ): void {
    const nextState = moveFieldInOrder({
      fieldKey,
      fieldOrder: this.employeeFieldOrder,
      placement,
      selectedFieldKeys: this.selectedEmployeeFieldKeys,
      targetFieldKey,
    });

    this.employeeFieldOrder = nextState.fieldOrder;
    this.selectedEmployeeFieldKeys = nextState.selectedFieldKeys;
  }

  moveJsonUnitFieldKey(
    fieldKey: ExportJsonUnitFieldKey,
    targetFieldKey: ExportJsonUnitFieldKey,
    placement: ExportFieldDropPlacement,
  ): void {
    const nextState = moveFieldInOrder({
      fieldKey,
      fieldOrder: this.jsonUnitFieldOrder,
      placement,
      selectedFieldKeys: this.selectedJsonUnitFieldKeys,
      targetFieldKey,
    });

    this.jsonUnitFieldOrder = nextState.fieldOrder;
    this.selectedJsonUnitFieldKeys = nextState.selectedFieldKeys;
  }

  moveJsonTagFieldKey(
    fieldKey: ExportJsonTagFieldKey,
    targetFieldKey: ExportJsonTagFieldKey,
    placement: ExportFieldDropPlacement,
  ): void {
    const nextState = moveFieldInOrder({
      fieldKey,
      fieldOrder: this.jsonTagFieldOrder,
      placement,
      selectedFieldKeys: this.selectedJsonTagFieldKeys,
      targetFieldKey,
    });

    this.jsonTagFieldOrder = nextState.fieldOrder;
    this.selectedJsonTagFieldKeys = nextState.selectedFieldKeys;
  }

  addSelection(selection: ExportSelection): void {
    this.addSelections([selection]);
  }

  addSelections(selections: ExportSelection[]): void {
    if (selections.length === 0) return;

    const selectionsById = new Map(this.selections.map((selection) => [selection.id, selection]));
    const employeeIdsToRestore = new Set<EmployeeId>();

    for (const selection of selections) {
      if (!selectionsById.has(selection.id)) {
        selectionsById.set(selection.id, selection);
      }

      if (selection.type === "employee") {
        employeeIdsToRestore.add(selection.employeeId);
      }
    }

    this.selections = [...selectionsById.values()];

    if (employeeIdsToRestore.size > 0) {
      this.excludedEmployeeIds = this.excludedEmployeeIds.filter(
        (employeeId) => !employeeIdsToRestore.has(employeeId),
      );
    }
  }

  removeSelection(selectionId: string): void {
    this.removeSelections([selectionId]);
  }

  removeSelections(selectionIds: Iterable<string>): void {
    const selectionIdSet = new Set(selectionIds);

    if (selectionIdSet.size === 0) return;

    this.selections = this.selections.filter((selection) => !selectionIdSet.has(selection.id));
  }

  removeEmployee(employeeId: EmployeeId): void {
    this.removeEmployees([employeeId]);
  }

  removeEmployees(employeeIds: Iterable<EmployeeId>): void {
    const employeeIdSet = new Set(employeeIds);

    if (employeeIdSet.size === 0) return;

    const excludedEmployeeIdSet = new Set(this.excludedEmployeeIds);

    for (const employeeId of employeeIdSet) {
      excludedEmployeeIdSet.add(employeeId);
    }

    this.excludedEmployeeIds = [...excludedEmployeeIdSet];
    this.selections = this.selections.filter(
      (selection) => selection.type !== "employee" || !employeeIdSet.has(selection.employeeId),
    );
  }

  purgeEmployee(employeeId: EmployeeId): void {
    this.excludedEmployeeIds = this.excludedEmployeeIds.filter(
      (currentEmployeeId) => currentEmployeeId !== employeeId,
    );
    this.selections = this.selections.filter(
      (selection) => selection.type !== "employee" || selection.employeeId !== employeeId,
    );
  }

  rekeyEmployee(previousEmployeeId: EmployeeId, nextEmployeeId: EmployeeId): void {
    if (previousEmployeeId === nextEmployeeId) return;
    this.excludedEmployeeIds = this.excludedEmployeeIds.map((employeeId) =>
      employeeId === previousEmployeeId ? nextEmployeeId : employeeId,
    );
    this.selections = this.selections.map((selection) =>
      selection.type === "employee" && selection.employeeId === previousEmployeeId
        ? {
            ...selection,
            employeeId: nextEmployeeId,
            id: selection.id.includes(previousEmployeeId)
              ? selection.id.replace(previousEmployeeId, nextEmployeeId)
              : selection.id,
          }
        : selection,
    );
  }

  clearSelection(): void {
    this.selections = [];
    this.excludedEmployeeIds = [];
  }
}
