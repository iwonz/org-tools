"use client";

import type {
  Employee,
  EmployeeId,
  OrgEditorCanvasElement,
  OrgEditorLayoutMode,
  OrgEditorUnit,
  OrgEditorUnitId,
  OrgEditorViewSettings,
  TagId,
} from "@org-tools/types";
import Image from "next/image";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  HiOutlineBars3,
  HiOutlineBars3BottomLeft,
  HiOutlineBars3BottomRight,
} from "react-icons/hi2";

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
import {
  createDefaultOrgEditorImageExportSettings,
  createOrgEditorImageExportResult,
  createOrgEditorImageRenderPlan,
  ORG_EDITOR_EXPORT_FONTS,
  ORG_EDITOR_EXPORT_GRADIENTS,
  ORG_EDITOR_EXPORT_MAX_CANVAS_PIXELS,
  ORG_EDITOR_EXPORT_PREVIEW_AVATAR_LOAD_LIMIT,
  ORG_EDITOR_EXPORT_PREVIEW_MAX_CANVAS_PIXELS,
  type OrgEditorExportTitleAlign,
  orgEditorTemplateContainsBossToken,
} from "@/lib/org-editor-export";
import { downloadBlob } from "@/lib/org-file";

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
  units: OrgEditorUnit[];
  viewName: string;
  viewSettings: OrgEditorViewSettings;
}) {
  const t = useUiText();
  const locale = useLocale();
  const countText = useCountText();
  const managerLabel = t("Manager");
  const previousManagerLabel = useRef(managerLabel);
  const [settings, setSettings] = useState(() =>
    createDefaultOrgEditorImageExportSettings(managerLabel),
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [plan, setPlan] = useState<ReturnType<typeof createOrgEditorImageRenderPlan> | null>(null);
  const [status, setStatus] = useState<"copied" | "error" | "saved" | null>(null);

  useEffect(() => {
    if (previousManagerLabel.current === managerLabel) return;
    setSettings((current) =>
      current.imageBossLabel === previousManagerLabel.current
        ? { ...current, imageBossLabel: managerLabel }
        : current,
    );
    previousManagerLabel.current = managerLabel;
  }, [managerLabel]);

  const formatUnitSummary = useCallback(
    (summary: OrgEditorUnitEmployeeSummary) => {
      const direct = countText("employees", { count: summary.directCount });
      return summary.hasChildUnits
        ? `${direct} · ${countText("totalEmployees", { count: summary.totalCount })}`
        : direct;
    },
    [countText],
  );
  const validBossLabel =
    !orgEditorTemplateContainsBossToken(settings.employeeFormat) ||
    settings.imageBossLabel.trim().length > 0;
  const hasContent = units.length > 0 || canvasElements.length > 0;
  const render = useCallback(
    (maxCanvasPixels = ORG_EDITOR_EXPORT_MAX_CANVAS_PIXELS) =>
      createOrgEditorImageExportResult({
        canvasElements,
        distributionEnabledUnitIds,
        distributionUnitIdsByEmployeeId,
        employeeById,
        formatUnitSummary,
        layoutMode,
        locale,
        maxCanvasPixels,
        rootUnit: null,
        scope: "view",
        settings,
        tagOrder,
        units,
        viewSettings,
        ...(maxCanvasPixels === ORG_EDITOR_EXPORT_PREVIEW_MAX_CANVAS_PIXELS
          ? { avatarLoadLimit: ORG_EDITOR_EXPORT_PREVIEW_AVATAR_LOAD_LIMIT }
          : {}),
      }),
    [
      canvasElements,
      distributionEnabledUnitIds,
      distributionUnitIdsByEmployeeId,
      employeeById,
      formatUnitSummary,
      layoutMode,
      locale,
      settings,
      tagOrder,
      units,
      viewSettings,
    ],
  );

  useEffect(() => {
    if (!open || !validBossLabel) return;
    if (!hasContent) {
      setPreviewLoading(false);
      setPreviewError(false);
      setPlan(null);
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
        setPlan(
          createOrgEditorImageRenderPlan({
            logicalHeight: result.plan.logicalHeight,
            logicalWidth: result.plan.logicalWidth,
            requestedDensity: settings.density,
          }),
        );
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
  }, [hasContent, open, render, settings.density, validBossLabel]);

  useEffect(() => {
    if (open) return;
    setStatus(null);
    setPlan(null);
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
          <section className="flex min-h-72 items-center justify-center overflow-hidden rounded-xl border bg-muted/30 p-4">
            {previewUrl && !previewError && (
              <Image
                alt={t("View export preview")}
                className="max-h-[640px] max-w-full object-contain"
                height={900}
                src={previewUrl}
                unoptimized
                width={1400}
              />
            )}
            {previewLoading && (
              <p className="text-sm text-muted-foreground">{t("Preparing preview...")}</p>
            )}
            {previewError && (
              <p className="text-sm text-destructive">{t("Could not prepare the preview.")}</p>
            )}
            {!hasContent && (
              <p className="text-sm text-muted-foreground">
                {t("The View has no content to export as an image.")}
              </p>
            )}
          </section>
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
            {plan && (
              <div
                className="rounded-lg border bg-muted/30 p-3 text-sm"
                data-demo-id="org-editor-view-image-dimensions"
              >
                <p>
                  {t("Final image: {width} × {height} px", {
                    height: plan.pixelHeight,
                    width: plan.pixelWidth,
                  })}
                </p>
                <p className="text-muted-foreground">
                  {t("Effective density: {density}×", {
                    density: plan.effectiveDensity.toFixed(2),
                  })}
                </p>
                {plan.clamped && (
                  <p className="text-amber-700">
                    {t("Density was reduced to fit safe PNG limits.")}
                  </p>
                )}
              </div>
            )}
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
                <Label>{t("Font")}</Label>
                <Select
                  onValueChange={(fontFamily) => update({ fontFamily })}
                  value={settings.fontFamily}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORG_EDITOR_EXPORT_FONTS.map((font) => (
                      <SelectItem key={font.family} value={font.family}>
                        {font.label}
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
            <div className="grid gap-2">
              <Label>{t("Employee format")}</Label>
              <Input
                onChange={(event) => update({ employeeFormat: event.currentTarget.value })}
                value={settings.employeeFormat}
              />
            </div>
            {orgEditorTemplateContainsBossToken(settings.employeeFormat) && (
              <div className="grid gap-2">
                <Label>{t("isBoss value")}</Label>
                <Input
                  aria-invalid={!validBossLabel}
                  onChange={(event) => update({ imageBossLabel: event.currentTarget.value })}
                  value={settings.imageBossLabel}
                />
              </div>
            )}
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
              disabled={!hasContent || !validBossLabel || previewLoading}
              onClick={() => void copy()}
              type="button"
              variant="outline"
            >
              {t("Copy")}
            </Button>
            <Button
              disabled={!hasContent || !validBossLabel || previewLoading}
              onClick={() => void save()}
              type="button"
            >
              {t("Save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
