"use client";

import type { EmployeeTag } from "@org-tools/types";
import { useEffect, useSyncExternalStore } from "react";
import { HighlightedText } from "@/components/highlighted-text";
import { useAppLocale } from "@/components/locale-provider";
import { TagSurface } from "@/components/tag-surface";
import { useAppFormatter } from "@/i18n/use-ui-text";
import {
  employeeDisplayTextMeasureEngine,
  ensureEmployeeDisplayFontsReady,
  getEmployeeDisplayMeasurementRevision,
  getEmployeeDisplayUiFontFamily,
  subscribeEmployeeDisplayTextMeasurements,
} from "@/lib/employee-display-measure";
import { normalizeSearchValue } from "@/lib/search-index";
import { layoutInlineSurfaces, TAG_SURFACE_METRICS } from "@/lib/tag-surface";
import { cn } from "@/lib/utils";

export function EmployeeTags({
  className,
  compact = false,
  includeYear = false,
  inline = false,
  queryTokens = [],
  tags,
  wrapWidth,
}: {
  className?: string;
  compact?: boolean;
  includeYear?: boolean;
  inline?: boolean;
  queryTokens?: string[];
  tags: EmployeeTag[];
  wrapWidth?: number;
}) {
  const format = useAppFormatter();
  const { locale } = useAppLocale();
  const measurementRevision = useSyncExternalStore(
    subscribeEmployeeDisplayTextMeasurements,
    getEmployeeDisplayMeasurementRevision,
    getEmployeeDisplayMeasurementRevision,
  );
  useEffect(() => {
    void ensureEmployeeDisplayFontsReady(locale);
  }, [locale]);
  if (tags.length === 0) return null;

  const visibleTags = tags;
  const suffixes = visibleTags.map((tag) =>
    tag.date
      ? ` · ${format.dateTime(new Date(`${tag.date}T00:00:00Z`), {
          day: "numeric",
          month: "short",
          timeZone: "UTC",
          ...(includeYear ? { year: "numeric" as const } : {}),
        })}`
      : "",
  );
  const formattedTags = visibleTags.map((tag, index) => `${tag.label}${suffixes[index] ?? ""}`);
  const visualLayout = wrapWidth
    ? layoutInlineSurfaces({
        availableWidth: wrapWidth,
        measureText: (value) =>
          employeeDisplayTextMeasureEngine.measure(value, {
            fontFamily: getEmployeeDisplayUiFontFamily(),
            fontSize: TAG_SURFACE_METRICS.fontSize,
            fontWeight: 400,
          }),
        suffixes,
        texts: visibleTags.map((tag) => tag.label),
      })
    : null;
  void measurementRevision;

  const Root = inline ? "span" : "div";

  if (visualLayout) {
    return (
      <Root
        className={cn("relative block min-w-0", className)}
        data-employee-tags-density="universal"
        data-employee-tags-hidden-count={0}
        style={{ height: visualLayout.height }}
        title={formattedTags.join(", ")}
      >
        {visualLayout.fragments.map((fragment) => {
          const tag = visibleTags[fragment.itemIndex];
          if (!tag) return null;
          const labelEnd = tag.label.length;
          const labelLength = Math.max(
            0,
            Math.min(fragment.text.length, labelEnd - fragment.start),
          );
          const labelText = fragment.text.slice(0, labelLength);
          const suffixText = fragment.text.slice(labelLength);
          return (
            <TagSurface
              className="absolute inline-flex items-center whitespace-nowrap"
              color={tag.color}
              key={`${tag.tagId ?? normalizeSearchValue(tag.label)}:${fragment.row}:${fragment.start}:${fragment.end}`}
              style={{
                height: fragment.height,
                left: fragment.x,
                top: fragment.y,
                width: fragment.width,
              }}
            >
              {labelText && <HighlightedText queryTokens={queryTokens} text={labelText} />}
              {suffixText && <span className="whitespace-pre opacity-75">{suffixText}</span>}
            </TagSurface>
          );
        })}
      </Root>
    );
  }

  return (
    <Root
      className={cn(
        "min-w-0 flex-wrap gap-[6px]",
        inline ? "inline-flex" : "flex",
        compact && "align-top",
        className,
      )}
      data-employee-tags-density="universal"
      data-employee-tags-hidden-count={0}
      title={visibleTags
        .map((tag) =>
          tag.date
            ? `${tag.label} · ${format.dateTime(new Date(`${tag.date}T00:00:00Z`), {
                dateStyle: "long",
                timeZone: "UTC",
              })}`
            : tag.label,
        )
        .join(", ")}
    >
      {visibleTags.map((tag, index) => (
        <TagSurface
          className="align-baseline"
          color={tag.color}
          key={normalizeSearchValue(tag.label)}
          title={
            tag.date
              ? format.dateTime(new Date(`${tag.date}T00:00:00Z`), {
                  dateStyle: "long",
                  timeZone: "UTC",
                })
              : undefined
          }
        >
          <HighlightedText queryTokens={queryTokens} text={tag.label} />
          {suffixes[index] && <span className="whitespace-pre opacity-75">{suffixes[index]}</span>}
        </TagSurface>
      ))}
    </Root>
  );
}
