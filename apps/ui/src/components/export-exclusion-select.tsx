"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef, useState } from "react";
import { HiOutlineChevronDown, HiOutlineMagnifyingGlass } from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUiText } from "@/i18n/use-ui-text";
import { normalizeSearchValue } from "@/lib/search-index";

const OPTION_HEIGHT = 36;

export type ExportExclusionOption = {
  label: string;
  searchText?: string;
  value: string;
};

export function ExportExclusionSelect({
  dataDemoId,
  label,
  onChange,
  options,
  searchPlaceholder,
  values,
}: {
  dataDemoId: string;
  label: string;
  onChange: (values: string[]) => void;
  options: ExportExclusionOption[];
  searchPlaceholder: string;
  values: string[];
}) {
  const t = useUiText();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const valueSet = useMemo(() => new Set(values), [values]);
  const queryValue = normalizeSearchValue(query);
  const visibleOptions = useMemo(
    () =>
      queryValue
        ? options.filter((option) =>
            normalizeSearchValue(option.searchText ?? option.label).includes(queryValue),
          )
        : options,
    [options, queryValue],
  );
  const virtualizer = useVirtualizer({
    count: visibleOptions.length,
    enabled: open,
    estimateSize: () => OPTION_HEIGHT,
    getScrollElement: () => scrollRef.current,
    getItemKey: (index) => visibleOptions[index]?.value ?? index,
    initialRect: { height: 256, width: 320 },
    overscan: 6,
  });

  const toggle = (value: string) => {
    const next = new Set(values);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange([...next]);
  };

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          className="min-w-48 justify-between font-normal"
          data-demo-id={dataDemoId}
          type="button"
          variant="outline"
        >
          <span className="truncate">
            {values.length === 0 ? label : t("{label}: {count}", { count: values.length, label })}
          </span>
          <HiOutlineChevronDown className="shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-2" data-demo-id={`${dataDemoId}-popover`}>
        <div className="relative">
          <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label={searchPlaceholder}
            className="h-8 pl-8"
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder={searchPlaceholder}
            type="search"
            value={query}
          />
        </div>
        <div className="mt-2 h-64 overflow-auto overscroll-contain" ref={scrollRef}>
          {visibleOptions.length === 0 ? (
            <div className="grid h-full place-items-center text-xs text-muted-foreground">
              {t("Nothing found")}
            </div>
          ) : (
            <div className="relative" style={{ height: virtualizer.getTotalSize() }}>
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const option = visibleOptions[virtualRow.index];
                if (!option) return null;
                const checkboxId = `${dataDemoId}-${virtualRow.index}`;
                return (
                  <label
                    className="absolute left-0 top-0 flex w-full cursor-pointer items-center gap-2 rounded-md px-2 text-sm hover:bg-accent active:bg-accent-strong"
                    htmlFor={checkboxId}
                    key={option.value}
                    style={{
                      height: virtualRow.size,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <Checkbox
                      checked={valueSet.has(option.value)}
                      id={checkboxId}
                      onCheckedChange={() => toggle(option.value)}
                    />
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
