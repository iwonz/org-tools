"use client";

import type { Employee, EmployeeId, EmployeeUnitPosition, UnitId } from "@org-tools/types";
import { useVirtualizer } from "@tanstack/react-virtual";
import { observer } from "mobx-react-lite";
import type { DragEvent, KeyboardEvent, ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { HiOutlineInformationCircle } from "react-icons/hi2";

import { EmployeeAvatar } from "@/components/employee-avatar";
import { EmployeeTags } from "@/components/employee-tags";
import { HighlightedText } from "@/components/highlighted-text";
import { MiddleDot } from "@/components/middle-dot";
import { TagSurface } from "@/components/tag-surface";
import { useAppFormatter, useUiText } from "@/i18n/use-ui-text";
import {
  type EmployeeDisplayVisualLayout,
  layoutEmployeeDisplayRichLines,
  renderEmployeeDisplayLineDetails,
} from "@/lib/employee-display";
import {
  employeeDisplayTextMeasureEngine,
  ensureEmployeeDisplayFontsReady,
  getEmployeeDisplayMeasurementRevision,
  getEmployeeDisplayUiFontFamily,
  subscribeEmployeeDisplayTextMeasurements,
} from "@/lib/employee-display-measure";
import { createMailtoUrl } from "@/lib/employee-links";
import type { EmployeeUnitContext } from "@/lib/employee-unit-contexts";
import { TAG_SURFACE_METRICS } from "@/lib/tag-surface";
import { cn } from "@/lib/utils";
import { useOrgStore } from "@/stores/org-store-context";

const CARD_HEIGHT_ESTIMATE = 132;
const EMPTY_EMPLOYEES: Employee[] = [];

export type EmployeeCardDisplayContext = "employees" | "fallback" | "units";

type EmployeeCardListProps = {
  actions?: (employee: Employee) => ReactNode;
  bossUnitId?: UnitId | null;
  cardDataDemoId?: string;
  cardClassName?: string;
  className?: string;
  dataDemoId?: string;
  displayFormat?: string;
  displayContext?: EmployeeCardDisplayContext;
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
  displayContext?: EmployeeCardDisplayContext;
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
  displayContext = "fallback",
  employee,
  format,
  lineGap,
  interactiveLinks = true,
  onUnitContextClick,
  queryTokens = [],
  unitContexts,
  visualLayout: providedVisualLayout,
  wrapWidth,
}: {
  className?: string;
  compact?: boolean;
  density?: "card" | "editor";
  displayContext?: EmployeeCardDisplayContext;
  employee: Employee;
  format?: string;
  lineGap?: number;
  interactiveLinks?: boolean;
  onUnitContextClick?: (unitContext: EmployeeUnitContext) => void;
  queryTokens?: string[];
  unitContexts?: readonly EmployeeUnitContext[];
  visualLayout?: EmployeeDisplayVisualLayout;
  wrapWidth?: number;
}) {
  const store = useOrgStore();
  const t = useUiText();
  const appFormat = useAppFormatter();
  const contentRef = useRef<HTMLDivElement>(null);
  const [measuredWrapWidth, setMeasuredWrapWidth] = useState<number | null>(null);
  const measurementRevision = useSyncExternalStore(
    subscribeEmployeeDisplayTextMeasurements,
    getEmployeeDisplayMeasurementRevision,
    getEmployeeDisplayMeasurementRevision,
  );
  useEffect(() => {
    void ensureEmployeeDisplayFontsReady(store.locale);
  }, [store.locale]);
  const resolvedUnitContexts =
    unitContexts ?? store.employeeUnitContextsByEmployeeId.get(employee.id) ?? [];
  const richLines = renderEmployeeDisplayLineDetails({
    customEmployeeFieldDefinitions: store.employeeFieldDefinitions,
    employee,
    format: format ?? store.employeeDisplayFormats.employees,
    positionNotSpecifiedLabel: t("Position not specified"),
    unitContexts: resolvedUnitContexts,
  });
  const resolvedLineGap = lineGap ?? store.employeeDisplayLineGaps.employees;
  useLayoutEffect(() => {
    if (providedVisualLayout || wrapWidth !== undefined) return;
    const element = contentRef.current;
    if (!element) return;
    const updateWidth = () => {
      const width = Math.floor(element.getBoundingClientRect().width);
      if (width > 0) setMeasuredWrapWidth((current) => (current === width ? current : width));
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, [providedVisualLayout, wrapWidth]);
  const resolvedWrapWidth = wrapWidth ?? measuredWrapWidth;
  const visualLayout =
    providedVisualLayout ??
    (resolvedWrapWidth
      ? layoutEmployeeDisplayRichLines(richLines, {
          availableWidth: resolvedWrapWidth,
          direction: store.locale === "ar" ? "rtl" : "ltr",
          font: getEmployeeDisplayUiFontFamily(),
          formatTag: (tag) =>
            tag.date
              ? `${tag.label} · ${appFormat.dateTime(new Date(`${tag.date}T00:00:00Z`), {
                  day: "numeric",
                  month: "short",
                  timeZone: "UTC",
                  ...(density === "editor" ? { year: "numeric" as const } : {}),
                })}`
              : tag.label,
          lineGap: resolvedLineGap,
          locale: store.locale,
          measureText: employeeDisplayTextMeasureEngine.measure,
          measurementRevision,
          textMode: density === "editor" ? "editor" : "card",
        })
      : null);
  const lines = richLines;
  const nativePositionLinks =
    interactiveLinks &&
    (displayContext === "employees" || displayContext === "units") &&
    onUnitContextClick !== undefined;
  const lineClassName = cn(
    "block min-w-0 overflow-hidden font-normal",
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
          node.marks.code && "rounded-sm bg-muted px-0.5 font-mono text-[0.9em]",
          node.explicitLink && node.href && "text-signal underline underline-offset-2",
        )
      : undefined;

  if (visualLayout) {
    return (
      <div
        className={cn("flex min-w-0 flex-col", className)}
        data-employee-display-content
        data-employee-display-line-gap={resolvedLineGap}
        dir={visualLayout.direction}
        ref={contentRef}
        style={{ height: visualLayout.height, rowGap: resolvedLineGap }}
      >
        {visualLayout.blocks.map((block) => (
          <span
            className="relative block min-w-0 shrink-0"
            data-employee-display-block
            key={`${block.y}:${block.height}`}
            style={{ height: block.height }}
          >
            {block.lines.map((line) => (
              <span
                aria-hidden={line.blank ? "true" : undefined}
                className={lineClassName}
                data-employee-display-blank={line.blank ? "true" : undefined}
                data-employee-display-visual-line
                key={`${line.blockY}:${line.height}:${line.text}`}
                style={{
                  height: line.height,
                  left: 0,
                  position: "absolute",
                  top: line.blockY,
                  width: "100%",
                }}
              >
                {line.fragments.map((fragment, fragmentIndex) => {
                  const key = `${fragmentIndex}:${fragment.type}:${fragment.text}`;
                  const fragmentStyle = {
                    height: fragment.height,
                    left: fragment.x,
                    position: "absolute" as const,
                    top: 0,
                  };
                  if (fragment.type === "text") {
                    const textFragmentStyle = {
                      ...fragmentStyle,
                      minWidth: fragment.width,
                      whiteSpace: "nowrap" as const,
                    };
                    const content = (
                      <HighlightedText queryTokens={queryTokens} text={fragment.text} />
                    );
                    if (fragment.node.explicitLink && fragment.node.href && interactiveLinks) {
                      const isExternal = /^https?:/iu.test(fragment.node.href);
                      return (
                        <a
                          className={cn(actionClassName, textClassName(fragment.node))}
                          data-employee-markdown-link="interactive"
                          href={fragment.node.href}
                          key={key}
                          onClick={(event) => event.stopPropagation()}
                          style={textFragmentStyle}
                          {...(isExternal
                            ? {
                                referrerPolicy: "no-referrer" as const,
                                rel: "noopener noreferrer",
                                target: "_blank",
                              }
                            : {})}
                        >
                          {content}
                        </a>
                      );
                    }
                    return (
                      <span
                        className={textClassName(fragment.node)}
                        data-employee-markdown-link={
                          fragment.node.explicitLink
                            ? fragment.node.href
                              ? "inert"
                              : "unsafe"
                            : undefined
                        }
                        key={key}
                        style={textFragmentStyle}
                      >
                        {content}
                      </span>
                    );
                  }
                  if (fragment.type === "tag") {
                    return (
                      <TagSurface
                        className="inline-flex items-center whitespace-nowrap"
                        color={fragment.tag.color}
                        key={key}
                        style={{ ...fragmentStyle, width: fragment.width }}
                      >
                        <HighlightedText queryTokens={queryTokens} text={fragment.text} />
                      </TagSurface>
                    );
                  }
                  const source = `${fragment.position.label} · ${fragment.position.unitContext.unitName}`;
                  const positionEnd = fragment.position.label.length;
                  const separatorEnd = positionEnd + 3;
                  const renderRange = (
                    start: number,
                    end: number,
                    rangeClassName: string,
                    unitLink = false,
                  ) => {
                    const from = Math.max(fragment.start, start);
                    const to = Math.min(fragment.end, end);
                    if (from >= to) return null;
                    const content = (
                      <HighlightedText queryTokens={queryTokens} text={source.slice(from, to)} />
                    );
                    if (unitLink && nativePositionLinks) {
                      return (
                        <button
                          className={cn(
                            rangeClassName,
                            "cursor-pointer rounded-sm text-left outline-none transition-colors hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring",
                          )}
                          onClick={(event) => {
                            event.stopPropagation();
                            onUnitContextClick?.(fragment.position.unitContext);
                          }}
                          type="button"
                        >
                          {content}
                        </button>
                      );
                    }
                    return <span className={cn(rangeClassName, "whitespace-pre")}>{content}</span>;
                  };
                  return (
                    <TagSurface
                      className="inline-flex items-center whitespace-nowrap"
                      data-employee-position-assignment
                      key={key}
                      style={{ ...fragmentStyle, width: fragment.width }}
                      title={`${fragment.position.label} · ${fragment.position.unitContext.unitFullPath}`}
                      variant="position"
                    >
                      {renderRange(0, positionEnd, "font-medium text-foreground")}
                      {renderRange(positionEnd, separatorEnd, "text-muted-foreground")}
                      {renderRange(separatorEnd, source.length, "text-muted-foreground", true)}
                    </TagSurface>
                  );
                })}
              </span>
            ))}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn("flex min-w-0 flex-col", className)}
      data-employee-display-content
      data-employee-display-line-gap={resolvedLineGap}
      ref={contentRef}
      style={{ rowGap: resolvedLineGap }}
    >
      {lines.map((line, index) => {
        const key = `${index}:${line.text}`;
        return (
          <span
            aria-hidden={line.blank ? "true" : undefined}
            className={lineClassName}
            data-employee-display-block
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
                    includeYear={density === "editor"}
                    inline
                    key={nodeKey}
                    queryTokens={queryTokens}
                    tags={node.tags}
                  />
                );
              }
              if (node.type === "positions") {
                return (
                  <span
                    className="inline-flex max-w-full flex-wrap"
                    key={nodeKey}
                    style={{ gap: TAG_SURFACE_METRICS.gap }}
                  >
                    {node.positions.map(({ label, unitContext }) => (
                      <TagSurface
                        className="align-baseline"
                        data-employee-position-assignment
                        key={unitContext.id}
                        title={`${label} · ${unitContext.unitFullPath}`}
                        variant="position"
                      >
                        <span className="font-medium text-foreground">
                          <HighlightedText queryTokens={queryTokens} text={label} />
                        </span>
                        <MiddleDot {...(density === "editor" ? { className: "mx-0.5" } : {})} />
                        {nativePositionLinks ? (
                          <button
                            className="cursor-pointer rounded-sm text-left outline-none transition-colors hover:bg-accent hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
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
                          <span>
                            <HighlightedText
                              queryTokens={queryTokens}
                              text={unitContext.unitName}
                            />
                          </span>
                        )}
                      </TagSurface>
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
  displayContext = "fallback",
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
            displayContext={displayContext}
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
          displayContext={displayContext}
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
  displayContext = "fallback",
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
                  displayContext={displayContext}
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
