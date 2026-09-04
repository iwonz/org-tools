"use client";

import type { Employee, OrgEditorUnit, OrgEditorUnitId } from "@org-tools/types";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  HiOutlineArrowsPointingIn,
  HiOutlineBuildingOffice2,
  HiOutlineMapPin,
  HiOutlineMinus,
  HiOutlinePlus,
} from "react-icons/hi2";

import { EmployeeAvatar } from "@/components/employee-avatar";
import { EmployeeIdentity } from "@/components/employee-card-list";
import { EmployeeTags } from "@/components/employee-tags";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCountText, useUiText } from "@/i18n/use-ui-text";
import {
  createEditorPlacementMapLayout,
  getEditorPlacementMapFitViewport,
} from "@/lib/editor-distribution";
import { cn } from "@/lib/utils";

type PlacementViewport = { scale: number; x: number; y: number };

const MIN_SCALE = 0.2;
const MAX_SCALE = 2;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function EmployeePlacementDialog({
  employee,
  onLocate,
  onOpenChange,
  open,
  sourceUnitId,
  textDirection,
  units,
}: {
  employee: Employee;
  onLocate: (unitId: OrgEditorUnitId) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  sourceUnitId: OrgEditorUnitId;
  textDirection: "ltr" | "rtl";
  units: OrgEditorUnit[];
}) {
  const t = useUiText();
  const countText = useCountText();
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const panRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    viewport: PlacementViewport;
  } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ height: 480, width: 720 });
  const sortedUnits = useMemo(
    () =>
      [...units].sort(
        (first, second) =>
          first.name.localeCompare(second.name, undefined, {
            numeric: true,
            sensitivity: "base",
          }) || String(first.id).localeCompare(String(second.id)),
      ),
    [units],
  );
  const unitById = useMemo(
    () => new Map(sortedUnits.map((unit) => [unit.id, unit] as const)),
    [sortedUnits],
  );
  const layout = useMemo(
    () => createEditorPlacementMapLayout(sortedUnits.map((unit) => unit.id)),
    [sortedUnits],
  );
  const fitViewport = useCallback(
    () =>
      getEditorPlacementMapFitViewport({
        bounds: layout.bounds,
        height: canvasSize.height,
        width: canvasSize.width,
      }),
    [canvasSize.height, canvasSize.width, layout.bounds],
  );
  const [viewport, setViewport] = useState<PlacementViewport>(() =>
    getEditorPlacementMapFitViewport({
      bounds: layout.bounds,
      height: canvasSize.height,
      width: canvasSize.width,
    }),
  );

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const updateSize = () => {
      const bounds = canvas.getBoundingClientRect();
      const nextSize = {
        height: Math.max(1, Math.round(bounds.height)),
        width: Math.max(1, Math.round(bounds.width)),
      };
      setCanvasSize((current) =>
        current.height === nextSize.height && current.width === nextSize.width ? current : nextSize,
      );
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const bounds = canvas.getBoundingClientRect();
      const screenX = event.clientX - bounds.left;
      const screenY = event.clientY - bounds.top;
      setViewport((current) => {
        const nextScale = clamp(
          current.scale * (event.deltaY > 0 ? 0.9 : 1.1),
          MIN_SCALE,
          MAX_SCALE,
        );
        const worldX = (screenX - current.x) / current.scale;
        const worldY = (screenY - current.y) / current.scale;
        return {
          scale: nextScale,
          x: screenX - worldX * nextScale,
          y: screenY - worldY * nextScale,
        };
      });
    };
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    if (open) setViewport(fitViewport());
  }, [fitViewport, open]);

  const zoomAtCenter = (scale: number) => {
    setViewport((current) => {
      const nextScale = clamp(scale, MIN_SCALE, MAX_SCALE);
      const centerX = canvasSize.width / 2;
      const centerY = canvasSize.height / 2;
      const worldX = (centerX - current.x) / current.scale;
      const worldY = (centerY - current.y) / current.scale;
      return {
        scale: nextScale,
        x: centerX - worldX * nextScale,
        y: centerY - worldY * nextScale,
      };
    });
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className="flex h-[min(760px,calc(100dvh-24px))] max-w-5xl flex-col"
        data-demo-id="employee-placement-dialog"
      >
        <DialogHeader>
          <DialogTitle>
            {t("Employee placements for {name}", { name: employee.fullName })}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="flex min-h-0 flex-1 p-0">
          <div
            aria-label={t("Employee placement map for {name}", { name: employee.fullName })}
            className="relative min-h-0 flex-1 touch-none overflow-hidden bg-canvas"
            data-demo-id="employee-placement-canvas"
            data-placement-scale={viewport.scale}
            data-placement-x={viewport.x}
            data-placement-y={viewport.y}
            dir="ltr"
            onPointerCancel={(event) => {
              if (panRef.current?.pointerId !== event.pointerId) return;
              panRef.current = null;
            }}
            onPointerDown={(event) => {
              if (event.button !== 0 || event.target !== event.currentTarget) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              panRef.current = {
                pointerId: event.pointerId,
                startClientX: event.clientX,
                startClientY: event.clientY,
                viewport,
              };
            }}
            onPointerMove={(event) => {
              const pan = panRef.current;
              if (!pan || pan.pointerId !== event.pointerId) return;
              setViewport({
                ...pan.viewport,
                x: pan.viewport.x + event.clientX - pan.startClientX,
                y: pan.viewport.y + event.clientY - pan.startClientY,
              });
            }}
            onPointerUp={(event) => {
              if (panRef.current?.pointerId !== event.pointerId) return;
              panRef.current = null;
              event.currentTarget.releasePointerCapture(event.pointerId);
            }}
            ref={canvasRef}
            role="application"
          >
            <div
              className="pointer-events-none absolute left-0 top-0"
              style={{
                transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
                transformOrigin: "0 0",
              }}
            >
              <svg
                aria-hidden="true"
                className="absolute left-0 top-0 overflow-visible"
                height="1"
                width="1"
              >
                {layout.units.map((node) => (
                  <line
                    className="stroke-signal/60"
                    data-placement-connection={node.unitId}
                    key={node.unitId}
                    strokeLinecap="round"
                    strokeWidth="2.5"
                    x1="0"
                    x2={node.x + node.width / 2}
                    y1="0"
                    y2={node.y + node.height / 2}
                  />
                ))}
              </svg>
              <div
                className="pointer-events-auto absolute flex items-start gap-3 overflow-hidden rounded-lg bg-card p-3 text-card-foreground ring-2 ring-signal"
                data-placement-node="employee"
                dir={textDirection}
                style={{
                  height: layout.employee.height,
                  left: layout.employee.x,
                  top: layout.employee.y,
                  width: layout.employee.width,
                }}
              >
                <EmployeeAvatar className="mt-0.5 size-11 shrink-0" employee={employee} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{employee.fullName}</div>
                  <EmployeeIdentity employee={employee} includePositions />
                  <EmployeeTags className="mt-1" compact tags={employee.tags} />
                </div>
              </div>
              {layout.units.map((node) => {
                const unit = unitById.get(node.unitId);
                if (!unit) return null;
                return (
                  <div
                    className={cn(
                      "pointer-events-auto absolute flex items-center gap-2 rounded-lg bg-card p-2 text-card-foreground ring-1 ring-border",
                      unit.id === sourceUnitId && "ring-2 ring-signal/70",
                    )}
                    data-placement-node="unit"
                    data-placement-unit-id={unit.id}
                    dir={textDirection}
                    key={unit.id}
                    style={{ height: node.height, left: node.x, top: node.y, width: node.width }}
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                      <HiOutlineBuildingOffice2 className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium">{unit.name}</div>
                      <div className="truncate text-[10px] text-muted-foreground">
                        {countText("employees", { count: unit.employeeIds.length })}
                      </div>
                    </div>
                    <Button
                      aria-label={t("Locate {name} in Unit {unit}", {
                        name: employee.fullName,
                        unit: unit.name,
                      })}
                      className="size-7 shrink-0"
                      data-demo-id="employee-placement-locate"
                      onClick={() => onLocate(unit.id)}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <HiOutlineMapPin className="size-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
            <div className="absolute bottom-3 start-3 z-10 flex items-center gap-1 rounded-lg bg-background/95 p-1.5 backdrop-blur-md">
              <Button
                aria-label={t("Zoom out")}
                onClick={() => zoomAtCenter(viewport.scale * 0.9)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <HiOutlineMinus className="size-4" />
              </Button>
              <Button
                aria-label={t("Zoom in")}
                onClick={() => zoomAtCenter(viewport.scale * 1.1)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <HiOutlinePlus className="size-4" />
              </Button>
              <Button
                aria-label={t("Reset zoom")}
                className="min-w-14 px-2 text-xs"
                onClick={() => zoomAtCenter(1)}
                size="sm"
                type="button"
                variant="ghost"
              >
                {Math.round(viewport.scale * 100)}%
              </Button>
              <Button
                aria-label={t("Fit placement map")}
                data-demo-id="employee-placement-fit"
                onClick={() => setViewport(fitViewport())}
                size="icon"
                type="button"
                variant="ghost"
              >
                <HiOutlineArrowsPointingIn className="size-4" />
              </Button>
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
