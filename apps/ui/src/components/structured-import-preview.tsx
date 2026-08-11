"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef, useState } from "react";
import { HiOutlineChevronDown, HiOutlineChevronRight, HiOutlineUser } from "react-icons/hi2";

import { EmployeeTags } from "@/components/employee-tags";
import { useAppFormatter, useCountText, useUiText } from "@/i18n/use-ui-text";
import { isSafeAvatarBase64Url } from "@/lib/employee-data";
import type {
  StructuredImportAssignmentPlan,
  StructuredImportEmployeePlan,
  StructuredImportPlan,
  StructuredImportUnitPlan,
} from "@/lib/structured-import";
import { cn } from "@/lib/utils";

type PreviewEmployeeRelation = "catalog" | "liveRole" | "manual";

type PreviewRow =
  | {
      depth: number;
      id: string;
      kind: "employee";
      relation: PreviewEmployeeRelation;
      assignment: StructuredImportAssignmentPlan | null;
      employeeKey: string;
    }
  | { count: number; id: string; kind: "employeeSection"; title: "all" | "unassigned" }
  | { depth: number; id: string; kind: "liveRoleLabel" }
  | { depth: number; id: string; kind: "unit"; unit: StructuredImportUnitPlan }
  | { id: string; kind: "unitSection" };

type PendingRow =
  | Extract<PreviewRow, { kind: "employee" | "liveRoleLabel" }>
  | { depth: number; kind: "unit"; unit: StructuredImportUnitPlan };

const rowEstimate = (row: PreviewRow) => {
  if (row.kind === "employee") return 104;
  if (row.kind === "unit") return 54;
  return 40;
};

const flattenPreviewRows = (
  plan: StructuredImportPlan,
  collapsedUnitKeys: ReadonlySet<string>,
): PreviewRow[] => {
  const rows: PreviewRow[] = [];
  const manuallyAssignedEmployeeKeys = new Set<string>();
  const allUnits = [...plan.units];
  while (allUnits.length > 0) {
    const unit = allUnits.pop();
    if (!unit) continue;
    for (const assignment of unit.assignments) {
      manuallyAssignedEmployeeKeys.add(assignment.employeeKey);
    }
    allUnits.push(...unit.children);
  }

  if (plan.units.length > 0) {
    rows.push({ id: "section:units", kind: "unitSection" });
    const pending: PendingRow[] = [...plan.units]
      .reverse()
      .map((unit) => ({ depth: 0, kind: "unit", unit }));
    while (pending.length > 0) {
      const next = pending.pop();
      if (!next) continue;
      if (next.kind !== "unit") {
        rows.push(next);
        continue;
      }

      const { depth, unit } = next;
      rows.push({ depth, id: `unit:${unit.key}`, kind: "unit", unit });
      if (collapsedUnitKeys.has(unit.key)) continue;

      const children: PendingRow[] = [
        ...unit.assignments.map<PendingRow>((assignment) => ({
          assignment,
          depth: depth + 1,
          employeeKey: assignment.employeeKey,
          id: `unit:${unit.key}:manual:${assignment.employeeKey}`,
          kind: "employee",
          relation: "manual",
        })),
        ...(unit.liveRoles.length > 0
          ? [
              {
                depth: depth + 1,
                id: `unit:${unit.key}:live-roles`,
                kind: "liveRoleLabel" as const,
              },
              ...unit.liveRoles.map<PendingRow>((assignment) => ({
                assignment,
                depth: depth + 2,
                employeeKey: assignment.employeeKey,
                id: `unit:${unit.key}:live:${assignment.employeeKey}`,
                kind: "employee",
                relation: "liveRole",
              })),
            ]
          : []),
        ...unit.children.map<PendingRow>((child) => ({
          depth: depth + 1,
          kind: "unit",
          unit: child,
        })),
      ];
      pending.push(...children.reverse());
    }
  }

  const catalogEmployees =
    plan.units.length === 0
      ? plan.employees
      : plan.employees.filter(({ key }) => !manuallyAssignedEmployeeKeys.has(key));
  if (catalogEmployees.length > 0) {
    rows.push({
      count: catalogEmployees.length,
      id: "section:employees",
      kind: "employeeSection",
      title: plan.units.length === 0 ? "all" : "unassigned",
    });
    rows.push(
      ...catalogEmployees.map<PreviewRow>((employee) => ({
        assignment: null,
        depth: 0,
        employeeKey: employee.key,
        id: `catalog:${employee.key}`,
        kind: "employee",
        relation: "catalog",
      })),
    );
  }

  return rows;
};

