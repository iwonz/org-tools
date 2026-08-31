"use client";

import type { DatedTagEvent, DatedTagGroup, Employee } from "@org-tools/types";
import { useVirtualizer } from "@tanstack/react-virtual";
import { observer } from "mobx-react-lite";
import { useLocale } from "next-intl";
import { useMemo, useRef, useState } from "react";
import { HiOutlineCalendarDays, HiOutlineTag, HiOutlineUserGroup } from "react-icons/hi2";

import { EmployeeAvatar } from "@/components/employee-avatar";
import { EmployeeCardActions } from "@/components/employee-card-actions";
import { EmployeeCardList } from "@/components/employee-card-list";
import { EmployeeDialog } from "@/components/employee-dialog";
import { TopLevelEmptyState } from "@/components/source-empty-state";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppFormatter, useCountText, useUiText } from "@/i18n/use-ui-text";
import { getCalendarBirthdayEmployees } from "@/lib/calendar-events";
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
const CLOUD_VISIBLE_LIMIT = 10;
const DAY_EVENT_LIMIT = 2;
const TAG_EVENT_ROW_HEIGHT = 58;

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
  onOpen,
}: {
  calendarDay: CalendarDay;
  isToday: boolean;
  onOpen: (calendarDay: CalendarDay) => void;
}) {
  const format = useAppFormatter();
  const hasContent = calendarDay.birthdayEmployees.length > 0 || calendarDay.events.length > 0;
  const hiddenEventCount = Math.max(0, calendarDay.events.length - DAY_EVENT_LIMIT);
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
        {hasContent && (
          <span className="text-[10px] font-medium text-muted-foreground">
            {format.number(calendarDay.birthdayEmployees.length + calendarDay.events.length)}
          </span>
        )}
      </div>
      <div className="mt-1.5 grid min-h-0 gap-1">
        {calendarDay.birthdayEmployees.length > 0 && (
          <BirthdayAvatarStack employees={calendarDay.birthdayEmployees} />
        )}
        {calendarDay.events.slice(0, DAY_EVENT_LIMIT).map((event) => (
          <span
            className="flex min-w-0 items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] leading-4 text-amber-800 dark:text-amber-200"
            key={`${event.employee.id}:${event.label}`}
          >
            <HiOutlineTag className="size-3 shrink-0" />
            <span className="truncate">{event.label}</span>
          </span>
        ))}
        {hiddenEventCount > 0 && (
          <span className="text-[10px] text-muted-foreground">
            +{format.number(hiddenEventCount)}
          </span>
        )}
      </div>
    </>
  );
  return (
    <button
      className={cn(
        "flex min-h-0 cursor-pointer flex-col items-stretch overflow-hidden rounded-lg bg-muted/30 p-2.5 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
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

function TagEventSection({ events }: { events: DatedTagEvent[] }) {
  const format = useAppFormatter();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const virtualizer = useVirtualizer({
    count: events.length,
    estimateSize: () => TAG_EVENT_ROW_HEIGHT,
    getScrollElement: () => scrollRef.current,
    getItemKey: (index) => `${events[index]?.date}:${events[index]?.employee.id}:${index}`,
    overscan: 8,
  });
  return (
    <div className="min-h-0 flex-1 overflow-auto" ref={scrollRef}>
      <div className="relative" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((row) => {
          const event = events[row.index];
          if (!event) return null;
          return (
            <div
              className="absolute left-0 top-0 flex w-full items-center gap-3 px-1 py-2"
              key={row.key}
              style={{ height: row.size, transform: `translateY(${row.start}px)` }}
            >
              <EmployeeAvatar className="size-8" employee={event.employee} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{event.employee.fullName}</div>
                <div className="text-xs text-muted-foreground">
                  {format.dateTime(new Date(`${event.date}T00:00:00Z`), {
                    dateStyle: "long",
                    timeZone: "UTC",
                  })}
                </div>
              </div>
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
  const countText = useCountText();
  const format = useAppFormatter();
  const locale = useLocale();
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
  const birthdayEmployeeCount = useMemo(
    () => [...employeesByBirthday.values()].reduce((sum, employees) => sum + employees.length, 0),
    [employeesByBirthday],
  );
  const { cloudExpanded, monthIndex, year } = store.calendarUi;
  const [dialogDayKey, setDialogDayKey] = useState<string | null>(null);
  const [dialogTag, setDialogTag] = useState<DatedTagGroup | null>(null);
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
  const rowCount = Math.ceil(monthDays.length / 7);
  const monthTitle = format.dateTime(new Date(Date.UTC(year, monthIndex, 1)), {
    month: "long",
    timeZone: "UTC",
  });
  const title = `${monthTitle} ${format.number(year, { useGrouping: false })}`;
  const step = (direction: -1 | 1) => {
    const next = new Date(Date.UTC(year, monthIndex + direction, 1));
    store.setCalendarUi({ monthIndex: next.getUTCMonth(), year: next.getUTCFullYear() });
  };
  const visibleGroups = cloudExpanded
    ? datedTagGroups
    : datedTagGroups.slice(0, CLOUD_VISIBLE_LIMIT);
  const hiddenGroupCount = Math.max(0, datedTagGroups.length - visibleGroups.length);
  const selectedTagEvents = dialogTag?.events ?? [];
  const upcomingEvents = selectedTagEvents.filter(({ date }) => date >= todayIso);
  const pastEvents = selectedTagEvents.filter(({ date }) => date < todayIso).reverse();

  if (birthdayEmployeeCount === 0 && datedTagGroups.length === 0) {
    return (
      <TopLevelEmptyState
        action={
          <Button onClick={() => store.setActiveTab("employees")}>{t("Go to Employees")}</Button>
        }
        description={t("Add birthdays or dated tags to Employee profiles to use the calendar.")}
        icon={<HiOutlineCalendarDays className="size-6" />}
        title={t("No calendar events yet")}
      />
    );
  }

  return (
    <>
      <section
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background"
        data-demo-id="calendar-tab"
      >
        <div
          className="flex shrink-0 flex-wrap items-center justify-between gap-3 bg-muted/25 p-4"
          data-demo-id="calendar-header"
        >
          <div className="min-w-0">
            <div className="text-sm font-medium">{t("Employee Calendar")}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {countText("calendarEvents", {
                count:
                  birthdayEmployeeCount +
                  [...datedEventsByDate.values()].reduce((sum, events) => sum + events.length, 0),
              })}
            </div>
          </div>
          <div className="flex items-center gap-2" data-demo-id="calendar-header-navigation">
            <div
              className="mr-1 text-base font-semibold capitalize"
              data-demo-id="calendar-month-title"
            >
              {title}
            </div>
            <Button onClick={() => step(-1)} type="button" variant="outline">
              {t("Previous")}
            </Button>
            <Button onClick={() => step(1)} type="button" variant="outline">
              {t("Next")}
            </Button>
          </div>
        </div>
        {datedTagGroups.length > 0 && (
          <div
            className={cn(
              "flex shrink-0 flex-wrap gap-1.5 overflow-auto bg-muted/15 px-4 py-2.5",
              cloudExpanded ? "max-h-16" : "max-h-[4.25rem]",
            )}
            data-demo-id="dated-tag-cloud"
          >
            {visibleGroups.map((group) => (
              <Button
                className="h-7 rounded-full px-2.5 text-xs"
                key={group.normalizedLabel}
                onClick={() => setDialogTag(group)}
                size="sm"
                type="button"
                variant="secondary"
              >
                {group.label} · {format.number(group.events.length)}
              </Button>
            ))}
            {hiddenGroupCount > 0 && (
              <Button
                className="h-7 rounded-full px-2.5 text-xs"
                onClick={() => store.setCalendarUi({ cloudExpanded: true })}
                size="sm"
                type="button"
                variant="outline"
              >
                +{format.number(hiddenGroupCount)}
              </Button>
            )}
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-auto p-4" data-demo-id="calendar-scroll-area">
          <div
            className="grid min-h-full grid-cols-7 gap-2"
            data-demo-id="calendar-month-grid"
            data-month={monthIndex + 1}
            data-year={year}
            style={{ gridTemplateRows: `repeat(${rowCount}, minmax(76px, 1fr))` }}
          >
            {monthDays.map((day) => (
              <CalendarDayCell
                calendarDay={day}
                isToday={day.date === todayDate}
                key={day.key}
                onOpen={(calendarDay) => setDialogDayKey(calendarDay.key)}
              />
            ))}
          </div>
        </div>
      </section>

      <Dialog onOpenChange={(open) => !open && setDialogDayKey(null)} open={dialogDay !== null}>
        <DialogContent className="flex h-[min(760px,90dvh)] max-w-4xl flex-col">
          <DialogHeader>
            <DialogTitle>
              {dialogDay
                ? format.dateTime(new Date(`${dialogDay.date}T00:00:00Z`), {
                    dateStyle: "long",
                    timeZone: "UTC",
                  })
                : ""}
            </DialogTitle>
          </DialogHeader>
          <DialogBody
            className={cn(
              "grid min-h-0 flex-1 gap-4 overflow-auto",
              dialogDay &&
                dialogDay.birthdayEmployees.length > 0 &&
                dialogDay.events.length > 0 &&
                "md:grid-cols-2",
            )}
            data-demo-id="calendar-day-dialog-body"
          >
            {dialogDay && dialogDay.birthdayEmployees.length > 0 && (
              <section
                className="flex min-h-0 flex-col gap-2"
                data-demo-id="calendar-birthdays-section"
              >
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <HiOutlineUserGroup />
                  {t("Birthdays")}
                </h3>
                <EmployeeCardList
                  actions={(employee) => (
                    <EmployeeCardActions
                      employee={employee}
                      onApplyTags={store.updateEmployeeTags}
                      onDelete={setDeletingEmployee}
                      onEdit={setEditingEmployee}
                      tagOptions={store.units?.indexes.tagOptions ?? []}
                      tagPickerDataDemoId="calendar-employee-tag-picker"
                    />
                  )}
                  className="min-h-48 flex-1 p-0"
                  dataDemoId="calendar-birthday-list"
                  employees={dialogDay.birthdayEmployees}
                  onUnitContextClick={(context) => store.selectUnitFromEmployeeCard(context.unitId)}
                  resetKey={`calendar:${dialogDay.key}:birthdays`}
                  unitContextsByEmployeeId={store.employeeUnitContextsByEmployeeId}
                />
              </section>
            )}
            {dialogDay && dialogDay.events.length > 0 && (
              <section
                className="grid content-start gap-2"
                data-demo-id="calendar-dated-tags-section"
              >
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <HiOutlineTag />
                  {t("Dated tags")}
                </h3>
                {dialogDay.events.map((event) => (
                  <button
                    className="flex items-center gap-3 rounded-md bg-muted/35 p-2 text-left outline-none transition-colors hover:bg-accent/65 active:bg-accent-strong/70 focus-visible:ring-2 focus-visible:ring-ring/40"
                    key={`${event.employee.id}:${event.label}`}
                    onClick={() =>
                      setDialogTag(
                        datedTagGroups.find(
                          (group) =>
                            group.normalizedLabel === event.label.toLocaleLowerCase("en-US"),
                        ) ?? null,
                      )
                    }
                    type="button"
                  >
                    <EmployeeAvatar className="size-8" employee={event.employee} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{event.label}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {event.employee.fullName}
                      </div>
                    </div>
                  </button>
                ))}
              </section>
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
                ? t(
                    "Employee {name} will be removed from the global catalog and Main. Custom Views will keep a local copy.",
                    { name: deletingEmployee.fullName },
                  )
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

      <Dialog onOpenChange={(open) => !open && setDialogTag(null)} open={dialogTag !== null}>
        <DialogContent className="flex h-[min(760px,90dvh)] max-w-2xl flex-col">
          <DialogHeader>
            <DialogTitle>{dialogTag?.label ?? ""}</DialogTitle>
            <DialogDescription>
              {dialogTag ? countText("datedTagEvents", { count: dialogTag.events.length }) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogBody
            className={cn(
              "grid min-h-0 flex-1 gap-4 overflow-hidden",
              pastEvents.length > 0 && "grid-rows-[minmax(0,1fr)_minmax(0,1fr)]",
            )}
            data-demo-id="calendar-tag-dialog-body"
          >
            <section
              className="flex min-h-0 flex-col gap-2"
              data-demo-id="calendar-upcoming-events-section"
            >
              <h3 className="text-sm font-semibold">{t("Current and upcoming")}</h3>
              {upcomingEvents.length > 0 ? (
                <TagEventSection events={upcomingEvents} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("No current or upcoming events")}
                </p>
              )}
            </section>
            {pastEvents.length > 0 && (
              <section
                className="flex min-h-0 flex-col gap-2"
                data-demo-id="calendar-past-events-section"
              >
                <h3 className="text-sm font-semibold">{t("Past")}</h3>
                <TagEventSection events={pastEvents} />
              </section>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
});
