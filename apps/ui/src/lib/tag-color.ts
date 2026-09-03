import type { EmployeeTagColor } from "@org-tools/types";

export const tagColorClassName = (color: EmployeeTagColor | null | undefined) => {
  if (!color) return "bg-muted-foreground/45";
  return (
    {
      amber: "bg-amber-500",
      blue: "bg-blue-500",
      cyan: "bg-cyan-500",
      green: "bg-green-500",
      orange: "bg-orange-500",
      red: "bg-red-500",
      rose: "bg-rose-500",
      teal: "bg-teal-500",
    } satisfies Record<EmployeeTagColor, string>
  )[color];
};
