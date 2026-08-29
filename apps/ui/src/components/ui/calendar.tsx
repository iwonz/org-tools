"use client";

import type { ComponentProps } from "react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { HiOutlineChevronDown, HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi2";

import { cn } from "@/lib/utils";

export function Calendar({
  className,
  classNames,
  components,
  showOutsideDays = true,
  ...props
}: ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      className={cn("w-fit p-3", className)}
      classNames={{
        root: cn("relative", defaultClassNames.root),
        months: cn("relative flex flex-col", defaultClassNames.months),
        month: cn("space-y-3", defaultClassNames.month),
        month_caption: cn(
          "flex h-9 items-center justify-center px-10",
          defaultClassNames.month_caption,
        ),
        caption_label: cn(
          "select-none text-sm font-semibold capitalize",
          defaultClassNames.caption_label,
        ),
        nav: cn(
          "absolute inset-x-0 top-0 z-10 flex items-center justify-between",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          "inline-flex size-9 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/45 disabled:pointer-events-none disabled:opacity-40",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          "inline-flex size-9 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/45 disabled:pointer-events-none disabled:opacity-40",
          defaultClassNames.button_next,
        ),
        chevron: cn("size-4", defaultClassNames.chevron),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn("grid grid-cols-7", defaultClassNames.weekdays),
        weekday: cn(
          "grid size-9 place-items-center text-xs font-medium text-muted-foreground",
          defaultClassNames.weekday,
        ),
        weeks: defaultClassNames.weeks,
        week: cn("grid grid-cols-7", defaultClassNames.week),
        day: cn("relative size-9 p-0 text-center", defaultClassNames.day),
        day_button: cn(
          "inline-flex size-9 items-center justify-center rounded-md text-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/45",
          defaultClassNames.day_button,
        ),
        selected: cn(
          "[&>button]:bg-primary [&>button]:font-semibold [&>button]:text-primary-foreground [&>button]:hover:bg-primary/88",
          defaultClassNames.selected,
        ),
        today: cn(
          "[&>button]:bg-accent-strong/65 [&>button]:font-semibold",
          defaultClassNames.today,
        ),
        outside: cn(
          "[&>button]:text-muted-foreground [&>button]:opacity-35",
          defaultClassNames.outside,
        ),
        disabled: cn(
          "[&>button]:pointer-events-none [&>button]:opacity-35",
          defaultClassNames.disabled,
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        focused: defaultClassNames.focused,
        dropdowns: defaultClassNames.dropdowns,
        dropdown: defaultClassNames.dropdown,
        dropdown_root: defaultClassNames.dropdown_root,
        months_dropdown: defaultClassNames.months_dropdown,
        years_dropdown: defaultClassNames.years_dropdown,
        footer: defaultClassNames.footer,
        week_number: defaultClassNames.week_number,
        week_number_header: defaultClassNames.week_number_header,
        ...classNames,
      }}
      components={{
        Chevron: ({ className: chevronClassName, orientation }) => {
          const Icon =
            orientation === "left"
              ? HiOutlineChevronLeft
              : orientation === "right"
                ? HiOutlineChevronRight
                : HiOutlineChevronDown;
          return <Icon className={cn("size-4", chevronClassName)} />;
        },
        ...components,
      }}
      showOutsideDays={showOutsideDays}
      {...props}
    />
  );
}
