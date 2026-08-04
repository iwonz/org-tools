"use client";

import { useEffect, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";

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
import { describeError, type UiMessageDescriptor } from "@/i18n/messages";
import { useMessageText, useUiText } from "@/i18n/use-ui-text";
import { createCroppedAvatarDataUrl, type PreparedAvatarSource } from "@/lib/avatar-image";

export function AvatarCropDialog({
  onApply,
  onOpenChange,
  source,
}: {
  onApply: (dataUrl: string) => void;
  onOpenChange: (open: boolean) => void;
  source: PreparedAvatarSource | null;
}) {
  const t = useUiText();
  const messageText = useMessageText();
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropPixels, setCropPixels] = useState<Area | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<UiMessageDescriptor | null>(null);

  useEffect(() => {
    if (!source) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropPixels(null);
    setError(null);
  }, [source]);

  const apply = async () => {
    if (!source || !cropPixels) return;
    setIsApplying(true);
    setError(null);
    try {
      onApply(await createCroppedAvatarDataUrl(source.url, cropPixels));
      onOpenChange(false);
    } catch (applyError) {
      setError(describeError(applyError));
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={source !== null}>
      <DialogContent className="max-w-2xl" data-demo-id="avatar-crop-dialog">
        <DialogHeader>
          <DialogTitle>{t("Crop avatar")}</DialogTitle>
          <DialogDescription>
            {t("Move the image and adjust zoom inside the circle.")}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="grid gap-4">
          <div className="relative h-[min(52dvh,460px)] min-h-72 overflow-hidden rounded-md bg-slate-950">
            {source && (
              <Cropper
                aspect={1}
                crop={crop}
                cropShape="round"
                image={source.url}
                maxZoom={4}
                mediaProps={{ alt: "" }}
                minZoom={1}
                objectFit="contain"
                onCropChange={setCrop}
                onCropComplete={(_area, areaPixels) => setCropPixels(areaPixels)}
                onZoomChange={setZoom}
                restrictPosition
                roundCropAreaPixels
                showGrid={false}
                zoom={zoom}
              />
            )}
          </div>
          <label className="grid gap-2 text-sm font-medium">
            <span>{t("Zoom")}</span>
            <input
              aria-label={t("Zoom")}
              className="w-full accent-primary"
              max={4}
              min={1}
              onChange={(event) => setZoom(Number(event.currentTarget.value))}
              step={0.01}
              type="range"
              value={zoom}
            />
          </label>
          {error && (
            <div className="text-sm text-destructive" role="alert">
              {messageText(error)}
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <Button disabled={isApplying} onClick={() => onOpenChange(false)} variant="outline">
            {t("Cancel")}
          </Button>
          <Button disabled={!cropPixels || isApplying} onClick={() => void apply()}>
            {isApplying ? t("Preparing image…") : t("Use avatar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
