import type { EmployeeId, UnitId } from "@org-tools/types";
import { makeAutoObservable, observable } from "mobx";

import { UI_UNIT_PATH_SEPARATOR } from "@/lib/build-ui-org-structure";

export type ExportTabMode = "csv" | "json" | "template";
export type ExportRowMode = "allUnits" | "firstUnit";
export type ExportEmployeeFieldKey =
  | "id"
  | "firstName"
  | "lastName"
  | "fullName"
  | "username"
  | "profileUrl"
  | "email"
  | "phone"
  | "avatarBase64Url"
  | "birthday"
  | "tags"
  | "tagDates";
export type ExportUnitFieldKey = "unitId" | "unitName" | "unitFullPath" | "position" | "isBoss";
export type ExportJsonUnitFieldKey = ExportUnitFieldKey;
export type ExportFieldKey = ExportEmployeeFieldKey | ExportUnitFieldKey;
export type ExportFieldDropPlacement = "after" | "before";
export type ExportFieldNameMap = Record<ExportFieldKey, string>;

export type ExportSelection =
  | { id: string; type: "unit"; unitId: UnitId }
  | { employeeId: EmployeeId; id: string; type: "employee" };

export const MAX_UNIT_FULL_PATH_SEPARATOR_LENGTH = 5;

export const normalizeUnitFullPathSeparator = (unitFullPathSeparator: string) => {
  const nextSeparator = unitFullPathSeparator || UI_UNIT_PATH_SEPARATOR;

  if (nextSeparator.length > MAX_UNIT_FULL_PATH_SEPARATOR_LENGTH) {
    throw new Error(
      `unitFullPathSeparator must be ${MAX_UNIT_FULL_PATH_SEPARATOR_LENGTH} characters or shorter.`,
    );
  }

  return nextSeparator;
};

