"use client";

import type {
  Employee,
  EmployeeId,
  EmployeeSearchDocument,
  OrgEditorCanvasViewport,
  OrgEditorEmployeePosition,
  OrgEditorLayoutMode,
  OrgEditorSelectedItem,
  OrgEditorUnit,
  OrgEditorUnitId,
  UnitId,
} from "@org-tools/types";
import { observer } from "mobx-react-lite";
import {
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type Ref,
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  HiOutlineArrowDownTray,
  HiOutlineArrowPath,
  HiOutlineArrowsPointingIn,
  HiOutlineArrowsPointingOut,
  HiOutlineBuildingOffice2,
  HiOutlineChevronRight,
  HiOutlineClipboard,
  HiOutlineDocumentDuplicate,
  HiOutlineFolder,
  HiOutlineMagnifyingGlass,
  HiOutlineMinus,
  HiOutlinePencilSquare,
  HiOutlinePlus,
  HiOutlineQueueList,
  HiOutlineSquares2X2,
  HiOutlineTag,
  HiOutlineTrash,
  HiOutlineUserGroup,
  HiOutlineUserMinus,
  HiOutlineUserPlus,
  HiOutlineUsers,
  HiOutlineViewColumns,
  HiOutlineViewfinderCircle,
  HiOutlineXMark,
} from "react-icons/hi2";

import { ActionIconButton } from "@/components/action-icon-button";
import { EmployeeAvatar } from "@/components/employee-avatar";
import { EmployeeDialog } from "@/components/employee-dialog";
import { EmployeeSourcePicker } from "@/components/employee-source-picker";
import { EmployeeTagPickerPanel } from "@/components/employee-tag-picker";
import { EmployeeTags } from "@/components/employee-tags";
import { HighlightedText } from "@/components/highlighted-text";
import { useAppLocale } from "@/components/locale-provider";
import { MiddleDot } from "@/components/middle-dot";
import { OrgEditorExportDialog } from "@/components/org-editor-export-dialog";
import { OrgEditorHistoryToolbar } from "@/components/org-editor-history-toolbar";
import { OrgViewToolbar } from "@/components/org-view-toolbar";
import {
  createEmptyEmployeeSearchFilters,
  filterEmployeesBySearch,
  getEmployeeSearchFiltersKey,
  getSearchTokens,
  normalizeSearchValue,
  UnitSearchInput,
} from "@/components/search-controls";
import { SourceEmptyState, TopLevelEmptyState } from "@/components/source-empty-state";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnitDialog } from "@/components/unit-dialog";
import { UnitStatusBadge } from "@/components/unit-status-badge";
import { UnitTree } from "@/components/unit-tree";
import { useAppFormatter, useCountText, useUiText } from "@/i18n/use-ui-text";
import {
  countEmployeeIdsInSelection,
  countEmployeeIdsNotInSelection,
} from "@/lib/employee-selection";
import type { EmployeeTagUpdate } from "@/lib/employee-tags";
import {
  buildEmployeeUnitContextIndex,
  buildEmployeeUnitMembershipIndex,
  type EmployeeUnitContext,
  type EmployeeUnitMembership,
} from "@/lib/employee-unit-contexts";
import type { OrgEditorSourceIndex } from "@/lib/org-editor";
import {
  buildOrgEditorUnitEmployeeSummaryById,
  buildOrgEditorUnitTagSummary,
  createOrgEditorSelectedItemKey,
  findOrgEditorEmployeeRowIndex,
  getAdaptiveOrgEditorGridSize,
  getOrgEditorEmployeeBounds,
  getOrgEditorEmployeeRowHeightForTagLabels,
  getOrgEditorEmployeeRowLayout,
  getOrgEditorEmployeeTextMaxWidth,
  getOrgEditorOrderedEmployeeIds,
  getOrgEditorUnitBounds,
  getOrgEditorUnitDescendantIds,
  getOrgEditorUnitDisplayName,
  getOrgEditorUnitHeight,
  getOrgEditorUnitTagFooterChipWidth,
  getOrgEditorUnitTagFooterHeight,
  getOrgEditorUnitWidth,
  getOrgEditorVisibleEmployeeIds,
  isPointInsideRect,
  ORG_EDITOR_GRID_SIZE,
  ORG_EDITOR_UNIT_EMPLOYEE_LIST_TOP_PADDING,
  ORG_EDITOR_UNIT_HEADER_HEIGHT,
  ORG_EDITOR_UNIT_HORIZONTAL_GAP,
  ORG_EDITOR_UNIT_TAG_FOOTER_CHIP_HORIZONTAL_PADDING,
  ORG_EDITOR_UNIT_TAG_FOOTER_COUNT_GAP,
  ORG_EDITOR_UNIT_VERTICAL_GAP,
  type OrgEditorUnitEmployeeSummary,
  type OrgEditorUnitTagSummary,
  setOrgEditorUnitEmployeeRowHeights,
  setOrgEditorUnitTagFooterHeight,
} from "@/lib/org-editor";
import {
  createLatestFrameScheduler,
  createSpatialIndex,
  getUnitPointerSelectionIntent,
} from "@/lib/org-editor-interaction";
import { customTagColorSurfaceStyle, tagColorSurfaceClassName } from "@/lib/tag-color";
import { getVisibleUnitIdsForNameSearch } from "@/lib/unit-search";
import { useUnitEmployeeSummary } from "@/lib/unit-summary";
import { cn } from "@/lib/utils";
import type { OrgEditorHistorySnapshot } from "@/stores/org-editor-store";
import { useOrgStore } from "@/stores/org-store-context";

type CanvasPoint = { x: number; y: number };
type CanvasRect = { height: number; width: number; x: number; y: number };
type ScreenPoint = { x: number; y: number };
type AddEmployeesSourceSection = "employees" | "units";

const EMPTY_EMPLOYEE_MAP = new Map<EmployeeId, Employee>();
const EMPTY_SEARCH_DOCUMENT_MAP = new Map<EmployeeId, EmployeeSearchDocument>();
type AddEmployeesTarget = {
  type: "newUnit";
  point: CanvasPoint;
};
type UnitDialogState = {
  parentId: OrgEditorUnitId | null;
  point: CanvasPoint;
  unitId: OrgEditorUnitId | null;
};
type OrgEditorConnectionEntry = {
  bounds: CanvasRect;
  parentUnit: OrgEditorUnit;
  unit: OrgEditorUnit;
};
type OrgEditorContextMenu =
  | {
      canvasPoint: CanvasPoint;
      screenPoint: ScreenPoint;
      type: "canvas";
    }
  | {
      canvasPoint: CanvasPoint;
      employeeId: EmployeeId;
      screenPoint: ScreenPoint;
      type: "employees";
      unitId: OrgEditorUnitId;
    }
  | {
      anchorUnitId: OrgEditorUnitId;
      canvasPoint: CanvasPoint;
      screenPoint: ScreenPoint;
      type: "units";
      unitIds: OrgEditorUnitId[];
    };

type DragState =
  | {
      startScreenPoint: ScreenPoint;
      startViewport: { scale: number; x: number; y: number };
      type: "pan";
    }
  | {
      currentScreenPoint: ScreenPoint;
      selectedItems: OrgEditorSelectedItem[];
      startCanvasPoint: CanvasPoint;
      startScreenPoint: ScreenPoint;
      type: "employee";
    }
  | {
      historySnapshot: OrgEditorHistorySnapshot;
      selectOnClick: OrgEditorSelectedItem | null;
      selectedUnitIds: OrgEditorUnitId[];
      startCanvasPoint: CanvasPoint;
      startUnitPositions: Array<{ unitId: OrgEditorUnitId; x: number; y: number }>;
      startScreenPoint: ScreenPoint;
      type: "unit";
    }
  | {
      currentScreenPoint: ScreenPoint;
      startScreenPoint: ScreenPoint;
      unitId: OrgEditorUnitId;
      type: "connection";
    }
  | {
      currentScreenPoint: ScreenPoint;
      startScreenPoint: ScreenPoint;
      type: "select";
    };

type OrgEditorSearchResult =
  | {
      id: string;
      type: "unit";
      unit: OrgEditorUnit;
    }
  | {
      employee: Employee;
      id: string;
      type: "employee";
      unit: OrgEditorUnit;
    };

const MIN_CANVAS_SCALE = 0.1;
const MAX_CANVAS_SCALE = 2.2;
const DRAG_START_THRESHOLD = 4;
const CANVAS_VIEWPORT_OVERSCAN_PX = 420;
const ORG_EDITOR_SPATIAL_CELL_SIZE = 512;
const ORG_EDITOR_WHEEL_COMMIT_DELAY_MS = 140;
const EMPLOYEE_ROW_OVERSCAN = 8;
const EMPLOYEE_LIST_VIRTUALIZATION_THRESHOLD = 80;
const INITIAL_CANVAS_SIZE = { height: 720, width: 1280 };
const ORG_EDITOR_SEARCH_RESULT_LIMIT = 36;
const ORG_EDITOR_SEARCH_VIEWPORT_MARGIN = 96;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const areViewportsEqual = (first: OrgEditorCanvasViewport, second: OrgEditorCanvasViewport) =>
  first.x === second.x && first.y === second.y && first.scale === second.scale;

const getPointerScreenPoint = (event: Pick<PointerEvent, "clientX" | "clientY">): ScreenPoint => ({
  x: event.clientX,
  y: event.clientY,
});

const getSelectionRect = (firstPoint: ScreenPoint, secondPoint: ScreenPoint) => ({
  height: Math.abs(secondPoint.y - firstPoint.y),
  width: Math.abs(secondPoint.x - firstPoint.x),
  x: Math.min(firstPoint.x, secondPoint.x),
  y: Math.min(firstPoint.y, secondPoint.y),
});

const matchesSearchTokens = (searchText: string, queryTokens: string[]) =>
  queryTokens.every((token) => searchText.includes(token));

const getOrgEditorEmployeeDragPreview = (
  dragState: DragState | null,
  employeeById: ReadonlyMap<EmployeeId, Employee>,
) => {
  if (dragState?.type !== "employee") return null;

  const dragDistance = Math.hypot(
    dragState.currentScreenPoint.x - dragState.startScreenPoint.x,
    dragState.currentScreenPoint.y - dragState.startScreenPoint.y,
  );

  if (dragDistance <= DRAG_START_THRESHOLD) return null;

  const seenItemKeys = new Set<string>();
  const employeeItems: Array<Extract<OrgEditorSelectedItem, { type: "employee" }>> = [];

  for (const item of dragState.selectedItems) {
    if (item.type !== "employee") continue;

    const itemKey = createOrgEditorSelectedItemKey(item);
    if (seenItemKeys.has(itemKey)) continue;

    seenItemKeys.add(itemKey);
    employeeItems.push(item);
  }

  const firstEmployeeItem = employeeItems[0];
  if (!firstEmployeeItem) return null;

  return {
    count: employeeItems.length,
    employee: employeeById.get(firstEmployeeItem.employeeId),
    point: dragState.currentScreenPoint,
  };
};

const getOrgEditorEmployeeDragSourceUnitIds = (selectedItems: OrgEditorSelectedItem[]) => {
  const unitIds = new Set<OrgEditorUnitId>();

  for (const item of selectedItems) {
    if (item.type === "employee") {
      unitIds.add(item.unitId);
    }
  }

  return unitIds;
};

const selectionModeFromEvent = (
  event: React.PointerEvent | React.MouseEvent,
): "replace" | "toggle" => (event.metaKey || event.ctrlKey ? "toggle" : "replace");

const getPrimaryOrgEditorRootUnit = (units: OrgEditorUnit[], layoutMode: OrgEditorLayoutMode) => {
  if (units.length === 0) return null;

  const unitById = new Map(units.map((unit) => [unit.id, unit] as const));
  const childrenByParentId = new Map<OrgEditorUnitId | null, OrgEditorUnit[]>();

  for (const unit of units) {
    const parentId = unit.parentId && unitById.has(unit.parentId) ? unit.parentId : null;
    const siblings = childrenByParentId.get(parentId) ?? [];

    siblings.push(unit);
    childrenByParentId.set(parentId, siblings);
  }

  const roots = childrenByParentId.get(null) ?? units;
  const getSubtreeMaxDepth = (rootUnit: OrgEditorUnit) => {
    let maxDepth = 1;
    const visitedUnitIds = new Set<OrgEditorUnitId>();
    const stack = [{ depth: 1, unit: rootUnit }];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current || visitedUnitIds.has(current.unit.id)) continue;

      visitedUnitIds.add(current.unit.id);
      maxDepth = Math.max(maxDepth, current.depth);

      for (const childUnit of childrenByParentId.get(current.unit.id) ?? []) {
        stack.push({ depth: current.depth + 1, unit: childUnit });
      }
    }

    return maxDepth;
  };

  return (
    [...roots]
      .map((unit) => ({ depth: getSubtreeMaxDepth(unit), unit }))
      .sort((firstCandidate, secondCandidate) => {
        if (firstCandidate.depth !== secondCandidate.depth) {
          return secondCandidate.depth - firstCandidate.depth;
        }

        if (layoutMode === "leftRight") {
          return (
            firstCandidate.unit.x - secondCandidate.unit.x ||
            firstCandidate.unit.y - secondCandidate.unit.y
          );
        }

        return (
          firstCandidate.unit.y - secondCandidate.unit.y ||
          firstCandidate.unit.x - secondCandidate.unit.x
        );
      })[0]?.unit ?? null
  );
};

const getOrgEditorConnectionPath = ({
  layoutMode,
  parentUnit,
  unit,
}: {
  layoutMode: OrgEditorLayoutMode;
  parentUnit: OrgEditorUnit;
  unit: OrgEditorUnit;
}) => {
  const parentHeight = getOrgEditorUnitHeight(parentUnit);
  const unitHeight = getOrgEditorUnitHeight(unit);
  const parentWidth = getOrgEditorUnitWidth(parentUnit);
  const unitWidth = getOrgEditorUnitWidth(unit);

  if (layoutMode === "topDown") {
    const parentX = parentUnit.x + parentWidth / 2;
    const parentY = parentUnit.y + parentHeight;
    const unitX = unit.x + unitWidth / 2;
    const unitY = unit.y;
    const middleY = parentY + (unitY - parentY) / 2;

    return `M ${parentX} ${parentY} C ${parentX} ${middleY}, ${unitX} ${middleY}, ${unitX} ${unitY}`;
  }

  const parentX = parentUnit.x + parentWidth;
  const parentY = parentUnit.y + parentHeight / 2;
  const unitX = unit.x;
  const unitY = unit.y + unitHeight / 2;
  const middleX = parentX + (unitX - parentX) / 2;

  return `M ${parentX} ${parentY} C ${middleX} ${parentY}, ${middleX} ${unitY}, ${unitX} ${unitY}`;
};

function OrgEditorFloatingMenu({ children, point }: { children: ReactNode; point: ScreenPoint }) {
  return (
    <div
      className="fixed z-50 grid min-w-60 gap-1 rounded-md border border-border/80 bg-popover p-1 text-popover-foreground shadow-[0_10px_28px_-22px_rgb(0_0_0/0.45)]"
      data-org-editor-context-menu
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => event.stopPropagation()}
      role="menu"
      style={{ left: point.x, top: point.y }}
    >
      {children}
    </div>
  );
}

