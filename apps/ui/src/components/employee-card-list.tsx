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
import {
  renderEmployeeDisplayLineDetails,
  wrapEmployeeDisplayRichLines,
} from "@/lib/employee-display";
import { createEmployeeProfileUrl, createMailtoUrl } from "@/lib/employee-links";
import type { EmployeeUnitContext } from "@/lib/employee-unit-contexts";
import { cn } from "@/lib/utils";
import { useOrgStore } from "@/stores/org-store-context";

const CARD_HEIGHT_ESTIMATE = 132;
const EMPTY_EMPLOYEES: Employee[] = [];

type EmployeeCardListProps = {
  actions?: (employee: Employee) => ReactNode;
  bossUnitId?: UnitId | null;
  cardDataDemoId?: string;
  cardClassName?: string;
  className?: string;
  dataDemoId?: string;
  displayFormat?: string;
  displayLineGap?: number;
  displayUnitContexts?: (employee: Employee) => EmployeeUnitContext[];
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
  displayFormat?: string;
  displayLineGap?: number;
  displayUnitContexts?: readonly EmployeeUnitContext[];
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

export const EmployeeDisplayContent = observer(function EmployeeDisplayContent({
  className,
  compact = false,
  density = "card",
  employee,
  format,
  lineGap,
  interactiveLinks = true,
  onUnitContextClick,
  queryTokens = [],
  unitContexts,
  wrapWidth,
}: {
  className?: string;
  compact?: boolean;
  density?: "card" | "editor";
  employee: Employee;
  format?: string;
  lineGap?: number;
  interactiveLinks?: boolean;
  onUnitContextClick?: (unitContext: EmployeeUnitContext) => void;
  queryTokens?: string[];
  unitContexts?: readonly EmployeeUnitContext[];
  wrapWidth?: number;
}) {
  const store = useOrgStore();
  const t = useUiText();
  const resolvedUnitContexts =
    unitContexts ?? store.employeeUnitContextsByEmployeeId.get(employee.id) ?? [];
  const richLines = renderEmployeeDisplayLineDetails({
    customEmployeeFieldDefinitions: store.employeeFieldDefinitions,
    employee,
    format: format ?? store.employeeDisplayFormats.employees,
    positionNotSpecifiedLabel: t("Position not specified"),
    unitContexts: resolvedUnitContexts,
  });
  const lines = wrapWidth ? wrapEmployeeDisplayRichLines(richLines, wrapWidth) : richLines;
  const resolvedLineGap = lineGap ?? store.employeeDisplayLineGaps.employees;
  const profileUrl = createEmployeeProfileUrl(employee.profileUrl);
  const lineClassName = cn(
    "flex min-w-0 flex-wrap items-center overflow-hidden font-normal",
    density === "editor" ? "text-xs leading-4" : "text-sm leading-5",
  );
  const actionClassName =
    "max-w-full break-words rounded-sm text-signal underline underline-offset-2 outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring";
  const textClassName = (node: (typeof lines)[number]["nodes"][number]) =>
    node.type === "text"
      ? cn(
          "min-w-0 max-w-full break-words whitespace-pre-wrap",
          node.marks.bold && "font-semibold",
          node.marks.italic && "italic",
          node.marks.strike && "line-through",
          node.marks.code && "rounded-sm bg-muted px-1 py-0.5 font-mono text-[0.9em]",
          node.explicitLink && node.href && "text-signal underline underline-offset-2",
        )
      : undefined;

  return (
    <div
      className={cn("grid min-w-0", className)}
      data-employee-display-content
      style={{ rowGap: resolvedLineGap }}
    >
      {lines.map((line, index) => {
        const key = `${index}:${line.text}`;
        return (
          <span
            aria-hidden={line.blank ? "true" : undefined}
            className={lineClassName}
            data-employee-display-blank={line.blank ? "true" : undefined}
            key={key}
            style={{
              lineHeight: `${(density === "editor" ? 16 : 20) + resolvedLineGap}px`,
              marginBottom: -resolvedLineGap,
              minHeight: line.blank ? (density === "editor" ? 16 : 20) : undefined,
            }}
          >
            {line.nodes.map((node, nodeIndex) => {
              const nodeKey = `${nodeIndex}:${node.type}`;
              if (node.type === "tags") {
                return (
                  <EmployeeTags
                    compact={compact}
                    density={density === "editor" ? "canvas" : "default"}
                    inline
                    key={nodeKey}
                    queryTokens={queryTokens}
                    tags={node.tags}
                  />
                );
              }
              if (node.type === "positions") {
                return (
                  <span className="inline-flex max-w-full flex-wrap gap-1" key={nodeKey}>
                    {node.positions.map(({ label, unitContext }) => (
                      <span
                        className={cn(
                          "inline-flex max-w-full items-center rounded-md border bg-muted text-muted-foreground",
                          density === "editor"
                            ? "px-1.5 py-0 text-[9px] leading-3"
                            : "px-2 py-1 text-xs leading-snug",
                        )}
                        data-employee-position-assignment
                        key={unitContext.id}
                        title={`${label} · ${unitContext.unitFullPath}`}
                      >
                        <span className="min-w-0 truncate font-medium text-foreground">
                          <HighlightedText queryTokens={queryTokens} text={label} />
                        </span>
                        <MiddleDot {...(density === "editor" ? { className: "mx-0.5" } : {})} />
                        {interactiveLinks && onUnitContextClick ? (
                          <button
                            className="min-w-0 cursor-pointer truncate rounded-sm text-left outline-none transition-colors hover:bg-accent hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={(event) => {
                              event.stopPropagation();
                              onUnitContextClick(unitContext);
                            }}
                            type="button"
                          >
                            <HighlightedText
                              queryTokens={queryTokens}
                              text={unitContext.unitName}
                            />
                          </button>
                        ) : (
                          <span className="min-w-0 truncate">
                            <HighlightedText
                              queryTokens={queryTokens}
                              text={unitContext.unitName}
                            />
                          </span>
                        )}
                      </span>
                    ))}
                  </span>
                );
              }
              if (node.explicitLink) {
                if (!node.href || !interactiveLinks) {
                  return (
                    <span
                      className={textClassName(node)}
                      data-employee-markdown-link={node.href ? "inert" : "unsafe"}
                      key={nodeKey}
                    >
                      <HighlightedText queryTokens={queryTokens} text={node.text} />
                    </span>
                  );
                }
                const isExternal = /^https?:/iu.test(node.href);
                return (
                  <a
                    className={cn(actionClassName, textClassName(node))}
                    data-employee-markdown-link="interactive"
                    href={node.href}
                    key={nodeKey}
                    onClick={(event) => event.stopPropagation()}
                    {...(isExternal
                      ? {
                          referrerPolicy: "no-referrer" as const,
                          rel: "noopener noreferrer",
                          target: "_blank",
                        }
                      : {})}
                  >
                    <HighlightedText queryTokens={queryTokens} text={node.text} />
                  </a>
                );
              }
              if (
                (node.fieldName === "fullName" || node.fieldName === "profileUrl") &&
                profileUrl &&
                interactiveLinks
              ) {
                return (
                  <a
                    className={cn(actionClassName, textClassName(node))}
                    href={profileUrl}
                    key={nodeKey}
                    onClick={(event) => event.stopPropagation()}
                    referrerPolicy="no-referrer"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <HighlightedText queryTokens={queryTokens} text={node.text} />
                  </a>
                );
              }
              if (node.fieldName === "unitName" && onUnitContextClick && interactiveLinks) {
                return (
                  <span className={textClassName(node)} key={nodeKey}>
                    {resolvedUnitContexts.map((unitContext, unitIndex) => (
                      <span key={unitContext.id}>
                        {unitIndex > 0 && "; "}
                        <button
                          className={actionClassName}
                          onClick={(event) => {
                            event.stopPropagation();
                            onUnitContextClick(unitContext);
                          }}
                          type="button"
                        >
                          <HighlightedText queryTokens={queryTokens} text={unitContext.unitName} />
                        </button>
                      </span>
                    ))}
                  </span>
                );
              }
              return (
                <span className={textClassName(node)} key={nodeKey}>
                  <HighlightedText queryTokens={queryTokens} text={node.text} />
                </span>
              );
            })}
          </span>
        );
      })}
    </div>
  );
});

