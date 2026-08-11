"use client";

import type { OrgToolsStateContent } from "@org-tools/types";
import { useVirtualizer } from "@tanstack/react-virtual";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  HiOutlineArrowUpTray,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlinePlusCircle,
} from "react-icons/hi2";

import { StructuredImportPreview } from "@/components/structured-import-preview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
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
import { describeError, type UiMessageDescriptor } from "@/i18n/messages";
import {
  type UiTextKey,
  useAppFormatter,
  useCountText,
  useMessageText,
  useRuntimeUiText,
  useUiText,
} from "@/i18n/use-ui-text";
import {
  EMPLOYEE_IMPORT_TARGET_DEFINITIONS,
  EMPLOYEE_IMPORT_TARGETS,
  type EmployeeImportPlan,
  type EmployeeImportPlanRow,
  type EmployeeImportTarget,
  type ExistingEmployeeIdentity,
  type ImportedEmployeeDraft,
} from "@/lib/employee-import";
import {
  type GenericImportTarget,
  TEAM_IMPORT_TARGET_DEFINITIONS,
  TEAM_IMPORT_TARGETS,
  type TeamImportTarget,
} from "@/lib/generic-import";
import type { MappedImportDocument, StateImportOperation } from "@/lib/structured-import";
import { cn } from "@/lib/utils";
import {
  type EmployeeImportCommitSummary,
  ImportSessionStore,
  type StateImportCandidate,
} from "@/stores/import-session-store";

const UNMAPPED_SELECT_VALUE = "unmapped";

export type ImportDialogProps = {
  existingEmployees: readonly ExistingEmployeeIdentity[];
  initialFile: File | null;
  onCommitEmployees: (
    drafts: readonly ImportedEmployeeDraft[],
    summary: EmployeeImportCommitSummary,
  ) => void;
  onCommitMapped: (document: MappedImportDocument) => void;
  onCommitState: (
    candidate: StateImportCandidate,
    content: OrgToolsStateContent,
    operation: StateImportOperation,
  ) => void;
  onOpenChange: (open: boolean) => void;
  onValidateState: (
    candidate: StateImportCandidate,
    content: OrgToolsStateContent,
    operation: StateImportOperation,
  ) => void;
  onValidateMapped: (document: MappedImportDocument) => void;
  open: boolean;
};

const STATE_CONTENT_LABELS: Record<OrgToolsStateContent, UiTextKey> = {
  employees: "Employees",
  teams: "Teams",
  teamsEmployees: "Teams + Employees",
  workspace: "Full workspace",
};

const GENERIC_TARGET_LABELS: Record<GenericImportTarget, UiTextKey> = {
  employees: "Employees",
  teams: "Teams",
  teamsEmployees: "Teams + Employees",
};

const STATUS_LABELS: Record<EmployeeImportPlanRow["status"], UiTextKey> = {
  conflict: "Conflict",
  duplicate: "Existing",
  empty: "Empty",
  invalid: "Invalid",
  new: "New",
};

