"use client";

import type {
  Employee,
  EmployeeId,
  EmployeeTagColor,
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
import { HiOutlineArrowDownTray, HiOutlineClipboardDocument } from "react-icons/hi2";

import { createEmployeeDisplayFormatTokens } from "@/components/employee-display-format-tokens";
import { OrgEditorImagePreview } from "@/components/org-editor-image-preview";
import { TagColorPicker } from "@/components/tag-color-picker";
import { TemplateFormatInput } from "@/components/template-format-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UiTextKey } from "@/i18n/messages";
import { useCountText, useUiText } from "@/i18n/use-ui-text";
import type { OrgEditorUnitEmployeeSummary } from "@/lib/org-editor";
import {
  createDefaultOrgEditorImageExportSettings,
  createOrgEditorImageExportResult,
  ORG_EDITOR_EXPORT_GRADIENTS,
  ORG_EDITOR_EXPORT_MAX_CANVAS_PIXELS,
  ORG_EDITOR_EXPORT_PREVIEW_AVATAR_LOAD_LIMIT,
  ORG_EDITOR_EXPORT_PREVIEW_MAX_CANVAS_PIXELS,
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
        </DialogHeader>
        <DialogBody className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
          <OrgEditorImagePreview
            alt={t("View export preview")}
            className="h-[360px] shrink-0"
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
          <section className="grid gap-4 py-2" data-demo-id="org-editor-view-image-settings">
            <div className="grid grid-cols-2 gap-3">
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
            </div>
            <div className="grid gap-2">
              <Label>{t("Background")}</Label>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <Button
                  className="h-10 justify-start px-3"
                  onClick={() => update({ background: { type: "transparent" } })}
                  type="button"
                  variant={settings.background.type === "transparent" ? "secondary" : "outline"}
                >
                  <span className="size-5 rounded border bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%,transparent_75%,#e2e8f0_75%),linear-gradient(45deg,#e2e8f0_25%,white_25%,white_75%,#e2e8f0_75%)] bg-[length:8px_8px] bg-[position:0_0,4px_4px]" />
                  {t("Transparent")}
                </Button>
                <TagColorPicker
                  allowNoColor={false}
                  label={t("Background color")}
                  onChange={(color: EmployeeTagColor | null) => {
                    if (color) update({ background: { color, type: "solid" } });
                  }}
                  value={
                    settings.background.type === "solid" ? settings.background.color : "#ffffff"
                  }
                />
                {ORG_EDITOR_EXPORT_GRADIENTS.map((gradient) => (
                  <Button
                    aria-label={t(gradient.label as UiTextKey)}
                    className="h-10 justify-start px-3"
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
                    {t(gradient.label as UiTextKey)}
                  </Button>
                ))}
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
