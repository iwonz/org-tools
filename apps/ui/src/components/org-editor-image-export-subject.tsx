"use client";

import type {
  EditorImageExportProjectionResponse,
  EditorImageExportSubjectSummary,
  EditorImageExportSubjectsResponse,
  OrgEditorUnitId,
} from "@org-tools/types";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef, useState } from "react";
import { HiOutlineCheck, HiOutlineChevronDown, HiOutlineMagnifyingGlass } from "react-icons/hi2";

import { useAuth } from "@/components/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAccess } from "@/components/use-access";
import { useUiText } from "@/i18n/use-ui-text";
import {
  createOrgEditorImageExportSourceFromProjection,
  type OrgEditorImageExportSource,
} from "@/lib/org-editor-image-export-source";
import { normalizeSearchValue } from "@/lib/search-index";

const SELF_SUBJECT = "self";
const SUBJECT_ROW_HEIGHT = 52;
const projectionCache = new Map<string, EditorImageExportProjectionResponse>();
const PROJECTION_CACHE_LIMIT = 16;

const cacheProjection = (key: string, value: EditorImageExportProjectionResponse) => {
  projectionCache.delete(key);
  projectionCache.set(key, value);
  while (projectionCache.size > PROJECTION_CACHE_LIMIT) {
    const oldest = projectionCache.keys().next().value;
    if (typeof oldest !== "string") break;
    projectionCache.delete(oldest);
  }
};

const subjectSearchText = (subject: EditorImageExportSubjectSummary) =>
  normalizeSearchValue(`${subject.displayName} ${subject.email} ${subject.roleName}`);

export type OrgEditorImageExportSubjectState = {
  canSelectSubject: boolean;
  error: "failed" | "unavailable" | null;
  loading: boolean;
  selectedAccountId: string;
  setSelectedAccountId: (value: string) => void;
  source: OrgEditorImageExportSource | null;
  subjects: EditorImageExportSubjectSummary[];
  subjectsError: boolean;
  subjectsLoading: boolean;
};

