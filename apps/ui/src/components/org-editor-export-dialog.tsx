"use client";

import type { Employee, EmployeeId, OrgEditorLayoutMode, OrgEditorUnit } from "@org-tools/types";
import Image from "next/image";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HiOutlineArrowDownTray,
  HiOutlineClipboardDocument,
  HiOutlineCodeBracket,
  HiOutlineMagnifyingGlassPlus,
  HiOutlinePhoto,
  HiOutlineQueueList,
} from "react-icons/hi2";

import { ExportTemplateSettings } from "@/components/export-template-settings";
import {
  StructuredJsonSettings,
  type StructuredJsonSettingsValue,
} from "@/components/structured-json-settings";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { type UiTextKey, useCountText, useUiText } from "@/i18n/use-ui-text";
import {
  createExportPreview,
  createExportTextAsync,
  exportEmployeeFields,
  exportRowModeOptions,
  exportUnitFields,
  validateExportFieldNames,
} from "@/lib/export-format";
import type { OrgEditorSourceIndex, OrgEditorUnitEmployeeSummary } from "@/lib/org-editor";
import type {
  OrgEditorExportScope,
  OrgEditorExportTab,
  OrgEditorExportTitleAlign,
  OrgEditorImageBackground,
  OrgEditorImageExportSettings,
} from "@/lib/org-editor-export";
import {
  buildOrgEditorExportRows,
  createDefaultOrgEditorImageExportSettings,
  createOrgEditorExportFileBaseName,
  createOrgEditorUnitImageBlob,
  getOrgEditorExportUnits,
  ORG_EDITOR_EXPORT_FONTS,
  ORG_EDITOR_EXPORT_GRADIENTS,
  ORG_EDITOR_EXPORT_PREVIEW_AVATAR_LOAD_LIMIT,
  ORG_EDITOR_EXPORT_PREVIEW_MAX_CANVAS_PIXELS,
  orgEditorTemplateContainsBossToken,
} from "@/lib/org-editor-export";
import { copyTextToClipboard, downloadBlob, downloadText } from "@/lib/org-file";
import { normalizeSearchValue } from "@/lib/search-index";
import { cn } from "@/lib/utils";
import {
  createDefaultExportJsonFieldNames,
  defaultExportEmployeeFieldKeys,
  defaultExportEmployeeFieldOrder,
  defaultExportJsonTagFieldOrder,
  defaultExportJsonUnitFieldOrder,
} from "@/stores/export-session-store";
import type { ExportRowMode } from "@/stores/org-store";

