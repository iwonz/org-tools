"use client";

import type {
  CustomEmployeeFieldValue,
  EditableEmployeeFields,
  Employee,
  EmployeeId,
  OrgEditorUnit,
  OrgEditorUnitId,
  UiOrgStructure,
  UnitAssignment,
  UnitId,
} from "@org-tools/types";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import {
  HiOutlineArrowsPointingOut,
  HiOutlineArrowUpTray,
  HiOutlineBriefcase,
  HiOutlineBuildingOffice2,
  HiOutlineChevronDown,
  HiOutlineClipboard,
  HiOutlineTag,
  HiOutlineTrash,
  HiOutlineUserCircle,
} from "react-icons/hi2";
import { AvatarCropDialog } from "@/components/avatar-crop-dialog";
import { EmployeeTagDateText } from "@/components/employee-tag-date-popover";
import { EmployeeTagPickerPanel } from "@/components/employee-tag-picker";
import { MultiTagSelect, type MultiTagSelectOption } from "@/components/multi-tag-select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { describeError, type UiMessageDescriptor, uiMessage } from "@/i18n/messages";
import { useAppFormatter, useMessageText, useUiText } from "@/i18n/use-ui-text";
import {
  avatarDataUrlToBlob,
  type PreparedAvatarSource,
  prepareAvatarSource,
  readClipboardAvatarBlob,
  releaseAvatarSource,
} from "@/lib/avatar-image";
import {
  createEmployeeBirthday,
  getBirthdayDaysInMonth,
  parseEmployeeBirthday,
  UNKNOWN_BIRTH_YEAR,
} from "@/lib/birthday";
import { normalizeEmployeeTags, sortEmployeeTagLabels } from "@/lib/employee-tags";
import { cn } from "@/lib/utils";
import { useOrgStore } from "@/stores/org-store-context";

export type EditorEmployeeAssignment = {
  isBoss: boolean;
  position: string | null;
  unitId: OrgEditorUnitId;
};

type CommonProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  tagOptions: string[];
};

type GlobalEmployeeDialogProps = CommonProps & {
  employee?: Employee | null;
  mode: "global";
  onSave: (fields: EditableEmployeeFields, unitMemberships: UnitAssignment[]) => void;
  units: UiOrgStructure;
};

type EditorEmployeeDialogProps = CommonProps & {
  employee?: Employee | null;
  initialUnitIds?: OrgEditorUnitId[];
  mode: "editor";
  onSave: (fields: EditableEmployeeFields, assignments: EditorEmployeeAssignment[]) => void;
  units: OrgEditorUnit[];
};

type EmployeeDialogProps = EditorEmployeeDialogProps | GlobalEmployeeDialogProps;
const EMPTY_EDITOR_UNITS: OrgEditorUnit[] = [];
const EMPTY_EDITOR_UNIT_IDS: OrgEditorUnitId[] = [];
type AssignableUnitId = UnitId | OrgEditorUnitId;

const getInitialFields = (employee: Employee | null | undefined): EditableEmployeeFields => ({
  birthday: employee?.birthday ?? null,
  avatarBase64Url: employee?.avatarBase64Url ?? null,
  customFieldValues: { ...(employee?.customFieldValues ?? {}) },
  email: employee?.email ?? null,
  firstName: employee?.firstName ?? "",
  gender: employee?.gender ?? "unspecified",
  lastName: employee?.lastName ?? "",
  phone: employee?.phone ?? null,
  profileUrl: employee?.profileUrl ?? null,
  tags: employee?.tags ?? [],
  username: employee?.username ?? null,
});

const Field = ({
  children,
  htmlFor,
  label,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  label: string;
}) => (
  <div className="grid gap-2">
    <Label {...(htmlFor ? { htmlFor } : {})}>{label}</Label>
    {children}
  </div>
);

