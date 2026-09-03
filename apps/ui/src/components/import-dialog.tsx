"use client";

import type { CustomEmployeeValueType, OrgToolsState } from "@org-tools/types";
import { useMemo, useState } from "react";
import {
  HiOutlineArrowPath,
  HiOutlineArrowRight,
  HiOutlineArrowUpTray,
  HiOutlineBuildingOffice2,
  HiOutlineCircleStack,
  HiOutlineExclamationTriangle,
  HiOutlinePlus,
  HiOutlineUsers,
} from "react-icons/hi2";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { describeError, type UiMessageDescriptor } from "@/i18n/messages";
import {
  type UiTextKey,
  useAppFormatter,
  useCountText,
  useMessageText,
  useUiText,
} from "@/i18n/use-ui-text";
import { createUuid } from "@/lib/employee-data";
import {
  applyEmployeeImport,
  createSuggestedEmployeeImportMapping,
  deriveEmployeeImportPreview,
  EMPLOYEE_IMPORT_FIELDS,
  type EmployeeImportField,
  type EmployeeImportMapping,
  type EmployeeImportPolicy,
  type EmployeeImportPreview,
  type EmployeeImportSource,
  type EmployeeImportTarget,
  employeeImportBuiltinTarget,
  employeeImportCustomTarget,
  employeeImportPendingTarget,
  isEmployeeImportTargetMapped,
  parseEmployeeImportFile,
  setEmployeeImportSourceTarget,
} from "@/lib/employee-transfer";
import { parseStateImportFile, type StateImportCandidate } from "@/lib/state-transfer";

type ImportMode = "employees" | "state";

const ROW_HEIGHT = 58;
const REVIEW_HEIGHT = 290;
const OVERSCAN = 5;
const MAPPING_ROW_HEIGHT = 52;
const MAPPING_HEIGHT = 360;

