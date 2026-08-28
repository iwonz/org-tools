import type * as React from "react";

import { cn } from "@/lib/utils";

export function ProductSurface({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("min-h-0 min-w-0 overflow-hidden bg-background", className)}
      data-slot="product-surface"
      {...props}
    />
  );
}
