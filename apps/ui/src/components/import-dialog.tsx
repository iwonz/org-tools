"use client";

import type { OrgToolsState } from "@org-tools/types";
import { useMemo, useState } from "react";
import {
  HiOutlineArrowPath,
  HiOutlineArrowRight,
  HiOutlineArrowUpTray,
  HiOutlineBuildingOffice2,
  HiOutlineCircleStack,
  HiOutlineExclamationTriangle,
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
  parseEmployeeImportFile,
} from "@/lib/employee-transfer";
import { parseStateImportFile, type StateImportCandidate } from "@/lib/state-transfer";

type ImportMode = "employees" | "state";

const ROW_HEIGHT = 58;
const REVIEW_HEIGHT = 290;
const OVERSCAN = 5;

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
  mapping,
  onChange,
  paths,
}: {
  mapping: EmployeeImportMapping;
  onChange: (field: EmployeeImportField, path: string | null) => void;
  paths: string[];
}) {
  const t = useUiText();
  return (
    <div className="grid gap-2" data-demo-id="employee-import-mapping">
      {EMPLOYEE_IMPORT_FIELDS.map((field) => {
        const required = field === "firstName" || field === "lastName" || field === "email";
        return (
          <div
            className="grid min-w-0 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(9rem,0.7fr)]"
            key={field}
          >
            <Select
              onValueChange={(value) => onChange(field, value === "__none__" ? null : value)}
              value={mapping[field] ?? "__none__"}
            >
              <SelectTrigger
                aria-label={t("Source JSON path for {field}", { field: t(FIELD_LABELS[field]) })}
                id={`employee-import-${field}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t("Do not import")}</SelectItem>
                {paths.map((path) => (
                  <SelectItem key={path} value={path}>
                    {path}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <HiOutlineArrowRight
              aria-hidden="true"
              className="mx-auto hidden size-4 text-muted-foreground sm:block"
            />
            <div className="min-w-0 rounded-md bg-muted/45 px-3 py-2 text-sm">
              {t(FIELD_LABELS[field])}
              {required ? " *" : ""}
            </div>
          </div>
        );
      })}
    </div>
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
  const [scrollTop, setScrollTop] = useState(0);
  const matches = useMemo(() => preview.rows.filter((row) => row.matched), [preview]);
  const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const last = Math.min(
    matches.length,
    Math.ceil((scrollTop + REVIEW_HEIGHT) / ROW_HEIGHT) + OVERSCAN,
  );
  return (
    <div
      className="relative overflow-auto rounded-md border border-border bg-background"
      data-demo-id="employee-import-match-review"
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      style={{ height: Math.min(REVIEW_HEIGHT, matches.length * ROW_HEIGHT || ROW_HEIGHT) }}
    >
      <div style={{ height: matches.length * ROW_HEIGHT, position: "relative" }}>
        {matches.slice(first, last).map((row, relativeIndex) => {
          const index = first + relativeIndex;
          const override = overrides.get(row.id);
          return (
            <div
              className="absolute flex w-full items-center gap-3 border-b border-border/60 px-3"
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
                onValueChange={(value) =>
                  onOverride(row.id, value === "__bulk__" ? null : (value as EmployeeImportPolicy))
                }
                value={override ?? "__bulk__"}
              >
                <SelectTrigger className="w-44" aria-label={t("Duplicate action")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__bulk__">{t("Use bulk action")}</SelectItem>
                  <SelectItem value="update">{t("Update data")}</SelectItem>
                  <SelectItem value="skip">{t("Skip")}</SelectItem>
                  {teamsMapped && <SelectItem value="teamsOnly">{t("Teams only")}</SelectItem>}
                </SelectContent>
              </Select>
              <span className="sr-only">{bulkPolicy}</span>
            </div>
          );
        })}
      </div>
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
        ),
      };
    } catch (previewError) {
      return { error: describeError(previewError), preview: null };
    }
  }, [currentState.organization.employees, employeeSource, mapping]);

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
                      mapping={mapping}
                      onChange={(field, path) => {
                        setMapping({ ...mapping, [field]: path });
                        setOverrides(new Map());
                        if (field === "teams" && !path && bulkPolicy === "teamsOnly") {
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
                    <div className="grid gap-2">
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
                            {mapping?.teams && (
                              <SelectItem value="teamsOnly">{t("Teams only")}</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
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
                        teamsMapped={Boolean(mapping?.teams)}
                      />
                    </div>
                  )}
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
