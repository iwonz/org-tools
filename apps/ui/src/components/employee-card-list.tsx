"use client";

import type { Employee, EmployeeId, EmployeeUnitPosition, UnitId } from "@org-tools/types";
import { useVirtualizer } from "@tanstack/react-virtual";
import { observer } from "mobx-react-lite";
import type { DragEvent, KeyboardEvent, ReactNode } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { HiOutlineInformationCircle } from "react-icons/hi2";

import { EmployeeAvatar } from "@/components/employee-avatar";
import { EmployeeTags } from "@/components/employee-tags";
import { HighlightedText } from "@/components/highlighted-text";
import { MiddleDot } from "@/components/middle-dot";
import { useUiText } from "@/i18n/use-ui-text";
import { createEmployeeProfileUrl, createMailtoUrl } from "@/lib/employee-links";
import type { EmployeeUnitContext } from "@/lib/employee-unit-contexts";
import { cn } from "@/lib/utils";

const CARD_HEIGHT_ESTIMATE = 132;
const EMPTY_EMPLOYEES: Employee[] = [];

type EmployeeCardListProps = {
  actions?: (employee: Employee) => ReactNode;
  bossUnitId?: UnitId | null;
  cardDataDemoId?: string;
  cardClassName?: string;
  className?: string;
  dataDemoId?: string;
  employees?: Employee[];
  emptyState?: ReactNode;
  draggable?: (employee: Employee) => boolean;
  name?: (employee: Employee) => ReactNode;
  onDragEnd?: (event: DragEvent<HTMLElement>, employee: Employee) => void;
  onDragStart?: (event: DragEvent<HTMLElement>, employee: Employee) => void;
  onUnitContextClick?: (unitContext: EmployeeUnitContext) => void;
  queryTokens?: string[];
  resetKey?: string;
  selected?: (employee: Employee) => boolean;
  subtitle?: (employee: Employee) => ReactNode;
  unitContextsByEmployeeId?: ReadonlyMap<EmployeeId, EmployeeUnitContext[]>;
  variant?: EmployeeCardVariant;
};

type EmployeeCardVariant = "list" | "compact";

const CARD_HEIGHT_ESTIMATE_BY_VARIANT: Record<EmployeeCardVariant, number> = {
  compact: 84,
  list: CARD_HEIGHT_ESTIMATE,
};

const CARD_GAP_BY_VARIANT: Record<EmployeeCardVariant, number> = {
  compact: 4,
  list: 0,
};

type EmployeeCardProps = {
  actions?: ((employee: Employee) => ReactNode) | undefined;
  bossPosition?: EmployeeUnitPosition | null;
  className?: string;
  dataDemoId?: string;
  draggable?: boolean;
  employee: Employee;
  name?: ReactNode;
  onClick?: (() => void) | undefined;
  onDoubleClick?: (() => void) | undefined;
  onDragEnd?: (event: DragEvent<HTMLElement>, employee: Employee) => void;
  onDragStart?: (event: DragEvent<HTMLElement>, employee: Employee) => void;
  onUnitContextClick?: (unitContext: EmployeeUnitContext) => void;
  queryTokens?: string[];
  selected?: boolean;
  subtitle?: ReactNode;
  unitContexts?: EmployeeUnitContext[];
  variant?: EmployeeCardVariant;
};

type EmployeeIdentityProps = {
  className?: string;
  employee: Employee;
  includePositions?: boolean;
  queryTokens?: string[];
};

const getBossPosition = (employee: Employee, bossUnitId: UnitId | null | undefined) => {
  if (bossUnitId === null || bossUnitId === undefined) return null;

  return (
    employee.unitPositions.find(
      (unitPosition) => unitPosition.unitId === bossUnitId && unitPosition.isBoss,
    ) ?? null
  );
};

