"use client";

import { HiOutlineCalendarDays } from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAppFormatter, useUiText } from "@/i18n/use-ui-text";

export type EmployeeTagDateValue = string | null | "mixed";

export function EmployeeTagDateText({
  date,
  label,
}: {
  date: EmployeeTagDateValue;
  label: string;
}) {
  const format = useAppFormatter();
  const t = useUiText();
  if (date === null) return <>{label}</>;
  if (date === "mixed") return <>{`${label} · ${t("Mixed dates")}`}</>;
  const value = new Date(`${date}T00:00:00Z`);
  return (
    <span
      title={format.dateTime(value, {
        dateStyle: "long",
        timeZone: "UTC",
      })}
    >
      {label} ·{" "}
      {format.dateTime(value, {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
        year: "numeric",
      })}
    </span>
  );
}

export function EmployeeTagDatePopover({
  date,
  label,
  onChange,
}: {
  date: EmployeeTagDateValue;
  label: string;
  onChange: (date: string | null) => void;
}) {
  const t = useUiText();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label={t("Date for tag {name}", { name: label })}
          className="shrink-0"
          size="icon"
          title={t("Date for tag {name}", { name: label })}
          type="button"
          variant={date === null ? "ghost" : "secondary"}
        >
          <HiOutlineCalendarDays className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="grid w-64 gap-3" sideOffset={6}>
        <div className="text-sm font-medium">
          <EmployeeTagDateText date={date} label={label} />
        </div>
        <Input
          aria-label={t("Date for tag {name}", { name: label })}
          onChange={(event) => onChange(event.currentTarget.value || null)}
          type="date"
          value={date === "mixed" ? "" : (date ?? "")}
        />
        <Button
          disabled={date === null}
          onClick={() => onChange(null)}
          type="button"
          variant="outline"
        >
          {t("Clear date")}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
