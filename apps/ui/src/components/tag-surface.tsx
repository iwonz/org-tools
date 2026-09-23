import type { EmployeeTagColor } from "@org-tools/types";
import type { ComponentPropsWithoutRef } from "react";

import { customTagColorSurfaceStyle, tagColorSurfaceClassName } from "@/lib/tag-color";
import { TAG_SURFACE_METRICS } from "@/lib/tag-surface";
import { cn } from "@/lib/utils";

export function TagSurface({
  children,
  className,
  color,
  style,
  title,
  variant = "tag",
  ...props
}: Omit<ComponentPropsWithoutRef<"span">, "color"> & {
  color?: EmployeeTagColor | null | undefined;
  variant?: "position" | "tag";
}) {
  const metrics = TAG_SURFACE_METRICS;
  return (
    <span
      {...props}
      className={cn(
        "w-fit max-w-full whitespace-normal break-words [-webkit-box-decoration-break:clone] [box-decoration-break:clone] [overflow-wrap:anywhere]",
        variant === "tag"
          ? tagColorSurfaceClassName(color)
          : "border border-border bg-muted text-muted-foreground",
        className,
      )}
      data-tag-color={variant === "tag" ? (color ?? "none") : undefined}
      data-tag-color-surface={variant === "tag" ? true : undefined}
      data-tag-surface-density="universal"
      style={{
        ...customTagColorSurfaceStyle(variant === "tag" ? color : null),
        borderRadius: metrics.radius,
        boxDecorationBreak: "clone",
        fontSize: metrics.fontSize,
        lineHeight: `${metrics.lineHeight}px`,
        paddingBlock: metrics.verticalPadding,
        paddingInline: metrics.horizontalPadding,
        WebkitBoxDecorationBreak: "clone",
        ...style,
      }}
      title={title}
    >
      {children}
    </span>
  );
}
