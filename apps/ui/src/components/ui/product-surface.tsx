import type * as React from "react";

import { cn } from "@/lib/utils";

export function ProductSurface({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("min-h-0 min-w-0 bg-transparent", className)}
      data-slot="product-surface"
      {...props}
    />
  );
}
