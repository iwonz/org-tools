"use client";

import { observer } from "mobx-react-lite";
import {
  HiOutlineArrowDownTray,
  HiOutlineCheckCircle,
  HiOutlineClipboardDocument,
  HiOutlineCodeBracket,
  HiOutlineQueueList,
} from "react-icons/hi2";

import type { ExportExclusionOption } from "@/components/export-exclusion-select";
import { ExportTemplateSettings } from "@/components/export-template-settings";
import {
  StructuredJsonSettings,
  type StructuredJsonSettingsValue,
} from "@/components/structured-json-settings";
import { Button } from "@/components/ui/button";
import {
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type UiTextKey, useCountText, useUiText } from "@/i18n/use-ui-text";
import {
  type ExportFieldNameError,
  exportEmployeeFields,
  exportRowModeOptions,
  exportUnitFields,
} from "@/lib/export-format";
import { cn } from "@/lib/utils";
import type { ExportFieldKey, ExportRowMode, ExportTabMode } from "@/stores/org-store";
import { useOrgStore } from "@/stores/org-store-context";

type ExportSettingsStepProps = {
  canExport: boolean;
  fieldNameErrors: ExportFieldNameError[];
  onCopy: () => void;
  onDownload: () => void;
  previewFullCount: number;
  previewShownCount: number;
  previewText: string;
  previewTruncated: boolean;
  rowCountByMode: Record<ExportRowMode, number>;
  selectedEmployeeCount: number;
  status: string | null;
  tagOptions: ExportExclusionOption[];
  unitOptions: ExportExclusionOption[];
};

export const ExportSettingsStep = observer(function ExportSettingsStep({
  canExport,
  fieldNameErrors,
  onCopy,
  onDownload,
  previewFullCount,
  previewShownCount,
  previewText,
  previewTruncated,
  rowCountByMode,
  selectedEmployeeCount,
  status,
  tagOptions,
  unitOptions,
}: ExportSettingsStepProps) {
  const t = useUiText();
  const countText = useCountText();
  const store = useOrgStore();
  const activeTab = store.exportTabMode;
  const rowMode = store.exportRowMode;
  const templateFormat = store.exportTemplateFormat;
  const jsonSettings: StructuredJsonSettingsValue = {
    employeeFieldOrder: store.exportEmployeeFieldOrder,
    excludedJsonTagKeys: store.exportExcludedJsonTagKeys,
    excludedJsonUnitIds: store.exportExcludedJsonUnitIds,
    jsonFieldNames: store.exportJsonFieldNames,
    jsonTagFieldOrder: store.exportJsonTagFieldOrder,
    jsonUnitFieldOrder: store.exportJsonUnitFieldOrder,
    selectedEmployeeFieldKeys: store.exportSelectedEmployeeFieldKeys,
    selectedJsonTagFieldKeys: store.exportSelectedJsonTagFieldKeys,
    selectedJsonUnitFieldKeys: store.exportSelectedJsonUnitFieldKeys,
  };
  const formatCount = (count: number) =>
    countText(activeTab === "json" ? "records" : "rows", { count });
  const emptyPreview = t("Select Employees in the Download tab");

  const rowModeFieldset = (
    <fieldset className="grid pb-2" data-demo-id="export-row-mode">
      <legend className="mb-2.5 text-sm font-medium">
        {t("When an Employee belongs to multiple Units")}
      </legend>
      <div className="grid gap-2">
        {exportRowModeOptions.map((option) => {
          const checked = rowMode === option.value;
          return (
            <label
              className={cn(
                "grid cursor-pointer gap-2 rounded-md bg-muted/35 p-3 text-sm transition-colors hover:bg-accent/55 active:bg-accent-strong/65",
                checked && "bg-accent-strong/65 text-foreground",
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
                    <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                      {countText("rows", { count: rowCountByMode[option.value] })}
                    </span>
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

  const preview = (
    <div className="grid gap-2" data-demo-id="export-inline-preview">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-medium">{t("Preview")}</span>
        <span className="text-xs text-muted-foreground">
          {previewTruncated
            ? t("Showing {shown} of {total}", {
                shown: previewShownCount,
                total: previewFullCount,
              })
            : formatCount(previewFullCount)}
        </span>
      </div>
      <div className="max-h-80 min-h-40 overflow-auto rounded-md border bg-muted/30 p-3">
        <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed text-foreground">
          {canExport ? previewText : emptyPreview}
        </pre>
      </div>
    </div>
  );

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
      <DialogHeader>
        <DialogTitle>{t("Download settings")}</DialogTitle>
        <DialogDescription>
          {countText("employees", { count: selectedEmployeeCount })}
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
              <TabsTrigger data-demo-id="export-tab-json" value="json">
                <HiOutlineCodeBracket />
                JSON
              </TabsTrigger>
              <TabsTrigger data-demo-id="export-tab-template" value="template">
                <HiOutlineQueueList />
                {t("Template")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {activeTab === "json" ? (
            <>
              <StructuredJsonSettings
                errors={fieldNameErrors}
                onChange={(value) => store.setExportJsonSettings(value)}
                tagOptions={tagOptions}
                unitOptions={unitOptions}
                value={jsonSettings}
              />
              {preview}
            </>
          ) : (
            <ExportTemplateSettings
              dataDemoId="export-content-template"
              employeeFields={exportEmployeeFields}
              format={templateFormat}
              onAppendField={(fieldKey) =>
                store.appendExportTemplateField(fieldKey as ExportFieldKey)
              }
              onFormatChange={(value) => store.setExportTemplateFormat(value)}
              previewMeta={
                previewTruncated
                  ? t("Showing {shown} of {total}", {
                      shown: previewShownCount,
                      total: previewFullCount,
                    })
                  : formatCount(previewFullCount)
              }
              previewText={canExport ? previewText : emptyPreview}
              unitFields={exportUnitFields}
            >
              {rowModeFieldset}
            </ExportTemplateSettings>
          )}
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
