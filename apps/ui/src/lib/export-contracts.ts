import type {
  EmployeeFieldId,
  EmployeeId,
  OrgToolsDownloadJsonTopLevelFieldKey,
  OrgToolsDownloadState,
  UnitId,
} from "@org-tools/types";

export type ExportTabMode = "json" | "template";
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
export type ExportJsonTopLevelFieldKey = OrgToolsDownloadJsonTopLevelFieldKey;
export type ExportUnitFieldKey = "unitId" | "unitName" | "unitFullPath" | "position" | "isBoss";
export type ExportJsonUnitFieldKey = ExportUnitFieldKey;
export type ExportJsonTagFieldKey = "date" | "label";
export type ExportFieldKey = ExportEmployeeFieldKey | ExportUnitFieldKey;
export type ExportFieldDropPlacement = "after" | "before";
export type ExportJsonFieldNames = {
  custom: Record<EmployeeFieldId, string>;
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
  | "excludedJsonTagKeys"
  | "excludedJsonUnitIds"
  | "jsonFieldNames"
  | "jsonTagFieldOrder"
  | "jsonTopLevelFieldOrder"
  | "jsonUnitFieldOrder"
  | "selectedEmployeeFieldKeys"
  | "selectedCustomEmployeeFieldIds"
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
export const exportJsonUnitFieldKeys: ExportJsonUnitFieldKey[] = [...exportUnitFieldKeys];
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
  custom: {},
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
export const defaultExportJsonTopLevelFieldOrder: ExportJsonTopLevelFieldKey[] = [
  ...defaultExportEmployeeFieldKeys,
  ...exportJsonEmployeeFieldKeys.filter(
    (fieldKey) => !defaultExportEmployeeFieldKeys.includes(fieldKey),
  ),
  "units",
  "tags",
];
export const defaultExportJsonUnitFieldKeys: ExportJsonUnitFieldKey[] = [];
export const defaultExportJsonUnitFieldOrder: ExportJsonUnitFieldKey[] = [
  ...exportJsonUnitFieldKeys,
];
export const defaultExportJsonTagFieldKeys: ExportJsonTagFieldKey[] = [];
export const defaultExportJsonTagFieldOrder: ExportJsonTagFieldKey[] = [...exportJsonTagFieldKeys];