export const EmployeeCard = observer(function EmployeeCard({
  actions,
  bossPosition = null,
  className,
  dataDemoId,
  displayFormat,
  displayLineGap,
  displayUnitContexts,
  draggable = false,
  employee,
  onClick,
  onDoubleClick,
  onDragEnd,
  onDragStart,
  onUnitContextClick,
  queryTokens = [],
  selected = false,
  variant = "list",
}: EmployeeCardProps) {
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
        aria-label={employee.fullName}
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
          <EmployeeDisplayContent
            compact
            employee={employee}
            queryTokens={queryTokens}
            {...(displayFormat === undefined ? {} : { format: displayFormat })}
            {...(displayLineGap === undefined ? {} : { lineGap: displayLineGap })}
            {...(displayUnitContexts === undefined ? {} : { unitContexts: displayUnitContexts })}
            {...(onUnitContextClick ? { onUnitContextClick } : {})}
          />
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
      aria-label={employee.fullName}
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
        <EmployeeDisplayContent
          employee={employee}
          queryTokens={queryTokens}
          {...(displayFormat === undefined ? {} : { format: displayFormat })}
          {...(displayLineGap === undefined ? {} : { lineGap: displayLineGap })}
          {...(displayUnitContexts === undefined ? {} : { unitContexts: displayUnitContexts })}
          {...(onUnitContextClick ? { onUnitContextClick } : {})}
        />
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
  displayFormat,
  displayLineGap,
  displayUnitContexts,
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
                  {...(displayFormat === undefined ? {} : { displayFormat })}
                  {...(displayLineGap === undefined ? {} : { displayLineGap })}
                  {...(displayUnitContexts === undefined
                    ? {}
                    : { displayUnitContexts: displayUnitContexts(employee) })}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
