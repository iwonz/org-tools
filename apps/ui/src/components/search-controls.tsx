"use client";

import type { UiOrgStructure, UnitId } from "@org-tools/types";
import { useVirtualizer } from "@tanstack/react-virtual";
import { observer } from "mobx-react-lite";
import type { ReactNode } from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  HiOutlineBriefcase,
  HiOutlineCalendarDays,
  HiOutlineChevronDown,
  HiOutlineFolder,
  HiOutlineFunnel,
  HiOutlineMagnifyingGlass,
  HiOutlineTag,
  HiOutlineXMark,
} from "react-icons/hi2";

import { HighlightedText } from "@/components/highlighted-text";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppFormatter, useUiText } from "@/i18n/use-ui-text";
import {
  createEmptyEmployeeSearchFilters,
  type EmployeeSearchFilters,
  pruneEmployeeSearchFilters,
} from "@/lib/employee-search";
import { getSearchTokens, normalizeSearchValue } from "@/lib/search-index";
import { cn } from "@/lib/utils";
import { useOrgStore } from "@/stores/org-store-context";

export { getSearchTokens, normalizeSearchValue } from "@/lib/search-index";

type BaseSearchInputProps = {
  ariaLabel: string;
  className?: string;
  dataDemoId?: string;
  id?: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  value: string;
};

export type {
  EmployeeBirthdayFilter,
  EmployeeSearchFilters,
} from "@/lib/employee-search";
export {
  createEmptyEmployeeSearchFilters,
  employeeSearchDocumentMatches,
  filterEmployeeSearchDocuments,
  filterEmployeesBySearch,
  getEmployeeSearchFiltersKey,
  getEmployeesForSearch,
  hasActiveEmployeeSearchFilters,
  pruneEmployeeSearchFilters,
} from "@/lib/employee-search";

type EmployeeSearchInputProps = BaseSearchInputProps & {
  excludedUnitIds?: ReadonlySet<UnitId>;
  filters: EmployeeSearchFilters;
  onFiltersChange: (filters: EmployeeSearchFilters) => void;
  positionButtonDemoId?: string;
  positionOptions: string[];
  positionPopoverDemoId?: string;
  preserveUnavailableUnitIds?: boolean;
  tagOptions: string[];
  unitStructure?: UiOrgStructure;
};
type EmployeeFilterSectionId = "birthday" | "positions" | "tags" | "units";
const EMPTY_UNIT_ID_LOOKUP = new Map<UnitId, never>();

export function UnitSearchInput({
  ariaLabel,
  className,
  dataDemoId,
  id,
  onValueChange,
  placeholder,
  value,
}: BaseSearchInputProps) {
  return (
    <div className={cn("relative min-w-0 shrink-0", className)} data-demo-id={dataDemoId}>
      <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        aria-label={ariaLabel}
        className="pl-9"
        id={id}
        onChange={(event) => onValueChange(event.currentTarget.value)}
        placeholder={placeholder}
        type="search"
        value={value}
      />
    </div>
  );
}

type EmployeeUnitFilterOption<TId extends UnitId> = {
  id: TId;
  label: string;
  searchText: string;
  subtitle?: string;
};

type EmployeeSelectableFilterOption<TId extends UnitId> = {
  id: TId;
  label: string;
  subtitle?: string;
};

function EmployeeFilterSection({
  children,
  count,
  expanded,
  icon,
  onClear,
  onToggle,
  title,
}: {
  children: ReactNode;
  count: number;
  expanded: boolean;
  icon: ReactNode;
  onClear: () => void;
  onToggle: () => void;
  title: string;
}) {
  const contentId = useId();
  const t = useUiText();

  return (
    <section
      className={cn("transition-colors", expanded && "rounded-md bg-muted/60")}
      data-filter-section={title}
      data-state={expanded ? "open" : "closed"}
    >
      <div className="flex min-w-0 items-center gap-0.5 px-0.5">
        <Button
          aria-controls={contentId}
          aria-expanded={expanded}
          className="h-9 min-w-0 flex-1 justify-start rounded-md border-0 px-2 font-normal hover:bg-accent/60"
          onClick={onToggle}
          type="button"
          variant="ghost"
        >
          <span className="flex size-5 shrink-0 items-center justify-center text-muted-foreground">
            {icon}
          </span>
          <span className="truncate text-sm font-medium">{title}</span>
          {count > 0 && (
            <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-primary/10 px-1.5 text-[10px] leading-5 text-primary">
              {count}
            </span>
          )}
          <HiOutlineChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              expanded && "rotate-180",
              count === 0 && "ml-auto",
            )}
          />
        </Button>
        {count > 0 && (
          <Button
            aria-label={t("Clear {title} filter", { title })}
            className="size-8 shrink-0 border-0 text-muted-foreground hover:bg-accent/70 hover:text-foreground"
            onClick={onClear}
            size="icon"
            title={t("Clear {title} filter", { title })}
            type="button"
            variant="ghost"
          >
            <HiOutlineXMark />
          </Button>
        )}
      </div>
      {expanded && (
        <div className="px-2 pb-2 pt-0.5" data-filter-section-content id={contentId}>
          {children}
        </div>
      )}
    </section>
  );
}