export const useOrgEditorImageExportSubject = ({
  currentSource,
  open,
  rootUnitId,
}: {
  currentSource: OrgEditorImageExportSource;
  open: boolean;
  rootUnitId?: OrgEditorUnitId;
}): OrgEditorImageExportSubjectState => {
  const auth = useAuth();
  const { can } = useAccess();
  const canSelectSubject = can("editorImageExport.exportAs");
  const [subjects, setSubjects] = useState<EditorImageExportSubjectSummary[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(SELF_SUBJECT);
  const [response, setResponse] = useState<EditorImageExportProjectionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<"failed" | "unavailable" | null>(null);
  const [selectionReady, setSelectionReady] = useState(false);
  const previousOpenRef = useRef(false);
  const loadedSubjectsKeyRef = useRef<string | null>(null);
  const loadingSubjectsKeyRef = useRef<string | null>(null);
  const subjectsControllerRef = useRef<AbortController | null>(null);
  const bootstrap = auth.bootstrap;
  const actorAccountId = bootstrap?.account.id ?? null;
  const csrfToken = bootstrap?.csrfToken ?? null;
  const organizationRevision = bootstrap?.organizationRevision ?? null;
  const securityRevision = bootstrap?.securityRevision ?? null;

  useEffect(() => {
    if (open && !previousOpenRef.current) {
      setSelectedAccountId(SELF_SUBJECT);
      setResponse(null);
      setLoading(false);
      setError(null);
      setSelectionReady(true);
    } else if (!open && previousOpenRef.current) {
      setSelectionReady(false);
    }
    previousOpenRef.current = open;
  }, [open]);

  useEffect(() => {
    if (!open || !canSelectSubject || !actorAccountId) return;
    const subjectsKey = `${actorAccountId}\0${securityRevision ?? 0}`;
    if (
      loadedSubjectsKeyRef.current === subjectsKey ||
      loadingSubjectsKeyRef.current === subjectsKey
    ) {
      return;
    }
    subjectsControllerRef.current?.abort();
    const controller = new AbortController();
    subjectsControllerRef.current = controller;
    loadingSubjectsKeyRef.current = subjectsKey;
    setSubjectsLoading(true);
    setSubjectsError(false);
    void fetch(`/api/editor-image-export/subjects?securityRevision=${securityRevision ?? 0}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (result) => {
        if (!result.ok) throw new Error("subjects_unavailable");
        return (await result.json()) as EditorImageExportSubjectsResponse;
      })
      .then((result) => {
        if (controller.signal.aborted) return;
        loadedSubjectsKeyRef.current = subjectsKey;
        setSubjects(result.subjects.filter((subject) => subject.accountId !== actorAccountId));
      })
      .catch(() => {
        if (!controller.signal.aborted) setSubjectsError(true);
      })
      .finally(() => {
        if (subjectsControllerRef.current !== controller) return;
        subjectsControllerRef.current = null;
        loadingSubjectsKeyRef.current = null;
        if (!controller.signal.aborted) setSubjectsLoading(false);
      });
  }, [actorAccountId, canSelectSubject, open, securityRevision]);

  useEffect(() => {
    if (!open || !selectionReady || selectedAccountId === SELF_SUBJECT) {
      setResponse(null);
      setLoading(false);
      setError(null);
      return;
    }
    if (
      !actorAccountId ||
      !csrfToken ||
      organizationRevision === null ||
      securityRevision === null ||
      !canSelectSubject
    ) {
      setResponse(null);
      setLoading(false);
      setError("unavailable");
      return;
    }
    const key = [
      selectedAccountId,
      currentSource.viewId,
      rootUnitId ?? "view",
      organizationRevision,
      securityRevision,
    ].join("\0");
    const cached = projectionCache.get(key);
    if (cached) {
      setResponse(cached);
      setLoading(false);
      setError(cached.available ? null : "unavailable");
      return;
    }
    const controller = new AbortController();
    setResponse(null);
    setLoading(true);
    setError(null);
    void fetch("/api/editor-image-export/projection", {
      body: JSON.stringify({
        accountId: selectedAccountId,
        ...(rootUnitId ? { rootUnitId } : {}),
        viewId: currentSource.viewId,
      }),
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "X-Org-Tools-CSRF": csrfToken,
      },
      method: "POST",
      signal: controller.signal,
    })
      .then(async (result) => {
        if (!result.ok) {
          const failure = new Error(result.status === 404 ? "resource_unavailable" : "failed");
          throw failure;
        }
        return (await result.json()) as EditorImageExportProjectionResponse;
      })
      .then((result) => {
        if (controller.signal.aborted) return;
        cacheProjection(key, result);
        setResponse(result);
        setError(result.available ? null : "unavailable");
      })
      .catch((requestError) => {
        if (controller.signal.aborted) return;
        setError(
          requestError instanceof Error && requestError.message === "resource_unavailable"
            ? "unavailable"
            : "failed",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [
    actorAccountId,
    canSelectSubject,
    csrfToken,
    currentSource.viewId,
    open,
    organizationRevision,
    rootUnitId,
    securityRevision,
    selectionReady,
    selectedAccountId,
  ]);

  const alternateSource = useMemo(
    () =>
      response?.available
        ? createOrgEditorImageExportSourceFromProjection({
            distributionEnabledUnitIds: currentSource.distributionEnabledUnitIds,
            projection: response.projection,
            viewId: currentSource.viewId,
          })
        : null,
    [currentSource.distributionEnabledUnitIds, currentSource.viewId, response],
  );
  const source = selectedAccountId === SELF_SUBJECT ? currentSource : alternateSource;
  return {
    canSelectSubject,
    error: selectedAccountId === SELF_SUBJECT ? null : error,
    loading: selectedAccountId === SELF_SUBJECT ? false : loading,
    selectedAccountId,
    setSelectedAccountId,
    source,
    subjects,
    subjectsError,
    subjectsLoading,
  };
};

export function OrgEditorImageExportSubjectSelect({
  state,
}: {
  state: OrgEditorImageExportSubjectState;
}) {
  const t = useUiText();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const selectedSubject = state.subjects.find(
    (subject) => subject.accountId === state.selectedAccountId,
  );
  const normalizedQuery = normalizeSearchValue(query.trim());
  const visibleSubjects = useMemo(
    () =>
      normalizedQuery
        ? state.subjects.filter((subject) => subjectSearchText(subject).includes(normalizedQuery))
        : state.subjects,
    [normalizedQuery, state.subjects],
  );
  const options = useMemo(
    () => [
      { accountId: SELF_SUBJECT, displayName: t("My access"), email: "", roleName: "" },
      ...visibleSubjects,
    ],
    [t, visibleSubjects],
  );
  const virtualizer = useVirtualizer({
    count: options.length,
    enabled: open,
    estimateSize: () => SUBJECT_ROW_HEIGHT,
    getScrollElement: () => scrollRef.current,
    getItemKey: (index) => options[index]?.accountId ?? index,
    initialRect: { height: 260, width: 384 },
    overscan: 6,
  });

  if (!state.canSelectSubject) return null;
  return (
    <div className="grid gap-2" data-demo-id="org-editor-image-export-subject">
      <Label>{t("Export as")}</Label>
      <Popover
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) setQuery("");
        }}
        open={open}
      >
        <PopoverTrigger asChild>
          <Button
            aria-expanded={open}
            className="w-full justify-between font-normal"
            data-demo-id="org-editor-image-export-subject-trigger"
            role="combobox"
            type="button"
            variant="outline"
          >
            <span className="min-w-0 truncate text-start">
              {selectedSubject
                ? `${selectedSubject.displayName} · ${selectedSubject.roleName}`
                : t("My access")}
            </span>
            <HiOutlineChevronDown className="shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-96 max-w-[calc(100vw-32px)] p-2">
          <div className="relative">
            <HiOutlineMagnifyingGlass className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label={t("Search accounts")}
              className="h-8 ps-8"
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder={t("Search accounts")}
              type="search"
              value={query}
            />
          </div>
          <div
            className="mt-2 h-64 overflow-auto overscroll-contain"
            data-demo-id="org-editor-image-export-subject-options"
            ref={scrollRef}
            role="listbox"
          >
            {state.subjectsLoading ? (
              <div className="grid h-full place-items-center text-xs text-muted-foreground">
                {t("Loading accounts...")}
              </div>
            ) : state.subjectsError ? (
              <div className="grid h-full place-items-center text-xs text-destructive">
                {t("Could not load accounts.")}
              </div>
            ) : options.length === 1 && normalizedQuery ? (
              <div className="grid h-full place-items-center text-xs text-muted-foreground">
                {t("No matching accounts.")}
              </div>
            ) : (
              <div className="relative" style={{ height: virtualizer.getTotalSize() }}>
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const option = options[virtualRow.index];
                  if (!option) return null;
                  const selected = state.selectedAccountId === option.accountId;
                  return (
                    <button
                      aria-selected={selected}
                      className="absolute start-0 top-0 flex w-full items-center gap-2 rounded-md px-2 text-start text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      key={option.accountId}
                      onClick={() => {
                        state.setSelectedAccountId(option.accountId);
                        setOpen(false);
                      }}
                      role="option"
                      style={{
                        height: virtualRow.size,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      type="button"
                    >
                      <HiOutlineCheck
                        className={selected ? "shrink-0 opacity-100" : "shrink-0 opacity-0"}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{option.displayName}</span>
                        {option.email && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {option.email} · {option.roleName}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
