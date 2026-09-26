"use client";

import type { EmployeeTagColor } from "@org-tools/types";
import { toBlob, toPng } from "html-to-image";
import { useCallback, useEffect, useState } from "react";
import { HiOutlineClipboard, HiOutlineCloudArrowDown } from "react-icons/hi2";

import { OrgEditorImagePreview } from "@/components/org-editor-image-preview";
import { TagColorPicker } from "@/components/tag-color-picker";
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
import { useUiText } from "@/i18n/use-ui-text";
import {
  ORG_EDITOR_EXPORT_MAX_CANVAS_PIXELS,
  ORG_EDITOR_EXPORT_MAX_CANVAS_SIDE,
  ORG_EDITOR_EXPORT_PREVIEW_MAX_CANVAS_PIXELS,
} from "@/lib/org-editor-export";
import { downloadBlob } from "@/lib/org-file";
import { employeeTagColorToHex } from "@/lib/tag-color";

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

const safePixelRatio = (width: number, height: number, requested: number, maxPixels: number) =>
  Math.max(
    0.1,
    Math.min(
      requested,
      ORG_EDITOR_EXPORT_MAX_CANVAS_SIDE / Math.max(1, width),
      ORG_EDITOR_EXPORT_MAX_CANVAS_SIDE / Math.max(1, height),
      Math.sqrt(maxPixels / Math.max(1, width * height)),
    ),
  );

const dataUrlToBlob = async (url: string) => {
  const response = await fetch(url);
  return response.blob();
};

const assertLocalResources = (root: HTMLElement) => {
  for (const element of root.querySelectorAll<HTMLImageElement>("img")) {
    const source = element.currentSrc || element.src;
    if (
      source &&
      !source.startsWith("data:") &&
      new URL(source, window.location.href).origin !== window.location.origin
    ) {
      throw new Error("Remote image resources are not allowed in Analytics export.");
    }
  }
};

export function AnalyticsImageExportDialog({
  fileName,
  onOpenChange,
  open,
  target,
}: {
  fileName: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  target: HTMLElement | null;
}) {
  const t = useUiText();
  const [background, setBackground] = useState<EmployeeTagColor | null>(null);
  const [padding, setPadding] = useState(20);
  const [radius, setRadius] = useState(12);
  const [preview, setPreview] = useState<{ height: number; src: string; width: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const render = useCallback(
    async (maxPixels: number) => {
      if (!target) throw new Error("Export target is unavailable.");
      await document.fonts?.ready;
      await nextFrame();
      await nextFrame();
      assertLocalResources(target);
      const bounds = target.getBoundingClientRect();
      const width = Math.max(1, Math.ceil(bounds.width + padding * 2));
      const height = Math.max(1, Math.ceil(bounds.height + padding * 2));
      const mount = document.createElement("div");
      mount.style.cssText = "position:fixed;left:-100000px;top:0;pointer-events:none";
      const host = document.createElement("div");
      host.style.cssText = `width:${width}px;min-height:${height}px;padding:${padding}px;background:${background ? employeeTagColorToHex(background) : "transparent"};border-radius:${radius}px;overflow:hidden;box-sizing:border-box`;
      const clone = target.cloneNode(true) as HTMLElement;
      clone.style.width = `${Math.ceil(bounds.width)}px`;
      clone.querySelectorAll<HTMLElement>("[data-export-exclude]").forEach((node) => {
        node.remove();
      });
      host.append(clone);
      mount.append(host);
      document.body.append(mount);
      const sourceScrollAreas = target.querySelectorAll<HTMLElement>(
        "[data-analytics-table-scroll]",
      );
      const clonedScrollAreas = clone.querySelectorAll<HTMLElement>(
        "[data-analytics-table-scroll]",
      );
      sourceScrollAreas.forEach((source, index) => {
        const cloned = clonedScrollAreas.item(index);
        if (!cloned) return;
        cloned.scrollLeft = source.scrollLeft;
        cloned.scrollTop = source.scrollTop;
      });
      try {
        await nextFrame();
        await nextFrame();
        const pixelRatio = safePixelRatio(width, height, 3, maxPixels);
        const options = {
          ...(background ? { backgroundColor: employeeTagColorToHex(background) } : {}),
          cacheBust: false,
          filter: (node: HTMLElement) => !node.hasAttribute?.("data-export-exclude"),
          height,
          pixelRatio,
          skipAutoScale: true,
          width,
        };
        const src = await toPng(host, options);
        return {
          blob: await toBlob(host, options),
          height: Math.round(height * pixelRatio),
          src,
          width: Math.round(width * pixelRatio),
        };
      } finally {
        mount.remove();
      }
    },
    [background, padding, radius, target],
  );

  useEffect(() => {
    if (!open || !target) return;
    let current = true;
    setLoading(true);
    setError(null);
    void render(ORG_EDITOR_EXPORT_PREVIEW_MAX_CANVAS_PIXELS)
      .then(
        (result) => {
          if (current) setPreview(result);
        },
        (reason) => {
          if (current) setError(reason instanceof Error ? reason.message : String(reason));
        },
      )
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [open, render, target]);

  const createBlob = async () => {
    const result = await render(ORG_EDITOR_EXPORT_MAX_CANVAS_PIXELS);
    return result.blob ?? dataUrlToBlob(result.src);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className="flex max-h-[calc(100vh-2rem)] max-w-5xl flex-col"
        data-demo-id="analytics-image-export-dialog"
      >
        <DialogHeader>
          <DialogTitle>{t("Export PNG")}</DialogTitle>
        </DialogHeader>
        <DialogBody className="grid min-h-0 flex-1 gap-4 overflow-auto">
          <OrgEditorImagePreview
            alt={t("Analytics")}
            className="h-[420px]"
            dataDemoId="analytics-image-preview"
            errorLabel={error}
            height={preview?.height ?? 0}
            loading={loading}
            loadingLabel={t("Preparing preview...")}
            src={preview?.src ?? null}
            width={preview?.width ?? 0}
          />
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>{t("Background")}</Label>
              <TagColorPicker
                allowNoColor
                label={t("Background color")}
                onChange={setBackground}
                value={background}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="analytics-image-padding">{t("Padding")}</Label>
              <Input
                id="analytics-image-padding"
                max={100}
                min={0}
                onChange={(event) =>
                  setPadding(Math.max(0, Math.min(100, Number(event.target.value) || 0)))
                }
                type="number"
                value={padding}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="analytics-image-radius">{t("Corner radius")}</Label>
              <Input
                id="analytics-image-radius"
                max={64}
                min={0}
                onChange={(event) =>
                  setRadius(Math.max(0, Math.min(64, Number(event.target.value) || 0)))
                }
                type="number"
                value={radius}
              />
            </div>
          </section>
        </DialogBody>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
            {t("Cancel")}
          </Button>
          <Button
            onClick={() =>
              void createBlob().then((blob) =>
                navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]),
              )
            }
            type="button"
            variant="outline"
          >
            <HiOutlineClipboard />
            {t("Copy")}
          </Button>
          <Button
            onClick={() => void createBlob().then((blob) => downloadBlob(blob, `${fileName}.png`))}
            type="button"
          >
            <HiOutlineCloudArrowDown />
            {t("Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
