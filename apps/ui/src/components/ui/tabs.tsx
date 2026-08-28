"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import type * as React from "react";

import { cn } from "@/lib/utils";

const FLAT_TABS_LIST_CLASS_NAME =
  "inline-flex h-10 items-center justify-center gap-1 bg-transparent p-0";

const FLAT_TABS_TRIGGER_CLASS_NAME =
  "relative inline-flex h-full min-h-8 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-sm bg-transparent px-3 text-sm font-medium text-muted-foreground outline-none transition-colors duration-150 ease-out hover:bg-accent/55 hover:text-foreground active:bg-accent-strong/70 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/45 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none data-[state=active]:bg-accent/70 data-[state=active]:text-foreground data-[state=active]:hover:bg-accent-strong/65";

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root className={cn("flex flex-col", className)} data-slot="tabs" {...props} />
  );
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(FLAT_TABS_LIST_CLASS_NAME, className)}
      data-slot="tabs-list"
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(FLAT_TABS_TRIGGER_CLASS_NAME, className)}
      data-slot="tabs-trigger"
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn("min-h-0 flex-1 outline-none", className)}
      data-slot="tabs-content"
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
