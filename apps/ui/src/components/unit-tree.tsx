"use client";

import type { Employee, EmployeeId, Unit, UnitId } from "@org-tools/types";
import { type ReactNode, useEffect, useMemo, useRef } from "react";

import { HighlightedText } from "@/components/highlighted-text";
import { TreeItemShell } from "@/components/tree-item-shell";
import { UnitCard, type UnitCardDropTarget } from "@/components/unit-card";

type UnitTreeVariant = "compact" | "list";

export type UnitTreeItemState = {
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
  isSearching: boolean;
  isSelected: boolean;
};

type UnitTreeProps = {
  actions?: (unit: Unit, state: UnitTreeItemState) => ReactNode;
  cardClassName?: string | ((unit: Unit, state: UnitTreeItemState) => string | undefined);
  childListClassName?: string;
  dataDemoId?: string;
  dropTarget?: (unit: Unit, state: UnitTreeItemState) => UnitCardDropTarget | null;
  expandedUnitIds: Iterable<UnitId>;
  employeesById?: ReadonlyMap<EmployeeId, Employee>;
  onClick?: (unit: Unit, state: UnitTreeItemState) => void;
  onDoubleClick?: (unit: Unit, state: UnitTreeItemState) => void;
  onToggle?: (unitId: UnitId) => void;
  queryTokens?: string[];
  root?: Unit;
  roots?: Unit[];
  scrollIntoViewUnitId?: UnitId | null;
  scrollIntoViewWhen?: boolean;
  selected?: (unit: Unit) => boolean;
  subtitle: (unit: Unit, state: UnitTreeItemState) => ReactNode;
  titleClassName?: string;
  variant?: UnitTreeVariant;
  visibleUnitIds?: Set<UnitId> | null;
};

type UnitTreeNodeProps = Omit<UnitTreeProps, "expandedUnitIds" | "root" | "roots"> & {
  depth?: number;
  expandedUnitIdSet: ReadonlySet<UnitId>;
  isLast?: boolean;
  unit: Unit;
};

function UnitTreeNode({
  actions,
  cardClassName,
  childListClassName = "ml-5 mt-2 grid gap-2",
  dataDemoId,
  depth = 0,
  dropTarget,
  expandedUnitIdSet,
  employeesById,
  isLast = true,
  onClick,
  onDoubleClick,
  onToggle,
  queryTokens = [],
  scrollIntoViewUnitId = null,
  scrollIntoViewWhen = true,
  selected,
  subtitle,
  titleClassName = "block truncate text-sm font-medium",
  unit,
  variant = "list",
  visibleUnitIds = null,
}: UnitTreeNodeProps) {
  const itemRef = useRef<HTMLDivElement | null>(null);
  const visibleChildren = unit.children.filter(
    (childUnit) => visibleUnitIds === null || visibleUnitIds.has(childUnit.id),
  );
  const hasChildren = visibleChildren.length > 0;
  const isSearching = visibleUnitIds !== null;
  const isExpanded = hasChildren && (isSearching || expandedUnitIdSet.has(unit.id));
  const isSelected = selected?.(unit) ?? false;
  const state: UnitTreeItemState = {
    depth,
    hasChildren,
    isExpanded,
    isSearching,
    isSelected,
  };
  const handleClick =
    onClick !== undefined
      ? () => onClick(unit, state)
      : onToggle && hasChildren
        ? () => onToggle(unit.id)
        : undefined;
  const nextCardClassName =
    typeof cardClassName === "function" ? cardClassName(unit, state) : cardClassName;
  const nextDropTarget = dropTarget?.(unit, state) ?? null;

  useEffect(() => {
    if (!scrollIntoViewWhen || scrollIntoViewUnitId !== unit.id) return undefined;

    const animationFrameId = window.requestAnimationFrame(() => {
      itemRef.current?.scrollIntoView({
        block: "nearest",
        inline: "nearest",
      });
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [scrollIntoViewUnitId, scrollIntoViewWhen, unit.id]);

  return (
    <TreeItemShell depth={depth} isLast={isLast}>
      <UnitCard
        expandState={onToggle && hasChildren ? (isExpanded ? "expanded" : "collapsed") : "none"}
        ref={itemRef}
        selected={isSelected}
        subtitle={subtitle(unit, state)}
        title={
          <HighlightedText className={titleClassName} queryTokens={queryTokens} text={unit.name} />
        }
        unit={unit}
        variant={variant}
        {...(actions ? { actions: actions(unit, state) } : {})}
        {...(nextDropTarget ? { dropTarget: nextDropTarget } : {})}
        {...(employeesById ? { employeesById } : {})}
        {...(nextCardClassName ? { className: nextCardClassName } : {})}
        {...(dataDemoId ? { dataDemoId } : {})}
        {...(handleClick ? { onClick: handleClick } : {})}
        {...(onDoubleClick ? { onDoubleClick: () => onDoubleClick(unit, state) } : {})}
        {...(onToggle && hasChildren ? { onToggleExpand: () => onToggle(unit.id) } : {})}
      />
      {hasChildren && isExpanded && (
        <ul className={childListClassName}>
          {visibleChildren.map((childUnit, childIndex) => (
            <UnitTreeNode
              childListClassName={childListClassName}
              depth={depth + 1}
              expandedUnitIdSet={expandedUnitIdSet}
              isLast={childIndex === visibleChildren.length - 1}
              key={childUnit.id}
              queryTokens={queryTokens}
              scrollIntoViewUnitId={scrollIntoViewUnitId}
              scrollIntoViewWhen={scrollIntoViewWhen}
              subtitle={subtitle}
              titleClassName={titleClassName}
              unit={childUnit}
              variant={variant}
              visibleUnitIds={visibleUnitIds}
              {...(actions ? { actions } : {})}
              {...(cardClassName ? { cardClassName } : {})}
              {...(dataDemoId ? { dataDemoId } : {})}
              {...(dropTarget ? { dropTarget } : {})}
              {...(employeesById ? { employeesById } : {})}
              {...(onClick ? { onClick } : {})}
              {...(onDoubleClick ? { onDoubleClick } : {})}
              {...(onToggle ? { onToggle } : {})}
              {...(selected ? { selected } : {})}
            />
          ))}
        </ul>
      )}
    </TreeItemShell>
  );
}

export function UnitTree({ root, roots, ...props }: UnitTreeProps) {
  const expandedUnitIdSet = useMemo(() => new Set(props.expandedUnitIds), [props.expandedUnitIds]);
  const rootUnits = roots ?? (root ? [root] : []);

  return rootUnits.map((rootUnit, index) => (
    <UnitTreeNode
      expandedUnitIdSet={expandedUnitIdSet}
      isLast={index === rootUnits.length - 1}
      key={rootUnit.id}
      unit={rootUnit}
      {...props}
    />
  ));
}
