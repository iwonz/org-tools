"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { HiMinus, HiOutlineArrowsPointingIn, HiPlus } from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import { useUiText } from "@/i18n/use-ui-text";
import {
  createFittedImagePreviewViewport,
  type ImagePreviewSize,
  type ImagePreviewViewport,
  panImagePreviewViewport,
  preserveImagePreviewViewport,
  zoomImagePreviewViewport,
} from "@/lib/image-preview-viewport";
import { cn } from "@/lib/utils";

type PreviewGeometry = {
  container: ImagePreviewSize;
  image: ImagePreviewSize;
};

export function OrgEditorImagePreview({
  alt,
  className,
  dataDemoId,
  emptyLabel,
  errorLabel,
  height,
  imageDataDemoId,
  loading,
  loadingLabel,
  src,
  width,
}: {
  alt: string;
  className?: string;
  dataDemoId: string;
  emptyLabel?: string;
  errorLabel?: string | null;
  height: number;
  imageDataDemoId?: string;
  loading: boolean;
  loadingLabel: string;
  src: string | null;
  width: number;
}) {
  const t = useUiText();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previousGeometryRef = useRef<PreviewGeometry | null>(null);
  const dragRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const [containerSize, setContainerSize] = useState<ImagePreviewSize>({ height: 0, width: 0 });
  const [viewport, setViewport] = useState<ImagePreviewViewport | null>(null);
  const imageSize = useMemo(() => ({ height, width }), [height, width]);
  const hasImage = Boolean(src && height > 0 && width > 0);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const updateSize = () => {
      const bounds = container.getBoundingClientRect();
      setContainerSize({ height: bounds.height, width: bounds.width });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (!hasImage || containerSize.height <= 0 || containerSize.width <= 0) {
      if (!hasImage) {
        setViewport(null);
        previousGeometryRef.current = null;
      }
      return;
    }
    const nextGeometry = { container: containerSize, image: imageSize };
    const previousGeometry = previousGeometryRef.current;
    setViewport((current) =>
      current && previousGeometry
        ? preserveImagePreviewViewport({
            nextContainer: nextGeometry.container,
            nextImage: nextGeometry.image,
            previousContainer: previousGeometry.container,
            previousImage: previousGeometry.image,
            viewport: current,
          })
        : createFittedImagePreviewViewport(nextGeometry.container, nextGeometry.image),
    );
    previousGeometryRef.current = nextGeometry;
  }, [containerSize, hasImage, imageSize]);

  const zoomTo = useCallback(
    (scale: number, focalPoint = { x: containerSize.width / 2, y: containerSize.height / 2 }) => {
      if (!hasImage) return;
      setViewport((current) =>
        current
          ? zoomImagePreviewViewport({
              container: containerSize,
              focalPoint,
              image: imageSize,
              scale,
              viewport: current,
            })
          : current,
      );
    },
    [containerSize, hasImage, imageSize],
  );

  const panBy = useCallback(
    (delta: { x: number; y: number }) => {
      if (!hasImage) return;
      setViewport((current) =>
        current
          ? panImagePreviewViewport({
              container: containerSize,
              delta,
              image: imageSize,
              viewport: current,
            })
          : current,
      );
    },
    [containerSize, hasImage, imageSize],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !hasImage) return;
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const bounds = container.getBoundingClientRect();
      const focalPoint = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
      setViewport((current) =>
        current
          ? zoomImagePreviewViewport({
              container: containerSize,
              focalPoint,
              image: imageSize,
              scale: current.scale * Math.exp(-event.deltaY * 0.0015),
              viewport: current,
            })
          : current,
      );
    };
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [containerSize, hasImage, imageSize]);

  return (
    <section
      aria-label={alt}
      className={cn(
        "relative min-h-64 overflow-hidden rounded-xl border bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%),linear-gradient(-45deg,#f1f5f9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f9_75%),linear-gradient(-45deg,transparent_75%,#f1f5f9_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0] outline-none focus-visible:ring-2 focus-visible:ring-ring",
        hasImage && "cursor-grab active:cursor-grabbing",
        className,
      )}
      data-demo-id={dataDemoId}
      data-preview-mode={viewport?.mode ?? "empty"}
      data-preview-scale={viewport?.scale ?? 0}
      onKeyDown={(event) => {
        const delta =
          event.key === "ArrowLeft"
            ? { x: 32, y: 0 }
            : event.key === "ArrowRight"
              ? { x: -32, y: 0 }
              : event.key === "ArrowUp"
                ? { x: 0, y: 32 }
                : event.key === "ArrowDown"
                  ? { x: 0, y: -32 }
                  : null;
        if (!delta) return;
        event.preventDefault();
        panBy(delta);
      }}
      onPointerDown={(event) => {
        if (!hasImage || event.button !== 0) return;
        event.preventDefault();
        event.currentTarget.focus();
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        const delta = { x: event.clientX - drag.x, y: event.clientY - drag.y };
        dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
        panBy(delta);
      }}
      onPointerUp={(event) => {
        if (dragRef.current?.pointerId !== event.pointerId) return;
        dragRef.current = null;
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      ref={containerRef}
      tabIndex={hasImage ? 0 : -1}
    >
      {src && viewport && (
        <Image
          alt={alt}
          className="pointer-events-none absolute left-0 top-0 max-w-none select-none"
          data-demo-id={imageDataDemoId}
          draggable={false}
          height={height}
          src={src}
          style={{
            height,
            transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.scale})`,
            transformOrigin: "top left",
            width,
          }}
          unoptimized
          width={width}
        />
      )}
      {src && viewport && (
        <div
          className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-lg border border-border/80 bg-background/95 p-1 shadow-sm"
          data-preview-controls
          onPointerDown={(event) => event.stopPropagation()}
        >
          <Button
            aria-label={t("Zoom out")}
            className="size-7 p-0"
            onClick={() => zoomTo(viewport.scale / 1.2)}
            title={t("Zoom out")}
            type="button"
            variant="ghost"
          >
            <HiMinus />
          </Button>
          <Button
            aria-label={t("Zoom in")}
            className="size-7 p-0"
            onClick={() => zoomTo(viewport.scale * 1.2)}
            title={t("Zoom in")}
            type="button"
            variant="ghost"
          >
            <HiPlus />
          </Button>
          <Button
            aria-label={t("Actual size")}
            className="h-7 px-2 text-xs font-normal"
            onClick={() => zoomTo(1)}
            title={t("Actual size")}
            type="button"
            variant="ghost"
          >
            100%
          </Button>
          <Button
            className="h-7 px-2 text-xs font-normal"
            onClick={() => setViewport(createFittedImagePreviewViewport(containerSize, imageSize))}
            title={t("Fit")}
            type="button"
            variant="ghost"
          >
            <HiOutlineArrowsPointingIn aria-hidden="true" />
            {t("Fit")}
          </Button>
        </div>
      )}
      {loading && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-background/80 text-sm text-muted-foreground">
          {loadingLabel}
        </div>
      )}
      {!loading && errorLabel && (
        <div className="absolute inset-0 z-20 grid place-items-center p-4">
          <p className="max-w-md rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {errorLabel}
          </p>
        </div>
      )}
      {!loading && !errorLabel && !src && emptyLabel && (
        <div className="absolute inset-0 grid place-items-center p-4 text-sm text-muted-foreground">
          {emptyLabel}
        </div>
      )}
    </section>
  );
}
