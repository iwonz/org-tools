"use client";

import type { Employee, EmployeeId, Unit } from "@org-tools/types";
import { forwardRef, type ReactNode } from "react";
import { HiOutlineArrowRightCircle, HiOutlineChevronDown } from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import { UnitAvatar } from "@/components/unit-avatar";
import { UnitStatusBadge } from "@/components/unit-status-badge";
import { useUiText } from "@/i18n/use-ui-text";
import { cn } from "@/lib/utils";

type UnitCardVariant = "list" | "compact";
type UnitCardExpandState = "expanded" | "collapsed" | "none";

export type UnitCardDropTarget = {
  active: boolean;
  dataDemoId?: string;
  label: string;
  onDragEnter: React.DragEventHandler<HTMLElement>;
  onDragLeave: React.DragEventHandler<HTMLElement>;
  onDragOver: React.DragEventHandler<HTMLElement>;
  onDrop: React.DragEventHandler<HTMLElement>;
};

type UnitCardProps = {
  actions?: ReactNode;
  className?: string;
  dataDemoId?: string;
  dropTarget?: UnitCardDropTarget;
  expandState?: UnitCardExpandState;
  employeesById?: ReadonlyMap<EmployeeId, Employee>;
  onClick?: (() => void) | undefined;
  onDoubleClick?: (() => void) | undefined;
  onToggleExpand?: (() => void) | undefined;
  selected?: boolean;
  subtitle: ReactNode;
  title?: ReactNode;
  unit: Unit;
  variant?: UnitCardVariant;
};

export const UnitCard = forwardRef<HTMLDivElement, UnitCardProps>(function UnitCard(
  {
    actions,
    className,
    dataDemoId,
    dropTarget,
    employeesById,
    expandState = "none",
    onClick,
    onDoubleClick,
    onToggleExpand,
    selected = false,
    subtitle,
    title,
    unit,
    variant = "list",
  },
  ref,
) {
  const t = useUiText();
  const isCompact = variant === "compact";
  const hasExpand = expandState !== "none";
  const avatarClassName = isCompact ? "" : "size-[50px] text-sm";
  const body = (
    <>
      <UnitAvatar
        className={avatarClassName}
        unit={unit}
        {...(employeesById ? { employeesById } : {})}
      />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <div className={cn("truncate font-medium", isCompact ? "text-sm" : "text-sm")}>
            {title ?? unit.name}
          </div>
          <UnitStatusBadge membershipMode={unit.membershipMode} />
        </div>
        <div className="mt-1 truncate text-xs tabular-nums text-muted-foreground">{subtitle}</div>
      </div>
    </>
  );

  return (
    <div
      className={cn(
        "relative flex min-w-0 items-center gap-3 rounded-none bg-transparent p-3 pr-4 transition-colors hover:bg-accent/50",
        selected && "bg-accent text-accent-foreground",
        dropTarget?.active && "border-primary bg-primary/10",
        className,
      )}
      data-demo-id={dataDemoId}
      ref={ref}
    >
      {dropTarget && (
        <section
          aria-label={dropTarget.label}
          className={cn(
            "absolute inset-0 z-20 flex items-center justify-center rounded-md border-2 border-dashed border-primary/40 bg-primary/[0.03] text-primary transition-colors",
            dropTarget.active && "border-primary bg-primary/15",
          )}
          data-demo-id={dropTarget.dataDemoId}
          data-state={dropTarget.active ? "active" : "idle"}
          onDragEnter={dropTarget.onDragEnter}
          onDragLeave={dropTarget.onDragLeave}
          onDragOver={dropTarget.onDragOver}
          onDrop={dropTarget.onDrop}
        >
          <span
            className={cn(
              "pointer-events-none inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/95 px-3 py-1.5 text-xs font-medium opacity-0 shadow-sm transition-opacity",
              dropTarget.active && "opacity-100",
            )}
          >
            <HiOutlineArrowRightCircle className="size-4 shrink-0" />
            <span>{t("Move here")}</span>
          </span>
        </section>
      )}
      {hasExpand && (
        <Button
          className="size-7 shrink-0 border-0 bg-transparent hover:bg-accent"
          onClick={onToggleExpand}
          size="icon"
          title={expandState === "expanded" ? t("Collapse") : t("Expand")}
          type="button"
          variant="ghost"
        >
          <HiOutlineChevronDown
            className={cn(
              "size-4 transition-transform",
              expandState === "collapsed" && "-rotate-90",
            )}
          />
        </Button>
      )}
      {onClick || onDoubleClick ? (
        <button
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-md text-left outline-none transition-colors hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onClick}
          onDoubleClick={onDoubleClick}
          type="button"
        >
          {body}
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">{body}</div>
      )}
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </div>
  );
});
