"use client";

import type { EmployeeTag } from "@org-tools/types";
import { HighlightedText } from "@/components/highlighted-text";
import { TagSurface } from "@/components/tag-surface";
import { useAppFormatter } from "@/i18n/use-ui-text";
import { normalizeSearchValue } from "@/lib/search-index";
import { layoutInlineSurfaces, TAG_SURFACE_METRICS } from "@/lib/tag-surface";
import { cn } from "@/lib/utils";

export function EmployeeTags({
  className,
  compact = false,
  density = "default",
  inline = false,
  queryTokens = [],
  tags,
  wrapWidth,
}: {
  className?: string;
  compact?: boolean;
  density?: "canvas" | "default";
  inline?: boolean;
  queryTokens?: string[];
  tags: EmployeeTag[];
  wrapWidth?: number;
}) {
  const format = useAppFormatter();
  if (tags.length === 0) return null;

  const isCanvas = density === "canvas";
  const surfaceDensity = isCanvas ? "compact" : "normal";
  const metrics = TAG_SURFACE_METRICS[surfaceDensity];
  const visibleTags = tags;
  const formattedTags = visibleTags.map((tag) =>
    tag.date
      ? `${tag.label} · ${format.dateTime(new Date(`${tag.date}T00:00:00Z`), {
          day: "numeric",
          month: "short",
          timeZone: "UTC",
          ...(isCanvas ? { year: "numeric" as const } : {}),
        })}`
      : tag.label,
  );
  const visualLayout =
    wrapWidth && isCanvas
      ? layoutInlineSurfaces({
          availableWidth: wrapWidth,
          density: "compact",
          measureText: (value) => value.length * 5.2,
          texts: formattedTags,
        })
      : null;

  const Root = inline ? "span" : "div";

  if (visualLayout) {
    return (
      <Root
        className={cn("relative block min-w-0", className)}
        data-employee-tags-density={density}
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
              density="compact"
              key={`${tag.tagId ?? normalizeSearchValue(tag.label)}:${fragment.row}:${fragment.start}:${fragment.end}`}
              style={{
                height: fragment.height,
                left: fragment.x,
                top: fragment.y,
                width: fragment.width,
              }}
            >
              {labelText && <HighlightedText queryTokens={queryTokens} text={labelText} />}
              {suffixText && <span className="opacity-75">{suffixText}</span>}
            </TagSurface>
          );
        })}
      </Root>
    );
  }

  return (
    <Root
      className={cn(inline ? "min-w-0" : "block min-w-0", compact && "align-top", className)}
      data-employee-tags-density={density}
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
          density={surfaceDensity}
          key={normalizeSearchValue(tag.label)}
          style={{ marginInlineEnd: index + 1 < visibleTags.length ? metrics.gap : undefined }}
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
          {formattedTags[index]?.slice(tag.label.length) && (
            <span className="opacity-75">{formattedTags[index]?.slice(tag.label.length)}</span>
          )}
        </TagSurface>
      ))}
    </Root>
  );
}