export const exportEmployeeFieldKeys: ExportEmployeeFieldKey[] = [
  "id",
  "firstName",
  "lastName",
  "fullName",
  "username",
  "profileUrl",
  "email",
  "phone",
  "avatarBase64Url",
  "birthday",
  "tags",
  "tagDates",
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
export const exportFieldKeys: ExportFieldKey[] = [
  ...exportEmployeeFieldKeys,
  ...exportUnitFieldKeys,
];
export const createDefaultExportFieldNames = (): ExportFieldNameMap =>
  Object.fromEntries(exportFieldKeys.map((fieldKey) => [fieldKey, fieldKey])) as ExportFieldNameMap;
export const defaultExportEmployeeFieldKeys: ExportEmployeeFieldKey[] = ["username"];
export const defaultExportEmployeeFieldOrder: ExportEmployeeFieldKey[] = [
  ...defaultExportEmployeeFieldKeys,
  ...exportEmployeeFieldKeys.filter(
    (fieldKey) => !defaultExportEmployeeFieldKeys.includes(fieldKey),
  ),
];
export const defaultExportFlatUnitFieldKeys: ExportUnitFieldKey[] = ["unitName", "unitFullPath"];
export const defaultExportFlatUnitFieldOrder: ExportUnitFieldKey[] = [
  ...defaultExportFlatUnitFieldKeys,
  ...exportUnitFieldKeys.filter((fieldKey) => !defaultExportFlatUnitFieldKeys.includes(fieldKey)),
];
export const defaultExportJsonUnitFieldKeys: ExportJsonUnitFieldKey[] = [
  "unitId",
  "unitName",
  "unitFullPath",
  "position",
  "isBoss",
];
export const defaultExportJsonUnitFieldOrder: ExportJsonUnitFieldKey[] = [
  ...defaultExportJsonUnitFieldKeys,
];

const toggleFieldInOrder = <FieldKey extends ExportFieldKey>(
  selectedFieldKeys: FieldKey[],
  fieldOrder: FieldKey[],
  fieldKey: FieldKey,
  options: { keepAtLeastOne?: boolean } = {},
) => {
  const selectedFieldKeySet = new Set(selectedFieldKeys);

  if (selectedFieldKeySet.has(fieldKey)) {
    if (options.keepAtLeastOne && selectedFieldKeySet.size <= 1) return selectedFieldKeys;
    selectedFieldKeySet.delete(fieldKey);
  } else {
    selectedFieldKeySet.add(fieldKey);
  }

  return fieldOrder.filter((currentFieldKey) => selectedFieldKeySet.has(currentFieldKey));
};

const moveFieldInOrder = <FieldKey extends ExportFieldKey>({
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
  tabMode: ExportTabMode = "csv";
  rowMode: ExportRowMode = "allUnits";
  selectedEmployeeFieldKeys: ExportEmployeeFieldKey[] = [...defaultExportEmployeeFieldKeys];
  employeeFieldOrder: ExportEmployeeFieldKey[] = [...defaultExportEmployeeFieldOrder];
  selectedFlatUnitFieldKeys: ExportUnitFieldKey[] = [...defaultExportFlatUnitFieldKeys];
  flatUnitFieldOrder: ExportUnitFieldKey[] = [...defaultExportFlatUnitFieldOrder];
  selectedJsonUnitFieldKeys: ExportJsonUnitFieldKey[] = [...defaultExportJsonUnitFieldKeys];
  jsonUnitFieldOrder: ExportJsonUnitFieldKey[] = [...defaultExportJsonUnitFieldOrder];
  fieldNames: ExportFieldNameMap = createDefaultExportFieldNames();
  unitFullPathSeparator = UI_UNIT_PATH_SEPARATOR;
  templateFormat = "{email}, ";
  selections: ExportSelection[] = [];
  excludedEmployeeIds: EmployeeId[] = [];

  constructor() {
    makeAutoObservable(
      this,
      {
        employeeFieldOrder: observable.shallow,
        excludedEmployeeIds: observable.shallow,
        fieldNames: observable.ref,
        flatUnitFieldOrder: observable.shallow,
        jsonUnitFieldOrder: observable.shallow,
        selectedEmployeeFieldKeys: observable.shallow,
        selectedFlatUnitFieldKeys: observable.shallow,
        selectedJsonUnitFieldKeys: observable.shallow,
        selections: observable.shallow,
      },
      { autoBind: true },
    );
  }

  reset(): void {
    this.tabMode = "csv";
    this.rowMode = "allUnits";
    this.selectedEmployeeFieldKeys = [...defaultExportEmployeeFieldKeys];
    this.employeeFieldOrder = [...defaultExportEmployeeFieldOrder];
    this.selectedFlatUnitFieldKeys = [...defaultExportFlatUnitFieldKeys];
    this.flatUnitFieldOrder = [...defaultExportFlatUnitFieldOrder];
    this.selectedJsonUnitFieldKeys = [...defaultExportJsonUnitFieldKeys];
    this.jsonUnitFieldOrder = [...defaultExportJsonUnitFieldOrder];
    this.fieldNames = createDefaultExportFieldNames();
    this.unitFullPathSeparator = UI_UNIT_PATH_SEPARATOR;
    this.templateFormat = "{email}, ";
    this.selections = [];
    this.excludedEmployeeIds = [];
  }

  setTabMode(tabMode: ExportTabMode): void {
    this.tabMode = tabMode;
  }

  setRowMode(rowMode: ExportRowMode): void {
    this.rowMode = rowMode;
  }

  setTemplateFormat(templateFormat: string): void {
    this.templateFormat = templateFormat;
  }

  setUnitFullPathSeparator(unitFullPathSeparator: string): void {
    this.unitFullPathSeparator = normalizeUnitFullPathSeparator(unitFullPathSeparator);
  }

  appendTemplateField(fieldKey: ExportFieldKey): void {
    this.templateFormat = `${this.templateFormat}{${fieldKey}}`;
  }

  setFieldName(fieldKey: ExportFieldKey, fieldName: string): void {
    this.fieldNames = {
      ...this.fieldNames,
      [fieldKey]: fieldName,
    };
  }

  resetFieldName(fieldKey: ExportFieldKey): void {
    this.fieldNames = {
      ...this.fieldNames,
      [fieldKey]: fieldKey,
    };
  }

  toggleEmployeeFieldKey(fieldKey: ExportEmployeeFieldKey): void {
    this.selectedEmployeeFieldKeys = toggleFieldInOrder(
      this.selectedEmployeeFieldKeys,
      this.employeeFieldOrder,
      fieldKey,
    );
  }

  toggleFlatUnitFieldKey(fieldKey: ExportUnitFieldKey): void {
    this.selectedFlatUnitFieldKeys = toggleFieldInOrder(
      this.selectedFlatUnitFieldKeys,
      this.flatUnitFieldOrder,
      fieldKey,
    );
  }

  toggleJsonUnitFieldKey(fieldKey: ExportJsonUnitFieldKey): void {
    this.selectedJsonUnitFieldKeys = toggleFieldInOrder(
      this.selectedJsonUnitFieldKeys,
      this.jsonUnitFieldOrder,
      fieldKey,
      { keepAtLeastOne: true },
    );
  }

  moveEmployeeFieldKey(
    fieldKey: ExportEmployeeFieldKey,
    targetFieldKey: ExportEmployeeFieldKey,
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

  moveFlatUnitFieldKey(
    fieldKey: ExportUnitFieldKey,
    targetFieldKey: ExportUnitFieldKey,
    placement: ExportFieldDropPlacement,
  ): void {
    const nextState = moveFieldInOrder({
      fieldKey,
      fieldOrder: this.flatUnitFieldOrder,
      placement,
      selectedFieldKeys: this.selectedFlatUnitFieldKeys,
      targetFieldKey,
    });

    this.flatUnitFieldOrder = nextState.fieldOrder;
    this.selectedFlatUnitFieldKeys = nextState.selectedFieldKeys;
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

  clearSelection(): void {
    this.selections = [];
    this.excludedEmployeeIds = [];
  }
}
