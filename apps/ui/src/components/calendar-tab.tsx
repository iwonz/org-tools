"use client";

import type { DatedTagEvent, DatedTagGroup, Employee } from "@org-tools/types";
import { useVirtualizer } from "@tanstack/react-virtual";
import { observer } from "mobx-react-lite";
import { type ReactNode, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  HiOutlineCalendarDays,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineTag,
  HiOutlineUserGroup,
} from "react-icons/hi2";

import { EmployeeAvatar } from "@/components/employee-avatar";
import { EmployeeCardActions } from "@/components/employee-card-actions";
import { EmployeeCard, EmployeeCardList } from "@/components/employee-card-list";
import { EmployeeDialog } from "@/components/employee-dialog";
import { useAppLocale } from "@/components/locale-provider";
import { MiddleDot } from "@/components/middle-dot";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppFormatter, useUiText } from "@/i18n/use-ui-text";
import { buildCalendarDayDialogRows } from "@/lib/calendar-day-dialog";
import { getCalendarBirthdayEmployees } from "@/lib/calendar-events";
import { formatCalendarDayTitle, getCalendarWeekStart } from "@/lib/calendar-locale";
import type { EmployeeUnitContext } from "@/lib/employee-unit-contexts";
import { tagColorClassName } from "@/lib/tag-color";
import { cn } from "@/lib/utils";
import { useOrgStore } from "@/stores/org-store-context";

type CalendarDay = {
  birthdayEmployees: Employee[];
  date: string;
  day: number;
  events: DatedTagEvent[];
  key: string;
  month: number;
  year: number;
};

const EMPTY_BIRTHDAY_EMPLOYEES_BY_KEY = new Map<string, Employee[]>();
const EMPTY_DATED_EVENTS_BY_DATE = new Map<string, DatedTagEvent[]>();
const EMPTY_DATED_TAG_GROUPS: DatedTagGroup[] = [];
const padDatePart = (value: number) => String(value).padStart(2, "0");
const createIsoDate = (year: number, month: number, day: number) =>
  `${year}-${padDatePart(month)}-${padDatePart(day)}`;

const getTodayDate = () => {
  const now = new Date();
  return createIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
};

const getMonthDays = (
  year: number,
  monthIndex: number,
  employeesByBirthday: Map<string, Employee[]>,
  datedEventsByDate: Map<string, DatedTagEvent[]>,
): CalendarDay[] => {
  const month = monthIndex + 1;
  const dayCount = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: dayCount }, (_, index) => {
    const day = index + 1;
    const birthdayEmployees = getCalendarBirthdayEmployees(employeesByBirthday, year, month, day);
    const date = createIsoDate(year, month, day);
    return {
      birthdayEmployees,
      date,
      day,
      events: datedEventsByDate.get(date) ?? [],
      key: date,
      month,
      year,
    };
  });
};

function BirthdayAvatarStack({ employees }: { employees: Employee[] }) {
  const format = useAppFormatter();
  const visibleEmployees = employees.slice(0, 5);
  const hiddenCount = Math.max(0, employees.length - visibleEmployees.length);
  return (
    <div className="flex min-w-0 items-center">
      {visibleEmployees.map((employee, index) => (
        <EmployeeAvatar
          className={cn("size-6 border-2 border-background", index > 0 && "-ml-2")}
          employee={employee}
          key={employee.id}
        />
      ))}
      {hiddenCount > 0 && (
        <span className="-ml-2 grid size-6 place-items-center rounded-full border-2 border-background bg-muted text-[9px] font-medium text-muted-foreground">
          +{format.number(hiddenCount)}
        </span>
      )}
    </div>
  );
}

