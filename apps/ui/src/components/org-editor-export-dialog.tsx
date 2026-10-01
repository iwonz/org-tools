"use client";

import type { Employee, EmployeeId, EmployeeTagColor, OrgEditorUnit } from "@org-tools/types";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  HiOutlineArrowDownTray,
  HiOutlineBuildingOffice2,
  HiOutlineClipboardDocument,
  HiOutlineCodeBracket,
  HiOutlinePhoto,
  HiOutlineQueueList,
  HiOutlineRectangleGroup,
} from "react-icons/hi2";
import { createEmployeeDisplayFormatTokens } from "@/components/employee-display-format-tokens";
import { ExportTemplateSettings } from "@/components/export-template-settings";
import {
  OrgEditorImageExportSubjectSelect,
  useOrgEditorImageExportSubject,
} from "@/components/org-editor-image-export-subject";
import { OrgEditorImagePreview } from "@/components/org-editor-image-preview";
import {
  StructuredJsonSettings,
  type StructuredJsonSettingsValue,
} from "@/components/structured-json-settings";
import { TagColorPicker } from "@/components/tag-color-picker";
import { TemplateFormatInput } from "@/components/template-format-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type UiTextKey, useCountText, useUiText } from "@/i18n/use-ui-text";
import {
  createExportPreview,
  createExportTextAsync,
  exportEmployeeFields,
  exportUnitFields,
  validateExportFieldNames,
} from "@/lib/export-format";
import {
  formatOrgEditorUnitSummary,
  type OrgEditorSourceIndex,
  type OrgEditorUnitSummary,
} from "@/lib/org-editor";
import type {
  OrgEditorExportScope,
  OrgEditorExportTab,
  OrgEditorImageBackground,
  OrgEditorImageExportSettings,
} from "@/lib/org-editor-export";
import {
  buildOrgEditorExportRows,
  createDefaultOrgEditorImageExportSettings,
  createOrgEditorExportFileBaseName,
  createOrgEditorImageExportResult,
  createOrgEditorUnitImageBlob,
  getOrgEditorExportUnits,
  ORG_EDITOR_EXPORT_GRADIENTS,
  ORG_EDITOR_EXPORT_PREVIEW_AVATAR_LOAD_LIMIT,
  ORG_EDITOR_EXPORT_PREVIEW_MAX_CANVAS_PIXELS,
} from "@/lib/org-editor-export";
import type { OrgEditorImageExportSource } from "@/lib/org-editor-image-export-source";
import { copyTextToClipboard, downloadBlob, downloadText } from "@/lib/org-file";
import { normalizeSearchValue } from "@/lib/search-index";
import { cn } from "@/lib/utils";
import {
  createDefaultExportJsonFieldNames,
  defaultExportEmployeeFieldKeys,
  defaultExportJsonTagFieldOrder,
  defaultExportJsonTopLevelFieldOrder,
  defaultExportJsonUnitFieldOrder,
} from "@/stores/export-session-store";
import { useOrgStore } from "@/stores/org-store-context";

type OrgEditorExportDialogProps = {
  employeeById: ReadonlyMap<EmployeeId, Employee>;
  imageSource: OrgEditorImageExportSource;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  sourceIndex: OrgEditorSourceIndex;
  unit: OrgEditorUnit | null;
  units: OrgEditorUnit[];
};

type ExportStatus = {
  kind: "error" | "success";
  text: UiTextKey;
};

const DEFAULT_TEMPLATE_FORMAT = "{fullName} · {unitName}\n";

const getClipboardImageErrorMessage = (error: unknown): UiTextKey => {
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "The browser did not allow writing PNG to the clipboard. Select `Copy` again or use `Save`.";
  }

  if (
    error instanceof Error &&
    /not allowed|permission|denied|denied permission/i.test(error.message)
  ) {
    return "The browser did not allow writing PNG to the clipboard. Select `Copy` again or use `Save`.";
  }

  return "Could not copy PNG to the clipboard.";
};

const getBackgroundButtonClassName = (isActive: boolean) =>
  cn(
    "h-9 justify-start px-2 text-xs",
    isActive ? "bg-accent-strong/70 text-foreground" : "bg-secondary/55",
  );