export function EmployeeIdentity({
  className,
  employee,
  includePositions = false,
  queryTokens = [],
}: EmployeeIdentityProps) {
  const mailtoUrl = createMailtoUrl(employee.email);
  const positionSummary = includePositions
    ? employee.unitPositions
        .map((unitPosition) => unitPosition.position)
        .filter(Boolean)
        .slice(0, 2)
        .join(", ")
    : "";

  return (
    <div
      className={cn(
        "mt-1 flex min-w-0 flex-wrap items-center text-xs text-muted-foreground",
        className,
      )}
    >
      {employee.username && (
        <span className="min-w-0 truncate">
          <HighlightedText queryTokens={queryTokens} text={employee.username} />
        </span>
      )}
      {employee.email && mailtoUrl && (
        <>
          {employee.username && <MiddleDot />}
          <a
            className="min-w-0 cursor-pointer truncate rounded-sm outline-none transition-colors hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            href={mailtoUrl}
            onClick={(event) => event.stopPropagation()}
          >
            <HighlightedText queryTokens={queryTokens} text={employee.email} />
          </a>
        </>
      )}
      {positionSummary && (
        <>
          {(employee.username || employee.email) && <MiddleDot />}
          <span className="min-w-0 truncate">
            <HighlightedText queryTokens={queryTokens} text={positionSummary} />
          </span>
        </>
      )}
    </div>
  );
}