export function EmployeeDialog(props: EmployeeDialogProps) {
  const store = useOrgStore();
  const t = useUiText();
  const format = useAppFormatter();
  const locale = useLocale();
  const { employee = null, mode, onOpenChange, open } = props;
  const [fields, setFields] = useState<EditableEmployeeFields>(() => getInitialFields(employee));
  const [birthdayDay, setBirthdayDay] = useState("none");
  const [birthdayMonth, setBirthdayMonth] = useState("none");
  const [birthdayYear, setBirthdayYear] = useState("none");
  const [selectedUnitIds, setSelectedUnitIds] = useState<AssignableUnitId[]>([]);
  const [bossUnitIds, setBossUnitIds] = useState<AssignableUnitId[]>([]);
  const [positionByUnitId, setPositionByUnitId] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<UiMessageDescriptor | null>(null);
  const [avatarError, setAvatarError] = useState<UiMessageDescriptor | null>(null);
  const [avatarSource, setAvatarSource] = useState<PreparedAvatarSource | null>(null);
  const [isPreparingAvatar, setIsPreparingAvatar] = useState(false);
  const messageText = useMessageText();
  const globalUnits = mode === "global" ? props.units : null;
  const editorUnits = mode === "editor" ? props.units : EMPTY_EDITOR_UNITS;
  const initialEditorUnitIds =
    mode === "editor" ? (props.initialUnitIds ?? EMPTY_EDITOR_UNIT_IDS) : EMPTY_EDITOR_UNIT_IDS;
  const unitOptions = useMemo<Array<MultiTagSelectOption<AssignableUnitId>>>(() => {
    if (globalUnits) {
      return globalUnits.deepUnits
        .filter((unit) => unit.membershipMode === "manual")
        .map((unit) => ({
          id: unit.id,
          label: unit.name,
          searchText: `${unit.name} ${unit.path.fullName}`,
          subtitle: unit.path.fullName,
        }));
    }

    return editorUnits
      .filter((unit) => unit.liveFilter === null)
      .map((unit) => ({ id: unit.id, label: unit.name }))
      .sort((firstOption, secondOption) =>
        new Intl.Collator(locale, { sensitivity: "base" }).compare(
          firstOption.label,
          secondOption.label,
        ),
      );
  }, [editorUnits, globalUnits, locale]);
  const unitOptionById = useMemo(
    () => new Map(unitOptions.map((option) => [option.id, option])),
    [unitOptions],
  );
  const employeeTagOptions = useMemo(() => {
    const tags = normalizeEmployeeTags([...props.tagOptions, ...fields.tags]);
    return sortEmployeeTagLabels(tags.map((tag) => tag.label));
  }, [fields.tags, props.tagOptions]);
  const birthdayYearOptions = useMemo(() => {
    const currentYear = new Date().getUTCFullYear();
    return Array.from(
      { length: currentYear - UNKNOWN_BIRTH_YEAR },
      (_, index) => currentYear - index,
    );
  }, []);

  useEffect(() => {
    if (!open) return;

    setFields(getInitialFields(employee));
    setFormError(null);
    setAvatarError(null);
    setAvatarSource(null);
    const birthday = parseEmployeeBirthday(employee?.birthday);
    setBirthdayDay(birthday ? String(birthday.day) : "none");
    setBirthdayMonth(birthday ? String(birthday.month) : "none");
    setBirthdayYear(birthday ? String(birthday.year) : "none");

    if (mode === "global") {
      const globalEmployee = props.employee;
      const memberships = globalEmployee?.unitPositions ?? [];
      setSelectedUnitIds(
        memberships
          .map((membership) => membership.unitId)
          .filter((unitId) => unitOptionById.has(unitId)),
      );
      setBossUnitIds(
        memberships
          .filter((membership) => membership.isBoss)
          .map((membership) => membership.unitId)
          .filter((unitId) => unitOptionById.has(unitId)),
      );
      setPositionByUnitId(
        Object.fromEntries(
          memberships.map((membership) => [String(membership.unitId), membership.position ?? ""]),
        ),
      );
      return;
    }

    const selectedIds = employee
      ? editorUnits.filter((unit) => unit.employeeIds.includes(employee.id)).map((unit) => unit.id)
      : initialEditorUnitIds;
    setSelectedUnitIds(selectedIds);
    setBossUnitIds(
      employee
        ? editorUnits.filter((unit) => unit.bossEmployeeId === employee.id).map((unit) => unit.id)
        : [],
    );
    setPositionByUnitId(
      employee
        ? Object.fromEntries(
            editorUnits.flatMap((unit) => {
              const employeePosition = unit.employeePositions.find(
                (position) => position.employeeId === employee.id,
              );

              return employeePosition ? [[String(unit.id), employeePosition.position ?? ""]] : [];
            }),
          )
        : {},
    );
  }, [editorUnits, employee, initialEditorUnitIds, mode, open, props.employee, unitOptionById]);

  useEffect(() => () => releaseAvatarSource(avatarSource), [avatarSource]);

  const beginAvatarCrop = async (blob: Blob) => {
    setIsPreparingAvatar(true);
    setAvatarError(null);
    try {
      setAvatarSource(await prepareAvatarSource(blob));
    } catch (error) {
      setAvatarError(describeError(error));
    } finally {
      setIsPreparingAvatar(false);
    }
  };

  const pasteAvatar = async () => {
    setAvatarError(null);
    try {
      await beginAvatarCrop(await readClipboardAvatarBlob());
    } catch (error) {
      setAvatarError(describeError(error));
    }
  };

  const toggleBoss = (unitId: AssignableUnitId) => {
    setBossUnitIds((currentUnitIds) =>
      currentUnitIds.includes(unitId)
        ? currentUnitIds.filter((currentUnitId) => currentUnitId !== unitId)
        : [...currentUnitIds, unitId],
    );
  };
  const updateTextField = (
    field: "email" | "firstName" | "lastName" | "phone" | "profileUrl" | "username",
    value: string,
  ) => {
    setFields((currentFields) => ({
      ...currentFields,
      [field]: value,
    }));
  };
  const updateUnitPosition = (unitId: AssignableUnitId, value: string) => {
    setPositionByUnitId((currentPositions) => ({
      ...currentPositions,
      [String(unitId)]: value,
    }));
  };
  const updateCustomField = (fieldId: string, value: CustomEmployeeFieldValue | undefined) => {
    setFields((currentFields) => {
      const customFieldValues = { ...(currentFields.customFieldValues ?? {}) };
      if (value === undefined || value === null || value === "") delete customFieldValues[fieldId];
      else customFieldValues[fieldId] = value;
      return { ...currentFields, customFieldValues };
    });
  };
  const updateBirthdayMonth = (value: string) => {
    setBirthdayMonth(value);
    if (birthdayDay === "none" || value === "none") return;
    const year = birthdayYear === "none" ? UNKNOWN_BIRTH_YEAR : Number(birthdayYear);
    if (Number(birthdayDay) > getBirthdayDaysInMonth(Number(value), year)) {
      setBirthdayDay("none");
    }
  };
  const updateBirthdayYear = (value: string) => {
    setBirthdayYear(value);
    if (birthdayDay === "none" || birthdayMonth === "none" || value === "none") return;
    if (Number(birthdayDay) > getBirthdayDaysInMonth(Number(birthdayMonth), Number(value))) {
      setBirthdayDay("none");
    }
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selectedBirthdayPartCount = [birthdayDay, birthdayMonth, birthdayYear].filter(
      (value) => value !== "none",
    ).length;
    if (selectedBirthdayPartCount > 0 && selectedBirthdayPartCount < 3) {
      setFormError(uiMessage("Choose the birthday day, month, and year."));
      return;
    }
    const birthday =
      selectedBirthdayPartCount === 3
        ? createEmployeeBirthday(Number(birthdayDay), Number(birthdayMonth), Number(birthdayYear))
        : null;
    const nextFields: EditableEmployeeFields = {
      ...fields,
      avatarBase64Url: fields.avatarBase64Url?.trim() || null,
      birthday,
      email: fields.email?.trim() || null,
      firstName: fields.firstName.trim(),
      lastName: fields.lastName.trim(),
      phone: fields.phone?.trim() || null,
      profileUrl: fields.profileUrl?.trim() || null,
      username: fields.username?.trim() || null,
    };

    if (
      !nextFields.firstName &&
      !nextFields.lastName &&
      !nextFields.username &&
      !nextFields.email
    ) {
      setFormError(uiMessage("Provide a name, username, or email."));
      return;
    }

    setFormError(null);
    try {
      if (mode === "global") {
        props.onSave(
          nextFields,
          selectedUnitIds.map((unitId) => ({
            isBoss: bossUnitIds.includes(unitId),
            position: positionByUnitId[String(unitId)]?.trim() || null,
            unitId: unitId as UnitId,
          })),
        );
      } else {
        props.onSave(
          nextFields,
          selectedUnitIds.map((unitId) => ({
            isBoss: bossUnitIds.includes(unitId),
            position: positionByUnitId[String(unitId)]?.trim() || null,
            unitId: unitId as OrgEditorUnitId,
          })),
        );
      }

      onOpenChange(false);
    } catch (error) {
      setFormError(describeError(error));
    }
  };
  const editorTargetMissing = mode === "editor" && selectedUnitIds.length === 0;
  const title = employee ? t("Edit Employee") : t("Create Employee");

  return (
    <>
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent
          className="flex max-h-[calc(100dvh-32px)] max-w-3xl flex-col overflow-hidden p-0"
          data-demo-id="employee-dialog"
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <form
            className="flex min-h-0 flex-1 flex-col"
            onPaste={(event) => {
              const imageFile = Array.from(event.clipboardData.files).find((file) =>
                file.type.startsWith("image/"),
              );
              if (!imageFile) return;
              event.preventDefault();
              void beginAvatarCrop(imageFile);
            }}
            onSubmit={submit}
          >
            <DialogBody className="flex-1 space-y-6 overflow-y-auto">
              <section className="grid gap-4 sm:grid-cols-2">
                <Field htmlFor="employee-first-name" label={t("First name")}>
                  <Input
                    autoFocus
                    id="employee-first-name"
                    onChange={(event) => updateTextField("firstName", event.currentTarget.value)}
                    value={fields.firstName}
                  />
                </Field>
                <Field htmlFor="employee-last-name" label={t("Last name")}>
                  <Input
                    id="employee-last-name"
                    onChange={(event) => updateTextField("lastName", event.currentTarget.value)}
                    value={fields.lastName}
                  />
                </Field>
                <Field htmlFor="employee-username" label={t("Username")}>
                  <Input
                    id="employee-username"
                    onChange={(event) => updateTextField("username", event.currentTarget.value)}
                    value={fields.username ?? ""}
                  />
                </Field>
                <Field htmlFor="employee-email" label={t("Email")}>
                  <Input
                    id="employee-email"
                    onChange={(event) => updateTextField("email", event.currentTarget.value)}
                    type="email"
                    value={fields.email ?? ""}
                  />
                </Field>
                <Field htmlFor="employee-phone" label={t("Phone")}>
                  <Input
                    id="employee-phone"
                    onChange={(event) => updateTextField("phone", event.currentTarget.value)}
                    type="tel"
                    value={fields.phone ?? ""}
                  />
                </Field>
                <Field htmlFor="employee-profile-url" label={t("Profile URL")}>
                  <Input
                    id="employee-profile-url"
                    onChange={(event) => updateTextField("profileUrl", event.currentTarget.value)}
                    placeholder="https://example.test/profile"
                    type="url"
                    value={fields.profileUrl ?? ""}
                  />
                </Field>
                <Field label={t("Birthday")}>
                  <div className="grid grid-cols-3 overflow-hidden rounded-md border border-input bg-background focus-within:border-signal/55 focus-within:ring-2 focus-within:ring-ring/20">
                    <Select onValueChange={setBirthdayDay} value={birthdayDay}>
                      <SelectTrigger
                        aria-label={t("Day")}
                        className="rounded-none border-0 bg-transparent shadow-none focus-visible:border-0 focus-visible:ring-0"
                        data-demo-id="employee-birthday-day"
                      >
                        <SelectValue placeholder={t("Day")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("Day")}</SelectItem>
                        {Array.from(
                          {
                            length:
                              birthdayMonth === "none"
                                ? 31
                                : getBirthdayDaysInMonth(
                                    Number(birthdayMonth),
                                    birthdayYear === "none"
                                      ? UNKNOWN_BIRTH_YEAR
                                      : Number(birthdayYear),
                                  ),
                          },
                          (_, index) => index + 1,
                        ).map((day) => (
                          <SelectItem key={day} value={String(day)}>
                            {String(day).padStart(2, "0")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select onValueChange={updateBirthdayMonth} value={birthdayMonth}>
                      <SelectTrigger
                        aria-label={t("Month")}
                        className="rounded-none border-0 border-l border-input bg-transparent shadow-none focus-visible:border-l focus-visible:ring-0"
                        data-demo-id="employee-birthday-month"
                      >
                        <SelectValue placeholder={t("Month")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("Month")}</SelectItem>
                        {Array.from({ length: 12 }, (_, index) => index).map((monthIndex) => (
                          <SelectItem key={monthIndex} value={String(monthIndex + 1)}>
                            {format.dateTime(new Date(Date.UTC(2000, monthIndex, 1)), {
                              month: "long",
                              timeZone: "UTC",
                            })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select onValueChange={updateBirthdayYear} value={birthdayYear}>
                      <SelectTrigger
                        aria-label={t("Year")}
                        className="rounded-none border-0 border-l border-input bg-transparent shadow-none focus-visible:border-l focus-visible:ring-0"
                        data-demo-id="employee-birthday-year"
                      >
                        <SelectValue placeholder={t("Year")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("Year")}</SelectItem>
                        <SelectItem value={String(UNKNOWN_BIRTH_YEAR)}>
                          {t("Unknown year")}
                        </SelectItem>
                        {birthdayYearOptions.map((year) => (
                          <SelectItem key={year} value={String(year)}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </Field>
                <Field label={t("Gender")}>
                  <fieldset
                    aria-label={t("Gender")}
                    className="grid grid-cols-3 overflow-hidden rounded-md border border-input bg-background focus-within:border-signal/55 focus-within:ring-2 focus-within:ring-ring/20"
                    data-demo-id="employee-gender"
                  >
                    {(
                      [
                        ["male", t("Male")],
                        ["female", t("Female")],
                        ["unspecified", t("Not specified")],
                      ] as const
                    ).map(([gender, label], index) => (
                      <label
                        className={cn(
                          "cursor-pointer px-2 py-2.5 text-center text-sm transition-colors",
                          index > 0 && "border-l border-input",
                          fields.gender === gender
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent/45",
                        )}
                        key={gender}
                      >
                        <input
                          checked={fields.gender === gender}
                          className="sr-only"
                          name="employee-gender"
                          onChange={() =>
                            setFields((currentFields) => ({ ...currentFields, gender }))
                          }
                          type="radio"
                          value={gender}
                        />
                        {label}
                      </label>
                    ))}
                  </fieldset>
                </Field>
              </section>

              {store.employeeFieldDefinitions.some((definition) => definition.kind === "value") && (
                <section
                  className="grid gap-4 sm:grid-cols-2"
                  data-demo-id="employee-custom-fields"
                >
                  {store.employeeFieldDefinitions.flatMap((definition) => {
                    if (definition.kind !== "value") return [];
                    const value = fields.customFieldValues?.[definition.id];
                    const label = `${definition.name}${definition.required ? " *" : ""}`;
                    if (definition.valueType === "boolean") {
                      return [
                        <div
                          className="flex items-center justify-between gap-3 rounded-md bg-muted/30 px-3 py-2 text-sm"
                          key={definition.id}
                        >
                          <span>{label}</span>
                          <Checkbox
                            aria-label={label}
                            checked={value === true}
                            onCheckedChange={(checked) =>
                              updateCustomField(definition.id, checked === true)
                            }
                          />
                        </div>,
                      ];
                    }
                    if (definition.valueType === "option") {
                      return [
                        <Field key={definition.id} label={label}>
                          <Select
                            onValueChange={(next) =>
                              updateCustomField(
                                definition.id,
                                next === "__none__" ? undefined : next,
                              )
                            }
                            value={typeof value === "string" ? value : "__none__"}
                          >
                            <SelectTrigger aria-label={label}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">{t("Not specified")}</SelectItem>
                              {definition.options.map((option) => (
                                <SelectItem key={option.id} value={option.id}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>,
                      ];
                    }
                    return [
                      <Field key={definition.id} label={label}>
                        <Input
                          aria-label={label}
                          inputMode={definition.valueType === "number" ? "decimal" : undefined}
                          onChange={(event) =>
                            updateCustomField(
                              definition.id,
                              definition.valueType === "number"
                                ? event.currentTarget.value === ""
                                  ? undefined
                                  : Number(event.currentTarget.value)
                                : event.currentTarget.value,
                            )
                          }
                          placeholder={definition.valueType === "date" ? "DD.MM.YYYY" : undefined}
                          type={definition.valueType === "number" ? "number" : "text"}
                          value={value === undefined || value === null ? "" : String(value)}
                        />
                      </Field>,
                    ];
                  })}
                </section>
              )}

              <section className="grid gap-3">
                <Label>{t("Avatar")}</Label>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted text-muted-foreground">
                    {fields.avatarBase64Url ? (
                      // biome-ignore lint/performance/noImgElement: The preview is an embedded local draft and must not use the Next image pipeline.
                      <img
                        alt=""
                        className="size-full object-cover"
                        data-demo-id="employee-avatar-preview"
                        src={fields.avatarBase64Url}
                      />
                    ) : (
                      <HiOutlineUserCircle className="size-12" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                    <Label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-secondary/70 px-4 text-sm font-medium transition-colors hover:bg-accent focus-within:ring-2 focus-within:ring-ring/45">
                      <HiOutlineArrowUpTray className="size-4" />
                      {t("Choose file")}
                      <Input
                        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                        className="sr-only"
                        data-demo-id="employee-avatar-file"
                        disabled={isPreparingAvatar}
                        onChange={(event) => {
                          const file = event.currentTarget.files?.[0];
                          event.currentTarget.value = "";
                          if (file) void beginAvatarCrop(file);
                        }}
                        type="file"
                      />
                    </Label>
                    <Button
                      disabled={isPreparingAvatar}
                      onClick={() => void pasteAvatar()}
                      type="button"
                      variant="outline"
                    >
                      <HiOutlineClipboard />
                      {t("Paste image")}
                    </Button>
                    {fields.avatarBase64Url && (
                      <>
                        <Button
                          disabled={isPreparingAvatar}
                          onClick={() =>
                            void beginAvatarCrop(avatarDataUrlToBlob(fields.avatarBase64Url ?? ""))
                          }
                          type="button"
                          variant="outline"
                        >
                          <HiOutlineArrowsPointingOut />
                          {t("Adjust crop")}
                        </Button>
                        <Button
                          onClick={() =>
                            setFields((currentFields) => ({
                              ...currentFields,
                              avatarBase64Url: null,
                            }))
                          }
                          type="button"
                          variant="ghost"
                        >
                          <HiOutlineTrash />
                          {t("Remove avatar")}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {isPreparingAvatar && (
                  <p className="text-sm text-muted-foreground">{t("Preparing image…")}</p>
                )}
                {avatarError && (
                  <p className="text-sm text-destructive" role="alert">
                    {messageText(avatarError)}
                  </p>
                )}
              </section>

              <section className="grid gap-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <HiOutlineTag className="size-4" />
                  {t("Tags")}
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      aria-label={t("Select Employee tags")}
                      className="flex min-h-10 w-full cursor-pointer flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 text-start text-sm outline-none transition-colors hover:bg-accent/20 focus-visible:border-signal/55 focus-visible:ring-2 focus-visible:ring-ring/20"
                      data-demo-id="employee-draft-tag-picker-trigger"
                      type="button"
                    >
                      {fields.tags.length === 0 ? (
                        <span className="min-w-0 flex-1 text-muted-foreground">
                          {t("Select or create tags")}
                        </span>
                      ) : (
                        fields.tags.map((tag) => (
                          <span
                            className="max-w-full break-words whitespace-normal rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                            key={tag.label.toLocaleLowerCase("en-US")}
                          >
                            <EmployeeTagDateText date={tag.date} label={tag.label} />
                          </span>
                        ))
                      )}
                      <HiOutlineChevronDown className="ms-auto size-4 shrink-0 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="p-0" sideOffset={6}>
                    <EmployeeTagPickerPanel
                      dataDemoId="employee-draft-tag-picker"
                      employees={[{ id: "draft-employee" as EmployeeId, tags: fields.tags }]}
                      footer={false}
                      onApply={(updates) => {
                        const update = updates[0];
                        if (!update) return;
                        setFields((currentFields) => ({ ...currentFields, tags: update.tags }));
                      }}
                      tagOptions={employeeTagOptions}
                    />
                  </PopoverContent>
                </Popover>
              </section>

              {(mode === "editor" || unitOptions.length > 0) && (
                <section className="grid gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <HiOutlineBuildingOffice2 className="size-4" />
                    {t("Units")}
                  </div>
                  <MultiTagSelect
                    ariaLabel={t("Select Units")}
                    emptyState={t("No Units found")}
                    onChange={setSelectedUnitIds}
                    options={unitOptions}
                    placeholder={t("Select Units")}
                    selectedIds={selectedUnitIds}
                  />
                  {selectedUnitIds.length > 0 && (
                    <div className="grid gap-2">
                      {selectedUnitIds.map((unitId) => {
                        const option = unitOptionById.get(unitId);
                        if (!option) return null;

                        return (
                          <div className="grid gap-3 rounded-md border p-3" key={String(unitId)}>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium">{option.label}</div>
                              {option.subtitle && (
                                <div className="mt-0.5 truncate text-xs text-muted-foreground">
                                  {option.subtitle}
                                </div>
                              )}
                            </div>
                            <div className="relative">
                              <HiOutlineBriefcase className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                aria-label={t("Position in Unit {name}", { name: option.label })}
                                className="ps-9"
                                onChange={(event) =>
                                  updateUnitPosition(unitId, event.currentTarget.value)
                                }
                                placeholder={t("Position")}
                                value={positionByUnitId[String(unitId)] ?? ""}
                              />
                            </div>
                            <label
                              className="flex cursor-pointer items-center gap-2 text-sm"
                              htmlFor={`employee-boss-${String(unitId)}`}
                            >
                              <Checkbox
                                checked={bossUnitIds.includes(unitId)}
                                id={`employee-boss-${String(unitId)}`}
                                onCheckedChange={() => toggleBoss(unitId)}
                              />
                              {t("Boss")}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {editorTargetMissing && (
                    <div className="text-sm text-destructive">{t("Select at least one Unit.")}</div>
                  )}
                </section>
              )}
              {formError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  {messageText(formError)}
                </div>
              )}
            </DialogBody>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
                {t("Cancel")}
              </Button>
              <Button
                data-demo-id="employee-dialog-submit"
                disabled={editorTargetMissing}
                type="submit"
              >
                {employee ? t("Save") : t("Create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AvatarCropDialog
        onApply={(avatarBase64Url) =>
          setFields((currentFields) => ({ ...currentFields, avatarBase64Url }))
        }
        onOpenChange={(cropOpen) => {
          if (!cropOpen) setAvatarSource(null);
        }}
        source={avatarSource}
      />
    </>
  );
}