export function OrgEditorExportDialog({
  employeeById,
  imageSource,
  onOpenChange,
  open,
  sourceIndex,
  unit,
  units,
}: OrgEditorExportDialogProps) {
  const t = useUiText();
  const store = useOrgStore();
  const locale = useLocale();
  const countText = useCountText();
  const positionNotSpecifiedLabel = t("Position not specified");
  const staffingSlotLabel = t("Staffing slot");
  const subjectState = useOrgEditorImageExportSubject({
    currentSource: imageSource,
    open,
    ...(unit ? { rootUnitId: unit.id } : {}),
  });
  const selectedImageSource = subjectState.source;
  const selectedImageUnit = unit
    ? (selectedImageSource?.units.find((candidate) => candidate.id === unit.id) ?? null)
    : null;
  const [scope, setScope] = useState<OrgEditorExportScope>("subtree");
  const [activeTab, setActiveTab] = useState<OrgEditorExportTab>("image");
  const [imageSettings, setImageSettings] = useState<OrgEditorImageExportSettings>(() =>
    createDefaultOrgEditorImageExportSettings(
      store.employeeDisplayFormats.editorExport,
      store.employeeDisplayLineGaps.editorExport,
    ),
  );
  const previousImageOpenRef = useRef(false);
  const [templateFormat, setTemplateFormat] = useState(DEFAULT_TEMPLATE_FORMAT);
  const [keepUniqueTemplateLines, setKeepUniqueTemplateLines] = useState(false);
  const [removeEmptyTemplateLines, setRemoveEmptyTemplateLines] = useState(false);
  const [jsonSettings, setJsonSettings] = useState<StructuredJsonSettingsValue>(() => ({
    excludedJsonTagKeys: [],
    excludedJsonUnitIds: [],
    jsonFieldNames: {
      ...createDefaultExportJsonFieldNames(),
      custom: Object.fromEntries(
        store.employeeFieldDefinitions.map((field) => [field.id, field.key]),
      ),
    },
    jsonTagFieldOrder: [...defaultExportJsonTagFieldOrder],
    jsonTopLevelFieldOrder: [
      ...defaultExportJsonTopLevelFieldOrder.slice(0, -2),
      ...store.employeeFieldDefinitions.map((field) => `custom:${field.id}` as const),
      ...defaultExportJsonTopLevelFieldOrder.slice(-2),
    ],
    jsonUnitFieldOrder: [...defaultExportJsonUnitFieldOrder],
    selectedEmployeeFieldKeys: [...defaultExportEmployeeFieldKeys],
    selectedCustomEmployeeFieldIds: [],
    selectedJsonTagFieldKeys: [],
    selectedJsonUnitFieldKeys: [],
  }));
  const [status, setStatus] = useState<ExportStatus | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<UiTextKey | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewSize, setPreviewSize] = useState({ height: 0, width: 0 });
  const formatUnitSummary = useCallback(
    (summary: OrgEditorUnitSummary) =>
      formatOrgEditorUnitSummary(summary, {
        formatCount: (key, count) => countText(key, { count }),
        inUnitLabel: t("In Unit"),
        totalLabel: t("Total summary"),
      }),
    [countText, t],
  );
  const hasAvatarBase64UrlField = useMemo(
    () => [...employeeById.values()].some((employee) => Boolean(employee.avatarBase64Url)),
    [employeeById],
  );
  const visibleEmployeeFields = useMemo(
    () =>
      exportEmployeeFields.filter(
        (field) => field.key !== "avatarBase64Url" || hasAvatarBase64UrlField,
      ),
    [hasAvatarBase64UrlField],
  );
  const imageEmployeeFormatTokens = useMemo(
    () =>
      createEmployeeDisplayFormatTokens(
        selectedImageSource?.customEmployeeFieldDefinitions ?? [],
        t,
      ),
    [selectedImageSource?.customEmployeeFieldDefinitions, t],
  );

  useEffect(() => {
    if (open && !previousImageOpenRef.current) {
      setImageSettings((current) => ({
        ...current,
        employeeFormat: store.employeeDisplayFormats.editorExport,
        employeeLineGap: store.employeeDisplayLineGaps.editorExport,
      }));
    }
    previousImageOpenRef.current = open;
  }, [open, store.employeeDisplayFormats.editorExport, store.employeeDisplayLineGaps.editorExport]);
  const exportRows = useMemo(() => {
    if (!unit) return [];

    return buildOrgEditorExportRows({
      rootUnit: unit,
      scope,
      sourceIndex,
      units,
    });
  }, [scope, sourceIndex, unit, units]);
  const scopedUnits = useMemo(
    () => (unit ? getOrgEditorExportUnits({ rootUnit: unit, scope, units }) : []),
    [scope, unit, units],
  );
  const tagOptions = useMemo(() => {
    const tagIds = new Set<string>();
    for (const row of exportRows) {
      for (const tag of row.employee.tags) {
        if (tag.tagId) tagIds.add(tag.tagId);
      }
    }
    return store.tagDefinitions
      .filter((tag) => tagIds.has(tag.id))
      .map(({ label }) => ({ label, value: normalizeSearchValue(label) }));
  }, [exportRows, store.tagDefinitions]);
  const jsonValidation = useMemo(
    () =>
      validateExportFieldNames({
        customEmployeeFieldDefinitions: store.employeeFieldDefinitions,
        jsonFieldNames: jsonSettings.jsonFieldNames,
        selectedCustomEmployeeFieldIds: jsonSettings.selectedCustomEmployeeFieldIds,
        selectedEmployeeFieldKeys: jsonSettings.selectedEmployeeFieldKeys,
        selectedJsonTagFieldKeys: jsonSettings.selectedJsonTagFieldKeys,
        selectedJsonUnitFieldKeys: jsonSettings.selectedJsonUnitFieldKeys,
        tabMode: "json",
      }),
    [jsonSettings, store.employeeFieldDefinitions],
  );
  const textPreview = useMemo(
    () =>
      createExportPreview({
        ...jsonSettings,
        customEmployeeFieldDefinitions: store.employeeFieldDefinitions,
        keepUniqueLines: activeTab === "template" && keepUniqueTemplateLines,
        rows: exportRows,
        removeEmptyLines: activeTab === "template" && removeEmptyTemplateLines,
        tabMode: activeTab === "json" ? "json" : "template",
        templateFormat,
      }),
    [
      activeTab,
      exportRows,
      jsonSettings,
      keepUniqueTemplateLines,
      removeEmptyTemplateLines,
      store.employeeFieldDefinitions,
      templateFormat,
    ],
  );
  const canExportText = exportRows.length > 0 && (activeTab !== "json" || jsonValidation.isValid);
  const canExportImage = Boolean(
    selectedImageSource && selectedImageUnit && !subjectState.loading && !subjectState.error,
  );

  useEffect(() => {
    if (!open || activeTab !== "image") return;
    if (!selectedImageSource || !selectedImageUnit) {
      setIsPreviewLoading(false);
      setPreviewError(null);
      setPreviewSize({ height: 0, width: 0 });
      setPreviewUrl((currentUrl) => {
        if (currentUrl) URL.revokeObjectURL(currentUrl);
        return null;
      });
      return;
    }

    let isCancelled = false;

    setIsPreviewLoading(true);
    setPreviewError(null);
    createOrgEditorImageExportResult({
      canvasElements: selectedImageSource.canvasElements,
      customEmployeeFieldDefinitions: selectedImageSource.customEmployeeFieldDefinitions,
      distributionEnabledUnitIds: selectedImageSource.distributionEnabledUnitIds,
      distributionUnitIdsByEmployeeId: selectedImageSource.distributionUnitIdsByEmployeeId,
      avatarLoadLimit: ORG_EDITOR_EXPORT_PREVIEW_AVATAR_LOAD_LIMIT,
      employeeById: selectedImageSource.employeeById,
      formatUnitSummary,
      layoutMode: selectedImageSource.layoutMode,
      locale,
      maxCanvasPixels: ORG_EDITOR_EXPORT_PREVIEW_MAX_CANVAS_PIXELS,
      positionNotSpecifiedLabel,
      ...(selectedImageSource.resolvedTemplateValuesByEmployeeId
        ? {
            resolvedTemplateValuesByEmployeeId:
              selectedImageSource.resolvedTemplateValuesByEmployeeId,
          }
        : {}),
      staffingSlotLabel,
      rootUnit: selectedImageUnit,
      scope,
      settings: imageSettings,
      tagOrder: selectedImageSource.tagOrder,
      tagDefinitions: selectedImageSource.tagDefinitions,
      units: selectedImageSource.units,
      viewSettings: selectedImageSource.viewSettings,
    })
      .then(({ blob, plan }) => {
        if (isCancelled) return;

        const nextUrl = URL.createObjectURL(blob);
        setPreviewUrl((currentUrl) => {
          if (currentUrl) URL.revokeObjectURL(currentUrl);
          return nextUrl;
        });
        setPreviewSize({ height: plan.pixelHeight, width: plan.pixelWidth });
      })
      .catch(() => {
        if (isCancelled) return;

        setPreviewError("Could not prepare the preview.");
      })
      .finally(() => {
        if (!isCancelled) setIsPreviewLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [
    activeTab,
    formatUnitSummary,
    imageSettings,
    locale,
    open,
    positionNotSpecifiedLabel,
    staffingSlotLabel,
    scope,
    selectedImageSource,
    selectedImageUnit,
  ]);

  useEffect(() => {
    if (open) return;

    setStatus(null);
    setPreviewSize({ height: 0, width: 0 });
    setPreviewUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return null;
    });
  }, [open]);

  const updateImageSettings = (nextSettings: Partial<OrgEditorImageExportSettings>) => {
    setImageSettings((currentSettings) => ({ ...currentSettings, ...nextSettings }));
    setStatus(null);
  };

  const setImageBackground = (background: OrgEditorImageBackground) => {
    updateImageSettings({ background });
  };

  const createImageBlob = () => {
    if (!selectedImageSource || !selectedImageUnit) {
      throw new Error("No Unit is selected for export.");
    }

    return createOrgEditorUnitImageBlob({
      canvasElements: selectedImageSource.canvasElements,
      customEmployeeFieldDefinitions: selectedImageSource.customEmployeeFieldDefinitions,
      distributionEnabledUnitIds: selectedImageSource.distributionEnabledUnitIds,
      distributionUnitIdsByEmployeeId: selectedImageSource.distributionUnitIdsByEmployeeId,
      viewSettings: selectedImageSource.viewSettings,
      employeeById: selectedImageSource.employeeById,
      formatUnitSummary,
      layoutMode: selectedImageSource.layoutMode,
      locale,
      rootUnit: selectedImageUnit,
      positionNotSpecifiedLabel,
      ...(selectedImageSource.resolvedTemplateValuesByEmployeeId
        ? {
            resolvedTemplateValuesByEmployeeId:
              selectedImageSource.resolvedTemplateValuesByEmployeeId,
          }
        : {}),
      staffingSlotLabel,
      scope,
      settings: imageSettings,
      tagOrder: selectedImageSource.tagOrder,
      tagDefinitions: selectedImageSource.tagDefinitions,
      units: selectedImageSource.units,
    });
  };

  const createTextExport = () =>
    createExportTextAsync({
      ...jsonSettings,
      customEmployeeFieldDefinitions: store.employeeFieldDefinitions,
      keepUniqueLines: activeTab === "template" && keepUniqueTemplateLines,
      rows: exportRows,
      removeEmptyLines: activeTab === "template" && removeEmptyTemplateLines,
      tabMode: activeTab === "json" ? "json" : "template",
      templateFormat,
    });

  const download = async () => {
    if (!unit) return;

    try {
      if (activeTab === "image") {
        if (!canExportImage) return;
        const blob = await createImageBlob();
        downloadBlob(blob, `${createOrgEditorExportFileBaseName(unit)}.png`);
        setStatus({ kind: "success", text: "Image saved" });
        return;
      }

      if (!canExportText) return;
      const json = activeTab === "json";
      downloadText(
        await createTextExport(),
        `${createOrgEditorExportFileBaseName(unit)}.${json ? "json" : "txt"}`,
        json ? "application/json;charset=utf-8" : "text/plain;charset=utf-8",
      );
      setStatus({ kind: "success", text: "Text export saved" });
    } catch {
      setStatus({
        kind: "error",
        text: "Could not save the export.",
      });
    }
  };

  const copy = async () => {
    try {
      if (activeTab === "image") {
        if (!canExportImage) return;
        if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
          throw new Error("The browser does not support copying PNG to the clipboard.");
        }

        await navigator.clipboard.write([new ClipboardItem({ "image/png": createImageBlob() })]);
        setStatus({ kind: "success", text: "Image copied to the clipboard" });
        return;
      }

      if (!canExportText) return;
      await copyTextToClipboard(await createTextExport());
      setStatus({ kind: "success", text: "Text copied to the clipboard" });
    } catch (error) {
      setStatus({
        kind: "error",
        text:
          activeTab === "image" ? getClipboardImageErrorMessage(error) : "Could not copy the text.",
      });
    }
  };

  const solidColor =
    imageSettings.background.type === "solid" ? imageSettings.background.color : "#ffffff";

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setKeepUniqueTemplateLines(false);
          setRemoveEmptyTemplateLines(false);
        }
        onOpenChange(nextOpen);
      }}
      open={open}
    >
      <DialogContent
        className="flex h-[min(820px,calc(100dvh-32px))] max-w-5xl flex-col overflow-hidden p-0"
        data-demo-id="org-editor-export-dialog"
      >
        <DialogHeader>
          <DialogTitle>{t("Export")}</DialogTitle>
          <DialogDescription>
            {unit ? unit.name : t("No Unit selected")}
            {unit && (
              <>
                {" · "}
                {scope === "subtree" ? t("entire subtree") : t("selected Unit only")}
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-1 flex-col gap-4 overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs
              onValueChange={(value) => {
                setScope(value as OrgEditorExportScope);
                setStatus(null);
              }}
              value={scope}
            >
              <TabsList>
                <TabsTrigger value="subtree">
                  <HiOutlineRectangleGroup />
                  {t("Entire subtree")}
                </TabsTrigger>
                <TabsTrigger value="unit">
                  <HiOutlineBuildingOffice2 />
                  {t("Unit only")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs
              onValueChange={(value) => {
                setActiveTab(value as OrgEditorExportTab);
                setStatus(null);
              }}
              value={activeTab}
            >
              <TabsList>
                <TabsTrigger value="image">
                  <HiOutlinePhoto />
                  {t("Image")}
                </TabsTrigger>
                <TabsTrigger value="json">
                  <HiOutlineCodeBracket />
                  JSON
                </TabsTrigger>
                <TabsTrigger value="template">
                  <HiOutlineQueueList />
                  {t("Template")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Tabs
            onValueChange={(value) => setActiveTab(value as OrgEditorExportTab)}
            value={activeTab}
          >
            <TabsContent className="mt-0 grid gap-4" value="image">
              <OrgEditorImagePreview
                alt={t("Unit export preview")}
                className="h-[360px]"
                dataDemoId="org-editor-export-image-preview"
                errorLabel={
                  subjectState.error === "unavailable"
                    ? t("The selected user does not have access to this View or Unit.")
                    : subjectState.error === "failed"
                      ? t("Could not prepare the preview.")
                      : previewError
                        ? t(previewError)
                        : null
                }
                height={previewSize.height}
                imageDataDemoId="org-editor-export-image"
                loading={subjectState.loading || isPreviewLoading}
                loadingLabel={t("Preparing preview...")}
                src={previewError ? null : previewUrl}
                width={previewSize.width}
              />

              <section className="grid gap-4 py-2">
                <OrgEditorImageExportSubjectSelect state={subjectState} />
                <div className="grid gap-2">
                  <Label>{t("Background")}</Label>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    <Button
                      className={getBackgroundButtonClassName(
                        imageSettings.background.type === "transparent",
                      )}
                      onClick={() => setImageBackground({ type: "transparent" })}
                      type="button"
                      variant="outline"
                    >
                      <span className="size-5 rounded border bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%),linear-gradient(-45deg,#e2e8f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f0_75%),linear-gradient(-45deg,transparent_75%,#e2e8f0_75%)] bg-[length:10px_10px] bg-[position:0_0,0_5px,5px_-5px,-5px_0]" />
                      {t("Transparent")}
                    </Button>
                    <TagColorPicker
                      allowNoColor={false}
                      label={t("Background color")}
                      onChange={(color: EmployeeTagColor | null) => {
                        if (color) setImageBackground({ color, type: "solid" });
                      }}
                      value={solidColor}
                    />
                    {ORG_EDITOR_EXPORT_GRADIENTS.map((gradient) => (
                      <Button
                        className={getBackgroundButtonClassName(
                          imageSettings.background.type === "gradient" &&
                            imageSettings.background.gradientId === gradient.id,
                        )}
                        key={gradient.id}
                        onClick={() =>
                          setImageBackground({
                            gradientId: gradient.id,
                            type: "gradient",
                          })
                        }
                        type="button"
                        variant="outline"
                      >
                        <span
                          className="size-5 rounded border"
                          style={{ background: gradient.previewCss }}
                        />
                        {t(gradient.label as UiTextKey)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="org-editor-export-padding">{t("Padding")}</Label>
                    <Input
                      id="org-editor-export-padding"
                      max={100}
                      min={0}
                      onChange={(event) =>
                        updateImageSettings({
                          padding: Number.parseInt(event.currentTarget.value || "0", 10),
                        })
                      }
                      type="number"
                      value={imageSettings.padding}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="org-editor-export-unit-radius">{t("Corner radius")}</Label>
                    <Input
                      id="org-editor-export-unit-radius"
                      max={100}
                      min={0}
                      onChange={(event) =>
                        updateImageSettings({
                          unitBorderRadius: Number.parseInt(event.currentTarget.value || "5", 10),
                        })
                      }
                      type="number"
                      value={imageSettings.unitBorderRadius}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <TemplateFormatInput
                    dataDemoId="org-editor-export-employee-format"
                    id="org-editor-export-employee-format"
                    inlineMarkdownTools
                    label={t("Employee format")}
                    onChange={(employeeFormat) => updateImageSettings({ employeeFormat })}
                    tokens={imageEmployeeFormatTokens}
                    value={imageSettings.employeeFormat}
                  />
                </div>
              </section>
            </TabsContent>

            <TabsContent className="mt-0 grid gap-4" value="json">
              <StructuredJsonSettings
                errors={jsonValidation.errors}
                onChange={(value) => {
                  setJsonSettings(value);
                  setStatus(null);
                }}
                tagOptions={tagOptions}
                unitOptions={scopedUnits.map((currentUnit) => ({
                  label: currentUnit.name,
                  value: currentUnit.id,
                }))}
                value={jsonSettings}
              />
              <div className="grid gap-2" data-demo-id="org-editor-export-json-preview">
                <div className="flex items-center justify-end gap-3">
                  <span className="text-xs text-muted-foreground">
                    {textPreview.truncated
                      ? t("Showing {shown} of {total}", {
                          shown: textPreview.shownCount,
                          total: textPreview.fullCount,
                        })
                      : countText("records", { count: textPreview.fullCount })}
                  </span>
                </div>
                <div className="max-h-80 min-h-40 overflow-auto rounded-md border bg-muted/30 p-3">
                  <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed">
                    {canExportText
                      ? textPreview.text
                      : t("The selected Unit has no Employees to export.")}
                  </pre>
                </div>
              </div>
            </TabsContent>

            <TabsContent className="mt-0" value="template">
              <ExportTemplateSettings
                dataDemoId="org-editor-export-template"
                employeeFields={[
                  ...visibleEmployeeFields,
                  ...store.employeeFieldDefinitions.map((field) => ({
                    key: field.key,
                    label: field.name,
                  })),
                ]}
                format={templateFormat}
                keepUniqueLines={keepUniqueTemplateLines}
                onFormatChange={(value) => {
                  setTemplateFormat(value);
                  setStatus(null);
                }}
                onKeepUniqueLinesChange={(value) => {
                  setKeepUniqueTemplateLines(value);
                  setStatus(null);
                }}
                onRemoveEmptyLinesChange={(value) => {
                  setRemoveEmptyTemplateLines(value);
                  setStatus(null);
                }}
                previewMeta={
                  textPreview.truncated
                    ? t("Showing {shown} of {total}", {
                        shown: textPreview.shownCount,
                        total: textPreview.fullCount,
                      })
                    : countText("rows", { count: textPreview.fullCount })
                }
                previewText={
                  canExportText
                    ? textPreview.text
                    : t("The selected Unit has no Employees to export.")
                }
                removeEmptyLines={removeEmptyTemplateLines}
                showPreviewLabel={false}
                unitFields={exportUnitFields}
              />
            </TabsContent>
          </Tabs>
        </DialogBody>
        <DialogFooter>
          {status && (
            <div
              className={cn(
                "mr-auto text-sm",
                status.kind === "success" ? "text-muted-foreground" : "text-destructive",
              )}
            >
              {t(status.text)}
            </div>
          )}
          <Button
            disabled={
              activeTab === "image"
                ? !canExportImage || isPreviewLoading || subjectState.loading
                : !canExportText
            }
            onClick={copy}
            type="button"
            variant="outline"
          >
            <HiOutlineClipboardDocument />
            {t("Copy")}
          </Button>
          <Button
            disabled={
              activeTab === "image"
                ? !canExportImage || isPreviewLoading || subjectState.loading
                : !canExportText
            }
            onClick={download}
            type="button"
          >
            <HiOutlineArrowDownTray />
            {t("Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
