"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  HiOutlineChevronDown,
  HiOutlineMagnifyingGlass,
  HiOutlinePlus,
  HiOutlineXMark,
} from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useUiText } from "@/i18n/use-ui-text";
import { normalizeSearchValue } from "@/lib/search-index";
import { cn } from "@/lib/utils";

export type MultiTagSelectOption<Id extends number | string> = {
  id: Id;
  label: string;
  searchText?: string;
  subtitle?: string;
};

export function MultiTagSelect<Id extends number | string>({
  ariaLabel,
  className,
  emptyState,
  onCreateOption,
  onChange,
  options,
  placeholder,
  selectedIds,
}: {
  ariaLabel: string;
  className?: string;
  emptyState?: string;
  onCreateOption?: (label: string) => void;
  onChange: (selectedIds: Id[]) => void;
  options: MultiTagSelectOption<Id>[];
  placeholder: string;
  selectedIds: Id[];
}) {
  const t = useUiText();
  const resolvedEmptyState = emptyState ?? t("Nothing found");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const optionById = useMemo(
    () => new Map(options.map((option) => [option.id, option])),
    [options],
  );
  const normalizedQuery = normalizeSearchValue(query.trim());
  const canCreateOption =
    Boolean(onCreateOption) &&
    Boolean(normalizedQuery) &&
    !options.some((option) => normalizeSearchValue(option.label) === normalizedQuery);
  const visibleOptions = useMemo(() => {
    if (!normalizedQuery) return options;

    return options.filter((option) =>
      normalizeSearchValue(
        option.searchText ?? `${option.label} ${option.subtitle ?? ""}`,
      ).includes(normalizedQuery),
    );
  }, [normalizedQuery, options]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return undefined;
    }

    const closeOnOutsidePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointerDown);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointerDown);
  }, [open]);

  const toggle = (id: Id) => {
    onChange(
      selectedIdSet.has(id)
        ? selectedIds.filter((selectedId) => selectedId !== id)
        : [...selectedIds, id],
    );
  };
  const createOption = () => {
    const label = query.trim();

    if (!onCreateOption || !label || !canCreateOption) return;

    onCreateOption(label);
    setQuery("");
  };

  return (
    <div className={cn("relative min-w-0", className)} ref={rootRef}>
      <div className="flex min-h-10 min-w-0 flex-wrap items-center gap-1 rounded-md border bg-background px-2 py-1.5 transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
        {selectedIds.map((id) => {
          const option = optionById.get(id);
          if (!option) return null;

          return (
            <button
              className="inline-flex max-w-full cursor-pointer items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              key={String(id)}
              onClick={() => toggle(id)}
              title={t("Remove: {label}", { label: option.label })}
              type="button"
            >
              <span className="truncate">{option.label}</span>
              <HiOutlineXMark className="size-3 shrink-0" />
            </button>
          );
        })}
        <button
          aria-expanded={open}
          aria-label={ariaLabel}
          className="flex min-w-36 flex-1 cursor-pointer items-center justify-between gap-2 rounded-sm px-1 py-1 text-left text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => setOpen((currentOpen) => !currentOpen)}
          type="button"
        >
          <span className="truncate">{selectedIds.length === 0 ? placeholder : t("Add more")}</span>
          <HiOutlineChevronDown className="size-4 shrink-0" />
        </button>
      </div>
      {open && (
        <div className="absolute left-0 top-[calc(100%+0.375rem)] z-50 grid w-full min-w-72 gap-2 rounded-md border bg-popover p-2 text-popover-foreground shadow-md">
          <div className="relative">
            <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label={t("Search: {label}", { label: ariaLabel })}
              autoFocus
              className="h-9 pl-9"
              onChange={(event) => setQuery(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || !canCreateOption) return;

                event.preventDefault();
                createOption();
              }}
              placeholder={t("Search")}
              type="search"
              value={query}
            />
          </div>
          {canCreateOption && (
            <Button
              className="justify-start"
              onClick={createOption}
              size="sm"
              type="button"
              variant="secondary"
            >
              <HiOutlinePlus />
              {t("Create tag “{name}”", { name: query.trim() })}
            </Button>
          )}
          <div className="max-h-64 overflow-auto rounded-md border bg-background">
            {visibleOptions.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">{resolvedEmptyState}</div>
            ) : (
              visibleOptions.map((option) => (
                <div
                  className="flex items-start gap-2 border-b px-3 py-2 transition-colors last:border-b-0 hover:bg-accent/40"
                  key={String(option.id)}
                >
                  <Checkbox
                    aria-label={option.label}
                    checked={selectedIdSet.has(option.id)}
                    className="mt-0.5"
                    onCheckedChange={() => toggle(option.id)}
                  />
                  <button
                    className="min-w-0 flex-1 cursor-pointer rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => toggle(option.id)}
                    type="button"
                  >
                    <span className="block truncate text-sm">{option.label}</span>
                    {option.subtitle && (
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {option.subtitle}
                      </span>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