function EmployeeProfileLink({
  children,
  className,
  employee,
}: {
  children: ReactNode;
  className?: string;
  employee: Employee;
}) {
  const profileUrl = createEmployeeProfileUrl(employee.profileUrl);

  if (!profileUrl) {
    return <span className={className}>{children}</span>;
  }

  return (
    <a
      className={cn(
        "cursor-pointer rounded-sm outline-none transition-colors hover:text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      href={profileUrl}
      onClick={(event) => event.stopPropagation()}
      referrerPolicy="no-referrer"
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}

function EmployeeUnitContextTag({
  onClick,
  unitContext,
}: {
  onClick?: (unitContext: EmployeeUnitContext) => void;
  unitContext: EmployeeUnitContext;
}) {
  const t = useUiText();
  const title = `${unitContext.position || t("Position not specified")} · ${unitContext.unitFullPath}`;
  const label = unitContext.position || t("Position not specified");
  const handleClick = onClick ? () => onClick(unitContext) : undefined;

  return (
    <span
      className="inline-flex max-w-full items-center rounded-md border bg-muted px-2 py-1 text-xs leading-snug text-muted-foreground"
      title={title}
    >
      <span className="min-w-0 truncate font-medium text-foreground">{label}</span>
      <MiddleDot className="mx-1" />
      <button
        className={cn(
          "min-w-0 truncate rounded-sm text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
          handleClick && "cursor-pointer hover:bg-accent hover:text-foreground hover:underline",
        )}
        disabled={!handleClick}
        onClick={handleClick}
        type="button"
      >
        {unitContext.unitName}
      </button>
    </span>
  );
}

function EmployeeAvatarWithBossMarker({
  avatarClassName,
  bossPosition,
  employee,
}: {
  avatarClassName?: string;
  bossPosition: EmployeeUnitPosition | null;
  employee: Employee;
}) {
  const t = useUiText();
  return (
    <span className="group/boss relative inline-flex shrink-0">
      <EmployeeAvatar
        className={cn(
          avatarClassName,
          bossPosition && "ring-2 ring-signal ring-offset-2 ring-offset-background",
        )}
        employee={employee}
      />
      {bossPosition && (
        <>
          <button
            aria-label={t("Boss of the selected Unit")}
            className="absolute left-1/2 top-full inline-flex size-5 -translate-x-1/2 -translate-y-1/2 cursor-help items-center justify-center rounded-full bg-signal text-signal-foreground outline-none ring-2 ring-background transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ring"
            onClick={(event) => event.stopPropagation()}
            type="button"
          >
            <HiOutlineInformationCircle className="size-3" />
          </button>
          <span
            className="pointer-events-none absolute left-0 top-full z-50 mt-3 hidden w-72 rounded-md bg-popover px-3 py-2 text-left text-xs text-popover-foreground shadow-[0_8px_20px_-16px_rgb(0_0_0/0.55)] group-hover/boss:block group-focus-within/boss:block"
            role="tooltip"
          >
            <span className="block font-medium">{t("Boss of the selected Unit")}</span>
            <span className="mt-1 block text-muted-foreground">
              {bossPosition.position || t("Boss position is not specified")}
            </span>
          </span>
        </>
      )}
    </span>
  );
}

export const EmployeeCard = observer(function EmployeeCard({
  actions,
  bossPosition = null,
  className,
  dataDemoId,
  draggable = false,
  employee,
  name,
  onClick,
  onDoubleClick,
  onDragEnd,
  onDragStart,
  onUnitContextClick,
  queryTokens = [],
  selected = false,
  subtitle,
  unitContexts = [],
  variant = "list",
}: EmployeeCardProps) {
  const t = useUiText();
  const isCompact = variant === "compact";
  const isInteractive = Boolean(onClick || onDoubleClick);
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!onClick) return;
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    onClick();
  };

  if (isCompact) {
    return (
      <article
        className={cn(
          "flex h-full min-w-0 items-center gap-3 rounded-none bg-transparent px-3 py-2 transition-colors hover:bg-accent/45 active:bg-accent-strong/55",
          isInteractive && "cursor-pointer",
          draggable && "cursor-grab active:cursor-grabbing",
          selected && "bg-secondary text-foreground",
          className,
        )}
        data-demo-id={dataDemoId}
        draggable={draggable}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onDragEnd={onDragEnd ? (event) => onDragEnd(event, employee) : undefined}
        onDragStart={onDragStart ? (event) => onDragStart(event, employee) : undefined}
        onKeyDown={isInteractive ? handleKeyDown : undefined}
        role={isInteractive ? "button" : undefined}
        tabIndex={isInteractive ? 0 : undefined}
      >
        <EmployeeAvatarWithBossMarker bossPosition={bossPosition} employee={employee} />
        <div className="min-w-0 flex-1">
          <EmployeeProfileLink className="block truncate text-sm font-medium" employee={employee}>
            {name ?? employee.fullName}
          </EmployeeProfileLink>
          <div className="mt-1 block truncate text-xs text-muted-foreground">
            {subtitle ?? <EmployeeIdentity employee={employee} />}
          </div>
          <EmployeeTags className="mt-1.5" compact queryTokens={queryTokens} tags={employee.tags} />
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-1" data-employee-card-actions>
            {actions(employee)}
          </div>
        )}
      </article>
    );
  }

  return (
    <article
      className={cn(
        "relative flex min-w-0 items-start gap-3 rounded-none bg-transparent p-3.5 transition-colors hover:bg-accent/45 active:bg-accent-strong/55",
        isInteractive && "cursor-pointer",
        draggable && "cursor-grab active:cursor-grabbing",
        selected && "bg-secondary text-foreground",
        className,
      )}
      data-demo-id={dataDemoId}
      draggable={draggable}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onDragEnd={onDragEnd ? (event) => onDragEnd(event, employee) : undefined}
      onDragStart={onDragStart ? (event) => onDragStart(event, employee) : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
    >
      <EmployeeAvatarWithBossMarker
        avatarClassName="size-12 text-sm"
        bossPosition={bossPosition}
        employee={employee}
      />
      <div className="min-w-0 flex-1">
        <EmployeeProfileLink className="block truncate text-sm font-semibold" employee={employee}>
          {name ?? employee.fullName}
        </EmployeeProfileLink>
        {subtitle ?? <EmployeeIdentity employee={employee} />}
        <div className="mt-3 flex min-w-0 flex-wrap gap-1.5">
          {unitContexts.length === 0 ? (
            <span className="text-xs text-muted-foreground">
              {t("Positions and Units are not specified")}
            </span>
          ) : (
            unitContexts.map((unitContext) => (
              <EmployeeUnitContextTag
                key={`${employee.id}:${unitContext.id}`}
                unitContext={unitContext}
                {...(onUnitContextClick ? { onClick: onUnitContextClick } : {})}
              />
            ))
          )}
        </div>
        <EmployeeTags className="mt-2" queryTokens={queryTokens} tags={employee.tags} />
      </div>
      {actions && (
        <div className="flex shrink-0 items-start gap-1" data-employee-card-actions>
          {actions(employee)}
        </div>
      )}
    </article>
  );
});