function CalendarDayCell({
  calendarDay,
  isToday,
  isWeekend,
  onOpen,
}: {
  calendarDay: CalendarDay;
  isToday: boolean;
  isWeekend: boolean;
  onOpen: (calendarDay: CalendarDay) => void;
}) {
  const format = useAppFormatter();
  const hasContent = calendarDay.birthdayEmployees.length > 0 || calendarDay.events.length > 0;
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "text-sm font-medium",
            isToday && "rounded-md bg-signal px-1.5 py-0.5 text-signal-foreground",
          )}
        >
          {calendarDay.day}
        </span>
      </div>
      <div className="mt-1.5 grid min-h-0 gap-1">
        {calendarDay.birthdayEmployees.length > 0 && (
          <BirthdayAvatarStack employees={calendarDay.birthdayEmployees} />
        )}
        {calendarDay.events.length > 0 && (
          <span
            className="flex min-w-0 items-center gap-1 text-[11px] leading-4 text-muted-foreground"
            data-demo-id="calendar-day-tag-count"
          >
            <HiOutlineTag className="size-3 shrink-0" />
            <span>{format.number(calendarDay.events.length)}</span>
          </span>
        )}
      </div>
    </>
  );
  return (
    <button
      className={cn(
        "flex min-h-0 cursor-pointer flex-col items-stretch overflow-hidden rounded-lg bg-muted/30 p-2.5 text-start outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        isWeekend && "bg-muted/65 hover:bg-muted/80",
        isToday && "bg-signal/15 hover:bg-signal/20",
      )}
      data-calendar-date={calendarDay.date}
      data-has-content={hasContent ? "true" : "false"}
      data-today={isToday ? "true" : undefined}
      onClick={() => onOpen(calendarDay)}
      type="button"
    >
      {content}
    </button>
  );
}

function TagEventSection({
  actions,
  events,
  onUnitContextClick,
  unitContextsByEmployeeId,
}: {
  actions: (employee: Employee) => ReactNode;
  events: DatedTagEvent[];
  onUnitContextClick: (unitContext: EmployeeUnitContext) => void;
  unitContextsByEmployeeId: ReadonlyMap<Employee["id"], EmployeeUnitContext[]>;
}) {
  return (
    <EmployeeCardList
      actions={actions}
      cardDataDemoId="calendar-tag-event-employee-card"
      className="min-h-0 flex-1 p-0"
      dataDemoId="calendar-tag-event-list"
      employees={events.map((event) => event.employee)}
      onUnitContextClick={onUnitContextClick}
      resetKey={events.map((event) => `${event.employee.id}:${event.date}`).join("|")}
      unitContextsByEmployeeId={unitContextsByEmployeeId}
    />
  );
}

