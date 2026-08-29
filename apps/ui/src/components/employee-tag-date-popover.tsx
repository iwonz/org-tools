"use client";

import { useLocale } from "next-intl";
import { useState } from "react";
import { enUS, ru } from "react-day-picker/locale";
import { HiOutlineCalendarDays } from "react-icons/hi2";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAppFormatter, useUiText } from "@/i18n/use-ui-text";

export type EmployeeTagDateValue = string | null | "mixed";

const isoDateToLocalDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
};

const localDateToIsoDate = (value: Date) =>
  [
    String(value.getFullYear()).padStart(4, "0"),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0"),
  ].join("-");

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
  onOpenChange,
}: {
  date: EmployeeTagDateValue;
  label: string;
  onChange: (date: string | null) => void;
  onOpenChange?: (open: boolean) => void;
}) {
  const t = useUiText();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const selectedDate = date === null || date === "mixed" ? undefined : isoDateToLocalDate(date);
  const setPopoverOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  return (
    <Popover onOpenChange={setPopoverOpen} open={open}>
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
      <PopoverContent
        align="end"
        className="w-auto p-0"
        data-demo-id="tag-date-popover"
        sideOffset={6}
      >
        <Calendar
          data-demo-id="tag-date-calendar"
          locale={locale === "ru" ? ru : enUS}
          mode="single"
          onSelect={(nextDate) => {
            if (!nextDate) return;
            onChange(localDateToIsoDate(nextDate));
            setPopoverOpen(false);
          }}
          {...(selectedDate ? { defaultMonth: selectedDate, selected: selectedDate } : {})}
        />
        <div className="border-t p-3">
          <Button
            className="w-full"
            disabled={date === null}
            onClick={() => {
              onChange(null);
              setPopoverOpen(false);
            }}
            type="button"
            variant="outline"
          >
            {t("Clear date")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
