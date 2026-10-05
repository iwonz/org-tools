"use client";

import type { EmployeeTagDefinition, TagId } from "@org-tools/types";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef, useState } from "react";
import {
  HiOutlineCheck,
  HiOutlineChevronDown,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
} from "react-icons/hi2";

import { TagSurface } from "@/components/tag-surface";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUiText } from "@/i18n/use-ui-text";
import { normalizeSearchValue } from "@/lib/search-index";

const TAG_ROW_HEIGHT = 40;
const HIDE_STAFFING_SLOTS_ID = "org-editor-image-hide-staffing-slots";

export function OrgEditorImageExportContentControls({
  excludedTagIds,
  hideStaffingSlots,
  onChange,
  tagDefinitions,
}: {
  excludedTagIds: readonly TagId[];
  hideStaffingSlots: boolean;
  onChange: (preferences: { excludedTagIds: TagId[]; hideStaffingSlots: boolean }) => void;
  tagDefinitions: readonly EmployeeTagDefinition[];
}) {
  const t = useUiText();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const availableTagIds = useMemo(
    () => new Set(tagDefinitions.map((definition) => definition.id)),
    [tagDefinitions],
  );
  const excludedSet = useMemo(
    () => new Set(excludedTagIds.filter((tagId) => availableTagIds.has(tagId))),
    [availableTagIds, excludedTagIds],
  );
  const normalizedQuery = normalizeSearchValue(query);
  const visibleDefinitions = useMemo(
    () =>
      normalizedQuery
        ? tagDefinitions.filter((definition) =>
            normalizeSearchValue(definition.label).includes(normalizedQuery),
          )
        : tagDefinitions,
    [normalizedQuery, tagDefinitions],
  );
  const selectedCount = tagDefinitions.length - excludedSet.size;
  const virtualizer = useVirtualizer({
    count: visibleDefinitions.length,
    enabled: open,
    estimateSize: () => TAG_ROW_HEIGHT,
    getScrollElement: () => scrollRef.current,
    getItemKey: (index) => visibleDefinitions[index]?.id ?? index,
    initialRect: { height: 256, width: 384 },
    overscan: 6,
  });

  const updateExcluded = (nextExcludedIds: Set<TagId>) => {
    onChange({
      excludedTagIds: [
        ...excludedTagIds.filter((tagId) => !availableTagIds.has(tagId)),
        ...tagDefinitions
          .map((definition) => definition.id)
          .filter((tagId) => nextExcludedIds.has(tagId)),
      ],
      hideStaffingSlots,
    });
  };

  return (
    <section className="grid gap-3" data-demo-id="org-editor-image-content-controls">
      <div className="grid gap-2">
        <Label>{t("Tags in image")}</Label>
        <Popover
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen);
            if (!nextOpen) setQuery("");
          }}
          open={open}
        >
          <PopoverTrigger asChild>
            <Button
              aria-expanded={open}
              className="w-full justify-between font-normal"
              data-demo-id="org-editor-image-tag-visibility-trigger"
              role="combobox"
              type="button"
              variant="outline"
            >
              <span className="truncate text-start">
                {t("Selected {selected} of {total}", {
                  selected: selectedCount,
                  total: tagDefinitions.length,
                })}
              </span>
              <HiOutlineChevronDown className="shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-96 max-w-[calc(100vw-32px)] p-2"
            data-demo-id="org-editor-image-tag-visibility-popover"
          >
            <div className="relative">
              <HiOutlineMagnifyingGlass className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label={t("Search tags")}
                className="h-8 ps-8"
                data-demo-id="org-editor-image-tag-search"
                onChange={(event) => setQuery(event.currentTarget.value)}
                placeholder={t("Search tags")}
                type="search"
                value={query}
              />
            </div>
            <div
              className="mt-2 grid grid-cols-2 gap-1"
              data-demo-id="org-editor-image-tag-bulk-actions"
            >
              <Button
                className="h-8 justify-center border-0 px-2 text-xs font-normal"
                data-demo-id="org-editor-image-tag-select-all"
                disabled={tagDefinitions.length === 0 || excludedSet.size === 0}
                onClick={() => updateExcluded(new Set())}
                size="sm"
                type="button"
                variant="ghost"
              >
                <HiOutlineCheck className="size-4" />
                {t("Select all")}
              </Button>
              <Button
                className="h-8 justify-center border-0 px-2 text-xs font-normal"
                data-demo-id="org-editor-image-tag-deselect-all"
                disabled={tagDefinitions.length === 0 || excludedSet.size === tagDefinitions.length}
                onClick={() => updateExcluded(new Set(availableTagIds))}
                size="sm"
                type="button"
                variant="ghost"
              >
                <HiOutlineXMark className="size-4" />
                {t("Deselect all")}
              </Button>
            </div>
            <div
              className="mt-2 h-64 overflow-auto overscroll-contain"
              data-demo-id="org-editor-image-tag-options"
              ref={scrollRef}
            >
              {visibleDefinitions.length === 0 ? (
                <div className="grid h-full place-items-center text-xs text-muted-foreground">
                  {t("No tags found")}
                </div>
              ) : (
                <div className="relative" style={{ height: virtualizer.getTotalSize() }}>
                  {virtualizer.getVirtualItems().map((virtualRow) => {
                    const definition = visibleDefinitions[virtualRow.index];
                    if (!definition) return null;
                    const checkboxId = `org-editor-image-tag-${definition.id}`;
                    return (
                      <label
                        className="absolute start-0 top-0 flex w-full cursor-pointer items-center gap-2 rounded-md px-2 hover:bg-accent focus-within:ring-2 focus-within:ring-ring"
                        htmlFor={checkboxId}
                        key={definition.id}
                        style={{
                          height: virtualRow.size,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <Checkbox
                          checked={!excludedSet.has(definition.id)}
                          id={checkboxId}
                          onCheckedChange={() => {
                            const next = new Set(excludedSet);
                            if (next.has(definition.id)) next.delete(definition.id);
                            else next.add(definition.id);
                            updateExcluded(next);
                          }}
                        />
                        <TagSurface className="truncate" color={definition.color}>
                          {definition.label}
                        </TagSurface>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <label
        className="flex cursor-pointer items-center gap-2 text-sm"
        htmlFor={HIDE_STAFFING_SLOTS_ID}
      >
        <Checkbox
          checked={hideStaffingSlots}
          data-demo-id="org-editor-image-hide-staffing-slots"
          id={HIDE_STAFFING_SLOTS_ID}
          onCheckedChange={(checked) =>
            onChange({
              excludedTagIds: [...excludedTagIds],
              hideStaffingSlots: checked === true,
            })
          }
        />
        <span>{t("Hide Staffing Slots")}</span>
      </label>
    </section>
  );
}
