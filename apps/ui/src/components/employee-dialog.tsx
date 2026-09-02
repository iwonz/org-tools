"use client";

import type {
  EditableEmployeeFields,
  Employee,
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
  HiOutlineClipboard,
  HiOutlineTag,
  HiOutlineTrash,
  HiOutlineUserCircle,
} from "react-icons/hi2";
import { AvatarCropDialog } from "@/components/avatar-crop-dialog";
import {
  EmployeeTagDatePopover,
  EmployeeTagDateText,
} from "@/components/employee-tag-date-popover";
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
import { createBirthdayKey, parseBirthdayMonthDay } from "@/lib/birthday";
import { findEmployeeTag, normalizeEmployeeTags, sortEmployeeTags } from "@/lib/employee-tags";

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
  const t = useUiText();
  const format = useAppFormatter();
  const locale = useLocale();
  const { employee = null, mode, onOpenChange, open } = props;
  const [fields, setFields] = useState<EditableEmployeeFields>(() => getInitialFields(employee));
  const [birthdayDay, setBirthdayDay] = useState("none");
  const [birthdayMonth, setBirthdayMonth] = useState("none");
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
  const employeeTagOptions = useMemo<Array<MultiTagSelectOption<string>>>(() => {
    const tags = normalizeEmployeeTags([...props.tagOptions, ...fields.tags]);

    return sortEmployeeTags(tags).map((tag) => ({ id: tag.label, label: tag.label }));
  }, [fields.tags, props.tagOptions]);

  useEffect(() => {
    if (!open) return;

    setFields(getInitialFields(employee));
    setFormError(null);
    setAvatarError(null);
    setAvatarSource(null);
    const birthday = parseBirthdayMonthDay(employee?.birthday);
    setBirthdayDay(birthday ? String(birthday.day) : "none");
    setBirthdayMonth(birthday ? String(birthday.month) : "none");

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

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const birthday =
      birthdayDay !== "none" && birthdayMonth !== "none"
        ? createBirthdayKey(Number(birthdayDay), Number(birthdayMonth))
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
                  <div className="grid grid-cols-2 gap-2">
                    <Select onValueChange={setBirthdayDay} value={birthdayDay}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("Day")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("Day")}</SelectItem>
                        {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
                          <SelectItem key={day} value={String(day)}>
                            {String(day).padStart(2, "0")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select onValueChange={setBirthdayMonth} value={birthdayMonth}>
                      <SelectTrigger>
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
                  </div>
                </Field>
                <Field htmlFor="employee-gender" label={t("Gender")}>
                  <Select
                    onValueChange={(gender) =>
                      setFields((currentFields) => ({
                        ...currentFields,
                        gender: gender as EditableEmployeeFields["gender"],
                      }))
                    }
                    value={fields.gender}
                  >
                    <SelectTrigger data-demo-id="employee-gender" id="employee-gender">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">{t("Male")}</SelectItem>
                      <SelectItem value="female">{t("Female")}</SelectItem>
                      <SelectItem value="unspecified">{t("Not specified")}</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </section>

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
                <MultiTagSelect
                  ariaLabel={t("Select Employee tags")}
                  emptyState={t("No tags found")}
                  onChange={(labels) =>
                    setFields((currentFields) => ({
                      ...currentFields,
                      tags: normalizeEmployeeTags(
                        labels.map(
                          (label) =>
                            findEmployeeTag(currentFields.tags, label) ?? { date: null, label },
                        ),
                      ),
                    }))
                  }
                  onCreateOption={(tag) =>
                    setFields((currentFields) => ({
                      ...currentFields,
                      tags: normalizeEmployeeTags([
                        ...currentFields.tags,
                        { date: null, label: tag },
                      ]),
                    }))
                  }
                  options={employeeTagOptions}
                  placeholder={t("Select or create tags")}
                  selectedIds={fields.tags.map(({ label }) => label)}
                />
                {fields.tags.length > 0 && (
                  <div className="grid gap-2">
                    {sortEmployeeTags(fields.tags).map((tag) => (
                      <div
                        className="flex items-center gap-2 rounded-md border px-3 py-2"
                        key={tag.label.toLocaleLowerCase("en-US")}
                      >
                        <span className="min-w-0 flex-1 text-sm font-medium">
                          <EmployeeTagDateText date={tag.date} label={tag.label} />
                        </span>
                        <EmployeeTagDatePopover
                          date={tag.date}
                          label={tag.label}
                          onChange={(date) =>
                            setFields((currentFields) => ({
                              ...currentFields,
                              tags: currentFields.tags.map((currentTag) =>
                                currentTag.label.toLocaleLowerCase("en-US") ===
                                tag.label.toLocaleLowerCase("en-US")
                                  ? { ...currentTag, date }
                                  : currentTag,
                              ),
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {(mode === "editor" || unitOptions.length > 0) && (
                <section className="grid gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <HiOutlineBuildingOffice2 className="size-4" />
                    {mode === "global" ? t("Units") : t("Org Editor Units")}
                  </div>
                  <MultiTagSelect
                    ariaLabel={mode === "global" ? t("Select Units") : t("Select canvas Units")}
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
                              <HiOutlineBriefcase className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                aria-label={t("Position in Unit {name}", { name: option.label })}
                                className="pl-9"
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
                    <div className="text-sm text-destructive">
                      {t("Select at least one Org Editor Unit.")}
                    </div>
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
