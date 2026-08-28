"use client";

import { observer } from "mobx-react-lite";
import { type DragEvent, useState } from "react";
import {
  HiOutlineArrowDownTray,
  HiOutlineArrowUturnLeft,
  HiOutlineBars3,
  HiOutlineCheckCircle,
  HiOutlineClipboardDocument,
  HiOutlineCodeBracket,
  HiOutlineQueueList,
  HiOutlineTableCells,
} from "react-icons/hi2";
import { ExportTemplateSettings } from "@/components/export-template-settings";
import { MiddleDot } from "@/components/middle-dot";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type UiTextKey, useCountText, useUiText } from "@/i18n/use-ui-text";
import { UI_UNIT_PATH_SEPARATOR } from "@/lib/build-ui-org-structure";
import {
  type ExportFieldNameError,
  exportEmployeeFieldByKey,
  exportEmployeeFields,
  exportFieldByKey,
  exportJsonUnitFieldByKey,
  exportRowModeOptions,
  exportUnitFieldByKey,
  exportUnitFields,
} from "@/lib/export-format";
import { cn } from "@/lib/utils";
import { MAX_UNIT_FULL_PATH_SEPARATOR_LENGTH } from "@/stores/export-session-store";
import type {
  ExportEmployeeFieldKey,
  ExportFieldDropPlacement,
  ExportFieldKey,
  ExportJsonUnitFieldKey,
  ExportRowMode,
  ExportTabMode,
  ExportUnitFieldKey,
} from "@/stores/org-store";
import { useOrgStore } from "@/stores/org-store-context";

type ExportSettingsStepProps = {
  canExport: boolean;
  fieldNameErrors: ExportFieldNameError[];
  onEmployeeFieldToggle: (fieldKey: ExportEmployeeFieldKey) => void;
  onCopy: () => void;
  onDownload: () => void;
  previewText: string;
  rowCountByMode: Record<ExportRowMode, number>;
  rowCount: number;
  selectedEmployeeCount: number;
  status: string | null;
};

type ExportFieldGroup = "employee" | "flatUnit" | "jsonUnit";
type FieldDragState = {
  fieldKey: ExportFieldKey;
  group: ExportFieldGroup;
};
type FieldDragOverState = FieldDragState & {
  placement: ExportFieldDropPlacement;
};
type ExportFieldOption<FieldKey extends ExportFieldKey> = {
  key: FieldKey;
  label: string;
};

const isExportFieldKey = (value: string): value is ExportFieldKey =>
  exportFieldByKey.has(value as ExportFieldKey);

const isEmployeeFieldKey = (value: string): value is ExportEmployeeFieldKey =>
  exportEmployeeFieldByKey.has(value as ExportEmployeeFieldKey);

const isUnitFieldKey = (value: string): value is ExportUnitFieldKey =>
  exportUnitFieldByKey.has(value as ExportUnitFieldKey);

const isJsonUnitFieldKey = (value: string): value is ExportJsonUnitFieldKey =>
  exportJsonUnitFieldByKey.has(value as ExportJsonUnitFieldKey);