function OrgEditorMenuButton({
  ariaExpanded,
  ariaHasPopup,
  buttonRef,
  children,
  dataDemoId,
  disabled = false,
  onClick,
  onFocus,
  onKeyDown,
  variant = "default",
}: {
  ariaExpanded?: boolean;
  ariaHasPopup?: "menu";
  buttonRef?: Ref<HTMLButtonElement>;
  children: ReactNode;
  dataDemoId?: string;
  disabled?: boolean;
  onClick: () => void;
  onFocus?: (event: ReactFocusEvent<HTMLButtonElement>) => void;
  onKeyDown?: (event: ReactKeyboardEvent<HTMLButtonElement>) => void;
  variant?: "default" | "destructive";
}) {
  if (disabled) return null;

  return (
    <Button
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHasPopup}
      className={cn(
        "h-8 w-full justify-start gap-2 rounded-sm border-0 bg-transparent px-2 text-left text-sm font-normal shadow-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
        variant === "destructive" &&
          "text-destructive hover:bg-destructive/10 hover:text-destructive",
      )}
      data-demo-id={dataDemoId}
      disabled={disabled}
      onClick={onClick}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      ref={buttonRef}
      size="sm"
      type="button"
      variant="ghost"
    >
      {children}
    </Button>
  );
}

function OrgEditorEmployeeTagSubmenu({
  employees,
  onApply,
  tagOptions,
}: {
  employees: Employee[];
  onApply: (updates: EmployeeTagUpdate[]) => void;
  tagOptions: string[];
}) {
  const t = useUiText();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const datePopoverOpenRef = useRef(false);
  const suppressNextFocusOpenRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<{
    offsetY: number;
    side: "left" | "right";
  }>({ offsetY: 0, side: "right" });

  const cancelClose = () => {
    if (closeTimeoutRef.current === null) return;
    window.clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = null;
  };
  const openSubmenu = () => {
    cancelClose();
    setOpen(true);
  };
  const closeSubmenu = () => {
    cancelClose();
    setOpen(false);
  };
  const scheduleClose = () => {
    if (datePopoverOpenRef.current) return;
    cancelClose();
    closeTimeoutRef.current = window.setTimeout(() => {
      setOpen(false);
      closeTimeoutRef.current = null;
    }, 120);
  };
  const focusSearch = () => {
    window.requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    });
  };

  useEffect(
    () => () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    },
    [],
  );

  useLayoutEffect(() => {
    if (!open) return;

    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;

    const triggerRect = trigger.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const viewportPadding = 8;
    const side =
      triggerRect.right + 4 + panelRect.width <= window.innerWidth - viewportPadding
        ? "right"
        : "left";
    const minOffsetY = viewportPadding - triggerRect.top;
    const maxOffsetY = window.innerHeight - viewportPadding - panelRect.height - triggerRect.top;

    setPlacement({
      offsetY: Math.min(Math.max(0, minOffsetY), Math.max(minOffsetY, maxOffsetY)),
      side,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isArrowLeftFromPanel =
        event.key === "ArrowLeft" &&
        event.target instanceof Node &&
        panelRef.current?.contains(event.target) &&
        !(event.target instanceof HTMLInputElement);
      if (event.key !== "Escape" && !isArrowLeftFromPanel) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      setOpen(false);
      suppressNextFocusOpenRef.current = true;
      triggerRef.current?.focus();
    };

    window.addEventListener("keydown", handleKeyDown, true);

    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [open]);

  return (
    <div
      className="relative"
      onBlurCapture={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node | null)) {
          scheduleClose();
        }
      }}
      onPointerEnter={openSubmenu}
      onPointerLeave={scheduleClose}
      ref={rootRef}
    >
      <OrgEditorMenuButton
        ariaExpanded={open}
        ariaHasPopup="menu"
        buttonRef={triggerRef}
        dataDemoId="org-editor-employee-tags-action"
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        onFocus={() => {
          if (suppressNextFocusOpenRef.current) {
            suppressNextFocusOpenRef.current = false;
            return;
          }

          openSubmenu();
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            openSubmenu();
            focusSearch();
          } else if (event.key === "Escape" && open) {
            event.preventDefault();
            event.stopPropagation();
            closeSubmenu();
          }
        }}
      >
        <HiOutlineTag />
        {t("Tags")}
        <HiOutlineChevronRight className="ml-auto" />
      </OrgEditorMenuButton>
      {open && (
        <div
          className={cn(
            "absolute z-[70] rounded-md border border-border/80 bg-popover text-popover-foreground shadow-[0_10px_28px_-22px_rgb(0_0_0/0.45)]",
            placement.side === "right" ? "left-[calc(100%+0.25rem)]" : "right-[calc(100%+0.25rem)]",
          )}
          data-demo-id="org-editor-employee-tags-submenu"
          ref={panelRef}
          role="menu"
          style={{ top: placement.offsetY }}
        >
          <EmployeeTagPickerPanel
            autoFocus={false}
            dataDemoId="org-editor-employee-tags-panel"
            employees={employees}
            onApply={onApply}
            onDatePopoverOpenChange={(datePopoverOpen) => {
              datePopoverOpenRef.current = datePopoverOpen;
              if (datePopoverOpen) cancelClose();
            }}
            tagOptions={tagOptions}
          />
        </div>
      )}
    </div>
  );
}

function OrgEditorToolbarButton({
  ariaLabel,
  children,
  className,
  dataDemoId,
  disabled = false,
  onClick,
  title,
}: {
  ariaLabel?: string;
  children: ReactNode;
  className?: string;
  dataDemoId?: string;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
}) {
  if (disabled) return null;

  return (
    <Button
      aria-label={ariaLabel}
      className={cn(
        "h-9 rounded-md border-0 bg-transparent font-normal shadow-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-inset",
        className,
      )}
      data-demo-id={dataDemoId}
      disabled={disabled}
      onClick={onClick}
      size="sm"
      title={title}
      type="button"
      variant="ghost"
    >
      {children}
    </Button>
  );
}

const ORG_EDITOR_TOOLBAR_SURFACE_CLASS_NAME = "rounded-lg bg-background/95 p-1.5 backdrop-blur-md";

function OrgEditorLayoutSwitch({
  layoutMode,
  onToggle,
}: {
  layoutMode: OrgEditorLayoutMode;
  onToggle: () => void;
}) {
  const t = useUiText();
  return (
    <Button
      aria-checked={layoutMode === "leftRight"}
      aria-label={t("Change layout direction")}
      className="h-9 gap-1 rounded-md border-0 bg-transparent px-1 shadow-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-inset"
      data-demo-id="org-editor-layout-switch"
      onClick={onToggle}
      role="switch"
      size="sm"
      title={
        layoutMode === "topDown"
          ? t("Switch to left-to-right layout")
          : t("Switch to top-to-bottom layout")
      }
      type="button"
      variant="ghost"
    >
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded text-muted-foreground transition-colors",
          layoutMode === "topDown" && "bg-primary text-primary-foreground",
        )}
      >
        <HiOutlineQueueList className="size-4" />
      </span>
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded text-muted-foreground transition-colors",
          layoutMode === "leftRight" && "bg-primary text-primary-foreground",
        )}
      >
        <HiOutlineViewColumns className="size-4" />
      </span>
    </Button>
  );
}

