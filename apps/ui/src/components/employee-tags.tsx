"use client";

import type { EmployeeTag } from "@org-tools/types";
import { HighlightedText } from "@/components/highlighted-text";
import { useAppFormatter } from "@/i18n/use-ui-text";
import { orderEmployeeTagsForDisplay } from "@/lib/employee-tags";
import { normalizeSearchValue } from "@/lib/search-index";
import { customTagColorSurfaceStyle, tagColorSurfaceClassName } from "@/lib/tag-color";
import { cn } from "@/lib/utils";

export function EmployeeTags({
  className,
  compact = false,
  density = "default",
  queryTokens = [],
  tags,
}: {
  className?: string;
  compact?: boolean;
  density?: "canvas" | "default";
  queryTokens?: string[];
  tags: EmployeeTag[];
}) {
  const format = useAppFormatter();
  if (tags.length === 0) return null;

  const isCanvas = density === "canvas";
  const visibleTags = orderEmployeeTagsForDisplay(tags, queryTokens);

  return (
    <div
      className={cn(
        "flex min-w-0 flex-wrap gap-1",
        compact && "items-start",
        isCanvas && "gap-0.5 pr-1",
        className,
      )}
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
      {visibleTags.map((tag) => (
        <span
          className={cn(
            "inline-flex max-w-full items-center rounded-md px-2 py-0.5 text-[11px] leading-4",
            tagColorSurfaceClassName(tag.color),
            isCanvas ? "px-1.5 py-0 text-[9px] leading-3" : "shrink-0",
          )}
          data-tag-color={tag.color ?? "none"}
          data-tag-color-surface
          key={normalizeSearchValue(tag.label)}
          style={customTagColorSurfaceStyle(tag.color)}
          title={
            tag.date
              ? format.dateTime(new Date(`${tag.date}T00:00:00Z`), {
                  dateStyle: "long",
                  timeZone: "UTC",
                })
              : undefined
          }
        >
          <span>
            <HighlightedText queryTokens={queryTokens} text={tag.label} />
            {tag.date && (
              <span className="ml-1 opacity-75">
                ·{" "}
                {format.dateTime(new Date(`${tag.date}T00:00:00Z`), {
                  day: "numeric",
                  month: "short",
                  timeZone: "UTC",
                })}
              </span>
            )}
          </span>
        </span>
      ))}
    </div>
  );
}