const STATUS_CLASSES: Record<EmployeeImportPlanRow["status"], string> = {
  conflict: "bg-destructive/10 text-destructive",
  duplicate: "bg-muted text-muted-foreground",
  empty: "bg-muted text-muted-foreground",
  invalid: "bg-destructive/10 text-destructive",
  new: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

const formatFileSize = (
  size: number | null,
  formatNumber: ReturnType<typeof useAppFormatter>["number"],
) => {
  if (size === null) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${formatNumber(Math.ceil(size / 1024))} KiB`;
  return `${formatNumber(size / 1024 / 1024, { maximumFractionDigits: 1 })} MiB`;
};

const getPreviewTitle = (row: EmployeeImportPlanRow, t: ReturnType<typeof useUiText>) => {
  if (row.draft === null) return t("Source row {number}", { number: row.rowNumber });
  return (
    `${row.draft.firstName} ${row.draft.lastName}`.trim() ||
    row.draft.username ||
    row.draft.email ||
    t("Source row {number}", { number: row.rowNumber })
  );
};

const getPreviewDetails = (row: EmployeeImportPlanRow, t: ReturnType<typeof useUiText>) => {
  if (row.draft === null) return [];
  return [
    row.draft.username,
    row.draft.email,
    row.draft.phone,
    row.draft.profileUrl,
    row.draft.birthday,
    row.draft.tags.length > 0 ? row.draft.tags.map(({ label }) => label).join(", ") : null,
    row.draft.avatarBase64Url ? t("Embedded avatar") : null,
  ].filter((value): value is string => Boolean(value));
};

function ImportPreview({ plan }: { plan: EmployeeImportPlan }) {
  const t = useUiText();
  const runtimeText = useRuntimeUiText();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const virtualizer = useVirtualizer({
    count: plan.rows.length,
    estimateSize: (index) => (plan.rows[index]?.errors.length ? 94 : 66),
    getItemKey: (index) => plan.rows[index]?.rowNumber ?? index,
    getScrollElement: () => scrollRef.current,
    overscan: 8,
  });

  if (plan.rows.length === 0) {
    return (
      <div className="grid h-36 place-items-center rounded-md border border-dashed text-sm text-muted-foreground">
        {t("The selected collection is empty.")}
      </div>
    );
  }

  return (
    <div className="h-64 overflow-auto rounded-md border" ref={scrollRef}>
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = plan.rows[virtualRow.index];
          if (!row) return null;
          const details = getPreviewDetails(row, t);

          return (
            <div
              className="absolute left-0 top-0 w-full px-3 py-2"
              data-demo-id="ordinary-import-preview-row"
              data-index={virtualRow.index}
              key={virtualRow.key}
              ref={virtualizer.measureElement}
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {row.draft === null
                      ? t("Source row {number}", { number: row.rowNumber })
                      : getPreviewTitle(row, t)}
                  </div>
                  {details.length > 0 && (
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      {details.join(" · ")}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {t("Row {number}", { number: row.rowNumber })}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      STATUS_CLASSES[row.status],
                    )}
                  >
                    {t(STATUS_LABELS[row.status])}
                  </span>
                </div>
              </div>
              {row.errors.length > 0 && (
                <div className="mt-1 text-xs text-destructive">
                  {row.errors.map(runtimeText).join(" ")}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const MappingSelect = observer(
  ({ session, target }: { session: ImportSessionStore; target: EmployeeImportTarget }) => {
    const t = useUiText();
    const collection = session.selectedCollection;
    if (collection === null) return null;
    const selectedField = session.mapping[target];
    const selectedIndex =
      selectedField === null ? -1 : collection.sourceFields.indexOf(selectedField);
    const value = selectedIndex < 0 ? UNMAPPED_SELECT_VALUE : `field-${selectedIndex}`;
    const examples = selectedField ? session.getSourceExamples(selectedField) : [];

    return (
      <div
        className="grid grid-cols-[minmax(8rem,0.65fr)_minmax(12rem,1fr)_minmax(10rem,1.2fr)] items-center gap-3 py-2"
        data-demo-id="employee-mapping-row"
      >
        <Label className="text-sm">
          {t(EMPLOYEE_IMPORT_TARGET_DEFINITIONS[target].label as UiTextKey)}
        </Label>
        <Select
          onValueChange={(nextValue) => {
            const index = nextValue === UNMAPPED_SELECT_VALUE ? -1 : Number(nextValue.slice(6));
            session.setMapping(target, index < 0 ? null : (collection.sourceFields[index] ?? null));
          }}
          value={value}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder={t("Not mapped")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNMAPPED_SELECT_VALUE}>{t("Not mapped")}</SelectItem>
            {collection.sourceFields.map((sourceField, index) => (
              <SelectItem key={sourceField} value={`field-${index}`}>
                {sourceField}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div
          className="min-w-0 truncate text-xs text-muted-foreground"
          title={examples.join(" · ")}
        >
          {examples.length > 0 ? examples.join(" · ") : t("No mapped values")}
        </div>
      </div>
    );
  },
);

const TeamMappingSelect = observer(
  ({ session, target }: { session: ImportSessionStore; target: TeamImportTarget }) => {
    const t = useUiText();
    const collection = session.selectedCollection;
    if (!collection) return null;
    const selectedField = session.teamMapping[target];
    const selectedIndex = selectedField ? collection.sourceFields.indexOf(selectedField) : -1;
    const value = selectedIndex < 0 ? UNMAPPED_SELECT_VALUE : `field-${selectedIndex}`;
    const examples = selectedField ? session.getSourceExamples(selectedField) : [];
    return (
      <div
        className="grid grid-cols-[minmax(8rem,0.65fr)_minmax(12rem,1fr)_minmax(10rem,1.2fr)] items-center gap-3 py-2"
        data-demo-id="team-mapping-row"
      >
        <Label className="text-sm">
          {t(TEAM_IMPORT_TARGET_DEFINITIONS[target].label as UiTextKey)}
        </Label>
        <Select
          onValueChange={(nextValue) => {
            const index = nextValue === UNMAPPED_SELECT_VALUE ? -1 : Number(nextValue.slice(6));
            session.setTeamMapping(
              target,
              index < 0 ? null : (collection.sourceFields[index] ?? null),
            );
          }}
          value={value}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder={t("Not mapped")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNMAPPED_SELECT_VALUE}>{t("Not mapped")}</SelectItem>
            {collection.sourceFields.map((sourceField, index) => (
              <SelectItem key={sourceField} value={`field-${index}`}>
                {sourceField}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div
          className="min-w-0 truncate text-xs text-muted-foreground"
          title={examples.join(" · ")}
        >
          {examples.length > 0 ? examples.join(" · ") : t("No mapped values")}
        </div>
      </div>
    );
  },
);

export const ImportDialog = observer(
  ({
    existingEmployees,
    initialFile,
    onCommitEmployees,
    onCommitMapped,
    onCommitState,
    onOpenChange,
    onValidateMapped,
    onValidateState,
    open,
  }: ImportDialogProps) => {
    const t = useUiText();
    const countText = useCountText();
    const format = useAppFormatter();
    const messageText = useMessageText();
    const runtimeText = useRuntimeUiText();
    const [session] = useState(() => new ImportSessionStore(existingEmployees));
    const loadedInitialFileRef = useRef<File | null>(null);
    const [errorMessage, setErrorMessage] = useState<UiMessageDescriptor | null>(null);
    const [isReadingFile, setIsReadingFile] = useState(false);

    useEffect(() => {
      if (open) session.setExistingEmployees(existingEmployees);
    }, [existingEmployees, open, session]);

    useEffect(() => {
      if (open) return;
      session.reset();
      loadedInitialFileRef.current = null;
      setErrorMessage(null);
      setIsReadingFile(false);
    }, [open, session]);

    const handleOpenChange = (nextOpen: boolean) => {
      if (isReadingFile && !nextOpen) return;
      onOpenChange(nextOpen);
    };
    const handleFile = useCallback(
      async (file: File | undefined) => {
        if (!file) return;
        setErrorMessage(null);
        setIsReadingFile(true);
        try {
          await session.loadFile(file);
          if (session.stateCandidate && session.stateContent) {
            onValidateState(session.stateCandidate, session.stateContent, session.stateOperation);
          }
        } catch (error) {
          session.reset();
          session.setExistingEmployees(existingEmployees);
          setErrorMessage(describeError(error, "Could not read or parse the selected file."));
        } finally {
          setIsReadingFile(false);
        }
      },
      [existingEmployees, onValidateState, session],
    );

    useEffect(() => {
      if (!open || initialFile === null || loadedInitialFileRef.current === initialFile) return;
      loadedInitialFileRef.current = initialFile;
      void handleFile(initialFile);
    }, [handleFile, initialFile, open]);
    const commitEmployees = () => {
      setErrorMessage(null);
      try {
        session.commit(onCommitEmployees);
        onOpenChange(false);
      } catch (error) {
        setErrorMessage(describeError(error, "Could not import Employees."));
      }
    };
    const commitState = () => {
      const candidate = session.stateCandidate;
      const content = session.stateContent;
      if (!candidate || !content) return;
      setErrorMessage(null);
      try {
        onCommitState(candidate, content, session.stateOperation);
        onOpenChange(false);
      } catch (error) {
        setErrorMessage(describeError(error, "Could not import the selected state content."));
      }
    };

    const commitMapped = () => {
      setErrorMessage(null);
      try {
        session.commitGeneric((document) => {
          onValidateMapped(document);
          onCommitMapped(document);
        });
        onOpenChange(false);
      } catch (error) {
        setErrorMessage(describeError(error, "Could not import the mapped Teams and Employees."));
      }
    };

    const selectStateContent = (content: OrgToolsStateContent) => {
      const candidate = session.stateCandidate;
      if (!candidate) return;
      const operation: StateImportOperation = content === "workspace" ? "replace" : "append";
      setErrorMessage(null);
      try {
        onValidateState(candidate, content, operation);
        session.setStateContent(content);
      } catch (error) {
        setErrorMessage(describeError(error, "Could not validate the selected state content."));
      }
    };

    const selectStateOperation = (operation: StateImportOperation) => {
      const candidate = session.stateCandidate;
      const content = session.stateContent;
      if (!candidate || !content || content === "workspace") return;
      setErrorMessage(null);
      try {
        onValidateState(candidate, content, operation);
        session.setStateOperation(operation);
      } catch (error) {
        setErrorMessage(describeError(error, "Could not validate the import operation."));
      }
    };

    const plan = session.plan;
    const genericPlan = session.genericPlan;
    const genericPlanIssue = session.genericPlanIssue;
    const structuredPlan = session.structuredPlan;
    const hasSource = session.document !== null || session.stateCandidate !== null;

    return (
      <Dialog onOpenChange={handleOpenChange} open={open}>
        <DialogContent className="flex max-h-[92vh] max-w-6xl flex-col">
          <DialogHeader>
            <DialogTitle>{t("Import")}</DialogTitle>
            <DialogDescription>
              {t(
                "Import an Org Tools state or map ordinary JSON data. Files stay in this browser.",
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="min-h-0 flex-1 overflow-y-auto">
            <div className="grid gap-5">
              <div className="flex flex-wrap items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {session.fileName ?? t("Choose a JSON file")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {session.fileName
                      ? formatFileSize(session.fileSizeBytes, format.number)
                      : t("Files are processed locally in this browser.")}
                  </div>
                </div>
                <Label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent focus-within:ring-2 focus-within:ring-ring">
                  <HiOutlineArrowUpTray className="size-4" />
                  {hasSource ? t("Choose another file") : t("Choose file")}
                  <input
                    accept=".json,application/json"
                    className="sr-only"
                    disabled={isReadingFile}
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      event.currentTarget.value = "";
                      void handleFile(file);
                    }}
                    type="file"
                  />
                </Label>
              </div>

              {isReadingFile && (
                <div className="text-sm text-muted-foreground">
                  {t("Reading and inspecting the file…")}
                </div>
              )}
              {errorMessage && (
                <div className="flex gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <HiOutlineExclamationTriangle className="mt-0.5 size-4 shrink-0" />
                  <span>{messageText(errorMessage)}</span>
                </div>
              )}

              {session.stateCandidate && session.stateContent && (
                <div className="grid gap-3 py-2">
                  <div className="flex items-start gap-3">
                    <HiOutlineCheckCircle className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                    <div>
                      <h3 className="font-medium">{t("Workspace state detected")}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t(
                          "Choose which recognized content to import. Every operation is validated before the workspace changes.",
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("State content")}</Label>
                    <div
                      className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
                      role="radiogroup"
                      aria-label={t("State content")}
                    >
                      {session.availableStateContents.map((content) => (
                        <label
                          className={cn(
                            "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-accent/50",
                            session.stateContent === content &&
                              "border-primary/60 bg-primary/5 ring-2 ring-primary/15",
                          )}
                          key={content}
                        >
                          <input
                            checked={session.stateContent === content}
                            name="state-content"
                            onChange={() => selectStateContent(content)}
                            type="radio"
                          />
                          {t(STATE_CONTENT_LABELS[content])}
                        </label>
                      ))}
                    </div>
                  </div>
                  {session.stateContent !== "workspace" && (
                    <section className="mt-5 grid gap-3" data-demo-id="state-import-mode">
                      <div>
                        <h3 className="text-sm font-semibold">{t("Import mode")}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t(
                            "Choose how the selected content should affect the current workspace.",
                          )}
                        </p>
                      </div>
                      <div
                        className="grid gap-3 sm:grid-cols-2"
                        role="radiogroup"
                        aria-label={t("Import operation")}
                      >
                        <label
                          className={cn(
                            "flex min-h-24 cursor-pointer items-start gap-3 rounded-lg border bg-background p-3 text-sm transition-colors hover:bg-accent/50",
                            session.stateOperation === "append" &&
                              "border-primary/60 bg-primary/5 ring-2 ring-primary/20",
                          )}
                          data-demo-id="state-operation-append"
                        >
                          <input
                            checked={session.stateOperation === "append"}
                            className="mt-1"
                            name="state-operation"
                            onChange={() => selectStateOperation("append")}
                            type="radio"
                          />
                          <HiOutlinePlusCircle className="mt-0.5 size-5 shrink-0 text-primary" />
                          <span>
                            <span className="block font-semibold">{t("Append")}</span>
                            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                              {t("Keep current data and add the selected content to Main.")}
                            </span>
                          </span>
                        </label>
                        <label
                          className={cn(
                            "flex min-h-24 cursor-pointer items-start gap-3 rounded-lg border border-destructive/30 bg-background p-3 text-sm transition-colors hover:bg-destructive/5",
                            session.stateOperation === "replace" &&
                              "border-destructive bg-destructive/10 ring-2 ring-destructive/20",
                          )}
                          data-demo-id="state-operation-replace"
                        >
                          <input
                            checked={session.stateOperation === "replace"}
                            className="mt-1 accent-destructive"
                            name="state-operation"
                            onChange={() => selectStateOperation("replace")}
                            type="radio"
                          />
                          <HiOutlineExclamationTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
                          <span>
                            <span className="block font-semibold text-destructive">
                              {t("Replace all current")}
                            </span>
                            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                              {t(
                                "Remove current Employees, Teams, and custom Views before importing.",
                              )}
                            </span>
                          </span>
                        </label>
                      </div>
                    </section>
                  )}
                  {session.stateContent === "workspace" && (
                    <div className="text-sm font-medium text-destructive">
                      {t("Full workspace import replaces all current data and interface state.")}
                    </div>
                  )}
                </div>
              )}

              {session.stateCandidate && structuredPlan && (
                <StructuredImportPreview
                  append={session.stateOperation === "append"}
                  key={`state:${session.fileName}:${session.stateContent}`}
                  plan={structuredPlan}
                />
              )}

              {session.document && (
                <div className="grid gap-2" role="radiogroup" aria-label={t("Import as")}>
                  <Label>{t("Import as")}</Label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {(Object.keys(GENERIC_TARGET_LABELS) as GenericImportTarget[]).map((target) => (
                      <label
                        className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"
                        key={target}
                      >
                        <input
                          checked={session.genericTarget === target}
                          name="generic-target"
                          onChange={() => session.setGenericTarget(target)}
                          type="radio"
                        />
                        {t(GENERIC_TARGET_LABELS[target])}
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("Ordinary JSON imports always append manual Teams and Employees.")}
                  </p>
                </div>
              )}

              {session.document && session.selectedCollection && (
                <>
                  {session.document.collections.length > 1 && (
                    <div className="grid max-w-xl gap-2">
                      <Label>{t("JSON collection")}</Label>
                      <Select
                        onValueChange={session.selectCollection}
                        {...(session.selectedCollectionId
                          ? { value: session.selectedCollectionId }
                          : {})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("Select a collection")} />
                        </SelectTrigger>
                        <SelectContent>
                          {session.document.collections.map((collection) => (
                            <SelectItem key={collection.id} value={collection.id}>
                              {collection.id === "$" ? t("Root") : collection.id} (
                              {countText("rows", { count: collection.rows.length })})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <section>
                    <div className="mb-2">
                      <h3 className="text-sm font-semibold">{t("Field mapping")}</h3>
                      <p className="text-xs text-muted-foreground">
                        {t(
                          "Suggested matches can be changed. Unmapped source fields are discarded.",
                        )}
                      </p>
                    </div>
                    <div className="grid gap-1">
                      {session.genericTarget !== "employees" &&
                        TEAM_IMPORT_TARGETS.filter(
                          (target) =>
                            session.genericTarget === "teamsEmployees" ||
                            !["employeeKey", "employees", "isBoss", "position"].includes(target),
                        ).map((target) => (
                          <TeamMappingSelect key={target} session={session} target={target} />
                        ))}
                      {session.genericTarget !== "teams" &&
                        EMPLOYEE_IMPORT_TARGETS.map((target) => (
                          <MappingSelect key={target} session={session} target={target} />
                        ))}
                    </div>
                    {session.genericTarget !== "teams" && session.mapping.tags !== null && (
                      <div className="mt-3 grid max-w-sm gap-2">
                        <Label htmlFor="employee-import-tag-delimiter">{t("Tag delimiter")}</Label>
                        <Input
                          id="employee-import-tag-delimiter"
                          maxLength={8}
                          onChange={(event) => session.setTagDelimiter(event.currentTarget.value)}
                          value={session.tagDelimiter}
                        />
                        <div className="text-xs text-muted-foreground">
                          {t(
                            "JSON tag arrays do not use this delimiter. Leave it empty to keep a string as one tag.",
                          )}
                        </div>
                      </div>
                    )}
                  </section>

                  {plan && (
                    <section className="grid gap-2">
                      <div className="flex flex-wrap items-end justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold">{t("Normalized preview")}</h3>
                          <p className="text-xs text-muted-foreground">
                            {t(
                              "Employees are added without Unit assignments. Existing matches are not overwritten.",
                            )}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs tabular-nums text-muted-foreground">
                          <span>
                            {format.number(plan.newEmployeeCount)} {t("new")}
                          </span>
                          <span>
                            {format.number(plan.duplicateRowCount)} {t("existing")}
                          </span>
                          <span>
                            {format.number(plan.invalidRowCount)} {t("invalid")}
                          </span>
                          <span>
                            {format.number(plan.conflictRowCount)} {t("conflicts")}
                          </span>
                        </div>
                      </div>
                      {plan.configurationErrors.map((configurationError) => (
                        <div
                          className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-sm text-destructive"
                          key={configurationError}
                        >
                          {runtimeText(configurationError)}
                        </div>
                      ))}
                      <ImportPreview plan={plan} />
                    </section>
                  )}
                  {genericPlanIssue && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                      {messageText(genericPlanIssue)}
                    </div>
                  )}
                  {genericPlan && (
                    <StructuredImportPreview
                      key={`generic:${session.fileName}:${session.selectedCollectionId}:${session.genericTarget}:${JSON.stringify(session.mapping)}:${JSON.stringify(session.teamMapping)}:${session.tagDelimiter}`}
                      plan={genericPlan.preview}
                    />
                  )}
                </>
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              disabled={isReadingFile}
              onClick={() => handleOpenChange(false)}
              type="button"
              variant="outline"
            >
              {t("Cancel")}
            </Button>
            {plan && (
              <Button
                disabled={!plan.canCommit || plan.newEmployeeCount === 0 || isReadingFile}
                onClick={commitEmployees}
                type="button"
              >
                {countText("importEmployees", { count: plan.newEmployeeCount })}
              </Button>
            )}
            {session.document && session.genericTarget !== "employees" && (
              <Button
                disabled={!genericPlan || genericPlanIssue !== null || isReadingFile}
                onClick={commitMapped}
                type="button"
              >
                {t("Append")}
              </Button>
            )}
            {session.stateCandidate && session.stateContent && (
              <Button
                disabled={isReadingFile}
                onClick={commitState}
                type="button"
                variant={session.stateOperation === "replace" ? "destructive" : "default"}
              >
                {session.stateContent === "workspace" || session.stateOperation === "replace"
                  ? t("Replace all current")
                  : t("Append")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);
