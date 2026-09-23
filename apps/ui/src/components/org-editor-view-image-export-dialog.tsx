"use client";

import type {
  Employee,
  EmployeeId,
  EmployeeTagDefinition,
  OrgEditorCanvasElement,
  OrgEditorLayoutMode,
  OrgEditorUnit,
  OrgEditorUnitId,
  OrgEditorViewSettings,
  TagId,
} from "@org-tools/types";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  HiOutlineArrowDownTray,
  HiOutlineBars3,
  HiOutlineBars3BottomLeft,
  HiOutlineBars3BottomRight,
  HiOutlineClipboardDocument,
} from "react-icons/hi2";

import { createEmployeeDisplayFormatTokens } from "@/components/employee-display-format-tokens";
import { OrgEditorImagePreview } from "@/components/org-editor-image-preview";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UiTextKey } from "@/i18n/messages";
import { useCountText, useUiText } from "@/i18n/use-ui-text";
import type { OrgEditorUnitEmployeeSummary } from "@/lib/org-editor";
import { getOrgEditorCanvasCssFontFamily } from "@/lib/org-editor-canvas";
import {
  createDefaultOrgEditorImageExportSettings,
  createOrgEditorImageExportResult,
  ORG_EDITOR_EXPORT_FONTS,
  ORG_EDITOR_EXPORT_GRADIENTS,
  ORG_EDITOR_EXPORT_MAX_CANVAS_PIXELS,
  ORG_EDITOR_EXPORT_PREVIEW_AVATAR_LOAD_LIMIT,
  ORG_EDITOR_EXPORT_PREVIEW_MAX_CANVAS_PIXELS,
  type OrgEditorExportTitleAlign,
} from "@/lib/org-editor-export";
import { downloadBlob } from "@/lib/org-file";
import { useOrgStore } from "@/stores/org-store-context";

const sanitizeViewImageName = (name: string) =>
  name
    .normalize("NFKC")
    .trim()
    .replace(/[^\p{L}\p{N}_-]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 80) || "org-editor-view";