const previewEmployeeName = (employee: StructuredImportEmployeePlan) =>
  `${employee.fields.firstName} ${employee.fields.lastName}`.trim() ||
  employee.fields.username ||
  employee.fields.email ||
  "Employee";

function PreviewAvatar({ employee }: { employee: StructuredImportEmployeePlan }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const imageUrl = isSafeAvatarBase64Url(employee.fields.avatarBase64Url)
    ? employee.fields.avatarBase64Url
    : null;
  const initials =
    `${employee.fields.firstName.trim().at(0) ?? ""}${employee.fields.lastName.trim().at(0) ?? ""}`.toLocaleUpperCase(
      "en-US",
    );

  return (
    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-medium text-muted-foreground">
      {imageUrl && imageUrl !== failedUrl ? (
        // biome-ignore lint/performance/noImgElement: import previews use bounded embedded local data URLs.
        <img
          alt=""
          className="size-full object-cover"
          decoding="async"
          loading="lazy"
          onError={() => setFailedUrl(imageUrl)}
          src={imageUrl}
        />
      ) : (
        <span>{initials || <HiOutlineUser className="size-5" />}</span>
      )}
    </div>
  );
}

function PreviewEmployeeCard({
  append,
  assignment,
  employee,
  relation,
}: {
  append: boolean;
  assignment: StructuredImportAssignmentPlan | null;
  employee: StructuredImportEmployeePlan;
  relation: PreviewEmployeeRelation;
}) {
  const t = useUiText();
  const identity = [employee.fields.username, employee.fields.email].filter(Boolean).join(" · ");
  const role = assignment?.position || (assignment ? t("Position not specified") : null);

  return (
    <article
      className="flex min-w-0 items-start gap-3 rounded-md border bg-background px-3 py-2"
      data-demo-id="structured-preview-employee-card"
      data-preview-employee-key={employee.key}
      data-preview-relation={relation}
    >
      <PreviewAvatar employee={employee} />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span
            className="min-w-0 truncate text-sm font-medium"
            title={previewEmployeeName(employee)}
          >
            {previewEmployeeName(employee)}
          </span>
          {append && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                employee.status === "existing"
                  ? "bg-muted text-muted-foreground"
                  : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
              )}
            >
              {t(employee.status === "existing" ? "Existing" : "New")}
            </span>
          )}
          {assignment?.isBoss && (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              {t("Boss")}
            </span>
          )}
          {relation === "liveRole" && (
            <span className="rounded-full bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 dark:text-sky-300">
              {t("Live role")}
            </span>
          )}
        </div>
        {identity && (
          <div className="mt-0.5 truncate text-xs text-muted-foreground">{identity}</div>
        )}
        {role && <div className="mt-1 text-xs text-muted-foreground">{role}</div>}
        <EmployeeTags className="mt-1.5" compact tags={employee.fields.tags} />
      </div>
    </article>
  );
}

