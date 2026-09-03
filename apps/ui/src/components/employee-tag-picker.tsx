"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { type ReactNode, useMemo, useRef, useState } from "react";
import { HiOutlineMagnifyingGlass, HiOutlinePlus, HiOutlineTag } from "react-icons/hi2";
import {
  EmployeeTagDatePopover,
  EmployeeTagDateText,
} from "@/components/employee-tag-date-popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUiText } from "@/i18n/use-ui-text";
import type { EmployeeTagTarget, EmployeeTagUpdate } from "@/lib/employee-tags";
import {
  createEmployeeTagDateUpdates,
  createEmployeeTagUpdates,
  getEmployeeTagDateSelectionState,
  getEmployeeTagLabels,
  getEmployeeTagSelectionState,
  normalizeEmployeeTags,
  sortEmployeeTagLabels,
  toggleEmployeeTagForTargets,
} from "@/lib/employee-tags";
import { normalizeSearchValue } from "@/lib/search-index";
import { tagColorClassName } from "@/lib/tag-color";
import { cn } from "@/lib/utils";
import { useOrgStore } from "@/stores/org-store-context";

const TAG_OPTION_HEIGHT = 44;

export function EmployeeTagPickerPanel({
  className,
  dataDemoId,
  employees,
  onApply,
  onDatePopoverOpenChange,
  tagOptions,
  autoFocus = true,
  footer,
}: {
  autoFocus?: boolean;
  className?: string;
  dataDemoId?: string;
  employees: readonly EmployeeTagTarget[];
  footer?: ReactNode | false;
  onApply: (updates: EmployeeTagUpdate[]) => void;
  onDatePopoverOpenChange?: (open: boolean) => void;
  tagOptions: readonly string[];
}) {
  const t = useUiText();
  const store = useOrgStore();
  const [query, setQuery] = useState("");
  const [sessionOptions, setSessionOptions] = useState(() =>
    sortEmployeeTagLabels(
      getEmployeeTagLabels(
        normalizeEmployeeTags([...tagOptions, ...employees.flatMap((employee) => employee.tags)]),
      ),
    ),
  );
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const normalizedQuery = normalizeSearchValue(query);
  const visibleOptions = useMemo(
    () =>
      normalizedQuery
        ? sessionOptions.filter((tag) => normalizeSearchValue(tag).includes(normalizedQuery))
        : sessionOptions,
    [normalizedQuery, sessionOptions],
  );
  const exactOption = sessionOptions.find((tag) => normalizeSearchValue(tag) === normalizedQuery);
  const canCreate = Boolean(normalizedQuery) && !exactOption;
  const virtualizer = useVirtualizer({
    count: visibleOptions.length,
    estimateSize: () => TAG_OPTION_HEIGHT,
    getScrollElement: () => scrollRef.current,
    getItemKey: (index) => normalizeSearchValue(visibleOptions[index] ?? String(index)),
    overscan: 5,
  });

  const createAndAssignTag = () => {
    const [createdTag] = normalizeEmployeeTags([query]);
    if (!createdTag) return;
    const tag = createdTag.label;

    setSessionOptions((currentOptions) =>
      sortEmployeeTagLabels(
        getEmployeeTagLabels(normalizeEmployeeTags([...currentOptions, createdTag])),
      ),
    );
    onApply(
      createEmployeeTagUpdates({
        employees,
        selected: true,
        tag,
      }),
    );
    setQuery("");
  };

  return (
    <fieldset
      className={cn("grid w-[min(21rem,calc(100vw-1rem))] gap-2 p-2", className)}
      data-demo-id={dataDemoId}
      data-employee-tag-picker-panel
      onWheel={(event) => event.stopPropagation()}
    >
      <div className="relative">
        <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label={t("Search tags")}
          autoFocus={autoFocus}
          className="h-8 pl-8"
          onChange={(event) => setQuery(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || !canCreate) return;
            event.preventDefault();
            createAndAssignTag();
          }}
          placeholder={t("Search or create a tag")}
          type="search"
          value={query}
        />
      </div>
      {canCreate && (
        <Button
          className="h-8 min-w-0 justify-start px-2 text-xs"
          data-demo-id={dataDemoId ? `${dataDemoId}-create` : undefined}
          onClick={createAndAssignTag}
          type="button"
          variant="secondary"
        >
          <HiOutlinePlus />
          <span className="truncate">{t("Create tag “{name}”", { name: query.trim() })}</span>
        </Button>
      )}
      <div
        className="h-56 overflow-auto overscroll-contain rounded-md border bg-background"
        ref={scrollRef}
      >
        {visibleOptions.length === 0 ? (
          <div className="grid h-full place-items-center px-3 text-center text-xs text-muted-foreground">
            {t("No tags found")}
          </div>
        ) : (
          <div className="relative" style={{ height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const tag = visibleOptions[virtualRow.index];
              if (!tag) return null;

              const checked = getEmployeeTagSelectionState(employees, tag);
              const dateState = getEmployeeTagDateSelectionState(employees, tag);
              const definition = store.tagDefinitions.find(
                (candidate) => normalizeSearchValue(candidate.label) === normalizeSearchValue(tag),
              );

              return (
                <div
                  className="absolute left-0 top-0 grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-2 text-xs transition-colors hover:bg-accent hover:text-accent-foreground active:bg-accent-strong"
                  data-employee-tag-option
                  data-state={
                    checked === "indeterminate"
                      ? "indeterminate"
                      : checked
                        ? "checked"
                        : "unchecked"
                  }
                  key={virtualRow.key}
                  style={{
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <Checkbox
                    aria-label={tag}
                    checked={checked}
                    onCheckedChange={() => onApply(toggleEmployeeTagForTargets(employees, tag))}
                  />
                  <button
                    className="min-w-0 flex-1 truncate rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => onApply(toggleEmployeeTagForTargets(employees, tag))}
                    type="button"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "size-2 shrink-0 rounded-full",
                          tagColorClassName(definition?.color),
                        )}
                      />
                      <EmployeeTagDateText
                        date={checked === false ? null : dateState}
                        label={tag}
                      />
                    </span>
                  </button>
                  {checked !== false && (
                    <EmployeeTagDatePopover
                      date={dateState}
                      label={tag}
                      onChange={(date) =>
                        onApply(
                          createEmployeeTagDateUpdates({
                            date,
                            employees,
                            tag,
                          }),
                        )
                      }
                      {...(onDatePopoverOpenChange
                        ? { onOpenChange: onDatePopoverOpenChange }
                        : {})}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {footer !== false && (
        <div className="text-xs text-muted-foreground">
          {footer ??
            (employees.length > 1
              ? t("Selected Employees: {count}", { count: employees.length })
              : t("Changes apply immediately"))}
        </div>
      )}
    </fieldset>
  );
}

export function EmployeeTagPopover({
  dataDemoId = "employee-tag-picker",
  employee,
  onApply,
  tagOptions,
}: {
  dataDemoId?: string;
  employee: EmployeeTagTarget;
  onApply: (updates: EmployeeTagUpdate[]) => void;
  tagOptions: readonly string[];
}) {
  const t = useUiText();
  const [open, setOpen] = useState(false);

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-label={t("Edit Employee tags")}
          className="shrink-0"
          data-demo-id={`${dataDemoId}-trigger`}
          draggable={false}
          onClick={(event) => event.stopPropagation()}
          onDragStart={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onPointerDown={(event) => event.stopPropagation()}
          size="icon"
          title={t("Edit tags")}
          type="button"
          variant="ghost"
        >
          <HiOutlineTag className="size-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="p-0"
        data-demo-id={`${dataDemoId}-popover`}
        onEscapeKeyDown={(event) => event.stopPropagation()}
        sideOffset={6}
      >
        <EmployeeTagPickerPanel
          dataDemoId={`${dataDemoId}-panel`}
          employees={[employee]}
          onApply={onApply}
          tagOptions={tagOptions}
        />
      </PopoverContent>
    </Popover>
  );
}