type OrgEditorExportDialogProps = {
  employeeById: ReadonlyMap<EmployeeId, Employee>;
  layoutMode: OrgEditorLayoutMode;
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
  layoutMode,
  onOpenChange,
  open,
  sourceIndex,
  unit,
  units,
}: OrgEditorExportDialogProps) {
  const t = useUiText();
  const locale = useLocale();
  const countText = useCountText();
  const [scope, setScope] = useState<OrgEditorExportScope>("subtree");
  const [activeTab, setActiveTab] = useState<OrgEditorExportTab>("image");
  const [imageSettings, setImageSettings] = useState<OrgEditorImageExportSettings>(() =>
    createDefaultOrgEditorImageExportSettings(),
  );
  const [templateFormat, setTemplateFormat] = useState(DEFAULT_TEMPLATE_FORMAT);
  const [rowMode, setRowMode] = useState<ExportRowMode>("allUnits");
  const [jsonSettings, setJsonSettings] = useState<StructuredJsonSettingsValue>(() => ({
    employeeFieldOrder: [...defaultExportEmployeeFieldOrder],
    excludedJsonTagKeys: [],
    excludedJsonUnitIds: [],
    jsonFieldNames: createDefaultExportJsonFieldNames(),
    jsonTagFieldOrder: [...defaultExportJsonTagFieldOrder],
    jsonUnitFieldOrder: [...defaultExportJsonUnitFieldOrder],
    selectedEmployeeFieldKeys: [...defaultExportEmployeeFieldKeys],
    selectedJsonTagFieldKeys: [],
    selectedJsonUnitFieldKeys: [],
  }));
  const [status, setStatus] = useState<ExportStatus | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<UiTextKey | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isZoomPreviewOpen, setIsZoomPreviewOpen] = useState(false);
  const formatUnitSummary = useCallback(
    (summary: OrgEditorUnitEmployeeSummary) => {
      const direct = countText("employees", { count: summary.directCount });
      return summary.hasChildUnits
        ? `${direct} · ${countText("totalEmployees", { count: summary.totalCount })}`
        : direct;
    },
    [countText],
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
  const visibleImageEmployeeFields = useMemo(
    () => visibleEmployeeFields.filter((field) => field.key !== "tags"),
    [visibleEmployeeFields],
  );
  const exportRows = useMemo(() => {
    if (!unit) return [];

    return buildOrgEditorExportRows({
      rootUnit: unit,
      rowMode: activeTab === "json" ? "allUnits" : rowMode,
      scope,
      sourceIndex,
      units,
    });
  }, [activeTab, rowMode, scope, sourceIndex, unit, units]);
  const scopedUnits = useMemo(
    () => (unit ? getOrgEditorExportUnits({ rootUnit: unit, scope, units }) : []),
    [scope, unit, units],
  );
  const tagOptions = useMemo(() => {
    const labels = new Map<string, string>();
    for (const row of exportRows) {
      for (const tag of row.employee.tags) {
        labels.set(normalizeSearchValue(tag.label), tag.label);
      }
    }
    return [...labels].map(([value, label]) => ({ label, value }));
  }, [exportRows]);
  const jsonValidation = useMemo(
    () =>
      validateExportFieldNames({
        jsonFieldNames: jsonSettings.jsonFieldNames,
        selectedEmployeeFieldKeys: jsonSettings.selectedEmployeeFieldKeys,
        selectedJsonTagFieldKeys: jsonSettings.selectedJsonTagFieldKeys,
        selectedJsonUnitFieldKeys: jsonSettings.selectedJsonUnitFieldKeys,
        tabMode: "json",
      }),
    [jsonSettings],
  );
  const hasImageBossToken = orgEditorTemplateContainsBossToken(imageSettings.employeeFormat);
  const isImageBossLabelValid =
    !hasImageBossToken || imageSettings.imageBossLabel.trim().length > 0;
  const textPreview = useMemo(
    () =>
      createExportPreview({
        ...jsonSettings,
        rows: exportRows,
        tabMode: activeTab === "json" ? "json" : "template",
        templateFormat,
      }),
    [activeTab, exportRows, jsonSettings, templateFormat],
  );
  const canExportText = exportRows.length > 0 && (activeTab !== "json" || jsonValidation.isValid);
  const canExportImage = Boolean(unit) && isImageBossLabelValid;

  useEffect(() => {
    if (!open || !unit || activeTab !== "image") return;

    if (!isImageBossLabelValid) {
      setIsPreviewLoading(false);
      setPreviewUrl((currentUrl) => {
        if (currentUrl) URL.revokeObjectURL(currentUrl);
        return null;
      });
      setPreviewError("Provide a value for the {isBoss} token.");
      return;
    }

    let isCancelled = false;

    setIsPreviewLoading(true);
    setPreviewError(null);
    createOrgEditorUnitImageBlob({
      avatarLoadLimit: ORG_EDITOR_EXPORT_PREVIEW_AVATAR_LOAD_LIMIT,
      employeeById,
      formatUnitSummary,
      layoutMode,
      locale,
      maxCanvasPixels: ORG_EDITOR_EXPORT_PREVIEW_MAX_CANVAS_PIXELS,
      rootUnit: unit,
      scope,
      settings: imageSettings,
      units,
    })
      .then((blob) => {
        if (isCancelled) return;

        const nextUrl = URL.createObjectURL(blob);
        setPreviewUrl((currentUrl) => {
          if (currentUrl) URL.revokeObjectURL(currentUrl);
          return nextUrl;
        });
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
    employeeById,
    formatUnitSummary,
    imageSettings,
    isImageBossLabelValid,
    layoutMode,
    locale,
    open,
    scope,
    unit,
    units,
  ]);

  useEffect(() => {
    if (open) return;

    setStatus(null);
    setIsZoomPreviewOpen(false);
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

  const appendTemplateField = (fieldKey: string) => {
    setTemplateFormat((currentFormat) => `${currentFormat}{${fieldKey}}`);
    setStatus(null);
  };

  const appendImageEmployeeField = (fieldKey: string) => {
    updateImageSettings({ employeeFormat: `${imageSettings.employeeFormat}{${fieldKey}}` });
  };

  const createImageBlob = () => {
    if (!unit) throw new Error("No Unit is selected for export.");

    return createOrgEditorUnitImageBlob({
      employeeById,
      formatUnitSummary,
      layoutMode,
      locale,
      rootUnit: unit,
      scope,
      settings: imageSettings,
      units,
    });
  };

  const createTextExport = () =>
    createExportTextAsync({
      ...jsonSettings,
      rows: exportRows,
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

  const isSolidBackgroundActive = imageSettings.background.type === "solid";
  const solidColor =
    imageSettings.background.type === "solid" ? imageSettings.background.color : "#ffffff";

  return (
    <>
      <Dialog onOpenChange={onOpenChange} open={open}>
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
                  <TabsTrigger value="subtree">{t("Entire subtree")}</TabsTrigger>
                  <TabsTrigger value="unit">{t("Unit only")}</TabsTrigger>
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
                <section className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label>{t("Preview")}</Label>
                    <Button
                      disabled={!previewUrl}
                      onClick={() => setIsZoomPreviewOpen(true)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <HiOutlineMagnifyingGlassPlus />
                      {t("Open")}
                    </Button>
                  </div>
                  <div
                    className="relative grid min-h-64 place-items-center overflow-hidden rounded-md border bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%),linear-gradient(-45deg,#f1f5f9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f9_75%),linear-gradient(-45deg,transparent_75%,#f1f5f9_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0] p-4"
                    data-demo-id="org-editor-export-image-preview"
                  >
                    {previewUrl && (
                      <Image
                        alt={t("Unit export preview")}
                        className="max-h-[360px] max-w-full object-contain"
                        data-demo-id="org-editor-export-image"
                        height={800}
                        src={previewUrl}
                        unoptimized
                        width={1200}
                      />
                    )}
                    {isPreviewLoading && (
                      <div className="absolute inset-0 grid place-items-center bg-background/80 text-sm text-muted-foreground">
                        {t("Preparing preview...")}
                      </div>
                    )}
                    {previewError && (
                      <div className="max-w-md rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                        {t(previewError)}
                      </div>
                    )}
                  </div>
                </section>

                <section className="grid gap-4 py-2">
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
                      <div
                        className={cn(
                          getBackgroundButtonClassName(isSolidBackgroundActive),
                          "inline-flex cursor-pointer items-center gap-2 rounded-md",
                        )}
                      >
                        <Input
                          className="h-6 w-8 border-0 p-0"
                          onChange={(event) =>
                            setImageBackground({
                              color: event.currentTarget.value,
                              type: "solid",
                            })
                          }
                          type="color"
                          value={solidColor}
                        />
                        {t("Color")}
                      </div>
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

                  <div className="grid gap-4 md:grid-cols-3">
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
                    <div className="grid gap-2">
                      <Label htmlFor="org-editor-export-font">{t("Font")}</Label>
                      <Select
                        onValueChange={(value) => updateImageSettings({ fontFamily: value })}
                        value={imageSettings.fontFamily}
                      >
                        <SelectTrigger id="org-editor-export-font">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ORG_EDITOR_EXPORT_FONTS.map((font) => (
                            <SelectItem key={font.family} value={font.family}>
                              <span style={{ fontFamily: font.family }}>{font.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                    <div className="grid gap-2">
                      <Label htmlFor="org-editor-export-title">{t("Title")}</Label>
                      <Input
                        id="org-editor-export-title"
                        onChange={(event) =>
                          updateImageSettings({ title: event.currentTarget.value })
                        }
                        placeholder={t("No title")}
                        value={imageSettings.title}
                      />
                    </div>
                    <div className="grid gap-2 md:w-32">
                      <Label htmlFor="org-editor-export-title-font-size">{t("Size")}</Label>
                      <Input
                        id="org-editor-export-title-font-size"
                        max={48}
                        min={12}
                        onChange={(event) =>
                          updateImageSettings({
                            titleFontSize: Number.parseInt(event.currentTarget.value || "20", 10),
                          })
                        }
                        type="number"
                        value={imageSettings.titleFontSize}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t("Alignment")}</Label>
                      <Tabs
                        onValueChange={(value) =>
                          updateImageSettings({ titleAlign: value as OrgEditorExportTitleAlign })
                        }
                        value={imageSettings.titleAlign}
                      >
                        <TabsList>
                          <TabsTrigger value="left">{t("Left")}</TabsTrigger>
                          <TabsTrigger value="center">{t("Center")}</TabsTrigger>
                          <TabsTrigger value="right">{t("Right")}</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>

                  <div className="grid gap-3 pt-2">
                    <div className="grid gap-2">
                      <Label>{t("Employee format")}</Label>
                      <div className="flex min-w-0 flex-wrap gap-2">
                        {visibleImageEmployeeFields.map((field) => (
                          <Button
                            key={field.key}
                            onClick={() => appendImageEmployeeField(field.key)}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            {field.label}
                          </Button>
                        ))}
                        <Button
                          onClick={() => appendImageEmployeeField("isBoss")}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          isBoss
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="org-editor-export-employee-format">{t("Format")}</Label>
                      <Textarea
                        className="h-20 resize-none"
                        id="org-editor-export-employee-format"
                        onChange={(event) =>
                          updateImageSettings({ employeeFormat: event.currentTarget.value })
                        }
                        value={imageSettings.employeeFormat}
                      />
                    </div>
                    {hasImageBossToken && (
                      <div className="grid max-w-sm gap-2">
                        <Label htmlFor="org-editor-export-image-boss-label">
                          {t("isBoss value")}
                        </Label>
                        <Input
                          aria-invalid={!isImageBossLabelValid}
                          id="org-editor-export-image-boss-label"
                          onChange={(event) =>
                            updateImageSettings({ imageBossLabel: event.currentTarget.value })
                          }
                          value={imageSettings.imageBossLabel}
                        />
                        {!isImageBossLabelValid && (
                          <p className="text-xs text-destructive">
                            {t("The boss value cannot be empty.")}
                          </p>
                        )}
                      </div>
                    )}
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
                  <div className="flex items-center justify-between gap-3">
                    <Label>{t("Preview")}</Label>
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
                  employeeFields={visibleEmployeeFields}
                  format={templateFormat}
                  onAppendField={appendTemplateField}
                  onFormatChange={(value) => {
                    setTemplateFormat(value);
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
                  unitFields={exportUnitFields}
                >
                  <div className="grid max-w-md gap-2">
                    <Label htmlFor="org-editor-export-row-mode">
                      {t("When an Employee belongs to multiple Units")}
                    </Label>
                    <Select
                      onValueChange={(value) => {
                        setRowMode(value as ExportRowMode);
                        setStatus(null);
                      }}
                      value={rowMode}
                    >
                      <SelectTrigger id="org-editor-export-row-mode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {exportRowModeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {t(option.title as UiTextKey)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </ExportTemplateSettings>
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
              disabled={activeTab === "image" ? !canExportImage : !canExportText}
              onClick={copy}
              type="button"
              variant="outline"
            >
              <HiOutlineClipboardDocument />
              {t("Copy")}
            </Button>
            <Button
              disabled={activeTab === "image" ? !canExportImage : !canExportText}
              onClick={download}
              type="button"
            >
              <HiOutlineArrowDownTray />
              {t("Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setIsZoomPreviewOpen} open={isZoomPreviewOpen}>
        <DialogContent className="flex h-[calc(100dvh-40px)] max-w-[calc(100vw-40px)] flex-col overflow-hidden p-0">
          <DialogHeader>
            <DialogTitle>{t("Image preview")}</DialogTitle>
          </DialogHeader>
          <DialogBody className="grid flex-1 place-items-center overflow-auto bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%),linear-gradient(-45deg,#f1f5f9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f9_75%),linear-gradient(-45deg,transparent_75%,#f1f5f9_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0]">
            {previewUrl && (
              <Image
                alt={t("Expanded Unit export preview")}
                className="max-h-full max-w-full object-contain"
                height={1200}
                src={previewUrl}
                unoptimized
                width={1800}
              />
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