export function StructuredImportPreview({
  append = true,
  plan,
}: {
  append?: boolean;
  plan: StructuredImportPlan;
}) {
  const countText = useCountText();
  const format = useAppFormatter();
  const t = useUiText();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [collapsedUnitKeys, setCollapsedUnitKeys] = useState<Set<string>>(() => new Set());
  const employeeByKey = useMemo(
    () => new Map(plan.employees.map((employee) => [employee.key, employee])),
    [plan.employees],
  );
  const rows = useMemo(
    () => flattenPreviewRows(plan, collapsedUnitKeys),
    [collapsedUnitKeys, plan],
  );
  const previewHeight = Math.min(
    432,
    Math.max(
      136,
      rows.reduce((height, row) => height + rowEstimate(row), 0),
    ),
  );
  const virtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: (index) => rowEstimate(rows[index] ?? { id: "fallback", kind: "unitSection" }),
    getItemKey: (index) => rows[index]?.id ?? index,
    getScrollElement: () => scrollRef.current,
    overscan: 8,
  });

  const toggleUnit = (key: string) => {
    setCollapsedUnitKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <section className="grid min-w-0 gap-3 py-2" data-demo-id="structured-import-preview">
      <div>
        <h3 className="text-sm font-semibold">{t("Structured import preview")}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {append
            ? t(
                "This import adds data to Main. Existing Employees are reused without being overwritten.",
              )
            : t("This import replaces current data with the selected state content.")}
        </p>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs tabular-nums text-muted-foreground">
        {append ? (
          <>
            <span>{countText("newEmployees", { count: plan.newEmployeeCount })}</span>
            <span>
              {format.number(plan.existingEmployeeCount)} {t("existing Employees")}
            </span>
          </>
        ) : (
          <span>{countText("importedEmployees", { count: plan.employees.length })}</span>
        )}
        <span>
          {format.number(plan.manualUnitCount)} {t("manual Teams")}
        </span>
        <span>
          {format.number(plan.liveUnitCount)} {t("Live Teams")}
        </span>
        <span>
          {format.number(plan.assignmentCount)} {t("assignments")}
        </span>
      </div>
      {rows.length > 0 ? (
        <section
          aria-label={t("Import hierarchy preview")}
          className="overflow-auto rounded-md border bg-muted/10"
          data-demo-id="structured-preview-viewport"
          ref={scrollRef}
          style={{ height: previewHeight }}
        >
          <div
            className="relative min-w-[28rem] w-full"
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              if (!row) return null;
              return (
                <div
                  className="absolute left-0 top-0 w-full px-2 py-1"
                  data-index={virtualRow.index}
                  key={virtualRow.key}
                  ref={virtualizer.measureElement}
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                >
                  {row.kind === "unitSection" && (
                    <div className="px-1 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("Teams")}
                    </div>
                  )}
                  {row.kind === "employeeSection" && (
                    <div className="flex items-center justify-between gap-3 px-1 pb-1 pt-3 text-xs font-semibold text-muted-foreground">
                      <span>
                        {row.title === "all"
                          ? t("Employees in this import")
                          : t("Employees without a direct Team assignment")}
                      </span>
                      <span className="tabular-nums">
                        {countText("employees", { count: row.count })}
                      </span>
                    </div>
                  )}
                  {row.kind === "liveRoleLabel" && (
                    <div
                      className="border-l px-3 py-1 text-xs text-muted-foreground"
                      style={{ marginInlineStart: Math.min(row.depth, 8) * 20 }}
                    >
                      <span className="font-medium text-foreground">{t("Live roles")}</span>
                      <span className="ml-1">
                        · {t("Live membership is evaluated after import.")}
                      </span>
                    </div>
                  )}
                  {row.kind === "unit" &&
                    (() => {
                      const hasChildren =
                        row.unit.children.length +
                          row.unit.assignments.length +
                          row.unit.liveRoles.length >
                        0;
                      const collapsed = collapsedUnitKeys.has(row.unit.key);
                      return (
                        <div
                          className={cn("border-l", row.depth === 0 && "border-l-transparent")}
                          data-demo-id="structured-preview-team"
                          data-preview-team-key={row.unit.key}
                          style={{ marginInlineStart: Math.min(row.depth, 8) * 20 }}
                        >
                          <div className="flex min-w-0 items-center gap-2 rounded-md border bg-background px-2.5 py-2">
                            {hasChildren ? (
                              <button
                                aria-label={t(collapsed ? "Expand" : "Collapse")}
                                aria-expanded={!collapsed}
                                className="inline-flex size-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                onClick={() => toggleUnit(row.unit.key)}
                                type="button"
                              >
                                {collapsed ? (
                                  <HiOutlineChevronRight className="size-4" />
                                ) : (
                                  <HiOutlineChevronDown className="size-4" />
                                )}
                              </button>
                            ) : (
                              <span className="size-6 shrink-0" />
                            )}
                            <span
                              className="min-w-0 flex-1 truncate text-sm font-medium"
                              title={row.unit.name}
                            >
                              {row.unit.name}
                            </span>
                            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                              {countText("directEmployees", { count: row.unit.assignments.length })}
                            </span>
                            <span
                              className={cn(
                                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                                row.unit.mode === "live"
                                  ? "bg-sky-500/10 text-sky-700 dark:text-sky-300"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              {t(row.unit.mode === "live" ? "Live Team" : "Manual Team")}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  {row.kind === "employee" &&
                    (() => {
                      const employee = employeeByKey.get(row.employeeKey);
                      if (!employee) return null;
                      return (
                        <div
                          className="border-l pl-3"
                          style={{ marginInlineStart: Math.min(row.depth, 8) * 20 }}
                        >
                          <PreviewEmployeeCard
                            append={append}
                            assignment={row.assignment}
                            employee={employee}
                            relation={row.relation}
                          />
                        </div>
                      );
                    })()}
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
          {t("No content in this import.")}
        </div>
      )}
    </section>
  );
}