const formatFileSize = (
  size: number,
  formatNumber: ReturnType<typeof useAppFormatter>["number"],
) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${formatNumber(Math.ceil(size / 1024))} KiB`;
  return `${formatNumber(size / 1024 / 1024, { maximumFractionDigits: 1 })} MiB`;
};

const FIELD_LABELS: Record<EmployeeImportField, UiTextKey> = {
  avatarBase64Url: "Avatar",
  birthday: "Birthday",
  email: "Email",
  firstName: "First name",
  gender: "Gender",
  id: "UUID",
  lastName: "Last name",
  phone: "Phone",
  profileUrl: "Profile URL",
  tags: "Tags",
  teams: "Teams",
  username: "Username",
};

function FileControl({
  disabled,
  fileName,
  fileSize,
  reselect,
  onFile,
}: {
  disabled: boolean;
  fileName: string | null;
  fileSize: string | null;
  reselect?: boolean;
  onFile: (file: File) => void;
}) {
  const t = useUiText();
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-md bg-muted/35 p-3">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{fileName ?? t("Choose a JSON file")}</div>
        {fileSize && <div className="mt-0.5 text-xs text-muted-foreground">{fileSize}</div>}
      </div>
      <label className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-md bg-secondary/70 px-3 text-sm font-medium transition-colors hover:bg-accent focus-within:ring-2 focus-within:ring-ring/45">
        <HiOutlineArrowUpTray className="size-4" />
        {fileName || reselect ? t("Choose another file") : t("Choose file")}
        <input
          accept=".json,application/json"
          className="sr-only"
          disabled={disabled}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (file) onFile(file);
          }}
          type="file"
        />
      </label>
    </div>
  );
}

function ImportError({ error }: { error: UiMessageDescriptor | null }) {
  const messageText = useMessageText();
  if (!error) return null;
  return (
    <div
      className="flex gap-2 rounded-md bg-destructive/7 p-3 text-sm text-destructive"
      role="alert"
    >
      <HiOutlineExclamationTriangle className="mt-0.5 size-4 shrink-0" />
      <span>{messageText(error)}</span>
    </div>
  );
}

function MappingGrid({
  fieldDefinitions,
  mapping,
  onChange,
  paths,
}: {
  fieldDefinitions: OrgToolsState["organization"]["employeeFieldDefinitions"];
  mapping: EmployeeImportMapping;
  onChange: (mapping: EmployeeImportMapping) => void;
  paths: string[];
}) {
  const t = useUiText();
  const [scrollTop, setScrollTop] = useState(0);
  const [newFieldPath, setNewFieldPath] = useState<string | null>(null);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldType, setNewFieldType] = useState<CustomEmployeeValueType>("text");
  const [newFieldOptions, setNewFieldOptions] = useState("");
  const valueDefinitions = fieldDefinitions.filter((definition) => definition.kind === "value");
  const first = Math.max(0, Math.floor(scrollTop / MAPPING_ROW_HEIGHT) - OVERSCAN);
  const last = Math.min(
    paths.length,
    Math.ceil((scrollTop + MAPPING_HEIGHT) / MAPPING_ROW_HEIGHT) + OVERSCAN,
  );
  const resetNewField = () => {
    setNewFieldPath(null);
    setNewFieldName("");
    setNewFieldKey("");
    setNewFieldType("text");
    setNewFieldOptions("");
  };
  const selectTarget = (sourcePath: string, value: string) => {
    if (value === "__create__") {
      setNewFieldPath(sourcePath);
      return;
    }
    const currentTarget = mapping.sourceTargets[sourcePath];
    let nextMapping = mapping;
    if (value === "__none__") {
      nextMapping = setEmployeeImportSourceTarget(mapping, sourcePath, null);
      if (currentTarget?.startsWith("pending:")) {
        const fieldId = currentTarget.slice("pending:".length);
        nextMapping = {
          ...nextMapping,
          newValueFields: nextMapping.newValueFields.filter(
            (pending) => pending.definition.id !== fieldId,
          ),
        };
      }
    } else {
      nextMapping = setEmployeeImportSourceTarget(
        mapping,
        sourcePath,
        value as EmployeeImportTarget,
      );
    }
    onChange(nextMapping);
  };
  return (
    <div className="grid gap-2" data-demo-id="employee-import-mapping">
      <div
        className="relative overflow-y-auto overflow-x-hidden rounded-md bg-muted/15"
        data-demo-id="employee-import-mapping-paths"
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        style={{
          height: Math.min(
            MAPPING_HEIGHT,
            Math.max(MAPPING_ROW_HEIGHT, paths.length * MAPPING_ROW_HEIGHT),
          ),
        }}
      >
        <div className="relative" style={{ height: paths.length * MAPPING_ROW_HEIGHT }}>
          {paths.slice(first, last).map((path, visibleIndex) => {
            const rowIndex = first + visibleIndex;
            const target = mapping.sourceTargets[path] ?? null;
            return (
              <div
                className="absolute start-0 top-0 grid w-full min-w-0 items-center gap-2 px-1 sm:grid-cols-[minmax(0,1fr)_auto_minmax(9rem,0.8fr)]"
                data-source-path={path}
                key={path}
                style={{
                  height: MAPPING_ROW_HEIGHT,
                  transform: `translateY(${rowIndex * MAPPING_ROW_HEIGHT}px)`,
                }}
              >
                <div
                  className="min-w-0 truncate rounded-md bg-background px-3 py-2 text-sm"
                  title={path}
                >
                  {path}
                </div>
                <HiOutlineArrowRight
                  aria-hidden="true"
                  className="mx-auto hidden size-4 text-muted-foreground sm:block rtl:rotate-180"
                />
                <Select
                  onValueChange={(value) => selectTarget(path, value)}
                  value={target ?? "__none__"}
                >
                  <SelectTrigger aria-label={t("Org Tools field for {path}", { path })}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t("Do not import")}</SelectItem>
                    {EMPLOYEE_IMPORT_FIELDS.map((field) => {
                      const required = ["id", "firstName", "lastName", "email"].includes(field);
                      return (
                        <SelectItem key={field} value={employeeImportBuiltinTarget(field)}>
                          {t(FIELD_LABELS[field])}
                          {required ? " *" : ""}
                        </SelectItem>
                      );
                    })}
                    {valueDefinitions.map((definition) => (
                      <SelectItem
                        key={definition.id}
                        value={employeeImportCustomTarget(definition.id)}
                      >
                        {definition.name}
                        {definition.required ? " *" : ""}
                      </SelectItem>
                    ))}
                    {mapping.newValueFields.map((pending) => (
                      <SelectItem
                        key={pending.definition.id}
                        value={employeeImportPendingTarget(pending.definition.id)}
                      >
                        {pending.definition.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="__create__">{t("Create custom field")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
      </div>
      {newFieldPath ? (
        <div
          className="grid gap-2 rounded-md bg-muted/30 p-3"
          data-demo-id="employee-import-new-field"
        >
          <div className="truncate text-xs text-muted-foreground">{newFieldPath}</div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              aria-label={t("Name")}
              onChange={(event) => setNewFieldName(event.currentTarget.value)}
              placeholder={t("Name")}
              value={newFieldName}
            />
            <Input
              aria-label={t("Token key")}
              onChange={(event) => setNewFieldKey(event.currentTarget.value)}
              placeholder={t("Token key")}
              value={newFieldKey}
            />
          </div>
          <Select
            onValueChange={(value) => setNewFieldType(value as CustomEmployeeValueType)}
            value={newFieldType}
          >
            <SelectTrigger aria-label={t("Field type")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["text", "number", "boolean", "date", "option"] as const).map((type) => (
                <SelectItem key={type} value={type}>
                  {t(
                    type === "text"
                      ? "Text"
                      : type === "number"
                        ? "Number"
                        : type === "boolean"
                          ? "Flag"
                          : type === "date"
                            ? "Date"
                            : "Option",
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {newFieldType === "option" && (
            <Input
              aria-label={t("Comma-separated options")}
              onChange={(event) => setNewFieldOptions(event.currentTarget.value)}
              placeholder={t("Comma-separated options")}
              value={newFieldOptions}
            />
          )}
          <div className="flex justify-end gap-2">
            <Button onClick={resetNewField} size="sm" type="button" variant="ghost">
              {t("Cancel")}
            </Button>
            <Button
              disabled={
                !newFieldName.trim() ||
                !newFieldKey.trim() ||
                (newFieldType === "option" && !newFieldOptions.trim())
              }
              onClick={() => {
                const definition = {
                  id: createUuid(),
                  key: newFieldKey.trim(),
                  kind: "value" as const,
                  name: newFieldName.trim(),
                  options:
                    newFieldType === "option"
                      ? [...new Set(newFieldOptions.split(",").map((option) => option.trim()))]
                          .filter(Boolean)
                          .map((label) => ({ id: createUuid(), label }))
                      : [],
                  required: false,
                  valueType: newFieldType,
                };
                const nextMapping = {
                  ...mapping,
                  newValueFields: [...mapping.newValueFields, { definition, path: newFieldPath }],
                };
                onChange(
                  setEmployeeImportSourceTarget(
                    nextMapping,
                    newFieldPath,
                    employeeImportPendingTarget(definition.id),
                  ),
                );
                resetNewField();
              }}
              size="sm"
              type="button"
            >
              <HiOutlinePlus />
              {t("Add field")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ImportReviewColumn({
  onOverride,
  policyById,
  rows,
  teamsMapped,
  title,
}: {
  onOverride: (employeeId: string, policy: EmployeeImportPolicy) => void;
  policyById: ReadonlyMap<string, EmployeeImportPolicy>;
  rows: EmployeeImportPreview["rows"];
  teamsMapped: boolean;
  title: string;
}) {
  const t = useUiText();
  const [scrollTop, setScrollTop] = useState(0);
  const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const last = Math.min(
    rows.length,
    Math.ceil((scrollTop + REVIEW_HEIGHT) / ROW_HEIGHT) + OVERSCAN,
  );
  return (
    <section className="grid min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-2">
      <h3 className="text-sm font-medium">
        {title} · {rows.length}
      </h3>
      <div
        className="relative overflow-auto rounded-md border border-border bg-background"
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        style={{ height: REVIEW_HEIGHT }}
      >
        {rows.length === 0 ? (
          <div className="grid h-full place-items-center text-xs text-muted-foreground">
            {t("No Employees found")}
          </div>
        ) : (
          <div style={{ height: rows.length * ROW_HEIGHT, position: "relative" }}>
            {rows.slice(first, last).map((row, relativeIndex) => {
              const index = first + relativeIndex;
              return (
                <div
                  className="absolute flex w-full items-center gap-2 px-3"
                  key={row.id}
                  style={{ height: ROW_HEIGHT, transform: `translateY(${index * ROW_HEIGHT}px)` }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {[row.fields.firstName, row.fields.lastName].filter(Boolean).join(" ") ||
                        row.fields.email}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{row.fields.email}</div>
                  </div>
                  <Select
                    onValueChange={(value) => onOverride(row.id, value as EmployeeImportPolicy)}
                    value={policyById.get(row.id) ?? (row.matched ? "update" : "add")}
                  >
                    <SelectTrigger className="w-28" aria-label={t("Import action")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {row.matched ? (
                        <>
                          <SelectItem value="update">{t("Update data")}</SelectItem>
                          {teamsMapped && (
                            <SelectItem value="teamsOnly">{t("Teams only")}</SelectItem>
                          )}
                        </>
                      ) : (
                        <SelectItem value="add">{t("Add")}</SelectItem>
                      )}
                      <SelectItem value="skip">{t("Skip")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function MatchReview({
  bulkPolicy,
  onOverride,
  overrides,
  preview,
  teamsMapped,
}: {
  bulkPolicy: EmployeeImportPolicy;
  onOverride: (employeeId: string, policy: EmployeeImportPolicy | null) => void;
  overrides: ReadonlyMap<string, EmployeeImportPolicy>;
  preview: EmployeeImportPreview;
  teamsMapped: boolean;
}) {
  const t = useUiText();
  const { added, duplicates, policyById, skipped } = useMemo(() => {
    const nextAdded: EmployeeImportPreview["rows"] = [];
    const nextDuplicates: EmployeeImportPreview["rows"] = [];
    const nextSkipped: EmployeeImportPreview["rows"] = [];
    const nextPolicyById = new Map<string, EmployeeImportPolicy>();
    for (const row of preview.rows) {
      const rowPolicy = overrides.get(row.id) ?? (row.matched ? bulkPolicy : "add");
      nextPolicyById.set(row.id, rowPolicy);
      if (rowPolicy === "skip") nextSkipped.push(row);
      else if (row.matched) nextDuplicates.push(row);
      else nextAdded.push(row);
    }
    return {
      added: nextAdded,
      duplicates: nextDuplicates,
      policyById: nextPolicyById,
      skipped: nextSkipped,
    };
  }, [bulkPolicy, overrides, preview.rows]);
  return (
    <div
      className="grid min-w-0 gap-3 lg:grid-cols-3"
      data-demo-id="employee-import-review-columns"
    >
      <ImportReviewColumn
        onOverride={(id, value) => onOverride(id, value)}
        policyById={policyById}
        rows={added}
        teamsMapped={teamsMapped}
        title={t("Will be added")}
      />
      <ImportReviewColumn
        onOverride={(id, value) => onOverride(id, value)}
        policyById={policyById}
        rows={duplicates}
        teamsMapped={teamsMapped}
        title={t("Duplicates")}
      />
      <ImportReviewColumn
        onOverride={(id, value) => onOverride(id, value)}
        policyById={policyById}
        rows={skipped}
        teamsMapped={teamsMapped}
        title={t("Will not be added")}
      />
    </div>
  );
}

export function ImportDialog({
  currentState,
  onCommit,
  onOpenChange,
  open,
}: {
  currentState: OrgToolsState;
  onCommit: (state: OrgToolsState, fileName: string, fileSizeBytes: number) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const t = useUiText();
  const countText = useCountText();
  const format = useAppFormatter();
  const [mode, setMode] = useState<ImportMode>("state");
  const [stateCandidate, setStateCandidate] = useState<StateImportCandidate | null>(null);
  const [employeeSource, setEmployeeSource] = useState<EmployeeImportSource | null>(null);
  const [mapping, setMapping] = useState<EmployeeImportMapping | null>(null);
  const [bulkPolicy, setBulkPolicy] = useState<EmployeeImportPolicy>("update");
  const [overrides, setOverrides] = useState<Map<string, EmployeeImportPolicy>>(new Map());
  const [error, setError] = useState<UiMessageDescriptor | null>(null);
  const [isReading, setIsReading] = useState(false);

  const previewResult = useMemo(() => {
    if (!employeeSource || !mapping) return { error: null, preview: null };
    try {
      return {
        error: null,
        preview: deriveEmployeeImportPreview(
          employeeSource,
          mapping,
          currentState.organization.employees,
          currentState.organization.employeeFieldDefinitions,
        ),
      };
    } catch (previewError) {
      return { error: describeError(previewError), preview: null };
    }
  }, [
    currentState.organization.employeeFieldDefinitions,
    currentState.organization.employees,
    employeeSource,
    mapping,
  ]);

  const reset = () => {
    setMode("state");
    setStateCandidate(null);
    setEmployeeSource(null);
    setMapping(null);
    setBulkPolicy("update");
    setOverrides(new Map());
    setError(null);
    setIsReading(false);
  };

  const readState = async (file: File) => {
    setIsReading(true);
    setError(null);
    setStateCandidate(null);
    try {
      setStateCandidate(await parseStateImportFile(file));
    } catch (readError) {
      setError(describeError(readError));
    } finally {
      setIsReading(false);
    }
  };

  const readEmployees = async (file: File) => {
    setIsReading(true);
    setError(null);
    setEmployeeSource(null);
    setMapping(null);
    setOverrides(new Map());
    try {
      const source = await parseEmployeeImportFile(file);
      setEmployeeSource(source);
      setMapping(createSuggestedEmployeeImportMapping(source.paths));
    } catch (readError) {
      setError(describeError(readError));
    } finally {
      setIsReading(false);
    }
  };

  const commitEmployees = () => {
    if (!employeeSource || !previewResult.preview) return;
    try {
      const state = applyEmployeeImport({
        bulkPolicy,
        currentState,
        overrides,
        preview: previewResult.preview,
      });
      onCommit(state, employeeSource.fileName, employeeSource.fileSizeBytes);
      onOpenChange(false);
    } catch (commitError) {
      setError(describeError(commitError));
    }
  };

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        if (isReading) return;
        if (!nextOpen) reset();
        onOpenChange(nextOpen);
      }}
      open={open}
    >
      <DialogContent className="max-h-[92dvh] max-w-6xl" data-demo-id="import-dialog">
        <DialogHeader>
          <DialogTitle>{t("Import")}</DialogTitle>
          <DialogDescription>
            {t("Import a complete state or a mapped Employee list.")}
          </DialogDescription>
        </DialogHeader>
        <Tabs
          onValueChange={(value) => {
            setMode(value as ImportMode);
            setError(null);
          }}
          value={mode}
        >
          <TabsList className="grid w-full grid-cols-2" data-demo-id="import-mode-tabs">
            <TabsTrigger value="state">
              <HiOutlineCircleStack />
              {t("All state")}
            </TabsTrigger>
            <TabsTrigger value="employees">
              <HiOutlineUsers />
              {t("Employees")}
            </TabsTrigger>
          </TabsList>
          <DialogBody className="min-h-0 overflow-y-auto px-0">
            <TabsContent className="grid gap-4 px-6 py-4" value="state">
              <FileControl
                disabled={isReading}
                fileName={stateCandidate?.fileName ?? null}
                fileSize={
                  stateCandidate
                    ? formatFileSize(stateCandidate.fileSizeBytes, format.number)
                    : null
                }
                onFile={(file) => void readState(file)}
                reselect={Boolean(error)}
              />
              {stateCandidate && (
                <div className="grid grid-cols-2 gap-2" data-demo-id="state-import-summary">
                  <div className="rounded-md bg-muted/45 p-3">
                    <HiOutlineUsers className="mb-2 size-4" />
                    {countText("employees", { count: stateCandidate.employeeCount })}
                  </div>
                  <div className="rounded-md bg-muted/45 p-3">
                    <HiOutlineBuildingOffice2 className="mb-2 size-4" />
                    {countText("units", { count: stateCandidate.unitCount })}
                  </div>
                </div>
              )}
              <ImportError error={error} />
            </TabsContent>
            <TabsContent className="grid gap-4 px-6 py-4" value="employees">
              <FileControl
                disabled={isReading}
                fileName={employeeSource?.fileName ?? null}
                fileSize={
                  employeeSource
                    ? formatFileSize(employeeSource.fileSizeBytes, format.number)
                    : null
                }
                onFile={(file) => void readEmployees(file)}
                reselect={Boolean(error)}
              />
              {mapping && employeeSource && (
                <div className="grid min-w-0 gap-4 lg:grid-cols-2">
                  <section
                    className="grid min-w-0 content-start gap-2"
                    data-demo-id="employee-import-source-preview"
                  >
                    <div>
                      <Label>{t("Representative JSON record")}</Label>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("Record {number} of {total} has the most mappable fields.", {
                          number: employeeSource.representativeRowIndex + 1,
                          total: employeeSource.rows.length,
                        })}
                      </p>
                    </div>
                    <div className="max-h-80 overflow-auto rounded-md border border-border bg-muted/25 p-3">
                      <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed">
                        {employeeSource.representativeJson}
                      </pre>
                    </div>
                    {employeeSource.representativeTruncated && (
                      <p className="text-xs text-muted-foreground">
                        {t("Preview truncated at 128 KiB")}
                      </p>
                    )}
                  </section>
                  <section className="grid min-w-0 content-start gap-2">
                    <div className="hidden grid-cols-[minmax(0,1fr)_minmax(9rem,0.7fr)] gap-8 px-1 text-xs font-medium text-muted-foreground sm:grid">
                      <span>{t("Source JSON path")}</span>
                      <span>{t("Org Tools field")}</span>
                    </div>
                    <MappingGrid
                      fieldDefinitions={currentState.organization.employeeFieldDefinitions}
                      mapping={mapping}
                      onChange={(nextMapping) => {
                        setMapping(nextMapping);
                        setOverrides(new Map());
                        if (
                          !isEmployeeImportTargetMapped(
                            nextMapping,
                            employeeImportBuiltinTarget("teams"),
                          ) &&
                          bulkPolicy === "teamsOnly"
                        ) {
                          setBulkPolicy("update");
                        }
                      }}
                      paths={employeeSource.paths}
                    />
                  </section>
                </div>
              )}
              <ImportError error={error ?? previewResult.error} />
              {previewResult.preview && (
                <>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="rounded-md bg-muted/45 px-3 py-2">
                      {countText("employees", { count: previewResult.preview.rows.length })}
                    </span>
                    <span className="rounded-md bg-muted/45 px-3 py-2">
                      {t("{count} new", { count: previewResult.preview.newCount })}
                    </span>
                    <span className="rounded-md bg-muted/45 px-3 py-2">
                      {t("{count} existing", { count: previewResult.preview.matchedCount })}
                    </span>
                  </div>
                  {previewResult.preview.matchedCount > 0 && (
                    <div className="flex items-center justify-between gap-3">
                      <Label>{t("Existing Employees")}</Label>
                      <Select
                        onValueChange={(value) => setBulkPolicy(value as EmployeeImportPolicy)}
                        value={bulkPolicy}
                      >
                        <SelectTrigger className="w-48" aria-label={t("Bulk duplicate action")}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="update">{t("Update data")}</SelectItem>
                          <SelectItem value="skip">{t("Skip")}</SelectItem>
                          {mapping &&
                            isEmployeeImportTargetMapped(
                              mapping,
                              employeeImportBuiltinTarget("teams"),
                            ) && <SelectItem value="teamsOnly">{t("Teams only")}</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <MatchReview
                    bulkPolicy={bulkPolicy}
                    onOverride={(employeeId, policy) => {
                      const next = new Map(overrides);
                      if (policy) next.set(employeeId, policy);
                      else next.delete(employeeId);
                      setOverrides(next);
                    }}
                    overrides={overrides}
                    preview={previewResult.preview}
                    teamsMapped={
                      mapping
                        ? isEmployeeImportTargetMapped(
                            mapping,
                            employeeImportBuiltinTarget("teams"),
                          )
                        : false
                    }
                  />
                </>
              )}
            </TabsContent>
          </DialogBody>
        </Tabs>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
            {t("Cancel")}
          </Button>
          {mode === "state" ? (
            <Button
              disabled={!stateCandidate || isReading}
              onClick={() => {
                if (!stateCandidate) return;
                onCommit(
                  stateCandidate.state,
                  stateCandidate.fileName,
                  stateCandidate.fileSizeBytes,
                );
                onOpenChange(false);
              }}
              type="button"
              variant="destructive"
            >
              <HiOutlineArrowPath />
              {t("Replace state")}
            </Button>
          ) : (
            <Button
              disabled={!previewResult.preview || isReading}
              onClick={commitEmployees}
              type="button"
            >
              <HiOutlineArrowUpTray />
              {t("Import Employees")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