export function OrgEditorViewImageExportDialog({
  canvasElements,
  distributionEnabledUnitIds,
  distributionUnitIdsByEmployeeId,
  employeeById,
  layoutMode,
  onOpenChange,
  open,
  tagOrder,
  tagDefinitions,
  units,
  viewName,
  viewSettings,
}: {
  canvasElements: readonly OrgEditorCanvasElement[];
  distributionEnabledUnitIds: ReadonlySet<OrgEditorUnitId>;
  distributionUnitIdsByEmployeeId: ReadonlyMap<EmployeeId, readonly OrgEditorUnitId[]>;
  employeeById: ReadonlyMap<EmployeeId, Employee>;
  layoutMode: OrgEditorLayoutMode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  tagOrder: readonly TagId[];
  tagDefinitions: readonly EmployeeTagDefinition[];
  units: OrgEditorUnit[];
  viewName: string;
  viewSettings: OrgEditorViewSettings;
}) {
  const t = useUiText();
  const store = useOrgStore();
  const locale = useLocale();
  const countText = useCountText();
  const positionNotSpecifiedLabel = t("Position not specified");
  const [settings, setSettings] = useState(() =>
    createDefaultOrgEditorImageExportSettings(
      store.employeeDisplayFormats.editorExport,
      store.employeeDisplayLineGaps.editorExport,
    ),
  );
  const previousImageOpenRef = useRef(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [previewSize, setPreviewSize] = useState({ height: 0, width: 0 });
  const [status, setStatus] = useState<"copied" | "error" | "saved" | null>(null);
  const employeeFormatTokens = useMemo(
    () => createEmployeeDisplayFormatTokens(store.employeeFieldDefinitions, t),
    [store.employeeFieldDefinitions, t],
  );

  useEffect(() => {
    if (open && !previousImageOpenRef.current) {
      setSettings((current) => ({
        ...current,
        employeeFormat: store.employeeDisplayFormats.editorExport,
        employeeLineGap: store.employeeDisplayLineGaps.editorExport,
      }));
    }
    previousImageOpenRef.current = open;
  }, [open, store.employeeDisplayFormats.editorExport, store.employeeDisplayLineGaps.editorExport]);

  const formatUnitSummary = useCallback(
    (summary: OrgEditorUnitEmployeeSummary) => {
      const direct = countText("employees", { count: summary.directCount });
      return summary.hasChildUnits
        ? `${direct} · ${countText("totalEmployees", { count: summary.totalCount })}`
        : direct;
    },
    [countText],
  );
  const hasContent = units.length > 0 || canvasElements.length > 0;
  const render = useCallback(
    (maxCanvasPixels = ORG_EDITOR_EXPORT_MAX_CANVAS_PIXELS) =>
      createOrgEditorImageExportResult({
        canvasElements,
        customEmployeeFieldDefinitions: store.employeeFieldDefinitions,
        distributionEnabledUnitIds,
        distributionUnitIdsByEmployeeId,
        employeeById,
        formatUnitSummary,
        layoutMode,
        locale,
        maxCanvasPixels,
        positionNotSpecifiedLabel,
        rootUnit: null,
        scope: "view",
        settings,
        tagOrder,
        tagDefinitions,
        units,
        viewSettings,
        ...(maxCanvasPixels === ORG_EDITOR_EXPORT_PREVIEW_MAX_CANVAS_PIXELS
          ? { avatarLoadLimit: ORG_EDITOR_EXPORT_PREVIEW_AVATAR_LOAD_LIMIT }
          : {}),
      }),
    [
      canvasElements,
      store.employeeFieldDefinitions,
      distributionEnabledUnitIds,
      distributionUnitIdsByEmployeeId,
      employeeById,
      formatUnitSummary,
      layoutMode,
      locale,
      positionNotSpecifiedLabel,
      settings,
      tagOrder,
      tagDefinitions,
      units,
      viewSettings,
    ],
  );

  useEffect(() => {
    if (!open) return;
    if (!hasContent) {
      setPreviewLoading(false);
      setPreviewError(false);
      setPreviewSize({ height: 0, width: 0 });
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    setPreviewError(false);
    void render(ORG_EDITOR_EXPORT_PREVIEW_MAX_CANVAS_PIXELS)
      .then((result) => {
        if (cancelled) return;
        const url = URL.createObjectURL(result.blob);
        setPreviewUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return url;
        });
        setPreviewSize({ height: result.plan.pixelHeight, width: result.plan.pixelWidth });
      })
      .catch(() => {
        if (!cancelled) setPreviewError(true);
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hasContent, open, render]);

  useEffect(() => {
    if (open) return;
    setStatus(null);
    setPreviewSize({ height: 0, width: 0 });
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }, [open]);

  const update = (patch: Partial<typeof settings>) => {
    setSettings((current) => ({ ...current, ...patch }));
    setStatus(null);
  };
  const save = async () => {
    try {
      const { blob } = await render();
      downloadBlob(blob, `${sanitizeViewImageName(viewName)}.png`);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  };
  const copy = async () => {
    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") throw new Error();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": render().then((result) => result.blob) }),
      ]);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className="flex h-[min(880px,calc(100dvh-32px))] max-w-5xl flex-col overflow-hidden p-0"
        data-demo-id="org-editor-view-image-export-dialog"
      >
        <DialogHeader>
          <DialogTitle>{t("Export View image")}</DialogTitle>
          <DialogDescription>
            {t("Export the complete View with Units and canvas elements.")}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="grid min-h-0 flex-1 gap-5 overflow-y-auto lg:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.7fr)]">
          <OrgEditorImagePreview
            alt={t("View export preview")}
            className="min-h-72 lg:min-h-0"
            dataDemoId="org-editor-view-image-preview"
            {...(hasContent
              ? {}
              : { emptyLabel: t("The View has no content to export as an image.") })}
            errorLabel={previewError ? t("Could not prepare the preview.") : null}
            height={previewSize.height}
            loading={previewLoading}
            loadingLabel={t("Preparing preview...")}
            src={previewError ? null : previewUrl}
            width={previewSize.width}
          />
          <section className="grid content-start gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>{t("Density")}</Label>
                <Select
                  onValueChange={(value) => update({ density: Number(value) as 1 | 2 | 3 })}
                  value={String(settings.density)}
                >
                  <SelectTrigger
                    aria-label={t("Density")}
                    data-demo-id="org-editor-view-image-density"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1×</SelectItem>
                    <SelectItem value="2">2×</SelectItem>
                    <SelectItem value="3">3×</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t("Padding")}</Label>
                <Input
                  max={100}
                  min={0}
                  onChange={(event) => update({ padding: Number(event.currentTarget.value) })}
                  type="number"
                  value={settings.padding}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>{t("Background")}</Label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                <Button
                  className="h-10 px-2"
                  onClick={() => update({ background: { type: "transparent" } })}
                  type="button"
                  variant={settings.background.type === "transparent" ? "secondary" : "outline"}
                >
                  <span className="size-5 rounded border bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%,transparent_75%,#e2e8f0_75%),linear-gradient(45deg,#e2e8f0_25%,white_25%,white_75%,#e2e8f0_75%)] bg-[length:8px_8px] bg-[position:0_0,4px_4px]" />
                  <span className="sr-only">{t("Transparent")}</span>
                </Button>
                <label
                  className="relative flex h-10 cursor-pointer items-center justify-center rounded-md border border-input bg-background"
                  htmlFor="org-editor-view-image-background-color"
                >
                  <Input
                    aria-label={t("Background color")}
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                    id="org-editor-view-image-background-color"
                    onChange={(event) =>
                      update({ background: { color: event.currentTarget.value, type: "solid" } })
                    }
                    type="color"
                    value={
                      settings.background.type === "solid" ? settings.background.color : "#ffffff"
                    }
                  />
                  <span
                    className="size-5 rounded border"
                    style={{
                      backgroundColor:
                        settings.background.type === "solid"
                          ? settings.background.color
                          : "#ffffff",
                    }}
                  />
                </label>
                {ORG_EDITOR_EXPORT_GRADIENTS.map((gradient) => (
                  <Button
                    aria-label={t(gradient.label as UiTextKey)}
                    className="h-10 px-2"
                    key={gradient.id}
                    onClick={() =>
                      update({ background: { gradientId: gradient.id, type: "gradient" } })
                    }
                    title={t(gradient.label as UiTextKey)}
                    type="button"
                    variant={
                      settings.background.type === "gradient" &&
                      settings.background.gradientId === gradient.id
                        ? "secondary"
                        : "outline"
                    }
                  >
                    <span
                      aria-hidden="true"
                      className="size-5 rounded border"
                      style={{ background: gradient.previewCss }}
                    />
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>{t("Corner radius")}</Label>
                <Input
                  max={100}
                  min={0}
                  onChange={(event) =>
                    update({ unitBorderRadius: Number(event.currentTarget.value) })
                  }
                  type="number"
                  value={settings.unitBorderRadius}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="org-editor-view-export-font">{t("Font")}</Label>
                <Select
                  onValueChange={(fontFamily) => update({ fontFamily })}
                  value={settings.fontFamily}
                >
                  <SelectTrigger id="org-editor-view-export-font">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORG_EDITOR_EXPORT_FONTS.map((font) => (
                      <SelectItem key={font.family} value={font.family}>
                        <span style={{ fontFamily: getOrgEditorCanvasCssFontFamily(font.family) }}>
                          {font.family === "system-ui" ? t("System") : font.family}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>{t("Title")}</Label>
              <Input
                onChange={(event) => update({ title: event.currentTarget.value })}
                placeholder={t("No title")}
                value={settings.title}
              />
            </div>
            <div className="grid grid-cols-[7rem_1fr] gap-3">
              <div className="grid gap-2">
                <Label>{t("Size")}</Label>
                <Input
                  max={48}
                  min={12}
                  onChange={(event) => update({ titleFontSize: Number(event.currentTarget.value) })}
                  type="number"
                  value={settings.titleFontSize}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("Alignment")}</Label>
                <Tabs
                  onValueChange={(value) =>
                    update({ titleAlign: value as OrgEditorExportTitleAlign })
                  }
                  value={settings.titleAlign}
                >
                  <TabsList>
                    <TabsTrigger aria-label={t("Left")} value="left">
                      <HiOutlineBars3BottomLeft />
                    </TabsTrigger>
                    <TabsTrigger aria-label={t("Center")} value="center">
                      <HiOutlineBars3 />
                    </TabsTrigger>
                    <TabsTrigger aria-label={t("Right")} value="right">
                      <HiOutlineBars3BottomRight />
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
            <TemplateFormatInput
              dataDemoId="org-editor-view-image-employee-format"
              id="org-editor-view-image-employee-format"
              inlineMarkdownTools
              label={t("Employee format")}
              onChange={(employeeFormat) => update({ employeeFormat })}
              tokens={employeeFormatTokens}
              value={settings.employeeFormat}
            />
          </section>
        </DialogBody>
        <DialogFooter className="items-center sm:justify-between">
          <p
            className={
              status === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"
            }
          >
            {status === "saved"
              ? t("Image saved")
              : status === "copied"
                ? t("Image copied to the clipboard")
                : status === "error"
                  ? t("Could not save the export.")
                  : ""}
          </p>
          <div className="flex gap-2">
            <Button
              disabled={!hasContent || previewLoading}
              onClick={() => void copy()}
              type="button"
              variant="outline"
            >
              <HiOutlineClipboardDocument />
              {t("Copy")}
            </Button>
            <Button
              disabled={!hasContent || previewLoading}
              onClick={() => void save()}
              type="button"
            >
              <HiOutlineArrowDownTray />
              {t("Save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