function EmployeeFilterOptionList<TId extends UnitId>({
  emptyState,
  onToggle,
  options,
  queryTokens,
  selectedValues,
  title,
}: {
  emptyState: string;
  onToggle: (value: TId) => void;
  options: EmployeeSelectableFilterOption<TId>[];
  queryTokens: string[];
  selectedValues: TId[];
  title: string;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const selectedValueSet = useMemo(() => new Set(selectedValues), [selectedValues]);
  const rowVirtualizer = useVirtualizer({
    count: options.length,
    estimateSize: (index) => (options[index]?.subtitle ? 48 : 36),
    getItemKey: (index) => options[index]?.id ?? index,
    getScrollElement: () => scrollRef.current,
    overscan: 6,
  });
  const scrollHeight = Math.min(rowVirtualizer.getTotalSize(), 192);

  if (options.length === 0) {
    return (
      <div className="rounded-md border border-border/70 bg-background/80 p-3 text-sm text-muted-foreground">
        {emptyState}
      </div>
    );
  }

  return (
    <div
      className="min-h-0 overflow-y-auto overscroll-contain rounded-md border border-border/70 bg-background/80"
      data-filter-option-count={options.length}
      data-filter-options-list={title}
      onWheel={(event) => event.stopPropagation()}
      ref={scrollRef}
      style={{ height: scrollHeight }}
    >
      <div className="relative w-full" style={{ height: rowVirtualizer.getTotalSize() }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const option = options[virtualRow.index];
          if (!option) return null;

          return (
            <div
              className="absolute left-0 top-0 flex w-full items-start gap-2 border-b px-2 py-1.5 text-sm transition-colors last:border-b-0 hover:bg-accent/40"
              data-filter-option
              data-filter-option-index={virtualRow.index}
              key={String(option.id)}
              style={{
                height: virtualRow.size,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <Checkbox
                aria-label={`${title}: ${option.label}`}
                checked={selectedValueSet.has(option.id)}
                className="mt-0.5"
                onCheckedChange={() => onToggle(option.id)}
              />
              <button
                className="grid min-w-0 flex-1 cursor-pointer gap-0.5 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => onToggle(option.id)}
                title={option.subtitle ?? option.label}
                type="button"
              >
                <span className="truncate">
                  <HighlightedText queryTokens={queryTokens} text={option.label} />
                </span>
                {option.subtitle && option.subtitle !== option.label && (
                  <span className="truncate text-xs text-muted-foreground">
                    <HighlightedText queryTokens={queryTokens} text={option.subtitle} />
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmployeeAbsenceFilterOption({
  checked,
  label,
  onCheckedChange,
  title,
}: {
  checked: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
  title: string;
}) {
  return (
    <div
      className="flex h-9 items-center gap-2 rounded-md bg-background/80 px-2 text-sm transition-colors hover:bg-accent/40"
      data-filter-special-option={label}
    >
      <Checkbox
        aria-label={`${title}: ${label}`}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <button
        className="min-w-0 flex-1 cursor-pointer rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => onCheckedChange(!checked)}
        type="button"
      >
        {label}
      </button>
    </div>
  );
}

function EmployeeTextListFilter({
  emptyState,
  includeWithoutValues,
  onIncludeWithoutValuesChange,
  onSelectedValuesChange,
  options,
  searchAriaLabel,
  searchPlaceholder,
  selectedValues,
  title,
  withoutValuesLabel,
}: {
  emptyState: string;
  includeWithoutValues?: boolean;
  onIncludeWithoutValuesChange?: (checked: boolean) => void;
  onSelectedValuesChange: (selectedValues: string[]) => void;
  options: string[];
  searchAriaLabel: string;
  searchPlaceholder: string;
  selectedValues: string[];
  title: string;
  withoutValuesLabel?: string;
}) {
  const [query, setQuery] = useState("");
  const selectedValueSet = useMemo(() => new Set(selectedValues), [selectedValues]);
  const queryTokens = useMemo(() => getSearchTokens(query), [query]);
  const visibleOptions = useMemo(() => {
    if (queryTokens.length === 0) return options;

    return options.filter((option) => {
      const normalizedOption = normalizeSearchValue(option);

      return queryTokens.every((token) => normalizedOption.includes(token));
    });
  }, [options, queryTokens]);
  const filterOptions = useMemo(
    () => visibleOptions.map((option) => ({ id: option, label: option })),
    [visibleOptions],
  );
  const toggleValue = (value: string) => {
    onSelectedValuesChange(
      selectedValueSet.has(value)
        ? selectedValues.filter((selectedValue) => selectedValue !== value)
        : [...selectedValues, value],
    );
  };

  return (
    <div className="grid gap-2">
      <div className="relative">
        <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label={searchAriaLabel}
          className="h-8 pl-8"
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder={searchPlaceholder}
          type="search"
          value={query}
        />
      </div>
      {withoutValuesLabel && onIncludeWithoutValuesChange && (
        <EmployeeAbsenceFilterOption
          checked={includeWithoutValues ?? false}
          label={withoutValuesLabel}
          onCheckedChange={onIncludeWithoutValuesChange}
          title={title}
        />
      )}
      <EmployeeFilterOptionList
        emptyState={emptyState}
        onToggle={toggleValue}
        options={filterOptions}
        queryTokens={queryTokens}
        selectedValues={selectedValues}
        title={title}
      />
    </div>
  );
}

function EmployeeUnitListFilter<TId extends UnitId>({
  emptyState,
  includeWithoutValues,
  onIncludeWithoutValuesChange,
  onSelectedValuesChange,
  options,
  searchAriaLabel,
  searchPlaceholder,
  selectedValues,
  title,
  withoutValuesLabel,
}: {
  emptyState: string;
  includeWithoutValues?: boolean;
  onIncludeWithoutValuesChange?: (checked: boolean) => void;
  onSelectedValuesChange: (selectedValues: TId[]) => void;
  options: EmployeeUnitFilterOption<TId>[];
  searchAriaLabel: string;
  searchPlaceholder: string;
  selectedValues: TId[];
  title: string;
  withoutValuesLabel?: string;
}) {
  const [query, setQuery] = useState("");
  const selectedValueSet = useMemo(() => new Set(selectedValues), [selectedValues]);
  const queryTokens = useMemo(() => getSearchTokens(query), [query]);
  const visibleOptions = useMemo(() => {
    if (queryTokens.length === 0) return options;

    return options.filter((option) =>
      queryTokens.every((token) => option.searchText.includes(token)),
    );
  }, [options, queryTokens]);
  const toggleValue = (value: TId) => {
    onSelectedValuesChange(
      selectedValueSet.has(value)
        ? selectedValues.filter((selectedValue) => selectedValue !== value)
        : [...selectedValues, value],
    );
  };

  return (
    <div className="grid gap-2">
      <div className="relative">
        <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label={searchAriaLabel}
          className="h-8 pl-8"
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder={searchPlaceholder}
          type="search"
          value={query}
        />
      </div>
      {withoutValuesLabel && onIncludeWithoutValuesChange && (
        <EmployeeAbsenceFilterOption
          checked={includeWithoutValues ?? false}
          label={withoutValuesLabel}
          onCheckedChange={onIncludeWithoutValuesChange}
          title={title}
        />
      )}
      <EmployeeFilterOptionList
        emptyState={emptyState}
        onToggle={toggleValue}
        options={visibleOptions}
        queryTokens={queryTokens}
        selectedValues={selectedValues}
        title={title}
      />
    </div>
  );
}

export const EmployeeSearchInput = observer(function EmployeeSearchInput({
  ariaLabel,
  className,
  dataDemoId,
  excludedUnitIds,
  filters,
  id,
  onFiltersChange,
  onValueChange,
  placeholder,
  positionButtonDemoId,
  positionOptions,
  positionPopoverDemoId,
  preserveUnavailableUnitIds = false,
  tagOptions,
  unitStructure,
  value,
}: EmployeeSearchInputProps) {
  const store = useOrgStore();
  const t = useUiText();
  const format = useAppFormatter();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSectionId, setExpandedSectionId] = useState<EmployeeFilterSectionId | null>(null);
  const [birthdayDayValue, setBirthdayDayValue] = useState("none");
  const [birthdayMonthValue, setBirthdayMonthValue] = useState("none");
  const selectedPositions = filters.selectedPositions;
  const selectedTags = filters.selectedTags;
  const unitOptions = useMemo<EmployeeUnitFilterOption<UnitId>[]>(() => {
    if (!isOpen) return [];

    return ((unitStructure ?? store.units)?.deepUnits ?? [])
      .filter((unit) => !excludedUnitIds?.has(unit.id))
      .map((unit) => ({
        id: unit.id,
        label: unit.name,
        searchText: normalizeSearchValue(`${unit.name} ${unit.path.fullName}`),
        subtitle: unit.path.fullName,
      }));
  }, [excludedUnitIds, isOpen, store.units, unitStructure]);
  const availableUnitIds =
    (unitStructure ?? store.units)?.indexes.unitsById ?? EMPTY_UNIT_ID_LOOKUP;
  const activeFilterCount =
    selectedPositions.length +
    selectedTags.length +
    filters.selectedUnitIds.length +
    (filters.includeWithoutTags ? 1 : 0) +
    (filters.includeWithoutUnits ? 1 : 0) +
    (filters.birthday ? 1 : 0);

  useEffect(() => {
    if (!isOpen) {
      setBirthdayDayValue(filters.birthday === null ? "none" : String(filters.birthday.day));
      setBirthdayMonthValue(filters.birthday === null ? "none" : String(filters.birthday.month));
    }
  }, [filters.birthday, isOpen]);

  useEffect(() => {
    if (preserveUnavailableUnitIds) return;
    const prunedFilters = pruneEmployeeSearchFilters(filters, availableUnitIds);

    if (prunedFilters.selectedUnitIds.length !== filters.selectedUnitIds.length) {
      onFiltersChange(prunedFilters);
    }
  }, [availableUnitIds, filters, onFiltersChange, preserveUnavailableUnitIds]);

  const clearAllFilters = () => {
    onFiltersChange(createEmptyEmployeeSearchFilters());
    setBirthdayDayValue("none");
    setBirthdayMonthValue("none");
  };

  const clearBirthday = () => {
    onFiltersChange({ ...filters, birthday: null });
    setBirthdayDayValue("none");
    setBirthdayMonthValue("none");
  };

  const applyBirthday = () => {
    if (birthdayDayValue === "none" || birthdayMonthValue === "none") return;

    onFiltersChange({
      ...filters,
      birthday: {
        day: Number(birthdayDayValue),
        month: Number(birthdayMonthValue),
      },
    });
  };

  const toggleSection = (sectionId: EmployeeFilterSectionId) => {
    setExpandedSectionId((currentSectionId) => (currentSectionId === sectionId ? null : sectionId));
  };

  return (
    <div className={cn("relative min-w-0 shrink-0", className)} data-demo-id={dataDemoId}>
      <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        aria-label={ariaLabel}
        className="pl-9 pr-12"
        id={id}
        onChange={(event) => onValueChange(event.currentTarget.value)}
        placeholder={placeholder}
        type="search"
        value={value}
      />
      <Popover onOpenChange={setIsOpen} open={isOpen}>
        <PopoverTrigger asChild>
          <Button
            aria-label={t("Employee filters")}
            className={cn(
              "absolute right-1 top-1/2 size-8 -translate-y-1/2",
              activeFilterCount > 0 && "text-primary",
            )}
            data-demo-id={positionButtonDemoId}
            title={t("Employee filters")}
            type="button"
            variant="ghost"
          >
            <HiOutlineFunnel />
            {activeFilterCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] leading-4 text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-[min(22rem,calc(100vw-1rem))] max-h-[var(--radix-popover-content-available-height)] overflow-y-auto overscroll-contain p-0"
          data-demo-id={positionPopoverDemoId}
          onInteractOutside={(event) => {
            const target = event.target;

            if (target instanceof HTMLElement && target.closest('[data-slot="select-content"]')) {
              event.preventDefault();
            }
          }}
          sideOffset={6}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-popover px-3 py-2">
            <div className="text-sm font-medium">{t("Employee filters")}</div>
            {activeFilterCount > 0 && (
              <Button
                className="h-8 px-2"
                onClick={clearAllFilters}
                size="sm"
                type="button"
                variant="ghost"
              >
                {t("Clear all")}
              </Button>
            )}
          </div>
          <div className="grid gap-1 p-2">
            <EmployeeFilterSection
              count={filters.birthday === null ? 0 : 1}
              expanded={expandedSectionId === "birthday"}
              icon={<HiOutlineCalendarDays className="size-4" />}
              onClear={clearBirthday}
              onToggle={() => toggleSection("birthday")}
              title={t("Birthday")}
            >
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] gap-2">
                <Select onValueChange={setBirthdayDayValue} value={birthdayDayValue}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder={t("Day")} />
                  </SelectTrigger>
                  <SelectContent className="z-[70]">
                    <SelectItem value="none">{t("Day")}</SelectItem>
                    {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
                      <SelectItem key={day} value={String(day)}>
                        {String(day).padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select onValueChange={setBirthdayMonthValue} value={birthdayMonthValue}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder={t("Month")} />
                  </SelectTrigger>
                  <SelectContent className="z-[70]">
                    <SelectItem value="none">{t("Month")}</SelectItem>
                    {Array.from({ length: 12 }, (_, index) => index).map((monthIndex) => (
                      <SelectItem key={monthIndex} value={String(monthIndex + 1)}>
                        {format.dateTime(new Date(Date.UTC(2000, monthIndex, 1)), {
                          month: "long",
                          timeZone: "UTC",
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  className="h-8 px-2"
                  disabled={birthdayDayValue === "none" || birthdayMonthValue === "none"}
                  onClick={applyBirthday}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {t("Apply")}
                </Button>
              </div>
            </EmployeeFilterSection>
            <EmployeeFilterSection
              count={selectedPositions.length}
              expanded={expandedSectionId === "positions"}
              icon={<HiOutlineBriefcase className="size-4" />}
              onClear={() => onFiltersChange({ ...filters, selectedPositions: [] })}
              onToggle={() => toggleSection("positions")}
              title={t("Positions")}
            >
              <EmployeeTextListFilter
                emptyState={t("No positions found")}
                onSelectedValuesChange={(selectedPositions) =>
                  onFiltersChange({ ...filters, selectedPositions })
                }
                options={positionOptions}
                searchAriaLabel={t("Search positions")}
                searchPlaceholder={t("Search by position")}
                selectedValues={selectedPositions}
                title={t("Positions")}
              />
            </EmployeeFilterSection>
            <EmployeeFilterSection
              count={selectedTags.length + (filters.includeWithoutTags ? 1 : 0)}
              expanded={expandedSectionId === "tags"}
              icon={<HiOutlineTag className="size-4" />}
              onClear={() =>
                onFiltersChange({
                  ...filters,
                  includeWithoutTags: false,
                  selectedTags: [],
                })
              }
              onToggle={() => toggleSection("tags")}
              title={t("Tags")}
            >
              <EmployeeTextListFilter
                emptyState={t("No tags found")}
                includeWithoutValues={filters.includeWithoutTags}
                onIncludeWithoutValuesChange={(includeWithoutTags) =>
                  onFiltersChange({ ...filters, includeWithoutTags })
                }
                onSelectedValuesChange={(selectedTags) =>
                  onFiltersChange({ ...filters, selectedTags })
                }
                options={tagOptions}
                searchAriaLabel={t("Search tags")}
                searchPlaceholder={t("Search by tag")}
                selectedValues={selectedTags}
                title={t("Tags")}
                withoutValuesLabel={t("Without tags")}
              />
            </EmployeeFilterSection>
            <EmployeeFilterSection
              count={filters.selectedUnitIds.length + (filters.includeWithoutUnits ? 1 : 0)}
              expanded={expandedSectionId === "units"}
              icon={<HiOutlineFolder className="size-4" />}
              onClear={() =>
                onFiltersChange({
                  ...filters,
                  includeWithoutUnits: false,
                  selectedUnitIds: [],
                })
              }
              onToggle={() => toggleSection("units")}
              title={t("Units")}
            >
              <EmployeeUnitListFilter
                emptyState={t("No Units found")}
                includeWithoutValues={filters.includeWithoutUnits}
                onIncludeWithoutValuesChange={(includeWithoutUnits) =>
                  onFiltersChange({ ...filters, includeWithoutUnits })
                }
                onSelectedValuesChange={(selectedUnitIds) =>
                  onFiltersChange({ ...filters, selectedUnitIds })
                }
                options={unitOptions}
                searchAriaLabel={t("Search Units in filter")}
                searchPlaceholder={t("Search Units by name")}
                selectedValues={filters.selectedUnitIds}
                title={t("Units")}
                withoutValuesLabel={t("Without a Unit")}
              />
            </EmployeeFilterSection>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
});
