import type { EmployeeTagColor } from "@org-tools/types";

export const tagColorSurfaceClassName = (color: EmployeeTagColor | null | undefined) => {
  if (!color) {
    return "bg-primary/10 text-primary hover:bg-primary/15 active:bg-primary/20";
  }
  return (
    {
      amber:
        "bg-amber-400/25 text-amber-950 hover:bg-amber-400/30 active:bg-amber-400/35 dark:bg-amber-300/20 dark:text-amber-100 dark:hover:bg-amber-300/25 dark:active:bg-amber-300/30",
      blue: "bg-blue-500/15 text-blue-900 hover:bg-blue-500/20 active:bg-blue-500/25 dark:bg-blue-400/20 dark:text-blue-100 dark:hover:bg-blue-400/25 dark:active:bg-blue-400/30",
      cyan: "bg-cyan-500/15 text-cyan-950 hover:bg-cyan-500/20 active:bg-cyan-500/25 dark:bg-cyan-400/20 dark:text-cyan-100 dark:hover:bg-cyan-400/25 dark:active:bg-cyan-400/30",
      green:
        "bg-green-500/15 text-green-900 hover:bg-green-500/20 active:bg-green-500/25 dark:bg-green-400/20 dark:text-green-100 dark:hover:bg-green-400/25 dark:active:bg-green-400/30",
      orange:
        "bg-orange-500/15 text-orange-950 hover:bg-orange-500/20 active:bg-orange-500/25 dark:bg-orange-400/20 dark:text-orange-100 dark:hover:bg-orange-400/25 dark:active:bg-orange-400/30",
      red: "bg-red-500/15 text-red-900 hover:bg-red-500/20 active:bg-red-500/25 dark:bg-red-400/20 dark:text-red-100 dark:hover:bg-red-400/25 dark:active:bg-red-400/30",
      rose: "bg-rose-500/15 text-rose-900 hover:bg-rose-500/20 active:bg-rose-500/25 dark:bg-rose-400/20 dark:text-rose-100 dark:hover:bg-rose-400/25 dark:active:bg-rose-400/30",
      teal: "bg-teal-500/15 text-teal-950 hover:bg-teal-500/20 active:bg-teal-500/25 dark:bg-teal-400/20 dark:text-teal-100 dark:hover:bg-teal-400/25 dark:active:bg-teal-400/30",
    } satisfies Record<EmployeeTagColor, string>
  )[color];
};