function CalendarDayDialogList({
  actions,
  birthdayEmployees,
  events,
  locale,
  onTagClick,
  onUnitContextClick,
  unitContextsByEmployeeId,
}: {
  actions: (employee: Employee) => ReactNode;
  birthdayEmployees: Employee[];
  events: DatedTagEvent[];
  locale: string;
  onTagClick: (normalizedLabel: string) => void;
  onUnitContextClick: (unitContext: EmployeeUnitContext) => void;
  unitContextsByEmployeeId: ReadonlyMap<Employee["id"], EmployeeUnitContext[]>;
}) {
  const t = useUiText();
  const rows = useMemo(
    () => buildCalendarDayDialogRows({ birthdayEmployees, events, locale }),
    [birthdayEmployees, events, locale],
  );
  const parentRef = useRef<HTMLDivElement | null>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: (index) => (rows[index]?.kind === "header" ? 42 : 132),
    getItemKey: (index) => rows[index]?.key ?? `calendar-day-row:${index}`,
    getScrollElement: () => parentRef.current,
    overscan: 8,
  });
  const measureRows = useCallback(() => {
    for (const element of parentRef.current?.querySelectorAll<HTMLElement>("[data-index]") ?? []) {
      virtualizer.measureElement(element);
    }
  }, [virtualizer]);
  useLayoutEffect(() => {
    virtualizer.measure();
    const frame = window.requestAnimationFrame(measureRows);
    return () => window.cancelAnimationFrame(frame);
  }, [measureRows, virtualizer]);

  return (
    <div
      className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable]"
      data-demo-id="calendar-day-event-list"
      ref={parentRef}
    >
      <div className="relative" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index];
          if (!row) return null;
          return (
            <div
              className="absolute left-0 top-0 w-full"
              data-index={virtualRow.index}
              key={row.key}
              ref={virtualizer.measureElement}
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              {row.kind === "header" ? (
                row.normalizedLabel ? (
                  <button
                    className="flex w-full items-center gap-2 bg-muted/35 px-3.5 py-2.5 text-start text-sm font-semibold outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    data-demo-id="calendar-day-tag-heading"
                    onClick={() => onTagClick(row.normalizedLabel as string)}
                    type="button"
                  >
                    <HiOutlineTag className="size-4" />
                    {row.label}
                  </button>
                ) : (
                  <h3 className="flex items-center gap-2 bg-muted/35 px-3.5 py-2.5 text-sm font-semibold">
                    <HiOutlineUserGroup className="size-4" />
                    {t("Birthdays")}
                  </h3>
                )
              ) : (
                <EmployeeCard
                  actions={actions}
                  dataDemoId="calendar-day-employee-card"
                  employee={row.employee}
                  onUnitContextClick={onUnitContextClick}
                  unitContexts={unitContextsByEmployeeId.get(row.employee.id) ?? []}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const CalendarTab = observer(() => {
  const store = useOrgStore();
  const t = useUiText();
  const format = useAppFormatter();
  const { locale } = useAppLocale();
  const employeesByBirthday =
    store.units?.indexes.birthdayEmployeesByKey ?? EMPTY_BIRTHDAY_EMPLOYEES_BY_KEY;
  const datedEventsByDate = store.units?.indexes.datedTagEventsByDate ?? EMPTY_DATED_EVENTS_BY_DATE;
  const indexedDatedTagGroups = store.units?.indexes.datedTagGroups ?? EMPTY_DATED_TAG_GROUPS;
  const datedTagGroups = useMemo(
    () =>
      [...indexedDatedTagGroups].sort((first, second) =>
        new Intl.Collator(locale, { numeric: true, sensitivity: "base" }).compare(
          first.label,
          second.label,
        ),
      ),
    [indexedDatedTagGroups, locale],
  );
  const { monthIndex, year } = store.calendarUi;
  const [dialogDayKey, setDialogDayKey] = useState<string | null>(null);
  const [dialogTagKey, setDialogTagKey] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const todayDate = useMemo(getTodayDate, []);
  const todayIso = todayDate;
  const monthDays = useMemo(
    () => getMonthDays(year, monthIndex, employeesByBirthday, datedEventsByDate),
    [datedEventsByDate, employeesByBirthday, monthIndex, year],
  );
  const dialogDay = useMemo(
    () => monthDays.find((day) => day.key === dialogDayKey) ?? null,
    [dialogDayKey, monthDays],
  );
  const weekStartsOn = getCalendarWeekStart(locale);
  const firstWeekday = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const leadingDayCount = (firstWeekday - weekStartsOn + 7) % 7;
  const rowCount = Math.ceil((leadingDayCount + monthDays.length) / 7);
  const weekdayLabels = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const sundayBasedDay = (weekStartsOn + index) % 7;
        return new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(
          new Date(Date.UTC(2026, 7, 2 + sundayBasedDay)),
        );
      }),
    [locale, weekStartsOn],
  );
  const monthTitle = format.dateTime(new Date(Date.UTC(year, monthIndex, 1)), {
    month: "long",
    timeZone: "UTC",
  });
  const title = `${monthTitle} ${format.number(year, { useGrouping: false })}`;
  const step = (direction: -1 | 1) => {
    const next = new Date(Date.UTC(year, monthIndex + direction, 1));
    store.setCalendarUi({ monthIndex: next.getUTCMonth(), year: next.getUTCFullYear() });
  };
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && monthIndex === now.getMonth();
  const dialogTag = useMemo(
    () => datedTagGroups.find((group) => group.normalizedLabel === dialogTagKey) ?? null,
    [datedTagGroups, dialogTagKey],
  );
  const selectedTagEvents = dialogTag?.events ?? [];
  const upcomingEvents = selectedTagEvents.filter(({ date }) => date >= todayIso);
  const pastEvents = selectedTagEvents.filter(({ date }) => date < todayIso).reverse();

  return (
    <>
      <section
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background"
        data-demo-id="calendar-tab"
      >
        <div
          className="flex shrink-0 flex-col gap-3 bg-muted/25 p-4 md:flex-row md:items-center md:justify-between"
          data-demo-id="calendar-header"
        >
          <div
            className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto whitespace-nowrap [scrollbar-width:thin]"
            data-demo-id="dated-tag-rail"
          >
            {datedTagGroups.map((group) => (
              <Button
                className="h-8 shrink-0 gap-0 rounded-full px-2.5 text-xs"
                data-color={group.color ?? "none"}
                data-demo-id="calendar-dated-tag-group"
                key={group.tagId}
                onClick={() => setDialogTagKey(group.normalizedLabel)}
                size="sm"
                type="button"
                variant="secondary"
              >
                <span
                  className={cn("me-1.5 size-2 rounded-full", tagColorClassName(group.color))}
                />
                <HiOutlineTag className="me-1.5 size-3.5" />
                <span>{group.label}</span>
                <MiddleDot />
                <span>{format.number(group.events.length)}</span>
              </Button>
            ))}
          </div>
          <div
            className="flex shrink-0 items-center gap-2"
            data-demo-id="calendar-header-navigation"
          >
            <div
              className="me-1 text-base font-semibold capitalize"
              data-demo-id="calendar-month-title"
            >
              {title}
            </div>
            {!isCurrentMonth && (
              <Button
                onClick={() =>
                  store.setCalendarUi({ monthIndex: now.getMonth(), year: now.getFullYear() })
                }
                type="button"
                variant="ghost"
              >
                <HiOutlineCalendarDays />
                {t("Today")}
              </Button>
            )}
            <Button
              aria-label={t("Previous")}
              onClick={() => step(-1)}
              size="icon"
              title={t("Previous")}
              type="button"
              variant="ghost"
            >
              <HiOutlineChevronLeft />
            </Button>
            <Button
              aria-label={t("Next")}
              onClick={() => step(1)}
              size="icon"
              title={t("Next")}
              type="button"
              variant="ghost"
            >
              <HiOutlineChevronRight />
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-4" data-demo-id="calendar-scroll-area">
          <div className="flex min-h-full min-w-[640px] flex-col">
            <div className="mb-2 grid shrink-0 grid-cols-7 gap-2" data-demo-id="calendar-weekdays">
              {weekdayLabels.map((label, index) => {
                const weekday = (weekStartsOn + index) % 7;
                const isWeekend = weekday === 0 || weekday === 6;
                return (
                  <div
                    className={cn(
                      "rounded-md px-2 py-1 text-center text-xs font-medium capitalize text-muted-foreground",
                      isWeekend && "bg-muted/65",
                    )}
                    key={label}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
            <div
              className="grid min-h-0 flex-1 grid-cols-7 gap-2"
              data-demo-id="calendar-month-grid"
              data-month={monthIndex + 1}
              data-year={year}
              style={{
                gridTemplateRows: `repeat(${rowCount}, minmax(76px, 1fr))`,
                minHeight: rowCount * 76 + (rowCount - 1) * 8,
              }}
            >
              {Array.from({ length: leadingDayCount }, (_, offset) => `offset:${offset + 1}`).map(
                (offsetKey) => (
                  <div aria-hidden="true" key={offsetKey} />
                ),
              )}
              {monthDays.map((day) => (
                <CalendarDayCell
                  calendarDay={day}
                  isToday={day.date === todayDate}
                  isWeekend={[0, 6].includes(
                    new Date(Date.UTC(day.year, day.month - 1, day.day)).getUTCDay(),
                  )}
                  key={day.key}
                  onOpen={(calendarDay) => setDialogDayKey(calendarDay.key)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <Dialog onOpenChange={(open) => !open && setDialogDayKey(null)} open={dialogDay !== null}>
        <DialogContent className="flex h-[min(760px,90dvh)] max-w-4xl flex-col">
          <DialogHeader>
            <DialogTitle>
              {dialogDay
                ? formatCalendarDayTitle(new Date(`${dialogDay.date}T00:00:00Z`), locale)
                : ""}
            </DialogTitle>
          </DialogHeader>
          <DialogBody
            className="flex min-h-0 flex-1 overflow-hidden p-0"
            data-demo-id="calendar-day-dialog-body"
          >
            {dialogDay && (
              <CalendarDayDialogList
                actions={(employee) => (
                  <EmployeeCardActions
                    employee={employee}
                    onApplyTags={store.updateEmployeeTags}
                    onDelete={setDeletingEmployee}
                    onEdit={setEditingEmployee}
                    tagOptions={store.units?.indexes.tagOptions ?? []}
                    tagPickerDataDemoId="calendar-day-employee-tag-picker"
                  />
                )}
                birthdayEmployees={dialogDay.birthdayEmployees}
                events={dialogDay.events}
                locale={locale}
                onTagClick={setDialogTagKey}
                onUnitContextClick={(context) => store.selectUnitFromEmployeeCard(context.unitId)}
                unitContextsByEmployeeId={store.employeeUnitContextsByEmployeeId}
              />
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>

      {editingEmployee && store.units && (
        <EmployeeDialog
          employee={editingEmployee}
          mode="global"
          onOpenChange={(open) => !open && setEditingEmployee(null)}
          onSave={(fields, memberships) =>
            store.updateEmployee(editingEmployee.id, fields, memberships)
          }
          open={Boolean(editingEmployee)}
          tagOptions={store.units.indexes.tagOptions}
          units={store.units}
        />
      )}
      <AlertDialog
        onOpenChange={(open) => !open && setDeletingEmployee(null)}
        open={Boolean(deletingEmployee)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete Employee?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingEmployee
                ? t("Employee {name} will be removed from the catalog and every Team.", {
                    name: deletingEmployee.fullName,
                  })
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              data-demo-id="calendar-confirm-delete-employee"
              onClick={() => {
                if (deletingEmployee) store.deleteOrganizationEmployee(deletingEmployee.id);
                setDeletingEmployee(null);
              }}
            >
              {t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog onOpenChange={(open) => !open && setDialogTagKey(null)} open={dialogTag !== null}>
        <DialogContent className="flex h-[min(760px,90dvh)] max-w-2xl flex-col">
          <DialogHeader>
            <DialogTitle>{dialogTag?.label ?? ""}</DialogTitle>
          </DialogHeader>
          <DialogBody
            className="grid min-h-0 flex-1 auto-rows-fr gap-4 overflow-hidden"
            data-demo-id="calendar-tag-dialog-body"
          >
            {upcomingEvents.length > 0 && (
              <section
                className="flex min-h-0 flex-col gap-2"
                data-demo-id="calendar-upcoming-events-section"
              >
                <TagEventSection
                  actions={(employee) => (
                    <EmployeeCardActions
                      employee={employee}
                      onApplyTags={store.updateEmployeeTags}
                      onDelete={setDeletingEmployee}
                      onEdit={setEditingEmployee}
                      tagOptions={store.units?.indexes.tagOptions ?? []}
                      tagPickerDataDemoId="calendar-tag-dialog-employee-tag-picker"
                    />
                  )}
                  events={upcomingEvents}
                  onUnitContextClick={(context) => store.selectUnitFromEmployeeCard(context.unitId)}
                  unitContextsByEmployeeId={store.employeeUnitContextsByEmployeeId}
                />
              </section>
            )}
            {pastEvents.length > 0 && (
              <section
                className="flex min-h-0 flex-col gap-2"
                data-demo-id="calendar-past-events-section"
              >
                <h3 className="text-sm font-semibold">{t("Past")}</h3>
                <TagEventSection
                  actions={(employee) => (
                    <EmployeeCardActions
                      employee={employee}
                      onApplyTags={store.updateEmployeeTags}
                      onDelete={setDeletingEmployee}
                      onEdit={setEditingEmployee}
                      tagOptions={store.units?.indexes.tagOptions ?? []}
                      tagPickerDataDemoId="calendar-tag-dialog-employee-tag-picker"
                    />
                  )}
                  events={pastEvents}
                  onUnitContextClick={(context) => store.selectUnitFromEmployeeCard(context.unitId)}
                  unitContextsByEmployeeId={store.employeeUnitContextsByEmployeeId}
                />
              </section>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
});