export function EmployeeCardList({
  actions,
  bossUnitId,
  cardDataDemoId,
  cardClassName,
  className,
  dataDemoId,
  employees = EMPTY_EMPLOYEES,
  emptyState,
  draggable,
  name,
  onDragEnd,
  onDragStart,
  onUnitContextClick,
  queryTokens = [],
  resetKey,
  selected,
  subtitle,
  unitContextsByEmployeeId,
  variant = "list",
}: EmployeeCardListProps) {
  const t = useUiText();
  const resolvedEmptyState = emptyState ?? t("No Employees found");
  const parentRef = useRef<HTMLDivElement | null>(null);
  const virtualizer = useVirtualizer({
    count: employees.length,
    estimateSize: () => CARD_HEIGHT_ESTIMATE_BY_VARIANT[variant],
    gap: CARD_GAP_BY_VARIANT[variant],
    getItemKey: (index) => String(employees[index]?.id ?? `employee-row:${index}`),
    getScrollElement: () => parentRef.current,
    overscan: 8,
  });
  const measureVisibleRows = useCallback(() => {
    const rowElements = parentRef.current?.querySelectorAll<HTMLElement>("[data-index]");

    for (const rowElement of rowElements ?? []) {
      virtualizer.measureElement(rowElement);
    }
  }, [virtualizer]);

  useLayoutEffect(() => {
    virtualizer.measure();

    const animationFrameId = window.requestAnimationFrame(measureVisibleRows);

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [measureVisibleRows, virtualizer]);

  useEffect(() => {
    if (resetKey === undefined) return;

    virtualizer.scrollToOffset(0);

    const animationFrameId = window.requestAnimationFrame(() => {
      measureVisibleRows();
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [measureVisibleRows, resetKey, virtualizer]);

  return (
    <div
      className={cn(
        "min-h-0 min-w-0 overflow-y-auto overflow-x-hidden p-2 [scrollbar-gutter:stable]",
        className,
      )}
      data-demo-id={dataDemoId}
      ref={parentRef}
    >
      {employees.length === 0 ? (
        <div className="grid h-full min-h-[220px] place-items-center p-8 text-center text-sm text-muted-foreground">
          {resolvedEmptyState}
        </div>
      ) : (
        <div
          className="relative bg-transparent"
          data-employee-list-track
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const employee = employees[virtualRow.index];

            if (!employee) return null;

            return (
              <div
                className="absolute left-0 top-0 w-full"
                data-index={virtualRow.index}
                key={virtualRow.key}
                ref={virtualizer.measureElement}
                style={{ transform: `translateY(${virtualRow.start}px)` }}
              >
                <EmployeeCard
                  actions={actions}
                  bossPosition={getBossPosition(employee, bossUnitId)}
                  draggable={draggable?.(employee) ?? false}
                  employee={employee}
                  name={name?.(employee)}
                  selected={selected?.(employee) ?? false}
                  queryTokens={queryTokens}
                  subtitle={subtitle?.(employee)}
                  unitContexts={unitContextsByEmployeeId?.get(employee.id) ?? []}
                  variant={variant}
                  {...(onDragEnd ? { onDragEnd } : {})}
                  {...(onDragStart ? { onDragStart } : {})}
                  {...(cardDataDemoId ? { dataDemoId: cardDataDemoId } : {})}
                  {...(onUnitContextClick ? { onUnitContextClick } : {})}
                  {...(cardClassName ? { className: cardClassName } : {})}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