export const ExportSettingsStep = observer(function ExportSettingsStep({
  canExport,
  fieldNameErrors,
  onEmployeeFieldToggle,
  onCopy,
  onDownload,
  previewText,
  rowCount,
  rowCountByMode,
  selectedEmployeeCount,
  status,
}: ExportSettingsStepProps) {
  const t = useUiText();
  const countText = useCountText();
  const store = useOrgStore();
  const activeTab = store.exportTabMode;
  const rowMode = store.exportRowMode;
  const unitFullPathSeparator = store.exportUnitFullPathSeparator;
  const selectedEmployeeFieldKeys = store.exportSelectedEmployeeFieldKeys;
  const selectedFlatUnitFieldKeys = store.exportSelectedFlatUnitFieldKeys;
  const selectedJsonUnitFieldKeys = store.exportSelectedJsonUnitFieldKeys;
  const exportFieldNames = store.exportFieldNames;
  const orderedEmployeeFields = store.exportEmployeeFieldOrder
    .map((fieldKey) => exportEmployeeFieldByKey.get(fieldKey))
    .filter((field): field is (typeof exportEmployeeFields)[number] => field !== undefined);
  const orderedFlatUnitFields = store.exportFlatUnitFieldOrder
    .map((fieldKey) => exportUnitFieldByKey.get(fieldKey))
    .filter((field): field is (typeof exportUnitFields)[number] => field !== undefined);
  const orderedJsonUnitFields = store.exportJsonUnitFieldOrder
    .map((fieldKey) => exportJsonUnitFieldByKey.get(fieldKey))
    .filter((field): field is ExportFieldOption<ExportJsonUnitFieldKey> => field !== undefined);
  const templateFormat = store.exportTemplateFormat;
  const formatRecordCount = (count: number) =>
    countText(activeTab === "json" ? "records" : "rows", { count });
  const [draggedField, setDraggedField] = useState<FieldDragState | null>(null);
  const [dragOverField, setDragOverField] = useState<FieldDragOverState | null>(null);
  const hasFieldNameErrors = fieldNameErrors.length > 0;
  const unitFullPathSeparatorPreview = [t("Root"), t("Unit"), t("Team")].join(
    unitFullPathSeparator || UI_UNIT_PATH_SEPARATOR,
  );
  const visibleExportRowModeOptions = exportRowModeOptions;
  const formatFieldNameError = (error: ExportFieldNameError) => {
    const group =
      error.group === "csv"
        ? t("CSV")
        : error.group === "employee"
          ? t("Employee fields")
          : t("Unit fields");

    if (error.kind === "missing") {
      return t("{group}: {field} must have an export name.", {
        field: error.fieldKey,
        group,
      });
    }
    if (error.kind === "reserved") {
      return t("{group}: {field} is reserved.", { field: error.fieldName, group });
    }
    return t("{group}: {field} is used by both {first} and {second}.", {
      field: error.fieldName,
      first: error.previousFieldKey,
      group,
      second: error.fieldKey,
    });
  };

  const toggleField = (group: ExportFieldGroup, fieldKey: ExportFieldKey) => {
    if (group === "employee" && isEmployeeFieldKey(fieldKey)) {
      onEmployeeFieldToggle(fieldKey);
      return;
    }

    if (group === "flatUnit" && isUnitFieldKey(fieldKey)) {
      store.toggleExportFlatUnitFieldKey(fieldKey);
      return;
    }

    if (group === "jsonUnit" && isJsonUnitFieldKey(fieldKey)) {
      store.toggleExportJsonUnitFieldKey(fieldKey);
    }
  };

  const resetFieldDragState = () => {
    setDraggedField(null);
    setDragOverField(null);
  };

  const handleFieldDragStart = (
    event: DragEvent<HTMLElement>,
    group: ExportFieldGroup,
    fieldKey: ExportFieldKey,
  ) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `${group}:${fieldKey}`);
    setDraggedField({ fieldKey, group });
  };

  const handleFieldDragOver = (
    event: DragEvent<HTMLLIElement>,
    group: ExportFieldGroup,
    targetFieldKey: ExportFieldKey,
  ) => {
    if (
      draggedField === null ||
      draggedField.group !== group ||
      draggedField.fieldKey === targetFieldKey
    ) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    const rect = event.currentTarget.getBoundingClientRect();
    const placement = event.clientY < rect.top + rect.height / 2 ? "before" : "after";

    setDragOverField({ fieldKey: targetFieldKey, group, placement });
  };

  const handleFieldDrop = (
    event: DragEvent<HTMLLIElement>,
    group: ExportFieldGroup,
    targetFieldKey: ExportFieldKey,
  ) => {
    event.preventDefault();

    const [sourceGroup, sourceFieldKey] = event.dataTransfer.getData("text/plain").split(":");

    if (sourceGroup === undefined || sourceFieldKey === undefined) {
      resetFieldDragState();
      return;
    }

    if (
      sourceGroup === group &&
      isExportFieldKey(sourceFieldKey) &&
      sourceFieldKey !== targetFieldKey &&
      dragOverField !== null
    ) {
      if (
        group === "employee" &&
        isEmployeeFieldKey(sourceFieldKey) &&
        isEmployeeFieldKey(targetFieldKey)
      ) {
        store.moveExportEmployeeFieldKey(sourceFieldKey, targetFieldKey, dragOverField.placement);
      }

      if (
        group === "flatUnit" &&
        isUnitFieldKey(sourceFieldKey) &&
        isUnitFieldKey(targetFieldKey)
      ) {
        store.moveExportFlatUnitFieldKey(sourceFieldKey, targetFieldKey, dragOverField.placement);
      }

      if (
        group === "jsonUnit" &&
        isJsonUnitFieldKey(sourceFieldKey) &&
        isJsonUnitFieldKey(targetFieldKey)
      ) {
        store.moveExportJsonUnitFieldKey(sourceFieldKey, targetFieldKey, dragOverField.placement);
      }
    }

    resetFieldDragState();
  };

  const renderFieldList = <FieldKey extends ExportFieldKey>({
    description,
    fields,
    group,
    selectedFieldKeys,
    title,
  }: {
    description?: string;
    fields: Array<ExportFieldOption<FieldKey>>;
    group: ExportFieldGroup;
    selectedFieldKeys: FieldKey[];
    title: string;
  }) => (
    <section className="flex min-w-0 flex-col py-3">
      <div className="space-y-0.5">
        <h3 className="text-sm font-medium">{title}</h3>
        {description && (
          <p className="max-w-prose text-xs leading-tight text-muted-foreground">{description}</p>
        )}
      </div>
      <ul className="mt-2 grid gap-2">
        {fields.map((field) => {
          const isSelected = selectedFieldKeys.includes(field.key);
          const isOnlySelectedJsonUnitField =
            group === "jsonUnit" && isSelected && selectedFieldKeys.length <= 1;

          return (
            <li
              className={cn(
                "relative flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                draggedField?.fieldKey === field.key &&
                  draggedField.group === group &&
                  "opacity-50",
                draggedField !== null &&
                  draggedField.group === group &&
                  draggedField.fieldKey !== field.key &&
                  "hover:bg-accent/40",
              )}
              key={field.key}
              onDragLeave={() => {
                if (dragOverField?.fieldKey === field.key && dragOverField.group === group) {
                  setDragOverField(null);
                }
              }}
              onDragOver={(event) => handleFieldDragOver(event, group, field.key)}
              onDrop={(event) => handleFieldDrop(event, group, field.key)}
            >
              {dragOverField?.fieldKey === field.key &&
                dragOverField.group === group &&
                draggedField?.fieldKey !== field.key && (
                  <span
                    className={cn(
                      "pointer-events-none absolute left-2 right-2 h-0.5 rounded-full bg-primary",
                      dragOverField.placement === "before" ? "top-0" : "bottom-0",
                    )}
                  />
                )}
              <span
                aria-hidden="true"
                className="grid size-7 shrink-0 cursor-grab place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:cursor-grabbing"
                draggable
                onDragEnd={resetFieldDragState}
                onDragStart={(event) => handleFieldDragStart(event, group, field.key)}
                title={t("Drag field")}
              >
                <HiOutlineBars3 />
              </span>
              <Checkbox
                aria-label={t("Field {name}", { name: field.label })}
                checked={isSelected}
                disabled={isOnlySelectedJsonUnitField}
                onCheckedChange={() => toggleField(group, field.key)}
              />
              <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[minmax(7rem,0.8fr)_minmax(10rem,1.2fr)_auto] sm:items-center">
                <span className="min-w-0 truncate text-xs">{field.label}</span>
                <Input
                  aria-label={t("Export field name for {name}", { name: field.label })}
                  className="h-8 min-w-0 text-xs"
                  disabled={!isSelected}
                  onChange={(event) =>
                    store.setExportFieldName(field.key, event.currentTarget.value)
                  }
                  placeholder={field.key}
                  value={exportFieldNames[field.key] ?? field.key}
                />
                <Button
                  className={cn(
                    "h-8 justify-self-start px-2",
                    (exportFieldNames[field.key] ?? field.key) === field.key && "invisible",
                  )}
                  disabled={!isSelected}
                  onClick={() => store.resetExportFieldName(field.key)}
                  size="sm"
                  title={t("Restore technical name")}
                  type="button"
                  variant="ghost"
                >
                  <HiOutlineArrowUturnLeft />
                  <span className="sr-only">
                    {t("Reset field name {name}", { name: field.label })}
                  </span>
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );

  const exportPreviewBlock = (
    <div className="grid gap-2" data-demo-id="export-inline-preview">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Label>{t("Preview")}</Label>
        <div className="text-xs text-muted-foreground">
          {activeTab === "json"
            ? t("Preview JSON")
            : t("{count} in the current format", { count: formatRecordCount(rowCount) })}
        </div>
      </div>
      <div className="max-h-80 min-h-40 overflow-auto rounded-md border bg-muted/30 p-3">
        <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed text-foreground">
          {canExport
            ? previewText
            : hasFieldNameErrors
              ? t("Fix the export field names.")
              : t("Select Employees in the Download tab")}
        </pre>
      </div>
    </div>
  );
  const unitFullPathSeparatorField = (
    <section className="grid max-w-xl gap-1.5" data-demo-id="export-unit-path-separator">
      <Label htmlFor="export-unit-full-path-separator">{t("Full Unit path separator")}</Label>
      <Input
        className="h-9 max-w-48"
        id="export-unit-full-path-separator"
        maxLength={MAX_UNIT_FULL_PATH_SEPARATOR_LENGTH}
        onChange={(event) => store.setExportUnitFullPathSeparator(event.currentTarget.value)}
        placeholder={UI_UNIT_PATH_SEPARATOR}
        value={unitFullPathSeparator}
      />
      <p className="text-xs text-muted-foreground">
        {t("Example:")} <span className="whitespace-pre-wrap">{unitFullPathSeparatorPreview}</span>
      </p>
    </section>
  );

  const rowModeFieldset = (
    <fieldset className="grid pb-2" data-demo-id="export-row-mode">
      <legend className="mb-2.5 text-sm font-medium">
        {t("When an Employee belongs to multiple Units")}
      </legend>
      <div className="grid gap-2">
        {visibleExportRowModeOptions.map((option) => {
          const checked = rowMode === option.value;

          return (
            <label
              className={cn(
                "grid cursor-pointer gap-2 rounded-md bg-muted/35 p-3 text-sm transition-colors hover:bg-accent/55 active:bg-accent-strong/65",
                checked ? "bg-accent-strong/65 text-foreground" : "hover:bg-accent/55",
              )}
              key={option.value}
            >
              <span className="flex min-w-0 items-stretch gap-3">
                <input
                  checked={checked}
                  className="sr-only"
                  name="export-row-mode"
                  onChange={() => store.setExportRowMode(option.value)}
                  type="radio"
                  value={option.value}
                />
                <span aria-hidden="true" className="grid min-h-11 shrink-0 place-items-center">
                  {checked ? (
                    <HiOutlineCheckCircle className="size-5 text-primary" />
                  ) : (
                    <span className="size-5 rounded-full border border-muted-foreground/40 bg-background" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex min-w-0 items-start justify-between gap-3">
                    <span className="font-medium leading-snug">{t(option.title as UiTextKey)}</span>
                    {activeTab !== "json" && (
                      <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                        {countText("rows", { count: rowCountByMode[option.value] })}
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {t(option.description as UiTextKey)}
                  </span>
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
      <DialogHeader>
        <DialogTitle>{t("Download settings")}</DialogTitle>
        <DialogDescription>
          {countText("employees", { count: selectedEmployeeCount })}
          {activeTab !== "json" && (
            <>
              <MiddleDot />
              {formatRecordCount(rowCount)}
            </>
          )}
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="grid w-full min-w-0 gap-4">
          <Tabs
            className="min-w-0"
            onValueChange={(value) => store.setExportTabMode(value as ExportTabMode)}
            value={activeTab}
          >
            <TabsList className="inline-flex h-auto w-fit min-w-0">
              <TabsTrigger data-demo-id="export-tab-csv" value="csv">
                <HiOutlineTableCells />
                CSV
              </TabsTrigger>
              <TabsTrigger data-demo-id="export-tab-json" value="json">
                <HiOutlineCodeBracket />
                JSON
              </TabsTrigger>
              <TabsTrigger data-demo-id="export-tab-template" value="template">
                <HiOutlineQueueList />
                Template
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {unitFullPathSeparatorField}
          {activeTab === "template" && (
            <ExportTemplateSettings
              dataDemoId="export-content-template"
              employeeFields={exportEmployeeFields}
              format={templateFormat}
              onAppendField={(fieldKey) =>
                store.appendExportTemplateField(fieldKey as ExportFieldKey)
              }
              onFormatChange={(value) => store.setExportTemplateFormat(value)}
              previewMeta={t("{count} in the current format", {
                count: formatRecordCount(rowCount),
              })}
              previewDataDemoId="export-inline-preview"
              previewText={
                canExport
                  ? previewText
                  : hasFieldNameErrors
                    ? t("Fix the export field names.")
                    : t("Select Employees in the Download tab")
              }
              unitFields={exportUnitFields}
            >
              {rowModeFieldset}
            </ExportTemplateSettings>
          )}
          {activeTab !== "template" && rowModeFieldset}
          {activeTab !== "template" && (
            <div className="grid gap-2" data-demo-id="export-fields">
              <Label>{t("Fields")}</Label>
              <div className="grid gap-3 lg:grid-cols-2">
                {renderFieldList({
                  fields: orderedEmployeeFields,
                  group: "employee",
                  selectedFieldKeys: selectedEmployeeFieldKeys,
                  title: t("Employee fields"),
                })}
                {renderFieldList({
                  description:
                    activeTab === "json"
                      ? t(
                          "JSON always includes a units array. Configure the fields of each object in that array here.",
                        )
                      : t("These fields become CSV columns or template tokens."),
                  fields: activeTab === "json" ? orderedJsonUnitFields : orderedFlatUnitFields,
                  group: activeTab === "json" ? "jsonUnit" : "flatUnit",
                  selectedFieldKeys:
                    activeTab === "json" ? selectedJsonUnitFieldKeys : selectedFlatUnitFieldKeys,
                  title: t("Units"),
                })}
              </div>
              {hasFieldNameErrors && (
                <div className="grid gap-1 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {fieldNameErrors.map((error) => (
                    <div key={JSON.stringify(error)}>{formatFieldNameError(error)}</div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab !== "template" && exportPreviewBlock}
        </div>
      </DialogBody>
      <DialogFooter className="flex-wrap" data-demo-id="export-actions">
        {status && <div className="mr-auto text-sm text-muted-foreground">{status}</div>}
        <Button disabled={!canExport} onClick={onCopy} type="button" variant="outline">
          <HiOutlineClipboardDocument />
          {t("Copy")}
        </Button>
        <Button disabled={!canExport} onClick={onDownload} type="button">
          <HiOutlineArrowDownTray />
          {t("Download")}
        </Button>
      </DialogFooter>
    </section>
  );
});