function OrgEditorSearchControl({
  onOpenChange,
  onQueryChange,
  onSelectResult,
  open,
  query,
  queryTokens,
  results,
}: {
  onOpenChange: (open: boolean) => void;
  onQueryChange: (query: string) => void;
  onSelectResult: (result: OrgEditorSearchResult) => void;
  open: boolean;
  query: string;
  queryTokens: string[];
  results: OrgEditorSearchResult[];
}) {
  const t = useUiText();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const hasQuery = query.trim().length > 0;

  useEffect(() => {
    if (!open) return;

    const frameId = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;

      onOpenChange(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onOpenChange, open]);

  return (
    <div
      className="relative flex items-center justify-end gap-1"
      data-demo-id="org-editor-search"
      onPointerDown={(event) => event.stopPropagation()}
      ref={rootRef}
    >
      <div
        className={cn(
          "grid overflow-hidden transition-all duration-200 ease-out",
          open ? "visible w-72 opacity-100" : "invisible w-0 opacity-0",
        )}
        data-demo-id="org-editor-search-field"
      >
        <div className="relative min-w-0">
          <Input
            aria-label={t("Search the Org Editor canvas")}
            className="h-9 rounded-md border-input bg-background pe-9 shadow-none focus-visible:ring-inset"
            data-demo-id="org-editor-search-input"
            onChange={(event) => onQueryChange(event.currentTarget.value)}
            placeholder={t("Unit or Employee")}
            ref={inputRef}
            value={query}
          />
          {query.length > 0 && (
            <Button
              aria-label={t("Clear search")}
              className="absolute end-1 top-1 size-7 p-0"
              onClick={() => onQueryChange("")}
              size="icon"
              type="button"
              variant="ghost"
            >
              <HiOutlineXMark className="size-4" />
            </Button>
          )}
        </div>
      </div>
      <OrgEditorToolbarButton
        ariaLabel={open ? t("Hide search") : t("Search canvas")}
        dataDemoId="org-editor-search-button"
        onClick={() => onOpenChange(!open)}
        title={t("Search canvas")}
      >
        <HiOutlineMagnifyingGlass />
      </OrgEditorToolbarButton>
      {open && hasQuery && (
        <div
          className="absolute end-0 top-11 z-50 w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-md border border-border/80 bg-popover text-popover-foreground shadow-[0_10px_28px_-22px_rgb(0_0_0/0.45)]"
          data-demo-id="org-editor-search-results"
        >
          {results.length === 0 ? (
            <div className="px-3 py-2.5 text-sm text-muted-foreground">{t("Nothing found")}</div>
          ) : (
            <div className="max-h-96 overflow-auto p-1">
              {results.map((result) => {
                const unitName = getOrgEditorUnitDisplayName(result.unit);

                return (
                  <button
                    className="grid w-full min-w-0 cursor-pointer gap-1 rounded-sm px-2 py-2 text-start outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground"
                    key={result.id}
                    onClick={() => onSelectResult(result)}
                    type="button"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="inline-flex h-5 shrink-0 items-center rounded bg-muted px-1.5 text-[11px] font-medium text-muted-foreground">
                        {result.type === "unit" ? t("Unit") : t("Employee")}
                      </span>
                      <span className="min-w-0 truncate text-sm font-medium">
                        {result.type === "unit" ? (
                          <HighlightedText queryTokens={queryTokens} text={unitName} />
                        ) : (
                          <HighlightedText
                            queryTokens={queryTokens}
                            text={result.employee.fullName}
                          />
                        )}
                      </span>
                    </span>
                    {result.type === "employee" ? (
                      <span className="grid min-w-0 gap-0.5 ps-[4.5rem] text-xs text-muted-foreground">
                        <span className="min-w-0 truncate">
                          <HighlightedText queryTokens={queryTokens} text={unitName} />
                        </span>
                        <span className="min-w-0 truncate">
                          {result.employee.username && (
                            <>
                              <HighlightedText
                                queryTokens={queryTokens}
                                text={`@${result.employee.username}`}
                              />
                              {result.employee.email && " · "}
                            </>
                          )}
                          {result.employee.email && (
                            <HighlightedText
                              queryTokens={queryTokens}
                              text={result.employee.email}
                            />
                          )}
                        </span>
                        <EmployeeTags
                          compact
                          queryTokens={queryTokens}
                          tags={result.employee.tags}
                        />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OrgEditorEmployeeDragPreview({
  count,
  employee,
  point,
}: {
  count: number;
  employee: Employee | undefined;
  point: ScreenPoint;
}) {
  const t = useUiText();
  const countText = useCountText();
  return (
    <div
      className="pointer-events-none fixed z-50 flex max-w-72 -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-md border bg-background/90 px-2.5 py-2 text-sm text-foreground opacity-85 shadow-[0_8px_20px_-16px_rgb(0_0_0/0.55)] backdrop-blur"
      data-org-editor-employee-drag-preview
      style={{
        left: point.x,
        top: point.y,
      }}
    >
      {employee ? (
        <EmployeeAvatar className="size-7 text-[10px]" employee={employee} />
      ) : (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <HiOutlineUsers className="size-4" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate font-medium">
          {employee?.fullName ?? t("Employee unavailable")}
        </span>
        <span className="block text-xs text-muted-foreground">
          {count === 1
            ? t("Move Employee")
            : t("Moving: {count}", { count: countText("employees", { count }) })}
        </span>
      </span>
    </div>
  );
}

function OrgEditorNode({
  employeeById,
  isConnectionDropTarget,
  isEmployeeDropTarget,
  layoutMode,
  onAddChild,
  onEditUnit,
  onConnectionPointerDown,
  onEmployeeContextMenu,
  onEmployeePointerDown,
  onUnitContextMenu,
  onUnitDoubleClick,
  onUnitPointerDown,
  selectedItemKeySet,
  summary,
  tagSummary,
  textDirection,
  unit,
  visibleWorldRect,
}: {
  employeeById: ReadonlyMap<EmployeeId, Employee>;
  isConnectionDropTarget: boolean;
  isEmployeeDropTarget: boolean;
  layoutMode: OrgEditorLayoutMode;
  onAddChild: (unitId: OrgEditorUnitId) => void;
  onEditUnit: (unit: OrgEditorUnit) => void;
  onConnectionPointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    unit: OrgEditorUnit,
  ) => void;
  onEmployeePointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    unit: OrgEditorUnit,
    employeeId: EmployeeId,
  ) => void;
  onEmployeeContextMenu: (
    event: React.MouseEvent<HTMLButtonElement>,
    unit: OrgEditorUnit,
    employeeId: EmployeeId,
  ) => void;
  onUnitContextMenu: (event: React.MouseEvent<HTMLFieldSetElement>, unit: OrgEditorUnit) => void;
  onUnitDoubleClick: (event: React.MouseEvent<HTMLFieldSetElement>, unit: OrgEditorUnit) => void;
  onUnitPointerDown: (event: React.PointerEvent<HTMLFieldSetElement>, unit: OrgEditorUnit) => void;
  selectedItemKeySet: ReadonlySet<string>;
  summary: OrgEditorUnitEmployeeSummary;
  tagSummary: OrgEditorUnitTagSummary[];
  textDirection: "ltr" | "rtl";
  unit: OrgEditorUnit;
  visibleWorldRect: CanvasRect;
}) {
  const t = useUiText();
  const countText = useCountText();
  const selected = selectedItemKeySet.has(
    createOrgEditorSelectedItemKey({ type: "unit", unitId: unit.id }),
  );
  const unitHeight = getOrgEditorUnitHeight(unit);
  const unitWidth = getOrgEditorUnitWidth(unit);
  const visibleEmployeeIds = getOrgEditorVisibleEmployeeIds(unit, employeeById);
  const employeeRowLayout = getOrgEditorEmployeeRowLayout(unit);
  const tagFooterHeight = unit.collapsed
    ? 0
    : getOrgEditorUnitTagFooterHeight(tagSummary, unitWidth - 16);
  const shouldRenderEmployeeList = !unit.collapsed || visibleEmployeeIds.length > 0;
  const employeeListHeight = Math.max(
    0,
    unitHeight - ORG_EDITOR_UNIT_HEADER_HEIGHT - tagFooterHeight,
  );
  const shouldVirtualizeEmployees =
    !unit.collapsed && visibleEmployeeIds.length > EMPLOYEE_LIST_VIRTUALIZATION_THRESHOLD;
  const visibleListTop =
    visibleWorldRect.y -
    unit.y -
    ORG_EDITOR_UNIT_HEADER_HEIGHT -
    ORG_EDITOR_UNIT_EMPLOYEE_LIST_TOP_PADDING;
  const visibleListBottom =
    visibleWorldRect.y +
    visibleWorldRect.height -
    unit.y -
    ORG_EDITOR_UNIT_HEADER_HEIGHT -
    ORG_EDITOR_UNIT_EMPLOYEE_LIST_TOP_PADDING;
  const firstVisibleEmployeeIndex = shouldVirtualizeEmployees
    ? clamp(
        findOrgEditorEmployeeRowIndex(employeeRowLayout, visibleListTop) - EMPLOYEE_ROW_OVERSCAN,
        0,
        visibleEmployeeIds.length,
      )
    : 0;
  const lastVisibleEmployeeIndex = shouldVirtualizeEmployees
    ? clamp(
        findOrgEditorEmployeeRowIndex(employeeRowLayout, visibleListBottom) +
          1 +
          EMPLOYEE_ROW_OVERSCAN,
        firstVisibleEmployeeIndex,
        visibleEmployeeIds.length,
      )
    : visibleEmployeeIds.length;
  const renderedEmployeeRows = visibleEmployeeIds
    .slice(firstVisibleEmployeeIndex, lastVisibleEmployeeIndex)
    .map((employeeId, index) => ({
      employeeId,
      index: firstVisibleEmployeeIndex + index,
    }));

  return (
    <fieldset
      aria-label={t("Canvas Unit {name}", { name: getOrgEditorUnitDisplayName(unit) })}
      className={cn(
        "group absolute flex min-w-0 select-none flex-col rounded-lg border bg-card p-0 text-card-foreground transition-colors",
        selected ? "!border-signal" : "border-border",
        isConnectionDropTarget && "border-signal bg-accent/45 ring-2 ring-signal/25",
        isEmployeeDropTarget && "border-signal bg-accent/45 ring-2 ring-signal/25",
      )}
      data-org-editor-unit-id={unit.id}
      data-org-editor-rendered-employee-count={renderedEmployeeRows.length}
      data-org-editor-total-employee-count={visibleEmployeeIds.length}
      dir={textDirection}
      onContextMenu={(event) => onUnitContextMenu(event, unit)}
      onDoubleClick={(event) => onUnitDoubleClick(event, unit)}
      onPointerDown={(event) => onUnitPointerDown(event, unit)}
      style={{
        height: unitHeight,
        left: unit.x,
        top: unit.y,
        width: unitWidth,
      }}
    >
      <Button
        aria-label={t("Drag Unit connection")}
        className={cn(
          "absolute z-20 size-5 cursor-crosshair rounded-full bg-background/95 p-0 opacity-0 backdrop-blur transition-opacity hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100",
          layoutMode === "leftRight"
            ? "-left-2.5 top-1/2 -translate-y-1/2"
            : "-top-2.5 left-1/2 -translate-x-1/2",
        )}
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onConnectionPointerDown(event, unit);
        }}
        size="icon"
        title={t("Drag Unit connection")}
        type="button"
        variant="outline"
      >
        <span className="size-2 rounded-full bg-primary" />
      </Button>
      <Button
        aria-label={t("Add child Unit")}
        className={cn(
          "absolute z-10 size-8 rounded-full bg-background/95 p-0 opacity-0 backdrop-blur transition-opacity hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100",
          layoutMode === "leftRight"
            ? "-right-4 top-1/2 -translate-y-1/2"
            : "-bottom-4 left-1/2 -translate-x-1/2",
        )}
        onClick={(event) => {
          event.stopPropagation();
          onAddChild(unit.id);
        }}
        onPointerDown={(event) => event.stopPropagation()}
        size="icon"
        title={t("Add child Unit")}
        type="button"
        variant="outline"
      >
        <HiOutlinePlus className="size-4" />
      </Button>
      <div
        className="grid shrink-0 gap-1.5 p-2"
        data-org-editor-unit-header
        style={{ height: ORG_EDITOR_UNIT_HEADER_HEIGHT }}
      >
        <div className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground">
            <HiOutlineBuildingOffice2 className="size-4" />
          </span>
          <span
            className="min-w-0 flex-1 truncate text-sm font-medium"
            data-org-editor-unit-title={unit.id}
          >
            {unit.name}
          </span>
        </div>
        <div className="flex min-w-0 items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="min-w-0 truncate">
            {countText("employees", { count: summary.directCount })}
            {summary.hasChildUnits && (
              <>
                {" · "}
                {countText("totalEmployees", { count: summary.totalCount })}
              </>
            )}
          </span>
          <UnitStatusBadge
            className="rounded px-1.5 py-0.5 text-[9px]"
            membershipMode={unit.liveFilter === null ? "manual" : "live"}
          />
        </div>
      </div>
      {shouldRenderEmployeeList && (
        <div
          className={cn("p-2", shouldVirtualizeEmployees ? "relative" : "grid")}
          style={shouldVirtualizeEmployees ? { height: employeeListHeight } : undefined}
        >
          {visibleEmployeeIds.length === 0 ? (
            unit.liveFilter !== null ? (
              <div className="px-2 py-1 text-xs text-muted-foreground">
                {t("No Live filter matches")}
              </div>
            ) : (
              <Button
                className="h-8 justify-start px-2 text-xs font-normal"
                onClick={(event) => {
                  event.stopPropagation();
                  onEditUnit(unit);
                }}
                onPointerDown={(event) => event.stopPropagation()}
                type="button"
                variant="secondary"
              >
                <HiOutlinePencilSquare className="size-4" />
                {t("Edit Unit")}
              </Button>
            )
          ) : (
            renderedEmployeeRows.map(({ employeeId, index: employeeIndex }) => {
              const employee = employeeById.get(employeeId);
              const employeeSelected = selectedItemKeySet.has(
                createOrgEditorSelectedItemKey({
                  employeeId,
                  type: "employee",
                  unitId: unit.id,
                }),
              );
              const isBoss = unit.bossEmployeeId === employeeId;

              return (
                <button
                  className={cn(
                    "flex min-w-0 items-center gap-2 overflow-hidden rounded-md px-2 text-start text-xs outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
                    unit.liveFilter === null
                      ? "cursor-grab active:cursor-grabbing"
                      : "cursor-default",
                    employeeSelected && "bg-primary text-primary-foreground hover:bg-primary",
                  )}
                  data-org-editor-employee-id={employeeId}
                  data-org-editor-employee-row
                  key={`${unit.id}:${employeeId}`}
                  onContextMenu={(event) => onEmployeeContextMenu(event, unit, employeeId)}
                  onPointerDown={(event) => onEmployeePointerDown(event, unit, employeeId)}
                  style={{
                    height: employeeRowLayout.heights[employeeIndex],
                    ...(shouldVirtualizeEmployees
                      ? {
                          left: 8,
                          position: "absolute",
                          right: 8,
                          top:
                            ORG_EDITOR_UNIT_EMPLOYEE_LIST_TOP_PADDING +
                            (employeeRowLayout.offsets[employeeIndex] ?? 0),
                        }
                      : {}),
                  }}
                  title={employee?.fullName ?? t("Employee unavailable")}
                  type="button"
                >
                  <span className="relative inline-flex shrink-0" data-org-editor-employee-avatar>
                    {employee ? (
                      <EmployeeAvatar
                        className={cn(
                          "size-5 text-[9px]",
                          isBoss && "ring-2 ring-[#2787f5] ring-offset-1 ring-offset-background",
                        )}
                        employee={employee}
                      />
                    ) : (
                      <span
                        className={cn(
                          "flex size-5 items-center justify-center rounded-full bg-muted text-muted-foreground",
                          isBoss && "ring-2 ring-[#2787f5] ring-offset-1 ring-offset-background",
                        )}
                      >
                        <HiOutlineUsers className="size-3" />
                      </span>
                    )}
                    {isBoss && (
                      <span className="absolute left-1/2 top-full inline-flex size-3.5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#2787f5] text-[8px] font-semibold leading-none text-white ring-1 ring-background">
                        <HiOutlineUserGroup className="size-2.5" />
                      </span>
                    )}
                  </span>
                  <span
                    className="flex h-full min-w-0 flex-1 flex-col justify-center overflow-hidden py-1 pe-1"
                    data-org-editor-employee-content
                  >
                    <span className="truncate">
                      {employee?.fullName ?? t("Employee unavailable")}
                    </span>
                    {employee && (
                      <EmployeeTags
                        className={cn(
                          "mt-0.5",
                          employeeSelected && "[&_span]:text-primary-foreground",
                        )}
                        compact
                        density="canvas"
                        tags={employee.tags}
                      />
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
      {!unit.collapsed && tagSummary.length > 0 && (
        <div
          className="mt-auto flex shrink-0 flex-wrap content-start gap-1 rounded-b-[7px] bg-muted/45 p-2"
          data-org-editor-unit-tag-footer
          style={{ minHeight: tagFooterHeight }}
        >
          {tagSummary.map((tag) => (
            <span
              className={cn(
                "inline-flex h-5 max-w-full items-center rounded-md text-[10px] leading-none",
                tagColorSurfaceClassName(tag.color),
              )}
              data-tag-color={tag.color ?? "none"}
              key={tag.tagId}
              style={{
                ...customTagColorSurfaceStyle(tag.color),
                paddingInline: ORG_EDITOR_UNIT_TAG_FOOTER_CHIP_HORIZONTAL_PADDING,
                width: getOrgEditorUnitTagFooterChipWidth(tag, getOrgEditorUnitWidth(unit) - 16),
              }}
            >
              <span className="truncate">{tag.label}</span>
              <span
                className="opacity-70"
                style={{ marginInlineStart: ORG_EDITOR_UNIT_TAG_FOOTER_COUNT_GAP }}
              >
                · {tag.count}
              </span>
            </span>
          ))}
        </div>
      )}
      {isEmployeeDropTarget && (
        <div
          className="pointer-events-none absolute inset-2 z-30 grid place-items-center rounded-md border-2 border-dashed border-signal bg-background/80 px-3 py-2 text-center text-xs font-medium text-signal backdrop-blur-sm"
          data-org-editor-employee-drop-area
        >
          {t("Move here")}
        </div>
      )}
    </fieldset>
  );
}

function AddEmployeesDialog({
  employeeSearchDocumentByEmployeeId,
  employeeUnitMembershipsByEmployeeId,
  employees,
  onAdd,
  onCreate,
  onOpenChange,
  open,
  positionOptions,
  tagOptions,
  unitContextsByEmployeeId,
  units,
}: {
  employeeSearchDocumentByEmployeeId: ReadonlyMap<EmployeeId, EmployeeSearchDocument>;
  employeeUnitMembershipsByEmployeeId: ReadonlyMap<EmployeeId, EmployeeUnitMembership>;
  employees: Employee[];
  onAdd: (employeeIds: EmployeeId[]) => void;
  onCreate?: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  positionOptions: string[];
  tagOptions: string[];
  unitContextsByEmployeeId: ReadonlyMap<EmployeeId, EmployeeUnitContext[]>;
  units: NonNullable<ReturnType<typeof useOrgStore>["units"]>;
}) {
  const getUnitEmployeeSummary = useUnitEmployeeSummary();
  const t = useUiText();
  const countText = useCountText();
  const format = useAppFormatter();
  const roots = units.roots;
  const hasUnits = roots.length > 0;
  const [sourceSection, setSourceSection] = useState<AddEmployeesSourceSection>(
    hasUnits ? "units" : "employees",
  );
  const [unitQuery, setUnitQuery] = useState("");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(createEmptyEmployeeSearchFilters);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<EmployeeId>>(() => new Set());
  const [expandedPickerUnitIds, setExpandedPickerUnitIds] = useState<Set<UnitId>>(
    () => new Set(roots.map((root) => root.id)),
  );
  const deferredQuery = useDeferredValue(query);
  const queryTokens = useMemo(() => getSearchTokens(deferredQuery), [deferredQuery]);
  const unitQueryTokens = useMemo(() => getSearchTokens(unitQuery), [unitQuery]);
  const visibleUnitIds = useMemo(
    () => getVisibleUnitIdsForNameSearch(units.indexes.unitSearchDocuments, unitQueryTokens),
    [unitQueryTokens, units.indexes.unitSearchDocuments],
  );
  const hasVisibleUnits = visibleUnitIds === null || visibleUnitIds.size > 0;
  const foundEmployees = useMemo(
    () =>
      filterEmployeesBySearch({
        employeeSearchDocumentByEmployeeId,
        employeeUnitMembershipsByEmployeeId,
        employees,
        filters,
        queryTokens,
      }),
    [
      employeeSearchDocumentByEmployeeId,
      employeeUnitMembershipsByEmployeeId,
      employees,
      filters,
      queryTokens,
    ],
  );
  const foundEmployeesToAdd = useMemo(
    () => foundEmployees.filter((employee) => !selectedEmployeeIds.has(employee.id)),
    [foundEmployees, selectedEmployeeIds],
  );
  const foundEmployeesToRemove = useMemo(
    () => foundEmployees.filter((employee) => selectedEmployeeIds.has(employee.id)),
    [foundEmployees, selectedEmployeeIds],
  );

  useEffect(() => {
    if (!open) {
      setSourceSection(hasUnits ? "units" : "employees");
      setUnitQuery("");
      setQuery("");
      setFilters(createEmptyEmployeeSearchFilters());
      setSelectedEmployeeIds(new Set());
      setExpandedPickerUnitIds(new Set(roots.map((root) => root.id)));
    }
  }, [hasUnits, open, roots]);

  const togglePickerUnit = (unitId: UnitId) => {
    setExpandedPickerUnitIds((currentUnitIds) => {
      const nextUnitIds = new Set(currentUnitIds);

      if (nextUnitIds.has(unitId)) {
        nextUnitIds.delete(unitId);
      } else {
        nextUnitIds.add(unitId);
      }

      return nextUnitIds;
    });
  };

  const addEmployeeIds = (employeeIds: Iterable<EmployeeId>) => {
    setSelectedEmployeeIds((currentEmployeeIds) => {
      const nextEmployeeIds = new Set(currentEmployeeIds);

      for (const employeeId of employeeIds) {
        nextEmployeeIds.add(employeeId);
      }

      return nextEmployeeIds;
    });
  };

  const removeEmployeeIds = (employeeIds: Iterable<EmployeeId>) => {
    setSelectedEmployeeIds((currentEmployeeIds) => {
      const nextEmployeeIds = new Set(currentEmployeeIds);

      for (const employeeId of employeeIds) {
        nextEmployeeIds.delete(employeeId);
      }

      return nextEmployeeIds;
    });
  };

  const addEmployees = (employees: Employee[]) =>
    addEmployeeIds(employees.map((employee) => employee.id));
  const removeEmployees = (employees: Employee[]) =>
    removeEmployeeIds(employees.map((employee) => employee.id));

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className="flex h-[min(760px,calc(100dvh-32px))] max-w-4xl flex-col overflow-hidden p-0"
        data-demo-id="org-editor-add-employees-dialog"
      >
        <DialogHeader>
          <DialogTitle>{t("Add Employees to canvas Unit")}</DialogTitle>
        </DialogHeader>
        <DialogBody className="flex-1 overflow-hidden">
          <Tabs
            className="h-full min-h-0"
            onValueChange={(value) => setSourceSection(value as AddEmployeesSourceSection)}
            value={sourceSection}
          >
            <TabsList className="mb-3 w-fit shrink-0">
              {hasUnits && (
                <TabsTrigger value="units">
                  <HiOutlineFolder className="size-4" />
                  {t("Units")}
                </TabsTrigger>
              )}
              <TabsTrigger value="employees">
                <HiOutlineUsers className="size-4" />
                {t("Employees")}
              </TabsTrigger>
            </TabsList>
            {hasUnits && (
              <TabsContent className="min-h-0" value="units">
                <section className="flex h-full min-h-0 min-w-0 flex-col">
                  <UnitSearchInput
                    ariaLabel={t("Search Units by name")}
                    onValueChange={setUnitQuery}
                    placeholder={t("Search Units by name")}
                    value={unitQuery}
                  />
                  <ScrollArea className="mt-3 min-h-0 flex-1" scrollbars="none">
                    {hasVisibleUnits ? (
                      <ul className="grid min-w-max gap-2 pb-3">
                        <UnitTree
                          actions={(unit) => {
                            const selectedDeepCount = countEmployeeIdsInSelection(
                              unit.deepEmployeeIds,
                              selectedEmployeeIds,
                            );
                            const newDeepCount = countEmployeeIdsNotInSelection(
                              unit.deepEmployeeIds,
                              selectedEmployeeIds,
                            );

                            return (
                              <>
                                <ActionIconButton
                                  disabled={newDeepCount === 0}
                                  icon={<HiOutlineUserPlus />}
                                  label={t("Add Employees Unit")}
                                  onClick={() => addEmployeeIds(unit.deepEmployeeIds)}
                                  tooltip={t(
                                    "Add all Employees from this Unit and its descendants",
                                  )}
                                />
                                <ActionIconButton
                                  disabled={selectedDeepCount === 0}
                                  icon={<HiOutlineUserMinus />}
                                  label={t("Remove Employees Unit")}
                                  onClick={() => removeEmployeeIds(unit.deepEmployeeIds)}
                                  tooltip={t(
                                    "Remove Employees from this Unit and its descendants from the selection",
                                  )}
                                />
                              </>
                            );
                          }}
                          employeesById={units.indexes.employeesById}
                          expandedUnitIds={expandedPickerUnitIds}
                          onToggle={togglePickerUnit}
                          queryTokens={unitQueryTokens}
                          roots={roots}
                          selected={(unit) => {
                            const selectedDeepCount = countEmployeeIdsInSelection(
                              unit.deepEmployeeIds,
                              selectedEmployeeIds,
                            );

                            return (
                              unit.deepEmployeeIds.length > 0 &&
                              selectedDeepCount === unit.deepEmployeeIds.length
                            );
                          }}
                          subtitle={(unit) => {
                            const selectedDeepCount = countEmployeeIdsInSelection(
                              unit.deepEmployeeIds,
                              selectedEmployeeIds,
                            );
                            const selectionHint =
                              selectedDeepCount > 0
                                ? t("Selected {selected} of {total}", {
                                    selected: format.number(selectedDeepCount),
                                    total: format.number(unit.deepEmployeeIds.length),
                                  })
                                : t("Nothing selected");

                            return (
                              <>
                                <span>{getUnitEmployeeSummary(unit)}</span>
                                <MiddleDot />
                                <span>{selectionHint}</span>
                              </>
                            );
                          }}
                          variant="compact"
                          visibleUnitIds={visibleUnitIds}
                        />
                      </ul>
                    ) : (
                      <SourceEmptyState icon={<HiOutlineFolder className="size-5" />}>
                        {t("No Units found")}
                      </SourceEmptyState>
                    )}
                  </ScrollArea>
                </section>
              </TabsContent>
            )}
            <TabsContent className="min-h-0" value="employees">
              <EmployeeSourcePicker
                addFoundCount={foundEmployeesToAdd.length}
                employeeActions={(employee) => {
                  const selected = selectedEmployeeIds.has(employee.id);

                  return (
                    <Button
                      onClick={() =>
                        selected ? removeEmployees([employee]) : addEmployees([employee])
                      }
                      size="sm"
                      type="button"
                      variant={selected ? "secondary" : "outline"}
                    >
                      {selected ? <HiOutlineUserMinus /> : <HiOutlineUserPlus />}
                      <span>{selected ? t("Remove") : t("Add")}</span>
                    </Button>
                  );
                }}
                employees={foundEmployees}
                filters={filters}
                hasSourceEmployees={employees.length > 0}
                includePositions
                onAddFound={() => addEmployees(foundEmployeesToAdd)}
                onExcludeFound={() => removeEmployees(foundEmployeesToRemove)}
                onFiltersChange={setFilters}
                onQueryChange={setQuery}
                positionButtonDemoId="org-editor-add-employees-filter-button"
                positionOptions={positionOptions}
                positionPopoverDemoId="org-editor-add-employees-filter-popover"
                tagOptions={tagOptions}
                unitStructure={units}
                query={query}
                queryTokens={queryTokens}
                removeFoundCount={foundEmployeesToRemove.length}
                resetKey={`org-editor-add-employees:${deferredQuery}:${getEmployeeSearchFiltersKey(filters)}`}
                selected={(employee) => selectedEmployeeIds.has(employee.id)}
                unitContextsByEmployeeId={unitContextsByEmployeeId}
              />
            </TabsContent>
          </Tabs>
        </DialogBody>
        <DialogFooter className="items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {countText("selectedEmployees", { count: selectedEmployeeIds.size })}
          </div>
          <div className="flex gap-2">
            {onCreate && (
              <Button
                onClick={() => {
                  onOpenChange(false);
                  window.setTimeout(onCreate, 0);
                }}
                type="button"
                variant="outline"
              >
                <HiOutlineUserPlus />
                {t("Create")}
              </Button>
            )}
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              {t("Cancel")}
            </Button>
            <Button
              disabled={selectedEmployeeIds.size === 0}
              onClick={() => {
                onAdd([...selectedEmployeeIds]);
                onOpenChange(false);
              }}
              type="button"
            >
              {t("Add")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const OrgStructureEditorTab = observer(() => {
  const t = useUiText();
  const { locale } = useAppLocale();
  const textDirection = locale === "ar" ? "rtl" : "ltr";
  const countText = useCountText();
  const format = useAppFormatter();
  const store = useOrgStore();
  const units = store.editorUnits;
  const editor = store.orgEditor;
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const lastEmployeeSelectionRef = useRef<{
    employeeId: EmployeeId;
    unitId: OrgEditorUnitId;
  } | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [contextMenu, setContextMenu] = useState<OrgEditorContextMenu | null>(null);
  const [addEmployeesTarget, setAddEmployeesTarget] = useState<AddEmployeesTarget | null>(null);
  const [unitDialog, setUnitDialog] = useState<UnitDialogState | null>(null);
  const [employeeDialogState, setEmployeeDialogState] = useState<{
    employee: Employee | null;
    initialUnitIds: OrgEditorUnitId[];
  } | null>(null);
  const [exportUnitId, setExportUnitId] = useState<OrgEditorUnitId | null>(null);
  const { searchOpen, searchQuery } = store.editorUi;
  const [searchPinnedUnitId, setSearchPinnedUnitId] = useState<OrgEditorUnitId | null>(null);
  const [canvasSize, setCanvasSize] = useState(INITIAL_CANVAS_SIZE);
  const [renderViewport, setRenderViewport] = useState<OrgEditorCanvasViewport>(() => ({
    ...editor.viewport,
  }));
  const renderViewportRef = useRef<OrgEditorCanvasViewport>(renderViewport);
  const pendingViewportRef = useRef<OrgEditorCanvasViewport | null>(null);
  const viewportFrameSchedulerRef = useRef<ReturnType<
    typeof createLatestFrameScheduler<OrgEditorCanvasViewport>
  > | null>(null);
  const wheelCommitTimeoutRef = useRef<number | null>(null);
  const [unitDragDelta, setUnitDragDelta] = useState<CanvasPoint | null>(null);
  const unitDragDeltaRef = useRef<CanvasPoint | null>(null);
  const unitDragFrameSchedulerRef = useRef<ReturnType<
    typeof createLatestFrameScheduler<CanvasPoint>
  > | null>(null);

  useEffect(() => {
    viewportFrameSchedulerRef.current = createLatestFrameScheduler({
      cancelFrame: (frameId) => window.cancelAnimationFrame(frameId),
      onFrame: (viewport: OrgEditorCanvasViewport) => {
        pendingViewportRef.current = null;
        renderViewportRef.current = viewport;
        setRenderViewport((currentViewport) =>
          areViewportsEqual(currentViewport, viewport) ? currentViewport : viewport,
        );
      },
      requestFrame: (callback) => window.requestAnimationFrame(callback),
    });
    unitDragFrameSchedulerRef.current = createLatestFrameScheduler({
      cancelFrame: (frameId) => window.cancelAnimationFrame(frameId),
      onFrame: (delta: CanvasPoint) => {
        unitDragDeltaRef.current = delta;
        setUnitDragDelta(delta);
      },
      requestFrame: (callback) => window.requestAnimationFrame(callback),
    });

    return () => {
      viewportFrameSchedulerRef.current?.cancel();
      viewportFrameSchedulerRef.current = null;
      unitDragFrameSchedulerRef.current?.cancel();
      unitDragFrameSchedulerRef.current = null;
      if (wheelCommitTimeoutRef.current !== null) {
        window.clearTimeout(wheelCommitTimeoutRef.current);
        wheelCommitTimeoutRef.current = null;
      }
    };
  }, []);

  const scheduleViewportPreview = useCallback((viewport: OrgEditorCanvasViewport) => {
    pendingViewportRef.current = viewport;
    const scheduler = viewportFrameSchedulerRef.current;

    if (scheduler) {
      scheduler.schedule(viewport);
      return;
    }

    renderViewportRef.current = viewport;
    setRenderViewport(viewport);
  }, []);

  const commitViewport = useCallback(
    (viewport: OrgEditorCanvasViewport) => {
      viewportFrameSchedulerRef.current?.cancel();
      pendingViewportRef.current = null;
      renderViewportRef.current = viewport;
      setRenderViewport((currentViewport) =>
        areViewportsEqual(currentViewport, viewport) ? currentViewport : viewport,
      );
      if (!areViewportsEqual(editor.viewport, viewport)) editor.setViewport(viewport);
    },
    [editor],
  );

  const scheduleUnitDragPreview = useCallback((delta: CanvasPoint) => {
    const scheduler = unitDragFrameSchedulerRef.current;
    if (scheduler) {
      scheduler.schedule(delta);
      return;
    }

    unitDragDeltaRef.current = delta;
    setUnitDragDelta(delta);
  }, []);

  const clearUnitDragPreview = useCallback(() => {
    unitDragFrameSchedulerRef.current?.cancel();
    unitDragDeltaRef.current = null;
    setUnitDragDelta(null);
  }, []);

  useEffect(() => {
    if (dragStateRef.current?.type === "pan" || wheelCommitTimeoutRef.current !== null) return;

    viewportFrameSchedulerRef.current?.cancel();
    pendingViewportRef.current = null;
    renderViewportRef.current = editor.viewport;
    setRenderViewport((currentViewport) =>
      areViewportsEqual(currentViewport, editor.viewport) ? currentViewport : editor.viewport,
    );
  }, [editor, editor.viewport]);
  const selectedItemKeySet = useMemo(
    () => new Set(editor.selectedItems.map(createOrgEditorSelectedItemKey)),
    [editor.selectedItems],
  );
  const selectedUnitIds = editor.selectedUnitIds;
  const activeEditorStructure = units;
  const availableEmployees = activeEditorStructure?.allEmployees ?? [];
  const employeeUnitMembershipsByEmployeeId = useMemo(
    () =>
      buildEmployeeUnitMembershipIndex(
        availableEmployees,
        activeEditorStructure?.indexes.unitsById,
      ),
    [activeEditorStructure?.indexes.unitsById, availableEmployees],
  );
  const employeeUnitContextsByEmployeeId = useMemo(
    () => buildEmployeeUnitContextIndex(availableEmployees),
    [availableEmployees],
  );
  const employeeById = activeEditorStructure?.indexes.employeesById ?? EMPTY_EMPLOYEE_MAP;
  const employeeSearchDocumentByEmployeeId =
    activeEditorStructure?.indexes.employeeSearchDocumentByEmployeeId ?? EMPTY_SEARCH_DOCUMENT_MAP;
  const positionOptions = activeEditorStructure?.indexes.positionOptions ?? [];
  const tagOptions = activeEditorStructure?.indexes.tagOptions ?? [];
  const tagOrder = useMemo(() => store.tagDefinitions.map((tag) => tag.id), [store.tagDefinitions]);
  const resolvedLiveEmployeeIdsByUnitId = editor.resolvedLiveEmployeeIdsByUnitId;
  const displayUnits = useMemo(
    () =>
      editor.units.map((unit) =>
        unit.liveFilter === null
          ? unit
          : {
              ...unit,
              employeeIds: resolvedLiveEmployeeIdsByUnitId.get(unit.id) ?? [],
            },
      ),
    [editor.units, resolvedLiveEmployeeIdsByUnitId],
  );
  useMemo(() => {
    for (const unit of displayUnits) {
      const availableWidth = Math.max(
        80,
        getOrgEditorEmployeeTextMaxWidth(getOrgEditorUnitWidth(unit)),
      );
      const heights = new Map<EmployeeId, number>();
      const orderedEmployeeIds = getOrgEditorOrderedEmployeeIds(unit, employeeById);
      for (const employeeId of orderedEmployeeIds) {
        const employee = employeeById.get(employeeId);
        const labels =
          employee?.tags.map((tag) =>
            tag.date
              ? `${tag.label} · ${format.dateTime(new Date(`${tag.date}T00:00:00Z`), {
                  day: "numeric",
                  month: "short",
                  timeZone: "UTC",
                  year: "numeric",
                })}`
              : tag.label,
          ) ?? [];
        heights.set(employeeId, getOrgEditorEmployeeRowHeightForTagLabels(labels, availableWidth));
      }
      setOrgEditorUnitEmployeeRowHeights(unit.id, heights, orderedEmployeeIds);
    }
  }, [displayUnits, employeeById, format]);
  const unitTagSummaryByUnitId = useMemo(() => {
    const summaryByUnitId = new Map<OrgEditorUnitId, OrgEditorUnitTagSummary[]>();
    for (const unit of displayUnits) {
      const summary = buildOrgEditorUnitTagSummary(unit, employeeById, tagOrder);
      const footerHeight = unit.collapsed
        ? 0
        : getOrgEditorUnitTagFooterHeight(summary, getOrgEditorUnitWidth(unit) - 16);
      summaryByUnitId.set(unit.id, summary);
      setOrgEditorUnitTagFooterHeight(unit.id, footerHeight);
    }
    return summaryByUnitId;
  }, [displayUnits, employeeById, tagOrder]);
  const unitById = useMemo(
    () => new Map(displayUnits.map((unit) => [unit.id, unit] as const)),
    [displayUnits],
  );
  const primaryRootUnit = useMemo(
    () => getPrimaryOrgEditorRootUnit(displayUnits, editor.layoutMode),
    [displayUnits, editor.layoutMode],
  );
  const hasCollapsedUnits = displayUnits.some((unit) => unit.collapsed);
  const toggleAllUnitsLabel = hasCollapsedUnits ? t("Expand all") : t("Collapse all");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const orgEditorSearchTokens = useMemo(
    () => getSearchTokens(deferredSearchQuery),
    [deferredSearchQuery],
  );
  const sourceIndex = useMemo<OrgEditorSourceIndex>(
    () => ({
      employeesById: employeeById,
    }),
    [employeeById],
  );
  const exportUnit = exportUnitId ? (unitById.get(exportUnitId) ?? null) : null;
  const orgEditorSearchResults = useMemo<OrgEditorSearchResult[]>(() => {
    if (!units || orgEditorSearchTokens.length === 0) return [];

    const unitResults: OrgEditorSearchResult[] = [];
    const employeeResults: OrgEditorSearchResult[] = [];
    const maxUnitResults = Math.min(12, ORG_EDITOR_SEARCH_RESULT_LIMIT);

    for (const unit of displayUnits) {
      if (unitResults.length >= maxUnitResults) break;

      const unitSearchText = normalizeSearchValue(getOrgEditorUnitDisplayName(unit));

      if (matchesSearchTokens(unitSearchText, orgEditorSearchTokens)) {
        unitResults.push({
          id: `unit:${unit.id}`,
          type: "unit",
          unit,
        });
      }
    }

    const maxEmployeeResults = ORG_EDITOR_SEARCH_RESULT_LIMIT - unitResults.length;

    for (const unit of displayUnits) {
      if (employeeResults.length >= maxEmployeeResults) break;

      for (const employeeId of unit.employeeIds) {
        if (employeeResults.length >= maxEmployeeResults) break;

        const employee = employeeById.get(employeeId);
        if (!employee) continue;

        const employeeSearchDocument = employeeSearchDocumentByEmployeeId.get(employeeId);
        const usernameSearchText = employee.username
          ? normalizeSearchValue(`@${employee.username}`)
          : "";
        const employeeSearchText = `${employeeSearchDocument?.searchText ?? ""} ${usernameSearchText}`;

        if (!matchesSearchTokens(employeeSearchText, orgEditorSearchTokens)) continue;

        employeeResults.push({
          employee,
          id: `employee:${unit.id}:${employee.id}`,
          type: "employee",
          unit,
        });
      }
    }

    return [...unitResults, ...employeeResults];
  }, [
    displayUnits,
    employeeById,
    employeeSearchDocumentByEmployeeId,
    orgEditorSearchTokens,
    units,
  ]);
  const employeeSummaryByUnitId = useMemo(
    () => buildOrgEditorUnitEmployeeSummaryById(displayUnits),
    [displayUnits],
  );

  const screenToCanvasPoint = useCallback((point: ScreenPoint): CanvasPoint => {
    const bounds = canvasRef.current?.getBoundingClientRect();
    const viewport = pendingViewportRef.current ?? renderViewportRef.current;

    return {
      x: (point.x - (bounds?.left ?? 0) - viewport.x) / viewport.scale,
      y: (point.y - (bounds?.top ?? 0) - viewport.y) / viewport.scale,
    };
  }, []);

  const getCanvasCenterScreenPoint = useCallback((): ScreenPoint => {
    const bounds = canvasRef.current?.getBoundingClientRect();

    return {
      x: (bounds?.left ?? 0) + (bounds?.width ?? 0) / 2,
      y: (bounds?.top ?? 0) + (bounds?.height ?? 0) / 2,
    };
  }, []);

  const getCanvasCenterPoint = useCallback(
    (): CanvasPoint => screenToCanvasPoint(getCanvasCenterScreenPoint()),
    [getCanvasCenterScreenPoint, screenToCanvasPoint],
  );

  const centerCanvasRectInViewport = useCallback(
    (
      rect: CanvasRect,
      scale: number,
      options: {
        ensureRect?: CanvasRect | null;
      } = {},
    ) => {
      const bounds = canvasRef.current?.getBoundingClientRect();
      const viewportWidth = bounds?.width ?? 0;
      const viewportHeight = bounds?.height ?? 0;
      const x = viewportWidth / 2 - (rect.x + rect.width / 2) * scale;
      let y = viewportHeight / 2 - (rect.y + rect.height / 2) * scale;
      const ensureRect = options.ensureRect;

      if (ensureRect && viewportWidth > 0 && viewportHeight > 0) {
        const margin = Math.min(
          ORG_EDITOR_SEARCH_VIEWPORT_MARGIN,
          Math.max(16, viewportHeight / 4),
        );
        const ensureTop = ensureRect.y * scale + y;
        const ensureBottom = (ensureRect.y + ensureRect.height) * scale + y;
        const minVisibleY = margin;
        const maxVisibleY = viewportHeight - margin;

        if (ensureTop < minVisibleY) {
          y += minVisibleY - ensureTop;
        } else if (ensureBottom > maxVisibleY) {
          y -= ensureBottom - maxVisibleY;
        }
      }

      commitViewport({
        scale,
        x,
        y,
      });
    },
    [commitViewport],
  );

  const centerUnitInViewport = useCallback(
    (unit: OrgEditorUnit, scale: number) => {
      centerCanvasRectInViewport(getOrgEditorUnitBounds(unit), scale);
    },
    [centerCanvasRectInViewport],
  );

  const resetViewportScale = useCallback(() => {
    const centerPoint = getCanvasCenterScreenPoint();
    const canvasPoint = screenToCanvasPoint(centerPoint);
    const bounds = canvasRef.current?.getBoundingClientRect();
    const screenX = centerPoint.x - (bounds?.left ?? 0);
    const screenY = centerPoint.y - (bounds?.top ?? 0);

    commitViewport({
      scale: 1,
      x: screenX - canvasPoint.x,
      y: screenY - canvasPoint.y,
    });
  }, [commitViewport, getCanvasCenterScreenPoint, screenToCanvasPoint]);

  const focusPrimaryRootUnit = useCallback(() => {
    if (!primaryRootUnit) return;

    editor.setSelectedItems([{ type: "unit", unitId: primaryRootUnit.id }]);
    centerUnitInViewport(primaryRootUnit, renderViewportRef.current.scale);
  }, [centerUnitInViewport, editor, primaryRootUnit]);

  const selectOrgEditorSearchResult = useCallback(
    (result: OrgEditorSearchResult) => {
      const shouldRevealEmployee =
        result.type === "employee" &&
        result.unit.collapsed &&
        result.unit.bossEmployeeId !== result.employee.id;

      setContextMenu(null);
      setSearchPinnedUnitId(result.unit.id);

      if (shouldRevealEmployee) {
        editor.setUnitsCollapsed([result.unit.id], false);
      }

      const nextUnit = unitById.get(result.unit.id) ?? result.unit;
      const unitBounds = getOrgEditorUnitBounds(nextUnit);

      if (result.type === "unit") {
        editor.setSelectedItems([{ type: "unit", unitId: nextUnit.id }]);
        centerCanvasRectInViewport(unitBounds, 1);
        store.setEditorUi({ searchOpen: false, searchQuery: "" });
        return;
      }

      const visibleEmployeeIds = getOrgEditorOrderedEmployeeIds(nextUnit, employeeById);
      const employeeIndex = visibleEmployeeIds.indexOf(result.employee.id);
      const employeeBounds =
        employeeIndex >= 0 ? getOrgEditorEmployeeBounds(nextUnit, employeeIndex) : null;

      editor.setSelectedItems([
        {
          employeeId: result.employee.id,
          type: "employee",
          unitId: nextUnit.id,
        },
      ]);
      lastEmployeeSelectionRef.current = {
        employeeId: result.employee.id,
        unitId: nextUnit.id,
      };
      centerCanvasRectInViewport(unitBounds, 1, {
        ensureRect: employeeBounds,
      });
      store.setEditorUi({ searchOpen: false, searchQuery: "" });
    },
    [centerCanvasRectInViewport, editor, employeeById, store, unitById],
  );

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;

    const updateCanvasSize = () => {
      const bounds = canvasElement.getBoundingClientRect();
      setCanvasSize((currentSize) => {
        const nextSize = {
          height: Math.max(1, Math.round(bounds.height)),
          width: Math.max(1, Math.round(bounds.width)),
        };

        return currentSize.height === nextSize.height && currentSize.width === nextSize.width
          ? currentSize
          : nextSize;
      });
    };

    updateCanvasSize();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateCanvasSize);
      return () => window.removeEventListener("resize", updateCanvasSize);
    }

    const resizeObserver = new ResizeObserver(updateCanvasSize);
    resizeObserver.observe(canvasElement);

    return () => resizeObserver.disconnect();
  }, []);

  const visibleWorldRect = useMemo<CanvasRect>(() => {
    const scale = Math.max(renderViewport.scale, MIN_CANVAS_SCALE);

    return {
      height: (canvasSize.height + CANVAS_VIEWPORT_OVERSCAN_PX * 2) / scale,
      width: (canvasSize.width + CANVAS_VIEWPORT_OVERSCAN_PX * 2) / scale,
      x: (-renderViewport.x - CANVAS_VIEWPORT_OVERSCAN_PX) / scale,
      y: (-renderViewport.y - CANVAS_VIEWPORT_OVERSCAN_PX) / scale,
    };
  }, [canvasSize.height, canvasSize.width, renderViewport]);
  const connectionDragUnitId = dragState?.type === "connection" ? dragState.unitId : null;

  const pinnedVisibleUnitIds = useMemo(() => {
    const unitIds = new Set<OrgEditorUnitId>();

    if (searchPinnedUnitId) {
      unitIds.add(searchPinnedUnitId);
    }

    if (exportUnitId) {
      unitIds.add(exportUnitId);
    }

    if (contextMenu?.type === "employees") {
      unitIds.add(contextMenu.unitId);
    }

    if (contextMenu?.type === "units") {
      unitIds.add(contextMenu.anchorUnitId);
    }

    if (connectionDragUnitId) {
      unitIds.add(connectionDragUnitId);
    }

    if (dragState?.type === "unit") {
      for (const unitId of dragState.selectedUnitIds) unitIds.add(unitId);
    }

    return unitIds;
  }, [connectionDragUnitId, contextMenu, dragState, exportUnitId, searchPinnedUnitId]);

  const unitSpatialIndex = useMemo(
    () =>
      createSpatialIndex(
        displayUnits,
        (unit) => getOrgEditorUnitBounds(unit),
        ORG_EDITOR_SPATIAL_CELL_SIZE,
      ),
    [displayUnits],
  );
  const visibleUnitQuery = useMemo(
    () => unitSpatialIndex.query(visibleWorldRect),
    [unitSpatialIndex, visibleWorldRect],
  );

  const unitPreviewPositionById = useMemo(() => {
    const positions = new Map<OrgEditorUnitId, CanvasPoint>();
    if (dragState?.type !== "unit" || !unitDragDelta) return positions;

    for (const position of dragState.startUnitPositions) {
      positions.set(position.unitId, {
        x: position.x + unitDragDelta.x,
        y: position.y + unitDragDelta.y,
      });
    }

    return positions;
  }, [dragState, unitDragDelta]);

  const withUnitPreviewPosition = useCallback(
    (unit: OrgEditorUnit) => {
      const position = unitPreviewPositionById.get(unit.id);
      return position ? { ...unit, ...position } : unit;
    },
    [unitPreviewPositionById],
  );

  const visibleUnits = useMemo(() => {
    const nextVisibleUnits = [...visibleUnitQuery.items];
    const queriedUnitIds = new Set(nextVisibleUnits.map((unit) => unit.id));

    for (const unitId of pinnedVisibleUnitIds) {
      const unit = unitById.get(unitId);
      if (unit && !queriedUnitIds.has(unitId)) nextVisibleUnits.push(unit);
    }

    return nextVisibleUnits.map(withUnitPreviewPosition);
  }, [pinnedVisibleUnitIds, unitById, visibleUnitQuery.items, withUnitPreviewPosition]);

  const connectionEntries = useMemo(() => {
    const entries: OrgEditorConnectionEntry[] = [];

    for (const unit of displayUnits) {
      if (!unit.parentId) continue;

      const parentUnit = unitById.get(unit.parentId);
      if (!parentUnit) continue;

      const parentBounds = getOrgEditorUnitBounds(parentUnit);
      const unitBounds = getOrgEditorUnitBounds(unit);
      entries.push({
        bounds: {
          height:
            Math.max(parentBounds.y + parentBounds.height, unitBounds.y + unitBounds.height) -
            Math.min(parentBounds.y, unitBounds.y),
          width:
            Math.max(parentBounds.x + parentBounds.width, unitBounds.x + unitBounds.width) -
            Math.min(parentBounds.x, unitBounds.x),
          x: Math.min(parentBounds.x, unitBounds.x),
          y: Math.min(parentBounds.y, unitBounds.y),
        },
        parentUnit,
        unit,
      });
    }

    return entries;
  }, [displayUnits, unitById]);
  const connectionSpatialIndex = useMemo(
    () =>
      createSpatialIndex(connectionEntries, (entry) => entry.bounds, ORG_EDITOR_SPATIAL_CELL_SIZE),
    [connectionEntries],
  );
  const visibleConnectionQuery = useMemo(
    () => connectionSpatialIndex.query(visibleWorldRect),
    [connectionSpatialIndex, visibleWorldRect],
  );
  const dragConnectionEntries = useMemo(() => {
    if (dragState?.type !== "unit") return [];

    const movingUnitIds = new Set(dragState.selectedUnitIds);
    return connectionEntries.filter(
      (entry) => movingUnitIds.has(entry.unit.id) || movingUnitIds.has(entry.parentUnit.id),
    );
  }, [connectionEntries, dragState]);

  const visibleConnectionUnits = useMemo(() => {
    const entriesByUnitId = new Map<OrgEditorUnitId, OrgEditorConnectionEntry>();

    for (const entry of visibleConnectionQuery.items) entriesByUnitId.set(entry.unit.id, entry);
    for (const entry of dragConnectionEntries) entriesByUnitId.set(entry.unit.id, entry);

    return [...entriesByUnitId.values()].map((entry) => ({
      parentUnit: withUnitPreviewPosition(entry.parentUnit),
      unit: withUnitPreviewPosition(entry.unit),
    }));
  }, [dragConnectionEntries, visibleConnectionQuery.items, withUnitPreviewPosition]);

  const getConnectionDropTarget = useCallback(
    (unitId: OrgEditorUnitId, point: CanvasPoint) => {
      const forbiddenUnitIds = new Set(getOrgEditorUnitDescendantIds(editor.units, unitId));

      return (
        [...visibleUnits]
          .reverse()
          .find(
            (unit) =>
              !forbiddenUnitIds.has(unit.id) &&
              isPointInsideRect(point, getOrgEditorUnitBounds(unit)),
          ) ?? null
      );
    },
    [editor.units, visibleUnits],
  );

  const getEmployeeDropTarget = useCallback(
    (point: CanvasPoint, excludedUnitIds?: ReadonlySet<OrgEditorUnitId>) =>
      [...visibleUnits]
        .reverse()
        .find(
          (unit) =>
            !excludedUnitIds?.has(unit.id) &&
            unit.liveFilter === null &&
            isPointInsideRect(point, getOrgEditorUnitBounds(unit)),
        ) ?? null,
    [visibleUnits],
  );

  const getUnitsInsideScreenRect = useCallback(
    (screenRect: { height: number; width: number; x: number; y: number }) => {
      const selectedItems: OrgEditorSelectedItem[] = [];
      const canvasTopLeft = screenToCanvasPoint({ x: screenRect.x, y: screenRect.y });
      const canvasBottomRight = screenToCanvasPoint({
        x: screenRect.x + screenRect.width,
        y: screenRect.y + screenRect.height,
      });
      const canvasRect = {
        height: Math.abs(canvasBottomRight.y - canvasTopLeft.y),
        width: Math.abs(canvasBottomRight.x - canvasTopLeft.x),
        x: Math.min(canvasTopLeft.x, canvasBottomRight.x),
        y: Math.min(canvasTopLeft.y, canvasBottomRight.y),
      };

      for (const unit of unitSpatialIndex.query(canvasRect).items) {
        selectedItems.push({ type: "unit", unitId: unit.id });
      }

      return selectedItems;
    },
    [screenToCanvasPoint, unitSpatialIndex],
  );

  const setActiveDragState = useCallback((nextDragState: DragState | null) => {
    dragStateRef.current = nextDragState;
    setDragState(nextDragState);
  }, []);

  const connectionDropTargetUnit =
    dragState?.type === "connection"
      ? getConnectionDropTarget(dragState.unitId, screenToCanvasPoint(dragState.currentScreenPoint))
      : null;
  const connectionDragPath = useMemo(() => {
    if (dragState?.type !== "connection") return null;

    const unit = unitById.get(dragState.unitId);
    if (!unit) return null;

    const unitBounds = getOrgEditorUnitBounds(unit);
    const currentPoint = screenToCanvasPoint(dragState.currentScreenPoint);
    const startPoint =
      editor.layoutMode === "leftRight"
        ? {
            x: unitBounds.x,
            y: unitBounds.y + unitBounds.height / 2,
          }
        : {
            x: unitBounds.x + unitBounds.width / 2,
            y: unitBounds.y,
          };

    if (editor.layoutMode === "leftRight") {
      const middleX = startPoint.x + (currentPoint.x - startPoint.x) / 2;

      return `M ${startPoint.x} ${startPoint.y} C ${middleX} ${startPoint.y}, ${middleX} ${currentPoint.y}, ${currentPoint.x} ${currentPoint.y}`;
    }

    const middleY = startPoint.y + (currentPoint.y - startPoint.y) / 2;

    return `M ${startPoint.x} ${startPoint.y} C ${startPoint.x} ${middleY}, ${currentPoint.x} ${middleY}, ${currentPoint.x} ${currentPoint.y}`;
  }, [dragState, editor.layoutMode, screenToCanvasPoint, unitById]);

  useEffect(() => {
    if (!contextMenu) return;

    const closeContextMenu = () => setContextMenu(null);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;

      if (document.querySelector('[data-demo-id="org-editor-employee-tags-submenu"]')) {
        return;
      }

      const eventTarget = event.target;
      if (
        eventTarget instanceof Element &&
        eventTarget.closest('[data-demo-id="org-editor-employee-tags-submenu"]')
      ) {
        return;
      }

      closeContextMenu();
    };

    window.addEventListener("pointerdown", closeContextMenu);
    window.addEventListener("wheel", closeContextMenu);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", closeContextMenu);
      window.removeEventListener("wheel", closeContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [contextMenu]);

  useEffect(() => {
    if (!searchPinnedUnitId) return;

    const timeoutId = window.setTimeout(() => setSearchPinnedUnitId(null), 800);

    return () => window.clearTimeout(timeoutId);
  }, [searchPinnedUnitId]);

  useEffect(() => {
    if (!dragState) return;

    const previousUserSelect = document.body.style.userSelect;

    document.body.style.userSelect = "none";

    return () => {
      document.body.style.userSelect = previousUserSelect;
    };
  }, [dragState]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const currentDragState = dragStateRef.current;
      if (!currentDragState) return;

      const currentScreenPoint = getPointerScreenPoint(event);

      if (currentDragState.type === "pan") {
        scheduleViewportPreview({
          ...currentDragState.startViewport,
          x:
            currentDragState.startViewport.x +
            currentScreenPoint.x -
            currentDragState.startScreenPoint.x,
          y:
            currentDragState.startViewport.y +
            currentScreenPoint.y -
            currentDragState.startScreenPoint.y,
        });
        return;
      }

      if (currentDragState.type === "select") {
        const screenRect = getSelectionRect(currentDragState.startScreenPoint, currentScreenPoint);

        editor.setSelectedItems(getUnitsInsideScreenRect(screenRect));
        setActiveDragState({ ...currentDragState, currentScreenPoint });
        return;
      }

      if (currentDragState.type === "employee") {
        setActiveDragState({ ...currentDragState, currentScreenPoint });
        return;
      }

      if (currentDragState.type === "connection") {
        setActiveDragState({ ...currentDragState, currentScreenPoint });
        return;
      }

      const currentCanvasPoint = screenToCanvasPoint(currentScreenPoint);
      const delta = {
        x: currentCanvasPoint.x - currentDragState.startCanvasPoint.x,
        y: currentCanvasPoint.y - currentDragState.startCanvasPoint.y,
      };

      if (Math.abs(delta.x) < 0.01 && Math.abs(delta.y) < 0.01) return;

      scheduleUnitDragPreview(delta);
    };

    const handlePointerUp = (event: PointerEvent) => {
      const currentDragState = dragStateRef.current;
      if (!currentDragState) return;

      const currentScreenPoint = getPointerScreenPoint(event);

      if (currentDragState.type === "pan") {
        commitViewport({
          ...currentDragState.startViewport,
          x:
            currentDragState.startViewport.x +
            currentScreenPoint.x -
            currentDragState.startScreenPoint.x,
          y:
            currentDragState.startViewport.y +
            currentScreenPoint.y -
            currentDragState.startScreenPoint.y,
        });
      }

      if (currentDragState.type === "select") {
        const screenRect = getSelectionRect(currentDragState.startScreenPoint, currentScreenPoint);

        editor.setSelectedItems(getUnitsInsideScreenRect(screenRect));
      }

      if (currentDragState.type === "connection") {
        const startDistance = Math.hypot(
          currentScreenPoint.x - currentDragState.startScreenPoint.x,
          currentScreenPoint.y - currentDragState.startScreenPoint.y,
        );

        if (startDistance > DRAG_START_THRESHOLD) {
          const targetUnit = getConnectionDropTarget(
            currentDragState.unitId,
            screenToCanvasPoint(currentScreenPoint),
          );

          editor.setUnitParent(currentDragState.unitId, targetUnit?.id ?? null);
        }
      }

      if (currentDragState.type === "employee") {
        const startDistance = Math.hypot(
          currentScreenPoint.x - currentDragState.startScreenPoint.x,
          currentScreenPoint.y - currentDragState.startScreenPoint.y,
        );

        if (startDistance > DRAG_START_THRESHOLD) {
          const targetUnit = getEmployeeDropTarget(
            screenToCanvasPoint(currentScreenPoint),
            getOrgEditorEmployeeDragSourceUnitIds(currentDragState.selectedItems),
          );

          if (targetUnit) {
            editor.moveEmployeesToUnit(currentDragState.selectedItems, targetUnit.id);
          }
        }
      }

      if (currentDragState.type === "unit") {
        const startDistance = Math.hypot(
          currentScreenPoint.x - currentDragState.startScreenPoint.x,
          currentScreenPoint.y - currentDragState.startScreenPoint.y,
        );
        const currentCanvasPoint = screenToCanvasPoint(currentScreenPoint);
        const delta = {
          x: currentCanvasPoint.x - currentDragState.startCanvasPoint.x,
          y: currentCanvasPoint.y - currentDragState.startCanvasPoint.y,
        };

        clearUnitDragPreview();
        if (startDistance > DRAG_START_THRESHOLD) {
          editor.moveUnitsFromPositions(currentDragState.startUnitPositions, delta);
          editor.commitCommandFromSnapshot(currentDragState.historySnapshot, "Move Units");
          editor.setSelectedItems(
            currentDragState.selectedUnitIds.map((unitId) => ({ type: "unit", unitId })),
          );
        } else if (currentDragState.selectOnClick) {
          editor.selectItem(currentDragState.selectOnClick, "replace");
        }
      }

      setActiveDragState(null);
    };

    const handlePointerCancel = () => {
      const currentDragState = dragStateRef.current;
      if (!currentDragState) return;

      if (currentDragState.type === "pan") commitViewport(currentDragState.startViewport);
      if (currentDragState.type === "unit") clearUnitDragPreview();
      setActiveDragState(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [
    clearUnitDragPreview,
    commitViewport,
    editor,
    getConnectionDropTarget,
    getEmployeeDropTarget,
    getUnitsInsideScreenRect,
    scheduleUnitDragPreview,
    scheduleViewportPreview,
    screenToCanvasPoint,
    setActiveDragState,
  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable=true]")) return;

      const key = event.key.toLocaleLowerCase();

      if ((event.metaKey || event.ctrlKey) && key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          editor.redo();
        } else {
          editor.undo();
        }
        return;
      }

      if ((event.metaKey || event.ctrlKey) && key === "y") {
        event.preventDefault();
        editor.redo();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && key === "a") {
        event.preventDefault();
        editor.selectAllUnits();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && key === "c") {
        event.preventDefault();
        editor.copySelected();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && key === "v") {
        event.preventDefault();
        editor.pasteAt(getCanvasCenterPoint());
        return;
      }

      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        editor.deleteSelected();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      event.preventDefault();
      const currentViewport = pendingViewportRef.current ?? renderViewportRef.current;
      const nextScale = clamp(
        currentViewport.scale * (event.deltaY > 0 ? 0.92 : 1.08),
        MIN_CANVAS_SCALE,
        MAX_CANVAS_SCALE,
      );
      const screenPoint = { x: event.clientX, y: event.clientY };
      const bounds = canvasRef.current?.getBoundingClientRect();
      const canvasPoint = {
        x: (screenPoint.x - (bounds?.left ?? 0) - currentViewport.x) / currentViewport.scale,
        y: (screenPoint.y - (bounds?.top ?? 0) - currentViewport.y) / currentViewport.scale,
      };
      const nextViewport = {
        scale: nextScale,
        x: screenPoint.x - (bounds?.left ?? 0) - canvasPoint.x * nextScale,
        y: screenPoint.y - (bounds?.top ?? 0) - canvasPoint.y * nextScale,
      };

      scheduleViewportPreview(nextViewport);
      if (wheelCommitTimeoutRef.current !== null) {
        window.clearTimeout(wheelCommitTimeoutRef.current);
      }
      wheelCommitTimeoutRef.current = window.setTimeout(() => {
        wheelCommitTimeoutRef.current = null;
        commitViewport(pendingViewportRef.current ?? renderViewportRef.current);
      }, ORG_EDITOR_WHEEL_COMMIT_DELAY_MS);
    },
    [commitViewport, scheduleViewportPreview],
  );

  useEffect(() => {
    if (!units) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [handleWheel, units]);

  if (!units) return null;

  const openCreateUnit = (point: CanvasPoint, parentId: OrgEditorUnitId | null = null) => {
    setUnitDialog({ parentId, point, unitId: null });
    setContextMenu(null);
  };

  const openEditUnit = (unit: OrgEditorUnit) => {
    setUnitDialog({
      parentId: unit.parentId,
      point: { x: unit.x, y: unit.y },
      unitId: unit.id,
    });
    setContextMenu(null);
  };

  const openCreateChildUnit = (unitId: OrgEditorUnitId) => {
    const parentUnit = editor.units.find((unit) => unit.id === unitId);
    if (!parentUnit) return;

    const parentHeight = getOrgEditorUnitHeight(parentUnit);
    const parentWidth = getOrgEditorUnitWidth(parentUnit);
    const point =
      editor.layoutMode === "topDown"
        ? {
            x: parentUnit.x + parentWidth / 2,
            y: parentUnit.y + parentHeight + ORG_EDITOR_UNIT_VERTICAL_GAP + 80,
          }
        : {
            x: parentUnit.x + parentWidth + ORG_EDITOR_UNIT_HORIZONTAL_GAP + parentWidth / 2,
            y: parentUnit.y + 80,
          };

    openCreateUnit(point, unitId);
  };

  const openCreateEmployeeForUnits = (unitIds: OrgEditorUnitId[]) => {
    setEmployeeDialogState({
      employee: null,
      initialUnitIds: unitIds,
    });
    setAddEmployeesTarget(null);
    setContextMenu(null);
  };

  const openCreateEmployeeAtPoint = (point: CanvasPoint) => {
    const unitName = t("Employees");
    const unitId = editor.addUnit({
      name: unitName,
      x: point.x - getOrgEditorUnitWidth({ name: unitName }) / 2,
      y: point.y - 80,
    });

    openCreateEmployeeForUnits([unitId]);
  };

  const addEmployeeSourcesToUnit = (
    unitId: OrgEditorUnitId,
    employeeIds: EmployeeId[],
    bossEmployeeId?: EmployeeId | null,
    employeePositions: OrgEditorEmployeePosition[] = [],
  ) => {
    editor.addEmployeesToUnit(unitId, employeeIds);
    if (bossEmployeeId !== undefined) editor.setUnitBoss(unitId, bossEmployeeId ?? null);
    for (const employeePosition of employeePositions) {
      const employee = units?.indexes.employeesById.get(employeePosition.employeeId);
      if (!employee) continue;
      const assignments = employee.unitPositions
        .filter((position) => position.unitId !== unitId)
        .map((position) => ({
          isBoss: position.isBoss,
          position: position.position,
          unitId: position.unitId,
        }));
      assignments.push({
        isBoss: bossEmployeeId === employeePosition.employeeId,
        position: employeePosition.position,
        unitId,
      });
      editor.setEmployeeAssignments(employeePosition.employeeId, assignments);
    }
  };

  const toggleLayoutMode = () => {
    editor.applyLayout(editor.layoutMode === "topDown" ? "leftRight" : "topDown");
  };

  const zoomAt = (screenPoint: ScreenPoint, nextScale: number) => {
    if (wheelCommitTimeoutRef.current !== null) {
      window.clearTimeout(wheelCommitTimeoutRef.current);
      wheelCommitTimeoutRef.current = null;
    }
    const canvasPoint = screenToCanvasPoint(screenPoint);
    const bounds = canvasRef.current?.getBoundingClientRect();
    const screenX = screenPoint.x - (bounds?.left ?? 0);
    const screenY = screenPoint.y - (bounds?.top ?? 0);

    commitViewport({
      scale: nextScale,
      x: screenX - canvasPoint.x * nextScale,
      y: screenY - canvasPoint.y * nextScale,
    });
  };

  const finishWheelPreview = () => {
    if (wheelCommitTimeoutRef.current === null) return;

    window.clearTimeout(wheelCommitTimeoutRef.current);
    wheelCommitTimeoutRef.current = null;
    commitViewport(pendingViewportRef.current ?? renderViewportRef.current);
  };

  const handleCanvasPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    setContextMenu(null);
    finishWheelPreview();

    if (event.button === 1) {
      event.preventDefault();
      setActiveDragState({
        startScreenPoint: getPointerScreenPoint(event.nativeEvent),
        startViewport: renderViewportRef.current,
        type: "pan",
      });
      return;
    }

    if (event.button !== 0) return;

    if (event.metaKey || event.ctrlKey) {
      event.preventDefault();
      setActiveDragState({
        currentScreenPoint: getPointerScreenPoint(event.nativeEvent),
        startScreenPoint: getPointerScreenPoint(event.nativeEvent),
        type: "select",
      });
      return;
    }

    event.preventDefault();
    editor.clearSelection();
    setActiveDragState({
      startScreenPoint: getPointerScreenPoint(event.nativeEvent),
      startViewport: renderViewportRef.current,
      type: "pan",
    });
  };

  const handleCanvasContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    const screenPoint = { x: event.clientX, y: event.clientY };

    setContextMenu({
      canvasPoint: screenToCanvasPoint(screenPoint),
      screenPoint,
      type: "canvas",
    });
  };

  const handleEmptyCanvasAddClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const screenPoint = getCanvasCenterScreenPoint();

    setContextMenu({
      canvasPoint: screenToCanvasPoint(screenPoint),
      screenPoint,
      type: "canvas",
    });
  };

  const handleUnitPointerDown = (
    event: React.PointerEvent<HTMLFieldSetElement>,
    unit: OrgEditorUnit,
  ) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    const item = { type: "unit", unitId: unit.id } satisfies OrgEditorSelectedItem;
    const mode = selectionModeFromEvent(event);
    const selectionIntent = getUnitPointerSelectionIntent({
      clickedUnitId: unit.id,
      selectedUnitIds,
      toggle: mode === "toggle",
    });
    const selectedUnitIdsForDrag = selectionIntent.dragUnitIds;

    if (!selectionIntent.preserveForPotentialGroupDrag) editor.selectItem(item, mode);
    setActiveDragState({
      historySnapshot: editor.createCommandSnapshot(),
      selectOnClick: selectionIntent.preserveForPotentialGroupDrag ? item : null,
      selectedUnitIds: selectedUnitIdsForDrag,
      startCanvasPoint: screenToCanvasPoint(getPointerScreenPoint(event.nativeEvent)),
      startUnitPositions: editor.units
        .filter((currentUnit) => selectedUnitIdsForDrag.includes(currentUnit.id))
        .map((currentUnit) => ({
          unitId: currentUnit.id,
          x: currentUnit.x,
          y: currentUnit.y,
        })),
      startScreenPoint: getPointerScreenPoint(event.nativeEvent),
      type: "unit",
    });
  };

  const handleUnitDoubleClick = (
    event: React.MouseEvent<HTMLFieldSetElement>,
    unit: OrgEditorUnit,
  ) => {
    const target = event.target;

    if (
      target instanceof Element &&
      target.closest("button,input,textarea,select,a,[contenteditable='true']")
    ) {
      return;
    }

    if (!selectedUnitIds.has(unit.id)) return;

    event.preventDefault();
    event.stopPropagation();
    editor.setUnitsCollapsed([unit.id], !unit.collapsed);
  };

  const handleConnectionPointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    unit: OrgEditorUnit,
  ) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    const screenPoint = getPointerScreenPoint(event.nativeEvent);

    editor.setSelectedItems([{ type: "unit", unitId: unit.id }]);
    setActiveDragState({
      currentScreenPoint: screenPoint,
      startScreenPoint: screenPoint,
      type: "connection",
      unitId: unit.id,
    });
  };

  const handleUnitContextMenu = (
    event: React.MouseEvent<HTMLFieldSetElement>,
    unit: OrgEditorUnit,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const unitIsSelected = selectedUnitIds.has(unit.id);
    const hasOnlyUnitSelection =
      editor.selectedItems.length > 0 &&
      editor.selectedItems.every((selectedItem) => selectedItem.type === "unit");
    const unitIds = unitIsSelected && hasOnlyUnitSelection ? [...selectedUnitIds] : [unit.id];

    if (!unitIsSelected || !hasOnlyUnitSelection) {
      editor.setSelectedItems([{ type: "unit", unitId: unit.id }]);
    }

    const screenPoint = { x: event.clientX, y: event.clientY };

    setContextMenu({
      anchorUnitId: unit.id,
      canvasPoint: screenToCanvasPoint(screenPoint),
      screenPoint,
      type: "units",
      unitIds,
    });
  };

  const getNextEmployeeSelection = (
    event: React.PointerEvent<HTMLButtonElement>,
    unit: OrgEditorUnit,
    employeeId: EmployeeId,
  ) => {
    const item = {
      employeeId,
      type: "employee",
      unitId: unit.id,
    } satisfies OrgEditorSelectedItem;

    if (event.shiftKey) {
      const visibleEmployeeIds = getOrgEditorVisibleEmployeeIds(unit, employeeById);
      const sameUnitAnchor =
        lastEmployeeSelectionRef.current?.unitId === unit.id
          ? lastEmployeeSelectionRef.current.employeeId
          : null;
      const selectedSameUnitEmployeeId = editor.selectedItems.find(
        (selectedItem): selectedItem is Extract<OrgEditorSelectedItem, { type: "employee" }> =>
          selectedItem.type === "employee" && selectedItem.unitId === unit.id,
      )?.employeeId;
      const anchorEmployeeId = sameUnitAnchor ?? selectedSameUnitEmployeeId ?? employeeId;
      const anchorIndex = visibleEmployeeIds.indexOf(anchorEmployeeId);
      const employeeIndex = visibleEmployeeIds.indexOf(employeeId);
      const rangeEmployeeIds =
        anchorIndex >= 0 && employeeIndex >= 0
          ? visibleEmployeeIds.slice(
              Math.min(anchorIndex, employeeIndex),
              Math.max(anchorIndex, employeeIndex) + 1,
            )
          : [employeeId];
      const rangeItems = rangeEmployeeIds.map((rangeEmployeeId) => ({
        employeeId: rangeEmployeeId,
        type: "employee" as const,
        unitId: unit.id,
      }));

      if (event.metaKey || event.ctrlKey) {
        return [...editor.selectedItems, ...rangeItems];
      }

      return rangeItems;
    }

    const itemKey = createOrgEditorSelectedItemKey(item);

    lastEmployeeSelectionRef.current = { employeeId, unitId: unit.id };

    if (event.metaKey || event.ctrlKey) {
      const existingItems = editor.selectedItems.filter(
        (selectedItem) => createOrgEditorSelectedItemKey(selectedItem) !== itemKey,
      );

      return existingItems.length === editor.selectedItems.length
        ? [...existingItems, item]
        : existingItems;
    }

    return [item];
  };

  const handleEmployeePointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    unit: OrgEditorUnit,
    employeeId: EmployeeId,
  ) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    if (unit.liveFilter !== null) {
      editor.setSelectedItems([{ employeeId, type: "employee", unitId: unit.id }]);
      return;
    }

    const item = {
      employeeId,
      type: "employee",
      unitId: unit.id,
    } satisfies OrgEditorSelectedItem;
    const hasOnlyEmployeeSelection =
      editor.selectedItems.length > 0 &&
      editor.selectedItems.every((selectedItem) => selectedItem.type === "employee");
    const shouldKeepCurrentSelectionForDrag =
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      hasOnlyEmployeeSelection &&
      selectedItemKeySet.has(createOrgEditorSelectedItemKey(item));
    const selectedItems = shouldKeepCurrentSelectionForDrag
      ? editor.selectedItems
      : getNextEmployeeSelection(event, unit, employeeId);
    const selectedItemsForDrag = selectedItems.filter(
      (selectedItem) =>
        selectedItem.type === "employee" &&
        editor.units.find((candidateUnit) => candidateUnit.id === selectedItem.unitId)
          ?.liveFilter === null,
    );

    editor.setSelectedItems(selectedItemsForDrag);
    setActiveDragState({
      currentScreenPoint: getPointerScreenPoint(event.nativeEvent),
      selectedItems: selectedItemsForDrag,
      startCanvasPoint: screenToCanvasPoint(getPointerScreenPoint(event.nativeEvent)),
      startScreenPoint: getPointerScreenPoint(event.nativeEvent),
      type: "employee",
    });
  };

  const handleEmployeeContextMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    unit: OrgEditorUnit,
    employeeId: EmployeeId,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const item = {
      employeeId,
      type: "employee",
      unitId: unit.id,
    } satisfies OrgEditorSelectedItem;
    const itemKey = createOrgEditorSelectedItemKey(item);
    const hasOnlyEmployeeSelection =
      editor.selectedItems.length > 0 &&
      editor.selectedItems.every((selectedItem) => selectedItem.type === "employee");

    if (!selectedItemKeySet.has(itemKey) || !hasOnlyEmployeeSelection) {
      editor.setSelectedItems([item]);
    }

    const screenPoint = { x: event.clientX, y: event.clientY };

    setContextMenu({
      canvasPoint: screenToCanvasPoint(screenPoint),
      employeeId,
      screenPoint,
      type: "employees",
      unitId: unit.id,
    });
  };

  const selectedEmployeeCount = editor.selectedItems.filter(
    (item) => item.type === "employee",
  ).length;
  const selectedUnitCount = editor.selectedItems.filter((item) => item.type === "unit").length;
  const contextEmployeeUnit =
    contextMenu?.type === "employees" ? (unitById.get(contextMenu.unitId) ?? null) : null;
  const contextEmployee =
    contextMenu?.type === "employees" ? employeeById.get(contextMenu.employeeId) : null;
  const contextTagEmployees = (() => {
    if (contextMenu?.type !== "employees") return [];

    const employeeIds = new Set(
      editor.selectedItems.flatMap((item) => (item.type === "employee" ? [item.employeeId] : [])),
    );

    return [...employeeIds].flatMap((employeeId) => {
      const employee = employeeById.get(employeeId);
      return employee ? [employee] : [];
    });
  })();
  const contextMenuSingleUnitId =
    contextMenu?.type === "units" && contextMenu.unitIds.length === 1
      ? (contextMenu.unitIds[0] ?? null)
      : null;
  const contextMenuSingleUnit =
    contextMenuSingleUnitId !== null ? (unitById.get(contextMenuSingleUnitId) ?? null) : null;
  const editedUnit =
    unitDialog?.unitId !== null && unitDialog?.unitId !== undefined
      ? (editor.units.find((unit) => unit.id === unitDialog.unitId) ?? null)
      : null;
  const unitDialogParentName =
    unitDialog?.parentId !== null && unitDialog?.parentId !== undefined
      ? (unitById.get(unitDialog.parentId)?.name ?? null)
      : null;
  const pasteContextMenuLabel =
    editor.hasClipboardUnits && editor.hasClipboardEmployees
      ? t("Paste Units and Employees")
      : editor.hasClipboardUnits
        ? editor.clipboard?.units.length === 1
          ? t("Paste Unit")
          : t("Paste Units")
        : editor.clipboard?.employeeIds.length === 1
          ? t("Paste Employee")
          : t("Paste Employees");
  const selectionRect =
    dragState?.type === "select"
      ? getSelectionRect(dragState.startScreenPoint, dragState.currentScreenPoint)
      : null;
  const employeeDragPreview = getOrgEditorEmployeeDragPreview(dragState, employeeById);
  const employeeDragSourceUnitIds =
    dragState?.type === "employee"
      ? getOrgEditorEmployeeDragSourceUnitIds(dragState.selectedItems)
      : null;
  const employeeDropTargetUnit = employeeDragPreview
    ? getEmployeeDropTarget(
        screenToCanvasPoint(employeeDragPreview.point),
        employeeDragSourceUnitIds ?? undefined,
      )
    : null;
  const canvasGridSize = getAdaptiveOrgEditorGridSize(renderViewport.scale);
  const canvasGridScreenSize = canvasGridSize * renderViewport.scale;

  return (
    <>
      <section
        className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-transparent"
        data-demo-id="org-structure-editor-tab"
        dir={textDirection}
      >
        <div
          aria-label={t("Org Editor canvas")}
          className={cn(
            "absolute inset-0 select-none overflow-hidden bg-canvas",
            editor.units.length > 0 && "cursor-grab active:cursor-grabbing",
          )}
          data-demo-id="org-editor-canvas"
          data-grid-base-size={ORG_EDITOR_GRID_SIZE}
          data-grid-screen-size={canvasGridScreenSize}
          data-grid-size={canvasGridSize}
          data-spatial-candidate-count={visibleUnitQuery.candidateCount}
          onAuxClick={(event) => event.preventDefault()}
          onContextMenu={handleCanvasContextMenu}
          onPointerDown={handleCanvasPointerDown}
          ref={canvasRef}
          role="application"
          style={{
            backgroundImage:
              editor.units.length > 0
                ? `
              linear-gradient(to right, color-mix(in oklab, var(--border) 55%, transparent) 1px, transparent 1px),
              linear-gradient(to bottom, color-mix(in oklab, var(--border) 55%, transparent) 1px, transparent 1px)
            `
                : "none",
            backgroundPosition: `${renderViewport.x}px ${renderViewport.y}px`,
            backgroundSize: `${canvasGridScreenSize}px ${canvasGridScreenSize}px`,
          }}
        >
          <div
            className="absolute left-0 top-0"
            data-org-editor-rendered-unit-count={visibleUnits.length}
            data-org-editor-total-unit-count={editor.units.length}
            dir="ltr"
            style={{
              transform: `translate(${renderViewport.x}px, ${renderViewport.y}px) scale(${renderViewport.scale})`,
              transformOrigin: "0 0",
            }}
          >
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 h-[8000px] w-[8000px] overflow-visible"
            >
              {visibleConnectionUnits.map(({ parentUnit, unit }) => (
                <path
                  className="stroke-border"
                  d={getOrgEditorConnectionPath({
                    layoutMode: editor.layoutMode,
                    parentUnit,
                    unit,
                  })}
                  fill="none"
                  key={`${parentUnit.id}:${unit.id}`}
                  strokeWidth={2}
                />
              ))}
              {connectionDragPath && (
                <path
                  className="stroke-primary"
                  d={connectionDragPath}
                  fill="none"
                  strokeDasharray="8 8"
                  strokeLinecap="round"
                  strokeWidth={2.5}
                />
              )}
            </svg>
            {visibleUnits.map((unit) => (
              <OrgEditorNode
                employeeById={employeeById}
                isConnectionDropTarget={connectionDropTargetUnit?.id === unit.id}
                isEmployeeDropTarget={employeeDropTargetUnit?.id === unit.id}
                key={unit.id}
                layoutMode={editor.layoutMode}
                onAddChild={openCreateChildUnit}
                onConnectionPointerDown={handleConnectionPointerDown}
                onEditUnit={openEditUnit}
                onEmployeeContextMenu={handleEmployeeContextMenu}
                onEmployeePointerDown={handleEmployeePointerDown}
                onUnitContextMenu={handleUnitContextMenu}
                onUnitDoubleClick={handleUnitDoubleClick}
                onUnitPointerDown={handleUnitPointerDown}
                selectedItemKeySet={selectedItemKeySet}
                summary={
                  employeeSummaryByUnitId.get(unit.id) ?? {
                    directCount: unit.employeeIds.length,
                    hasChildUnits: false,
                    totalCount: unit.employeeIds.length,
                  }
                }
                tagSummary={unitTagSummaryByUnitId.get(unit.id) ?? []}
                textDirection={textDirection}
                unit={unit}
                visibleWorldRect={visibleWorldRect}
              />
            ))}
          </div>
          {editor.units.length === 0 && (
            <div className="absolute inset-0 z-20 flex">
              <TopLevelEmptyState
                action={
                  <Button
                    aria-label={t("Add to empty canvas")}
                    data-demo-id="org-editor-empty-canvas-add"
                    onClick={handleEmptyCanvasAddClick}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    type="button"
                  >
                    <HiOutlinePlus />
                    {t("Add to canvas")}
                  </Button>
                }
                description={t("Add a Team or Employees to begin arranging the structure.")}
                icon={<HiOutlineBuildingOffice2 className="size-6" />}
                title={t("The structure does not have any Units yet")}
              />
            </div>
          )}
          {selectionRect && (
            <div
              className="pointer-events-none fixed z-20 rounded-md border border-signal bg-accent/45"
              data-org-editor-selection-rect
              style={{
                height: selectionRect.height,
                left: selectionRect.x,
                top: selectionRect.y,
                width: selectionRect.width,
              }}
            />
          )}
          {employeeDragPreview && (
            <OrgEditorEmployeeDragPreview
              count={employeeDragPreview.count}
              employee={employeeDragPreview.employee}
              point={employeeDragPreview.point}
            />
          )}
          {contextMenu?.type === "canvas" && (
            <OrgEditorFloatingMenu point={contextMenu.screenPoint}>
              <OrgEditorMenuButton
                onClick={() => {
                  openCreateUnit(contextMenu.canvasPoint);
                }}
              >
                <HiOutlinePlus />
                {t("Add Unit")}
              </OrgEditorMenuButton>
              <OrgEditorMenuButton
                onClick={() => {
                  setAddEmployeesTarget({
                    point: contextMenu.canvasPoint,
                    type: "newUnit",
                  });
                  setContextMenu(null);
                }}
              >
                <HiOutlineUserPlus />
                {t("Add Employees")}
              </OrgEditorMenuButton>
              <OrgEditorMenuButton
                dataDemoId="org-editor-create-employee-canvas-action"
                onClick={() => openCreateEmployeeAtPoint(contextMenu.canvasPoint)}
              >
                <HiOutlineUserPlus />
                {t("Create Employee")}
              </OrgEditorMenuButton>
              {editor.canPaste && (
                <>
                  <span className="my-1 h-px bg-border" />
                  <OrgEditorMenuButton
                    onClick={() => {
                      editor.pasteAt(contextMenu.canvasPoint);
                      setContextMenu(null);
                    }}
                  >
                    <HiOutlineClipboard />
                    {pasteContextMenuLabel}
                  </OrgEditorMenuButton>
                </>
              )}
            </OrgEditorFloatingMenu>
          )}
          {contextMenu?.type === "employees" && (
            <OrgEditorFloatingMenu point={contextMenu.screenPoint}>
              <OrgEditorMenuButton
                disabled={contextEmployeeUnit?.bossEmployeeId === contextMenu.employeeId}
                onClick={() => {
                  editor.setUnitBoss(contextMenu.unitId, contextMenu.employeeId);
                  setContextMenu(null);
                }}
              >
                <HiOutlineUserGroup />
                {t("Make boss")}
              </OrgEditorMenuButton>
              {contextEmployeeUnit?.bossEmployeeId === contextMenu.employeeId && (
                <OrgEditorMenuButton
                  onClick={() => {
                    editor.setUnitBoss(contextMenu.unitId, null);
                    setContextMenu(null);
                  }}
                >
                  <HiOutlineUserMinus />
                  {t("Remove boss")}
                </OrgEditorMenuButton>
              )}
              {contextEmployee && (
                <>
                  <span className="my-1 h-px bg-border" />
                  <OrgEditorEmployeeTagSubmenu
                    employees={contextTagEmployees}
                    onApply={(updates) => {
                      store.updateEmployeeTagsFromEditor(updates);
                    }}
                    tagOptions={tagOptions}
                  />
                  <OrgEditorMenuButton
                    dataDemoId="org-editor-edit-employee-action"
                    onClick={() => {
                      setEmployeeDialogState({
                        employee: contextEmployee,
                        initialUnitIds: [],
                      });
                      setContextMenu(null);
                    }}
                  >
                    <HiOutlinePencilSquare />
                    {t("Edit")}
                  </OrgEditorMenuButton>
                </>
              )}
              {contextEmployeeUnit?.liveFilter === null && (
                <>
                  <span className="my-1 h-px bg-border" />
                  <OrgEditorMenuButton
                    onClick={() => {
                      editor.copySelected();
                      setContextMenu(null);
                    }}
                  >
                    <HiOutlineDocumentDuplicate />
                    {selectedEmployeeCount > 1 ? t("Copy Employees") : t("Copy")}
                  </OrgEditorMenuButton>
                  <OrgEditorMenuButton
                    onClick={() => {
                      editor.deleteSelected();
                      setContextMenu(null);
                    }}
                    variant="destructive"
                  >
                    <HiOutlineTrash />
                    {selectedEmployeeCount > 1 ? t("Delete Employees") : t("Delete")}
                  </OrgEditorMenuButton>
                </>
              )}
              {contextEmployee && (
                <span className="max-w-60 truncate px-2 pb-1 pt-1.5 text-xs text-muted-foreground">
                  {contextEmployee.fullName}
                </span>
              )}
            </OrgEditorFloatingMenu>
          )}
          {contextMenu?.type === "units" && (
            <OrgEditorFloatingMenu point={contextMenu.screenPoint}>
              {contextMenu.unitIds.length === 1 && (
                <>
                  <OrgEditorMenuButton
                    onClick={() => {
                      const [unitId] = contextMenu.unitIds;
                      if (unitId) openCreateChildUnit(unitId);
                      setContextMenu(null);
                    }}
                  >
                    <HiOutlinePlus />
                    {t("Add child Unit")}
                  </OrgEditorMenuButton>
                  {contextMenuSingleUnit && (
                    <OrgEditorMenuButton
                      dataDemoId="org-editor-edit-unit-action"
                      onClick={() => openEditUnit(contextMenuSingleUnit)}
                    >
                      <HiOutlinePencilSquare />
                      {t("Edit Unit")}
                    </OrgEditorMenuButton>
                  )}
                  {contextMenuSingleUnit?.liveFilter === null && (
                    <OrgEditorMenuButton
                      dataDemoId="org-editor-create-employee-action"
                      onClick={() => {
                        const [unitId] = contextMenu.unitIds;
                        if (unitId) {
                          openCreateEmployeeForUnits([unitId]);
                        }
                        setContextMenu(null);
                      }}
                    >
                      <HiOutlineUserPlus />
                      {t("Create Employee")}
                    </OrgEditorMenuButton>
                  )}
                  <span className="my-1 h-px bg-border" />
                </>
              )}
              <OrgEditorMenuButton
                onClick={() => {
                  editor.setUnitsCollapsed(contextMenu.unitIds, true, {
                    includeDescendants: true,
                  });
                  setContextMenu(null);
                }}
              >
                <HiOutlineMinus />
                {t("Collapse")}
              </OrgEditorMenuButton>
              <OrgEditorMenuButton
                onClick={() => {
                  editor.setUnitsCollapsed(contextMenu.unitIds, false, {
                    includeDescendants: true,
                  });
                  setContextMenu(null);
                }}
              >
                <HiOutlinePlus />
                {t("Expand")}
              </OrgEditorMenuButton>
              <span className="my-1 h-px bg-border" />
              <OrgEditorMenuButton
                onClick={() => {
                  editor.copySelected();
                  setContextMenu(null);
                }}
              >
                <HiOutlineDocumentDuplicate />
                {selectedUnitCount > 1 ? t("Copy Units") : t("Copy")}
              </OrgEditorMenuButton>
              {contextMenuSingleUnit && (
                <>
                  <span className="my-1 h-px bg-border" />
                  <OrgEditorMenuButton
                    dataDemoId="org-editor-export-action"
                    onClick={() => {
                      setExportUnitId(contextMenuSingleUnit.id);
                      setContextMenu(null);
                    }}
                  >
                    <HiOutlineArrowDownTray />
                    {t("Export")}
                  </OrgEditorMenuButton>
                </>
              )}
              <span className="max-w-60 truncate px-2 pb-1 pt-1.5 text-xs text-muted-foreground">
                {countText("units", {
                  count: selectedUnitCount || contextMenu.unitIds.length,
                })}
              </span>
            </OrgEditorFloatingMenu>
          )}
        </div>

        <div className="absolute start-3 top-3 z-30 flex max-w-[calc(100%-1.5rem)] min-w-0 items-stretch gap-2">
          <div className={ORG_EDITOR_TOOLBAR_SURFACE_CLASS_NAME}>
            <OrgViewToolbar
              activeViewId={store.activeOrgViewId}
              onCreate={store.createOrgView}
              onDelete={store.deleteOrgView}
              onRename={store.renameOrgView}
              onSelect={store.selectOrgView}
              views={store.orgViewList}
            />
          </div>
          {editor.units.length > 0 && (
            <div
              className={ORG_EDITOR_TOOLBAR_SURFACE_CLASS_NAME}
              data-demo-id="org-editor-history-actions"
            >
              <OrgEditorHistoryToolbar
                canRedo={editor.canRedo}
                canUndo={editor.canUndo}
                onRedo={editor.redo}
                onUndo={editor.undo}
              />
            </div>
          )}
        </div>

        {editor.units.length > 0 && (
          <div
            className={cn(
              "absolute end-3 top-16 z-30 flex max-w-[calc(100%-1.5rem)] items-stretch justify-end gap-1 sm:top-3",
              ORG_EDITOR_TOOLBAR_SURFACE_CLASS_NAME,
            )}
            data-demo-id="org-editor-actions"
          >
            <OrgEditorSearchControl
              onOpenChange={(nextSearchOpen) =>
                store.setEditorUi({
                  searchOpen: nextSearchOpen,
                  ...(nextSearchOpen ? {} : { searchQuery: "" }),
                })
              }
              onQueryChange={(searchQuery) => store.setEditorUi({ searchQuery })}
              onSelectResult={selectOrgEditorSearchResult}
              open={searchOpen}
              query={searchQuery}
              queryTokens={orgEditorSearchTokens}
              results={orgEditorSearchResults}
            />
            <OrgEditorLayoutSwitch layoutMode={editor.layoutMode} onToggle={toggleLayoutMode} />
            <OrgEditorToolbarButton
              dataDemoId="org-editor-align-button"
              onClick={() =>
                selectedUnitCount >= 2
                  ? editor.applyLayoutToUnits(selectedUnitIds)
                  : editor.applyLayout()
              }
              title={
                selectedUnitCount >= 2 ? t("Arrange selected") : t("Arrange the current hierarchy")
              }
            >
              <HiOutlineSquares2X2 />
              <span>{t(selectedUnitCount >= 2 ? "Arrange selected" : "Arrange")}</span>
            </OrgEditorToolbarButton>
            <OrgEditorToolbarButton
              ariaLabel={toggleAllUnitsLabel}
              dataDemoId="org-editor-toggle-all-units-button"
              onClick={() =>
                editor.setUnitsCollapsed(
                  editor.units.map((unit) => unit.id),
                  !hasCollapsedUnits,
                )
              }
              title={toggleAllUnitsLabel}
            >
              {hasCollapsedUnits ? <HiOutlineArrowsPointingOut /> : <HiOutlineArrowsPointingIn />}
              <span>{toggleAllUnitsLabel}</span>
            </OrgEditorToolbarButton>
          </div>
        )}

        {editor.units.length > 0 && (
          <div
            className={cn(
              "absolute bottom-3 start-3 z-30 flex items-stretch gap-1",
              ORG_EDITOR_TOOLBAR_SURFACE_CLASS_NAME,
            )}
            data-demo-id="org-editor-viewport-actions"
          >
            <OrgEditorToolbarButton
              onClick={() =>
                zoomAt(
                  { x: window.innerWidth / 2, y: window.innerHeight / 2 },
                  clamp(renderViewportRef.current.scale * 0.9, MIN_CANVAS_SCALE, MAX_CANVAS_SCALE),
                )
              }
            >
              <HiOutlineMinus />
            </OrgEditorToolbarButton>
            <OrgEditorToolbarButton
              onClick={() =>
                zoomAt(
                  { x: window.innerWidth / 2, y: window.innerHeight / 2 },
                  clamp(renderViewportRef.current.scale * 1.1, MIN_CANVAS_SCALE, MAX_CANVAS_SCALE),
                )
              }
            >
              <HiOutlinePlus />
            </OrgEditorToolbarButton>
            <OrgEditorToolbarButton onClick={resetViewportScale}>
              <HiOutlineArrowPath />
              {Math.round(renderViewport.scale * 100)}%
            </OrgEditorToolbarButton>
            <OrgEditorToolbarButton
              ariaLabel={t("Focus the primary Unit")}
              dataDemoId="org-editor-focus-primary-unit-button"
              disabled={!primaryRootUnit}
              onClick={focusPrimaryRootUnit}
              title={t("Focus the primary Unit")}
            >
              <HiOutlineViewfinderCircle />
            </OrgEditorToolbarButton>
          </div>
        )}
      </section>
      {unitDialog && units && (
        <UnitDialog
          editorUnits={editor.units}
          initialUnit={editedUnit}
          onOpenChange={(open) => !open && setUnitDialog(null)}
          onSave={(configuration) => {
            if (editedUnit) {
              editor.configureUnit(editedUnit.id, configuration);
              return;
            }

            editor.addConfiguredUnit({
              configuration,
              parentId: unitDialog.parentId,
              x: unitDialog.point.x - getOrgEditorUnitWidth({ name: configuration.name }) / 2,
              y: unitDialog.point.y - 80,
            });
          }}
          open
          parentName={unitDialogParentName}
          structure={units}
        />
      )}
      <AddEmployeesDialog
        employeeSearchDocumentByEmployeeId={employeeSearchDocumentByEmployeeId}
        employeeUnitMembershipsByEmployeeId={employeeUnitMembershipsByEmployeeId}
        employees={availableEmployees}
        onAdd={(employeeIds) => {
          if (addEmployeesTarget?.type === "newUnit") {
            const unitName = t("Employees");
            const unitId = editor.addUnit({
              name: unitName,
              x: addEmployeesTarget.point.x - getOrgEditorUnitWidth({ name: unitName }) / 2,
              y: addEmployeesTarget.point.y - 80,
            });

            addEmployeeSourcesToUnit(unitId, employeeIds);
          }
        }}
        {...(addEmployeesTarget?.type === "newUnit"
          ? {
              onCreate: () => openCreateEmployeeAtPoint(addEmployeesTarget.point),
            }
          : {})}
        onOpenChange={(open) => {
          if (!open) setAddEmployeesTarget(null);
        }}
        open={Boolean(addEmployeesTarget)}
        positionOptions={positionOptions}
        tagOptions={tagOptions}
        unitContextsByEmployeeId={employeeUnitContextsByEmployeeId}
        units={activeEditorStructure ?? units}
      />
      {employeeDialogState && (
        <EmployeeDialog
          employee={employeeDialogState.employee}
          initialUnitIds={employeeDialogState.initialUnitIds}
          mode="editor"
          onOpenChange={(open) => !open && setEmployeeDialogState(null)}
          onSave={(fields, assignments) => {
            if (!employeeDialogState.employee) {
              store.createEmployee(fields, assignments, store.activeOrgViewId);
            } else {
              store.updateEmployee(
                employeeDialogState.employee.id,
                fields,
                assignments,
                store.activeOrgViewId,
              );
            }
          }}
          open={Boolean(employeeDialogState)}
          tagOptions={tagOptions}
          units={editor.units}
        />
      )}
      <OrgEditorExportDialog
        employeeById={employeeById}
        layoutMode={editor.layoutMode}
        onOpenChange={(open) => {
          if (!open) setExportUnitId(null);
        }}
        open={Boolean(exportUnit)}
        sourceIndex={sourceIndex}
        tagOrder={tagOrder}
        unit={exportUnit}
        units={displayUnits}
      />
    </>
  );
});
